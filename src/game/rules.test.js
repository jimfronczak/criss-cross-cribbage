/**
 * Phase 3 tests: game rules and state transitions.
 * Run on app load and via "Run rules tests" button (same pattern as score.test.js).
 */

import {
  dealRound,
  getLegalPlacements,
  getLegalDiscards,
  discardToCrib,
  placeCard,
  scoreRound,
  startNewRound,
  checkGameOver,
  getTeam,
  TEAM_A_PLAYERS,
  TEAM_B_PLAYERS,
} from './rules.js';

function assert(condition, name) {
  return { name, ok: condition, expected: 'pass', got: condition ? 'pass' : 'FAIL' };
}

export function runRulesTests() {
  const results = [];

  // ---- dealRound ----
  const state = dealRound(0);

  results.push(assert(
    state.hands.length === 4 && state.hands.every((h) => h.length === 7),
    'Deal: 4 hands of 7 cards',
  ));

  results.push(assert(
    state.board[2][2] !== null &&
      state.board[2][2].suit === state.cutCard.suit &&
      state.board[2][2].rank === state.cutCard.rank,
    'Deal: cut card at center (2,2)',
  ));

  const emptyCells = state.board.flat().filter((c) => c === null).length;
  results.push(assert(emptyCells === 24, 'Deal: 24 empty cells'));

  results.push(assert(state.crib.length === 0, 'Deal: crib empty'));
  results.push(assert(state.phase === 'discard', 'Deal: starts in discard phase'));
  results.push(assert(state.currentPlayerIndex === 1, 'Deal: first player is left of dealer 0'));
  results.push(assert(state.dealerIndex === 0, 'Deal: dealer is 0'));

  // All 28 dealt cards + 1 cut = 29 unique cards
  const allDealt = [...state.hands.flat(), state.cutCard];
  const uniqueCards = new Set(allDealt.map((c) => `${c.rank}${c.suit}`));
  results.push(assert(uniqueCards.size === 29, 'Deal: 29 unique cards (28 dealt + cut)'));

  // ---- His Heels ----
  // Run many deals to check His Heels triggers when cut is a Jack
  let heelsChecked = false;
  for (let d = 0; d < 200; d++) {
    const s = dealRound(d % 4);
    if (s.cutCard.rank === 11) {
      const team = getTeam(s.dealerIndex);
      const idx = team === 'A' ? 0 : 1;
      results.push(assert(s.hisHeels === true && s.scores[idx] === 2,
        'His Heels: cut=J → +2 to dealer team'));
      heelsChecked = true;
      break;
    }
  }
  if (!heelsChecked) {
    results.push(assert(true, 'His Heels: no Jack cut in 200 deals (skip)'));
  }

  // ---- Team helpers ----
  results.push(assert(getTeam(0) === 'A' && getTeam(2) === 'A', 'Teams: 0,2 = A'));
  results.push(assert(getTeam(1) === 'B' && getTeam(3) === 'B', 'Teams: 1,3 = B'));

  // ---- Discard phase ----
  let ds = dealRound(0); // dealer=0, first=1
  results.push(assert(getLegalDiscards(ds).length === 7, 'Discard: 7 options'));

  // Discard for each of 4 players
  ds = discardToCrib(ds, 0); // player 1 discards
  results.push(assert(ds.crib.length === 1 && ds.currentPlayerIndex === 2, 'Discard: player 1 done'));
  results.push(assert(ds.phase === 'discard', 'Discard: still discarding after 1'));

  ds = discardToCrib(ds, 0); // player 2
  ds = discardToCrib(ds, 0); // player 3
  results.push(assert(ds.crib.length === 3 && ds.phase === 'discard', 'Discard: 3 done'));

  ds = discardToCrib(ds, 0); // player 0 (dealer) — last discard
  results.push(assert(ds.crib.length === 4, 'Discard: crib has 4 cards'));
  results.push(assert(ds.phase === 'place', 'Discard: phase switches to place'));
  results.push(assert(ds.currentPlayerIndex === 1, 'Discard→Place: first player resets to left of dealer'));
  results.push(assert(ds.hands.every((h) => h.length === 6), 'Discard: all hands now have 6 cards'));

  // ---- Legal placements ----
  const placements = getLegalPlacements(ds);
  results.push(assert(placements.length === 24, 'Place: 24 legal cells initially'));

  const centerInList = placements.some((p) => p.row === 2 && p.col === 2);
  results.push(assert(!centerInList, 'Place: center (2,2) not in legal cells'));

  // ---- Place phase: simulate full round ----
  let ps = ds;
  let placementCount = 0;
  while (ps.phase === 'place') {
    const legal = getLegalPlacements(ps);
    const cell = legal[0];
    ps = placeCard(ps, 0, cell.row, cell.col);
    placementCount++;
  }

  results.push(assert(placementCount === 24, 'Place: 24 cards placed'));
  results.push(assert(ps.phase === 'score', 'Place: phase becomes score when full'));
  results.push(assert(ps.hands.every((h) => h.length === 0), 'Place: all hands empty'));

  const filledCells = ps.board.flat().filter((c) => c !== null).length;
  results.push(assert(filledCells === 25, 'Place: board fully filled (25 cards)'));

  // ---- scoreRound ----
  const sr = scoreRound(ps);

  results.push(assert(sr.columnScores.length === 5, 'Score: 5 column scores'));
  results.push(assert(sr.rowScores.length === 5, 'Score: 5 row scores'));
  results.push(assert(typeof sr.cribScore === 'number' && sr.cribScore >= 0, 'Score: crib scored'));
  results.push(assert(sr.teamATotal >= 0 && sr.teamBTotal >= 0, 'Score: totals non-negative'));
  results.push(assert(
    sr.pegTeam === null || sr.pegTeam === 'A' || sr.pegTeam === 'B',
    'Score: pegTeam valid',
  ));
  results.push(assert(sr.pegAmount >= 0, 'Score: pegAmount non-negative'));
  results.push(assert(
    Array.isArray(sr.newScores) && sr.newScores.length === 2,
    'Score: newScores is [n,n]',
  ));

  // ---- checkGameOver ----
  results.push(assert(!checkGameOver([10, 20]).over, 'GameOver: not over at [10,20]'));
  results.push(assert(checkGameOver([31, 5]).over && checkGameOver([31, 5]).winner === 'A',
    'GameOver: A wins at 31'));
  results.push(assert(checkGameOver([5, 35]).over && checkGameOver([5, 35]).winner === 'B',
    'GameOver: B wins at 35'));

  // ---- startNewRound ----
  const nr = startNewRound(0, [10, 8]);
  results.push(assert(nr.dealerIndex === 1, 'NewRound: dealer rotated 0→1'));
  results.push(assert(nr.scores[0] === 10 && nr.scores[1] === 8, 'NewRound: scores carried'));
  results.push(assert(nr.phase === 'discard', 'NewRound: back to discard phase'));
  results.push(assert(nr.variant === 'classic', 'NewRound: variant defaults to classic'));

  // ---- Full round (deal → discard → place → score → check) ----
  let full = dealRound(2); // dealer=2, first=3
  for (let i = 0; i < 4; i++) full = discardToCrib(full, 0);
  while (full.phase === 'place') {
    const cell = getLegalPlacements(full)[0];
    full = placeCard(full, 0, cell.row, cell.col);
  }
  const fullSr = scoreRound(full);
  const go = checkGameOver(fullSr.newScores);
  results.push(assert(
    typeof go.over === 'boolean',
    `Full round: completed (scores ${fullSr.newScores.join('-')}, over=${go.over})`,
  ));

  /* ------------------------------------------------------------------ */
  /*  No-Crib variant                                                   */
  /* ------------------------------------------------------------------ */

  // ---- dealRound (noCrib) ----
  const ncState = dealRound(0, [0, 0], 'noCrib');

  results.push(assert(
    ncState.hands.length === 4 && ncState.hands.every((h) => h.length === 6),
    'No-Crib deal: 4 hands of 6 cards',
  ));
  results.push(assert(ncState.crib.length === 0, 'No-Crib deal: crib empty'));
  results.push(assert(ncState.phase === 'place', 'No-Crib deal: starts in place phase'));
  results.push(assert(ncState.variant === 'noCrib', 'No-Crib deal: variant tagged'));
  results.push(assert(ncState.dealerIndex === 0, 'No-Crib deal: dealer is 0'));
  results.push(assert(
    ncState.currentPlayerIndex === 1,
    'No-Crib deal: first player is left of dealer',
  ));
  results.push(assert(ncState.board[2][2] !== null, 'No-Crib deal: cut card at center (2,2)'));

  // 24 dealt + 1 cut = 25 unique cards
  const ncAllDealt = [...ncState.hands.flat(), ncState.cutCard];
  const ncUnique = new Set(ncAllDealt.map((c) => `${c.rank}${c.suit}`));
  results.push(assert(ncUnique.size === 25, 'No-Crib deal: 25 unique cards (24 dealt + cut)'));

  // ---- His Heels still fires in noCrib ----
  let ncHeelsChecked = false;
  for (let d = 0; d < 200; d++) {
    const s = dealRound(d % 4, [0, 0], 'noCrib');
    if (s.cutCard.rank === 11) {
      const team = getTeam(s.dealerIndex);
      const idx = team === 'A' ? 0 : 1;
      results.push(assert(
        s.hisHeels === true && s.scores[idx] === 2,
        'No-Crib His Heels: cut=J → +2 to dealer team',
      ));
      ncHeelsChecked = true;
      break;
    }
  }
  if (!ncHeelsChecked) {
    results.push(assert(true, 'No-Crib His Heels: no Jack cut in 200 deals (skip)'));
  }

  // ---- Full no-crib round: straight into place, no discard ----
  let ncPs = ncState;
  let ncPlacementCount = 0;
  while (ncPs.phase === 'place') {
    const cell = getLegalPlacements(ncPs)[0];
    ncPs = placeCard(ncPs, 0, cell.row, cell.col);
    ncPlacementCount++;
  }
  results.push(assert(ncPlacementCount === 24, 'No-Crib place: 24 cards placed'));
  results.push(assert(ncPs.phase === 'score', 'No-Crib place: phase becomes score when full'));
  results.push(assert(
    ncPs.hands.every((h) => h.length === 0),
    'No-Crib place: all hands empty',
  ));
  results.push(assert(
    ncPs.crib.length === 0,
    'No-Crib place: crib still empty after full round',
  ));

  // ---- scoreRound (noCrib) ignores the crib ----
  const ncSr = scoreRound(ncPs);
  const ncColSum = ncSr.columnScores.reduce((s, v) => s + v, 0);
  const ncRowSum = ncSr.rowScores.reduce((s, v) => s + v, 0);

  results.push(assert(ncSr.cribScore === 0, 'No-Crib score: cribScore is 0'));
  results.push(assert(
    ncSr.teamATotal === ncColSum,
    'No-Crib score: Team A total = sum of columns only',
  ));
  results.push(assert(
    ncSr.teamBTotal === ncRowSum,
    'No-Crib score: Team B total = sum of rows only',
  ));

  // ---- startNewRound preserves noCrib variant ----
  const ncNr = startNewRound(0, [5, 7], 'noCrib');
  results.push(assert(ncNr.variant === 'noCrib', 'No-Crib NewRound: variant preserved'));
  results.push(assert(ncNr.phase === 'place', 'No-Crib NewRound: goes straight to place'));
  results.push(assert(
    ncNr.hands.every((h) => h.length === 6),
    'No-Crib NewRound: hands have 6 cards',
  ));

  // Summary
  const allOk = results.every((r) => r.ok);
  console.log(results);
  console.log(allOk ? 'All rules tests passed.' : 'Some rules tests failed.');
  return results;
}

runRulesTests();
