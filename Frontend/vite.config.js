import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    assetsDir: 'assets',
    logLevel: 'debug',
    outDir: 'dist', // Explicitly define the output directory
  },
  server: {
    port: 5173, // Use default Vite development port
    open: true, // Open browser automatically
  },
});
