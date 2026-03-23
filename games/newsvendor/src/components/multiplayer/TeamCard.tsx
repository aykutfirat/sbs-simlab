import { PlayerSummary } from '../../multiplayerTypes';
import { formatCurrency } from '../../utils/formatting';

interface TeamCardProps {
  name: string;
  player: PlayerSummary;
  showingResults: boolean;
}

export function TeamCard({ name, player, showingResults }: TeamCardProps) {
  let borderColor = 'border-gray-200';
  let statusBadge: React.ReactNode = null;

  if (!player.connected) {
    borderColor = 'border-red-300';
    statusBadge = <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">OFFLINE</span>;
  } else if (player.hasSubmitted) {
    borderColor = 'border-green-400';
    statusBadge = <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Submitted</span>;
  } else if (!showingResults) {
    borderColor = 'border-yellow-300';
    statusBadge = (
      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">
        <span className="inline-block w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
        Deciding...
      </span>
    );
  }

  const profitColor = player.cumulativeProfit >= 0 ? 'text-green-700' : 'text-red-700';

  return (
    <div className={`bg-white rounded-lg border-2 ${borderColor} p-3 transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-gray-800 truncate">{name}</span>
        {statusBadge}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-400">Profit</div>
          <div className={`font-bold ${profitColor}`}>{formatCurrency(player.cumulativeProfit)}</div>
        </div>
        <div>
          <div className="text-gray-400">Avg Order</div>
          <div className="font-bold text-blue-700">{player.avgOrder || '-'}</div>
        </div>
        {player.lastOrder !== null && (
          <div>
            <div className="text-gray-400">Last Order</div>
            <div className="font-medium text-blue-600">{player.lastOrder}</div>
          </div>
        )}
        {player.lastDemand !== null && (
          <div>
            <div className="text-gray-400">Last Demand</div>
            <div className="font-medium text-orange-600">{player.lastDemand}</div>
          </div>
        )}
      </div>
    </div>
  );
}
