/**
 * Quick verification for cribbage scoring (Phase 2 step 3).
 * Run in Node: node src/game/score.test.js
 * Or import in browser console and call runScoreTests().
 */

import { scoreHand } from './score.js';
import { createDeck, shuffle } from './state.js';

/** Card: rank 1-13 (A=1,J=11,Q=12,K=13), suit H,D,C,S */
function card(rank, suit) {
  return { rank, suit };
}

/** Draw 5 random cards from a shuffled deck (no duplicates). */
function randomHand() {
  const deck = createDeck();
  shuffle(deck);
  return deck.slice(0, 5);
}

const MAX_CRIBBAGE_HAND = 29; // theoretical max for a 5-card hand

export function runScoreTests() {
  const results = [];

  // ---- Fixed hands (exact expected scores) ----
  const run35 = [card(3, 'H'), card(4, 'D'), card(5, 'C'), card(10, 'S'), card(2, 'H')];
  const s1 = scoreHand(run35, false, run35[4]);
  results.push({ name: 'Run 2-3-4-5 + two 15s', expected: 8, got: s1, ok: s1 === 8, cards: run35, random: false });

  const pair5 = [card(5, 'H'), card(5, 'D'), card(1, 'C'), card(9, 'S'), card(2, 'H')];
  const s2 = scoreHand(pair5, false, pair5[4]);
  results.push({ name: 'Pair of 5s + 15s', expected: 6, got: s2, ok: s2 === 6, cards: pair5, random: false });

  const fifteen = [card(5, 'H'), card(10, 'D'), card(1, 'C'), card(2, 'S'), card(3, 'H')];
  const s3 = scoreHand(fifteen, false, fifteen[4]);
  results.push({ name: 'Two 15s + run 1-2-3', expected: 7, got: s3, ok: s3 === 7, cards: fifteen, random: false });

  const nobs = [card(11, 'H'), card(2, 'D'), card(3, 'C'), card(4, 'S'), card(5, 'H')];
  const s4 = scoreHand(nobs, false, nobs[4]);
  results.push({ name: 'His Nobs + 15s + run', expected: 9, got: s4, ok: s4 === 9, cards: nobs, random: false });

  const doubleRun = [card(3, 'H'), card(3, 'D'), card(4, 'C'), card(5, 'S'), card(1, 'H')];
  const s5 = scoreHand(doubleRun, false, doubleRun[4]);
  results.push({ name: 'Double run + pair + 15', expected: 10, got: s5, ok: s5 === 10, cards: doubleRun, random: false });

  // ---- Random hands (consistency + valid range 0–29) ----
  const numRandom = 15;
  for (let i = 0; i < numRandom; i++) {
    const hand = randomHand();
    const cut = hand[4];
    const score1 = scoreHand(hand, false, cut);
    const score2 = scoreHand(hand, false, cut);
    const consistent = score1 === score2;
    const inRange = score1 >= 0 && score1 <= MAX_CRIBBAGE_HAND;
    const ok = consistent && inRange;
    results.push({
      name: `Random hand ${i + 1} (${score1} pts)`,
      expected: score1,
      got: score2,
      ok,
      cards: hand,
      random: true,
    });
  }

  const allOk = results.every((r) => r.ok);
  console.log(results);
  console.log(allOk ? 'All score tests passed.' : 'Some tests failed.');
  return results;
}

// Run when executed directly (e.g. node with --experimental-vm-modules or similar)
runScoreTests();
