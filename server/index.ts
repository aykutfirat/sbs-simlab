import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { games } from './config/games.js';

// Socket.IO handler registrations
import { registerBeerGameSockets } from './sockets/beer-game.js';
import { registerPeopleExpressSockets } from './sockets/people-express.js';
import { registerNewsvendorSockets } from './sockets/newsvendor.js';

// API routes
import { registerNewsvendorApi } from './api/newsvendor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(express.json());

// ── API Routes ────────────────────────────────────────────────

// Games registry endpoint (for landing page)
app.get('/api/games', (_req, res) => {
  res.json(games);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', games: games.length });
});

// Beer Game health (prefixed)
app.get('/beer-game/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// People Express password verification
const INSTRUCTOR_PASSWORD = process.env.INSTRUCTOR_PASSWORD || '';
app.post('/people-express/api/verify-password', (req, res) => {
  const { password } = req.body;
  if (!INSTRUCTOR_PASSWORD || password === INSTRUCTOR_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password.' });
  }
});

// Newsvendor password verification
app.post('/newsvendor/api/verify-password', (req, res) => {
  const { password } = req.body;
  if (!INSTRUCTOR_PASSWORD || password === INSTRUCTOR_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password.' });
  }
});

// Newsvendor leaderboard API
registerNewsvendorApi(app);

// ── Socket.IO Namespaces ──────────────────────────────────────

registerBeerGameSockets(io.of('/beer-game'));
registerPeopleExpressSockets(io.of('/people-express'));
registerNewsvendorSockets(io.of('/newsvendor'));

// ── Static File Serving ───────────────────────────────────────

// Serve each game's built dist at its path
for (const game of games) {
  const distPath = path.join(__dirname, '..', 'games', game.slug, 'dist');
  app.use(`/${game.slug}`, express.static(distPath));
}

// Serve landing page at root
const landingDistPath = path.join(__dirname, '..', 'landing', 'dist');
app.use(express.static(landingDistPath));

// ── SPA Fallbacks ─────────────────────────────────────────────

// Game SPA fallbacks (must come after static serving)
for (const game of games) {
  const distPath = path.join(__dirname, '..', 'games', game.slug, 'dist');
  app.get(`/${game.slug}/*`, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Landing page SPA fallback (catch-all, must be last)
app.get('*', (_req, res) => {
  res.sendFile(path.join(landingDistPath, 'index.html'));
});

// ── Start Server ──────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`SBS SimLab running on port ${PORT}`);
  console.log(`Games: ${games.map(g => `/${g.slug}`).join(', ')}`);
});
