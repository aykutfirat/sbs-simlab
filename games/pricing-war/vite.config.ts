import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pricing-war/',
  server: {
    port: 5178,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/pricing-war/api': {
        target: 'http://localhost:3000',
      },
    },
  },
})
