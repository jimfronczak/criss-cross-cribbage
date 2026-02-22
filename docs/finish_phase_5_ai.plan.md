---
name: Finish Phase 5 AI
overview: "Phase 5 of Criss Cross Cribbage: Heuristic AI for partner and opponents — card placement and crib discard strategy."
todos: []
isProject: false
---

# Phase 5 – AI for Partner and Opponents

Phase 5 is **"AI for partner and opponents"** from [criss_cross_cribbage_game.plan.md](criss_cross_cribbage_game.plan.md).

---

## Phase 5 steps

| Step | Action | Done when |
| ---- | ------ | --------- |
| 1 | **Implement AI functions** – `getAIPlacement(state)` and `getAIDiscard(state)` in `src/ai/strategy.js`. | AI returns valid moves based on heuristic evaluation. |
| 2 | **Wire AI into turn loop** – Replace random moves in `Game.jsx` with AI strategy calls. | AI makes deliberate moves during gameplay. |
| 3 | **Implement crib discard** – AI maximises crib value for dealer's team, minimises for opponent. | Crib discard considers team alignment. |

---

## What was added

- **`src/ai/strategy.js`** – Heuristic AI with three exports:
  - `evaluateLine(cards, cutCard)` – Scores a partial (1–4 cards) or complete (5 cards) line using 15s, pairs, and runs. For 5 cards, delegates to `scoreHand`.
  - `getAIPlacement(state)` – For each (card, cell) combination, computes the score delta for the affected column and row. Net = own-line improvement − opponent-line improvement. Picks the best move (ties broken randomly).
  - `getAIDiscard(state)` – For each card: evaluates retained hand value + crib impact. Maximises crib if dealer's team, minimises if not.
- **`src/ai/strategy.test.js`** – Tests: evaluateLine correctness, valid move returns, full AI round without crash, scoring comparison.
- **`src/Game.jsx`** – AI auto-play now calls `getAIPlacement` / `getAIDiscard` instead of random moves.
- **`src/App.jsx`** – Test dashboard includes Phase 5 AI Strategy tests (orange).

## How the AI decides

### Placement
For each legal (card, cell):
1. Gather the column and row cards before and after the hypothetical placement
2. Score each line using `evaluateLine` (partial or complete)
3. Compute delta: `after − before` for both column and row
4. Net = own team's delta − opponent's delta
5. Pick the (card, cell) with the highest net score

### Crib discard
For each card in hand:
1. `retainedValue` = evaluateLine(remaining hand after removing this card)
2. `cribValue` = evaluateLine(current crib + this card)
3. If dealer's team: score = retainedValue + cribValue
4. If not dealer's team: score = retainedValue − cribValue
5. Pick the card with the highest score

---

## Phase 5 complete

Phase 5 is **complete**. Phase 6 (Full game flow and polish) has not been started.
