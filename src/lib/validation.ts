import type { Game, GameInput, Venue } from '../types';
import { STAT_KEYS, pointsFromShots } from './stats';
import { todayIso } from './format';

/** Valores del formulario: todo como texto, tal cual lo escribe el usuario. */
export type GameFormValues = { [K in keyof GameInput]: string };
export type GameFormErrors = Partial<Record<keyof GameInput, string>>;

const NUMERIC_FIELDS = ['teamScore', 'opponentScore', ...STAT_KEYS] as const;
type NumericField = (typeof NUMERIC_FIELDS)[number];

const MAX: Record<NumericField, number> = {
  teamScore: 250,
  opponentScore: 250,
  minutes: 70,
  points: 150,
  rebounds: 60,
  assists: 50,
  steals: 30,
  blocks: 30,
  turnovers: 30,
  fouls: 6,
  fgMade: 80,
  fgAttempted: 120,
  threeMade: 40,
  threeAttempted: 60,
  ftMade: 50,
  ftAttempted: 60,
};

export function emptyFormValues(): GameFormValues {
  const values = Object.fromEntries(NUMERIC_FIELDS.map((k) => [k, ''])) as Record<NumericField, string>;
  return { ...values, date: todayIso(), opponent: '', venue: 'local', notes: '' };
}

export function gameToFormValues(game: Game): GameFormValues {
  const values = Object.fromEntries(NUMERIC_FIELDS.map((k) => [k, String(game[k])])) as Record<NumericField, string>;
  return { ...values, date: game.date, opponent: game.opponent, venue: game.venue, notes: game.notes };
}

/** Convierte un campo numérico; vacío cuenta como 0 en las estadísticas. */
function toNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return 0;
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

export interface ValidationResult {
  errors: GameFormErrors;
  data: GameInput | null;
}

export function validateGame(values: GameFormValues): ValidationResult {
  const errors: GameFormErrors = {};
  const nums = {} as Record<NumericField, number>;

  for (const key of NUMERIC_FIELDS) {
    const n = toNumber(values[key]);
    if (n === null) errors[key] = 'Ingresá un número entero, 0 o mayor.';
    else if (n > MAX[key]) errors[key] = `El máximo es ${MAX[key]}.`;
    else nums[key] = n;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) errors.date = 'Elegí la fecha del partido.';
  if (!values.opponent.trim()) errors.opponent = 'Indicá el rival.';
  if (values.opponent.trim().length > 60) errors.opponent = 'Máximo 60 caracteres.';
  if (values.teamScore.trim() === '') errors.teamScore = 'Ingresá los puntos de tu equipo.';
  if (values.opponentScore.trim() === '') errors.opponentScore = 'Ingresá los puntos del rival.';

  const has = (...keys: NumericField[]) => keys.every((k) => !errors[k]);

  if (has('teamScore', 'opponentScore') && nums.teamScore === nums.opponentScore && values.teamScore.trim() !== '') {
    errors.opponentScore = 'En básquet no hay empates: cargá el resultado final (con suplementarios).';
  }
  if (has('fgMade', 'fgAttempted') && nums.fgMade > nums.fgAttempted) {
    errors.fgMade = 'No puede superar los tiros intentados.';
  }
  if (has('threeMade', 'threeAttempted') && nums.threeMade > nums.threeAttempted) {
    errors.threeMade = 'No puede superar los triples intentados.';
  }
  if (has('ftMade', 'ftAttempted') && nums.ftMade > nums.ftAttempted) {
    errors.ftMade = 'No puede superar los libres intentados.';
  }
  if (has('threeMade', 'fgMade') && !errors.threeMade && nums.threeMade > nums.fgMade) {
    errors.threeMade = 'Los triples anotados también cuentan como tiros de campo anotados.';
  }
  if (has('threeAttempted', 'fgAttempted') && nums.threeAttempted > nums.fgAttempted) {
    errors.threeAttempted = 'Los triples intentados también cuentan como tiros de campo intentados.';
  }
  if (has('points', 'teamScore') && nums.points > nums.teamScore) {
    errors.points = 'No puede superar el puntaje de tu equipo.';
  }

  if (Object.keys(errors).length) return { errors, data: null };

  return {
    errors,
    data: {
      ...nums,
      date: values.date,
      opponent: values.opponent.trim(),
      venue: (values.venue === 'visitante' ? 'visitante' : 'local') as Venue,
      notes: values.notes.trim().slice(0, 500),
    },
  };
}

/** Aviso (no bloqueante) cuando los puntos no coinciden con los tiros cargados. */
export function pointsMismatch(values: GameFormValues): number | null {
  const n = (k: NumericField) => toNumber(values[k]) ?? 0;
  const anyShots = (['fgMade', 'threeMade', 'ftMade'] as const).some((k) => n(k) > 0);
  if (!anyShots) return null;
  const expected = pointsFromShots({ fgMade: n('fgMade'), threeMade: n('threeMade'), ftMade: n('ftMade') });
  return expected !== n('points') ? expected : null;
}
