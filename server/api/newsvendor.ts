import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LeaderboardEntry {
  playerName: string;
  seed: number;
  mode: string;
  totalProfit: number;
  avgOrder: number;
  rounds: number;
  timestamp: string;
}

const LEADERBOARD_FILE = path.join(__dirname, '..', '..', 'data', 'leaderboard.json');

function readLeaderboard(): LeaderboardEntry[] {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return [];
}

function writeLeaderboard(entries: LeaderboardEntry[]) {
  const dir = path.dirname(LEADERBOARD_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2));
}

export function registerNewsvendorApi(app: Express) {
  app.post('/newsvendor/api/results', (req, res) => {
    const { playerName, seed, mode, totalProfit, avgOrder, rounds } = req.body;
    if (!playerName || seed === undefined || totalProfit === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const entry: LeaderboardEntry = {
      playerName: String(playerName).slice(0, 50),
      seed: Number(seed),
      mode: String(mode),
      totalProfit: Number(totalProfit),
      avgOrder: Number(avgOrder),
      rounds: Number(rounds),
      timestamp: new Date().toISOString(),
    };
    const leaderboard = readLeaderboard();
    leaderboard.push(entry);
    writeLeaderboard(leaderboard);
    res.json({ success: true });
  });

  app.get('/newsvendor/api/leaderboard', (req, res) => {
    const seed = req.query.seed ? Number(req.query.seed) : undefined;
    let leaderboard = readLeaderboard();
    if (seed !== undefined) {
      leaderboard = leaderboard.filter((e) => e.seed === seed);
    }
    leaderboard.sort((a, b) => b.totalProfit - a.totalProfit);
    res.json(leaderboard);
  });
}
