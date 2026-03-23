import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function TeamJoinScreen() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = () => {
    const code = gameCode.trim().toUpperCase();
    const name = teamName.trim();

    if (!code || !name) {
      setError('Please enter both a game code and team name.');
      return;
    }

    setJoining(true);
    setError('');

    const socket = io('/people-express');
    socket.emit('join-game', { gameCode: code, teamName: name }, (response: { success: boolean; error?: string }) => {
      socket.disconnect();
      if (response.success) {
        navigate(`/multiplayer/team/${code}/${encodeURIComponent(name)}`);
      } else {
        setError(response.error || 'Failed to join.');
        setJoining(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-cockpit-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="text-cockpit-muted hover:text-white text-sm mb-6 inline-block"
        >
          &larr; Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-6">Join Game</h1>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-cockpit-text block mb-1">Game Code</label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full px-4 py-3 bg-cockpit-panel border border-cockpit-border rounded-lg
                         text-white text-center text-2xl font-mono tracking-widest
                         placeholder:text-gray-600 focus:border-cockpit-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-cockpit-text block mb-1">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Blue Eagles"
              maxLength={24}
              className="w-full px-4 py-3 bg-cockpit-panel border border-cockpit-border rounded-lg
                         text-white placeholder:text-gray-600
                         focus:border-cockpit-accent focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600
                       text-white font-semibold rounded-lg transition-colors"
          >
            {joining ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
