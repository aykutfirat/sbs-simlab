import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import StartScreen from './components/StartScreen';
import GameLayout from './components/GameLayout';
import GameOverScreen from './components/GameOverScreen';
import DebriefScreen from './components/DebriefScreen';

type EndScreenView = 'summary' | 'debrief';

export default function SinglePlayerApp() {
  const { gameState, startGame, updateDecisions, advanceQuarter, restartGame } = useGameState();
  const [endView, setEndView] = useState<EndScreenView>('summary');

  const handleRestart = () => {
    setEndView('summary');
    restartGame();
  };

  if (gameState.phase === 'start') {
    return <StartScreen onStart={startGame} />;
  }

  if (gameState.phase === 'gameover') {
    if (endView === 'debrief') {
      return (
        <DebriefScreen
          history={gameState.history}
          onRestart={handleRestart}
          onBack={() => setEndView('summary')}
        />
      );
    }
    return (
      <GameOverScreen
        history={gameState.history}
        onRestart={handleRestart}
        onDebrief={() => setEndView('debrief')}
      />
    );
  }

  return (
    <GameLayout
      gameState={gameState}
      onUpdateDecisions={updateDecisions}
      onAdvanceQuarter={advanceQuarter}
      onRestart={handleRestart}
    />
  );
}
