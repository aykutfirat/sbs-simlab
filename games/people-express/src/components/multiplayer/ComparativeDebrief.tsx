import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import type { RoomState, TeamSummary } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { analyzeOutcome } from '../../utils/outcomeAnalysis';
import TimeSeriesChart from '../charts/TimeSeriesChart';

const TEAM_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#84cc16'];

type MetricTab = 'stockPrice' | 'revenue' | 'cash' | 'aircraft' | 'serviceQuality' | 'employeeMorale';

const TAB_CONFIG: { key: MetricTab; label: string; formatter?: (v: number) => string }[] = [
  { key: 'stockPrice', label: 'Stock Price', formatter: (v) => `$${v.toFixed(2)}` },
  { key: 'revenue', label: 'Revenue', formatter: formatCurrency },
  { key: 'cash', label: 'Cash', formatter: formatCurrency },
  { key: 'aircraft', label: 'Fleet', formatter: (v) => String(Math.round(v)) },
  { key: 'serviceQuality', label: 'Quality', formatter: (v) => v.toFixed(2) },
  { key: 'employeeMorale', label: 'Morale', formatter: (v) => v.toFixed(2) },
];

export default function ComparativeDebrief() {
  const { gameCode = '' } = useParams();
  const navigate = useNavigate();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [activeTab, setActiveTab] = useState<MetricTab>('stockPrice');

  useEffect(() => {
    const socket = io('/people-express');
    const password = sessionStorage.getItem('instructorPassword') || '';
    socket.emit('instructor-rejoin', { gameCode, password });
    socket.on('room-state', (state: RoomState) => {
      setRoomState(state);
    });
    return () => { socket.disconnect(); };
  }, [gameCode]);

  if (!roomState) {
    return (
      <div className="min-h-screen bg-cockpit-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cockpit-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const teams = Object.values(roomState.teams);
  const tabConfig = TAB_CONFIG.find(t => t.key === activeTab)!;

  // Build chart data: merge all teams' histories by quarter
  const maxQuarters = Math.max(...teams.map(t => t.history.length));
  const chartData: Record<string, unknown>[] = [];
  for (let i = 0; i < maxQuarters; i++) {
    const point: Record<string, unknown> = { label: teams[0]?.history[i]?.label || `Q${i}` };
    for (const team of teams) {
      const record = team.history[i];
      if (record) {
        point[team.teamName] = record.state[activeTab];
      }
    }
    chartData.push(point);
  }

  const series = teams.map((team, i) => ({
    key: team.teamName,
    name: team.teamName,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
  }));

  // Standings
  const standings = [...teams].sort((a, b) => {
    if (a.isBankrupt && !b.isBankrupt) return 1;
    if (!a.isBankrupt && b.isBankrupt) return -1;
    return b.currentState.stockPrice - a.currentState.stockPrice;
  });

  return (
    <div className="min-h-screen bg-cockpit-bg p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Comparative Debrief</h1>
            <p className="text-cockpit-muted">Game {gameCode} — {teams.length} teams</p>
          </div>
          <button
            onClick={() => navigate(`/multiplayer/instructor/${gameCode}`)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-cockpit-muted
                       rounded-lg transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Metric Tabs */}
        <div className="flex gap-1 mb-4 bg-cockpit-panel rounded-lg p-1 border border-cockpit-border">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-cockpit-accent text-white'
                  : 'text-cockpit-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Comparative Chart */}
        <div className="mb-6">
          <TimeSeriesChart
            title={`${tabConfig.label} — All Teams`}
            data={chartData}
            series={series}
            yAxisFormatter={tabConfig.formatter || ((v) => String(v))}
            height={350}
          />
        </div>

        {/* Final Standings */}
        <div className="bg-cockpit-panel border border-cockpit-border rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-cockpit-muted uppercase tracking-wider mb-4">
            Final Standings
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cockpit-muted text-left border-b border-cockpit-border">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Team</th>
                  <th className="pb-2 pr-4">Stock Price</th>
                  <th className="pb-2 pr-4">Revenue</th>
                  <th className="pb-2 pr-4">Cash</th>
                  <th className="pb-2 pr-4">Fleet</th>
                  <th className="pb-2 pr-4">Quality</th>
                  <th className="pb-2 pr-4">Archetype</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, i) => {
                  const analysis = analyzeOutcome(team.history);
                  return (
                    <StandingsRow key={team.teamName} rank={i + 1} team={team} analysis={analysis} />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discussion */}
        <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-cockpit-accent mb-3">
            Discussion Questions
          </h3>
          <ul className="text-cockpit-text space-y-3 text-sm leading-relaxed">
            <li className="italic">
              "Compare the strategies of the top-performing and bottom-performing teams. What
              decisions differentiated their outcomes?"
            </li>
            <li className="italic">
              "Which feedback loops were most visible across all teams? Did any team successfully
              avoid the death spiral?"
            </li>
            <li className="italic">
              "What data or analytics tools could have helped teams see problems coming before
              they became crises?"
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StandingsRow({ rank, team, analysis }: {
  rank: number;
  team: TeamSummary;
  analysis: { archetype: string; color: string };
}) {
  const s = team.currentState;
  return (
    <tr className={`border-b border-cockpit-border/50 ${team.isBankrupt ? 'opacity-50' : ''}`}>
      <td className="py-2 pr-4 font-mono text-cockpit-muted">{rank}</td>
      <td className="py-2 pr-4 font-medium text-white">{team.teamName}</td>
      <td className="py-2 pr-4 font-mono text-cockpit-accent">
        {team.isBankrupt ? '—' : `$${s.stockPrice.toFixed(2)}`}
      </td>
      <td className="py-2 pr-4 font-mono">{formatCurrency(s.revenue)}</td>
      <td className={`py-2 pr-4 font-mono ${s.cash < 0 ? 'text-red-400' : ''}`}>
        {formatCurrency(s.cash)}
      </td>
      <td className="py-2 pr-4 font-mono">{Math.round(s.aircraft)}</td>
      <td className="py-2 pr-4 font-mono">{s.serviceQuality.toFixed(2)}</td>
      <td className={`py-2 pr-4 text-xs ${analysis.color}`}>{analysis.archetype}</td>
    </tr>
  );
}
