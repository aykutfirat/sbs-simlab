import { useState, useCallback, useRef } from 'react';
import { GameState, PlayerDecisions, QuarterRecord, GamePhase } from '../types';
import { SimulationEngine } from '../engine/SimulationEngine';
import { quarterLabel } from '../utils/formatting';

const DEFAULT_DECISIONS: PlayerDecisions = {
  aircraftPurchases: 0,
  peopleFare: 0.09,
  marketingFraction: 0.10,
  hiring: 9,
  targetServiceScope: 0.60,
};

export function useGameState() {
  const engineRef = useRef<SimulationEngine>(new SimulationEngine());

  const [gameState, setGameState] = useState<GameState>(() => {
    const engine = engineRef.current;
    const initialState = engine.getInitialState();
    return {
      phase: 'start' as GamePhase,
      currentState: initialState,
      history: [{
        quarter: 0,
        label: 'Start',
        state: initialState,
      }],
      currentDecisions: { ...DEFAULT_DECISIONS },
    };
  });

  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'playing' }));
  }, []);

  const updateDecisions = useCallback((updates: Partial<PlayerDecisions>) => {
    setGameState(prev => ({
      ...prev,
      currentDecisions: { ...prev.currentDecisions, ...updates },
    }));
  }, []);

  const advanceQuarter = useCallback(() => {
    const engine = engineRef.current;
    setGameState(prev => {
      if (prev.currentState.isGameOver) return prev;

      const newState = engine.advanceQuarter(prev.currentDecisions);
      const record: QuarterRecord = {
        quarter: newState.quarter,
        label: quarterLabel(newState.quarter),
        state: newState,
      };

      const newPhase: GamePhase = newState.isGameOver ? 'gameover' : 'playing';

      return {
        ...prev,
        phase: newPhase,
        currentState: newState,
        history: [...prev.history, record],
      };
    });
  }, []);

  const restartGame = useCallback(() => {
    engineRef.current = new SimulationEngine();
    const engine = engineRef.current;
    const initialState = engine.getInitialState();
    setGameState({
      phase: 'start',
      currentState: initialState,
      history: [{
        quarter: 0,
        label: 'Start',
        state: initialState,
      }],
      currentDecisions: { ...DEFAULT_DECISIONS },
    });
  }, []);

  return {
    gameState,
    startGame,
    updateDecisions,
    advanceQuarter,
    restartGame,
  };
}
