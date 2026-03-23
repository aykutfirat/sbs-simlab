import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'student' | 'instructor'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  function handleJoinAsStudent(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const code = roomCode.trim().toUpperCase();
    const name = playerName.trim();
    if (!code) return setError('Enter a room code');
    if (!name) return setError('Enter your name');
    navigate(`/play/${code}/${encodeURIComponent(name)}`);
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <div className="text-5xl mb-4">🌙</div>
            <h1 className="text-3xl font-bold text-space-text">NASA Moon Survival</h1>
            <p className="mt-2 text-space-muted text-sm">
              Rank 15 survival items after a moon crash landing.
              <br />Can your team beat your individual score?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setMode('student')}
              className="w-full py-4 bg-space-accent hover:bg-amber-600 text-black font-bold rounded-lg transition-colors text-lg"
            >
              Join as Student
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-space-panel hover:bg-space-border text-space-text font-medium rounded-lg border border-space-border transition-colors"
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
        <button
          onClick={() => setMode('select')}
          className="text-space-muted hover:text-space-text text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center">
          <div className="text-4xl mb-3">🌙</div>
          <h1 className="text-2xl font-bold text-space-text">Join Game</h1>
        </div>

        <form onSubmit={handleJoinAsStudent} className="space-y-4">
          <div>
            <label className="block text-sm text-space-muted mb-1">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 5-letter code"
              maxLength={5}
              className="w-full px-4 py-3 bg-space-panel border border-space-border rounded-lg text-space-text text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-space-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-space-muted mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-space-panel border border-space-border rounded-lg text-space-text focus:outline-none focus:border-space-accent"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-space-accent hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
          >
            Join Game
          </button>
        </form>
      </div>
    </div>
  );
}
