import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "docs",
    assetsDir: "assets"
  },
  server: {
    watch: {
      usePolling: true
    }
  }
});
