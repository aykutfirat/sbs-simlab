import { io } from 'socket.io-client';

const URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

export const socket = io(`${URL}/moon-survival`, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});
