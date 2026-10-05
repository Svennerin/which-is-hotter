import { defineConfig } from '@playwright/test'

// Uses the Edge that ships with Windows (`channel: 'msedge'`) so no browser
// download is needed. Swap to `channel: 'chrome'` or install Playwright's own
// Chromium (`npx playwright install chromium`) on another machine.
//
// Two servers, two projects:
// - map:  the dev server, because the map lab (src/qa) only exists in dev
// - game: the production build, so the tests exercise what actually ships
//         (and React StrictMode's dev-only double effects cannot skew the
//         "one request per game" check)
export default defineConfig({
  testDir: 'playwright',
  outputDir: 'playwright/.results',
  use: { channel: 'msedge' },
  projects: [
    { name: 'map', testMatch: 'map.spec.ts', use: { baseURL: 'http://localhost:5173' } },
    { name: 'game', testMatch: ['game.spec.ts', 'a11y.spec.ts'], use: { baseURL: 'http://localhost:4173' } },
    { name: 'live', testMatch: ['live.spec.ts', 'screenshots.spec.ts'], use: { baseURL: process.env.LIVE_URL ?? 'http://localhost:4173' } },
  ],
  webServer: [
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
    {
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
