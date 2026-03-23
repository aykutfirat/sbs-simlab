import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { RoomState } from '../types';

export function useInstructorSocket(gameCode: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  useEffect(() => {
    const socket = io('/people-express');
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      const password = sessionStorage.getItem('instructorPassword') || '';
      socket.emit('instructor-rejoin', { gameCode, password });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('room-state', (state: RoomState) => {
      setRoomState(state);
    });

    socket.on('timer-tick', (remaining: number) => {
      setRoomState(prev => prev ? { ...prev, timerRemaining: remaining } : prev);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameCode]);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start-game', gameCode);
  }, [gameCode]);

  const advanceAll = useCallback(() => {
    socketRef.current?.emit('advance-all', gameCode);
  }, [gameCode]);

  const startTimer = useCallback(() => {
    socketRef.current?.emit('start-timer', gameCode);
  }, [gameCode]);

  const pauseTimer = useCallback(() => {
    socketRef.current?.emit('pause-timer', gameCode);
  }, [gameCode]);

  const endGame = useCallback(() => {
    socketRef.current?.emit('end-game', gameCode);
  }, [gameCode]);

  return {
    connected,
    roomState,
    startGame,
    advanceAll,
    startTimer,
    pauseTimer,
    endGame,
  };
}
