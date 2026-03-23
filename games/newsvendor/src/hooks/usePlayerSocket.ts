import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { PlayerGameState, DebriefData } from '../multiplayerTypes';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function usePlayerSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerGameState | null>(null);
  const [debriefData, setDebriefData] = useState<DebriefData | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(`${SERVER_URL || ''}/newsvendor`);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Auto-rejoin if we have stored session
      const stored = sessionStorage.getItem('nvg_session');
      if (stored) {
        const { gameCode: gc, playerName: pn } = JSON.parse(stored);
        socket.emit('join-game', { gameCode: gc, playerName: pn }, (response: any) => {
          if (response.success) {
            setGameCode(gc);
            setPlayerName(pn);
          } else {
            sessionStorage.removeItem('nvg_session');
          }
        });
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('player-game-state', (state: PlayerGameState) => {
      setPlayerState(state);
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

  const joinGame = useCallback((code: string, name: string): Promise<{ success: boolean; error?: string; reconnected?: boolean }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('join-game', { gameCode: code, playerName: name }, (response: any) => {
        if (response.success) {
          setGameCode(code);
          setPlayerName(name);
          sessionStorage.setItem('nvg_session', JSON.stringify({ gameCode: code, playerName: name }));
        }
        resolve(response);
      });
    });
  }, []);

  const submitOrder = useCallback((order: number): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!gameCode || !playerName) return resolve({ success: false, error: 'Not connected' });
      socketRef.current?.emit('submit-order', { gameCode, playerName, order }, (response: any) => {
        resolve(response);
      });
    });
  }, [gameCode, playerName]);

  const requestDebrief = useCallback(() => {
    if (gameCode) {
      socketRef.current?.emit('request-debrief', { gameCode });
    }
  }, [gameCode]);

  const leaveGame = useCallback(() => {
    sessionStorage.removeItem('nvg_session');
    setGameCode(null);
    setPlayerName(null);
    setPlayerState(null);
    setDebriefData(null);
  }, []);

  return {
    connected,
    playerState,
    debriefData,
    timerRemaining,
    gameCode,
    playerName,
    joinGame,
    submitOrder,
    requestDebrief,
    leaveGame,
  };
}
