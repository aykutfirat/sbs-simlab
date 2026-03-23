import { useParams } from 'react-router-dom';
import { useMultiplayerGameState } from '../../hooks/useMultiplayerGameState';
import DecisionPanel from '../DecisionPanel';
import ReportsDashboard from '../ReportsDashboard';
import GameOverScreen from '../GameOverScreen';
import TeamTopBar from './TeamTopBar';

export default function TeamGameView() {
  const { gameCode = '', teamName: rawTeamName = '' } = useParams();
  const teamName = decodeURIComponent(rawTeamName);

  const {
    connected,
    phase,
    currentState,
    history,
    decisions,
    hasSubmitted,
    timerRemaining,
    currentQuarter,
    updateDecisions,
    submitDecisions,
  } = useMultiplayerGameState(gameCode, teamName);

  // Loading / lobby state
  if (!currentState) {
    return (
      <div className="min-h-screen bg-cockpit-bg flex flex-col">
        <TeamTopBar
          teamName={teamName}
          gameCode={gameCode}
          connected={connected}
          phase={phase}
          hasSubmitted={hasSubmitted}
          timerRemaining={timerRemaining}
          currentQuarter={currentQuarter}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {phase === 'lobby' ? 'Waiting for Game to Start' : 'Connecting...'}
            </h2>
            <p className="text-cockpit-muted">
              {phase === 'lobby'
                ? 'The instructor will start the game shortly.'
                : 'Establishing connection to server...'}
            </p>
            {phase === 'lobby' && (
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 border-2 border-cockpit-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game over
  if (phase === 'gameover') {
    return (
      <div className="min-h-screen bg-cockpit-bg flex flex-col">
        <TeamTopBar
          teamName={teamName}
          gameCode={gameCode}
          connected={connected}
          phase={phase}
          hasSubmitted={hasSubmitted}
          timerRemaining={timerRemaining}
          currentQuarter={currentQuarter}
        />
        <div className="flex-1 overflow-auto">
          <GameOverScreen
            history={history}
            onRestart={() => {}}
            onDebrief={() => {}}
          />
        </div>
      </div>
    );
  }

  // Playing
  return (
    <div className="h-screen bg-cockpit-bg flex flex-col">
      <TeamTopBar
        teamName={teamName}
        gameCode={gameCode}
        connected={connected}
        phase={phase}
        hasSubmitted={hasSubmitted}
        timerRemaining={timerRemaining}
        currentQuarter={currentQuarter}
      />
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Decisions */}
        <div className="w-[40%] min-w-[380px] border-r border-cockpit-border bg-cockpit-panel/30">
          <DecisionPanel
            state={currentState}
            decisions={decisions}
            onUpdateDecisions={updateDecisions}
            onAdvanceQuarter={submitDecisions}
            onRestart={() => {}}
            submitMode
            hasSubmitted={hasSubmitted}
            disabled={hasSubmitted || phase !== 'playing'}
          />
        </div>

        {/* Right Panel - Reports */}
        <div className="flex-1 overflow-hidden">
          <ReportsDashboard history={history} />
        </div>
      </div>
    </div>
  );
}
