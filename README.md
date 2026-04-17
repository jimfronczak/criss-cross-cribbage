# Criss Cross Cribbage

A 4-player Criss Cross Cribbage (CrossCribb) card game built as a Progressive Web App. You play with one AI partner against two AI opponents on a 5×5 board. Standard cribbage hand scoring; first team to the selected win target (default 31) wins.

**Play it:** https://jimfronczak.github.io/criss-cross-cribbage/

Install as a PWA from the browser and it runs offline on desktop, Android, and iOS.

## Features

- 4-player CrossCribb on a 5×5 grid (your team owns columns, opponents own rows)
- Full cribbage hand scoring: 15s, pairs, runs, flushes, His Heels, His Nobs
- Heuristic AI for partner and opponents
- **Difficulty**: Easy / Medium / Hard
- **Configurable win target**: 15, 21, 31, or 61
- **Hint** button highlights the best card (and cell, in the place phase) for the human player
- Rules tab with a quick reference; state of the current game is preserved when switching tabs
- PWA: installable, offline-capable, responsive layout for phones and desktop

## Development

```bash
npm install
npm run dev        # dev server at localhost:5173
npm run build      # production build into dist/
npm run preview    # preview production build at localhost:4173 (service worker active)
```

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds the site and publishes `dist/` to GitHub Pages at the URL above. The Vite `base` path is configured for subdirectory hosting.

## Project layout

- `src/game/` – pure game logic: `state.js`, `score.js`, `rules.js`, tests
- `src/ai/` – heuristic AI (`strategy.js`) and tests
- `src/Game.jsx`, `src/Game.css` – game UI
- `src/App.jsx`, `src/App.css` – app shell with Game / Rules / Tests tabs
- `docs/` – plans and session notes:
  - `criss_cross_cribbage_game.plan.md` – main plan
  - `finish_phase_*.plan.md` – per-phase checklists (1–7)
  - `SESSION-NOTES.md` – running log of decisions and status

## Status

All 7 phases complete plus post-Phase 7 polish (difficulty levels, hints, rules tab, configurable win target). GitHub Pages deployment is live and verified. Multiplayer with real opponents is documented as a future feature.
