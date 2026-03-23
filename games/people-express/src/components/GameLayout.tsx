import { GameState, PlayerDecisions } from '../types';
import DecisionPanel from './DecisionPanel';
import ReportsDashboard from './ReportsDashboard';

interface GameLayoutProps {
  gameState: GameState;
  onUpdateDecisions: (updates: Partial<PlayerDecisions>) => void;
  onAdvanceQuarter: () => void;
  onRestart: () => void;
}

export default function GameLayout({
  gameState,
  onUpdateDecisions,
  onAdvanceQuarter,
  onRestart,
}: GameLayoutProps) {
  return (
    <div className="h-screen bg-cockpit-bg flex">
      {/* Left Panel - Decisions (40%) */}
      <div className="w-[40%] min-w-[380px] border-r border-cockpit-border bg-cockpit-panel/30">
        <DecisionPanel
          state={gameState.currentState}
          decisions={gameState.currentDecisions}
          onUpdateDecisions={onUpdateDecisions}
          onAdvanceQuarter={onAdvanceQuarter}
          onRestart={onRestart}
        />
      </div>

      {/* Right Panel - Reports (60%) */}
      <div className="flex-1 overflow-hidden">
        <ReportsDashboard history={gameState.history} />
      </div>
    </div>
  );
}
