import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/newsvendor/',
  server: {
    port: 5176,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/newsvendor/api': {
        target: 'http://localhost:3000',
      },
    },
  },
})
