import type { Game, GameStats, StatKey } from '../types';

export const STAT_KEYS: StatKey[] = [
  'minutes',
  'points',
  'rebounds',
  'assists',
  'steals',
  'blocks',
  'turnovers',
  'fouls',
  'fgMade',
  'fgAttempted',
  'threeMade',
  'threeAttempted',
  'ftMade',
  'ftAttempted',
];

export type Result = 'W' | 'L';

export function gameResult(game: Pick<Game, 'teamScore' | 'opponentScore'>): Result {
  return game.teamScore > game.opponentScore ? 'W' : 'L';
}

/** Porcentaje (0-100) o null si no hubo intentos. */
export function pct(made: number, attempted: number): number | null {
  return attempted > 0 ? (made / attempted) * 100 : null;
}

/** Puntos que corresponden a los tiros anotados. */
export function pointsFromShots(s: Pick<GameStats, 'fgMade' | 'threeMade' | 'ftMade'>): number {
  return s.fgMade * 2 + s.threeMade + s.ftMade;
}

/** Valoración clásica (EFF): aportes positivos menos tiros fallados y pérdidas. */
export function efficiency(g: GameStats): number {
  return (
    g.points +
    g.rebounds +
    g.assists +
    g.steals +
    g.blocks -
    (g.fgAttempted - g.fgMade) -
    (g.ftAttempted - g.ftMade) -
    g.turnovers
  );
}

export function sortByDate<T extends Pick<Game, 'date' | 'createdAt'>>(games: T[], dir: 'asc' | 'desc' = 'asc'): T[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...games].sort(
    (a, b) => sign * (a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)),
  );
}

export function totals(games: GameStats[]): GameStats {
  const sum = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as unknown as GameStats;
  for (const g of games) {
    for (const k of STAT_KEYS) sum[k] += g[k];
  }
  return sum;
}

export interface Summary {
  games: number;
  totals: GameStats;
  /** Promedios por partido (0 si no hay partidos). */
  avg: GameStats;
  fgPct: number | null;
  threePct: number | null;
  ftPct: number | null;
  effAvg: number;
  wins: number;
  losses: number;
  winPct: number | null;
}

export function summarize(games: Game[]): Summary {
  const n = games.length;
  const t = totals(games);
  const avg = Object.fromEntries(STAT_KEYS.map((k) => [k, n ? t[k] / n : 0])) as unknown as GameStats;
  const wins = games.filter((g) => gameResult(g) === 'W').length;
  return {
    games: n,
    totals: t,
    avg,
    fgPct: pct(t.fgMade, t.fgAttempted),
    threePct: pct(t.threeMade, t.threeAttempted),
    ftPct: pct(t.ftMade, t.ftAttempted),
    effAvg: n ? games.reduce((acc, g) => acc + efficiency(g), 0) / n : 0,
    wins,
    losses: n - wins,
    winPct: n ? (wins / n) * 100 : null,
  };
}

export interface SeasonHigh {
  value: number;
  game: Game;
}

/** Mejor marca de una estadística (en empate gana el partido más reciente). */
export function seasonHigh(games: Game[], key: StatKey): SeasonHigh | null {
  let best: Game | null = null;
  for (const g of sortByDate(games, 'desc')) {
    if (!best || g[key] > best[key]) best = g;
  }
  return best ? { value: best[key], game: best } : null;
}

/** Racha actual: resultados consecutivos iguales desde el partido más reciente. */
export function currentStreak(games: Game[]): { result: Result; count: number } | null {
  const ordered = sortByDate(games, 'desc');
  if (!ordered.length) return null;
  const result = gameResult(ordered[0]);
  let count = 0;
  for (const g of ordered) {
    if (gameResult(g) !== result) break;
    count++;
  }
  return { result, count };
}

/** Los últimos `n` partidos en orden cronológico. */
export function lastGames(games: Game[], n: number): Game[] {
  return sortByDate(games, 'asc').slice(-n);
}

export interface MonthlyRow {
  month: string; // YYYY-MM
  games: number;
  points: number;
  rebounds: number;
  assists: number;
}

export function monthlyAverages(games: Game[]): MonthlyRow[] {
  const groups = new Map<string, Game[]>();
  for (const g of sortByDate(games, 'asc')) {
    const month = g.date.slice(0, 7);
    const list = groups.get(month) ?? [];
    list.push(g);
    groups.set(month, list);
  }
  return [...groups.entries()].map(([month, list]) => {
    const { avg } = summarize(list);
    return { month, games: list.length, points: avg.points, rebounds: avg.rebounds, assists: avg.assists };
  });
}
