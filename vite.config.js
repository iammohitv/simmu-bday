import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH is set automatically by GitHub Actions to /repo-name/
// For local dev it defaults to '/'
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
});
