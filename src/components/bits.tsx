import { Fragment } from 'react';
import { sylls } from '../lib/pinyin';
import { ART } from '../lib/decks';
import type { Word } from '../lib/types';

/** Pinyin with each syllable coloured by tone. */
export function Pinyin({ r }: { r: string }) {
  const s = sylls(r);
  if (!s.length) return <>{r}</>;
  return (
    <>
      {s.map((x, i) => (
        <span key={i} className={`tone${x.tone || 5}`}>
          {x.t}
        </span>
      ))}
    </>
  );
}

/** Hanzi coloured by tone, when the character count matches the syllable count. */
export function Han({ w, r }: { w: string; r: string }) {
  const chars = [...w];
  const s = sylls(r);
  if (chars.length !== s.length) return <>{w}</>;
  return (
    <>
      {chars.map((c, i) => (
        <span key={i} className={`tone${s[i].tone || 5}`}>
          {c}
        </span>
      ))}
    </>
  );
}

/** German word with its article in the gender colour. */
export function GermanWord({ w }: { w: Word }) {
  return (
    <>
      {w.g ? (
        <>
          <span className={`art art-${w.g}`}>{ART[w.g]}</span>{' '}
        </>
      ) : null}
      {w.w}
    </>
  );
}

/** Example sentence with the *target* word highlighted. */
export function Marked({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <span>
      {parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <Fragment key={i}>{p}</Fragment>))}
    </span>
  );
}

export function SpeakerIcon({ waves = true }: { waves?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={
          waves
            ? 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z'
            : 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z'
        }
      />
    </svg>
  );
}
