import { expect, test } from '@playwright/test'

// Smoke test against the REAL Open-Meteo API, with no mocking. Point it at the
// deployed site with:  LIVE_URL=https://your-app.vercel.app npx playwright test --project=live
//
// Why this exists: on the previous project a third-party host blocked assets in
// production while everything worked locally. Here everything except
// Open-Meteo is bundled, so this checks both halves on the deployed origin:
// the map renders from bundled data, and the cross-origin API call succeeds.

test('production site loads the map and the live weather request succeeds', async ({ page }) => {
  const failedRequests: string[] = []
  const consoleErrors: string[] = []
  page.on('requestfailed', (r) => failedRequests.push(`${r.url()} (${r.failure()?.errorText})`))
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))

  const weatherResponse = page.waitForResponse((r) => r.url().startsWith('https://api.open-meteo.com/'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).click()

  const response = await weatherResponse
  expect(response.status(), `Open-Meteo responded ${response.status()}`).toBe(200)

  await expect(page.getByRole('heading', { name: 'Round 1 of 10' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('img', { name: /^Map showing/ })).toBeVisible()

  // The map is real land, not an empty frame: the SVG contains substantial path data.
  const pathLength = await page.locator('svg[role="img"] path').evaluateAll((paths) =>
    Math.max(...paths.map((p) => (p.getAttribute('d') ?? '').length)),
  )
  expect(pathLength).toBeGreaterThan(1000)

  // Play a round to completion with real data.
  await page.getByRole('button', { name: /is hotter$/ }).first().click()
  await expect(page.getByText(/Temperatures as of \d\d:\d\d UTC/)).toBeVisible()

  expect(failedRequests).toEqual([])
  expect(consoleErrors).toEqual([])
})
