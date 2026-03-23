import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomState, DebriefData, CreateGamePayload } from '../multiplayerTypes';

// In dev mode, Vite proxies /socket.io to the backend; in production, same origin
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function useInstructorSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [debriefData, setDebriefData] = useState<DebriefData | null>(null);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

  useEffect(() => {
    const socket = io(`${SERVER_URL || ''}/newsvendor`);
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room-state', (state: RoomState) => {
      setRoomState(state);
      setTimerRemaining(state.timerRemaining);
    });

    socket.on('timer-tick', (remaining: number) => {
      setTimerRemaining(remaining);
    });

    socket.on('debrief-data', (data: DebriefData) => {
      setDebriefData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createGame = useCallback((payload: CreateGamePayload): Promise<{ success: boolean; gameCode?: string; error?: string }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('create-game', payload, (response: any) => {
        if (response.success) {
          setGameCode(response.gameCode);
        }
        resolve(response);
      });
    });
  }, []);

  const rejoinGame = useCallback((code: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('instructor-rejoin', { gameCode: code, password }, (response: any) => {
        if (response.success) {
          setGameCode(code);
        }
        resolve(response);
      });
    });
  }, []);

  const startGame = useCallback(() => {
    if (gameCode) socketRef.current?.emit('start-game', gameCode);
  }, [gameCode]);

  const revealDemand = useCallback(() => {
    if (gameCode) socketRef.current?.emit('reveal-demand', gameCode);
  }, [gameCode]);

  const nextRound = useCallback(() => {
    if (gameCode) socketRef.current?.emit('next-round', gameCode);
  }, [gameCode]);

  const startTimer = useCallback(() => {
    if (gameCode) socketRef.current?.emit('start-timer', gameCode);
  }, [gameCode]);

  const pauseTimer = useCallback(() => {
    if (gameCode) socketRef.current?.emit('pause-timer', gameCode);
  }, [gameCode]);

  const endGame = useCallback(() => {
    if (gameCode) socketRef.current?.emit('end-game', gameCode);
  }, [gameCode]);

  return {
    connected,
    roomState,
    debriefData,
    gameCode,
    timerRemaining,
    createGame,
    rejoinGame,
    startGame,
    revealDemand,
    nextRound,
    startTimer,
    pauseTimer,
    endGame,
  };
}
