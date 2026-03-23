import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../../socket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { formatMoney, formatPrice, formatPercent } from '../../utils/formatting';
import { FIRM_COLORS } from '../../types';
import type { DebriefData } from '../../types';

type Tab = 'standings' | 'prices' | 'gametheory' | 'strategy' | 'ai' | 'discussion';

export default function DebriefDashboard() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [tab, setTab] = useState<Tab>('standings');
  const [error, setError] = useState('');
  const code = roomCode?.toUpperCase() || '';

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => {
      socket.emit('instructor-rejoin', code, (res: any) => {
        if (!res.success) { setError(res.error || 'Failed to connect'); return; }
        socket.emit('get-debrief', code, (r: any) => {
          if (r.success) setDebrief(r.debrief);
          else setError(r.error);
        });
      });
    });
    return () => { socket.off('connect'); socket.disconnect(); };
  }, [code]);

  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-400">{error}</p></div>;
  if (!debrief) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-war-accent border-t-transparent rounded-full animate-spin" /></div>;

  const firms = Object.values(debrief.firms);
  const sorted = [...firms].sort((a, b) => b.cumulativeProfit - a.cumulativeProfit);
  const aiBots = firms.filter(f => f.isAI);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'standings', label: 'Final Standings' },
    { id: 'prices', label: 'Price War Timeline' },
    { id: 'gametheory', label: 'Game Theory' },
    { id: 'strategy', label: 'Strategy Breakdown' },
    ...(aiBots.length > 0 ? [{ id: 'ai' as Tab, label: 'AI Reveal' }] : []),
    { id: 'discussion', label: 'Discussion' },
  ];

  // Build history data
  const maxRounds = Math.max(...firms.map(f => f.history.length), 0);
  const priceData = Array.from({ length: maxRounds }, (_, r) => {
    const p: any = { round: r + 1 };
    firms.forEach(f => { if (f.history[r]) p[f.name] = f.history[r].price; });
    return p;
  });
  const profitData = Array.from({ length: maxRounds }, (_, r) => {
    const p: any = { round: r + 1 };
    firms.forEach(f => { if (f.history[r]) p[f.name] = f.history[r].profit; });
    return p;
  });
  const industryProfitData = Array.from({ length: maxRounds }, (_, r) => ({
    round: r + 1,
    total: firms.reduce((sum, f) => sum + (f.history[r]?.profit ?? 0), 0),
  }));

  return (
    <div className="min-h-screen p-6 bg-war-bg">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-war-text">⚔️ Pricing War Arena — Debrief</h1>
          <p className="text-war-muted mt-1">Room: {code} · {debrief.totalRounds} rounds · {firms.length} firms</p>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-war-accent text-white' : 'bg-war-panel text-war-muted hover:text-war-text border border-war-border'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* STANDINGS */}
        {tab === 'standings' && (
          <div className="space-y-6">
            {/* Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sorted.slice(0, 3).map((f, idx) => (
                <div key={f.id} className={`bg-war-panel border rounded-lg p-6 text-center ${idx === 0 ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-war-border'}`}>
                  <div className="text-3xl mb-2">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <h3 className="text-lg font-bold text-war-text">{f.name}</h3>
                  {f.isAI && <span className="text-xs text-war-muted">🤖 AI ({f.aiStrategy})</span>}
                  <p className={`text-2xl font-bold mt-2 ${f.cumulativeProfit >= 0 ? 'text-war-green' : 'text-war-red'}`}>
                    {formatMoney(f.cumulativeProfit)}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div><span className="text-war-muted">Avg Price</span><br /><span className="text-war-text">{formatPrice(avg(f.history.map(h => h.price)))}</span></div>
                    <div><span className="text-war-muted">Avg Share</span><br /><span className="text-war-text">{formatPercent(avg(f.history.map(h => h.marketShare)))}</span></div>
                    <div><span className="text-war-muted">Final Quality</span><br /><span className="text-war-text">{f.quality.toFixed(0)}</span></div>
                    <div><span className="text-war-muted">Final Brand</span><br /><span className="text-war-text">{formatPercent(f.brand)}</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Full leaderboard */}
            <div className="bg-war-panel border border-war-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-war-text mb-3">Full Leaderboard</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sorted.map((f) => ({ name: `${f.icon} ${f.name}`, profit: f.cumulativeProfit, idx: firms.indexOf(f) }))}
                    layout="vertical" margin={{ left: 110, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v: number) => formatMoney(v)} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={105} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} formatter={(v: number) => formatMoney(v)} />
                    <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                      {sorted.map((f, i) => <Cell key={i} fill={FIRM_COLORS[firms.indexOf(f) % FIRM_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Industry health */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Industry Profit" value={formatMoney(firms.reduce((s, f) => s + f.cumulativeProfit, 0))} />
              <StatCard label="Avg Industry Price" value={formatPrice(avg(firms.flatMap(f => f.history.map(h => h.price))))} />
              <StatCard label="Bankruptcies" value={String(firms.filter(f => f.bankrupt).length)} />
              <StatCard label="Market Events" value={String(debrief.eventLog.length)} />
            </div>
          </div>
        )}

        {/* PRICE WAR TIMELINE */}
        {tab === 'prices' && (
          <div className="space-y-6">
            <div className="bg-war-panel border border-war-border rounded-lg p-4">
              <h3 className="text-lg font-bold text-war-text mb-2">Price History — All Firms</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="round" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[6, 32]} stroke="#94a3b8" fontSize={11} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                    <Legend />
                    {firms.map((f, i) => <Line key={f.id} type="monotone" dataKey={f.name} stroke={FIRM_COLORS[i % FIRM_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-war-panel border border-war-border rounded-lg p-4">
              <h3 className="text-lg font-bold text-war-text mb-2">Industry Profit Over Time</h3>
              <p className="text-war-muted text-sm mb-2">Dips indicate price war periods where total industry profitability suffers.</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={industryProfitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="round" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v: number) => formatMoney(v)} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} formatter={(v: number) => formatMoney(v)} />
                    <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* GAME THEORY */}
        {tab === 'gametheory' && (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold text-blue-300 mb-2">Nash Equilibrium Analysis</h2>
              <p className="text-blue-200">
                The Nash equilibrium price for this game: <span className="text-3xl font-bold text-war-accent">{formatPrice(debrief.nashEquilibriumPrice)}</span>
              </p>
              <p className="text-blue-300/60 text-sm mt-1">At this price, no firm can improve profit by unilaterally changing their price.</p>
            </div>

            {/* Each firm vs Nash */}
            <div className="bg-war-panel border border-war-border rounded-lg p-4">
              <h3 className="text-lg font-bold text-war-text mb-3">Firm Pricing vs Nash Equilibrium</h3>
              <div className="space-y-2">
                {sorted.map((f) => {
                  const avgPrice = avg(f.history.map(h => h.price));
                  const diff = avgPrice - debrief.nashEquilibriumPrice;
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-2 bg-war-bg rounded-lg">
                      <span className="text-lg">{f.icon}</span>
                      <span className="text-war-text text-sm font-medium w-32">{f.name}</span>
                      <span className="text-war-muted text-sm">Avg: {formatPrice(avgPrice)}</span>
                      <span className={`text-sm font-bold ${diff > 1 ? 'text-blue-400' : diff < -1 ? 'text-red-400' : 'text-war-green'}`}>
                        {diff > 1 ? `+${diff.toFixed(1)} (cooperative/passive)` : diff < -1 ? `${diff.toFixed(1)} (aggressive)` : '≈ Nash (rational)'}
                      </span>
                      <span className="flex-1" />
                      <span className={`text-sm font-bold ${f.cumulativeProfit >= 0 ? 'text-war-green' : 'text-war-red'}`}>{formatMoney(f.cumulativeProfit)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prisoner's dilemma */}
            <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-purple-300 mb-3">The Prisoner's Dilemma</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-purple-300/60 text-sm">If all firms cooperated at {formatPrice(debrief.cooperativePrice)}</p>
                  <p className="text-2xl font-bold text-purple-400">{formatMoney(debrief.cooperativeProfit)}</p>
                  <p className="text-xs text-purple-300/40">Total industry profit</p>
                </div>
                <div>
                  <p className="text-purple-300/60 text-sm">Actual industry profit</p>
                  <p className="text-2xl font-bold text-war-text">{formatMoney(debrief.actualIndustryProfit)}</p>
                </div>
                <div>
                  <p className="text-purple-300/60 text-sm">Cost of competition</p>
                  <p className="text-2xl font-bold text-war-red">{formatMoney(debrief.competitionCost)}</p>
                  <p className="text-xs text-red-300/40">Value destroyed by price wars</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STRATEGY BREAKDOWN */}
        {tab === 'strategy' && (
          <div className="space-y-6">
            <div className="bg-war-panel border border-war-border rounded-lg p-4">
              <h3 className="text-lg font-bold text-war-text mb-3">Round-by-Round Profit</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="round" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v: number) => formatMoney(v)} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                    <Legend />
                    {firms.map((f, i) => <Line key={f.id} type="monotone" dataKey={f.name} stroke={FIRM_COLORS[i % FIRM_COLORS.length]} strokeWidth={2} dot={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Per-firm strategy cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sorted.map((f) => {
                const totalQI = f.history.reduce((s, h) => s + h.qualityInvestment, 0);
                const totalMK = f.history.reduce((s, h) => s + h.marketingSpend, 0);
                const totalRev = f.history.reduce((s, h) => s + h.revenue, 0);
                return (
                  <div key={f.id} className="bg-war-panel border border-war-border rounded-lg p-4">
                    <h4 className="font-bold text-war-text mb-2">{f.icon} {f.name} {f.isAI ? '🤖' : ''}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-war-muted">Total Revenue:</span> <span className="text-war-text">{formatMoney(totalRev)}</span></div>
                      <div><span className="text-war-muted">Total Profit:</span> <span className={f.cumulativeProfit >= 0 ? 'text-war-green' : 'text-war-red'}>{formatMoney(f.cumulativeProfit)}</span></div>
                      <div><span className="text-war-muted">Quality Investment:</span> <span className="text-war-text">{formatMoney(totalQI)}</span></div>
                      <div><span className="text-war-muted">Marketing Spend:</span> <span className="text-war-text">{formatMoney(totalMK)}</span></div>
                      <div><span className="text-war-muted">Price Range:</span> <span className="text-war-text">{formatPrice(Math.min(...f.history.map(h => h.price)))}–{formatPrice(Math.max(...f.history.map(h => h.price)))}</span></div>
                      <div><span className="text-war-muted">Avg Market Share:</span> <span className="text-war-text">{formatPercent(avg(f.history.map(h => h.marketShare)))}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI REVEAL */}
        {tab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-purple-300 mb-2">🤖 The AI Reveal</h2>
              <p className="text-purple-200">Some of your competitors were algorithms all along.</p>
            </div>
            {aiBots.map((f) => (
              <div key={f.id} className="bg-war-panel border border-war-accent/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{f.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-war-text">{f.name}</h3>
                    <p className="text-war-accent text-sm">Strategy: <span className="font-bold uppercase">{f.aiStrategy}</span></p>
                  </div>
                  <div className="flex-1" />
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${f.cumulativeProfit >= 0 ? 'text-war-green' : 'text-war-red'}`}>{formatMoney(f.cumulativeProfit)}</p>
                    <p className="text-war-muted text-xs">Rank #{sorted.indexOf(f) + 1}</p>
                  </div>
                </div>
                <p className="text-war-muted text-sm">
                  {f.aiStrategy === 'nash' && `The Nash Bot played the mathematically optimal price (≈${formatPrice(debrief.nashEquilibriumPrice)}) every round. This is the "rational" benchmark — how did your team compare?`}
                  {f.aiStrategy === 'predator' && 'The Predator Bot systematically undercut the lowest price to steal market share, then raised prices once dominant. Classic predatory pricing.'}
                  {f.aiStrategy === 'tit-for-tat' && 'The Tit-for-Tat Bot started cooperative and then mirrored the average competitor price. This reciprocity strategy is famously effective in repeated prisoner\'s dilemma games.'}
                  {f.aiStrategy === 'random' && 'The Random Bot set prices randomly each round. Surprisingly, random strategies can sometimes outperform humans who overthink.'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* DISCUSSION */}
        {tab === 'discussion' && (
          <div className="space-y-6">
            <div className="bg-war-panel border border-war-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-war-text mb-4">Connection to BI & Analytics</h3>
              <blockquote className="border-l-4 border-war-accent pl-4 text-war-muted italic mb-4">
                "In real markets, companies like Amazon, airlines, and SaaS providers use <strong className="text-war-text not-italic">dynamic pricing algorithms</strong> that adjust prices in real-time based on competitor prices, demand signals, and cost data. These systems are essentially playing this game continuously, using the same game theory principles — but with <strong className="text-war-text not-italic">Business Intelligence dashboards</strong> and <strong className="text-war-text not-italic">AI-powered optimization</strong> replacing human intuition."
              </blockquote>
            </div>

            <div className="bg-war-panel border border-war-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-war-text mb-3">Discussion Questions</h3>
              <ol className="space-y-3 text-war-muted list-decimal list-inside">
                <li>At what point did you realize your pricing strategy wasn't working? What data signal triggered the change?</li>
                <li>Would a real-time BI dashboard showing competitor analytics have changed your decisions?</li>
                <li>How is Uber's surge pricing or Amazon's dynamic pricing similar to what you just experienced?</li>
                <li>Did any team attempt tacit collusion (keeping prices high together)? Why did it succeed or fail?</li>
                <li>How did quality and marketing investment affect long-term competitiveness vs. short-term pricing?</li>
                <li>If you played again, what would you do differently? Would you use data differently?</li>
              </ol>
            </div>

            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-300 mb-3">Key Takeaways</h3>
              <ul className="space-y-2 text-blue-200 text-sm list-disc list-inside">
                <li><strong>Nash Equilibrium:</strong> There's a "rational" price that balances market share and margin — deviating from it is risky.</li>
                <li><strong>Prisoner's Dilemma:</strong> Mutual restraint (higher prices) benefits everyone, but the temptation to undercut is always present.</li>
                <li><strong>Information Advantage:</strong> Teams with better understanding of market dynamics (effectively, better BI) made more consistent decisions.</li>
                <li><strong>Long-term vs. Short-term:</strong> Quality and brand investment compound over time — pure price competition is a race to the bottom.</li>
                <li><strong>Dynamic Pricing:</strong> Real-world firms use algorithms to play this game continuously at massive scale.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-war-panel border border-war-border rounded-lg p-3 text-center">
      <p className="text-war-muted text-xs">{label}</p>
      <p className="text-war-text text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
