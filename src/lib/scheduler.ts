import type { Card, Grade, PackedCard } from './types';
import { DAY, MINUTE, dayStart } from './time';

/** Learning steps for new cards and for lapsed reviews. */
export const LEARN_STEPS = [1 * MINUTE, 10 * MINUTE];
export const RELEARN_STEPS = [10 * MINUTE];
/** "I know this" sends a card straight to a review this many days out. */
export const KNOWN_IVL = 120;
const MAX_IVL = 36500;

export function newCard(): Card {
  return { s: 'new', step: 0, ivl: 0, ease: 2.5, lapses: 0, reps: 0, due: 0 };
}

/**
 * SM-2 style scheduler with Anki-like learning steps.
 * Returns a new card; `prev` is not mutated. `null` means the card has never been seen.
 */
export function schedule(prev: Card | null, g: Grade, now: number): Card {
  const c: Card = prev ? { ...prev } : newCard();
  c.reps++;
  const graduate = (ivl: number) => {
    c.s = 'review';
    c.ivl = ivl;
    c.step = 0;
    c.due = dayStart(now) + ivl * DAY;
  };

  if (c.s === 'new') {
    c.s = 'learn';
    c.step = 0;
  }

  if (c.s === 'learn' || c.s === 'relearn') {
    const relearn = c.s === 'relearn';
    const steps = relearn ? RELEARN_STEPS : LEARN_STEPS;
    if (g === 1) {
      c.step = 0;
      c.due = now + steps[0];
    } else if (g === 2) {
      c.due = now + (c.step === 0 && steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[c.step] * 1.5);
    } else if (g === 3) {
      c.step++;
      if (c.step >= steps.length) graduate(relearn ? Math.max(1, c.ivl) : 1);
      else c.due = now + steps[c.step];
    } else {
      graduate(relearn ? Math.max(1, c.ivl) + 1 : 4);
    }
    return c;
  }

  // Review card
  const ivl = c.ivl;
  if (g === 1) {
    c.lapses++;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.ivl = Math.max(1, Math.round(ivl * 0.5));
    c.s = 'relearn';
    c.step = 0;
    c.due = now + RELEARN_STEPS[0];
    return c;
  }
  let next: number;
  if (g === 2) {
    next = Math.max(ivl + 1, ivl * 1.2);
    c.ease = Math.max(1.3, c.ease - 0.15);
  } else if (g === 3) {
    next = Math.max(ivl + 1, ivl * c.ease);
  } else {
    next = Math.max(ivl + 2, ivl * c.ease * 1.3);
    c.ease += 0.15;
  }
  graduate(Math.round(Math.min(next, MAX_IVL)));
  return c;
}

/** A card marked "I know this": a review far out, with reps 0 so it reads as Known until first reviewed. */
export function knownCard(now: number): Card {
  return { s: 'review', due: dayStart(now) + KNOWN_IVL * DAY, ivl: KNOWN_IVL, ease: 2.8, step: 0, lapses: 0, reps: 0 };
}

const SCODE = { learn: 0, review: 1, relearn: 2 } as const;
const SNAME = ['learn', 'review', 'relearn'] as const;

export function pack(c: Card): PackedCard {
  const s = c.s === 'new' ? 'learn' : c.s;
  return [SCODE[s], Math.round(c.due / 1000), c.ivl, Math.round(c.ease * 100), c.step, c.lapses, c.reps];
}

export function unpack(a: PackedCard): Card {
  return { s: SNAME[a[0]] ?? 'learn', due: a[1] * 1000, ivl: a[2], ease: a[3] / 100, step: a[4], lapses: a[5], reps: a[6] };
}

export function isKnown(a: PackedCard | undefined): boolean {
  return !!a && a[0] === 1 && a[6] === 0;
}
