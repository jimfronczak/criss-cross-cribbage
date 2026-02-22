/**
 * Game rules and state transitions for Criss Cross Cribbage (Phase 3).
 * All functions are pure: they take state and return new state (immutable).
 *
 * Teams: Player 0 (you) & 2 (AI partner) = Team A → score columns
 *        Player 1 & 3 (AI opponents)     = Team B → score rows
 *
 * Round flow:
 *   dealRound → 'discard' phase (each player discards 1 to crib)
 *             → 'place' phase  (each player places 6 cards on board)
 *             → 'score' phase  (columns, rows, crib scored; peg difference)
 *             → startNewRound or gameOver
 */

import { createDeck, shuffle, createEmptyBoard } from './state.js';
import { scoreHand } from './score.js';

/* ------------------------------------------------------------------ */
/*  Team helpers                                                       */
/* ------------------------------------------------------------------ */

export const TEAM_A_PLAYERS = [0, 2];
export const TEAM_B_PLAYERS = [1, 3];
const WIN_TARGET = 31;

export function getTeam(playerIndex) {
  return TEAM_A_PLAYERS.includes(playerIndex) ? 'A' : 'B';
}

/** Score-array index for a team: A → 0, B → 1. */
function teamScoreIdx(team) {
  return team === 'A' ? 0 : 1;
}

/* ------------------------------------------------------------------ */
/*  Deal                                                               */
/* ------------------------------------------------------------------ */

/**
 * Deal a new round.
 *  - Shuffles deck, deals 7 cards to each of 4 players (28 cards).
 *  - Next card is the cut card, placed at center (2,2).
 *  - His Heels: if cut is a Jack, dealer's team pegs 2 immediately.
 *  - Phase starts as 'discard'; first player is left of dealer.
 *
 * @param {number} dealerIndex 0–3
 * @param {[number,number]} scores carried-over team scores
 * @returns {import('./state.js').GameState & { hisHeels: boolean }}
 */
export function dealRound(dealerIndex, scores = [0, 0]) {
  const deck = shuffle(createDeck());

  const hands = [
    deck.slice(0, 7),
    deck.slice(7, 14),
    deck.slice(14, 21),
    deck.slice(21, 28),
  ];

  const cutCard = deck[28];

  const board = createEmptyBoard();
  board[2][2] = cutCard;

  const newScores = [...scores];
  let hisHeels = false;

  if (cutCard.rank === 11) {
    newScores[teamScoreIdx(getTeam(dealerIndex))] += 2;
    hisHeels = true;
  }

  return {
    board,
    cutCard,
    hands,
    crib: [],
    dealerIndex,
    currentPlayerIndex: (dealerIndex + 1) % 4,
    scores: newScores,
    phase: 'discard',
    hisHeels,
  };
}

/* ------------------------------------------------------------------ */
/*  Legal moves                                                        */
/* ------------------------------------------------------------------ */

/**
 * All empty cells on the board (center is already filled by the cut card).
 * @param {import('./state.js').GameState} state
 * @returns {{ row: number, col: number }[]}
 */
export function getLegalPlacements(state) {
  const cells = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (state.board[row][col] === null) cells.push({ row, col });
    }
  }
  return cells;
}

/**
 * Indices of cards in the current player's hand that can be discarded.
 * (Any card is eligible.)
 * @param {import('./state.js').GameState} state
 * @returns {number[]}
 */
export function getLegalDiscards(state) {
  return state.hands[state.currentPlayerIndex].map((_, i) => i);
}

/* ------------------------------------------------------------------ */
/*  Discard to crib                                                    */
/* ------------------------------------------------------------------ */

/**
 * Current player discards one card to the crib.
 * After all 4 players discard, phase switches to 'place'.
 *
 * @param {import('./state.js').GameState} state
 * @param {number} cardIndex index in current player's hand
 * @returns {import('./state.js').GameState}
 */
export function discardToCrib(state, cardIndex) {
  if (state.phase !== 'discard') {
    throw new Error('Not in discard phase');
  }

  const playerIdx = state.currentPlayerIndex;
  const hand = [...state.hands[playerIdx]];
  const [discarded] = hand.splice(cardIndex, 1);

  const newHands = state.hands.map((h, i) =>
    i === playerIdx ? hand : [...h],
  );
  const newCrib = [...state.crib, discarded];

  if (newCrib.length >= 4) {
    return {
      ...state,
      hands: newHands,
      crib: newCrib,
      phase: 'place',
      currentPlayerIndex: (state.dealerIndex + 1) % 4,
    };
  }

  return {
    ...state,
    hands: newHands,
    crib: newCrib,
    currentPlayerIndex: (playerIdx + 1) % 4,
  };
}

/* ------------------------------------------------------------------ */
/*  Place card                                                         */
/* ------------------------------------------------------------------ */

/**
 * Current player places a card from their hand onto an empty board cell.
 * When the board is full (24 placements + cut), phase becomes 'score'.
 *
 * @param {import('./state.js').GameState} state
 * @param {number} cardIndex index in current player's hand
 * @param {number} row 0–4
 * @param {number} col 0–4
 * @returns {import('./state.js').GameState}
 */
export function placeCard(state, cardIndex, row, col) {
  if (state.phase !== 'place') {
    throw new Error('Not in place phase');
  }
  if (state.board[row][col] !== null) {
    throw new Error('Cell is occupied');
  }

  const playerIdx = state.currentPlayerIndex;
  const hand = [...state.hands[playerIdx]];
  const [card] = hand.splice(cardIndex, 1);

  const newBoard = state.board.map((r) => [...r]);
  newBoard[row][col] = card;

  const newHands = state.hands.map((h, i) =>
    i === playerIdx ? hand : [...h],
  );

  const boardFull = newBoard.every((r) => r.every((c) => c !== null));

  if (boardFull) {
    return {
      ...state,
      board: newBoard,
      hands: newHands,
      phase: 'score',
    };
  }

  return {
    ...state,
    board: newBoard,
    hands: newHands,
    currentPlayerIndex: (playerIdx + 1) % 4,
  };
}

/* ------------------------------------------------------------------ */
/*  End-of-round scoring                                               */
/* ------------------------------------------------------------------ */

/**
 * Score a completed round.
 *  - 5 column hands → Team A
 *  - 5 row hands    → Team B
 *  - Crib (4 discards + cut) → dealer's team
 *  - Winning team pegs the difference.
 *
 * @param {import('./state.js').GameState} state  (must be in 'score' phase)
 * @returns {{
 *   columnScores: number[],
 *   rowScores: number[],
 *   cribScore: number,
 *   teamATotal: number,
 *   teamBTotal: number,
 *   dealerTeam: 'A'|'B',
 *   pegTeam: 'A'|'B'|null,
 *   pegAmount: number,
 *   newScores: [number,number],
 * }}
 */
export function scoreRound(state) {
  const { board, cutCard, crib, dealerIndex, scores } = state;

  const columnScores = [];
  for (let col = 0; col < 5; col++) {
    const hand = [
      board[0][col],
      board[1][col],
      board[2][col],
      board[3][col],
      board[4][col],
    ];
    columnScores.push(scoreHand(hand, false, cutCard));
  }

  const rowScores = [];
  for (let row = 0; row < 5; row++) {
    rowScores.push(scoreHand([...board[row]], false, cutCard));
  }

  const cribHand = [...crib, cutCard];
  const cribScore = scoreHand(cribHand, true, cutCard);

  const dealerTeam = getTeam(dealerIndex);
  const teamATotal =
    columnScores.reduce((s, v) => s + v, 0) +
    (dealerTeam === 'A' ? cribScore : 0);
  const teamBTotal =
    rowScores.reduce((s, v) => s + v, 0) +
    (dealerTeam === 'B' ? cribScore : 0);

  const diff = Math.abs(teamATotal - teamBTotal);
  let pegTeam = null;
  let pegAmount = 0;

  if (teamATotal > teamBTotal) {
    pegTeam = 'A';
    pegAmount = diff;
  } else if (teamBTotal > teamATotal) {
    pegTeam = 'B';
    pegAmount = diff;
  }

  const newScores = [...scores];
  if (pegTeam === 'A') newScores[0] += pegAmount;
  if (pegTeam === 'B') newScores[1] += pegAmount;

  return {
    columnScores,
    rowScores,
    cribScore,
    teamATotal,
    teamBTotal,
    dealerTeam,
    pegTeam,
    pegAmount,
    newScores,
  };
}

/* ------------------------------------------------------------------ */
/*  New round / game over                                              */
/* ------------------------------------------------------------------ */

/**
 * Start a new round (rotate dealer, keep scores).
 * @param {number} currentDealerIndex
 * @param {[number,number]} scores
 * @returns {import('./state.js').GameState & { hisHeels: boolean }}
 */
export function startNewRound(currentDealerIndex, scores) {
  return dealRound((currentDealerIndex + 1) % 4, scores);
}

/**
 * Check if either team has reached 31.
 * @param {[number,number]} scores
 * @returns {{ over: boolean, winner: 'A'|'B'|null }}
 */
export function checkGameOver(scores) {
  if (scores[0] >= WIN_TARGET) return { over: true, winner: 'A' };
  if (scores[1] >= WIN_TARGET) return { over: true, winner: 'B' };
  return { over: false, winner: null };
}
