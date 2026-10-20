import type { Card, Deck, DeckData, Word } from './types';
import { DAY, dayKey, dayStart } from './time';
import { isKnown, unpack } from './scheduler';
import { parserFor } from './decks';

export function wordsOf(deck: Deck, d: DeckData): Word[] {
  const parse = parserFor(deck.lang);
  const n = deck.base.length;
  return deck.base.concat(d.custom.map((l, i) => parse(l, n + i, true)));
}

export function introToday(d: DeckData, now = Date.now()): number {
  return d.intro.day === dayKey(now) ? d.intro.n : 0;
}

export interface Due {
  w: Word;
  c: Card;
}

export interface Queues {
  /** Learning cards due now. */
  learn: Due[];
  /** Learning cards due later today. */
  later: Due[];
  /** Review cards due by end of today. */
  review: Due[];
  /** New cards still available today, in list order. */
  fresh: Word[];
  all: Word[];
}

export function queues(deck: Deck, d: DeckData, now = Date.now()): Queues {
  const all = wordsOf(deck, d);
  const end = dayStart(now) + DAY;
  const learn: Due[] = [];
  const later: Due[] = [];
  const review: Due[] = [];
  const fresh: Word[] = [];
  for (const w of all) {
    const a = d.cards[w.k];
    if (!a) {
      fresh.push(w);
      continue;
    }
    const c = unpack(a);
    if (c.s === 'review') {
      if (c.due < end) review.push({ w, c });
    } else if (c.due <= now) learn.push({ w, c });
    else if (c.due < end) later.push({ w, c });
  }
  const byDue = (a: Due, b: Due) => a.c.due - b.c.due;
  learn.sort(byDue);
  later.sort(byDue);
  review.sort(byDue);
  const newLeft = Math.max(0, d.settings.newPerDay - introToday(d, now));
  return { learn, later, review, fresh: fresh.slice(0, newLeft), all };
}

export type Status = 'New' | 'Known' | 'Learning' | 'Young' | 'Mature';

export function statusOf(d: DeckData, w: Word): Status {
  const a = d.cards[w.k];
  if (!a) return 'New';
  if (isKnown(a)) return 'Known';
  const c = unpack(a);
  if (c.s !== 'review') return 'Learning';
  return c.ivl >= 21 ? 'Mature' : 'Young';
}

export const STATUS_CLASS: Record<Status, string> = {
  New: 'c-new',
  Known: 'c-known',
  Learning: 'c-lrn',
  Young: 'c-young',
  Mature: 'c-mature',
};

export type Next =
  | { kind: 'n'; w: Word; c: null }
  | { kind: 'l' | 'r'; w: Word; c: Card }
  | { kind: 'wait'; ms: number }
  | null;

/**
 * Pick the next card. Learning cards due now come first; then reviews and new
 * cards alternate; then learning cards due within 20 minutes (or any, with `ahead`).
 */
export function pickNext(q: Queues, flip: boolean, ahead: boolean, now = Date.now()): { next: Next; flip: boolean } {
  if (q.learn.length) return { next: { ...q.learn[0], kind: 'l' }, flip };
  if (q.review.length || q.fresh.length) {
    const f = !flip;
    if (q.review.length && (!q.fresh.length || f)) return { next: { ...q.review[0], kind: 'r' }, flip: f };
    return { next: { w: q.fresh[0], c: null, kind: 'n' }, flip: f };
  }
  if (q.later.length) {
    const first = q.later[0];
    if (first.c.due - now <= 20 * 60e3 || ahead) return { next: { ...first, kind: 'l' }, flip };
    return { next: { kind: 'wait', ms: first.c.due - now }, flip };
  }
  return { next: null, flip };
}
