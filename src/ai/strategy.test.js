/**
 * Phase 5 tests: AI strategy (placement and crib discard heuristics).
 */

import { evaluateLine, getAIPlacement, getAIDiscard } from './strategy.js';
import {
  dealRound,
  discardToCrib,
  placeCard,
  getLegalPlacements,
  getTeam,
  scoreRound,
} from '../game/rules.js';

function card(rank, suit) {
  return { rank, suit };
}

function assert(condition, name) {
  return { name, ok: condition, expected: 'pass', got: condition ? 'pass' : 'FAIL' };
}

export function runStrategyTests() {
  const results = [];

  // ---- evaluateLine ----

  results.push(assert(evaluateLine([], card(5, 'H')) === 0, 'evaluateLine: empty = 0'));

  // Pair of 5s = 2 (pair) + 2 (fifteen: 5+5=10, not 15) → just 2
  // Wait: 5+5=10, not 15. So pair of 5s = 2 pts (pair only).
  const pair5 = [card(5, 'H'), card(5, 'D')];
  const el1 = evaluateLine(pair5, card(1, 'C'));
  results.push(assert(el1 === 2, `evaluateLine: pair of 5s = 2 (got ${el1})`));

  // 5 + 10 = 15 → 2 pts
  const fifteen = [card(5, 'H'), card(10, 'D')];
  const el2 = evaluateLine(fifteen, card(1, 'C'));
  results.push(assert(el2 === 2, `evaluateLine: 5+10=15 → 2 (got ${el2})`));

  // Run of 3: 3-4-5 = 3 (run). 3+4+5=12 (no 15).
  const run3 = [card(3, 'H'), card(4, 'D'), card(5, 'C')];
  const el3 = evaluateLine(run3, card(1, 'S'));
  results.push(assert(el3 === 3, `evaluateLine: run 3-4-5 = 3 (got ${el3})`));

  // 5-card hand delegates to scoreHand
  const fiveCards = [card(5, 'H'), card(5, 'D'), card(5, 'C'), card(10, 'S'), card(11, 'H')];
  const el4 = evaluateLine(fiveCards, card(11, 'H'));
  results.push(assert(el4 > 0, `evaluateLine: 5-card hand scores > 0 (got ${el4})`));

  // ---- getAIPlacement returns valid move ----

  let state = dealRound(0);
  for (let i = 0; i < 4; i++) state = discardToCrib(state, 0);

  const move = getAIPlacement(state);
  results.push(assert(
    typeof move.cardIndex === 'number' && typeof move.row === 'number' && typeof move.col === 'number',
    'getAIPlacement: returns { cardIndex, row, col }',
  ));

  const legal = getLegalPlacements(state);
  const isLegal = legal.some((c) => c.row === move.row && c.col === move.col);
  results.push(assert(isLegal, 'getAIPlacement: chosen cell is legal'));

  const hand = state.hands[state.currentPlayerIndex];
  results.push(assert(
    move.cardIndex >= 0 && move.cardIndex < hand.length,
    'getAIPlacement: cardIndex is valid',
  ));

  // ---- getAIDiscard returns valid index ----

  const dstate = dealRound(0);
  const disc = getAIDiscard(dstate);
  results.push(assert(
    typeof disc.cardIndex === 'number' &&
      disc.cardIndex >= 0 &&
      disc.cardIndex < dstate.hands[dstate.currentPlayerIndex].length,
    'getAIDiscard: returns valid cardIndex',
  ));

  // ---- Full AI round: discard + place all cards without crash ----

  let fullState = dealRound(2);
  let crashed = false;
  try {
    // AI discards for all 4 players
    for (let i = 0; i < 4; i++) {
      const d = getAIDiscard(fullState);
      fullState = discardToCrib(fullState, d.cardIndex);
    }

    // AI places all cards until board is full
    while (fullState.phase === 'place') {
      const m = getAIPlacement(fullState);
      fullState = placeCard(fullState, m.cardIndex, m.row, m.col);
    }
  } catch (e) {
    crashed = true;
    console.error('AI full round error:', e);
  }

  results.push(assert(!crashed, 'AI full round: no crash'));
  results.push(assert(fullState.phase === 'score', 'AI full round: reached score phase'));

  // Board should be fully filled
  const filled = fullState.board.flat().filter((c) => c !== null).length;
  results.push(assert(filled === 25, 'AI full round: board is full (25 cards)'));

  // ---- AI vs Random comparison: AI should score at least as well on average ----
  // Run several rounds with AI and check scores are reasonable
  let totalPeg = 0;
  const numTrials = 10;
  for (let t = 0; t < numTrials; t++) {
    let s = dealRound(t % 4);
    for (let i = 0; i < 4; i++) {
      const d = getAIDiscard(s);
      s = discardToCrib(s, d.cardIndex);
    }
    while (s.phase === 'place') {
      const m = getAIPlacement(s);
      s = placeCard(s, m.cardIndex, m.row, m.col);
    }
    const sr = scoreRound(s);
    totalPeg += sr.teamATotal + sr.teamBTotal;
  }
  const avgTotal = totalPeg / numTrials;
  results.push(assert(
    avgTotal > 0,
    `AI scoring: avg combined total = ${avgTotal.toFixed(1)} (should be > 0)`,
  ));

  // Summary
  const allOk = results.every((r) => r.ok);
  console.log(results);
  console.log(allOk ? 'All strategy tests passed.' : 'Some strategy tests failed.');
  return results;
}

runStrategyTests();
