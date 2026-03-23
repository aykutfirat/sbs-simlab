import { useParams, useNavigate } from 'react-router-dom';
import { useInstructorSocket } from '../../hooks/useInstructorSocket';
import { quarterLabel } from '../../utils/formatting';
import TeamCard from './TeamCard';
import Leaderboard from './Leaderboard';
import InstructorControls from './InstructorControls';

export default function InstructorDashboard() {
  const { gameCode = '' } = useParams();
  const navigate = useNavigate();
  const {
    connected,
    roomState,
    startGame,
    advanceAll,
    startTimer,
    pauseTimer,
    endGame,
  } = useInstructorSocket(gameCode);

  if (!roomState) {
    return (
      <div className="min-h-screen bg-cockpit-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cockpit-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cockpit-muted">Connecting to game {gameCode}...</p>
        </div>
      </div>
    );
  }

  const teams = Object.values(roomState.teams);

  return (
    <div className="min-h-screen bg-cockpit-bg p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cockpit-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white">PEOPLE EXPRESS MULTIPLAYER</h1>
          <span className="font-mono text-cockpit-accent text-sm bg-cockpit-panel px-3 py-1 rounded border border-cockpit-border">
            Game: {gameCode}
          </span>
          {roomState.phase === 'playing' && (
            <span className="text-cockpit-muted text-sm">
              {quarterLabel(roomState.currentQuarter)} (Q{roomState.currentQuarter}/40)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {roomState.phase === 'gameover' && (
            <button
              onClick={() => navigate(`/multiplayer/debrief/${gameCode}`)}
              className="px-4 py-1.5 bg-cockpit-accent hover:bg-blue-600 text-white font-semibold
                         rounded-lg transition-colors text-sm"
            >
              View Debrief
            </button>
          )}
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-cockpit-muted text-xs">{roomState.phase.toUpperCase()}</span>
        </div>
      </div>

      {/* Lobby: show game code prominently */}
      {roomState.phase === 'lobby' && (
        <div className="text-center mb-6 py-6 bg-cockpit-panel border border-cockpit-border rounded-xl">
          <p className="text-cockpit-muted text-sm mb-2">Share this code with your class:</p>
          <p className="text-5xl font-mono font-bold text-cockpit-accent tracking-[0.3em]">
            {gameCode}
          </p>
          <p className="text-cockpit-muted text-xs mt-2">
            Teams join at <span className="text-cockpit-text">Multiplayer &rarr; Join Team</span>
          </p>
        </div>
      )}

      {/* Team Cards */}
      {teams.length > 0 && (
        <div className="mb-4">
          <div className={`grid gap-3 ${
            teams.length <= 3 ? 'grid-cols-3' :
            teams.length <= 4 ? 'grid-cols-4' :
            teams.length <= 6 ? 'grid-cols-3 lg:grid-cols-6' :
            'grid-cols-4 lg:grid-cols-8'
          }`}>
            {teams.map(team => (
              <TeamCard key={team.teamName} team={team} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom row: Leaderboard + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teams.length > 0 && (
          <Leaderboard teams={roomState.teams} />
        )}
        <InstructorControls
          roomState={roomState}
          onAdvanceAll={advanceAll}
          onStartTimer={startTimer}
          onPauseTimer={pauseTimer}
          onEndGame={endGame}
          onStartGame={startGame}
        />
      </div>
    </div>
  );
}
