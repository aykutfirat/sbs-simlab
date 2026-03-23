import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatMoney, formatPrice, formatPercent } from '../../utils/formatting';
import { FIRM_COLORS } from '../../types';
import type { FirmState, CompetitorInfo } from '../../types';

interface RoundResultsProps {
  firm: FirmState;
  competitors: CompetitorInfo[];
  round: number;
  totalRounds: number;
}

export default function RoundResults({ firm, competitors, round, totalRounds }: RoundResultsProps) {
  const lastRecord = firm.history[firm.history.length - 1];
  if (!lastRecord) return null;

  // Pie chart data
  const pieData = [
    { name: firm.name, value: firm.marketShare, icon: firm.icon },
    ...competitors.filter(c => !c.bankrupt).map(c => ({
      name: c.name,
      value: c.marketShare ?? 0,
      icon: c.icon,
    })),
  ];

  // Profit trend
  const profitData = firm.history.map(h => ({
    round: h.round,
    profit: h.profit,
    cumulative: h.cumulativeProfit,
  }));

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-war-text">Round {round} Results</h2>
          <p className="text-war-muted text-sm">{firm.icon} {firm.name}</p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Customers" value={lastRecord.customers.toLocaleString()} />
          <MetricCard label="Revenue" value={formatMoney(lastRecord.revenue)} />
          <MetricCard label="Profit" value={formatMoney(lastRecord.profit)} color={lastRecord.profit >= 0 ? 'green' : 'red'} />
          <MetricCard label="Cumulative" value={formatMoney(lastRecord.cumulativeProfit)} color={lastRecord.cumulativeProfit >= 0 ? 'green' : 'red'} />
        </div>

        {/* Market share pie */}
        <div className="bg-war-panel border border-war-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-war-text mb-2">Market Share</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} ${(value * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={FIRM_COLORS[i % FIRM_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatPercent(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit trend */}
        {profitData.length > 1 && (
          <div className="bg-war-panel border border-war-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-war-text mb-2">Profit Trend</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="round" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v: number) => formatMoney(v)} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} formatter={(v: number) => formatMoney(v)} />
                  <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cumulative" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-war-muted">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-war-accent inline-block" /> Round profit</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-war-green inline-block" style={{ borderBottom: '1px dashed' }} /> Cumulative</span>
            </div>
          </div>
        )}

        {/* Competitor prices */}
        {competitors.some(c => c.price !== undefined) && (
          <div className="bg-war-panel border border-war-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-war-text mb-2">Competitor Prices</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm px-2 py-1 bg-war-accent/10 rounded">
                <span className="text-war-accent font-medium">{firm.icon} {firm.name} (You)</span>
                <span className="text-war-accent font-bold">{formatPrice(firm.price)}</span>
              </div>
              {competitors.filter(c => !c.bankrupt).map(c => (
                <div key={c.id} className="flex justify-between text-sm px-2 py-1">
                  <span className="text-war-text">{c.icon} {c.name}</span>
                  <span className="text-war-muted">{c.price !== undefined ? formatPrice(c.price) : '???'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-war-muted text-sm">
          {round >= totalRounds
            ? 'Game over! Waiting for debrief...'
            : 'Waiting for instructor to advance to next round...'}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' }) {
  return (
    <div className="bg-war-panel border border-war-border rounded-lg p-3 text-center">
      <p className="text-war-muted text-xs">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${
        color === 'green' ? 'text-war-green' : color === 'red' ? 'text-war-red' : 'text-war-text'
      }`}>{value}</p>
    </div>
  );
}
