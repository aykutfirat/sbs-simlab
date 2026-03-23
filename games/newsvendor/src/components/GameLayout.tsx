import { GameState } from '../types';
import { TopBar } from './TopBar';
import { OrderInput } from './OrderInput';
import { DailyResults } from './DailyResults';
import { HistoryPanel } from './HistoryPanel';

interface GameLayoutProps {
  state: GameState;
  onSubmitOrder: (order: number) => void;
  onNextDay: () => void;
}

export function GameLayout({ state, onSubmitOrder, onNextDay }: GameLayoutProps) {
  const currentResult = state.showingResult
    ? state.rounds[state.rounds.length - 1]
    : null;
  const isLastDay = state.currentDay >= state.config.rounds;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50">
      <TopBar
        currentDay={state.currentDay}
        totalRounds={state.config.rounds}
        cumulativeProfit={state.cumulativeProfit}
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Decision / Results area */}
        {state.showingResult && currentResult ? (
          <DailyResults
            result={currentResult}
            onNextDay={onNextDay}
            isLastDay={isLastDay}
          />
        ) : (
          <OrderInput
            onSubmit={onSubmitOrder}
            disabled={state.showingResult}
            currentDay={state.currentDay}
          />
        )}

        {/* History */}
        <HistoryPanel rounds={state.rounds} />
      </div>
    </div>
  );
}
