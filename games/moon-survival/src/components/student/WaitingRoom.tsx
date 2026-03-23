interface WaitingRoomProps {
  playerName: string;
  teamName: string | null;
  playerCount: number;
}

export default function WaitingRoom({ playerName, teamName, playerCount }: WaitingRoomProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-5xl">🌙</div>
        <h2 className="text-2xl font-bold text-space-text">Waiting for game to start...</h2>
        <div className="bg-space-panel border border-space-border rounded-lg p-6 space-y-3">
          <p className="text-space-text">
            Welcome, <span className="text-space-accent font-bold">{playerName}</span>
          </p>
          {teamName && (
            <p className="text-space-muted">
              Team: <span className="text-space-text font-medium">{teamName}</span>
            </p>
          )}
          <p className="text-space-muted text-sm">
            {playerCount} player{playerCount !== 1 ? 's' : ''} connected
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-space-muted text-sm">
          <div className="w-2 h-2 bg-space-accent rounded-full animate-pulse" />
          The instructor will start the game shortly
        </div>
      </div>
    </div>
  );
}
