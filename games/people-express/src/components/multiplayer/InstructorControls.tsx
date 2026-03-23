import type { RoomState } from '../../types';
import TimerDisplay from './TimerDisplay';

interface InstructorControlsProps {
  roomState: RoomState;
  onAdvanceAll: () => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onEndGame: () => void;
  onStartGame: () => void;
}

export default function InstructorControls({
  roomState,
  onAdvanceAll,
  onStartTimer,
  onPauseTimer,
  onEndGame,
  onStartGame,
}: InstructorControlsProps) {
  const { phase, timerRemaining, config } = roomState;
  const teamCount = Object.keys(roomState.teams).length;
  const submittedCount = Object.values(roomState.teams).filter(t => t.hasSubmitted).length;
  const isTimerRunning = timerRemaining !== null && timerRemaining > 0;

  if (phase === 'lobby') {
    return (
      <div className="bg-cockpit-panel border border-cockpit-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-cockpit-muted uppercase tracking-wider mb-4">Controls</h3>
        <p className="text-cockpit-text text-sm mb-4">
          {teamCount} team{teamCount !== 1 ? 's' : ''} joined. Share the game code with your class.
        </p>
        <button
          onClick={onStartGame}
          disabled={teamCount === 0}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600
                     text-white font-semibold rounded-lg transition-colors"
        >
          {teamCount === 0 ? 'Waiting for Teams...' : `Start Game (${teamCount} teams)`}
        </button>
      </div>
    );
  }

  if (phase === 'gameover') {
    return (
      <div className="bg-cockpit-panel border border-cockpit-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-cockpit-muted uppercase tracking-wider mb-4">Controls</h3>
        <p className="text-green-400 font-semibold mb-2">Game Over</p>
        <p className="text-cockpit-muted text-sm">
          Navigate to the debrief to review comparative results.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cockpit-panel border border-cockpit-border rounded-xl p-6">
      <h3 className="text-sm font-semibold text-cockpit-muted uppercase tracking-wider mb-4">Controls</h3>

      <TimerDisplay remaining={timerRemaining} />

      <p className="text-center text-cockpit-muted text-xs mt-2 mb-4">
        {submittedCount}/{teamCount} teams submitted
      </p>

      <div className="space-y-2">
        <button
          onClick={onAdvanceAll}
          className="w-full py-2.5 bg-cockpit-accent hover:bg-blue-600 text-white font-semibold
                     rounded-lg transition-colors text-sm"
        >
          Advance All Teams
        </button>

        {config.advanceMode === 'timer' && (
          isTimerRunning ? (
            <button
              onClick={onPauseTimer}
              className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold
                         rounded-lg transition-colors text-sm"
            >
              Pause Timer
            </button>
          ) : (
            <button
              onClick={onStartTimer}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold
                         rounded-lg transition-colors text-sm"
            >
              Start Timer
            </button>
          )
        )}

        <button
          onClick={onEndGame}
          className="w-full py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold
                     rounded-lg transition-colors text-sm"
        >
          End Game
        </button>
      </div>
    </div>
  );
}
