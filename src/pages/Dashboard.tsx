import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card, EmptyGamesCta, Meter, PageHeader, ResultBadge, StatCard } from '../components/ui';
import { TrendChart } from '../components/Charts';
import { ChevronRightIcon, PlusIcon, TrophyIcon } from '../components/Icons';
import { currentStreak, gameResult, lastGames, seasonHigh, sortByDate, summarize } from '../lib/stats';
import { fmt1, formatShortDate } from '../lib/format';
import type { StatKey } from '../types';

const HIGHS: { key: StatKey; label: string }[] = [
  { key: 'points', label: 'Puntos' },
  { key: 'rebounds', label: 'Rebotes' },
  { key: 'assists', label: 'Asistencias' },
];

export default function Dashboard() {
  const { games, profile, data, clearAll, dismissDemo } = useData();

  const season = useMemo(() => summarize(games), [games]);
  const recent = useMemo(() => summarize(lastGames(games, 5)), [games]);
  const streak = currentStreak(games);
  const latest = sortByDate(games, 'desc').slice(0, 5);
  const form = lastGames(games, 5);
  // Las tendencias solo tienen sentido con historial suficiente.
  const delta = (k: StatKey) => (games.length > 5 ? recent.avg[k] - season.avg[k] : null);

  const name = profile.name.trim() || 'Mi temporada';
  const meta = [profile.position, profile.team, profile.number && `#${profile.number}`].filter(Boolean).join(' · ');

  return (
    <div className="page">
      {data.isDemo && (
        <div className="banner banner--info">
          <div>
            <strong>Estás viendo datos de ejemplo.</strong> Explorá la app libremente o empezá a registrar tus propios partidos.
          </div>
          <div className="banner__actions">
            <button type="button" className="btn btn--small btn--primary" onClick={clearAll}>
              Empezar de cero
            </button>
            <button type="button" className="btn btn--small btn--ghost" onClick={dismissDemo}>
              Mantener ejemplo
            </button>
          </div>
        </div>
      )}

      <PageHeader
        title={
          <span className="player-title">
            {profile.number && <span className="jersey">{profile.number}</span>}
            {name}
          </span>
        }
        subtitle={meta || <Link to="/ajustes">Completá tu perfil de jugador</Link>}
        actions={
          <Link to="/partidos/nuevo" className="btn btn--primary hide-mobile">
            <PlusIcon size={18} /> Nuevo partido
          </Link>
        }
      />

      {games.length === 0 ? (
        <EmptyGamesCta />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              label="Partidos"
              value={String(season.games)}
              hint={
                <>
                  {season.wins}V – {season.losses}D
                  {season.winPct !== null && <span className="muted"> · {Math.round(season.winPct)}% victorias</span>}
                </>
              }
            />
            <StatCard label="Puntos por partido" value={fmt1(season.avg.points)} delta={delta('points')} accent />
            <StatCard label="Rebotes por partido" value={fmt1(season.avg.rebounds)} delta={delta('rebounds')} />
            <StatCard label="Asistencias por partido" value={fmt1(season.avg.assists)} delta={delta('assists')} />
          </div>

          <div className="grid-2-1">
            <Card
              title="Puntos en los últimos 10 partidos"
              action={
                <Link to="/estadisticas" className="link-more">
                  Ver estadísticas <ChevronRightIcon size={16} />
                </Link>
              }
            >
              <TrendChart
                games={lastGames(games, 10)}
                metrics={['points']}
                height={260}
                reference={{ value: season.avg.points, label: `Promedio ${fmt1(season.avg.points)}` }}
              />
            </Card>

            <Card title="Forma reciente">
              <div className="form-strip">
                {form.map((g) => (
                  <Link key={g.id} to={`/partidos/${g.id}`} className="form-strip__item" title={`vs ${g.opponent}`}>
                    <ResultBadge game={g} />
                    <span className="small muted">{formatShortDate(g.date)}</span>
                  </Link>
                ))}
              </div>
              {streak && (
                <p className="streak">
                  Racha actual:{' '}
                  <strong className={streak.result === 'W' ? 'text-win' : 'text-loss'}>
                    {streak.count} {streak.result === 'W' ? (streak.count === 1 ? 'victoria' : 'victorias') : streak.count === 1 ? 'derrota' : 'derrotas'}
                  </strong>
                </p>
              )}
              <div className="meters">
                <Meter label="Tiros de campo" value={season.fgPct} detail={`${season.totals.fgMade}/${season.totals.fgAttempted}`} />
                <Meter label="Triples" value={season.threePct} detail={`${season.totals.threeMade}/${season.totals.threeAttempted}`} />
                <Meter label="Tiros libres" value={season.ftPct} detail={`${season.totals.ftMade}/${season.totals.ftAttempted}`} />
              </div>
            </Card>
          </div>

          <div className="grid-2-1">
            <Card
              title="Últimos partidos"
              action={
                <Link to="/partidos" className="link-more">
                  Ver historial <ChevronRightIcon size={16} />
                </Link>
              }
            >
              <ul className="game-list">
                {latest.map((g) => (
                  <li key={g.id}>
                    <Link to={`/partidos/${g.id}`} className="game-row">
                      <ResultBadge game={g} withScore />
                      <div className="game-row__main">
                        <span className="game-row__opponent">vs {g.opponent}</span>
                        <span className="small muted">
                          {formatShortDate(g.date)} · {g.venue === 'local' ? 'Local' : 'Visitante'}
                        </span>
                      </div>
                      <div className="game-row__stats">
                        <span><strong>{g.points}</strong> PTS</span>
                        <span><strong>{g.rebounds}</strong> REB</span>
                        <span><strong>{g.assists}</strong> AST</span>
                      </div>
                      <ChevronRightIcon size={18} className="muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title={<><TrophyIcon size={18} /> Récords de la temporada</>}>
              <ul className="highs">
                {HIGHS.map(({ key, label }) => {
                  const high = seasonHigh(games, key);
                  if (!high) return null;
                  return (
                    <li key={key}>
                      <Link to={`/partidos/${high.game.id}`} className="high">
                        <span className="high__value">{high.value}</span>
                        <span className="high__label">
                          {label}
                          <span className="small muted">
                            vs {high.game.opponent} · {formatShortDate(high.game.date)}{' '}
                            {gameResult(high.game) === 'W' ? '(V)' : '(D)'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
