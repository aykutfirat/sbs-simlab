import { useState } from 'react';
import { SURVIVAL_ITEMS } from '../../data/items';

export default function NASAReveal() {
  const [revealedCount, setRevealedCount] = useState(0);

  const sorted = [...SURVIVAL_ITEMS].sort((a, b) => a.nasaRank - b.nasaRank);
  const revealed = sorted.slice(0, revealedCount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-space-text">NASA Official Rankings</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRevealedCount(c => Math.max(0, c - 1))}
            disabled={revealedCount === 0}
            className="px-3 py-1.5 bg-space-panel border border-space-border rounded-lg text-sm text-space-muted hover:text-space-text disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-space-muted text-sm font-mono">{revealedCount}/15</span>
          <button
            onClick={() => setRevealedCount(c => Math.min(15, c + 1))}
            disabled={revealedCount === 15}
            className="px-3 py-1.5 bg-space-accent hover:bg-amber-600 text-black rounded-lg text-sm font-medium disabled:opacity-30 transition-colors"
          >
            Reveal Next →
          </button>
          {revealedCount < 15 && (
            <button
              onClick={() => setRevealedCount(15)}
              className="px-3 py-1.5 bg-space-panel border border-space-border rounded-lg text-sm text-space-muted hover:text-space-text transition-colors"
            >
              Show All
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {revealed.map(item => (
          <div
            key={item.id}
            className="flex items-start gap-4 px-4 py-3 bg-space-panel border border-space-border rounded-lg animate-fadeIn"
          >
            <div className="w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 border border-blue-700/50 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              {item.nasaRank}
            </div>
            <div className="flex-1">
              <p className="text-space-text font-medium">{item.name}</p>
              <p className="text-space-muted text-sm mt-0.5">{item.reasoning}</p>
            </div>
          </div>
        ))}

        {revealedCount === 0 && (
          <div className="text-center py-8 text-space-muted">
            <p className="text-lg">Click "Reveal Next" to show NASA's rankings one by one</p>
            <p className="text-sm mt-1">Start from the most important item (#1)</p>
          </div>
        )}
      </div>
    </div>
  );
}
