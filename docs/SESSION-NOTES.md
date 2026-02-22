# Session notes – Criss Cross Cribbage

Brief summary of decisions and changes from development sessions, for future reference.

## Project location
- **App:** `C:\Users\fronczak\cursorprojects\criss-cross-cribbage`
- **Plans (local copies):** `docs/` folder in the project root:
  - `docs/criss_cross_cribbage_game.plan.md` – Main game plan (all phases)
  - `docs/finish_phase_1_cribbage.plan.md` – Phase 1 checklist
  - `docs/finish_phase_2_cribbage.plan.md` – Phase 2 checklist
  - `docs/finish_phase_3_rules.plan.md` – Phase 3 checklist
  - `docs/finish_phase_4_ui.plan.md` – Phase 4 checklist
  - `docs/finish_phase_5_ai.plan.md` – Phase 5 checklist
- **Plans (Cursor originals):** `C:\Users\fronczak\.cursor\plans\` (Phases 1–2 only; Phase 3+ created directly in `docs/`)

## Phase 1
- React + Vite; entry file is `src/main.jsx` (not `main.js`).
- Phase 1 plan was updated so Step 3 refers to “entry file” and how to find it.

## Phase 2 – Game data and cribbage scoring ✅ complete
- **`src/game/state.js`** – Card, deck, board, `createEmptyGameState()`, `cardToString()`.
- **`src/game/score.js`** – `scoreHand(fiveCards, isCrib, cutCard)` (15s, pairs, runs, flush, His Nobs).
- **`src/game/score.test.js`** – Fixed hands (exact expected scores) + 15 random hands (consistency + range 0–29). Each result includes `cards` and `random` for UI.
- **`src/game/index.js`** – Re-exports for `import { ... } from './game'`.
- Scoring tests run on app load and via “Run score tests” button in the UI; results show fixed vs random hands in contrasting colors (blue = fixed, green = random).
- Test expectations for fixed hands were corrected to include all scoring elements (e.g. 15s + runs), not just one.

## Phase 3 – Game rules and state updates ✅ complete
- **`src/game/rules.js`** – Full round engine: `dealRound`, `discardToCrib`, `placeCard`, `scoreRound`, `startNewRound`, `checkGameOver`, `getLegalPlacements`, `getLegalDiscards`, `getTeam`.
- **`src/game/rules.test.js`** – 30+ assertions: deal shape, His Heels, discard flow, placement flow, full round simulation, scoring breakdown, game-over checks.
- **`src/game/index.js`** – Updated to re-export all rules functions.
- **`src/App.jsx`** – Updated: shows Phase 2 (blue) and Phase 3 (green) test sections with "Run all tests" button.
- Teams: Players 0 & 2 = Team A (columns); Players 1 & 3 = Team B (rows).
- Turn order: clockwise from left of dealer.
- Round flow: `discard` phase (4 discards) → `place` phase (24 placements) → `score` phase → peg difference → new round or game over at 31.
- His Heels: if cut card is a Jack, dealer's team pegs 2 immediately on deal.

## Phase 4 – Minimal UI ✅ complete
- **`src/Game.jsx`** – Main game component: Board (5×5 CSS grid), PlayerHand, StatusBar, RoundResultPanel, CardFace. AI auto-plays random moves with 400ms delay.
- **`src/Game.css`** – Card-game theme: dark navy background, green felt board, gold highlights, suit colors.
- **`src/App.jsx`** – Game/Tests toggle nav (game is default view).
- **`src/App.css`** – Navigation + test dashboard styles.
- **`src/index.css`** – Cleaned up from Vite defaults to match game theme.
- Full round playable: New Game → discard → place → score → Next Round or Game Over at 31.
- Human interaction: select card → discard (button) or place (click cell). AI plays randomly.

## Useful references
- Main game plan: `docs/criss_cross_cribbage_game.plan.md`
- Phase 2 checklist: `docs/finish_phase_2_cribbage.plan.md`
- Phase 3 checklist: `docs/finish_phase_3_rules.plan.md`
- Phase 4 checklist: `docs/finish_phase_4_ui.plan.md`

## Phase 5 – AI for partner and opponents ✅ complete
- **`src/ai/strategy.js`** – Heuristic AI: `evaluateLine` (partial/complete line scoring), `getAIPlacement` (best card+cell by column/row delta), `getAIDiscard` (retained hand value ± crib impact).
- **`src/ai/strategy.test.js`** – Tests: evaluateLine correctness, valid move returns, full AI round, scoring check.
- **`src/Game.jsx`** – AI auto-play now uses heuristic strategy instead of random moves.
- **`src/App.jsx`** – Test dashboard includes Phase 5 AI tests (orange).
- AI evaluates every (card, cell) combo, scores the resulting column/row improvement, and picks the move that maximises own team's lines while minimising the opponent's.
- Crib discard balances retained hand value vs crib impact (help own crib, hurt opponent's).

## Useful references
- Main game plan: `docs/criss_cross_cribbage_game.plan.md`
- Phase 5 checklist: `docs/finish_phase_5_ai.plan.md`

## Future: Multiplayer (post-Phase 7)
- Noted in the main game plan under "6. Multiplayer – real opponents (future)".
- Recommended approach: Node.js + WebSockets with room codes. The current `rules.js` engine can run server-side with no changes.
- Alternatives: Firebase/Supabase (serverless), WebRTC (peer-to-peer), or pass-and-play (local).
- Hybrid mode possible: 0–3 AI + 1–4 humans in the same game.

**Phase 5 is complete.** Phase 6 (Full game flow and polish) has not been started.

*Last updated: Phase 5 marked complete; no Phase 6 work started.*
