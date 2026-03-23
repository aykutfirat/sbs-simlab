import { PlayerSummary } from '../../multiplayerTypes';
import { formatCurrency } from '../../utils/formatting';

interface LeaderboardProps {
  players: Record<string, PlayerSummary>;
}

export function Leaderboard({ players }: LeaderboardProps) {
  const sorted = Object.entries(players).sort(
    ([, a], [, b]) => b.cumulativeProfit - a.cumulativeProfit
  );

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">
        No players yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sorted.map(([name, player], idx) => {
        const isTop = idx === 0;
        const profitColor = player.cumulativeProfit >= 0 ? 'text-green-700' : 'text-red-600';

        return (
          <div
            key={name}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              isTop ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
            }`}
          >
            <span className={`w-6 text-center font-bold ${isTop ? 'text-amber-600' : 'text-gray-400'}`}>
              {idx + 1}
            </span>
            <span className="flex-1 truncate font-medium text-gray-800">{name}</span>
            {!player.connected && (
              <span className="text-xs text-red-400">offline</span>
            )}
            <span className={`font-bold ${profitColor}`}>{formatCurrency(player.cumulativeProfit)}</span>
          </div>
        );
      })}
    </div>
  );
}
