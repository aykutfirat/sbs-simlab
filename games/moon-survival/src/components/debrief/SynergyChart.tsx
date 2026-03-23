import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { GameResults } from '../../types';

interface SynergyChartProps {
  results: GameResults;
}

export default function SynergyChart({ results }: SynergyChartProps) {
  const data = Object.values(results.teams).map(team => ({
    name: team.name,
    'Best Individual': team.bestIndividualScore,
    'Average Individual': team.averageIndividualScore,
    'Team Score': team.teamScore ?? 0,
    synergy: team.synergy,
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-space-text">Team vs Individual Scores</h3>
      <p className="text-space-muted text-sm">
        Lower scores are better. When the team bar is shorter than the best individual bar, the team achieved synergy.
      </p>

      <div className="bg-space-panel border border-space-border rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} label={{ value: 'Error Score', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Bar dataKey="Average Individual" fill="#6b7280" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Best Individual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Team Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <ReferenceLine y={25} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Excellent', fill: '#22c55e', fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Synergy summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.values(results.teams).map(team => (
          <div key={team.id} className={`p-4 rounded-lg border text-center ${
            team.synergy > 0
              ? 'bg-green-900/20 border-green-700/40'
              : team.synergy < 0
                ? 'bg-red-900/20 border-red-700/40'
                : 'bg-space-panel border-space-border'
          }`}>
            <p className="text-space-text font-medium">{team.name}</p>
            <p className={`text-2xl font-bold mt-1 ${
              team.synergy > 0 ? 'text-green-400' : team.synergy < 0 ? 'text-red-400' : 'text-space-muted'
            }`}>
              {team.synergy > 0 ? '+' : ''}{team.synergy}
            </p>
            <p className="text-xs text-space-muted mt-1">
              {team.synergy > 0 ? 'Synergy achieved!' : team.synergy < 0 ? 'Process loss' : 'No change'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
