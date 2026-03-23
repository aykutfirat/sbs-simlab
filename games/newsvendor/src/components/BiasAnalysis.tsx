import { BiasReport, RoundResult } from '../types';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface BiasAnalysisProps {
  biasReport: BiasReport;
  rounds: RoundResult[];
  demands: number[];
}

export function BiasAnalysis({ biasReport, rounds, demands }: BiasAnalysisProps) {
  // Prepare scatter data for demand chasing
  const scatterData = rounds.slice(1).map((r, i) => ({
    prevDemand: demands[i],
    nextOrder: r.order,
  }));

  // Simple linear regression for reference line
  const n = scatterData.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const d of scatterData) {
    sumX += d.prevDemand;
    sumY += d.nextOrder;
    sumXY += d.prevDemand * d.nextOrder;
    sumXX += d.prevDemand * d.prevDemand;
  }
  const slope = n > 0 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
  const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;

  const biasIcon = (detected: boolean) => detected ? '⚠️' : '✅';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
      <h2 className="text-lg font-bold text-bagel-800 mb-4">Behavioral Analysis</h2>

      <div className="space-y-4">
        {/* Pull to Center */}
        <div className={`rounded-lg p-4 border ${
          biasReport.pullToCenter.category === 'near-optimal'
            ? 'bg-green-50 border-green-200'
            : biasReport.pullToCenter.category === 'pull-to-center'
            ? 'bg-amber-50 border-amber-200'
            : biasReport.pullToCenter.category === 'very-conservative'
            ? 'bg-red-50 border-red-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <h3 className="font-semibold text-sm mb-2">
            {biasIcon(biasReport.pullToCenter.category !== 'near-optimal')} Pull-to-Center Bias
          </h3>
          <p className="text-sm leading-relaxed">{biasReport.pullToCenter.description}</p>

          {/* Visual: where average order falls */}
          <div className="mt-3 relative">
            <div className="h-3 bg-gray-200 rounded-full relative">
              {/* Mean marker */}
              <div
                className="absolute top-0 w-0.5 h-3 bg-orange-500"
                style={{ left: `${Math.min(95, Math.max(5, (biasReport.pullToCenter.meanDemand / 200) * 100))}%` }}
              />
              {/* Optimal marker */}
              <div
                className="absolute top-0 w-0.5 h-3 bg-green-600"
                style={{ left: `${Math.min(95, Math.max(5, (biasReport.pullToCenter.optimalQ / 200) * 100))}%` }}
              />
              {/* Player marker */}
              <div
                className="absolute -top-0.5 w-3 h-4 bg-blue-500 rounded-full"
                style={{ left: `${Math.min(95, Math.max(5, (biasReport.pullToCenter.avgOrder / 200) * 100))}%`, transform: 'translateX(-50%)' }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1 text-gray-500">
              <span className="text-orange-600">μ = {biasReport.pullToCenter.meanDemand}</span>
              <span className="text-blue-600">You: {biasReport.pullToCenter.avgOrder.toFixed(0)}</span>
              <span className="text-green-600">Q* = {biasReport.pullToCenter.optimalQ}</span>
            </div>
          </div>
        </div>

        {/* Demand Chasing */}
        <div className={`rounded-lg p-4 border ${
          biasReport.demandChasing.detected
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <h3 className="font-semibold text-sm mb-2">
            {biasIcon(biasReport.demandChasing.detected)} Demand Chasing
          </h3>
          <p className="text-sm leading-relaxed mb-3">{biasReport.demandChasing.description}</p>

          {/* Scatter plot */}
          <div className="h-48 bg-white rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d3" />
                <XAxis
                  dataKey="prevDemand"
                  type="number"
                  tick={{ fontSize: 10 }}
                  label={{ value: "Previous Day's Demand", position: 'insideBottom', offset: -10, fontSize: 10 }}
                />
                <YAxis
                  dataKey="nextOrder"
                  type="number"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Next Order', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: '8px' }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'prevDemand' ? "Prev Demand" : "Next Order"
                  ]}
                />
                <Scatter data={scatterData} fill="#3b82f6" opacity={0.6} r={4} />
                {/* Regression line approximation via two reference points */}
                <ReferenceLine
                  segment={[
                    { x: 20, y: intercept + slope * 20 },
                    { x: 180, y: intercept + slope * 180 },
                  ]}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Variability */}
        <div className={`rounded-lg p-4 border ${
          biasReport.orderVariability.detected
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <h3 className="font-semibold text-sm mb-2">
            {biasIcon(biasReport.orderVariability.detected)} Ordering Variability
          </h3>
          <p className="text-sm leading-relaxed">{biasReport.orderVariability.description}</p>
        </div>
      </div>
    </div>
  );
}
