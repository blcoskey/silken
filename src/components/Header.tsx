import { DECKS, GERMAN_DECK_IDS } from '../lib/decks';
import type { AllData } from '../lib/storage';

interface Props {
  deck: string;
  lastDe: string;
  data: AllData;
  onDeck: (id: string) => void;
}

export function Header({ deck, lastDe, data, onDeck }: Props) {
  const zh = DECKS[deck].lang === 'zh';
  return (
    <>
      <div className="top">
        <div className="brand">
          <span className="cube" aria-hidden="true" />
          <b>Silken</b>
        </div>
        <div className="seg" role="group" aria-label="Language">
          <button id="lang-zh" className="han" aria-pressed={zh} onClick={() => onDeck('zh')}>
            中文
          </button>
          <button id="lang-de" aria-pressed={!zh} onClick={() => onDeck(lastDe)}>
            Deutsch
          </button>
        </div>
      </div>
      {!zh && <ThemePicker deck={deck} data={data} onDeck={onDeck} />}
    </>
  );
}

function ThemePicker({ deck, data, onDeck }: Omit<Props, 'lastDe'>) {
  const option = (id: string) => {
    const D = DECKS[id];
    const seen = Object.keys(data[id].cards).length;
    const total = D.base.length + data[id].custom.length;
    return (
      <option key={id} value={id}>
        {D.short} · {seen}/{total}
      </option>
    );
  };
  const [core, ...themes] = GERMAN_DECK_IDS;
  return (
    <div className="themepick">
      <label htmlFor="theme-select">List</label>
      <select id="theme-select" value={deck} onChange={(e) => onDeck(e.target.value)}>
        <optgroup label="Frequency">{option(core)}</optgroup>
        <optgroup label="A1 themes">{themes.map(option)}</optgroup>
      </select>
    </div>
  );
}
