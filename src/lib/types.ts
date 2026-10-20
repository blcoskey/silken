export type Lang = 'zh' | 'de';
export type Gender = 'm' | 'f' | 'n' | '';
export type Direction = 'recog' | 'prod';

/** One entry in a word list. */
export interface Word {
  /** Stable key used to store progress. Custom words are prefixed with `c:`. */
  k: string;
  /** The word itself (hanzi for Mandarin, the bare word for German). */
  w: string;
  /** English meaning. */
  m: string;
  /** Mandarin only: pinyin with tone numbers, e.g. `zhong1guo2`. */
  r?: string;
  /** German nouns only: grammatical gender. */
  g?: Gender;
  /** German only: plural, verb forms, comparison. */
  note?: string;
  /** 1-based position in the list (frequency rank). */
  rank: number;
  custom: boolean;
}

export interface Deck {
  id: string;
  lang: Lang;
  name: string;
  short: string;
  /** Language label used on card-direction options. */
  label: string;
  /** BCP-47 tag for speech synthesis. */
  speech: string;
  /** Subtitle shown above the Today heading. */
  list: string;
  base: Word[];
}

export type CardState = 'new' | 'learn' | 'review' | 'relearn';

export interface Card {
  s: CardState;
  /** Epoch ms. */
  due: number;
  /** Interval in days (review cards). */
  ivl: number;
  ease: number;
  step: number;
  lapses: number;
  reps: number;
}

/** Compact storage form: [state, dueSec, ivl, ease*100, step, lapses, reps]. */
export type PackedCard = [number, number, number, number, number, number, number];

export interface DeckSettings {
  newPerDay: number;
  dir: Direction;
}

export interface DeckData {
  v: 1;
  cards: Record<string, PackedCard>;
  /** Pipe-separated lines added by the user, in the same format as the built-in lists. */
  custom: string[];
  settings: DeckSettings;
  /** How many new cards were introduced on `day`. */
  intro: { day: string; n: number };
  updated: number;
}

export type Grade = 1 | 2 | 3 | 4;

/** Example sentence: German with the target word wrapped in *asterisks*, then English. */
export type Example = [string, string];
