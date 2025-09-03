import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('@mantine')) return 'mantine';
            if (id.includes('@tanstack')) return 'tanstack';
            if (id.includes('dayjs')) return 'dayjs';
            if (id.includes('@thumbmarkjs')) return 'thumbmarkjs';
            return 'vendor';
          }
        },
      },
    },
    // You can raise this if needed to silence warnings after better chunking
    // chunkSizeWarningLimit: 900,
  },
})
