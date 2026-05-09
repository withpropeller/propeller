import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3006,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3006,
  },
  define: {
    'process.env': {},
  },
});
