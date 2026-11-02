import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths so the build works under /smart-home-app/ on GitHub Pages.
  base: './',
  plugins: [react()],
});
