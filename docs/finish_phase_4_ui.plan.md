---
name: Finish Phase 4 UI
overview: "Phase 4 of Criss Cross Cribbage: Minimal UI — render the 5×5 board, player hand, scores, and allow the human to place cards while AI plays random moves."
todos: []
isProject: false
---

# Phase 4 – Minimal UI (board and your turn)

Phase 4 is **"Minimal UI – board and your turn only"** from [criss_cross_cribbage_game.plan.md](criss_cross_cribbage_game.plan.md).

---

## Phase 4 steps

| Step | Action | Done when |
| ---- | ------ | --------- |
| 1 | **Render the 5×5 board** – CSS grid, cards in cells, cut card highlighted at center. | Board visible with placed cards and empty cells. |
| 2 | **Render your hand** – Show player 0's cards. Click to select, then click cell to place (or discard button in discard phase). | Hand shows cards, selection works, placement works. |
| 3 | **Show scores and whose turn** – Score display, turn indicator, phase label. AI makes random moves automatically. | Full round playable from deal to score. |

---

## What was added / changed

- **`src/Game.jsx`** – Main game component with:
  - `Board` – 5×5 CSS grid with column/row team labels
  - `PlayerHand` – Human player's hand with card selection
  - `StatusBar` – Phase and turn indicator with contextual messages
  - `RoundResultPanel` – Scoring breakdown (columns, rows, crib, pegging)
  - `CardFace` – Inline card display (rank + suit symbol, red/black coloring)
  - Game state management via React hooks
  - AI auto-play: random moves with 400ms delay per turn
  - Full round flow: New Game → discard → place → score → Next Round / Game Over
- **`src/Game.css`** – Card-game themed styles:
  - Dark navy background (#1a1a2e), green felt board (#16613b)
  - Cards with suit colors (red ♥♦, black ♣♠)
  - Gold highlights for cut card and selected cards
  - Team A (blue) and Team B (red) score colors
  - Responsive card and cell sizing
- **`src/App.jsx`** – Game/Tests toggle nav; game is default view
- **`src/App.css`** – Navigation bar + test dashboard styles
- **`src/index.css`** – Cleaned up from Vite defaults to match game theme

## How to play (Phase 4)

1. Click **New Game** to deal
2. **Discard phase**: Click a card in your hand, then click "Discard to Crib". AI players auto-discard.
3. **Place phase**: Click a card in your hand (highlights gold), then click an empty cell on the board. AI players auto-place randomly.
4. **Score phase**: Round results show column/row/crib scores and who pegs. Click "Next Round" to continue.
5. First team to 31 wins. AI currently plays randomly (Phase 5 adds real strategy).

---

## Phase 4 complete

Phase 4 is **complete**. Phase 5 (AI for partner and opponents) has not been started.
