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
  - `docs/finish_phase_6_polish.plan.md` – Phase 6 checklist
  - `docs/finish_phase_7_pwa.plan.md` – Phase 7 checklist
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

## Phase 6 – Full game flow and polish ✅ complete
- **`src/Game.jsx`** changes:
  - **Score track** (`ScoreTrack` component): progress bars showing each team's score toward 31.
  - **Dealer badge**: gold "D" circle next to whichever player name is the current dealer (partner, opponents, and "Your Hand").
  - **Round counter**: round number displayed in header meta.
  - **Crib reveal**: `RoundResultPanel` now shows all 4 crib cards + cut card face-up with the crib score.
  - **Crib ownership label**: header shows "(yours)" or "(theirs)" next to the crib count.
- **`src/Game.css`** changes:
  - Score track styles (`.score-track`, `.st-row`, `.st-bar`, `.st-fill`, animated width transition).
  - Dealer badge style (`.dealer-badge`): gold circle with "D".
  - Crib reveal styles (`.rr-crib`, `.rr-card`, etc.).
  - `cell-pop` keyframe animation on `.cell-filled` — cards scale in when placed on the board.
  - **Responsive breakpoints**: `@media (max-width: 600px)` and `@media (max-width: 400px)` — board cells, hand cards, card backs all shrink proportionally on smaller screens.
- **`index.html`** changes:
  - `user-scalable=no` added to viewport (prevents accidental zoom on mobile).
  - `apple-mobile-web-app-capable` and `theme-color` meta tags for PWA-readiness.
  - Title updated to "Criss Cross Cribbage".

## Useful references
- Phase 6 checklist: `docs/finish_phase_6_polish.plan.md`

## Pre-Phase 7 discussion notes

### PWA/SPA – What it is
- The app is already a **Single-Page App (SPA)** — React handles all views in one `index.html` with no page navigations.
- A **Progressive Web App (PWA)** adds installability (manifest) and offline caching (service worker) on top of the SPA.
- After Phase 7 it will be both: an SPA that can be installed and played offline like a native app.

### PWA platform support
- **Android** (best experience): Chrome "Add to Home Screen" or install prompt. Standalone window, offline via service worker.
- **iOS (Safari)**: Share → "Add to Home Screen". Works offline. Minor caveat: iOS may evict SW cache after weeks of inactivity — not an issue for an actively played game.
- **Desktop (Windows/Mac/Linux)**: Chrome/Edge "Install" button — runs in its own window with taskbar/dock icon.

### Security
- The PWA runs in the **browser sandbox** — it has zero access to other apps, the file system, contacts, messages, or any other process on the device.
- No backend server, no database, no user accounts, no personal data collected.
- Once cached, the app makes no network requests at all.
- The only "risk" would be someone modifying their own local copy to cheat — which affects nobody else in single-player mode.
- HTTPS (provided by GitHub Pages / Netlify / Vercel) prevents tampering in transit.
- If multiplayer is added later, the server would become the authority on game state to prevent cheating.

### Deployment to GitHub Pages (planned)
1. Create a new repository on GitHub (e.g., `criss-cross-cribbage`) — don't initialize with README/.gitignore.
2. Link the local repo: `git remote add origin https://github.com/USERNAME/criss-cross-cribbage.git`
3. Push: `git push -u origin master`
4. Enable GitHub Pages with a GitHub Action that runs `npm run build` on push and deploys `dist/`.
5. App will be available at: `https://USERNAME.github.io/criss-cross-cribbage/`
6. Friends/family visit the URL → install as PWA → play offline.
7. **Cost: free** (GitHub Pages is free for public repos; static site, no hosting costs).

### Local testing (before GitHub deployment)
- **`npm run dev`** — dev server at `localhost:5173`; tests all game functionality (SPA), but service worker / PWA install won't fully work.
- **`npm run build` then `npm run preview`** — production build at `localhost:4173`; service worker activates, Chrome allows PWA install on localhost. Best for local PWA testing.
- **`npm run preview --host`** — exposes on local network IP so you can test on your phone (same Wi-Fi). PWA install won't work (no HTTPS) but gameplay and layout are testable.
- **ngrok (optional)** — creates a temporary HTTPS tunnel to localhost for full PWA install testing on mobile devices.

**Phase 6 is complete.**

## Phase 7 – PWA & offline ✅ complete
- **`vite-plugin-pwa`** (Workbox) added as dev dependency; configured in `vite.config.js` with `registerType: 'autoUpdate'`.
- **Web app manifest** generated at build time (`manifest.webmanifest`): `name`, `short_name`, `display: standalone`, `orientation: portrait`, theme/background colors.
- **App icons**:
  - Source: `public/icon.svg` (card-table themed: green felt, grid, sample cards, "CC" monogram).
  - PNGs generated via `scripts/generate-icons.mjs` (uses `sharp`):
    - `public/icon-192.png` (192×192)
    - `public/icon-512.png` (512×512)
    - `public/apple-touch-icon.png` (180×180)
- **Service worker**: Workbox `generateSW` strategy. Precaches all app assets (JS, CSS, HTML, SVG, PNG). 15 entries (~276 KB).
- **`src/main.jsx`**: registers service worker via `virtual:pwa-register` dynamic import.
- **`index.html`**: updated favicon to `icon.svg`, added `apple-touch-icon`, `apple-mobile-web-app-status-bar-style`, and `meta description`.
- **Offline verified**: `npm run build` produces `sw.js`, `workbox-*.js`, `manifest.webmanifest`, icons, and all precached assets.

## Useful references
- Phase 7 checklist: `docs/finish_phase_7_pwa.plan.md`

**All 7 phases are complete.** The game is a fully functional PWA that can be installed on desktop, Android, and iOS and plays entirely offline after the first visit.

## Post-Phase 7 additions

### Difficulty levels (Easy / Medium / Hard)
- **`src/ai/strategy.js`**: refactored into shared `scorePlacementMoves()` and `scoreDiscardMoves()` helpers, with `selectByDifficulty()` choosing how to pick from the ranked moves:
  - **Easy**: 55% fully random, otherwise picks from top half
  - **Medium**: picks randomly from the top 3 moves
  - **Hard**: always picks the best move (ties broken randomly) — original behavior
- `getAIPlacement()` and `getAIDiscard()` now accept an optional `difficulty` parameter (defaults to `'hard'`).
- **`src/Game.jsx`**: start screen shows a difficulty selector (three buttons). Difficulty is passed to AI functions during auto-play.

### Configurable win target
- **`src/game/rules.js`**: `checkGameOver()` now accepts an optional `winTarget` parameter (defaults to `DEFAULT_WIN_TARGET = 31`). `DEFAULT_WIN_TARGET` is exported.
- **`src/Game.jsx`**: start screen shows preset buttons (15, 21, 31, 61). `ScoreTrack` uses the selected target. `checkGameOver()` receives the selected target.

### Hint button
- **`src/ai/strategy.js`**: new `getHint(state)` function — runs the Hard-level evaluation on the human player's position and returns the best move.
- **`src/Game.jsx`**: "Hint" button appears when it's the human's turn. Clicking it highlights the recommended card (gold pulsing glow) and, during placement phase, also highlights the recommended cell on the board. A text message explains the suggestion.

### Rules tab
- **`src/App.jsx`**: new `Rules` component with game overview, round flow, scoring reference table, teams/board explanation, and tips for new players. Added as a "Rules" tab between Game and Tests in the top nav.
- **`src/App.css`**: rules page styles (section headers, scoring table, responsive layout).

*Last updated: Post-Phase 7 additions (difficulty, hints, rules tab, configurable win target).*
