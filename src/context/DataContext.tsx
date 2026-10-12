import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData, Game, GameInput, PlayerProfile } from '../types';
import { STORAGE_KEY, emptyData, loadData, newId, parseAppData, saveData } from '../lib/storage';
import { createDemoData } from '../lib/demoData';

interface DataContextValue {
  data: AppData;
  games: Game[];
  profile: PlayerProfile;
  getGame: (id: string) => Game | undefined;
  addGame: (input: GameInput) => Game;
  updateGame: (id: string, input: GameInput) => void;
  deleteGame: (id: string) => void;
  updateProfile: (profile: PlayerProfile) => void;
  replaceData: (data: AppData) => void;
  loadDemo: () => void;
  clearAll: () => void;
  dismissDemo: () => void;
  saveFailed: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [saveFailed, setSaveFailed] = useState(false);

  // Persistencia: cada cambio se guarda en localStorage.
  useEffect(() => {
    setSaveFailed(!saveData(data));
  }, [data]);

  // Sincroniza si la app está abierta en otra pestaña.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      try {
        const parsed = parseAppData(JSON.parse(e.newValue));
        if (parsed) setData(parsed);
      } catch {
        /* ignorar valores corruptos */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addGame = useCallback((input: GameInput) => {
    const now = new Date().toISOString();
    const game: Game = { ...input, id: newId(), createdAt: now, updatedAt: now };
    setData((d) => ({ ...d, games: [...d.games, game] }));
    return game;
  }, []);

  const updateGame = useCallback((id: string, input: GameInput) => {
    const now = new Date().toISOString();
    setData((d) => ({ ...d, games: d.games.map((g) => (g.id === id ? { ...g, ...input, updatedAt: now } : g)) }));
  }, []);

  const deleteGame = useCallback((id: string) => {
    setData((d) => ({ ...d, games: d.games.filter((g) => g.id !== id) }));
  }, []);

  const updateProfile = useCallback((profile: PlayerProfile) => setData((d) => ({ ...d, profile })), []);
  const replaceData = useCallback((next: AppData) => setData({ ...next, isDemo: false }), []);
  const loadDemo = useCallback(() => setData(createDemoData()), []);
  const clearAll = useCallback(() => setData(emptyData()), []);
  const dismissDemo = useCallback(() => setData((d) => ({ ...d, isDemo: false })), []);

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      games: data.games,
      profile: data.profile,
      getGame: (id) => data.games.find((g) => g.id === id),
      addGame,
      updateGame,
      deleteGame,
      updateProfile,
      replaceData,
      loadDemo,
      clearAll,
      dismissDemo,
      saveFailed,
    }),
    [data, saveFailed, addGame, updateGame, deleteGame, updateProfile, replaceData, loadDemo, clearAll, dismissDemo],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>');
  return ctx;
}
