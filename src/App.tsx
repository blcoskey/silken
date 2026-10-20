import { useState } from 'react';
import { DECKS } from './lib/decks';
import { loadDeckChoice, saveDeckChoice } from './lib/storage';
import { useStore } from './lib/useStore';
import { Header } from './components/Header';
import { Today } from './components/Today';
import { Words } from './components/Words';
import { Settings } from './components/Settings';
import { Study } from './components/Study';

type Tab = 'today' | 'words' | 'settings';
const TABS: [Tab, string][] = [
  ['today', 'Today'],
  ['words', 'Words'],
  ['settings', 'Settings'],
];

function initialDecks() {
  const saved = loadDeckChoice();
  const deck = saved.deck && DECKS[saved.deck] ? saved.deck : 'zh';
  let lastDe = saved.lastDe && DECKS[saved.lastDe]?.lang === 'de' ? saved.lastDe : 'de';
  if (DECKS[deck].lang === 'de') lastDe = deck;
  return { deck, lastDe };
}

export default function App() {
  const { data, setData, replaceDeck } = useStore();
  const [{ deck, lastDe }, setDecks] = useState(initialDecks);
  const [tab, setTab] = useState<Tab>('today');
  const [studying, setStudying] = useState(false);

  const chooseDeck = (id: string) => {
    const nextLastDe = DECKS[id].lang === 'de' ? id : lastDe;
    setDecks({ deck: id, lastDe: nextLastDe });
    saveDeckChoice(id, nextLastDe);
    setStudying(false);
  };

  const d = data[deck];
  const onChange = (nd: typeof d) => replaceDeck(deck, nd);

  if (studying) {
    // key resets the session when switching decks
    return <Study key={deck} deckId={deck} d={d} onChange={onChange} onExit={() => setStudying(false)} />;
  }

  return (
    <>
      <Header deck={deck} lastDe={lastDe} data={data} onDeck={chooseDeck} />
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} id={`tab-${k}`} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'today' && <Today deckId={deck} d={d} onStudy={() => setStudying(true)} />}
      {tab === 'words' && <Words key={deck} deckId={deck} d={d} onChange={onChange} />}
      {tab === 'settings' && <Settings key={deck} deckId={deck} data={data} onChange={onChange} onReplaceAll={setData} />}
    </>
  );
}
