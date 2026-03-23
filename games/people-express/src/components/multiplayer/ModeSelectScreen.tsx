import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ModeSelectScreen() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const isAuthed = sessionStorage.getItem('instructorPassword') !== null;

  const handleProtectedNav = async (path: string) => {
    if (isAuthed) {
      navigate(path);
      return;
    }

    if (!password) {
      setError('Enter the instructor password.');
      return;
    }

    setChecking(true);
    setError('');

    try {
      const res = await fetch('/people-express/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        sessionStorage.setItem('instructorPassword', password);
        navigate(path);
      } else {
        setError('Invalid password.');
      }
    } catch {
      setError('Could not reach server.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-cockpit-bg flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-2">People Express</h1>
        <p className="text-cockpit-muted mb-10">Airline Management Simulator</p>

        <div className="space-y-4">
          <button
            onClick={() => handleProtectedNav('/play')}
            disabled={checking}
            className="w-full p-6 bg-cockpit-panel border border-cockpit-border rounded-xl
                       hover:border-cockpit-accent transition-colors group text-left"
          >
            <h2 className="text-xl font-bold text-white mb-1 group-hover:text-cockpit-accent">
              Solo Mode
            </h2>
            <p className="text-cockpit-muted text-sm">
              Play individually. Make all decisions at your own pace.
            </p>
          </button>

          <button
            onClick={() => handleProtectedNav('/multiplayer/create')}
            disabled={checking}
            className="w-full p-6 bg-cockpit-panel border border-cockpit-border rounded-xl
                       hover:border-green-500 transition-colors group text-left"
          >
            <h2 className="text-xl font-bold text-white mb-1 group-hover:text-green-400">
              Multiplayer — Instructor
            </h2>
            <p className="text-cockpit-muted text-sm">
              Create a game room for your class. Control pacing and view a live dashboard.
            </p>
          </button>

          <button
            onClick={() => navigate('/multiplayer/join')}
            className="w-full p-6 bg-cockpit-panel border border-cockpit-border rounded-xl
                       hover:border-yellow-500 transition-colors group text-left"
          >
            <h2 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-400">
              Multiplayer — Join Team
            </h2>
            <p className="text-cockpit-muted text-sm">
              Enter a game code to join an instructor-led session.
            </p>
          </button>
        </div>

        {/* Password input — shown when not yet authenticated */}
        {!isAuthed && (
          <div className="mt-8 max-w-xs mx-auto">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProtectedNav('/play')}
              placeholder="Instructor password"
              className="w-full px-4 py-2.5 bg-cockpit-panel border border-cockpit-border rounded-lg
                         text-white text-center text-sm placeholder:text-gray-600
                         focus:border-cockpit-accent focus:outline-none"
            />
            {error && (
              <p className="text-red-400 text-xs mt-2">{error}</p>
            )}
          </div>
        )}

        <p className="text-cockpit-muted text-xs mt-8">
          Suffolk University — Business Simulation
        </p>
      </div>
    </div>
  );
}
