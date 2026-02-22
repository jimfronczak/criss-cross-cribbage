/**
 * Game engine public API (state + scoring + rules).
 */

export {
  createDeck,
  shuffle,
  createEmptyBoard,
  createEmptyGameState,
  cardToString,
} from './state.js';

export { scoreHand } from './score.js';

export {
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
