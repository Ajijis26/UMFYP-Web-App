import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'box-icon', // Treat `box-icon` as a custom element
        },
      },
    }),
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
    historyApiFallback: true, // Handle SPA routes
  },
});
