import { useState } from 'react';
import DraggableRankingList from '../shared/DraggableRankingList';
import Timer from '../shared/Timer';
import { SURVIVAL_ITEMS } from '../../data/items';

interface IndividualRankingProps {
  playerName: string;
  timerRemaining: number | null;
  hasSubmitted: boolean;
  onSubmit: (ranking: string[]) => void;
}

export default function IndividualRanking({
  playerName,
  timerRemaining,
  hasSubmitted,
  onSubmit,
}: IndividualRankingProps) {
  // Shuffle items for initial order
  const [ranking, setRanking] = useState<string[]>(() => {
    const ids = SURVIVAL_ITEMS.map(item => item.id);
    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  });

  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-space-text">Ranking Submitted!</h2>
          <p className="text-space-muted">
            Waiting for all players to finish their individual rankings...
          </p>
          <div className="flex items-center justify-center gap-2 text-space-muted text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            The instructor will advance to the team phase soon
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-space-text">Individual Ranking</h2>
            <p className="text-space-muted text-sm">{playerName} — Drag items to rank them</p>
          </div>
          <Timer seconds={timerRemaining} />
        </div>

        {/* Scenario */}
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 text-sm text-blue-200">
          <p className="font-medium mb-1">Scenario:</p>
          <p>Your spacecraft has crash-landed on the moon, 200 miles from the mother ship. Rank these 15 items in order of importance for survival (1 = most important).</p>
        </div>

        {/* Ranking list */}
        <DraggableRankingList
          items={SURVIVAL_ITEMS}
          ranking={ranking}
          onRankingChange={setRanking}
        />

        {/* Submit button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-space-bg via-space-bg to-transparent">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => onSubmit(ranking)}
              className="w-full py-3 bg-space-accent hover:bg-amber-600 text-black font-bold rounded-lg transition-colors text-lg"
            >
              Submit My Ranking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
