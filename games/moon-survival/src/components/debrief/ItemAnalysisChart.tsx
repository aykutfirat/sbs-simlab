import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SURVIVAL_ITEMS } from '../../data/items';
import type { GameResults } from '../../types';

interface ItemAnalysisChartProps {
  results: GameResults;
}

export default function ItemAnalysisChart({ results }: ItemAnalysisChartProps) {
  // Calculate average error per item across all individual rankings
  const allRankings = Object.values(results.players)
    .map(p => p.individualRanking)
    .filter((r): r is string[] => r !== null);

  const itemData = SURVIVAL_ITEMS
    .sort((a, b) => a.nasaRank - b.nasaRank)
    .map(item => {
      let totalError = 0;
      let count = 0;
      for (const ranking of allRankings) {
        const idx = ranking.indexOf(item.id);
        if (idx !== -1) {
          totalError += Math.abs((idx + 1) - item.nasaRank);
          count++;
        }
      }
      return {
        name: item.name.length > 20 ? item.name.substring(0, 18) + '...' : item.name,
        fullName: item.name,
        nasaRank: item.nasaRank,
        avgError: count > 0 ? Math.round((totalError / count) * 10) / 10 : 0,
      };
    });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-space-text">Item Difficulty Analysis</h3>
      <p className="text-space-muted text-sm">
        Average individual error per item. Higher bars = items the class found hardest to rank correctly.
      </p>

      <div className="bg-space-panel border border-space-border rounded-lg p-4">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={itemData} layout="vertical" margin={{ top: 0, right: 30, left: 120, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" stroke="#94a3b8" fontSize={12} label={{ value: 'Avg Error', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 12 }} />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={110} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
              formatter={(value: number, _name: string, props: any) => [
                `${value} (NASA rank: #${props.payload.nasaRank})`,
                'Avg Error'
              ]}
              labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label}
            />
            <Bar dataKey="avgError" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
