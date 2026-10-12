import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Card, ConfirmDialog, EmptyState, Meter } from '../components/ui';
import { ArrowLeftIcon, EditIcon, TrashIcon } from '../components/Icons';
import { efficiency, gameResult, pct, summarize } from '../lib/stats';
import { fmt1, fmtDelta, formatDate, formatWeekday } from '../lib/format';
import type { StatKey } from '../types';

const MAIN: { key: StatKey; label: string; invert?: boolean }[] = [
  { key: 'points', label: 'Puntos' },
  { key: 'rebounds', label: 'Rebotes' },
  { key: 'assists', label: 'Asistencias' },
  { key: 'steals', label: 'Robos' },
  { key: 'blocks', label: 'Tapas' },
  { key: 'turnovers', label: 'Pérdidas', invert: true },
  { key: 'fouls', label: 'Faltas', invert: true },
  { key: 'minutes', label: 'Minutos' },
];

export default function GameDetail() {
  const { id = '' } = useParams();
  const { getGame, games, deleteGame } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const game = getGame(id);

  if (!game) {
    return (
      <div className="page">
        <EmptyState
          title="Partido no encontrado"
          text="Puede que haya sido eliminado."
          action={<Link to="/partidos" className="btn btn--primary">Volver al historial</Link>}
        />
      </div>
    );
  }

  const season = summarize(games);
  const win = gameResult(game) === 'W';
  const eff = efficiency(game);

  const handleDelete = () => {
    deleteGame(game.id);
    toast(`Partido vs ${game.opponent} eliminado`);
    navigate('/partidos', { replace: true });
  };

  return (
    <div className="page">
      <Link to="/partidos" className="back-link">
        <ArrowLeftIcon size={18} /> Historial
      </Link>

      <section className={`match-hero ${win ? 'match-hero--win' : 'match-hero--loss'}`}>
        <div className="match-hero__info">
          <span className="match-hero__date">
            <span className="capitalize">{formatWeekday(game.date)}</span>, {formatDate(game.date)} ·{' '}
            {game.venue === 'local' ? 'Local' : 'Visitante'}
          </span>
          <h1 className="match-hero__title">vs {game.opponent}</h1>
          <span className="match-hero__result">{win ? 'Victoria' : 'Derrota'} por {Math.abs(game.teamScore - game.opponentScore)}</span>
        </div>
        <div className="match-hero__score" aria-label={`Marcador ${game.teamScore} a ${game.opponentScore}`}>
          <div>
            <span className="match-hero__label">Mi equipo</span>
            <span className="match-hero__points">{game.teamScore}</span>
          </div>
          <span className="match-hero__sep">–</span>
          <div>
            <span className="match-hero__label">Rival</span>
            <span className="match-hero__points">{game.opponentScore}</span>
          </div>
        </div>
        <div className="match-hero__actions">
          <Link to={`/partidos/${game.id}/editar`} className="btn btn--secondary">
            <EditIcon size={18} /> Editar
          </Link>
          <button type="button" className="btn btn--danger-ghost" onClick={() => setConfirming(true)}>
            <TrashIcon size={18} /> Eliminar
          </button>
        </div>
      </section>

      <Card title="Estadísticas individuales" action={<span className="small muted">Comparado con tu promedio</span>}>
        <div className="box-score">
          {MAIN.map(({ key, label, invert }) => {
            const diff = game[key] - season.avg[key];
            const good = invert ? diff < 0 : diff > 0;
            const neutral = Math.abs(diff) < 0.05;
            return (
              <div key={key} className="box-score__item">
                <span className="box-score__value">{game[key]}</span>
                <span className="box-score__label">{label}</span>
                <span className={`box-score__delta ${neutral ? '' : good ? 'is-up' : 'is-down'}`}>
                  {fmtDelta(diff)} <span className="muted">(prom. {fmt1(season.avg[key])})</span>
                </span>
              </div>
            );
          })}
          <div className="box-score__item box-score__item--accent">
            <span className="box-score__value">{eff}</span>
            <span className="box-score__label">Valoración</span>
            <span className="box-score__delta muted">prom. {fmt1(season.effAvg)}</span>
          </div>
        </div>
      </Card>

      <div className="grid-2">
        <Card title="Lanzamientos">
          <div className="meters">
            <Meter label="Tiros de campo" value={pct(game.fgMade, game.fgAttempted)} detail={`${game.fgMade}/${game.fgAttempted} anotados`} />
            <Meter label="Triples" value={pct(game.threeMade, game.threeAttempted)} detail={`${game.threeMade}/${game.threeAttempted} anotados`} />
            <Meter label="Tiros libres" value={pct(game.ftMade, game.ftAttempted)} detail={`${game.ftMade}/${game.ftAttempted} anotados`} />
          </div>
        </Card>
        <Card title="Notas">
          {game.notes ? <p className="notes">{game.notes}</p> : <p className="muted">Sin notas para este partido.</p>}
        </Card>
      </div>

      <ConfirmDialog
        open={confirming}
        title="¿Eliminar partido?"
        message={<>Se eliminará el partido vs <strong>{game.opponent}</strong>. Esta acción no se puede deshacer.</>}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
