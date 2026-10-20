export interface Syllable {
  /** Syllable with a tone mark, e.g. `zhōng`. */
  t: string;
  /** 1–4, 5 for neutral, 0 if unparsed. */
  tone: number;
}

const MARKS: Record<string, string> = {
  a: 'āáǎàa',
  e: 'ēéěèe',
  i: 'īíǐìi',
  o: 'ōóǒòo',
  u: 'ūúǔùu',
  ü: 'ǖǘǚǜü',
};

/** Convert one numbered syllable (`zhong1`, `nv3`, `lu:4`) to a marked one. */
export function syllable(s: string): Syllable {
  const m = s.match(/^([A-Za-zÜüv:]+)([1-5])$/);
  if (!m) return { t: s, tone: 0 };
  const base = m[1].replace(/u:/g, 'ü').replace(/v/g, 'ü').replace(/V/g, 'Ü');
  const tone = +m[2];
  const low = base.toLowerCase();
  // Placement rule: a or e takes the mark; in "ou" the o does; otherwise the last vowel.
  let idx = low.indexOf('a');
  if (idx < 0) idx = low.indexOf('e');
  if (idx < 0) idx = low.indexOf('ou');
  if (idx < 0) {
    for (let i = low.length - 1; i >= 0; i--) {
      if ('iouü'.includes(low[i])) {
        idx = i;
        break;
      }
    }
  }
  if (idx < 0) return { t: base, tone };
  let rep = MARKS[low[idx]][tone - 1];
  if (base[idx] !== low[idx]) rep = rep.toUpperCase();
  return { t: base.slice(0, idx) + rep + base.slice(idx + 1), tone };
}

/** Split a numbered pinyin string (`dui4bu5qi3`) into marked syllables. */
export function sylls(r: string): Syllable[] {
  return (r.match(/[A-Za-zÜüv:]+[1-5]/g) ?? []).map(syllable);
}

/** Marked pinyin as plain text, for search. */
export function pinyinText(r: string): string {
  return sylls(r)
    .map((s) => s.t)
    .join('');
}
