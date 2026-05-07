/**
 * Per-Game-Mode x Difficulty win/loss stats, persisted to browser localStorage.
 *
 * Storage shape (key = STATS_KEY):
 *   {
 *     version: 2,
 *     byModeDifficulty: {
 *       classic: { easy: {you,them}, medium: {you,them}, hard: {you,them} },
 *       noCrib:  { easy: {you,them}, medium: {you,them}, hard: {you,them} }
 *     }
 *   }
 *
 * "you"  = finished games where Team A (the human) won.
 * "them" = finished games where Team B (the AI opponents) won.
 *
 * Anything stored under an older `version` is treated as empty on load,
 * which gives a one-time clean wipe whenever the schema bumps.
 *
 * All functions are defensive: if localStorage is unavailable (SSR, private
 * mode, quota errors) or contains corrupt data, reads fall back to empty
 * stats and writes become no-ops. This keeps node-based engine tests happy
 * and the app functional even when persistence is blocked.
 */

import { VARIANTS, DEFAULT_VARIANT } from './rules.js';
import { DIFFICULTIES } from '../ai/strategy.js';

export const STATS_KEY = 'cricrib:v1:stats';
export const STATS_VERSION = 2;
export const DEFAULT_DIFFICULTY = 'medium';

function emptyRecord() {
  return { you: 0, them: 0 };
}

function emptyDifficultyMap() {
  const m = {};
  for (const d of DIFFICULTIES) m[d] = emptyRecord();
  return m;
}

export function createEmptyStats() {
  const byModeDifficulty = {};
  for (const v of VARIANTS) byModeDifficulty[v] = emptyDifficultyMap();
  return { version: STATS_VERSION, byModeDifficulty };
}

export const EMPTY_STATS = createEmptyStats();

function getStorage() {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function sanitizeRecord(raw) {
  const rec = emptyRecord();
  if (raw && typeof raw === 'object') {
    if (Number.isFinite(raw.you) && raw.you >= 0) rec.you = Math.floor(raw.you);
    if (Number.isFinite(raw.them) && raw.them >= 0) rec.them = Math.floor(raw.them);
  }
  return rec;
}

function sanitizeDifficultyMap(raw) {
  const map = emptyDifficultyMap();
  if (raw && typeof raw === 'object') {
    for (const d of DIFFICULTIES) {
      map[d] = sanitizeRecord(raw[d]);
    }
  }
  return map;
}

function sanitizeStats(raw) {
  const stats = createEmptyStats();
  if (
    raw &&
    typeof raw === 'object' &&
    raw.version === STATS_VERSION &&
    raw.byModeDifficulty &&
    typeof raw.byModeDifficulty === 'object'
  ) {
    for (const v of VARIANTS) {
      stats.byModeDifficulty[v] = sanitizeDifficultyMap(raw.byModeDifficulty[v]);
    }
  }
  return stats;
}

export function loadStats() {
  const store = getStorage();
  if (!store) return createEmptyStats();
  try {
    const s = store.getItem(STATS_KEY);
    if (!s) return createEmptyStats();
    return sanitizeStats(JSON.parse(s));
  } catch (err) {
    console.warn('[stats] failed to read stats, using empty:', err);
    return createEmptyStats();
  }
}

export function saveStats(stats) {
  const store = getStorage();
  if (!store) return false;
  try {
    store.setItem(STATS_KEY, JSON.stringify(sanitizeStats(stats)));
    return true;
  } catch (err) {
    console.warn('[stats] failed to save stats:', err);
    return false;
  }
}

export function resetStats() {
  const fresh = createEmptyStats();
  saveStats(fresh);
  return fresh;
}

/**
 * Increment the appropriate bucket for a finished game.
 * @param {{ variant?: string, difficulty?: string, winner: 'A'|'B'|null }} game
 * @returns {object} the new stats (also written to storage if available).
 */
export function recordGame({ variant, difficulty, winner }) {
  if (winner !== 'A' && winner !== 'B') return loadStats();
  const mode = VARIANTS.includes(variant) ? variant : DEFAULT_VARIANT;
  const diff = DIFFICULTIES.includes(difficulty) ? difficulty : DEFAULT_DIFFICULTY;
  const stats = loadStats();
  const rec = stats.byModeDifficulty[mode][diff];
  if (winner === 'A') rec.you += 1;
  else rec.them += 1;
  saveStats(stats);
  return stats;
}

function summarizeRecord(rec) {
  const you = rec.you;
  const them = rec.them;
  const total = you + them;
  const winPct = total > 0 ? Math.round((100 * you) / total) : null;
  return { you, them, total, winPct };
}

function addInto(target, rec) {
  target.you += rec.you;
  target.them += rec.them;
}

/**
 * Derive an overall totals object plus per-mode, per-difficulty,
 * and (mode x difficulty) summaries.
 * @param {object} [stats] - defaults to loadStats() if omitted.
 */
export function getSummary(stats) {
  const s = stats ?? loadStats();
  const overallRec = emptyRecord();
  const byModeRec = {};
  const byDifficultyRec = {};
  const byModeDifficulty = {};

  for (const v of VARIANTS) byModeRec[v] = emptyRecord();
  for (const d of DIFFICULTIES) byDifficultyRec[d] = emptyRecord();

  for (const v of VARIANTS) {
    byModeDifficulty[v] = {};
    const diffMap = s.byModeDifficulty?.[v] ?? emptyDifficultyMap();
    for (const d of DIFFICULTIES) {
      const rec = diffMap[d] ?? emptyRecord();
      byModeDifficulty[v][d] = summarizeRecord(rec);
      addInto(byModeRec[v], rec);
      addInto(byDifficultyRec[d], rec);
      addInto(overallRec, rec);
    }
  }

  const byMode = {};
  for (const v of VARIANTS) byMode[v] = summarizeRecord(byModeRec[v]);
  const byDifficulty = {};
  for (const d of DIFFICULTIES) byDifficulty[d] = summarizeRecord(byDifficultyRec[d]);

  return {
    overall: summarizeRecord(overallRec),
    byMode,
    byDifficulty,
    byModeDifficulty,
  };
}
