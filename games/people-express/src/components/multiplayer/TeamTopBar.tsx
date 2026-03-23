import type { RoomPhase } from '../../types';

interface TeamTopBarProps {
  teamName: string;
  gameCode: string;
  connected: boolean;
  phase: RoomPhase;
  hasSubmitted: boolean;
  timerRemaining: number | null;
  currentQuarter: number;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TeamTopBar({
  teamName,
  gameCode,
  connected,
  phase,
  hasSubmitted,
  timerRemaining,
  currentQuarter,
}: TeamTopBarProps) {
  return (
    <div className="h-10 bg-cockpit-panel border-b border-cockpit-border flex items-center px-4 gap-4 text-xs shrink-0">
      <span className="font-bold text-white">{teamName}</span>
      <span className="text-cockpit-muted">Game: {gameCode}</span>

      <div className="flex-1" />

      {phase === 'lobby' && (
        <span className="text-yellow-400">Waiting for instructor to start...</span>
      )}

      {phase === 'playing' && timerRemaining !== null && (
        <span className={`font-mono font-bold ${timerRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-cockpit-accent'}`}>
          {formatTimer(timerRemaining)}
        </span>
      )}

      {phase === 'playing' && hasSubmitted && (
        <span className="text-green-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Submitted
        </span>
      )}

      {phase === 'gameover' && (
        <span className="text-red-400 font-semibold">Game Over</span>
      )}

      <span className="text-cockpit-muted">Q{currentQuarter}/40</span>

      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
    </div>
  );
}
