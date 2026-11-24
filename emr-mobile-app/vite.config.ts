/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-framework': ['react', 'react-dom', 'react-router', 'react-router-dom', '@ionic/react', '@ionic/react-router'],
          'vendor-apollo': ['@apollo/client', 'graphql'],
          'vendor-signalr': ['@microsoft/signalr'],
        },
      },
    },
  },
  server: {
    port: 3672,
    host: '0.0.0.0',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
