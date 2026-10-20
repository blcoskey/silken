import { describe, expect, it } from 'vitest';
import { KNOWN_IVL, isKnown, knownCard, pack, schedule, unpack } from './scheduler';
import { DAY, MINUTE, dayStart } from './time';

const NOW = new Date(2026, 9, 20, 12, 0, 0).getTime();

describe('schedule', () => {
  it('walks a new card through learning steps to a 1-day review', () => {
    let c = schedule(null, 3, NOW);
    expect(c.s).toBe('learn');
    expect(c.due - NOW).toBe(10 * MINUTE);
    c = schedule(c, 3, c.due);
    expect(c.s).toBe('review');
    expect(c.ivl).toBe(1);
  });

  it('Easy on a new card graduates straight to 4 days', () => {
    const c = schedule(null, 4, NOW);
    expect(c.s).toBe('review');
    expect(c.ivl).toBe(4);
    expect(c.due).toBe(dayStart(NOW) + 4 * DAY);
  });

  it('Again on a new card restarts at the 1-minute step', () => {
    const c = schedule(null, 1, NOW);
    expect(c.due - NOW).toBe(MINUTE);
  });

  it('grows review intervals by ease and lapses on Again', () => {
    let c = schedule(null, 4, NOW); // 4d
    c = schedule(c, 3, c.due); // 4 * 2.5 = 10d
    expect(c.ivl).toBe(10);
    const lapsed = schedule(c, 1, c.due);
    expect(lapsed.s).toBe('relearn');
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.ivl).toBe(5);
    expect(lapsed.ease).toBeCloseTo(2.3);
    const back = schedule(lapsed, 3, lapsed.due);
    expect(back.s).toBe('review');
    expect(back.ivl).toBe(5);
  });

  it('never drops ease below 1.3', () => {
    let c = schedule(null, 4, NOW);
    for (let i = 0; i < 20; i++) c = schedule(c, 2, c.due);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('does not mutate the previous card', () => {
    const a = schedule(null, 4, NOW);
    const copy = { ...a };
    schedule(a, 3, a.due);
    expect(a).toEqual(copy);
  });
});

describe('pack / unpack', () => {
  it('round-trips a card', () => {
    const c = schedule(schedule(null, 4, NOW), 3, NOW + 5 * DAY);
    const back = unpack(pack(c));
    expect(back.s).toBe(c.s);
    expect(back.ivl).toBe(c.ivl);
    expect(back.ease).toBeCloseTo(c.ease);
    expect(Math.abs(back.due - c.due)).toBeLessThan(1000);
  });

  it('marks known cards until their first review', () => {
    const k = pack(knownCard(NOW));
    expect(isKnown(k)).toBe(true);
    expect(unpack(k).ivl).toBe(KNOWN_IVL);
    expect(isKnown(pack(schedule(unpack(k), 3, NOW)))).toBe(false);
  });
});
