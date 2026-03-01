/**
 * AI strategy for Criss Cross Cribbage.
 * Heuristic-based: evaluates each legal move by estimating its impact
 * on the AI's own lines vs the opponent's lines. No ML, no network.
 *
 * Supports three difficulty levels:
 *   'easy'   – mostly random, ignores opponent blocking
 *   'medium' – picks randomly from top 3 moves
 *   'hard'   – exhaustive evaluation, always picks the best move
 *
 * Team A (players 0,2) owns columns; Team B (players 1,3) owns rows.
 */

import { scoreHand } from '../game/score.js';
import { getLegalPlacements, getTeam } from '../game/rules.js';

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

/* ------------------------------------------------------------------ */
/*  Line evaluation                                                    */
/* ------------------------------------------------------------------ */

const CARD_VALUE = (rank) => (rank >= 10 ? 10 : rank);

/**
 * Estimate the scoring potential of a partial or complete line.
 * For 5 cards: exact cribbage score via scoreHand.
 * For 1–4 cards: counts 15s, pairs, and runs among the cards present.
 *
 * @param {import('../game/state.js').Card[]} cards  1–5 cards (no nulls)
 * @param {import('../game/state.js').Card} cutCard
 * @returns {number}
 */
export function evaluateLine(cards, cutCard) {
  if (cards.length === 0) return 0;
  if (cards.length === 5) return scoreHand(cards, false, cutCard);

  let score = 0;
  const values = cards.map((c) => CARD_VALUE(c.rank));

  for (let mask = 1; mask < (1 << cards.length); mask++) {
    let sum = 0;
    for (let i = 0; i < cards.length; i++) {
      if (mask & (1 << i)) sum += values[i];
    }
    if (sum === 15) score += 2;
  }

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].rank === cards[j].rank) score += 2;
    }
  }

  const rankCounts = {};
  cards.forEach((c) => {
    rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
  });
  const ranks = Object.keys(rankCounts)
    .map(Number)
    .sort((a, b) => a - b);

  let maxRunPts = 0;
  for (let start = 0; start < ranks.length; start++) {
    let len = 1;
    let mult = rankCounts[ranks[start]];
    while (
      start + len < ranks.length &&
      ranks[start + len] === ranks[start] + len
    ) {
      len++;
      mult *= rankCounts[ranks[start + len - 1]];
    }
    if (len >= 3) {
      maxRunPts = Math.max(maxRunPts, len * mult);
    }
  }
  score += maxRunPts;

  return score;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function gatherColumn(board, col) {
  const cards = [];
  for (let r = 0; r < 5; r++) {
    if (board[r][col]) cards.push(board[r][col]);
  }
  return cards;
}

function gatherRow(board, row) {
  const cards = [];
  for (let c = 0; c < 5; c++) {
    if (board[row][c]) cards.push(board[row][c]);
  }
  return cards;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Score all (card, cell) combinations for the given player.
 * Returns an array sorted best-first: [{ cardIndex, row, col, net }].
 */
function scorePlacementMoves(state, playerIndex) {
  const team = getTeam(playerIndex);
  const hand = state.hands[playerIndex];
  const board = state.board;
  const cutCard = state.cutCard;
  const legal = getLegalPlacements(state);

  const scored = [];

  for (let ci = 0; ci < hand.length; ci++) {
    const card = hand[ci];
    for (const { row, col } of legal) {
      const colDelta =
        evaluateLine([...gatherColumn(board, col), card], cutCard) -
        evaluateLine(gatherColumn(board, col), cutCard);
      const rowDelta =
        evaluateLine([...gatherRow(board, row), card], cutCard) -
        evaluateLine(gatherRow(board, row), cutCard);

      const net = team === 'A' ? colDelta - rowDelta : rowDelta - colDelta;
      scored.push({ cardIndex: ci, row, col, net });
    }
  }

  scored.sort((a, b) => b.net - a.net);
  return scored;
}

/**
 * Score all discard options for the given player.
 * Returns an array sorted best-first: [{ cardIndex, score }].
 */
function scoreDiscardMoves(state, playerIndex) {
  const team = getTeam(playerIndex);
  const dealerTeam = getTeam(state.dealerIndex);
  const hand = state.hands[playerIndex];
  const crib = state.crib;
  const cutCard = state.cutCard;
  const isOurCrib = team === dealerTeam;

  const scored = [];

  for (let ci = 0; ci < hand.length; ci++) {
    const remaining = hand.filter((_, i) => i !== ci);
    const retainedValue = evaluateLine(remaining, cutCard);
    const cribValue = evaluateLine([...crib, hand[ci]], cutCard);
    const score = retainedValue + (isOurCrib ? cribValue : -cribValue);
    scored.push({ cardIndex: ci, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/* ------------------------------------------------------------------ */
/*  Difficulty selection helpers                                        */
/* ------------------------------------------------------------------ */

function selectByDifficulty(sortedMoves, difficulty) {
  if (sortedMoves.length === 0) return sortedMoves[0];

  switch (difficulty) {
    case 'easy': {
      if (Math.random() < 0.55) return pickRandom(sortedMoves);
      const ownOnly = sortedMoves.slice(0, Math.max(1, Math.ceil(sortedMoves.length / 2)));
      return pickRandom(ownOnly);
    }
    case 'medium': {
      const topN = sortedMoves.slice(0, Math.min(3, sortedMoves.length));
      return pickRandom(topN);
    }
    case 'hard':
    default: {
      const best = sortedMoves[0];
      const ties = sortedMoves.filter(
        (m) => (m.net ?? m.score) === (best.net ?? best.score),
      );
      return pickRandom(ties);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Choose a (card, cell) for the current AI player.
 * @param {import('../game/state.js').GameState} state
 * @param {'easy'|'medium'|'hard'} [difficulty='hard']
 * @returns {{ cardIndex: number, row: number, col: number }}
 */
export function getAIPlacement(state, difficulty = 'hard') {
  const moves = scorePlacementMoves(state, state.currentPlayerIndex);
  const pick = selectByDifficulty(moves, difficulty);
  return { cardIndex: pick.cardIndex, row: pick.row, col: pick.col };
}

/**
 * Choose the best card to discard to the crib.
 * @param {import('../game/state.js').GameState} state
 * @param {'easy'|'medium'|'hard'} [difficulty='hard']
 * @returns {{ cardIndex: number }}
 */
export function getAIDiscard(state, difficulty = 'hard') {
  const moves = scoreDiscardMoves(state, state.currentPlayerIndex);
  const pick = selectByDifficulty(moves, difficulty);
  return { cardIndex: pick.cardIndex };
}

/**
 * Get a hint for the human player (player 0).
 * Always uses 'hard' analysis to give the best advice.
 * @param {import('../game/state.js').GameState} state
 * @returns {{ cardIndex: number, row?: number, col?: number } | null}
 */
export function getHint(state) {
  if (state.currentPlayerIndex !== 0) return null;

  if (state.phase === 'place') {
    const moves = scorePlacementMoves(state, 0);
    if (moves.length === 0) return null;
    const best = moves[0];
    return { cardIndex: best.cardIndex, row: best.row, col: best.col };
  }

  if (state.phase === 'discard') {
    const moves = scoreDiscardMoves(state, 0);
    if (moves.length === 0) return null;
    return { cardIndex: moves[0].cardIndex };
  }

  return null;
}
