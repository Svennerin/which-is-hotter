import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// Captures full-page screenshots against the REAL Open-Meteo API, for visual QA
// and for the README. Run manually (it makes real requests):
//   npx playwright test --project=live screenshots.spec.ts
// Output goes to docs/screenshots/ (committed).

const OUT = 'docs/screenshots'
mkdirSync(OUT, { recursive: true })

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]

for (const vp of viewports) {
  test(`screenshots: ${vp.name}`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')
    await page.screenshot({ path: `${OUT}/home-${vp.name}.png` })

    await page.getByRole('button', { name: 'Start game' }).click()
    await expect(page.getByRole('heading', { name: 'Round 1 of 10' })).toBeVisible({ timeout: 30_000 })
    // Give the lazily loaded map a moment to draw before capturing.
    await expect(page.getByRole('img', { name: /^Map showing/ })).toBeVisible()
    await page.screenshot({ path: `${OUT}/game-${vp.name}.png`, fullPage: true })

    await page.getByRole('button', { name: /is hotter$/ }).first().click()
    await expect(page.getByRole('button', { name: 'Next round' })).toBeVisible()
    await page.screenshot({ path: `${OUT}/reveal-${vp.name}.png`, fullPage: true })

    // Finish the game so the results screen can be captured too.
    for (let round = 1; round <= 10; round++) {
      if (round > 1) {
        await expect(page.getByRole('heading', { name: `Round ${round} of 10` })).toBeVisible()
        await page.getByRole('button', { name: /is hotter$/ }).nth(round % 2).click()
      }
      await page.getByRole('button', { name: round === 10 ? 'See results' : 'Next round' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Game over' })).toBeVisible()
    await page.screenshot({ path: `${OUT}/results-${vp.name}.png`, fullPage: true })
  })
}
