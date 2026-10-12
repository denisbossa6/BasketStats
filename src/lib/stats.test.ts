import { describe, expect, it } from 'vitest';
import type { Game } from '../types';
import {
  currentStreak,
  efficiency,
  gameResult,
  lastGames,
  monthlyAverages,
  pct,
  pointsFromShots,
  seasonHigh,
  summarize,
} from './stats';
import { emptyFormValues, validateGame, pointsMismatch, gameToFormValues } from './validation';
import { parseAppData } from './storage';
import { createDemoData } from './demoData';

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: Math.random().toString(36),
    date: '2026-05-01',
    opponent: 'Rival',
    venue: 'local',
    teamScore: 80,
    opponentScore: 70,
    minutes: 30,
    points: 20,
    rebounds: 5,
    assists: 4,
    steals: 1,
    blocks: 0,
    turnovers: 2,
    fouls: 3,
    fgMade: 8,
    fgAttempted: 16,
    threeMade: 2,
    threeAttempted: 5,
    ftMade: 2,
    ftAttempted: 2,
    notes: '',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('estadísticas', () => {
  it('determina victoria o derrota según el marcador', () => {
    expect(gameResult({ teamScore: 80, opponentScore: 70 })).toBe('W');
    expect(gameResult({ teamScore: 60, opponentScore: 70 })).toBe('L');
  });

  it('calcula porcentajes y devuelve null sin intentos', () => {
    expect(pct(5, 10)).toBe(50);
    expect(pct(0, 0)).toBeNull();
  });

  it('calcula puntos desde los tiros (los triples suman 1 extra)', () => {
    expect(pointsFromShots({ fgMade: 8, threeMade: 2, ftMade: 2 })).toBe(20);
  });

  it('calcula la valoración', () => {
    // 20+5+4+1+0 - (16-8) - (2-2) - 2 = 20
    expect(efficiency(makeGame())).toBe(20);
  });

  it('calcula promedios, totales, porcentajes y récord', () => {
    const s = summarize([
      makeGame({ points: 10, rebounds: 4, assists: 2 }),
      makeGame({ points: 20, rebounds: 8, assists: 6, teamScore: 60, opponentScore: 65 }),
    ]);
    expect(s.games).toBe(2);
    expect(s.avg.points).toBe(15);
    expect(s.avg.rebounds).toBe(6);
    expect(s.avg.assists).toBe(4);
    expect(s.totals.points).toBe(30);
    expect(s.fgPct).toBe(50);
    expect(s.wins).toBe(1);
    expect(s.losses).toBe(1);
    expect(s.winPct).toBe(50);
  });

  it('devuelve ceros sin partidos', () => {
    const s = summarize([]);
    expect(s.avg.points).toBe(0);
    expect(s.fgPct).toBeNull();
    expect(s.winPct).toBeNull();
  });

  it('encuentra la mejor marca y la racha actual', () => {
    const games = [
      makeGame({ id: 'a', date: '2026-05-01', points: 30, teamScore: 50, opponentScore: 60 }),
      makeGame({ id: 'b', date: '2026-05-08', points: 12 }),
      makeGame({ id: 'c', date: '2026-05-15', points: 18 }),
    ];
    expect(seasonHigh(games, 'points')?.game.id).toBe('a');
    expect(currentStreak(games)).toEqual({ result: 'W', count: 2 });
    expect(lastGames(games, 2).map((g) => g.id)).toEqual(['b', 'c']);
  });

  it('agrupa promedios por mes en orden cronológico', () => {
    const rows = monthlyAverages([
      makeGame({ date: '2026-06-10', points: 10 }),
      makeGame({ date: '2026-05-10', points: 20 }),
      makeGame({ date: '2026-05-20', points: 30 }),
    ]);
    expect(rows.map((r) => r.month)).toEqual(['2026-05', '2026-06']);
    expect(rows[0].points).toBe(25);
    expect(rows[0].games).toBe(2);
  });
});

describe('validación del formulario', () => {
  const valid = () => ({
    ...emptyFormValues(),
    opponent: 'Halcones',
    teamScore: '80',
    opponentScore: '75',
    points: '20',
    fgMade: '8',
    fgAttempted: '15',
    threeMade: '2',
    threeAttempted: '5',
    ftMade: '2',
    ftAttempted: '3',
  });

  it('acepta un partido válido y convierte los números', () => {
    const { data, errors } = validateGame(valid());
    expect(errors).toEqual({});
    expect(data?.points).toBe(20);
    expect(data?.rebounds).toBe(0);
  });

  it('exige rival y marcador', () => {
    const { errors } = validateGame({ ...valid(), opponent: ' ', teamScore: '' });
    expect(errors.opponent).toBeDefined();
    expect(errors.teamScore).toBeDefined();
  });

  it('rechaza empates, tiros imposibles y valores no enteros', () => {
    const { errors } = validateGame({
      ...valid(),
      opponentScore: '80',
      fgMade: '20',
      ftMade: '5',
      rebounds: '2.5',
    });
    expect(errors.opponentScore).toBeDefined();
    expect(errors.fgMade).toBeDefined();
    expect(errors.ftMade).toBeDefined();
    expect(errors.rebounds).toBeDefined();
  });

  it('no permite más puntos individuales que los del equipo', () => {
    expect(validateGame({ ...valid(), points: '90' }).errors.points).toBeDefined();
  });

  it('avisa cuando los puntos no coinciden con los tiros', () => {
    expect(pointsMismatch(valid())).toBeNull();
    expect(pointsMismatch({ ...valid(), points: '15' })).toBe(20);
  });

  it('ida y vuelta: partido → formulario → partido', () => {
    const game = makeGame();
    const { data } = validateGame(gameToFormValues(game));
    const { id: _id, createdAt: _c, updatedAt: _u, ...input } = game;
    expect(data).toEqual(input);
  });
});

describe('almacenamiento', () => {
  it('normaliza datos importados y descarta partidos inválidos', () => {
    const parsed = parseAppData({
      profile: { name: 'Ana' },
      games: [{ date: '2026-01-01', opponent: 'X', points: 12, rebounds: -3 }, { date: 'mal', opponent: 'Y' }, 'basura'],
    });
    expect(parsed?.profile.name).toBe('Ana');
    expect(parsed?.games).toHaveLength(1);
    expect(parsed?.games[0].points).toBe(12);
    expect(parsed?.games[0].rebounds).toBe(0);
  });

  it('rechaza estructuras que no son una copia de BasketStats', () => {
    expect(parseAppData(null)).toBeNull();
    expect(parseAppData({ foo: 1 })).toBeNull();
  });

  it('los datos de ejemplo son consistentes y pasan la validación', () => {
    const demo = createDemoData();
    expect(demo.games.length).toBeGreaterThan(10);
    for (const g of demo.games) {
      const { errors } = validateGame(gameToFormValues(g));
      expect(errors).toEqual({});
      expect(pointsMismatch(gameToFormValues(g))).toBeNull();
    }
  });
});
