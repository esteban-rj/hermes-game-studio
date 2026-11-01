import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:4317', changeOrigin: true, timeout: 0, proxyTimeout: 0 } },
  },
  build: { target: 'es2022', sourcemap: true },
});
