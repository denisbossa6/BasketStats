import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { BallIcon, ChartIcon, DashboardIcon, ListIcon, MoonIcon, PlusIcon, SettingsIcon, SunIcon } from './Icons';

const NAV = [
  { to: '/', label: 'Panel', icon: DashboardIcon, end: true },
  { to: '/partidos', label: 'Partidos', icon: ListIcon, end: false },
  { to: '/estadisticas', label: 'Estadísticas', icon: ChartIcon, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: SettingsIcon, end: false },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'claro' : 'oscuro';
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={`Cambiar a tema ${next}`} title={`Tema ${next}`}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const { saveFailed } = useData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand__logo"><BallIcon size={22} /></span>
          <span className="brand__name">Basket<strong>Stats</strong></span>
        </Link>
        <Link to="/partidos/nuevo" className="btn btn--primary btn--block sidebar__cta">
          <PlusIcon size={18} /> Nuevo partido
        </Link>
        <nav className="sidebar__nav" aria-label="Principal">
          {NAV.map(({ to, label, icon: Ico, end }) => (
            <NavLink key={to} to={to} end={end} className="sidebar__link">
              <Ico /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <ThemeToggle />
          <span className="muted small">Datos guardados en este navegador</span>
        </div>
      </aside>

      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand__logo"><BallIcon size={20} /></span>
          <span className="brand__name">Basket<strong>Stats</strong></span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="main">
        {saveFailed && (
          <div className="banner banner--error" role="alert">
            No se pudieron guardar los cambios en este navegador (almacenamiento lleno o bloqueado).
          </div>
        )}
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Principal">
        {NAV.slice(0, 2).map(({ to, label, icon: Ico, end }) => (
          <NavLink key={to} to={to} end={end} className="bottom-nav__link">
            <Ico /> <span>{label}</span>
          </NavLink>
        ))}
        <Link to="/partidos/nuevo" className="bottom-nav__add" aria-label="Nuevo partido">
          <PlusIcon size={24} />
        </Link>
        {NAV.slice(2).map(({ to, label, icon: Ico, end }) => (
          <NavLink key={to} to={to} end={end} className="bottom-nav__link">
            <Ico /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
