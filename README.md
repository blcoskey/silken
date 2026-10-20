# Silken

Spaced-repetition flashcards for Mandarin and German frequency lists, in the spirit of TOFU Learn.

- **Mandarin**: about 130 core words in spoken-frequency order, with tone-coloured hanzi and pinyin.
- **German**: about 145 core words in frequency order, plus 12 A1 theme lists (about 690 words) sorted by corpus frequency. Nouns show their article in a gender colour (der blue, die red, das green) and their plural. Many theme words have example sentences.
- **Scheduler**: SM-2 style with Anki-like learning steps (1m, 10m), Again/Hard/Good/Easy, and a study day that rolls over at 4am.
- **"I know this"**: skips a new word and schedules its first check 4 months out.
- **Your own words**: paste them in on the Words tab; they go to the end of the list.
- **Speech**: uses the browser's built-in voices (`speechSynthesis`).

React 18 + TypeScript + Vite. No backend: progress lives in `localStorage`, and Settings → Backup exports and imports it as JSON.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc` only |
| `npm test` | Unit tests (Vitest) for the scheduler, pinyin and paste parsing |

`dist/` is a static site, so it deploys as-is to GitHub Pages, Netlify, Vercel or Cloudflare Pages. For GitHub Pages under a sub-path, set `base: '/<repo>/'` in `vite.config.ts`.

## Layout

```
src/
  main.tsx, App.tsx       entry and top-level state (deck, tab, study mode)
  styles.css              design tokens (light + dark) and all styles
  components/
    Header.tsx            language toggle and German list picker
    Today.tsx             due counts, list progress bar, 7-day forecast
    Study.tsx             card session, grading, keyboard shortcuts, examples
    Words.tsx             searchable list, "I know it", paste-to-add
    Settings.tsx          daily pace, card direction, reset, backup
    bits.tsx              Pinyin / Han / GermanWord / Marked renderers
  lib/
    scheduler.ts          SM-2 scheduler, pack/unpack, known cards
    queues.ts             builds today's learn/review/new queues, picks next card
    actions.ts            pure DeckData updates (grade, mark known, reset…)
    decks.ts              builds DECKS from the data files
    storage.ts            localStorage, backup export/merge
    pinyin.ts             tone numbers → tone marks
    importWords.ts        parses pasted word lists
    time.ts, speech.ts, types.ts
  data/
    zh-core.txt           汉字|pin1yin1|meaning
    de-core.txt           Wort|meaning|m/f/n|note   (nouns)
                          wort|meaning|note         (everything else)
    de-themes.json        [{id, title, desc, words: [same line format]}]
    de-examples.json      {deckId: {word: [["German with *target*", "English"], …]}}
```

## Data formats

Line order is the frequency rank: new cards are introduced from the top. Progress is keyed by the word itself (`w`), so you can reorder lists or fix meanings without losing reviews. Renaming a word resets that word's progress.

**Mandarin** (`zh-core.txt`): pinyin uses tone numbers, `5` for neutral tone, `v` or `u:` for ü. If the number of characters matches the number of syllables, each character is coloured by its tone.

**German**: the third field is `m`, `f` or `n` for nouns, which gives the article and colour; for other words the third field is the note (verb forms, comparatives).

Per-deck progress is stored as:

```ts
interface DeckData {
  cards: Record<word, [state, dueSec, ivlDays, ease*100, step, lapses, reps]>;
  custom: string[];          // pasted lines, same format as the lists
  settings: { newPerDay: number; dir: 'recog' | 'prod' };
  intro: { day: string; n: number };  // new cards introduced today
  updated: number;
}
```

`state` is 0 learning, 1 review, 2 relearning. A review card with `reps === 0` is a "known" card.

## Keyboard

Space reveals the answer, then Space = Good · 1–4 grade · K marks a new card as known · E toggles examples.

## Notes

- Progress from the hosted Claude version doesn't carry over: that copy is saved to your Claude account, and this one is saved in your browser.
- The built-in lists are starter sets, not full corpus exports. Swap in bigger lists by editing the files in `src/data/`.
