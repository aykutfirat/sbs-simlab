import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInstructorSocket } from '../../hooks/useInstructorSocket';
import { TeamCard } from './TeamCard';
import { Leaderboard } from './Leaderboard';
import { InstructorControls } from './InstructorControls';
import { ComparativeDebrief } from './ComparativeDebrief';

export function InstructorDashboard() {
  const { gameCode: routeCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const {
    connected,
    roomState,
    debriefData,
    gameCode,
    timerRemaining,
    rejoinGame,
    startGame,
    revealDemand,
    nextRound,
    startTimer,
    pauseTimer,
    endGame,
  } = useInstructorSocket();

  // Auto-rejoin on mount
  useEffect(() => {
    if (connected && routeCode && !gameCode) {
      const stored = sessionStorage.getItem('nvg_instructor');
      const storedPassword = stored ? JSON.parse(stored).password || '' : '';
      rejoinGame(routeCode, storedPassword);
    }
  }, [connected, routeCode, gameCode, rejoinGame]);

  if (!roomState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-bagel-500 text-lg mb-2">Connecting...</div>
          <p className="text-sm text-gray-400">
            {connected ? 'Joining game...' : 'Connecting to server...'}
          </p>
        </div>
      </div>
    );
  }

  // If debrief phase and we have data, show comparative debrief
  if (roomState.phase === 'debrief' && debriefData) {
    return (
      <ComparativeDebrief
        debriefData={debriefData}
        onNewGame={() => navigate('/multiplayer/create')}
      />
    );
  }

  const playerEntries = Object.entries(roomState.players);
  const phaseBadge = {
    lobby: { label: 'LOBBY', color: 'bg-blue-100 text-blue-700' },
    playing: { label: 'PLAYING', color: 'bg-green-100 text-green-700' },
    debrief: { label: 'GAME OVER', color: 'bg-purple-100 text-purple-700' },
  }[roomState.phase];

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-bagel-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/bagel.svg" alt="" className="w-8 h-8" />
            <div>
              <div className="text-sm text-gray-500">Bay Bagels — Instructor</div>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-bold text-bagel-800 tracking-wider">{roomState.gameCode}</code>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseBadge.color}`}>
                  {phaseBadge.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Lobby: Show game code prominently */}
        {roomState.phase === 'lobby' && (
          <div className="text-center mb-8 bg-white rounded-xl shadow-md p-8 border border-bagel-100">
            <p className="text-sm text-gray-500 mb-2">Share this code with your class</p>
            <div className="text-6xl font-bold text-bagel-800 tracking-[0.3em] font-mono mb-3">
              {roomState.gameCode}
            </div>
            <p className="text-sm text-gray-400">
              Students go to <strong>/multiplayer/join</strong> and enter this code
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player cards */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Players ({playerEntries.length})
            </h2>
            {playerEntries.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-bagel-100 p-8 text-center text-gray-400">
                Waiting for players to join...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {playerEntries.map(([name, player]) => (
                  <TeamCard
                    key={name}
                    name={name}
                    player={player}
                    showingResults={roomState.showingResults}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar: controls + leaderboard */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-md p-5 border border-bagel-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Controls
              </h2>
              <InstructorControls
                roomState={roomState}
                timerRemaining={timerRemaining}
                onStartGame={startGame}
                onRevealDemand={revealDemand}
                onNextRound={nextRound}
                onStartTimer={startTimer}
                onPauseTimer={pauseTimer}
                onEndGame={endGame}
              />
            </div>

            {roomState.phase !== 'lobby' && (
              <div className="bg-white rounded-xl shadow-md p-5 border border-bagel-100">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Leaderboard
                </h2>
                <Leaderboard players={roomState.players} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
