/**
 * AI strategy for Criss Cross Cribbage (Phase 5).
 * Heuristic-based: evaluates each legal move by estimating its impact
 * on the AI's own lines vs the opponent's lines. No ML, no network.
 *
 * Team A (players 0,2) owns columns; Team B (players 1,3) owns rows.
 */

import { scoreHand } from '../game/score.js';
import { getLegalPlacements, getTeam } from '../game/rules.js';

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

  // 15s: every subset that sums to 15 = 2 pts
  for (let mask = 1; mask < (1 << cards.length); mask++) {
    let sum = 0;
    for (let i = 0; i < cards.length; i++) {
      if (mask & (1 << i)) sum += values[i];
    }
    if (sum === 15) score += 2;
  }

  // Pairs: same rank = 2 pts per pair
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].rank === cards[j].rank) score += 2;
    }
  }

  // Runs: 3+ consecutive ranks, duplicates multiply
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

/* ------------------------------------------------------------------ */
/*  Placement                                                          */
/* ------------------------------------------------------------------ */

/**
 * Choose the best (card, cell) for the current AI player.
 *
 * For every legal (card, cell) combination:
 *   1. Compute the score delta for the column and the row.
 *   2. Net = own-line delta − opponent-line delta.
 *   3. Pick the move with the highest net (ties broken randomly).
 *
 * @param {import('../game/state.js').GameState} state
 * @returns {{ cardIndex: number, row: number, col: number }}
 */
export function getAIPlacement(state) {
  const pi = state.currentPlayerIndex;
  const team = getTeam(pi);
  const hand = state.hands[pi];
  const board = state.board;
  const cutCard = state.cutCard;
  const legal = getLegalPlacements(state);

  let bestScore = -Infinity;
  let bestMoves = [];

  for (let ci = 0; ci < hand.length; ci++) {
    const card = hand[ci];

    for (const { row, col } of legal) {
      const colBefore = gatherColumn(board, col);
      const colAfter = [...colBefore, card];

      const rowBefore = gatherRow(board, row);
      const rowAfter = [...rowBefore, card];

      const colDelta =
        evaluateLine(colAfter, cutCard) - evaluateLine(colBefore, cutCard);
      const rowDelta =
        evaluateLine(rowAfter, cutCard) - evaluateLine(rowBefore, cutCard);

      // Team A maximises columns, Team B maximises rows
      const net = team === 'A' ? colDelta - rowDelta : rowDelta - colDelta;

      if (net > bestScore) {
        bestScore = net;
        bestMoves = [{ cardIndex: ci, row, col }];
      } else if (net === bestScore) {
        bestMoves.push({ cardIndex: ci, row, col });
      }
    }
  }

  return pickRandom(bestMoves);
}

/* ------------------------------------------------------------------ */
/*  Crib discard                                                       */
/* ------------------------------------------------------------------ */

/**
 * Choose the best card to discard to the crib.
 *
 * For each card in hand:
 *   retainedValue = evaluateLine(remaining hand)
 *   cribImpact    = evaluateLine(crib + this card)
 *   score = retainedValue + cribImpact  (if dealer's team)
 *   score = retainedValue − cribImpact  (if not dealer's team)
 *
 * @param {import('../game/state.js').GameState} state
 * @returns {{ cardIndex: number }}
 */
export function getAIDiscard(state) {
  const pi = state.currentPlayerIndex;
  const team = getTeam(pi);
  const dealerTeam = getTeam(state.dealerIndex);
  const hand = state.hands[pi];
  const crib = state.crib;
  const cutCard = state.cutCard;
  const isOurCrib = team === dealerTeam;

  let bestScore = -Infinity;
  let bestIndices = [];

  for (let ci = 0; ci < hand.length; ci++) {
    const card = hand[ci];

    const remaining = hand.filter((_, i) => i !== ci);
    const retainedValue = evaluateLine(remaining, cutCard);

    const cribWithCard = [...crib, card];
    const cribValue = evaluateLine(cribWithCard, cutCard);

    const score = retainedValue + (isOurCrib ? cribValue : -cribValue);

    if (score > bestScore) {
      bestScore = score;
      bestIndices = [ci];
    } else if (score === bestScore) {
      bestIndices.push(ci);
    }
  }

  return { cardIndex: pickRandom(bestIndices) };
}
