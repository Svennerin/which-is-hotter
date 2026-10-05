import { defineConfig } from '@playwright/test'

// Uses the Edge that ships with Windows (`channel: 'msedge'`) so no browser
// download is needed. Swap to `channel: 'chrome'` or install Playwright's own
// Chromium (`npx playwright install chromium`) on another machine.
export default defineConfig({
  testDir: 'playwright',
  outputDir: 'playwright/.results',
  // The map is the centrepiece, so every test runs against the real renderer.
  use: { baseURL: 'http://localhost:5173', channel: 'msedge' },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
