import zhRaw from '../data/zh-core.txt?raw';
import deRaw from '../data/de-core.txt?raw';
import themes from '../data/de-themes.json';
import examples from '../data/de-examples.json';
import type { Deck, Example, Gender, Lang, Word } from './types';

export const ART: Record<'m' | 'f' | 'n', string> = { m: 'der', f: 'die', n: 'das' };

function lines(raw: string): string[] {
  return raw.split('\n').map((l) => l.trim()).filter(Boolean);
}

/** Mandarin line: `汉字|han4zi4|meaning` */
export function parseZh(line: string, i: number, custom = false): Word {
  const p = line.split('|').map((s) => s.trim());
  return { k: (custom ? 'c:' : '') + p[0], w: p[0], r: p[1] ?? '', m: p[2] ?? '', rank: i + 1, custom };
}

/** German line: `Wort|meaning|m/f/n|note` for nouns, `wort|meaning|note` otherwise. */
export function parseDe(line: string, i: number, custom = false): Word {
  const p = line.split('|').map((s) => s.trim());
  const g = (['m', 'f', 'n'].includes(p[2]) ? p[2] : '') as Gender;
  const note = g ? p[3] ?? '' : p[2] ?? '';
  return { k: (custom ? 'c:' : '') + p[0], w: p[0], m: p[1] ?? '', g, note, rank: i + 1, custom };
}

export function parserFor(lang: Lang) {
  return lang === 'zh' ? parseZh : parseDe;
}

interface Theme {
  id: string;
  title: string;
  desc: string;
  words: string[];
}

export const DECKS: Record<string, Deck> = {
  zh: {
    id: 'zh',
    lang: 'zh',
    name: 'Mandarin',
    short: 'Core words',
    label: '中文',
    speech: 'zh-CN',
    list: 'Spoken frequency · core words',
    base: lines(zhRaw).map((l, i) => parseZh(l, i)),
  },
  de: {
    id: 'de',
    lang: 'de',
    name: 'German',
    short: 'Core words',
    label: 'Deutsch',
    speech: 'de-DE',
    list: 'Frequency · core words',
    base: lines(deRaw).map((l, i) => parseDe(l, i)),
  },
};

for (const t of themes as Theme[]) {
  DECKS['de-' + t.id] = {
    id: 'de-' + t.id,
    lang: 'de',
    name: t.title,
    short: t.title,
    label: 'Deutsch',
    speech: 'de-DE',
    list: 'A1 theme · ' + t.desc,
    base: t.words.map((l, i) => parseDe(l, i)),
  };
}

export const DECK_IDS = Object.keys(DECKS);
export const GERMAN_DECK_IDS = DECK_IDS.filter((id) => DECKS[id].lang === 'de');

const EX = examples as unknown as Record<string, Record<string, Example[]>>;

export function examplesFor(deckId: string, w: Word): Example[] | null {
  if (w.custom) return null;
  return EX[deckId]?.[w.w] ?? null;
}
