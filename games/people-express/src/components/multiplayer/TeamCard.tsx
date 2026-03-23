import type { TeamSummary } from '../../types';
import { formatCurrency } from '../../utils/formatting';

interface TeamCardProps {
  team: TeamSummary;
}

export default function TeamCard({ team }: TeamCardProps) {
  const { teamName, connectionStatus, hasSubmitted, isBankrupt, currentState } = team;

  let borderColor = 'border-cockpit-border';
  if (isBankrupt) borderColor = 'border-red-800 opacity-60';
  else if (connectionStatus === 'disconnected') borderColor = 'border-red-500';
  else if (hasSubmitted) borderColor = 'border-green-500';
  else borderColor = 'border-yellow-500';

  return (
    <div className={`bg-cockpit-panel border-2 ${borderColor} rounded-xl p-4 transition-colors`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-sm truncate">{teamName}</h3>
        {isBankrupt ? (
          <span className="text-[10px] font-semibold text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded">
            BANKRUPT
          </span>
        ) : hasSubmitted ? (
          <span className="text-green-400 text-xs">
            <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        ) : connectionStatus === 'disconnected' ? (
          <span className="text-[10px] font-semibold text-red-400">OFFLINE</span>
        ) : (
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse [animation-delay:0.4s]" />
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <MetricItem label="Revenue" value={formatCurrency(currentState.revenue)} />
        <MetricItem label="Cash" value={formatCurrency(currentState.cash)}
                    color={currentState.cash < 0 ? 'text-red-400' : undefined} />
        <MetricItem label="Aircraft" value={String(Math.round(currentState.aircraft))} />
        <MetricItem label="Quality" value={currentState.serviceQuality.toFixed(2)}
                    color={currentState.serviceQuality < 0.5 ? 'text-red-400' : currentState.serviceQuality > 0.8 ? 'text-green-400' : undefined} />
        <MetricItem label="Morale" value={currentState.employeeMorale.toFixed(2)}
                    color={currentState.employeeMorale < 0.5 ? 'text-red-400' : currentState.employeeMorale > 0.7 ? 'text-green-400' : undefined} />
        <MetricItem label="Stock" value={`$${currentState.stockPrice.toFixed(2)}`} />
      </div>
    </div>
  );
}

function MetricItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-cockpit-muted">{label}</div>
      <div className={`font-mono font-bold ${color || 'text-cockpit-text'}`}>{value}</div>
    </div>
  );
}
