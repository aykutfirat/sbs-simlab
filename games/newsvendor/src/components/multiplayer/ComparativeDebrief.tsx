import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';
import { DebriefData, PlayerDebriefData } from '../../multiplayerTypes';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import { computeOptimalQ, computeCriticalRatio, computeOverageCost, computeUnderageCost } from '../../engine/OptimalSolver';
import { mean, standardDeviation, pearsonCorrelation } from '../../utils/statistics';

const COLORS = [
  '#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1',
  '#84cc16', '#f43f5e',
];

interface ComparativeDebriefProps {
  debriefData: DebriefData;
  onNewGame: () => void;
}

export function ComparativeDebrief({ debriefData, onNewGame }: ComparativeDebriefProps) {
  const [activeTab, setActiveTab] = useState<'profit' | 'orders' | 'biases' | 'optimal'>('profit');

  const { config, demands, players } = debriefData;
  const optimalQ = computeOptimalQ(config);
  const cr = computeCriticalRatio(config);
  const cu = computeUnderageCost(config);
  const co = computeOverageCost(config);

  const playerNames = Object.keys(players);

  // Sort by profit for rankings
  const ranked = useMemo(() => {
    return [...playerNames].sort(
      (a, b) => players[b].totalProfit - players[a].totalProfit
    );
  }, [playerNames, players]);

  // Cumulative profit over time for all players + optimal
  const profitOverTime = useMemo(() => {
    const data: any[] = [];
    // Precompute optimal cumulative
    let optCum = 0;

    for (let i = 0; i < config.rounds; i++) {
      const row: any = { day: i + 1 };

      // Optimal
      const demand = demands[i];
      const optSold = Math.min(optimalQ, demand);
      const optWasted = Math.max(optimalQ - demand, 0);
      const optProfit = optSold * config.price - optimalQ * config.cost + optWasted * config.salvage;
      optCum += optProfit;
      row['Optimal (Q*)'] = Math.round(optCum * 100) / 100;

      // Each player
      for (const name of playerNames) {
        const round = players[name].rounds[i];
        if (round) {
          row[name] = Math.round(round.cumulativeProfit * 100) / 100;
        }
      }

      data.push(row);
    }
    return data;
  }, [config, demands, players, playerNames, optimalQ]);

  // Order patterns over time
  const ordersOverTime = useMemo(() => {
    return demands.map((d, i) => {
      const row: any = { day: i + 1, demand: d };
      for (const name of playerNames) {
        const round = players[name].rounds[i];
        if (round) row[name] = round.order;
      }
      row['Q*'] = optimalQ;
      return row;
    });
  }, [demands, players, playerNames, optimalQ]);

  // Bias summary per player
  const biasData = useMemo(() => {
    return playerNames.map((name) => {
      const p = players[name];
      const orders = p.rounds.map((r) => r.order);
      const avgOrder = mean(orders);
      const orderStd = standardDeviation(orders);

      const prevDemands = demands.slice(0, p.rounds.length - 1);
      const nextOrders = orders.slice(1);
      const chasingCorr = pearsonCorrelation(prevDemands, nextOrders);

      return {
        name,
        avgOrder: Math.round(avgOrder * 10) / 10,
        orderStd: Math.round(orderStd * 10) / 10,
        chasingCorr: Math.round(chasingCorr * 100) / 100,
        totalProfit: p.totalProfit,
        fillRate: p.fillRate,
        totalWasted: p.totalWasted,
        totalShortage: p.totalShortage,
        pullToCenter: avgOrder >= config.mu && avgOrder < optimalQ - 5,
        riskSeeking: avgOrder > optimalQ + 5,
        conservative: avgOrder < config.mu,
      };
    });
  }, [playerNames, players, demands, config, optimalQ]);

  // Bar chart data for avg orders
  const avgOrderBars = useMemo(() => {
    return ranked.map((name) => ({
      name,
      avgOrder: players[name].avgOrder,
      totalProfit: players[name].totalProfit,
    }));
  }, [ranked, players]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-bagel-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/bagel.svg" alt="" className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold text-bagel-800">Classroom Debrief</h1>
              <p className="text-xs text-gray-500">Game: {debriefData.gameCode} — {playerNames.length} players — {config.rounds} rounds</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Final Rankings */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
          <h2 className="text-lg font-bold text-bagel-800 mb-4">Final Rankings</h2>
          <div className="space-y-1">
            {ranked.map((name, idx) => {
              const p = players[name];
              const profitColor = p.totalProfit >= 0 ? 'text-green-700' : 'text-red-600';
              const isTop = idx === 0;
              return (
                <div
                  key={name}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isTop ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                  }`}
                >
                  <span className={`w-8 text-center text-lg font-bold ${isTop ? 'text-amber-600' : 'text-gray-400'}`}>
                    #{idx + 1}
                  </span>
                  <span className="flex-1 font-medium text-gray-800">{name}</span>
                  <span className="text-sm text-gray-500">avg order: {p.avgOrder.toFixed(0)}</span>
                  <span className={`font-bold text-lg ${profitColor}`}>{formatCurrency(p.totalProfit)}</span>
                </div>
              );
            })}

            {/* Optimal benchmark */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200 border-dashed mt-2">
              <span className="w-8 text-center text-lg font-bold text-green-600">*</span>
              <span className="flex-1 font-medium text-green-800">Optimal Strategy (Q*={optimalQ})</span>
              <span className="text-sm text-green-600">constant {optimalQ}/day</span>
              <span className="font-bold text-lg text-green-700">
                {formatCurrency(
                  profitOverTime.length > 0
                    ? profitOverTime[profitOverTime.length - 1]['Optimal (Q*)']
                    : 0
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-bagel-100 p-1">
          {[
            { key: 'profit' as const, label: 'Cumulative Profit' },
            { key: 'orders' as const, label: 'Order Patterns' },
            { key: 'biases' as const, label: 'Bias Analysis' },
            { key: 'optimal' as const, label: 'Optimal Strategy' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-bagel-500 text-white shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'profit' && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
            <h2 className="text-lg font-bold text-bagel-800 mb-4">Cumulative Profit Over Time</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitOverTime} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fefcf7', border: '1px solid #e9bc7d', borderRadius: '8px', fontSize: 12 }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {/* Optimal line */}
                  <Line
                    dataKey="Optimal (Q*)"
                    stroke="#16a34a"
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    dot={false}
                  />
                  {/* Player lines */}
                  {playerNames.map((name, i) => (
                    <Line
                      key={name}
                      dataKey={name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
            <h2 className="text-lg font-bold text-bagel-800 mb-4">Order Quantities vs Demand</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersOverTime} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fefcf7', border: '1px solid #e9bc7d', borderRadius: '8px', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {/* Demand line */}
                  <Line dataKey="demand" stroke="#000" strokeWidth={2} dot={false} name="Actual Demand" />
                  {/* Optimal constant line */}
                  <Line dataKey="Q*" stroke="#16a34a" strokeWidth={2} strokeDasharray="8 4" dot={false} />
                  {/* Player lines */}
                  {playerNames.map((name, i) => (
                    <Line
                      key={name}
                      dataKey={name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={1.5}
                      dot={false}
                      opacity={0.7}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Avg order bar chart */}
            <h3 className="text-sm font-semibold text-gray-600 mt-6 mb-3">Average Order Quantity</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgOrderBars} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: '8px' }}
                    formatter={(value: number) => value.toFixed(1)}
                  />
                  <ReferenceLine y={optimalQ} stroke="#16a34a" strokeDasharray="8 4" label={{ value: `Q*=${optimalQ}`, fontSize: 10, fill: '#16a34a' }} />
                  <ReferenceLine y={config.mu} stroke="#f97316" strokeDasharray="4 4" label={{ value: `μ=${config.mu}`, fontSize: 10, fill: '#f97316' }} />
                  <Bar dataKey="avgOrder" name="Avg Order">
                    {avgOrderBars.map((_, i) => (
                      <Cell key={i} fill={COLORS[playerNames.indexOf(avgOrderBars[i].name) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'biases' && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
            <h2 className="text-lg font-bold text-bagel-800 mb-4">Behavioral Bias Analysis</h2>

            {/* Summary table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 uppercase text-xs border-b border-gray-200">
                    <th className="px-3 py-2 text-left">Player</th>
                    <th className="px-3 py-2 text-right">Avg Order</th>
                    <th className="px-3 py-2 text-right">Order Std Dev</th>
                    <th className="px-3 py-2 text-right">Demand Chasing (r)</th>
                    <th className="px-3 py-2 text-right">Fill Rate</th>
                    <th className="px-3 py-2 text-center">Bias Detected</th>
                  </tr>
                </thead>
                <tbody>
                  {biasData.map((b, i) => (
                    <tr key={b.name} className="border-b border-gray-50">
                      <td className="px-3 py-2 font-medium" style={{ color: COLORS[i % COLORS.length] }}>
                        {b.name}
                      </td>
                      <td className="px-3 py-2 text-right">{b.avgOrder}</td>
                      <td className="px-3 py-2 text-right">{b.orderStd}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={Math.abs(b.chasingCorr) > 0.3 ? 'text-red-600 font-medium' : ''}>
                          {b.chasingCorr}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">{formatPercent(b.fillRate)}</td>
                      <td className="px-3 py-2 text-center space-x-1">
                        {b.pullToCenter && <span className="inline-block bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded">Pull-to-Center</span>}
                        {b.riskSeeking && <span className="inline-block bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded">Risk-Seeking</span>}
                        {b.conservative && <span className="inline-block bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">Conservative</span>}
                        {Math.abs(b.chasingCorr) > 0.3 && <span className="inline-block bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded">Demand Chasing</span>}
                        {b.orderStd > 10 && <span className="inline-block bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">High Variability</span>}
                        {!b.pullToCenter && !b.riskSeeking && !b.conservative && Math.abs(b.chasingCorr) <= 0.3 && b.orderStd <= 10 && (
                          <span className="inline-block bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded">Near Optimal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Optimal benchmarks */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p><strong>Optimal benchmarks:</strong> Q* = {optimalQ}, Order Std Dev = 0 (constant ordering), Demand Chasing correlation = 0</p>
            </div>

            {/* Class-wide patterns */}
            <div className="mt-4 space-y-2">
              {(() => {
                const pullCount = biasData.filter((b) => b.pullToCenter).length;
                const chasingCount = biasData.filter((b) => Math.abs(b.chasingCorr) > 0.3).length;
                const varCount = biasData.filter((b) => b.orderStd > 10).length;
                const total = biasData.length;

                return (
                  <>
                    {pullCount > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <strong>{pullCount} of {total}</strong> students exhibited pull-to-center bias — ordering between mean demand and optimal Q*.
                      </div>
                    )}
                    {chasingCount > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                        <strong>{chasingCount} of {total}</strong> students showed demand chasing — adjusting orders based on recent demand despite independence.
                      </div>
                    )}
                    {varCount > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <strong>{varCount} of {total}</strong> students had high order variability (optimal is constant ordering).
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'optimal' && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100 space-y-4">
            <h2 className="text-lg font-bold text-bagel-800 mb-2">The Optimal Strategy Revealed</h2>

            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-sm text-amber-900 leading-relaxed">
                The cost of one unsold bagel is <strong>{formatCurrency(co)}</strong> (you paid {formatCurrency(config.cost)}, got {formatCurrency(config.salvage)} back).
                The cost of missing one sale is <strong>{formatCurrency(cu)}</strong> (profit you didn't earn).
                Since lost sales hurt more than waste, you should order <strong>MORE</strong> than average demand.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Critical Ratio</div>
              <div className="font-mono text-lg font-bold text-bagel-800">
                CR = {formatCurrency(cu)} / {formatCurrency(cu + co)} = <span className="text-bagel-600">{cr.toFixed(3)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-700">Optimal Q*</div>
                <div className="text-3xl font-bold text-green-800">{optimalQ}</div>
                <div className="text-xs text-green-600 mt-1">bagels every day</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-700">Demand Distribution</div>
                <div className="text-3xl font-bold text-blue-800">N({config.mu},{config.sigma})</div>
                <div className="text-xs text-blue-600 mt-1">mean={config.mu}, std={config.sigma}</div>
              </div>
            </div>

            <div className="bg-bagel-50 rounded-lg p-4 border border-bagel-200">
              <p className="font-semibold text-bagel-800 mb-2">Key Insights</p>
              <ul className="text-sm text-bagel-700 space-y-1 list-disc list-inside">
                <li>The optimal strategy is to order the same quantity ({optimalQ}) every single day</li>
                <li>Yesterday's demand tells you nothing about today's — demands are independent</li>
                <li>You should accept running out ~{formatPercent(1 - cr)} of the time</li>
                <li>Ordering close to average demand ({config.mu}) is suboptimal — you should order higher</li>
              </ul>
            </div>

            {/* Discussion */}
            <div className="bg-white border border-bagel-200 rounded-lg p-4">
              <p className="font-semibold text-bagel-800 mb-2">Discussion Questions</p>
              <ul className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Why do most people order closer to average demand even though the optimal is higher?</li>
                <li>How would an AI-powered inventory system approach this problem differently?</li>
                <li>What real-world factors might make this problem harder than the game?</li>
              </ul>
            </div>
          </div>
        )}

        {/* New Game button */}
        <div className="text-center pb-8">
          <button
            onClick={onNewGame}
            className="px-8 py-3 bg-bagel-600 hover:bg-bagel-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
