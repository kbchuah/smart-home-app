import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Version label: GitHub Actions run number on deploys (v32, v33…), "dev" locally.
const run = process.env.GITHUB_RUN_NUMBER;
const sha = (process.env.GITHUB_SHA ?? '').slice(0, 7);
const built = new Date().toLocaleString('en-GB', {
  timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
});

export default defineConfig({
  // Relative asset paths so the build works under /smart-home-app/ on GitHub Pages.
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(run ? `v${run}` : 'dev'),
    __APP_BUILD__: JSON.stringify(`${built} MYT${sha ? ` · ${sha}` : ''}`),
  },
});
