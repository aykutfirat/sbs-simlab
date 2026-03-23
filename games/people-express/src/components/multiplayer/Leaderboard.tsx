import type { TeamSummary } from '../../types';

interface LeaderboardProps {
  teams: Record<string, TeamSummary>;
}

export default function Leaderboard({ teams }: LeaderboardProps) {
  const sorted = Object.values(teams).sort((a, b) => {
    // Bankrupt teams go to bottom
    if (a.isBankrupt && !b.isBankrupt) return 1;
    if (!a.isBankrupt && b.isBankrupt) return -1;
    // Sort by stock price descending
    return b.currentState.stockPrice - a.currentState.stockPrice;
  });

  return (
    <div className="bg-cockpit-panel border border-cockpit-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-cockpit-muted uppercase tracking-wider mb-3">Leaderboard</h3>
      <div className="space-y-1.5">
        {sorted.map((team, i) => (
          <div
            key={team.teamName}
            className={`flex items-center gap-3 text-sm px-2 py-1.5 rounded ${
              i === 0 && !team.isBankrupt ? 'bg-yellow-900/20' : ''
            }`}
          >
            <span className="text-cockpit-muted font-mono w-5 text-right">{i + 1}.</span>
            <span className={`flex-1 font-medium truncate ${
              team.isBankrupt ? 'text-red-400 line-through' : 'text-white'
            }`}>
              {team.teamName}
            </span>
            <span className={`font-mono text-sm ${
              team.isBankrupt ? 'text-red-400' : 'text-cockpit-accent'
            }`}>
              {team.isBankrupt ? 'BANKRUPT' : `$${team.currentState.stockPrice.toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
