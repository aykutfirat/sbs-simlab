import { useMemo } from 'react';
import { GameState } from '../types';
import { computePerformanceStats, analyzeBiases } from '../engine/BiasAnalyzer';
import { computeOptimalExpectedDailyProfit, computeWhatIfData } from '../engine/OptimalSolver';
import { PerformanceSummary } from './PerformanceSummary';
import { OptimalReveal } from './OptimalReveal';
import { BiasAnalysis } from './BiasAnalysis';
import { WhatIfComparison } from './WhatIfComparison';
import { DiscussionPrompt } from './DiscussionPrompt';

interface DebriefScreenProps {
  state: GameState;
  onRestart: () => void;
}

export function DebriefScreen({ state, onRestart }: DebriefScreenProps) {
  const stats = useMemo(
    () => computePerformanceStats(state.rounds, state.demands),
    [state.rounds, state.demands]
  );

  const biasReport = useMemo(
    () => analyzeBiases(state.rounds, state.demands, state.config),
    [state.rounds, state.demands, state.config]
  );

  const optimalExpectedDailyProfit = useMemo(
    () => computeOptimalExpectedDailyProfit(state.config),
    [state.config]
  );

  const whatIfData = useMemo(
    () => computeWhatIfData(state.config, state.demands, state.rounds),
    [state.config, state.demands, state.rounds]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <img src="/bagel.svg" alt="" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-bagel-800">Game Over!</h1>
          <p className="text-bagel-600 mt-1">Here's how you did over {state.config.rounds} days</p>
        </div>

        <PerformanceSummary stats={stats} />

        <OptimalReveal
          config={state.config}
          avgDailyProfit={stats.avgDailyProfit}
          optimalExpectedDailyProfit={optimalExpectedDailyProfit}
        />

        <BiasAnalysis
          biasReport={biasReport}
          rounds={state.rounds}
          demands={state.demands}
        />

        <WhatIfComparison data={whatIfData} />

        <DiscussionPrompt />

        {/* Restart */}
        <div className="text-center pb-8">
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-bagel-600 hover:bg-bagel-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
