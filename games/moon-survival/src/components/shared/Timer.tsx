interface TimerProps {
  seconds: number | null;
}

export default function Timer({ seconds }: TimerProps) {
  if (seconds === null) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 30;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg ${
      isUrgent
        ? 'bg-red-900/40 text-red-400 border border-red-700/50 animate-pulse'
        : 'bg-space-panel text-space-accent border border-space-border'
    }`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      {mins}:{secs.toString().padStart(2, '0')}
    </div>
  );
}
