import { RoomState } from '../../multiplayerTypes';

interface InstructorControlsProps {
  roomState: RoomState;
  timerRemaining: number | null;
  onStartGame: () => void;
  onRevealDemand: () => void;
  onNextRound: () => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onEndGame: () => void;
}

export function InstructorControls({
  roomState,
  timerRemaining,
  onStartGame,
  onRevealDemand,
  onNextRound,
  onStartTimer,
  onPauseTimer,
  onEndGame,
}: InstructorControlsProps) {
  const playerCount = Object.keys(roomState.players).length;
  const submittedCount = Object.values(roomState.players).filter((p) => p.hasSubmitted).length;
  const connectedCount = Object.values(roomState.players).filter((p) => p.connected).length;
  const isLastRound = roomState.currentRound >= roomState.config.rounds;

  if (roomState.phase === 'lobby') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          <strong>{playerCount}</strong> player{playerCount !== 1 ? 's' : ''} joined.
          Share the game code with your class.
        </p>
        <button
          onClick={onStartGame}
          disabled={playerCount === 0}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Game ({playerCount} players)
        </button>
      </div>
    );
  }

  if (roomState.phase === 'debrief') {
    return (
      <div className="text-sm text-gray-600 text-center">
        Game over. View the comparative debrief above.
      </div>
    );
  }

  // Playing phase
  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Round <strong>{roomState.currentRound}</strong> of {roomState.config.rounds}
        </span>
        <span className="text-gray-500">
          {connectedCount} online
        </span>
      </div>

      {/* Timer display */}
      {timerRemaining !== null && (
        <div className="text-center">
          <div className={`text-4xl font-bold font-mono ${timerRemaining <= 5 ? 'text-red-600' : 'text-bagel-700'}`}>
            {timerRemaining}s
          </div>
        </div>
      )}

      {/* Submission counter */}
      {!roomState.showingResults && (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-bagel-700">
            {submittedCount} / {connectedCount}
          </div>
          <div className="text-xs text-gray-500">orders submitted</div>
        </div>
      )}

      {/* Action buttons */}
      {roomState.showingResults ? (
        <button
          onClick={onNextRound}
          className={`w-full py-3 font-bold rounded-lg shadow transition-all active:scale-[0.98] ${
            isLastRound
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-bagel-600 hover:bg-bagel-700 text-white'
          }`}
        >
          {isLastRound ? 'End Game → Debrief' : `Next Round (Day ${roomState.currentRound + 1}) →`}
        </button>
      ) : (
        <button
          onClick={onRevealDemand}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-all active:scale-[0.98]"
        >
          Reveal Demand
        </button>
      )}

      {/* Timer controls */}
      {roomState.advanceMode === 'timer' && (
        <div className="flex gap-2">
          {timerRemaining === null ? (
            <button
              onClick={onStartTimer}
              className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all"
            >
              Start Timer
            </button>
          ) : (
            <button
              onClick={onPauseTimer}
              className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-all"
            >
              Pause Timer
            </button>
          )}
        </div>
      )}

      {/* End game early */}
      <button
        onClick={onEndGame}
        className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-all"
      >
        End Game Early
      </button>
    </div>
  );
}
