import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/people-express/',
  server: {
    port: 5175,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/people-express/api': {
        target: 'http://localhost:3000',
      },
    },
  },
})
