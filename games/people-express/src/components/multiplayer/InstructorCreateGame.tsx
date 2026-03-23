import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import type { RoomConfig, AdvanceMode } from '../../types';

export default function InstructorCreateGame() {
  const navigate = useNavigate();
  const [advanceMode, setAdvanceMode] = useState<AdvanceMode>('manual');
  const [timerDuration, setTimerDuration] = useState(120);
  const [maxTeams, setMaxTeams] = useState(6);
  const [password, setPassword] = useState(sessionStorage.getItem('instructorPassword') || '');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    setCreating(true);
    setError('');
    const socket = io('/people-express');

    const config: RoomConfig = {
      advanceMode,
      timerDuration,
      maxTeams,
    };

    socket.emit('create-game', { config, password }, (response: { gameCode?: string; error?: string }) => {
      socket.disconnect();
      if (response.error) {
        setError(response.error);
        setCreating(false);
        return;
      }
      // Store password for instructor reconnect
      sessionStorage.setItem('instructorPassword', password);
      navigate(`/multiplayer/instructor/${response.gameCode}`);
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

        <h1 className="text-2xl font-bold text-white mb-6">Create Multiplayer Game</h1>

        <div className="space-y-6">
          {/* Advance Mode */}
          <div>
            <label className="text-sm font-medium text-cockpit-text block mb-2">
              Quarter Advance Mode
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setAdvanceMode('manual')}
                className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  advanceMode === 'manual'
                    ? 'border-cockpit-accent bg-cockpit-accent/10 text-cockpit-accent'
                    : 'border-cockpit-border text-cockpit-muted hover:border-gray-500'
                }`}
              >
                Manual
                <p className="text-xs mt-1 font-normal opacity-70">
                  Instructor clicks to advance
                </p>
              </button>
              <button
                onClick={() => setAdvanceMode('timer')}
                className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  advanceMode === 'timer'
                    ? 'border-cockpit-accent bg-cockpit-accent/10 text-cockpit-accent'
                    : 'border-cockpit-border text-cockpit-muted hover:border-gray-500'
                }`}
              >
                Timer
                <p className="text-xs mt-1 font-normal opacity-70">
                  Auto-advance on countdown
                </p>
              </button>
            </div>
          </div>

          {/* Timer Duration (only if timer mode) */}
          {advanceMode === 'timer' && (
            <div>
              <label className="text-sm font-medium text-cockpit-text block mb-2">
                Seconds Per Quarter
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={30}
                  max={300}
                  step={10}
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                             [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-cockpit-accent"
                />
                <span className="text-cockpit-accent font-mono text-sm w-12 text-right">
                  {timerDuration}s
                </span>
              </div>
            </div>
          )}

          {/* Max Teams */}
          <div>
            <label className="text-sm font-medium text-cockpit-text block mb-2">
              Max Teams
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6, 8].map(n => (
                <button
                  key={n}
                  onClick={() => setMaxTeams(n)}
                  className={`px-4 py-2 rounded-lg border text-sm font-mono transition-colors ${
                    maxTeams === n
                      ? 'border-cockpit-accent bg-cockpit-accent/10 text-cockpit-accent'
                      : 'border-cockpit-border text-cockpit-muted hover:border-gray-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Instructor Password */}
          <div>
            <label className="text-sm font-medium text-cockpit-text block mb-1">
              Instructor Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
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

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600
                       text-white font-semibold rounded-lg transition-colors"
          >
            {creating ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
