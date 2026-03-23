import { formatCurrency } from '../utils/formatting';

interface TopBarProps {
  currentDay: number;
  totalRounds: number;
  cumulativeProfit: number;
}

export function TopBar({ currentDay, totalRounds, cumulativeProfit }: TopBarProps) {
  const progress = ((currentDay - 1) / totalRounds) * 100;
  const profitColor = cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-white shadow-sm border-b border-bagel-200 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/bagel.svg" alt="" className="w-8 h-8" />
          <div>
            <div className="text-sm text-bagel-600 font-medium">Day {currentDay} of {totalRounds}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Profit</div>
          <div className={`text-xl font-bold ${profitColor}`}>
            {formatCurrency(cumulativeProfit)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto mt-2">
        <div className="h-2 bg-bagel-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-bagel-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
