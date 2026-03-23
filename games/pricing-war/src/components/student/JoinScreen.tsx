import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'student'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const code = roomCode.trim().toUpperCase();
    const team = teamName.trim();
    const name = playerName.trim();
    if (!code) return setError('Enter a room code');
    if (!team) return setError('Enter your team/firm name');
    if (!name) return setError('Enter your name');
    // Store player name for the session
    sessionStorage.setItem('pricingWarPlayer', name);
    navigate(`/play/${code}/${encodeURIComponent(team)}`);
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <div className="text-5xl mb-4">⚔️</div>
            <h1 className="text-3xl font-bold text-war-text">Pricing War Arena</h1>
            <p className="mt-2 text-war-muted text-sm">
              Compete in a cloud storage oligopoly.
              <br />Set prices, invest in quality, outmaneuver rivals.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setMode('student')}
              className="w-full py-4 bg-war-accent hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors text-lg"
            >
              Join as Team
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-war-panel hover:bg-war-border text-war-text font-medium rounded-lg border border-war-border transition-colors"
            >
              Instructor Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <button onClick={() => setMode('select')} className="text-war-muted hover:text-war-text text-sm flex items-center gap-1">
          ← Back
        </button>
        <div className="text-center">
          <div className="text-4xl mb-3">⚔️</div>
          <h1 className="text-2xl font-bold text-war-text">Join Game</h1>
        </div>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm text-war-muted mb-1">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 5-letter code"
              maxLength={5}
              className="w-full px-4 py-3 bg-war-panel border border-war-border rounded-lg text-war-text text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-war-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-war-muted mb-1">Team / Firm Name</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="e.g. Nova Cloud"
              maxLength={20}
              className="w-full px-4 py-3 bg-war-panel border border-war-border rounded-lg text-war-text focus:outline-none focus:border-war-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-war-muted mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-war-panel border border-war-border rounded-lg text-war-text focus:outline-none focus:border-war-accent"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full py-3 bg-war-accent hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors">
            Join Game
          </button>
        </form>
      </div>
    </div>
  );
}
