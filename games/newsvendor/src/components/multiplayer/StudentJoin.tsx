import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerSocket } from '../../hooks/usePlayerSocket';

export function StudentJoin() {
  const navigate = useNavigate();
  const { connected, joinGame } = usePlayerSocket();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!code.trim() || !name.trim()) {
      setError('Please enter both game code and your name');
      return;
    }

    setJoining(true);
    setError('');

    const result = await joinGame(code.trim().toUpperCase(), name.trim());

    if (result.success) {
      navigate(`/multiplayer/play/${code.trim().toUpperCase()}/${encodeURIComponent(name.trim())}`);
    } else {
      setError(result.error || 'Failed to join');
    }
    setJoining(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <img src="/bagel.svg" alt="" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-bagel-800">Join Game</h1>
          <p className="text-bagel-600 mt-1">Enter the code from your instructor</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-bagel-100">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-500">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Game Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl font-bold font-mono tracking-[0.3em] border-2 border-bagel-200 rounded-lg focus:outline-none focus:border-bagel-400 uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name"
              maxLength={30}
              className="w-full px-4 py-3 border-2 border-bagel-200 rounded-lg focus:outline-none focus:border-bagel-400"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
          )}

          <button
            onClick={handleJoin}
            disabled={!connected || joining || !code.trim() || !name.trim()}
            className="w-full py-3 bg-bagel-600 hover:bg-bagel-700 text-white font-bold rounded-lg shadow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? 'Joining...' : 'Join Game'}
          </button>
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-sm text-bagel-600 hover:text-bagel-700 underline">
            ← Back to single player
          </a>
        </div>
      </div>
    </div>
  );
}
