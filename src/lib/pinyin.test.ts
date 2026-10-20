import { describe, expect, it } from 'vitest';
import { pinyinText, syllable, sylls } from './pinyin';
import { parsePasted } from './importWords';

describe('pinyin', () => {
  it.each([
    ['zhong1', 'zhōng'],
    ['guo2', 'guó'],
    ['nv3', 'nǚ'],
    ['lu:4', 'lǜ'],
    ['gou3', 'gǒu'],
    ['liu2', 'liú'],
    ['xiu1', 'xiū'],
    ['de5', 'de'],
    ['Zhong1', 'Zhōng'],
  ])('%s → %s', (input, out) => {
    expect(syllable(input).t).toBe(out);
  });

  it('splits multi-syllable words and keeps tones', () => {
    expect(sylls('dui4bu5qi3').map((s) => s.tone)).toEqual([4, 5, 3]);
    expect(pinyinText('zen3me5yang4')).toBe('zěnmeyàng');
  });
});

describe('parsePasted', () => {
  it('reads German articles as gender and skips duplicates', () => {
    const out = parsePasted('der Tisch | table | pl. Tische\nTisch | again\nschnell | fast', 'de', new Set(['Haus']));
    expect(out).toEqual(['Tisch|table|m|pl. Tische', 'schnell|fast|']);
  });

  it('reads Mandarin with and without pinyin', () => {
    const out = parsePasted('学生 | xue2sheng5 | student\n老师\tteacher', 'zh', new Set());
    expect(out).toEqual(['学生|xue2sheng5|student', '老师||teacher']);
  });
});
