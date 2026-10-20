import type { DeckData, Grade } from './types';
import { dayKey } from './time';
import { isKnown, knownCard, pack, schedule } from './scheduler';
import type { Next } from './queues';

/** Shallow-enough copy for immutable updates. */
export function cloneDeck(d: DeckData): DeckData {
  return { ...d, cards: { ...d.cards }, custom: d.custom.slice(), settings: { ...d.settings }, intro: { ...d.intro } };
}

function touched(d: DeckData): DeckData {
  d.updated = Date.now();
  return d;
}

export function gradeCard(d: DeckData, cur: Exclude<Next, null | { kind: 'wait' }>, g: Grade, now: number): DeckData {
  const nd = cloneDeck(d);
  nd.cards[cur.w.k] = pack(schedule(cur.c, g, now));
  if (cur.kind === 'n') {
    const k = dayKey(now);
    if (nd.intro.day !== k) nd.intro = { day: k, n: 0 };
    nd.intro.n++;
  }
  return touched(nd);
}

export function markKnown(d: DeckData, k: string, now: number): DeckData {
  const nd = cloneDeck(d);
  nd.cards[k] = pack(knownCard(now));
  return touched(nd);
}

export function unmarkKnown(d: DeckData, k: string): DeckData {
  if (!isKnown(d.cards[k])) return d;
  const nd = cloneDeck(d);
  delete nd.cards[k];
  return touched(nd);
}

export function resetProgress(d: DeckData): DeckData {
  const nd = cloneDeck(d);
  nd.cards = {};
  nd.intro = { day: '', n: 0 };
  return touched(nd);
}

export function addCustom(d: DeckData, lines: string[]): DeckData {
  const nd = cloneDeck(d);
  nd.custom.push(...lines);
  return touched(nd);
}

export function setSettings(d: DeckData, patch: Partial<DeckData['settings']>): DeckData {
  const nd = cloneDeck(d);
  nd.settings = { ...nd.settings, ...patch };
  return touched(nd);
}
