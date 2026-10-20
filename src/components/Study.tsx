import { useEffect, useMemo, useRef, useState } from 'react';
import { ART, DECKS, examplesFor } from '../lib/decks';
import { pickNext, queues, type Next } from '../lib/queues';
import { schedule } from '../lib/scheduler';
import { fmtIvl } from '../lib/time';
import { gradeCard, markKnown } from '../lib/actions';
import { canSpeak, say } from '../lib/speech';
import type { Deck, DeckData, Direction, Grade, Word } from '../lib/types';
import { GermanWord, Han, Marked, Pinyin, SpeakerIcon } from './bits';

interface Props {
  deckId: string;
  d: DeckData;
  onChange: (d: DeckData) => void;
  onExit: () => void;
}

interface Session {
  next: Next;
  flip: boolean;
  shown: boolean;
  done: number;
  skipped: number;
  exOpen: boolean;
  exEn: Record<number, boolean>;
}

type Active = Exclude<Next, null | { kind: 'wait' }>;
const GRADES: Grade[] = [1, 2, 3, 4];
const GRADE_LABEL = ['Again', 'Hard', 'Good', 'Easy'];

export function Study({ deckId, d, onChange, onExit }: Props) {
  const D = DECKS[deckId];
  const [s, setS] = useState<Session>(() => {
    const { next, flip } = pickNext(queues(D, d), false, false);
    return { next, flip, shown: false, done: 0, skipped: 0, exOpen: false, exEn: {} };
  });
  const q = useMemo(() => queues(D, d), [D, d]);
  const counts = { n: q.fresh.length, l: q.learn.length + q.later.length, r: q.review.length };

  const cur = s.next && s.next.kind !== 'wait' ? (s.next as Active) : null;
  const ex = cur && D.lang === 'de' ? examplesFor(deckId, cur.w) : null;

  const advance = (nd: DeckData, patch: Partial<Session>, ahead = false) => {
    const { next, flip } = pickNext(queues(D, nd), s.flip, ahead);
    setS({ ...s, ...patch, next, flip, shown: false, exOpen: false, exEn: {} });
  };

  const grade = (g: Grade) => {
    if (!cur || !s.shown) return;
    const nd = gradeCard(d, cur, g, Date.now());
    onChange(nd);
    advance(nd, { done: s.done + 1 });
  };

  const known = () => {
    if (!cur || cur.kind !== 'n') return;
    const nd = markKnown(d, cur.w.k, Date.now());
    onChange(nd);
    advance(nd, { skipped: s.skipped + 1 });
  };

  const reveal = () => setS({ ...s, shown: true });
  const toggleEx = () => setS({ ...s, exOpen: !s.exOpen });

  // Keyboard shortcuts. A ref keeps the listener stable while reading fresh state.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e) => {
    if (!cur) return;
    if ((e.target as HTMLElement).matches?.('input,textarea,select')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (!s.shown) {
        e.preventDefault();
        reveal();
      } else if (e.key === ' ') {
        e.preventDefault();
        grade(3);
      }
    } else if (['1', '2', '3', '4'].includes(e.key) && s.shown) grade(+e.key as Grade);
    else if ((e.key === 'k' || e.key === 'K') && cur.kind === 'n') known();
    else if ((e.key === 'e' || e.key === 'E') && s.shown && ex) toggleEx();
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const k = cur?.kind ?? '';
  let inner;
  if (!s.next) {
    inner = (
      <div className="done">
        <h2>Done for today</h2>
        <p className="muted">
          {s.done} card{s.done === 1 ? '' : 's'} studied{s.skipped ? `, ${s.skipped} marked as known` : ''}. New words unlock again tomorrow.
        </p>
        <button id="back-btn" className="primary" onClick={onExit}>
          Back to Today
        </button>
      </div>
    );
  } else if (s.next.kind === 'wait') {
    inner = (
      <div className="done">
        <h2>Next card in {fmtIvl(s.next.ms)}</h2>
        <p className="muted">Only learning cards are left, and they aren't due yet.</p>
        <div className="confirm" style={{ justifyContent: 'center' }}>
          <button id="ahead-btn" className="ghost" onClick={() => advance(d, {}, true)}>
            Study it now
          </button>
          <button id="back-btn" className="primary" onClick={onExit}>
            Back to Today
          </button>
        </div>
      </div>
    );
  } else if (cur) {
    const now = Date.now();
    const w = cur.w;
    inner = (
      <>
        <div className="block" aria-live="polite">
          <span className="rank">{w.custom ? 'ADDED' : '#' + w.rank}</span>
          <span className="tag">{cur.kind === 'n' ? 'New' : cur.kind === 'l' ? 'Learning' : 'Review'}</span>
          {s.shown ? (
            <CardBack
              deck={D}
              w={w}
              ex={ex}
              exOpen={s.exOpen}
              exEn={s.exEn}
              onToggleEx={toggleEx}
              onToggleEn={(i) => setS({ ...s, exEn: { ...s.exEn, [i]: !s.exEn[i] } })}
            />
          ) : (
            <CardFront deck={D} w={w} dir={d.settings.dir} />
          )}
        </div>
        {s.shown ? (
          <div className="answers">
            {GRADES.map((g) => (
              <button key={g} id={`grade-${g}`} className={`g${g}`} onClick={() => grade(g)}>
                {GRADE_LABEL[g - 1]}
                <small>{fmtIvl(schedule(cur.c, g, now).due - now)}</small>
              </button>
            ))}
          </div>
        ) : (
          <button id="reveal-btn" className="primary reveal" onClick={reveal}>
            Show answer
          </button>
        )}
        {cur.kind === 'n' && (
          <button id="known-btn" className="ghost knowcard" onClick={known}>
            I know this already
            <small>Skip it · next check in 4 months · doesn't use a new slot</small>
          </button>
        )}
        <p className="kbd">
          Space to reveal · 1 Again · 2 Hard · 3 Good · 4 Easy{cur.kind === 'n' ? ' · K I know this' : ''}
        </p>
      </>
    );
  }

  return (
    <div className="study">
      <div className="studybar">
        <button id="exit-btn" className="ghost" onClick={onExit}>
          ← {D.name}
        </button>
        <div className="left" aria-label={`Remaining: ${counts.n} new, ${counts.l} learning, ${counts.r} due`}>
          <span className={`a ${k === 'n' ? 'cur' : ''}`}>{counts.n}</span>
          <span className={`b ${k === 'l' ? 'cur' : ''}`}>{counts.l}</span>
          <span className={`c ${k === 'r' ? 'cur' : ''}`}>{counts.r}</span>
        </div>
      </div>
      {inner}
    </div>
  );
}

function CardFront({ deck, w, dir }: { deck: Deck; w: Word; dir: Direction }) {
  if (dir === 'prod') {
    return (
      <>
        <div className="prompt">{w.m}</div>
        {deck.lang === 'de' && w.g && <div className="note">noun</div>}
      </>
    );
  }
  return <div className={`word ${deck.lang === 'zh' ? 'han' : ''}`}>{w.w}</div>;
}

interface BackProps {
  deck: Deck;
  w: Word;
  ex: [string, string][] | null;
  exOpen: boolean;
  exEn: Record<number, boolean>;
  onToggleEx: () => void;
  onToggleEn: (i: number) => void;
}

function CardBack({ deck, w, ex, exOpen, exEn, onToggleEx, onToggleEn }: BackProps) {
  const speakWord = () => {
    const text = deck.lang === 'de' && w.g ? ART[w.g] + ' ' + w.w : w.w.replace(' · ', ', ');
    say(text, deck.speech);
  };
  const speakBtn = canSpeak && (
    <button id="speak-btn" className="speak" onClick={speakWord} aria-label="Play pronunciation">
      <SpeakerIcon />
    </button>
  );

  if (deck.lang === 'zh') {
    return (
      <>
        <div className="word han"><Han w={w.w} r={w.r ?? ''} /></div>
        <div className="reading"><Pinyin r={w.r ?? ''} /></div>
        <div className="divider" />
        <div className="meaning">{w.m}</div>
        {speakBtn}
      </>
    );
  }

  return (
    <>
      <div className="word"><GermanWord w={w} /></div>
      <div className="divider" />
      <div className="meaning">{w.m}</div>
      {w.note && <div className="note">{w.note}</div>}
      {speakBtn}
      {ex &&
        (exOpen ? (
          <div className="ex" id="ex-panel">
            {ex.map(([de, en], i) => (
              <div className="exrow" key={i}>
                <button className="exde" onClick={() => onToggleEn(i)} aria-expanded={!!exEn[i]}>
                  <Marked text={de} />
                  {exEn[i] ? <span className="exen">{en}</span> : <span className="exhint">Tap for English</span>}
                </button>
                {canSpeak && (
                  <button className="speak sm" onClick={() => say(de.replace(/\*/g, ''), deck.speech)} aria-label={`Play sentence ${i + 1}`}>
                    <SpeakerIcon waves={false} />
                  </button>
                )}
              </div>
            ))}
            <button className="exbtn" onClick={onToggleEx} aria-expanded="true" aria-controls="ex-panel">
              Hide examples
            </button>
          </div>
        ) : (
          <button id="ex-btn" className="exbtn" onClick={onToggleEx} aria-expanded="false">
            Examples · {ex.length}
          </button>
        ))}
    </>
  );
}
