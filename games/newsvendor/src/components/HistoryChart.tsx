import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { RoundResult } from '../types';

interface HistoryChartProps {
  rounds: RoundResult[];
}

export function HistoryChart({ rounds }: HistoryChartProps) {
  if (rounds.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        Chart will appear after your first order
      </div>
    );
  }

  const data = rounds.map((r) => ({
    day: r.day,
    order: r.order,
    demand: r.demand,
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d3" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11 }}
            label={{ value: 'Day', position: 'insideBottom', offset: -2, fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fefcf7',
              border: '1px solid #e9bc7d',
              borderRadius: '8px',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="order"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Your Order"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="demand"
            stroke="#f97316"
            strokeWidth={2}
            name="Actual Demand"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
