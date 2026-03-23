import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/moon-survival/',
  server: {
    port: 5177,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/moon-survival/api': {
        target: 'http://localhost:3000',
      },
    },
  },
})
