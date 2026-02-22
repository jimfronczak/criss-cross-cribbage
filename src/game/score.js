/**
 * Cribbage hand scoring. Standard rules: 15s, pairs, runs, flush, His Nobs.
 * @typedef {{ suit: string, rank: number }} Card
 */

/** Cribbage value for 15s: A=1, 2-10=face, J,Q,K=10 */
const CARD_VALUE = (rank) => (rank >= 10 ? 10 : rank);

/**
 * Count points for 15s (every subset of cards that sums to 15 = 2 pts).
 * @param {Card[]} fiveCards
 * @returns {number}
 */
function countFifteens(fiveCards) {
  const values = fiveCards.map((c) => CARD_VALUE(c.rank));
  let points = 0;
  // All 2^5 - 1 non-empty subsets
  for (let mask = 1; mask < 32; mask++) {
    let sum = 0;
    for (let i = 0; i < 5; i++) {
      if (mask & (1 << i)) sum += values[i];
    }
    if (sum === 15) points += 2;
  }
  return points;
}

/**
 * Count pairs: 2 of same rank = 2 pts. (3 of a kind = 6, 4 of a kind = 12.)
 * @param {Card[]} fiveCards
 * @returns {number}
 */
function countPairs(fiveCards) {
  const ranks = fiveCards.map((c) => c.rank);
  let points = 0;
  for (let i = 0; i < ranks.length; i++) {
    for (let j = i + 1; j < ranks.length; j++) {
      if (ranks[i] === ranks[j]) points += 2;
    }
  }
  return points;
}

/**
 * Count runs: 3+ consecutive ranks, 1 pt per card. Duplicates multiply (e.g. 3,3,4,5 = two 3-card runs = 6 pts).
 * @param {Card[]} fiveCards
 * @returns {number}
 */
function countRuns(fiveCards) {
  const rankCounts = {};
  fiveCards.forEach((c) => {
    rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
  });
  const ranks = Object.keys(rankCounts).map(Number).sort((a, b) => a - b);
  let maxRunPoints = 0;
  for (let start = 0; start < ranks.length; start++) {
    let len = 1;
    let mult = rankCounts[ranks[start]];
    while (start + len < ranks.length && ranks[start + len] === ranks[start] + len) {
      len++;
      mult *= rankCounts[ranks[start + len - 1]];
    }
    if (len >= 3) {
      const points = len * mult;
      if (points > maxRunPoints) maxRunPoints = points;
    }
  }
  return maxRunPoints;
}

/**
 * Flush: 4 cards same suit (not crib) = 4 pts; 5 cards same suit = 5 pts.
 * In crib, only 5-card flush counts = 5 pts.
 * @param {Card[]} fiveCards
 * @param {boolean} isCrib
 * @returns {number}
 */
function countFlush(fiveCards, isCrib) {
  const suitCounts = {};
  fiveCards.forEach((c) => {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  });
  const maxSame = Math.max(...Object.values(suitCounts));
  if (maxSame >= 5) return 5;
  if (!isCrib && maxSame >= 4) return 4;
  return 0;
}

/**
 * His Nobs: Jack in hand with same suit as cut = 1 pt.
 * @param {Card[]} fiveCards - hand (4 cards) + cut (1 card)
 * @param {Card} cutCard - must be same as the 5th card in fiveCards; used for suit
 * @returns {number}
 */
function countNobs(fiveCards, cutCard) {
  const cutSuit = cutCard.suit;
  const hasJackSameSuit = fiveCards.some((c) => c.rank === 11 && c.suit === cutSuit);
  return hasJackSameSuit ? 1 : 0;
}

/**
 * Score one 5-card hand (four hand cards + cut) using standard cribbage rules.
 * @param {Card[]} fiveCards - exactly 5 cards (4 in hand/row/column + cut)
 * @param {boolean} isCrib - true for the crib (flush only counts if all 5 same suit)
 * @param {Card} cutCard - the cut card (used for Nobs and must be one of the five for flush)
 * @returns {number}
 */
export function scoreHand(fiveCards, isCrib, cutCard) {
  if (!fiveCards || fiveCards.length !== 5) return 0;
  let points = 0;
  points += countFifteens(fiveCards);
  points += countPairs(fiveCards);
  points += countRuns(fiveCards);
  points += countFlush(fiveCards, isCrib);
  points += countNobs(fiveCards, cutCard);
  return points;
}
