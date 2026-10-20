import type { Lang } from './types';

/**
 * Turn pasted text into list lines for a deck. Accepts `|` or tab as separators.
 * Mandarin: `汉字 | han4zi4 | meaning` (pinyin or meaning may be omitted).
 * German: `der Tisch | table | pl. Tische` — a leading der/die/das sets the gender.
 * Words already in `existing` are skipped.
 */
export function parsePasted(text: string, lang: Lang, existing: Set<string>): string[] {
  const seen = new Set(existing);
  const out: string[] = [];
  for (let line of text.split('\n')) {
    line = line.trim();
    if (!line) continue;
    const p = line.split(/\s*[|\t]\s*/);
    if (lang === 'zh') {
      const w = p[0];
      let r = '';
      let m = '';
      if (p.length >= 3) {
        r = p[1];
        m = p.slice(2).join('; ');
      } else if (p.length === 2) {
        if (/[1-5]/.test(p[1]) && /^[A-Za-züv:1-5 ]+$/.test(p[1])) r = p[1];
        else m = p[1];
      }
      if (!w || seen.has(w)) continue;
      out.push([w, r.replace(/\s+/g, ''), m].join('|'));
      seen.add(w);
    } else {
      let w = p[0];
      let g = '';
      const am = w.match(/^(der|die|das)\s+(.+)$/i);
      if (am) {
        g = ({ der: 'm', die: 'f', das: 'n' } as Record<string, string>)[am[1].toLowerCase()];
        w = am[2];
      }
      if (!w || seen.has(w)) continue;
      const m = p[1] ?? '';
      const note = p.slice(2).join('; ');
      out.push(g ? [w, m, g, note].join('|') : [w, m, note].join('|'));
      seen.add(w);
    }
  }
  return out;
}
