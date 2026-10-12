# 🏀 BasketStats

Aplicación web para registrar partidos de básquetbol y analizar el rendimiento individual de un jugador a lo largo de la temporada: promedios automáticos, récords, rachas y gráficos de evolución.

## Funcionalidades

- **Panel principal**: promedios de puntos, rebotes y asistencias con tendencia de los últimos 5 partidos, récord V-D, forma reciente, racha actual, porcentajes de tiro, últimos partidos y récords de la temporada.
- **Registro de partidos**: fecha, rival, local/visitante, marcador (el resultado se calcula solo) y estadísticas individuales: minutos, puntos, rebotes, asistencias, robos, tapas, pérdidas, faltas y tiros (campo, triples y libres).
- **Validaciones**: campos obligatorios, sin empates, anotados ≤ intentados, triples ≤ tiros de campo, puntos ≤ puntaje del equipo. Si los puntos no coinciden con los tiros cargados, la app sugiere el valor correcto.
- **Historial**: búsqueda por rival, filtro por resultado y orden por fecha o estadística (los filtros quedan en la URL). Tabla en escritorio y tarjetas en móvil.
- **Detalle de partido**: marcador, estadísticas comparadas con el promedio, valoración (EFF) y porcentajes de tiro.
- **Edición y eliminación** con confirmación.
- **Estadísticas**: promedios por partido, porcentajes, totales, comparación victorias vs. derrotas y tres gráficos (evolución por partido, porcentajes de tiro y promedios mensuales), filtrables por temporada / últimos 10 / últimos 5 partidos.
- **Persistencia**: los datos se guardan automáticamente en `localStorage`. Se puede exportar e importar una copia en JSON.
- **Perfil del jugador**, tema claro/oscuro y diseño adaptable a móviles.
- En la primera visita se cargan **datos de ejemplo** para que la app se pueda explorar de inmediato.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) | Interfaz y tipado estático |
| [Vite](https://vite.dev) | Servidor de desarrollo y build |
| [React Router](https://reactrouter.com) | Navegación entre pantallas |
| [Recharts](https://recharts.org) | Gráficos |
| CSS puro con variables | Estilos, temas y diseño responsive |
| [Vitest](https://vitest.dev) | Tests de la lógica de estadísticas, validación y almacenamiento |

No necesita backend: es una SPA estática que se puede publicar gratis.

## Ejecutar en local

Requisitos: [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install
npm run dev
```

Abrí http://localhost:5173.

Otros comandos:

```bash
npm test          # tests unitarios
npm run build     # build de producción en dist/
npm run preview   # sirve el build localmente
```

## Estructura

```
src/
├── components/   # Layout, gráficos, formulario y componentes de UI
├── context/      # Estado global: datos, tema y notificaciones
├── lib/          # Lógica pura: estadísticas, validación, almacenamiento, formato
├── pages/        # Panel, Partidos, Detalle, Alta/Edición, Estadísticas, Ajustes
└── types.ts      # Modelo de datos
```

## Publicar

El build (`dist/`) usa rutas relativas y `HashRouter`, así que funciona en cualquier hosting estático sin configuración extra.

- **Vercel**: importá el repositorio en vercel.com → framework *Vite* → Deploy.
- **Netlify**: build command `npm run build`, publish directory `dist`.
- **GitHub Pages**: seguí la [guía oficial de Vite](https://vite.dev/guide/static-deploy#github-pages) (workflow de GitHub Actions que publica `dist/`).
