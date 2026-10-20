import { useRef, useState } from 'react';
import { DECKS, DECK_IDS } from '../lib/decks';
import { wordsOf } from '../lib/queues';
import { resetProgress, setSettings } from '../lib/actions';
import { makeBackup, mergeBackup, type AllData } from '../lib/storage';
import type { DeckData, Direction } from '../lib/types';

/** Steady state is roughly 8 reviews per day for each daily new word, at about 8 seconds a card. */
const PACES = [
  { n: 5, name: 'Light' },
  { n: 10, name: 'Steady' },
  { n: 20, name: 'Focused' },
  { n: 30, name: 'Intense' },
];

interface Props {
  deckId: string;
  data: AllData;
  onChange: (d: DeckData) => void;
  onReplaceAll: (data: AllData) => void;
}

export function Settings({ deckId, data, onChange, onReplaceAll }: Props) {
  const D = DECKS[deckId];
  const d = data[deckId];
  const s = d.settings;
  const total = wordsOf(D, d).length;
  const [confirmReset, setConfirmReset] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const blob = new Blob([makeBackup(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silken-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupMsg('Backup downloaded.');
  };

  const importBackup = async (file: File) => {
    try {
      const { data: merged, changed } = mergeBackup(data, JSON.parse(await file.text()), DECK_IDS);
      onReplaceAll(merged);
      setBackupMsg(changed ? `Restored ${changed} list${changed === 1 ? '' : 's'} from the backup.` : 'Your progress here is already newer than the backup.');
    } catch {
      setBackupMsg("That file isn't a Silken backup.");
    }
  };

  return (
    <>
      <div className="field pace">
        <label>
          Daily pace
          <span className="sub">
            New words a day, taken in frequency order. {D.short || D.name} has {total} words, so{' '}
            {s.newPerDay ? `you'll have seen them all in ${Math.ceil(total / s.newPerDay)} days.` : 'no new words will be added.'}
          </span>
        </label>
        <div className="presets" role="radiogroup" aria-label="Daily pace">
          {PACES.map((p) => (
            <button
              key={p.n}
              id={`pace-${p.n}`}
              role="radio"
              aria-checked={s.newPerDay === p.n}
              onClick={() => onChange(setSettings(d, { newPerDay: p.n }))}
            >
              <b>{p.name}</b>
              <span className="pn">{p.n} new</span>
              <small>
                ~{p.n * 8} reviews · ~{Math.round((p.n * 8 * 8) / 60 / 5) * 5} min
              </small>
            </button>
          ))}
        </div>
        {!PACES.some((p) => p.n === s.newPerDay) && <p className="sub">Currently {s.newPerDay} a day. Pick a pace to change it.</p>}
      </div>

      <div className="field">
        <label htmlFor="dir-select">
          Card direction<span className="sub">What the front of the card shows</span>
        </label>
        <select id="dir-select" value={s.dir} onChange={(e) => onChange(setSettings(d, { dir: e.target.value as Direction }))}>
          <option value="recog">{D.label} → English</option>
          <option value="prod">English → {D.label}</option>
        </select>
      </div>

      <div className="field">
        <label>
          Reset {D.name} progress<span className="sub">Clears every review. Added words stay.</span>
        </label>
        {confirmReset ? (
          <div className="confirm">
            <button
              id="reset-yes"
              className="ghost danger"
              onClick={() => {
                onChange(resetProgress(d));
                setConfirmReset(false);
              }}
            >
              Yes, reset
            </button>
            <button id="reset-no" className="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button id="reset-btn" className="ghost danger" onClick={() => setConfirmReset(true)}>
            Reset
          </button>
        )}
      </div>

      <div className="field">
        <label>
          Backup<span className="sub">All lists, as one JSON file. Importing keeps whichever copy of each list is newer.</span>
        </label>
        <div className="confirm">
          <button id="export-btn" className="ghost" onClick={exportBackup}>
            Export
          </button>
          <button id="import-backup-btn" className="ghost" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            id="import-backup-file"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importBackup(f);
              e.target.value = '';
            }}
          />
        </div>
        {backupMsg && <span className="msg">{backupMsg}</span>}
      </div>

      <p className="sync">Keyboard: Space shows the answer, 1–4 grades it, K marks a new word as known, E toggles examples.</p>
    </>
  );
}
