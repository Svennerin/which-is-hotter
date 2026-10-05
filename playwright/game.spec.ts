import { expect, test, type Page, type Route } from '@playwright/test'

// End-to-end tests of the real UI against a *mocked* Open-Meteo, so they are
// fast, deterministic and can trigger failure modes on demand. The live API is
// covered separately in live.spec.ts.

const API = 'https://api.open-meteo.com/v1/forecast**'

/** Plausible, deterministic temperatures: cooler with latitude, plus spread. */
function fakeTemperature(lat: number, lon: number): number {
  const wobble = ((Math.abs(lat * 7 + lon * 13) % 9) - 4) * 1.1
  return Math.round((28 - Math.abs(lat) * 0.35 + wobble) * 10) / 10
}

function okResponse(route: Route, flat = false) {
  const url = new URL(route.request().url())
  const lats = url.searchParams.get('latitude')!.split(',').map(Number)
  const lons = url.searchParams.get('longitude')!.split(',').map(Number)
  const body = lats.map((lat, i) => ({
    latitude: lat,
    longitude: lons[i],
    current: {
      time: '2026-10-05T10:00',
      temperature_2m: flat ? 20 : fakeTemperature(lat, lons[i]),
      is_day: 1,
    },
  }))
  return route.fulfill({ json: body.length === 1 ? body[0] : body })
}

async function mockWeather(page: Page, flat = false) {
  await page.route(API, (route) => okResponse(route, flat))
}

async function playRound(page: Page, roundNumber: number) {
  await expect(page.getByRole('heading', { name: `Round ${roundNumber} of 10` })).toBeVisible()
  await page.getByRole('button', { name: /is hotter$/ }).first().click()
  await expect(page.getByRole('heading', { name: /Correct!|Not quite\./ })).toBeVisible()
}

test('plays a full game and reaches the results screen', async ({ page }) => {
  await mockWeather(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).click()

  for (let round = 1; round <= 10; round++) {
    await playRound(page, round)
    // The reveal shows both temperatures and day/night for each city.
    await expect(page.getByText('Daytime')).toHaveCount(2)
    await expect(page.getByText(/Temperatures as of 10:00 UTC/)).toBeVisible()
    await page.getByRole('button', { name: round === 10 ? 'See results' : 'Next round' }).click()
  }

  await expect(page.getByRole('heading', { name: 'Game over' })).toBeVisible()
  await expect(page.getByText(/^\d+ \/ 10$/)).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'was hotter' })).toHaveCount(10)

  // Play again starts a fresh game.
  await page.getByRole('button', { name: 'Play again' }).click()
  await expect(page.getByRole('heading', { name: 'Round 1 of 10' })).toBeVisible()
})

test('makes exactly one weather request for a whole game', async ({ page }) => {
  let requests = 0
  await page.route(API, (route) => {
    requests++
    return okResponse(route)
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).click()
  for (let round = 1; round <= 10; round++) {
    await playRound(page, round)
    await page.getByRole('button', { name: round === 10 ? 'See results' : 'Next round' }).click()
  }
  expect(requests).toBe(1)
})

test('is fully keyboard operable and moves focus sensibly', async ({ page }) => {
  await mockWeather(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'Round 1 of 10' })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /^A: .* is hotter$/ })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /^B: .* is hotter$/ })).toBeFocused()
  await page.keyboard.press('Enter')

  // After answering, focus jumps to the next action.
  await expect(page.getByRole('button', { name: 'Next round' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Round 2 of 10' })).toBeFocused()
})

test('the map has an accessible description naming both cities', async ({ page }) => {
  await mockWeather(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).click()
  const map = page.getByRole('img', { name: /^Map showing A: .+ and B: .+/ })
  await expect(map).toBeVisible()
})

test('shows an error with a working retry after repeated server failures', async ({ page }) => {
  let failing = true
  await page.route(API, (route) =>
    failing ? route.fulfill({ status: 500, body: 'boom' }) : okResponse(route),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).click()

  // TanStack Query retries twice (1s then 2s backoff) before surfacing the error.
  await expect(page.getByRole('alert')).toContainText('Couldn’t load the weather', { timeout: 15_000 })
  failing = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'Round 1 of 10' })).toBeVisible()
})

test('explains a rate limit and does not hammer the API with retries', async ({ page }) => {
  let requests = 0
  await page.route(API, (route) => {
    requests++
    return route.fulfill({
      status: 429,
      json: { error: true, reason: 'Minutely API request limit exceeded.' },
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(page.getByRole('alert')).toContainText('The weather service is busy')
  expect(requests).toBe(1)
})

test('shows an empty state when the weather yields no usable pairs', async ({ page }) => {
  await mockWeather(page, true) // every city 20°C: no pair has a temperature gap
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(page.getByRole('heading', { name: 'No good matchups right now' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to start' })).toBeVisible()
})

test('shows a loading state while the request is in flight', async ({ page }) => {
  await page.route(API, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await okResponse(route)
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(page.getByRole('status')).toContainText('Fetching live temperatures')
  await expect(page.getByRole('heading', { name: 'Round 1 of 10' })).toBeVisible()
})

test('always shows the Open-Meteo attribution link', async ({ page }) => {
  await mockWeather(page)
  await page.goto('/')
  const link = page.getByRole('link', { name: 'Open-Meteo.com' })
  await expect(link).toHaveAttribute('href', 'https://open-meteo.com/')
  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(page.getByRole('link', { name: 'Open-Meteo.com' })).toBeVisible()
})
