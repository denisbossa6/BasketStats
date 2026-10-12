import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card, EmptyGamesCta, PageHeader, StatCard } from '../components/ui';
import { METRICS, MonthlyChart, ShootingChart, TrendChart, useChartTheme, type TrendMetric } from '../components/Charts';
import { ChartIcon, TableIcon } from '../components/Icons';
import { gameResult, lastGames, sortByDate, summarize, type Summary } from '../lib/stats';
import { fmt1, fmtPct, formatShortDate } from '../lib/format';

type Range = 'all' | '10' | '5';

const RANGES: { value: Range; label: string }[] = [
  { value: 'all', label: 'Temporada' },
  { value: '10', label: 'Últimos 10' },
  { value: '5', label: 'Últimos 5' },
];

const SPLIT_ROWS: { label: string; get: (s: Summary) => string }[] = [
  { label: 'Puntos', get: (s) => fmt1(s.avg.points) },
  { label: 'Rebotes', get: (s) => fmt1(s.avg.rebounds) },
  { label: 'Asistencias', get: (s) => fmt1(s.avg.assists) },
  { label: 'Pérdidas', get: (s) => fmt1(s.avg.turnovers) },
  { label: 'Tiros de campo', get: (s) => fmtPct(s.fgPct) },
  { label: 'Triples', get: (s) => fmtPct(s.threePct) },
  { label: 'Valoración', get: (s) => fmt1(s.effAvg) },
];

export default function Stats() {
  const { games } = useData();
  const colors = useChartTheme();
  const [range, setRange] = useState<Range>('all');
  const [metrics, setMetrics] = useState<TrendMetric[]>(['points', 'rebounds', 'assists']);
  const [showTable, setShowTable] = useState(false);

  const scoped = useMemo(() => (range === 'all' ? games : lastGames(games, Number(range))), [games, range]);
  const s = useMemo(() => summarize(scoped), [scoped]);
  const wins = useMemo(() => summarize(scoped.filter((g) => gameResult(g) === 'W')), [scoped]);
  const losses = useMemo(() => summarize(scoped.filter((g) => gameResult(g) === 'L')), [scoped]);

  const toggleMetric = (m: TrendMetric) =>
    setMetrics((cur) => (cur.includes(m) ? (cur.length > 1 ? cur.filter((x) => x !== m) : cur) : [...cur, m]));

  if (games.length === 0) {
    return (
      <div className="page">
        <PageHeader title="Estadísticas" />
        <EmptyGamesCta />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Estadísticas y rendimiento"
        subtitle={`Basado en ${s.games} ${s.games === 1 ? 'partido' : 'partidos'}`}
        actions={
          <div className="segmented" role="group" aria-label="Rango de partidos">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`segmented__option ${range === r.value ? 'is-active' : ''}`}
                aria-pressed={range === r.value}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="stat-grid stat-grid--dense">
        <StatCard label="Puntos" value={fmt1(s.avg.points)} hint="por partido" accent />
        <StatCard label="Rebotes" value={fmt1(s.avg.rebounds)} hint="por partido" />
        <StatCard label="Asistencias" value={fmt1(s.avg.assists)} hint="por partido" />
        <StatCard label="Robos" value={fmt1(s.avg.steals)} hint="por partido" />
        <StatCard label="Tapas" value={fmt1(s.avg.blocks)} hint="por partido" />
        <StatCard label="Pérdidas" value={fmt1(s.avg.turnovers)} hint="por partido" />
        <StatCard label="Minutos" value={fmt1(s.avg.minutes)} hint="por partido" />
        <StatCard label="Valoración" value={fmt1(s.effAvg)} hint="EFF por partido" />
        <StatCard label="TC%" value={fmtPct(s.fgPct)} hint={`${s.totals.fgMade}/${s.totals.fgAttempted} tiros de campo`} />
        <StatCard label="3P%" value={fmtPct(s.threePct)} hint={`${s.totals.threeMade}/${s.totals.threeAttempted} triples`} />
        <StatCard label="TL%" value={fmtPct(s.ftPct)} hint={`${s.totals.ftMade}/${s.totals.ftAttempted} libres`} />
        <StatCard label="Récord" value={`${s.wins}-${s.losses}`} hint={s.winPct !== null ? `${Math.round(s.winPct)}% victorias` : ''} />
      </div>

      <Card
        title="Evolución por partido"
        action={
          <button type="button" className="btn btn--small btn--ghost" onClick={() => setShowTable((v) => !v)}>
            {showTable ? <ChartIcon size={16} /> : <TableIcon size={16} />} {showTable ? 'Ver gráfico' : 'Ver tabla'}
          </button>
        }
      >
        <div className="chip-row" role="group" aria-label="Métricas visibles">
          {(Object.keys(METRICS) as TrendMetric[]).map((m) => {
            const on = metrics.includes(m);
            return (
              <button key={m} type="button" className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggleMetric(m)}>
                <span className="legend__swatch" style={{ background: on ? colors.series[METRICS[m].slot] : 'transparent', borderColor: colors.series[METRICS[m].slot] }} />
                {METRICS[m].label}
              </button>
            );
          })}
        </div>
        {showTable ? (
          <div className="table-scroll">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Rival</th>
                  <th className="num">PTS</th>
                  <th className="num">REB</th>
                  <th className="num">AST</th>
                </tr>
              </thead>
              <tbody>
                {sortByDate(scoped, 'asc').map((g) => (
                  <tr key={g.id}>
                    <td className="nowrap">{formatShortDate(g.date)}</td>
                    <td>
                      <Link to={`/partidos/${g.id}`} className="table__link">{g.opponent}</Link>
                    </td>
                    <td className="num">{g.points}</td>
                    <td className="num">{g.rebounds}</td>
                    <td className="num">{g.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <TrendChart games={scoped} metrics={metrics} height={300} />
        )}
      </Card>

      <div className="grid-2">
        <Card title="Porcentajes de tiro por partido">
          <ShootingChart games={scoped} height={260} />
        </Card>
        <Card title="Promedios por mes">
          <MonthlyChart games={scoped} height={260} />
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Victorias vs. derrotas" action={<span className="small muted">Promedios por partido</span>}>
          <div className="table-scroll">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th />
                  <th className="num">
                    <span className="text-win">Victorias</span> <span className="muted">({wins.games})</span>
                  </th>
                  <th className="num">
                    <span className="text-loss">Derrotas</span> <span className="muted">({losses.games})</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {SPLIT_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td className="num">{wins.games ? row.get(wins) : '—'}</td>
                    <td className="num">{losses.games ? row.get(losses) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Totales acumulados">
          <dl className="totals">
            {(
              [
                ['Puntos', s.totals.points],
                ['Rebotes', s.totals.rebounds],
                ['Asistencias', s.totals.assists],
                ['Robos', s.totals.steals],
                ['Tapas', s.totals.blocks],
                ['Pérdidas', s.totals.turnovers],
                ['Minutos', s.totals.minutes],
                ['Triples anotados', s.totals.threeMade],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
