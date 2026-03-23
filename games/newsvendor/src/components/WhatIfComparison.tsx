import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { WhatIfData } from '../types';
import { formatCurrency } from '../utils/formatting';

interface WhatIfComparisonProps {
  data: WhatIfData[];
}

export function WhatIfComparison({ data }: WhatIfComparisonProps) {
  if (data.length === 0) return null;

  const lastRow = data[data.length - 1];
  const profitGap = lastRow.optimalCumProfit - lastRow.playerCumProfit;
  const perfectGap = lastRow.perfectCumProfit - lastRow.playerCumProfit;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
      <h2 className="text-lg font-bold text-bagel-800 mb-4">What-If Comparison</h2>

      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d3" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              label={{ value: 'Day', position: 'insideBottom', offset: -2, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fefcf7',
                border: '1px solid #e9bc7d',
                borderRadius: '8px',
                fontSize: 12,
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="playerCumProfit"
              stroke="#3b82f6"
              strokeWidth={2.5}
              name="Your Profit"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="optimalCumProfit"
              stroke="#16a34a"
              strokeWidth={2.5}
              name="Optimal (Q*)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="perfectCumProfit"
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              name="Perfect Foresight"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-blue-600">Your Total</div>
          <div className="text-lg font-bold text-blue-700">{formatCurrency(lastRow.playerCumProfit)}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm text-green-600">Optimal Total</div>
          <div className="text-lg font-bold text-green-700">{formatCurrency(lastRow.optimalCumProfit)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Perfect Foresight</div>
          <div className="text-lg font-bold text-gray-700">{formatCurrency(lastRow.perfectCumProfit)}</div>
        </div>
      </div>

      {profitGap > 0 && (
        <p className="text-sm text-center mt-3 text-gray-600">
          You left <span className="font-bold text-red-600">{formatCurrency(profitGap)}</span> on the table
          compared to the optimal strategy. Perfect foresight would have earned{' '}
          <span className="font-bold text-gray-700">{formatCurrency(lastRow.perfectCumProfit)}</span>.
        </p>
      )}
    </div>
  );
}
