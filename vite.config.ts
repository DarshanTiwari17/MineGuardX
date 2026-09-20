import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { websocketPlugin } from './vite-plugin-socket.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), websocketPlugin()],
})
