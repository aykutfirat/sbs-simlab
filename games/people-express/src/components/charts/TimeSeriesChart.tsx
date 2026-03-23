import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

interface SeriesConfig {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
}

interface TimeSeriesChartProps {
  data: Record<string, unknown>[];
  series: SeriesConfig[];
  title: string;
  yAxisFormatter?: (value: number) => string;
  referenceLines?: { y: number; label: string; color: string }[];
  height?: number;
}

export default function TimeSeriesChart({
  data,
  series,
  title,
  yAxisFormatter = (v) => String(v),
  referenceLines = [],
  height = 200,
}: TimeSeriesChartProps) {
  return (
    <div className="bg-cockpit-panel border border-cockpit-border rounded-lg p-3">
      <h3 className="text-xs font-semibold text-cockpit-muted uppercase tracking-wider mb-2">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={yAxisFormatter}
            width={55}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => yAxisFormatter(value)}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
          />
          {referenceLines.map((ref, i) => (
            <ReferenceLine
              key={i}
              y={ref.y}
              label={{ value: ref.label, fill: ref.color, fontSize: 10 }}
              stroke={ref.color}
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
          ))}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '5 5' : undefined}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
