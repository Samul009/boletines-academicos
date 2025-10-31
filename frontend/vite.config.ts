import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    // HMR sobre túneles (Cloudflare/ngrok). Configurable vía variables de entorno
    hmr: {
      host: process.env.VITE_TUNNEL_HOST || 'localhost',
      protocol: (process.env.VITE_TUNNEL_PROTO as 'ws' | 'wss') || 'ws',
      clientPort: process.env.VITE_TUNNEL_CLIENT_PORT ? Number(process.env.VITE_TUNNEL_CLIENT_PORT) : 3000,
    },
    // Permitir todos los hosts (ngrok, cloudflare, etc)
    allowedHosts: [
      'localhost',
      '.localhost',
      '.trycloudflare.com',
      '.ngrok.io',
      '.ngrok-free.app',
      '.ngrok.app'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // Optimizaciones para producción
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['axios'],
        },
      },
    },
    // Límite de advertencia de chunk size
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    port: 4173,
    host: true,
  },
})