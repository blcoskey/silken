import { useState } from 'react';
import { DECKS } from '../lib/decks';
import { STATUS_CLASS, statusOf, wordsOf } from '../lib/queues';
import { pinyinText } from '../lib/pinyin';
import { parsePasted } from '../lib/importWords';
import { addCustom, markKnown, unmarkKnown } from '../lib/actions';
import type { DeckData } from '../lib/types';
import { GermanWord, Han, Pinyin } from './bits';

interface Props {
  deckId: string;
  d: DeckData;
  onChange: (d: DeckData) => void;
}

export function Words({ deckId, d, onChange }: Props) {
  const D = DECKS[deckId];
  const zh = D.lang === 'zh';
  const [q, setQ] = useState('');
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');

  const all = wordsOf(D, d);
  const needle = q.trim().toLowerCase();
  const list = needle
    ? all.filter((w) => `${w.w} ${w.m} ${w.r ? pinyinText(w.r) + ' ' + w.r : ''}`.toLowerCase().includes(needle))
    : all;

  const doImport = () => {
    const lines = parsePasted(paste, D.lang, new Set(all.map((w) => w.w)));
    if (lines.length) {
      onChange(addCustom(d, lines));
      setPaste('');
      setMsg(`Added ${lines.length} word${lines.length === 1 ? '' : 's'}.`);
    } else {
      setMsg('Nothing new to add. Check the format, or the words are already in the list.');
    }
  };

  return (
    <>
      <input
        id="word-search"
        className="search"
        type="search"
        placeholder={`Search ${D.name} words`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search words"
      />
      <div className="list">
        {list.length === 0 && (
          <div className="row">
            <span />
            <span className="muted">No words match.</span>
            <span />
          </div>
        )}
        {list.map((w) => {
          const st = statusOf(d, w);
          return (
            <div className="row" key={w.k}>
              <span className="r">{w.custom ? '+' : w.rank}</span>
              <div style={{ minWidth: 0 }}>
                <div>
                  {zh ? (
                    <>
                      <span className="w han"><Han w={w.w} r={w.r ?? ''} /></span>
                      <span className="py"><Pinyin r={w.r ?? ''} /></span>
                    </>
                  ) : (
                    <span className="w"><GermanWord w={w} /></span>
                  )}
                </div>
                <div className="m">{w.m}</div>
              </div>
              <div className="rowact">
                {st === 'New' ? (
                  <button className="knowbtn" onClick={() => onChange(markKnown(d, w.k, Date.now()))}>
                    I know it
                  </button>
                ) : st === 'Known' ? (
                  <>
                    <span className={`chip ${STATUS_CLASS[st]}`}>Known</span>
                    <button className="knowbtn" onClick={() => onChange(unmarkKnown(d, w.k))} aria-label={`Undo known: ${w.w}`}>
                      Undo
                    </button>
                  </>
                ) : (
                  <span className={`chip ${STATUS_CLASS[st]}`}>{st}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <section className="panel">
        <h3>Add words</h3>
        <p className="hint">
          {zh ? (
            <>One word per line: <code>汉字 | han4zi4 | meaning</code>. Pinyin uses tone numbers (5 = neutral, v = ü).</>
          ) : (
            <>One word per line: <code>der Tisch | table | pl. Tische</code>. Start nouns with der, die or das to get gender colours.</>
          )}{' '}
          New words go to the end of the list, in the order you paste them.
        </p>
        <textarea
          id="import-box"
          aria-label="Words to add"
          placeholder={zh ? '学生 | xue2sheng5 | student' : 'der Tisch | table | pl. Tische'}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <div className="confirm">
          <button id="import-btn" className="ghost" onClick={doImport}>
            Add to {D.name} list
          </button>
          {msg && <span className="msg">{msg}</span>}
        </div>
      </section>
    </>
  );
}
