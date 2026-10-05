import { defineConfig } from 'vitest/config'

// Separate config for network-dependent tuning runs (`npm run tune`), so the
// default `npm test` stays fast and offline.
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.live.ts'] },
})
