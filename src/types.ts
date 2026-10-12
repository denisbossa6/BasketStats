/** Estadísticas numéricas que se registran en cada partido. */
export interface GameStats {
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  /** Tiros de campo (incluye triples). */
  fgMade: number;
  fgAttempted: number;
  threeMade: number;
  threeAttempted: number;
  ftMade: number;
  ftAttempted: number;
}

export type Venue = 'local' | 'visitante';

export interface Game extends GameStats {
  id: string;
  /** Fecha en formato ISO local: YYYY-MM-DD. */
  date: string;
  opponent: string;
  venue: Venue;
  teamScore: number;
  opponentScore: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Datos que se cargan desde el formulario (sin metadatos). */
export type GameInput = Omit<Game, 'id' | 'createdAt' | 'updatedAt'>;

export interface PlayerProfile {
  name: string;
  team: string;
  position: string;
  number: string;
}

export interface AppData {
  version: 1;
  profile: PlayerProfile;
  games: Game[];
  /** true mientras se muestran los datos de ejemplo de la primera visita. */
  isDemo: boolean;
}

export type StatKey = keyof GameStats;
