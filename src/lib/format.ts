function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

const longDate = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });
const monthYear = new Intl.DateTimeFormat('es-AR', { month: 'short', year: 'numeric' });
const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long' });

export const formatDate = (iso: string) => longDate.format(parseLocalDate(iso));
export const formatShortDate = (iso: string) => shortDate.format(parseLocalDate(iso)).replace('.', '');
export const formatWeekday = (iso: string) => weekday.format(parseLocalDate(iso));
export const formatMonth = (yyyyMm: string) => monthYear.format(parseLocalDate(`${yyyyMm}-01`)).replace('.', '');

/** Fecha de hoy en formato YYYY-MM-DD (hora local). */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Número con un decimal, con coma decimal (es-AR). */
export function fmt1(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function fmtPct(n: number | null): string {
  return n === null ? '—' : `${fmt1(n)}%`;
}

/** Diferencia con signo, p. ej. "+2,3" o "−1,0". */
export function fmtDelta(n: number): string {
  const abs = fmt1(Math.abs(n));
  if (Math.abs(n) < 0.05) return '±0,0';
  return n > 0 ? `+${abs}` : `−${abs}`;
}
