import { io } from 'socket.io-client';

const URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

export const socket = io(`${URL}/beer-game`, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});
