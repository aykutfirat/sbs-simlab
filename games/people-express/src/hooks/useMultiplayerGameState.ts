import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  PlayerDecisions,
  SimulationState,
  QuarterRecord,
  RoomPhase,
  TeamGameStatePayload,
} from '../types';

const DEFAULT_DECISIONS: PlayerDecisions = {
  aircraftPurchases: 0,
  peopleFare: 0.09,
  marketingFraction: 0.10,
  hiring: 9,
  targetServiceScope: 0.60,
};

interface MultiplayerGameState {
  connected: boolean;
  phase: RoomPhase;
  currentState: SimulationState | null;
  history: QuarterRecord[];
  decisions: PlayerDecisions;
  hasSubmitted: boolean;
  timerRemaining: number | null;
  currentQuarter: number;
}

export function useMultiplayerGameState(gameCode: string, teamName: string) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<MultiplayerGameState>({
    connected: false,
    phase: 'lobby',
    currentState: null,
    history: [],
    decisions: { ...DEFAULT_DECISIONS },
    hasSubmitted: false,
    timerRemaining: null,
    currentQuarter: 0,
  });

  useEffect(() => {
    const socket = io('/people-express');
    socketRef.current = socket;

    socket.on('connect', () => {
      setState(prev => ({ ...prev, connected: true }));
      // Join/rejoin the game
      socket.emit('join-game',
        { gameCode, teamName },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            console.error('Failed to join:', response.error);
          }
        }
      );
    });

    socket.on('disconnect', () => {
      setState(prev => ({ ...prev, connected: false }));
    });

    socket.on('team-game-state', (payload: TeamGameStatePayload) => {
      setState(prev => ({
        ...prev,
        currentState: payload.currentState,
        history: payload.history,
        decisions: payload.hasSubmitted ? prev.decisions : payload.decisions,
        hasSubmitted: payload.hasSubmitted,
        phase: payload.phase,
        timerRemaining: payload.timerRemaining,
        currentQuarter: payload.currentQuarter,
      }));
    });

    socket.on('timer-tick', (remaining: number) => {
      setState(prev => ({ ...prev, timerRemaining: remaining }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameCode, teamName]);

  const updateDecisions = useCallback((updates: Partial<PlayerDecisions>) => {
    setState(prev => ({
      ...prev,
      decisions: { ...prev.decisions, ...updates },
    }));
  }, []);

  const submitDecisions = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    setState(prev => {
      socket.emit('submit-decisions', {
        gameCode,
        teamName,
        decisions: prev.decisions,
      });
      return { ...prev, hasSubmitted: true };
    });
  }, [gameCode, teamName]);

  return {
    ...state,
    updateDecisions,
    submitDecisions,
  };
}
