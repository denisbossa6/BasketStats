import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useData } from '../context/DataContext';
import { useTheme, type ThemePreference } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Card, ConfirmDialog, PageHeader } from '../components/ui';
import { DownloadIcon, UploadIcon } from '../components/Icons';
import { parseAppData } from '../lib/storage';
import { todayIso } from '../lib/format';
import type { AppData, PlayerProfile } from '../types';

const POSITIONS = ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'];

type Pending = { kind: 'import'; data: AppData } | { kind: 'demo' } | { kind: 'clear' } | null;

export default function Settings() {
  const { data, profile, updateProfile, replaceData, loadDemo, clearAll } = useData();
  const { preference, setPreference } = useTheme();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<PlayerProfile>(profile);
  const [pending, setPending] = useState<Pending>(null);

  // Mantiene el formulario sincronizado si el perfil cambia (importar, ejemplo, borrar).
  useEffect(() => setDraft(profile), [profile]);

  const onProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: draft.name.trim().slice(0, 60),
      team: draft.team.trim().slice(0, 60),
      position: draft.position,
      number: draft.number.trim().slice(0, 3),
    });
    toast('Perfil actualizado');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basketstats-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Copia de seguridad descargada');
  };

  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = parseAppData(JSON.parse(await file.text()));
      if (!parsed) throw new Error('formato');
      setPending({ kind: 'import', data: parsed });
    } catch {
      toast('El archivo no es una copia válida de BasketStats', 'error');
    }
  };

  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === 'import') {
      replaceData(pending.data);
      toast(`${pending.data.games.length} partidos importados`);
    } else if (pending.kind === 'demo') {
      loadDemo();
      toast('Datos de ejemplo cargados');
    } else {
      clearAll();
      toast('Todos los datos fueron eliminados');
    }
    setPending(null);
  };

  const dialog = {
    import: {
      title: '¿Importar copia de seguridad?',
      message: pending?.kind === 'import' && (
        <>
          Se reemplazarán tus {data.games.length} partidos actuales por los <strong>{pending.data.games.length}</strong> del archivo.
        </>
      ),
      label: 'Importar',
    },
    demo: {
      title: '¿Cargar datos de ejemplo?',
      message: <>Se reemplazarán tus datos actuales por una temporada de ejemplo. Exportá una copia antes si querés conservarlos.</>,
      label: 'Cargar ejemplo',
    },
    clear: {
      title: '¿Borrar todos los datos?',
      message: <>Se eliminarán tu perfil y los {data.games.length} partidos registrados. Esta acción no se puede deshacer.</>,
      label: 'Borrar todo',
    },
  };
  const current = pending ? dialog[pending.kind] : null;

  return (
    <div className="page page--narrow">
      <PageHeader title="Ajustes" subtitle="Perfil del jugador, apariencia y gestión de datos." />

      <Card title="Perfil del jugador">
        <form onSubmit={saveProfile} className="settings-form">
          <div className="form-grid form-grid--2">
            <div className="field">
              <label htmlFor="p-name">Nombre</label>
              <input id="p-name" name="name" value={draft.name} onChange={onProfileChange} maxLength={60} placeholder="Tu nombre" />
            </div>
            <div className="field">
              <label htmlFor="p-team">Equipo</label>
              <input id="p-team" name="team" value={draft.team} onChange={onProfileChange} maxLength={60} placeholder="Club o equipo" />
            </div>
            <div className="field">
              <label htmlFor="p-position">Posición</label>
              <select id="p-position" name="position" value={draft.position} onChange={onProfileChange}>
                <option value="">Sin especificar</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-number">Número de camiseta</label>
              <input id="p-number" name="number" value={draft.number} onChange={onProfileChange} maxLength={3} inputMode="numeric" placeholder="Ej: 23" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">
              Guardar perfil
            </button>
          </div>
        </form>
      </Card>

      <Card title="Apariencia">
        <div className="segmented" role="radiogroup" aria-label="Tema">
          {(
            [
              ['system', 'Sistema'],
              ['light', 'Claro'],
              ['dark', 'Oscuro'],
            ] as [ThemePreference, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={preference === value}
              className={`segmented__option ${preference === value ? 'is-active' : ''}`}
              onClick={() => setPreference(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Datos">
        <p className="muted">
          Tus partidos se guardan automáticamente en este navegador. Exportá una copia para respaldarlos o pasarlos a otro dispositivo.
        </p>
        <div className="button-row">
          <button type="button" className="btn btn--secondary" onClick={exportJson}>
            <DownloadIcon size={18} /> Exportar JSON
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => fileRef.current?.click()}>
            <UploadIcon size={18} /> Importar JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
        </div>
        <hr className="divider" />
        <div className="button-row">
          <button type="button" className="btn btn--ghost" onClick={() => setPending({ kind: 'demo' })}>
            Cargar datos de ejemplo
          </button>
          <button type="button" className="btn btn--danger-ghost" onClick={() => setPending({ kind: 'clear' })}>
            Borrar todos los datos
          </button>
        </div>
      </Card>

      <ConfirmDialog
        open={current !== null}
        title={current?.title ?? ''}
        message={current?.message}
        confirmLabel={current?.label ?? ''}
        danger={pending?.kind !== 'import'}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
