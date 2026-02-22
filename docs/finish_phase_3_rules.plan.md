---
name: Finish Phase 3 Rules
overview: "Phase 3 of Criss Cross Cribbage: game rules and state updates — deal, cut, legal moves, place card, discard to crib, end-of-round scoring and pegging."
todos: []
isProject: false
---

# Phase 3 – Game Rules and State Updates

Phase 3 is **"Game rules and state updates"** from [criss_cross_cribbage_game.plan.md](criss_cross_cribbage_game.plan.md).

---

## Phase 3 steps

| Step | Action                                                                                                | Done when                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1    | **Deal and cut** – `dealRound(dealerIndex, scores)`: shuffle, deal 7×4, pick cut, His Heels.         | State has 4 hands of 7, cut at (2,2), His Heels detected.                |
| 2    | **Legal moves** – `getLegalPlacements(state)` and `getLegalDiscards(state)`.                           | Returns correct empty cells / hand indices.                               |
| 3    | **Place card and discard** – `placeCard(state, cardIdx, row, col)` and `discardToCrib(state, cardIdx)`. | Immutable state returned; phase transitions discard→place→score.          |
| 4    | **End-of-round scoring** – `scoreRound(state)`: columns for Team A, rows for Team B, crib for dealer. | Returns breakdown + newScores with pegged difference.                     |

---

## What was added

- **`src/game/rules.js`** – All Phase 3 functions:
  - `dealRound(dealerIndex, scores)` – shuffles deck, deals 7 cards to 4 players, places cut at (2,2), checks His Heels (cut = J → +2 to dealer's team).
  - `getLegalPlacements(state)` – all empty board cells.
  - `getLegalDiscards(state)` – indices of cards in current player's hand.
  - `discardToCrib(state, cardIndex)` – discards to crib, advances player; after 4 discards switches to 'place' phase.
  - `placeCard(state, cardIndex, row, col)` – places card on board, advances player; when board full switches to 'score' phase.
  - `scoreRound(state)` – scores 5 columns (Team A), 5 rows (Team B), crib (dealer's team); pegs the difference.
  - `startNewRound(currentDealerIndex, scores)` – rotates dealer, deals fresh round.
  - `checkGameOver(scores)` – returns `{ over, winner }` when a team reaches 31.
  - `getTeam(playerIndex)` – returns 'A' or 'B'.
  - `TEAM_A_PLAYERS`, `TEAM_B_PLAYERS` – [0,2] and [1,3].
- **`src/game/rules.test.js`** – 30+ assertions covering deal, discard flow, place flow, full round simulation, scoring, His Heels, game-over checks. Runs on app load and via button.
- **`src/game/index.js`** – Updated to re-export all rules functions.
- **`src/App.jsx`** – Updated to show Phase 2 (scoring) and Phase 3 (rules) test results side by side.

---

## Teams and turn order

- **Team A** (your team): Players 0 (you) and 2 (AI partner) → score **columns**.
- **Team B** (opponents): Players 1 and 3 (AI opponents) → score **rows**.
- **Turn order**: clockwise starting from left of dealer: `(dealerIndex + 1) % 4`.

## Round flow (state machine)

```
dealRound → phase:'discard' → (4 discards) → phase:'place' → (24 placements) → phase:'score'
                                                                                   ↓
                                                              scoreRound → checkGameOver
                                                                           ↓          ↓
                                                                     startNewRound   gameOver
```

---

## How to verify

1. Run `npm run dev` and open the app.
2. Both Phase 2 (blue) and Phase 3 (green) test sections appear automatically.
3. All tests should show checkmarks. Click "Run all tests" to re-run.

---

## Phase 3 complete

Phase 3 is **complete**. Phase 4 (Minimal UI — board and your turn) has not been started.
