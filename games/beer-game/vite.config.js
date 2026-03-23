import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/beer-game/',
  server: {
    port: 5174,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      },
      '/beer-game/api': {
        target: 'http://localhost:3000'
      }
    }
  }
});
