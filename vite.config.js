import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "docs",
    assetsDir: "assets",
    target: 'esnext',
  },
  server: {
    watch: {
      usePolling: true
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
    esbuildOptions: {
      target: 'esnext', // you can also use 'es2020' here
    },
  },
});
