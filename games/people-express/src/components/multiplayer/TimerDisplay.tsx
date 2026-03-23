interface TimerDisplayProps {
  remaining: number | null;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TimerDisplay({ remaining }: TimerDisplayProps) {
  if (remaining === null) {
    return (
      <div className="text-4xl font-mono text-cockpit-muted font-bold text-center">
        --:--
      </div>
    );
  }

  const isUrgent = remaining <= 10;

  return (
    <div className={`text-4xl font-mono font-bold text-center ${
      isUrgent ? 'text-red-400 animate-pulse' : 'text-cockpit-accent'
    }`}>
      {formatTimer(remaining)}
    </div>
  );
}
