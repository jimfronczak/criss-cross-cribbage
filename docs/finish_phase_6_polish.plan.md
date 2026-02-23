# Phase 6 – Full game flow and polish

## Goals
Close remaining UX gaps, add visual feedback, and make the game responsive on mobile and desktop.

## Steps

### 1. Crib reveal in round result panel
- [x] Show all 4 crib cards + cut card face-up in `RoundResultPanel`
- [x] Display crib score next to the cards

### 2. Dealer badge
- [x] Add a gold "D" badge next to every player whose turn it is to deal
- [x] Show which team owns the crib in the header meta

### 3. Score track / progress bars
- [x] Visual progress bars showing each team's score toward 31
- [x] Animated fill transitions on score change

### 4. Round counter
- [x] Track and display current round number in header

### 5. Card placement animation
- [x] `cell-pop` keyframe: cards that appear on the board scale in smoothly

### 6. Responsive CSS
- [x] `@media (max-width: 600px)` breakpoint: shrink board cells, hand cards, card backs
- [x] `@media (max-width: 400px)` breakpoint: further reduce sizes for small phones

### 7. Touch / mobile
- [x] `user-scalable=no` on viewport meta (prevents accidental zoom)
- [x] `apple-mobile-web-app-capable` meta
- [x] `theme-color` meta set to game background (`#1a1a2e`)

### 8. Verify
- [x] `npx vite build` succeeds with no errors
- [x] No lint errors

## Files changed
- `src/Game.jsx` – ScoreTrack component, dealer badges, round counter, crib reveal
- `src/Game.css` – Score track, dealer badge, crib reveal, cell-pop animation, responsive breakpoints
- `index.html` – Mobile viewport meta tags, page title
- `docs/SESSION-NOTES.md` – Updated with Phase 6 notes
