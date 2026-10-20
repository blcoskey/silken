import { useCallback, useEffect, useState } from 'react';
import type { DeckData } from './types';
import { DECK_IDS } from './decks';
import { loadAll, saveAll, type AllData } from './storage';

/** All deck progress, persisted to localStorage on every change. */
export function useStore() {
  const [data, setData] = useState<AllData>(() => loadAll(DECK_IDS));

  useEffect(() => {
    saveAll(data);
  }, [data]);

  const replaceDeck = useCallback((id: string, d: DeckData) => {
    setData((prev) => (prev[id] === d ? prev : { ...prev, [id]: d }));
  }, []);

  return { data, setData, replaceDeck };
}

export type Store = ReturnType<typeof useStore>;
