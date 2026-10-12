import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import { EmptyState } from './components/ui';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import GameDetail from './pages/GameDetail';
import GameEditor from './pages/GameEditor';
import Stats from './pages/Stats';
import Settings from './pages/Settings';

function NotFound() {
  return (
    <div className="page">
      <EmptyState
        title="Página no encontrada"
        text="La dirección no existe."
        action={<Link to="/" className="btn btn--primary">Ir al panel</Link>}
      />
    </div>
  );
}

// HashRouter: funciona en cualquier hosting estático sin configurar redirecciones.
export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <ToastProvider>
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="partidos" element={<Games />} />
                <Route path="partidos/nuevo" element={<GameEditor />} />
                <Route path="partidos/:id" element={<GameDetail />} />
                <Route path="partidos/:id/editar" element={<GameEditor />} />
                <Route path="estadisticas" element={<Stats />} />
                <Route path="ajustes" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </HashRouter>
        </ToastProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
