import { DECKS } from '../lib/decks';
import { queues } from '../lib/queues';
import { isKnown, unpack } from '../lib/scheduler';
import { DAY, dayStart } from '../lib/time';
import type { DeckData } from '../lib/types';

interface Props {
  deckId: string;
  d: DeckData;
  onStudy: () => void;
}

export function Today({ deckId, d, onStudy }: Props) {
  const D = DECKS[deckId];
  const q = queues(D, d);
  const total = q.all.length;

  let lrn = 0,
    young = 0,
    mature = 0,
    known = 0;
  for (const w of q.all) {
    const a = d.cards[w.k];
    if (!a) continue;
    if (isKnown(a)) {
      known++;
      continue;
    }
    const c = unpack(a);
    if (c.s !== 'review') lrn++;
    else if (c.ivl >= 21) mature++;
    else young++;
  }
  const unseen = total - lrn - young - mature - known;
  const pct = (n: number) => (100 * n) / Math.max(1, total) + '%';

  const nNew = q.fresh.length;
  const nL = q.learn.length + q.later.length;
  const nR = q.review.length;
  const any = nNew + nL + nR > 0;

  // 7-day review forecast
  const now = Date.now();
  const s0 = dayStart(now);
  const fc = Array<number>(7).fill(0);
  for (const k in d.cards) {
    const c = unpack(d.cards[k]);
    if (c.s !== 'review') continue;
    const i = Math.max(0, Math.floor((c.due - s0) / DAY));
    if (i < 7) fc[i]++;
  }
  const mx = Math.max(1, ...fc);
  const days = ['Today', 'Tmrw'];
  for (let i = 2; i < 7; i++) days.push(new Date(s0 + i * DAY).toLocaleDateString(undefined, { weekday: 'short' }));

  return (
    <>
      <section className="hero">
        <span className="eyebrow">
          {D.name} · {D.list}
        </span>
        <h1>{any ? `${nR + nL} to review, ${nNew} new` : 'All caught up for today'}</h1>
      </section>
      <div className="counts">
        <div className="count">
          <span className="n new">{nNew}</span>
          <span className="l">New</span>
        </div>
        <div className="count">
          <span className="n lrn">{nL}</span>
          <span className="l">Learning</span>
        </div>
        <div className="count">
          <span className="n due">{nR}</span>
          <span className="l">Due</span>
        </div>
      </div>
      <button id="study-btn" className="primary" onClick={onStudy} disabled={!any}>
        {any ? 'Study now' : 'Come back tomorrow'}
      </button>
      <section className="panel">
        <h3>Your list</h3>
        <div
          className="bar"
          role="img"
          aria-label={`${mature} mature, ${young} young, ${lrn} learning, ${known} known, ${unseen} unseen of ${total}`}
        >
          <span style={{ width: pct(mature), background: 'var(--accent)' }} />
          <span style={{ width: pct(young), background: 'var(--accent-soft)' }} />
          <span style={{ width: pct(lrn), background: 'var(--warn)' }} />
          <span style={{ width: pct(known), background: 'var(--muted)' }} />
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--accent)' }} />{mature} mature</span>
          <span><i style={{ background: 'var(--accent-soft)' }} />{young} young</span>
          <span><i style={{ background: 'var(--warn)' }} />{lrn} learning</span>
          {known > 0 && <span><i style={{ background: 'var(--muted)' }} />{known} known</span>}
          <span><i style={{ background: 'var(--line)' }} />{unseen} unseen of {total}</span>
        </div>
      </section>
      <section className="panel">
        <h3>Reviews this week</h3>
        <div className="fc">
          {fc.map((v, i) => (
            <div className="col" key={i}>
              <span className="v">{v}</span>
              <span className={`b ${v ? '' : 'zero'}`} style={{ height: v ? Math.max(4, (70 * v) / mx) : 2 }} />
              <span className="d">{days[i]}</span>
            </div>
          ))}
        </div>
      </section>
      <p className="sync">Progress is saved in this browser. Export a backup from Settings to move it.</p>
    </>
  );
}
