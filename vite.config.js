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
    },
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm', 'wa-sqlite/dist'],
    esbuildOptions: {
      target: 'esnext', // you can also use 'es2020' here
    },
  },
});
