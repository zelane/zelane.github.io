import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "docs",
    assetsDir: "assets",
    target: 'esnext',
    rollupOptions: {
      plugins: [
        // Use a custom Rollup plugin to copy the Wasm file to .vite/deps
        copy({
          targets: [
            { src: 'public/wa-sqlite-async.wasm', dest: '.vite/deps' },
          ],
        }),
      ],
    },
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
