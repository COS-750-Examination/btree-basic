import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The API runs on :4000; proxying keeps cookies same-origin in development.
    proxy: { '/api': 'http://localhost:4000' },
  },
});
