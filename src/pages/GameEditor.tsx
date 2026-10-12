import { Link, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import GameForm from '../components/GameForm';
import { EmptyState, PageHeader } from '../components/ui';
import { ArrowLeftIcon } from '../components/Icons';
import { emptyFormValues, gameToFormValues } from '../lib/validation';
import type { GameInput } from '../types';

/** Alta (/partidos/nuevo) y edición (/partidos/:id/editar) de partidos. */
export default function GameEditor() {
  const { id } = useParams();
  const { getGame, addGame, updateGame } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const game = id ? getGame(id) : undefined;

  if (id && !game) {
    return (
      <div className="page">
        <EmptyState
          title="Partido no encontrado"
          text="No se puede editar un partido que no existe."
          action={<Link to="/partidos" className="btn btn--primary">Volver al historial</Link>}
        />
      </div>
    );
  }

  const handleSubmit = (input: GameInput) => {
    if (game) {
      updateGame(game.id, input);
      toast('Cambios guardados');
      navigate(`/partidos/${game.id}`, { replace: true });
    } else {
      const created = addGame(input);
      toast(`Partido vs ${created.opponent} registrado`);
      navigate(`/partidos/${created.id}`, { replace: true });
    }
  };

  return (
    <div className="page page--narrow">
      <Link to={game ? `/partidos/${game.id}` : '/partidos'} className="back-link">
        <ArrowLeftIcon size={18} /> {game ? 'Volver al partido' : 'Historial'}
      </Link>
      <PageHeader
        title={game ? `Editar partido vs ${game.opponent}` : 'Nuevo partido'}
        subtitle={game ? 'Modificá los datos y guardá los cambios.' : 'Cargá el resultado y tus estadísticas individuales.'}
      />
      <GameForm
        key={game?.id ?? 'new'}
        initialValues={game ? gameToFormValues(game) : emptyFormValues()}
        submitLabel={game ? 'Guardar cambios' : 'Registrar partido'}
        onSubmit={handleSubmit}
        onCancel={() => {
          // Si se entró directo por URL no hay historial interno al que volver.
          if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
          else navigate(game ? `/partidos/${game.id}` : '/partidos');
        }}
      />
    </div>
  );
}
