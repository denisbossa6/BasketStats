import type { AppData, Game, PlayerProfile } from '../types';
import { STAT_KEYS } from './stats';
import { createDemoData } from './demoData';

export const STORAGE_KEY = 'basketstats:data:v1';

export const DEFAULT_PROFILE: PlayerProfile = { name: '', team: '', position: '', number: '' };

export function emptyData(): AppData {
  return { version: 1, profile: { ...DEFAULT_PROFILE }, games: [], isDemo: false };
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const int = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);

/** Normaliza un partido leído de almacenamiento o de un archivo importado. */
function normalizeGame(raw: unknown): Game | null {
  if (!isRecord(raw)) return null;
  const date = str(raw.date);
  const opponent = str(raw.opponent).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !opponent) return null;
  const now = new Date().toISOString();
  const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, int(raw[k])]));
  return {
    ...(stats as unknown as Game),
    id: str(raw.id) || newId(),
    date,
    opponent,
    venue: raw.venue === 'visitante' ? 'visitante' : 'local',
    teamScore: int(raw.teamScore),
    opponentScore: int(raw.opponentScore),
    notes: str(raw.notes),
    createdAt: str(raw.createdAt, now),
    updatedAt: str(raw.updatedAt, now),
  };
}

/** Valida datos desconocidos (localStorage o JSON importado). Devuelve null si no son válidos. */
export function parseAppData(raw: unknown): AppData | null {
  if (!isRecord(raw) || !Array.isArray(raw.games)) return null;
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const seen = new Set<string>();
  const games: Game[] = [];
  for (const item of raw.games) {
    const game = normalizeGame(item);
    if (!game) continue;
    if (seen.has(game.id)) game.id = newId();
    seen.add(game.id);
    games.push(game);
  }
  return {
    version: 1,
    profile: {
      name: str(profile.name),
      team: str(profile.team),
      position: str(profile.position),
      number: str(profile.number),
    },
    games,
    isDemo: raw.isDemo === true,
  };
}

/**
 * Carga los datos guardados. En la primera visita (sin datos) muestra el
 * ejemplo para que la app no arranque vacía.
 */
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return createDemoData();
    return parseAppData(JSON.parse(stored)) ?? emptyData();
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
