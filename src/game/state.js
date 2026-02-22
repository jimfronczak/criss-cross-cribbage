/**
 * Game state and data structures for Criss Cross Cribbage.
 * No UI – pure data and factory functions.
 */

/** @typedef {{ suit: string, rank: number }} Card - suit: 'H'|'D'|'C'|'S', rank: 1-13 (A=1, J=11, Q=12, K=13) */

/** @typedef {{ row: number, col: number } | null} Cell - card at (row,col) or null if empty */

/**
 * 5×5 grid. Your team scores columns (0–4), opponents score rows (0–4).
 * grid[row][col] = Card | null. Center (2,2) is the cut card.
 * @typedef {(Card | null)[][]} Board
 */

/**
 * @typedef {Object} GameState
 * @property {Board} board - 5×5 grid
 * @property {Card} cutCard - the cut card (also shown in center cell)
 * @property {Card[][]} hands - 4 hands, each up to 7 cards (then fewer after placements/discards)
 * @property {Card[]} crib - 4 discards + cut (dealer's team scores this)
 * @property {number} dealerIndex - 0–3
 * @property {number} currentPlayerIndex - 0–3
 * @property {[number, number]} scores - [yourTeamPegs, opponentTeamPegs], 0–31
 * @property {'place' | 'discard'} phase - placing on board or discarding to crib
 */

const SUITS = ['H', 'D', 'C', 'S'];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // A,2..10,J,Q,K

/**
 * Build a full 52-card deck.
 * @returns {Card[]}
 */
export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Shuffle array in place (Fisher–Yates).
 * @param {unknown[]} arr
 * @returns {unknown[]}
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Create an empty 5×5 board (all null).
 * @returns {Board}
 */
export function createEmptyBoard() {
  return Array.from({ length: 5 }, () => Array(5).fill(null));
}

/**
 * Create initial game state: empty board, no hands, no crib, scores at 0.
 * Use this as a base; deal/cut will fill hands and cutCard.
 * @returns {GameState}
 */
export function createEmptyGameState() {
  return {
    board: createEmptyBoard(),
    cutCard: { suit: 'H', rank: 1 }, // placeholder until cut
    hands: [[], [], [], []],
    crib: [],
    dealerIndex: 0,
    currentPlayerIndex: 0,
    scores: [0, 0],
    phase: 'place',
  };
}

/**
 * Format a card for display (e.g. "7H", "JS").
 * @param {Card} card
 * @returns {string}
 */
export function cardToString(card) {
  const r = card.rank === 1 ? 'A' : card.rank === 11 ? 'J' : card.rank === 12 ? 'Q' : card.rank === 13 ? 'K' : String(card.rank);
  return r + card.suit;
}
