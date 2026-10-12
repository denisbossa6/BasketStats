import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog, EmptyGamesCta, EmptyState, PageHeader, ResultBadge } from '../components/ui';
import { ChevronRightIcon, EditIcon, PlusIcon, SearchIcon, TrashIcon } from '../components/Icons';
import { gameResult, pct, sortByDate } from '../lib/stats';
import { fmtPct, formatShortDate } from '../lib/format';
import type { Game } from '../types';

type ResultFilter = 'all' | 'W' | 'L';
type SortKey = 'date-desc' | 'date-asc' | 'points' | 'rebounds' | 'assists';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguos' },
  { value: 'points', label: 'Más puntos' },
  { value: 'rebounds', label: 'Más rebotes' },
  { value: 'assists', label: 'Más asistencias' },
];

export default function Games() {
  const { games, deleteGame } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [toDelete, setToDelete] = useState<Game | null>(null);

  const query = params.get('q') ?? '';
  const result = (params.get('resultado') as ResultFilter) || 'all';
  const sort = (params.get('orden') as SortKey) || 'date-desc';

  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = games.filter(
      (g) => (!q || g.opponent.toLowerCase().includes(q)) && (result === 'all' || gameResult(g) === result),
    );
    if (sort === 'date-asc') list = sortByDate(list, 'asc');
    else {
      list = sortByDate(list, 'desc');
      if (sort !== 'date-desc') list = [...list].sort((a, b) => b[sort] - a[sort]);
    }
    return list;
  }, [games, query, result, sort]);

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteGame(toDelete.id);
    toast(`Partido vs ${toDelete.opponent} eliminado`);
    setToDelete(null);
  };

  return (
    <div className="page">
      <PageHeader
        title="Historial de partidos"
        subtitle={`${games.length} ${games.length === 1 ? 'partido registrado' : 'partidos registrados'}`}
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
          <div className="filters">
            <label className="search">
              <SearchIcon size={18} />
              <span className="sr-only">Buscar por rival</span>
              <input
                type="search"
                placeholder="Buscar rival…"
                value={query}
                onChange={(e) => setParam('q', e.target.value, '')}
              />
            </label>
            <div className="segmented" role="group" aria-label="Filtrar por resultado">
              {(
                [
                  ['all', 'Todos'],
                  ['W', 'Victorias'],
                  ['L', 'Derrotas'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`segmented__option ${result === value ? 'is-active' : ''}`}
                  aria-pressed={result === value}
                  onClick={() => setParam('resultado', value, 'all')}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="select">
              <span className="sr-only">Ordenar</span>
              <select value={sort} onChange={(e) => setParam('orden', e.target.value, 'date-desc')}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Sin resultados" text="Ningún partido coincide con los filtros seleccionados." />
          ) : (
            <>
              {/* Escritorio: tabla */}
              <div className="card table-card hide-mobile">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Rival</th>
                      <th>Resultado</th>
                      <th className="num">MIN</th>
                      <th className="num">PTS</th>
                      <th className="num">REB</th>
                      <th className="num">AST</th>
                      <th className="num">TC%</th>
                      <th className="num">3P%</th>
                      <th>
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((g) => (
                      <tr key={g.id} onClick={() => navigate(`/partidos/${g.id}`)} className="is-clickable">
                        <td className="nowrap">{formatShortDate(g.date)} {g.date.slice(0, 4)}</td>
                        <td>
                          <Link to={`/partidos/${g.id}`} className="table__link" onClick={(e) => e.stopPropagation()}>
                            {g.opponent}
                          </Link>
                          <span className="muted small"> · {g.venue === 'local' ? 'L' : 'V'}</span>
                        </td>
                        <td>
                          <ResultBadge game={g} withScore />
                        </td>
                        <td className="num">{g.minutes}</td>
                        <td className="num strong">{g.points}</td>
                        <td className="num">{g.rebounds}</td>
                        <td className="num">{g.assists}</td>
                        <td className="num">{fmtPct(pct(g.fgMade, g.fgAttempted))}</td>
                        <td className="num">{fmtPct(pct(g.threeMade, g.threeAttempted))}</td>
                        <td className="actions" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/partidos/${g.id}/editar`} className="icon-btn" aria-label={`Editar partido vs ${g.opponent}`} title="Editar">
                            <EditIcon size={18} />
                          </Link>
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            aria-label={`Eliminar partido vs ${g.opponent}`}
                            title="Eliminar"
                            onClick={() => setToDelete(g)}
                          >
                            <TrashIcon size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Móvil: tarjetas */}
              <ul className="game-cards show-mobile">
                {filtered.map((g) => (
                  <li key={g.id}>
                    <Link to={`/partidos/${g.id}`} className="game-card">
                      <div className="game-card__top">
                        <div>
                          <span className="game-row__opponent">vs {g.opponent}</span>
                          <span className="small muted">
                            {formatShortDate(g.date)} {g.date.slice(0, 4)} · {g.venue === 'local' ? 'Local' : 'Visitante'}
                          </span>
                        </div>
                        <ResultBadge game={g} withScore />
                      </div>
                      <div className="game-card__stats">
                        <span><strong>{g.points}</strong>PTS</span>
                        <span><strong>{g.rebounds}</strong>REB</span>
                        <span><strong>{g.assists}</strong>AST</span>
                        <span><strong>{fmtPct(pct(g.fgMade, g.fgAttempted))}</strong>TC</span>
                        <ChevronRightIcon size={18} className="muted" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar partido?"
        message={
          toDelete && (
            <>
              Se eliminará el partido vs <strong>{toDelete.opponent}</strong> del {formatShortDate(toDelete.date)}. Esta acción no se
              puede deshacer.
            </>
          )
        }
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
