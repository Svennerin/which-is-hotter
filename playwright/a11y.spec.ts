import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Automated accessibility audit (axe-core, WCAG 2.x A/AA rules) of every view
// and of the reveal state. It catches contrast, missing names and ARIA misuse;
// it cannot replace a manual screen-reader pass, which is listed in the README.

const API = 'https://api.open-meteo.com/v1/forecast**'

async function mockWeather(page: Page) {
  await page.route(API, (route) => {
    const url = new URL(route.request().url())
    const lats = url.searchParams.get('latitude')!.split(',').map(Number)
    const lons = url.searchParams.get('longitude')!.split(',').map(Number)
    const body = lats.map((lat, i) => ({
      current: {
        time: '2026-10-05T10:00',
        temperature_2m: Math.round((28 - Math.abs(lat) * 0.35 + ((Math.abs(lat * 7 + lons[i] * 13) % 9) - 4) * 1.1) * 10) / 10,
        is_day: 1,
      },
    }))
    return route.fulfill({ json: body })
  })
}

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

test('home, game, reveal and results have no axe violations', async ({ page }) => {
  await mockWeather(page)
  await page.goto('/')
  await audit(page)

  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(page.getByRole('img', { name: /^Map showing/ })).toBeVisible()
  await audit(page)

  await page.getByRole('button', { name: /is hotter$/ }).first().click()
  await expect(page.getByRole('button', { name: 'Next round' })).toBeVisible()
  await audit(page)

  for (let round = 1; round <= 10; round++) {
    if (round > 1) await page.getByRole('button', { name: /is hotter$/ }).first().click()
    await page.getByRole('button', { name: round === 10 ? 'See results' : 'Next round' }).click()
  }
  await expect(page.getByRole('heading', { name: 'Game over' })).toBeVisible()
  await audit(page)
})

test('error state has no axe violations', async ({ page }) => {
  await page.route(API, (route) => route.fulfill({ status: 429, json: { error: true } }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await audit(page)
})
