import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../socket';
import type { InstructorState, GameSettings } from '../../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [state, setState] = useState<InstructorState | null>(null);
  const [creating, setCreating] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    individualTimerSeconds: 300,
    teamTimerSeconds: 600,
    teamSize: 4,
  });
  const [error, setError] = useState('');

  // Check if already authenticated this session
  useEffect(() => {
    if (sessionStorage.getItem('moonInstructorAuth') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    socket.connect();

    socket.on('instructor-state', (s: InstructorState) => {
      setState(s);
    });

    return () => {
      socket.off('instructor-state');
      socket.disconnect();
    };
  }, [authenticated]);

  const verifyPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setAuthError('');
    try {
      const res = await fetch('/moon-survival/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('moonInstructorAuth', 'true');
        setAuthenticated(true);
      } else {
        setAuthError('Invalid password');
      }
    } catch {
      setAuthError('Failed to verify password');
    }
    setVerifying(false);
  }, [password]);

  const createGame = useCallback(() => {
    setCreating(true);
    setError('');
    socket.emit('create-game', settings, (res: any) => {
      setCreating(false);
      if (!res.success) setError(res.error || 'Failed to create');
    });
  }, [settings]);

  const autoAssignTeams = useCallback(() => {
    if (!state) return;
    socket.emit('auto-assign-teams', state.code, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, [state]);

  const startIndividual = useCallback(() => {
    if (!state) return;
    socket.emit('start-individual', state.code, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, [state]);

  const startTeamPhase = useCallback(() => {
    if (!state) return;
    socket.emit('start-team-phase', state.code, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, [state]);

  const revealResults = useCallback(() => {
    if (!state) return;
    socket.emit('reveal-results', state.code, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, [state]);

  const startDebrief = useCallback(() => {
    if (!state) return;
    socket.emit('start-debrief', state.code, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, [state]);

  const resetGame = useCallback(() => {
    if (!state) return;
    if (!confirm('Reset game to lobby? All rankings will be lost.')) return;
    socket.emit('reset-game', state.code, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, [state]);

  const removePlayer = useCallback((playerName: string) => {
    if (!state) return;
    if (!confirm(`Remove ${playerName}?`)) return;
    socket.emit('remove-player', { code: state.code, playerName }, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, [state]);

  const openDebrief = useCallback(() => {
    if (!state) return;
    window.open(`/moon-survival/debrief/${state.code}`, '_blank');
  }, [state]);

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => navigate('/')}
            className="text-space-muted hover:text-space-text text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center">
            <div className="text-4xl mb-2">🔒</div>
            <h1 className="text-2xl font-bold text-space-text">Instructor Access</h1>
            <p className="text-space-muted text-sm mt-1">Enter the instructor password to continue</p>
          </div>

          <form onSubmit={verifyPassword} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-space-panel border border-space-border rounded-lg text-space-text focus:outline-none focus:border-space-accent"
              autoFocus
            />
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-space-accent hover:bg-amber-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // No game created yet
  if (!state) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-md mx-auto space-y-6">
          <button
            onClick={() => navigate('/')}
            className="text-space-muted hover:text-space-text text-sm flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="text-center">
            <div className="text-4xl mb-2">🌙</div>
            <h1 className="text-2xl font-bold text-space-text">Instructor Dashboard</h1>
            <p className="text-space-muted text-sm mt-1">Create a new NASA Moon Survival game</p>
          </div>

          <div className="bg-space-panel border border-space-border rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm text-space-muted mb-1">Team Size</label>
              <select
                value={settings.teamSize}
                onChange={e => setSettings(s => ({ ...s, teamSize: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-space-bg border border-space-border rounded-lg text-space-text"
              >
                {[2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} players per team</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-space-muted mb-1">Individual Phase Timer</label>
              <select
                value={settings.individualTimerSeconds}
                onChange={e => setSettings(s => ({ ...s, individualTimerSeconds: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-space-bg border border-space-border rounded-lg text-space-text"
              >
                <option value={0}>No timer</option>
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={420}>7 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-space-muted mb-1">Team Phase Timer</label>
              <select
                value={settings.teamTimerSeconds}
                onChange={e => setSettings(s => ({ ...s, teamTimerSeconds: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-space-bg border border-space-border rounded-lg text-space-text"
              >
                <option value={0}>No timer</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={900}>15 minutes</option>
                <option value={1200}>20 minutes</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={createGame}
            disabled={creating}
            className="w-full py-3 bg-space-accent hover:bg-amber-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </div>
    );
  }

  const players = Object.values(state.players);
  const teams = Object.values(state.teams);
  const submittedCount = players.filter(p => p.individualRanking !== null).length;
  const unassignedPlayers = players.filter(p => !p.teamId);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-space-text flex items-center gap-2">
              🌙 Moon Survival
              <span className="text-sm font-mono bg-space-accent/20 text-space-accent px-3 py-1 rounded-lg border border-space-accent/30">
                {state.code}
              </span>
            </h1>
            <p className="text-space-muted text-sm">
              Phase: <span className="text-space-text font-medium capitalize">{state.phase}</span>
              {' · '}{players.length} player{players.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {state.timerRemaining !== null && (
              <span className="font-mono text-space-accent bg-space-panel px-3 py-1 rounded-lg border border-space-border">
                {Math.floor(state.timerRemaining / 60)}:{(state.timerRemaining % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700/40 text-red-400 px-4 py-2 rounded-lg text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
          </div>
        )}

        {/* Phase controls */}
        <div className="bg-space-panel border border-space-border rounded-lg p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {state.phase === 'lobby' && (
              <>
                <button onClick={autoAssignTeams} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Auto-Assign Teams
                </button>
                <button
                  onClick={startIndividual}
                  disabled={players.length === 0 || unassignedPlayers.length > 0}
                  className="px-4 py-2 bg-space-accent hover:bg-amber-600 text-black rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  Start Individual Phase →
                </button>
                {unassignedPlayers.length > 0 && (
                  <span className="text-yellow-400 text-xs">
                    {unassignedPlayers.length} player{unassignedPlayers.length !== 1 ? 's' : ''} not assigned
                  </span>
                )}
              </>
            )}

            {state.phase === 'individual' && (
              <>
                <span className="text-space-muted text-sm">
                  {submittedCount}/{players.length} submitted
                </span>
                <button
                  onClick={startTeamPhase}
                  className="px-4 py-2 bg-space-accent hover:bg-amber-600 text-black rounded-lg text-sm font-bold transition-colors"
                >
                  Start Team Phase →
                </button>
              </>
            )}

            {state.phase === 'team' && (
              <>
                {teams.map(t => (
                  <span key={t.id} className="text-xs text-space-muted">
                    {t.name}: {t.confirmedBy.length}/{t.members.length} confirmed
                  </span>
                ))}
                <button
                  onClick={revealResults}
                  className="px-4 py-2 bg-space-accent hover:bg-amber-600 text-black rounded-lg text-sm font-bold transition-colors"
                >
                  Reveal Results →
                </button>
              </>
            )}

            {state.phase === 'results' && (
              <>
                <button
                  onClick={startDebrief}
                  className="px-4 py-2 bg-space-accent hover:bg-amber-600 text-black rounded-lg text-sm font-bold transition-colors"
                >
                  Start Debrief →
                </button>
                <button
                  onClick={openDebrief}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Open Debrief View ↗
                </button>
              </>
            )}

            {state.phase === 'debrief' && (
              <button
                onClick={openDebrief}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Open Debrief View ↗
              </button>
            )}

            <div className="flex-1" />
            <button
              onClick={resetGame}
              className="px-3 py-1.5 text-red-400 hover:bg-red-900/20 rounded-lg text-xs border border-red-800/40 transition-colors"
            >
              Reset Game
            </button>
          </div>
        </div>

        {/* Teams + Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-space-panel border border-space-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-space-text">{team.name}</h3>
                <span className="text-xs text-space-muted">{team.members.length} members</span>
              </div>
              <div className="space-y-1.5">
                {team.members.map(memberName => {
                  const p = state.players[memberName];
                  if (!p) return null;
                  return (
                    <div key={memberName} className="flex items-center justify-between text-sm px-2 py-1.5 bg-space-bg rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-space-text">{memberName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {state.phase === 'individual' && (
                          <span className={`text-xs ${p.individualRanking ? 'text-green-400' : 'text-space-muted'}`}>
                            {p.individualRanking ? '✓ submitted' : 'ranking...'}
                          </span>
                        )}
                        {(state.phase === 'results' || state.phase === 'debrief') && p.individualScore !== null && (
                          <span className="text-xs text-space-accent">Score: {p.individualScore}</span>
                        )}
                        {state.phase === 'team' && (
                          <span className={`text-xs ${team.confirmedBy.includes(memberName) ? 'text-green-400' : 'text-space-muted'}`}>
                            {team.confirmedBy.includes(memberName) ? '✓ confirmed' : 'pending'}
                          </span>
                        )}
                        {state.phase === 'lobby' && (
                          <button
                            onClick={() => removePlayer(memberName)}
                            className="text-red-400/50 hover:text-red-400 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {team.members.length === 0 && (
                  <p className="text-space-muted text-xs text-center py-2">No members</p>
                )}
              </div>

              {(state.phase === 'results' || state.phase === 'debrief') && team.teamScore !== null && (
                <div className="mt-3 pt-3 border-t border-space-border text-center">
                  <span className="text-space-muted text-xs">Team Score: </span>
                  <span className="text-blue-400 font-bold">{team.teamScore}</span>
                </div>
              )}
            </div>
          ))}

          {/* Unassigned players */}
          {unassignedPlayers.length > 0 && (
            <div className="bg-space-panel border border-yellow-800/40 rounded-lg p-4">
              <h3 className="font-bold text-yellow-400 mb-3">Unassigned</h3>
              <div className="space-y-1.5">
                {unassignedPlayers.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-sm px-2 py-1.5 bg-space-bg rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-space-text">{p.name}</span>
                    </div>
                    <button
                      onClick={() => removePlayer(p.name)}
                      className="text-red-400/50 hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
