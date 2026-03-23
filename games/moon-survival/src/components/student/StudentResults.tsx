import { SURVIVAL_ITEMS } from '../../data/items';
import { getScoreLabel } from '../../engine/Scoring';
import type { Player, Team } from '../../types';

interface StudentResultsProps {
  player: Player;
  team: Team | null;
  phase: 'results' | 'debrief';
}

export default function StudentResults({ player, team, phase }: StudentResultsProps) {
  const itemMap = new Map(SURVIVAL_ITEMS.map(item => [item.id, item]));

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🌙</div>
          <h2 className="text-2xl font-bold text-space-text">
            {phase === 'debrief' ? 'Debrief' : 'Results'}
          </h2>
          <p className="text-space-muted text-sm">{player.name}</p>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-space-panel border border-space-border rounded-lg p-5 text-center">
            <p className="text-space-muted text-sm mb-1">Your Individual Score</p>
            <p className="text-3xl font-bold text-space-accent">{player.individualScore ?? '—'}</p>
            {player.individualScore !== null && (
              <p className="text-xs text-space-muted mt-1">{getScoreLabel(player.individualScore)}</p>
            )}
          </div>

          {team && (
            <div className="bg-space-panel border border-space-border rounded-lg p-5 text-center">
              <p className="text-space-muted text-sm mb-1">Team {team.name} Score</p>
              <p className="text-3xl font-bold text-blue-400">{team.teamScore ?? '—'}</p>
              {team.teamScore !== null && (
                <p className="text-xs text-space-muted mt-1">{getScoreLabel(team.teamScore)}</p>
              )}
            </div>
          )}
        </div>

        {/* Improvement indicator */}
        {player.individualScore !== null && team?.teamScore !== null && team?.teamScore !== undefined && (
          <div className={`text-center p-4 rounded-lg border ${
            team.teamScore < player.individualScore
              ? 'bg-green-900/20 border-green-700/40 text-green-400'
              : team.teamScore > player.individualScore
                ? 'bg-red-900/20 border-red-700/40 text-red-400'
                : 'bg-space-panel border-space-border text-space-muted'
          }`}>
            {team.teamScore < player.individualScore ? (
              <p>Your team improved by <strong>{player.individualScore - team.teamScore}</strong> points over your individual score!</p>
            ) : team.teamScore > player.individualScore ? (
              <p>Your individual score was better by <strong>{team.teamScore - player.individualScore}</strong> points.</p>
            ) : (
              <p>Your team score matched your individual score exactly.</p>
            )}
          </div>
        )}

        {/* Side-by-side comparison */}
        {phase === 'debrief' && player.individualRanking && (
          <div>
            <h3 className="text-lg font-bold text-space-text mb-3">Your Ranking vs NASA</h3>
            <div className="space-y-2">
              {player.individualRanking.map((itemId, index) => {
                const item = itemMap.get(itemId);
                if (!item) return null;
                const error = Math.abs((index + 1) - item.nasaRank);
                return (
                  <div key={itemId} className="flex items-center gap-3 px-3 py-2 bg-space-panel border border-space-border rounded-lg text-sm">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      error === 0 ? 'bg-green-900/50 text-green-400' :
                      error <= 2 ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="flex-1 text-space-text">{item.name}</span>
                    <div className="w-7 h-7 rounded-full bg-blue-900/50 text-blue-400 border border-blue-700/50 flex items-center justify-center text-xs font-bold">
                      {item.nasaRank}
                    </div>
                    {error > 0 && (
                      <span className={`text-xs w-6 text-right ${error <= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                        +{error}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {phase === 'debrief' && (
          <div className="text-center text-space-muted text-sm py-4">
            Look up at the instructor screen for the full class debrief and NASA explanations.
          </div>
        )}
      </div>
    </div>
  );
}
