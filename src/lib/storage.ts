import type { DeckData } from './types';

export const STORAGE_KEY = 'silken-decks-v1';
const DECK_KEY = STORAGE_KEY + '-deck';
const LAST_DE_KEY = STORAGE_KEY + '-de';

export type AllData = Record<string, DeckData>;

export function blankDeck(): DeckData {
  return { v: 1, cards: {}, custom: [], settings: { newPerDay: 10, dir: 'recog' }, intro: { day: '', n: 0 }, updated: 0 };
}

/** Accept anything that looks like saved deck data and fill in missing fields. */
export function normalize(d: unknown): DeckData {
  const b = blankDeck();
  if (!d || typeof d !== 'object') return b;
  const o = d as Partial<DeckData>;
  return {
    v: 1,
    cards: o.cards && typeof o.cards === 'object' ? { ...o.cards } : {},
    custom: Array.isArray(o.custom) ? o.custom.slice() : [],
    settings: { ...b.settings, ...(o.settings ?? {}) },
    intro: { ...b.intro, ...(o.intro ?? {}) },
    updated: Number(o.updated) || 0,
  };
}

export function loadAll(ids: string[]): AllData {
  const out: AllData = {};
  let saved: Record<string, unknown> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch {
    /* storage blocked or corrupt: start fresh */
  }
  for (const id of ids) out[id] = normalize(saved[id]);
  return out;
}

export function saveAll(data: AllData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota or private mode: progress stays in memory for this visit */
  }
}

export function loadDeckChoice(): { deck: string | null; lastDe: string | null } {
  try {
    return { deck: localStorage.getItem(DECK_KEY), lastDe: localStorage.getItem(LAST_DE_KEY) };
  } catch {
    return { deck: null, lastDe: null };
  }
}

export function saveDeckChoice(deck: string, lastDe: string): void {
  try {
    localStorage.setItem(DECK_KEY, deck);
    localStorage.setItem(LAST_DE_KEY, lastDe);
  } catch {
    /* ignore */
  }
}

/**
 * Merge an exported backup into current data. For each deck the newer copy
 * (by `updated`) wins. Returns the merged data and how many decks changed.
 */
export function mergeBackup(current: AllData, backup: unknown, ids: string[]): { data: AllData; changed: number } {
  if (!backup || typeof backup !== 'object') throw new Error('not a backup');
  const src = ('decks' in backup ? (backup as { decks: unknown }).decks : backup) as Record<string, unknown>;
  const data: AllData = { ...current };
  let changed = 0;
  for (const id of ids) {
    if (!(id in src)) continue;
    const incoming = normalize(src[id]);
    if (incoming.updated > current[id].updated) {
      data[id] = incoming;
      changed++;
    }
  }
  return { data, changed };
}

export function makeBackup(data: AllData): string {
  return JSON.stringify({ app: 'silken', version: 1, exported: new Date().toISOString(), decks: data }, null, 1);
}
