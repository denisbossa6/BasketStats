import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { Game } from '../types';
import { useTheme } from '../context/ThemeContext';
import { monthlyAverages, pct, sortByDate } from '../lib/stats';
import { fmt1, formatMonth, formatShortDate } from '../lib/format';

/** Paleta categórica validada (orden fijo; el color sigue a la métrica). */
const PALETTE = {
  light: {
    series: ['#2a78d6', '#eb6834', '#1baf7a'],
    grid: '#e1e0d9',
    axis: '#c3c2b7',
    muted: '#76746e',
    surface: '#ffffff',
  },
  dark: {
    series: ['#3987e5', '#d95926', '#199e70'],
    grid: '#2c2c2a',
    axis: '#383835',
    muted: '#9a988f',
    surface: '#17181b',
  },
};

export function useChartTheme() {
  const { theme } = useTheme();
  return PALETTE[theme];
}

export type TrendMetric = 'points' | 'rebounds' | 'assists';

export const METRICS: Record<TrendMetric, { label: string; short: string; slot: number }> = {
  points: { label: 'Puntos', short: 'PTS', slot: 0 },
  rebounds: { label: 'Rebotes', short: 'REB', slot: 1 },
  assists: { label: 'Asistencias', short: 'AST', slot: 2 },
};

interface SeriesDef {
  key: string;
  label: string;
  color: string;
  format?: (v: number) => string;
}

/** Leyenda HTML: muestra la identidad de cada serie con texto, no solo color. */
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="legend">
      {items.map((i) => (
        <li key={i.label}>
          <span className="legend__swatch" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({ active, payload, series, titleKey }: TooltipProps<number, string> & { series: SeriesDef[]; titleKey: string }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Record<string, unknown>;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{String(row[titleKey])}</div>
      {typeof row.subtitle === 'string' && <div className="chart-tooltip__subtitle">{row.subtitle}</div>}
      {series.map((s) => {
        const v = row[s.key];
        return (
          <div key={s.key} className="chart-tooltip__row">
            <span className="legend__swatch" style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong>{typeof v === 'number' ? (s.format ? s.format(v) : v) : '—'}</strong>
          </div>
        );
      })}
    </div>
  );
}

function useAxisProps() {
  const c = useChartTheme();
  const tick = { fill: c.muted, fontSize: 12 };
  return {
    c,
    grid: <CartesianGrid vertical={false} stroke={c.grid} />,
    xAxis: { tick, tickLine: false, axisLine: { stroke: c.axis }, minTickGap: 12, tickMargin: 8 },
    yAxis: { tick, tickLine: false, axisLine: false, width: 36, allowDecimals: false },
  };
}

function perGameRows(games: Game[]) {
  return sortByDate(games, 'asc').map((g) => ({
    id: g.id,
    label: formatShortDate(g.date),
    subtitle: `vs ${g.opponent}`,
    points: g.points,
    rebounds: g.rebounds,
    assists: g.assists,
    fgPct: pct(g.fgMade, g.fgAttempted),
    threePct: pct(g.threeMade, g.threeAttempted),
    ftPct: pct(g.ftMade, g.ftAttempted),
  }));
}

interface TrendChartProps {
  games: Game[];
  metrics: TrendMetric[];
  height?: number;
  /** Línea de referencia (p. ej. promedio de la temporada) para una sola métrica. */
  reference?: { value: number; label: string };
}

export function TrendChart({ games, metrics, height = 280, reference }: TrendChartProps) {
  const { c, grid, xAxis, yAxis } = useAxisProps();
  const data = perGameRows(games);
  const series: SeriesDef[] = metrics.map((m) => ({ key: m, label: METRICS[m].label, color: c.series[METRICS[m].slot] }));

  return (
    <div style={{ height }} className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -8 }}>
          {grid}
          <XAxis dataKey="label" {...xAxis} />
          <YAxis {...yAxis} />
          <Tooltip
            content={<ChartTooltip series={series} titleKey="label" />}
            cursor={{ stroke: c.axis, strokeWidth: 1 }}
          />
          {reference && (
            <ReferenceLine
              y={reference.value}
              stroke={c.muted}
              strokeDasharray="4 4"
              label={{ value: reference.label, position: 'insideTopRight', fill: c.muted, fontSize: 12 }}
            />
          )}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 4, fill: s.color, stroke: c.surface, strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: c.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ShootingChart({ games, height = 280 }: { games: Game[]; height?: number }) {
  const { c, grid, xAxis, yAxis } = useAxisProps();
  const data = perGameRows(games);
  const format = (v: number) => `${fmt1(v)}%`;
  const series: SeriesDef[] = [
    { key: 'fgPct', label: 'Tiros de campo', color: c.series[0], format },
    { key: 'threePct', label: 'Triples', color: c.series[1], format },
    { key: 'ftPct', label: 'Tiros libres', color: c.series[2], format },
  ];

  return (
    <>
      <Legend items={series} />
      <div style={{ height }} className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -8 }}>
            {grid}
            <XAxis dataKey="label" {...xAxis} />
            <YAxis {...yAxis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} width={44} />
            <Tooltip content={<ChartTooltip series={series} titleKey="label" />} cursor={{ stroke: c.axis, strokeWidth: 1 }} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                connectNulls
                dot={{ r: 4, fill: s.color, stroke: c.surface, strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: c.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

export function MonthlyChart({ games, height = 280 }: { games: Game[]; height?: number }) {
  const { c, grid, xAxis, yAxis } = useAxisProps();
  const data = monthlyAverages(games).map((m) => ({
    ...m,
    label: formatMonth(m.month),
    subtitle: `${m.games} ${m.games === 1 ? 'partido' : 'partidos'}`,
  }));
  const series: SeriesDef[] = (Object.keys(METRICS) as TrendMetric[]).map((m) => ({
    key: m,
    label: METRICS[m].label,
    color: c.series[METRICS[m].slot],
    format: fmt1,
  }));

  return (
    <>
      <Legend items={series} />
      <div style={{ height }} className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -8 }} barGap={2} barCategoryGap="24%">
            {grid}
            <XAxis dataKey="label" {...xAxis} />
            <YAxis {...yAxis} />
            <Tooltip content={<ChartTooltip series={series} titleKey="label" />} cursor={{ fill: c.grid, opacity: 0.5 }} />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
