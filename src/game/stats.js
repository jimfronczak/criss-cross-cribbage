/**
 * Per-Game-Mode win/loss stats, persisted to browser localStorage.
 *
 * Storage shape (key = STATS_KEY):
 *   {
 *     version: 1,
 *     byMode: {
 *       classic: { you: N, them: N },
 *       noCrib:  { you: N, them: N }
 *     }
 *   }
 *
 * "you"  = finished games where Team A (the human) won.
 * "them" = finished games where Team B (the AI opponents) won.
 *
 * All functions are defensive: if localStorage is unavailable (SSR, private
 * mode, quota errors) or contains corrupt data, reads fall back to
 * EMPTY_STATS and writes become no-ops. This keeps node-based engine tests
 * happy and the app functional even when persistence is blocked.
 */

import { VARIANTS, DEFAULT_VARIANT } from './rules.js';

export const STATS_KEY = 'cricrib:v1:stats';
export const STATS_VERSION = 1;

function emptyModeRecord() {
  return { you: 0, them: 0 };
}

export function createEmptyStats() {
  const byMode = {};
  for (const v of VARIANTS) byMode[v] = emptyModeRecord();
  return { version: STATS_VERSION, byMode };
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

function sanitizeModeRecord(raw) {
  const rec = emptyModeRecord();
  if (raw && typeof raw === 'object') {
    if (Number.isFinite(raw.you) && raw.you >= 0) rec.you = Math.floor(raw.you);
    if (Number.isFinite(raw.them) && raw.them >= 0) rec.them = Math.floor(raw.them);
  }
  return rec;
}

function sanitizeStats(raw) {
  const stats = createEmptyStats();
  if (raw && typeof raw === 'object' && raw.byMode && typeof raw.byMode === 'object') {
    for (const v of VARIANTS) {
      stats.byMode[v] = sanitizeModeRecord(raw.byMode[v]);
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
 * @param {{ variant?: string, winner: 'A'|'B'|null }} game
 * @returns {object} the new stats (also written to storage if available).
 */
export function recordGame({ variant, winner }) {
  if (winner !== 'A' && winner !== 'B') return loadStats();
  const mode = VARIANTS.includes(variant) ? variant : DEFAULT_VARIANT;
  const stats = loadStats();
  const rec = stats.byMode[mode];
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

/**
 * Derive an overall totals object plus per-mode summaries.
 * @param {object} [stats] - defaults to loadStats() if omitted.
 */
export function getSummary(stats) {
  const s = stats ?? loadStats();
  const overallRec = emptyModeRecord();
  const byMode = {};
  for (const v of VARIANTS) {
    const rec = s.byMode[v] ?? emptyModeRecord();
    byMode[v] = summarizeRecord(rec);
    overallRec.you += rec.you;
    overallRec.them += rec.them;
  }
  return { overall: summarizeRecord(overallRec), byMode };
}
