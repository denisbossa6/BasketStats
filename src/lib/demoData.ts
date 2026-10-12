import type { AppData, Game } from '../types';
import { pointsFromShots } from './stats';

// [fecha, rival, condición, equipo, rival, min, reb, ast, rob, tap, pér, fal, tcA, tcI, 3A, 3I, tlA, tlI]
type Row = [string, string, 'L' | 'V', ...number[]];

const ROWS: Row[] = [
  ['2026-04-04', 'Halcones', 'L', 72, 68, 28, 5, 3, 1, 0, 2, 2, 5, 13, 1, 4, 3, 4],
  ['2026-04-11', 'Unión Norte', 'V', 65, 74, 30, 6, 4, 2, 0, 3, 3, 4, 12, 1, 5, 2, 2],
  ['2026-04-18', 'Deportivo Sur', 'L', 81, 70, 31, 4, 6, 1, 1, 2, 2, 7, 14, 2, 5, 4, 5],
  ['2026-04-25', 'Atlético Oeste', 'V', 69, 71, 27, 7, 2, 0, 0, 4, 4, 5, 15, 0, 3, 3, 4],
  ['2026-05-03', 'Club Ribera', 'L', 77, 62, 29, 5, 5, 2, 0, 1, 1, 6, 12, 2, 4, 2, 2],
  ['2026-05-10', 'Halcones', 'V', 70, 75, 32, 8, 3, 1, 1, 3, 3, 6, 16, 1, 6, 5, 6],
  ['2026-05-24', 'Sporting Central', 'L', 84, 79, 33, 6, 7, 3, 0, 2, 2, 8, 15, 3, 6, 3, 4],
  ['2026-06-07', 'Unión Norte', 'L', 76, 70, 30, 5, 4, 1, 0, 2, 2, 7, 13, 2, 4, 1, 2],
  ['2026-06-21', 'Los Pinos', 'V', 68, 73, 29, 9, 2, 0, 1, 3, 4, 4, 13, 1, 5, 4, 4],
  ['2026-07-05', 'Deportivo Sur', 'V', 79, 72, 31, 6, 5, 2, 0, 2, 2, 8, 15, 2, 5, 5, 6],
  ['2026-07-19', 'Atlético Oeste', 'L', 88, 80, 34, 7, 6, 2, 1, 3, 3, 9, 17, 3, 7, 4, 4],
  ['2026-08-02', 'Club Ribera', 'V', 71, 66, 30, 4, 8, 3, 0, 1, 2, 6, 12, 1, 3, 2, 3],
  ['2026-08-16', 'Sporting Central', 'V', 74, 82, 33, 8, 3, 1, 0, 4, 4, 7, 18, 2, 8, 2, 3],
  ['2026-08-30', 'Los Pinos', 'L', 90, 78, 32, 6, 6, 2, 1, 2, 1, 10, 17, 4, 7, 3, 3],
  ['2026-09-13', 'Halcones', 'L', 82, 75, 31, 7, 5, 1, 0, 2, 3, 8, 14, 3, 6, 4, 5],
  ['2026-09-27', 'Unión Norte', 'V', 86, 81, 35, 9, 7, 2, 1, 3, 2, 10, 19, 2, 6, 6, 7],
];

export function createDemoData(): AppData {
  const games: Game[] = ROWS.map((row, i) => {
    const [date, opponent, venue, teamScore, opponentScore, minutes, rebounds, assists, steals, blocks, turnovers, fouls,
      fgMade, fgAttempted, threeMade, threeAttempted, ftMade, ftAttempted] = row as [string, string, 'L' | 'V', ...number[]];
    const timestamp = `${date}T22:00:00.000Z`;
    return {
      id: `demo-${i + 1}`,
      date,
      opponent,
      venue: venue === 'L' ? 'local' : 'visitante',
      teamScore,
      opponentScore,
      minutes,
      points: pointsFromShots({ fgMade, threeMade, ftMade }),
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      fouls,
      fgMade,
      fgAttempted,
      threeMade,
      threeAttempted,
      ftMade,
      ftAttempted,
      notes: i === 15 ? 'Mejor partido de la temporada: 28 puntos y doble-doble.' : '',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  return {
    version: 1,
    profile: { name: 'Lucas Romero', team: 'Club Atlético Demo', position: 'Escolta', number: '7' },
    games,
    isDemo: true,
  };
}
