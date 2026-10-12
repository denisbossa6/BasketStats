import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Game } from '../types';
import { gameResult } from '../lib/stats';
import { fmtDelta } from '../lib/format';

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card__header">
          {title && <h2 className="card__title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: ReactNode;
  /** Diferencia de los últimos partidos respecto del promedio general. */
  delta?: number | null;
  /** true cuando un valor más alto es peor (p. ej. pérdidas). */
  invert?: boolean;
  accent?: boolean;
}

export function StatCard({ label, value, hint, delta, invert = false, accent = false }: StatCardProps) {
  const showDelta = delta !== undefined && delta !== null;
  const good = showDelta && (invert ? delta < 0 : delta > 0);
  const neutral = showDelta && Math.abs(delta) < 0.05;
  return (
    <div className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {showDelta ? (
        <span className={`stat-card__delta ${neutral ? '' : good ? 'is-up' : 'is-down'}`}>
          <span aria-hidden="true">{neutral ? '•' : delta > 0 ? '▲' : '▼'}</span> {fmtDelta(delta)}{' '}
          <span className="muted">últimos 5</span>
        </span>
      ) : (
        hint && <span className="stat-card__hint">{hint}</span>
      )}
    </div>
  );
}

export function ResultBadge({ game, withScore = false }: { game: Pick<Game, 'teamScore' | 'opponentScore'>; withScore?: boolean }) {
  const win = gameResult(game) === 'W';
  return (
    <span className={`result ${win ? 'result--win' : 'result--loss'}`} title={win ? 'Victoria' : 'Derrota'}>
      <span className="result__letter">{win ? 'V' : 'D'}</span>
      {withScore && (
        <span className="result__score">
          {game.teamScore}–{game.opponentScore}
        </span>
      )}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__ball" aria-hidden="true">🏀</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function EmptyGamesCta() {
  return (
    <EmptyState
      title="Todavía no hay partidos"
      text="Registrá tu primer partido para ver promedios, gráficos y la evolución de tu temporada."
      action={
        <Link to="/partidos/nuevo" className="btn btn--primary">
          Registrar partido
        </Link>
      }
    />
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Diálogo modal accesible basado en <dialog>. */
export function ConfirmDialog({ open, title, message, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
    >
      <div className="dialog__body">
        <h2 className="dialog__title">{title}</h2>
        <div className="dialog__message">{message}</div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** Barra de porcentaje para tiros (medidor simple). */
export function Meter({ label, value, detail }: { label: string; value: number | null; detail: string }) {
  return (
    <div className="meter">
      <div className="meter__top">
        <span className="meter__label">{label}</span>
        <span className="meter__value">{value === null ? '—' : `${value.toFixed(1).replace('.', ',')}%`}</span>
      </div>
      <div className="meter__track" role="img" aria-label={`${label}: ${value === null ? 'sin intentos' : `${value.toFixed(1)}%`}`}>
        <div className="meter__fill" style={{ width: `${Math.min(100, value ?? 0)}%` }} />
      </div>
      <span className="meter__detail">{detail}</span>
    </div>
  );
}
