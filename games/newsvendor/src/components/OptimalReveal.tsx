import { GameConfig } from '../types';
import { computeCriticalRatio, computeOptimalQ, computeUnderageCost, computeOverageCost } from '../engine/OptimalSolver';
import { formatCurrency, formatPercent } from '../utils/formatting';

interface OptimalRevealProps {
  config: GameConfig;
  avgDailyProfit: number;
  optimalExpectedDailyProfit: number;
}

export function OptimalReveal({ config, avgDailyProfit, optimalExpectedDailyProfit }: OptimalRevealProps) {
  const cr = computeCriticalRatio(config);
  const optimalQ = computeOptimalQ(config);
  const cu = computeUnderageCost(config);
  const co = computeOverageCost(config);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
      <h2 className="text-lg font-bold text-bagel-800 mb-4">The Optimal Strategy</h2>

      <div className="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-200">
        <p className="text-sm text-amber-900 leading-relaxed">
          The cost of one unsold bagel is <strong>{formatCurrency(co)}</strong> (you paid {formatCurrency(config.cost)}, got {formatCurrency(config.salvage)} back).
          The cost of missing one sale is <strong>{formatCurrency(cu)}</strong> (profit you didn't earn).
          Since lost sales hurt more than waste, you should order <strong>MORE</strong> than average demand.
        </p>
      </div>

      <div className="space-y-3">
        {/* Critical Ratio */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Critical Ratio (CR)</div>
          <div className="font-mono text-lg font-bold text-bagel-800">
            CR = Cu / (Cu + Co) = {formatCurrency(cu)} / {formatCurrency(cu + co)} = <span className="text-bagel-600">{cr.toFixed(3)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You should order enough that there's a <strong>{formatPercent(cr)}</strong> chance demand is met —
            meaning you should accept running out ~{formatPercent(1 - cr)} of the time.
          </p>
        </div>

        {/* Optimal Q */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-700 mb-1">Optimal Order Quantity (Q*)</div>
          <div className="text-3xl font-bold text-green-800">
            {optimalQ} bagels
          </div>
          <p className="text-xs text-green-600 mt-1">
            = {config.mu} + {config.sigma} × Z({cr.toFixed(3)}) ≈ {config.mu} + {config.sigma} × {((optimalQ - config.mu) / config.sigma).toFixed(3)}
          </p>
        </div>

        {/* Demand distribution reveal */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-700 mb-1">Demand Distribution (now revealed!)</div>
          <div className="text-lg font-bold text-blue-800">
            Normal(μ = {config.mu}, σ = {config.sigma})
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Average demand was {config.mu} bagels/day with a standard deviation of {config.sigma}.
          </p>
        </div>

        {/* Profit comparison */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Your avg daily profit</div>
              <div className={`text-xl font-bold ${avgDailyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(avgDailyProfit)}
              </div>
            </div>
            <div className="text-2xl text-gray-300">vs</div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Optimal expected daily profit</div>
              <div className="text-xl font-bold text-green-700">
                ~{formatCurrency(optimalExpectedDailyProfit)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
