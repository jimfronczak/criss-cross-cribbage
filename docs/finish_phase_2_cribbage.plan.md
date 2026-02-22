---
name: Finish Phase 2 Cribbage
overview: Complete Phase 2 of the Criss Cross Cribbage plan—game data structures and cribbage hand scoring—so the engine is testable before Phase 3 (rules and state updates).
todos: []
isProject: false
---

# Finish Phase 2 Before Starting Phase 3

Phase 2 is **"Game data and cribbage scoring (no UI yet)"** from [criss_cross_cribbage_game_4ae3c82e.plan.md](C:\Users\fronczak.cursor\plans\criss_cross_cribbage_game_4ae3c82e.plan.md).

---

## Phase 2 steps


| Step | Action                                                                                                                                     | Done when                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1    | **Define card and board data structures** in `src/game/state.js`: card `{ suit, rank }`, 5×5 grid, cut card, and `createEmptyGameState()`. | You have state.js with deck, board, and empty state. |
| 2    | **Implement cribbage hand scoring** in `src/game/score.js`: `scoreHand(fiveCards, isCrib, cutCard)` (15s, pairs, runs, flush, His Nobs).   | You can call `scoreHand` and get a number.           |
| 3    | **Test scoring** with known hands (e.g. run of 3, pair, 15, Nobs).                                                                         | Results match the rules.                             |


---

## What was added for you

- `**src/game/state.js`** – Card type, `createDeck()`, `shuffle()`, `createEmptyBoard()`, `createEmptyGameState()`, `cardToString()`.
- `**src/game/score.js`** – `scoreHand(fiveCards, isCrib, cutCard)` with standard cribbage scoring.
- `**src/game/score.test.js`** – Simple checks: run 3-4-5, pair, 15, His Nobs, double run. Run in browser or Node to verify.
- `**src/game/index.js`** – Re-exports for `import { ... } from './game'`.

---

## How to verify (Step 3)

1. **In the browser** – With dev server running, open the console and run:

```js
   import('./src/game/score.test.js').then(m => m.runScoreTests());
   

```

   Or temporarily in `main.jsx` or `App.jsx`: `import { runScoreTests } from './game/score.test.js'; runScoreTests();` then check the console.

1. **Manual checks** – In the console:

```js
   import { scoreHand } from './src/game/score.js';
   const card = (r,s) => ({ rank: r, suit: s });
   scoreHand([card(3,'H'), card(4,'D'), card(5,'C'), card(10,'S'), card(2,'H')], false, card(2,'H'));
   // Expect 3 (run of 3)
   

```

---

## Definition of done for Phase 2

- `src/game/state.js` defines cards, board, and empty game state.
- `src/game/score.js` implements `scoreHand`.
- You ran the scoring tests and confirmed they pass (or verified a few hands by hand).

---

## Phase 2 complete

Phase 2 is **complete**. Do **not** start Phase 3 until you’re ready. When you are, begin **Phase 3: Game rules and state updates** (deal, cut, legal moves, place card, discard to crib, end-of-round scoring and pegging) from the main game plan.