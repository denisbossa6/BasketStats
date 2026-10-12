import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { GameInput } from '../types';
import { pointsMismatch, validateGame, type GameFormErrors, type GameFormValues } from '../lib/validation';
import { pct } from '../lib/stats';
import { fmtPct } from '../lib/format';

type Field = keyof GameFormValues;

interface GameFormProps {
  initialValues: GameFormValues;
  submitLabel: string;
  onSubmit: (data: GameInput) => void;
  onCancel: () => void;
}

const STAT_FIELDS: { name: Field; label: string; abbr: string }[] = [
  { name: 'points', label: 'Puntos', abbr: 'PTS' },
  { name: 'rebounds', label: 'Rebotes', abbr: 'REB' },
  { name: 'assists', label: 'Asistencias', abbr: 'AST' },
  { name: 'steals', label: 'Robos', abbr: 'ROB' },
  { name: 'blocks', label: 'Tapas', abbr: 'TAP' },
  { name: 'turnovers', label: 'Pérdidas', abbr: 'PER' },
  { name: 'fouls', label: 'Faltas', abbr: 'FAL' },
  { name: 'minutes', label: 'Minutos', abbr: 'MIN' },
];

const SHOT_GROUPS: { title: string; made: Field; attempted: Field }[] = [
  { title: 'Tiros de campo (incluye triples)', made: 'fgMade', attempted: 'fgAttempted' },
  { title: 'Triples', made: 'threeMade', attempted: 'threeAttempted' },
  { title: 'Tiros libres', made: 'ftMade', attempted: 'ftAttempted' },
];

const num = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : 0);

export default function GameForm({ initialValues, submitLabel, onSubmit, onCancel }: GameFormProps) {
  const [values, setValues] = useState<GameFormValues>(initialValues);
  const [errors, setErrors] = useState<GameFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (name: Field, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    // Tras el primer intento de envío, los errores se actualizan en vivo.
    if (submitted) setErrors(validateGame(next).errors);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    update(e.target.name as Field, e.target.value);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const result = validateGame(values);
    setErrors(result.errors);
    if (result.data) {
      onSubmit(result.data);
    } else {
      const first = Object.keys(result.errors)[0];
      document.getElementById(`f-${first}`)?.focus();
    }
  };

  const expectedPoints = pointsMismatch(values);
  const hasScores = values.teamScore.trim() !== '' && values.opponentScore.trim() !== '';
  const team = num(values.teamScore);
  const opp = num(values.opponentScore);

  const numberInput = (name: Field, label: string, extra?: { abbr?: string; placeholder?: string }) => (
    <div className={`field ${errors[name] ? 'has-error' : ''}`}>
      <label htmlFor={`f-${name}`}>
        {label} {extra?.abbr && <span className="field__abbr">{extra.abbr}</span>}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        placeholder={extra?.placeholder ?? '0'}
        value={values[name]}
        onChange={onChange}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `e-${name}` : undefined}
      />
      {errors[name] && (
        <span className="field__error" id={`e-${name}`}>
          {errors[name]}
        </span>
      )}
    </div>
  );

  return (
    <form className="game-form" onSubmit={handleSubmit} noValidate>
      <section className="card form-section">
        <h2 className="card__title">Datos del partido</h2>
        <div className="form-grid form-grid--3">
          <div className={`field ${errors.date ? 'has-error' : ''}`}>
            <label htmlFor="f-date">Fecha</label>
            <input id="f-date" name="date" type="date" value={values.date} onChange={onChange} aria-invalid={!!errors.date} />
            {errors.date && <span className="field__error">{errors.date}</span>}
          </div>
          <div className={`field ${errors.opponent ? 'has-error' : ''}`}>
            <label htmlFor="f-opponent">Rival</label>
            <input
              id="f-opponent"
              name="opponent"
              type="text"
              placeholder="Nombre del equipo rival"
              maxLength={60}
              value={values.opponent}
              onChange={onChange}
              aria-invalid={!!errors.opponent}
              autoComplete="off"
            />
            {errors.opponent && <span className="field__error">{errors.opponent}</span>}
          </div>
          <div className="field">
            <span className="field__label" id="venue-label">Condición</span>
            <div className="segmented" role="radiogroup" aria-labelledby="venue-label">
              {(['local', 'visitante'] as const).map((v) => (
                <label key={v} className={`segmented__option ${values.venue === v ? 'is-active' : ''}`}>
                  <input type="radio" name="venue" value={v} checked={values.venue === v} onChange={onChange} />
                  {v === 'local' ? 'Local' : 'Visitante'}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-grid form-grid--score">
          {numberInput('teamScore', 'Puntos de tu equipo', { placeholder: 'Ej: 78' })}
          {numberInput('opponentScore', 'Puntos del rival', { placeholder: 'Ej: 72' })}
          <div className="score-preview" aria-live="polite">
            {hasScores && team !== opp ? (
              <span className={`result ${team > opp ? 'result--win' : 'result--loss'}`}>
                <span className="result__letter">{team > opp ? 'V' : 'D'}</span>
                <span className="result__score">
                  {team > opp ? 'Victoria' : 'Derrota'} por {Math.abs(team - opp)}
                </span>
              </span>
            ) : (
              <span className="muted small">El resultado se calcula automáticamente</span>
            )}
          </div>
        </div>
      </section>

      <section className="card form-section">
        <h2 className="card__title">Estadísticas individuales</h2>
        <div className="form-grid form-grid--4">
          {STAT_FIELDS.map((f) => (
            <div key={f.name}>{numberInput(f.name, f.label, { abbr: f.abbr })}</div>
          ))}
        </div>
        {expectedPoints !== null && !errors.points && (
          <div className="hint-box">
            <span>
              Según los tiros cargados corresponden <strong>{expectedPoints} puntos</strong>.
            </span>
            <button type="button" className="btn btn--small btn--ghost" onClick={() => update('points', String(expectedPoints))}>
              Usar {expectedPoints}
            </button>
          </div>
        )}
      </section>

      <section className="card form-section">
        <h2 className="card__title">Lanzamientos</h2>
        <div className="shots-grid">
          {SHOT_GROUPS.map((g) => (
            <fieldset key={g.made} className="shot-group">
              <legend>{g.title}</legend>
              <div className="shot-group__inputs">
                {numberInput(g.made, 'Anotados')}
                {numberInput(g.attempted, 'Intentados')}
              </div>
              <span className="shot-group__pct">{fmtPct(pct(num(values[g.made]), num(values[g.attempted])))}</span>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="card form-section">
        <div className="field">
          <label htmlFor="f-notes">Notas (opcional)</label>
          <textarea
            id="f-notes"
            name="notes"
            rows={3}
            maxLength={500}
            placeholder="Sensaciones, aspectos a mejorar, contexto del partido…"
            value={values.notes}
            onChange={onChange}
          />
        </div>
      </section>

      {submitted && Object.keys(errors).length > 0 && (
        <p className="form-error" role="alert">
          Revisá los campos marcados antes de guardar.
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
