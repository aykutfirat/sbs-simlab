import { useGameState } from '../hooks/useGameState';
import { StartScreen } from './StartScreen';
import { GameLayout } from './GameLayout';
import { DebriefScreen } from './DebriefScreen';

export function SinglePlayerGame() {
  const { state, startGame, submitOrder, nextDay, resetGame } = useGameState();

  switch (state.phase) {
    case 'start':
      return <StartScreen onStart={startGame} />;
    case 'playing':
      return (
        <GameLayout
          state={state}
          onSubmitOrder={submitOrder}
          onNextDay={nextDay}
        />
      );
    case 'debrief':
      return <DebriefScreen state={state} onRestart={resetGame} />;
  }
}
