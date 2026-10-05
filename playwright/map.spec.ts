import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// Visual QA for the map. Each case renders the dev-only map lab (src/qa) at a
// fixed UTC time and saves a screenshot to docs/qa/ for a human to look at.
// These are not pixel-diff assertions: the aim is a repeatable way to eyeball
// framing, clipping and layering problems. The assertions below only guard the
// things a screenshot cannot: the page rendered, and nothing threw.

const SOLSTICE_NOON = '2026-06-21T12:00Z'
const EQUINOX_MIDNIGHT = '2026-03-20T00:00Z' // terminator runs through the dateline
const DECEMBER_EVENING = '2026-12-21T18:00Z'

const PHONE = { w: 360, h: 300 }
const DESKTOP = { w: 960, h: 540 }

interface Case {
  name: string
  a: string
  b: string
  t: string
  size: { w: number; h: number }
  reveal?: boolean
}

const cases: Case[] = [
  // Far apart: should fall back towards the whole-world view.
  { name: 'far-paris-sydney-desktop', a: 'paris', b: 'sydney', t: SOLSTICE_NOON, size: DESKTOP },
  { name: 'far-paris-sydney-phone', a: 'paris', b: 'sydney', t: SOLSTICE_NOON, size: PHONE },
  // Tightly zoomed regional pair.
  { name: 'tight-dublin-rome-desktop', a: 'dublin', b: 'rome', t: SOLSTICE_NOON, size: DESKTOP },
  { name: 'tight-dublin-rome-phone', a: 'dublin', b: 'rome', t: SOLSTICE_NOON, size: PHONE },
  { name: 'tight-dublin-rome-night-reveal', a: 'dublin', b: 'rome', t: '2026-06-21T22:00Z', size: DESKTOP, reveal: true },
  // Dateline: Tokyo and Los Angeles are joined across the Pacific.
  { name: 'dateline-tokyo-losangeles-desktop', a: 'tokyo', b: 'los-angeles', t: EQUINOX_MIDNIGHT, size: DESKTOP },
  { name: 'dateline-tokyo-losangeles-phone', a: 'tokyo', b: 'los-angeles', t: EQUINOX_MIDNIGHT, size: PHONE },
  { name: 'dateline-auckland-lima-desktop', a: 'auckland', b: 'lima', t: DECEMBER_EVENING, size: DESKTOP },
  { name: 'dateline-suva-wellington-phone', a: 'suva', b: 'wellington', t: EQUINOX_MIDNIGHT, size: PHONE },
  // Same latitude: a degenerate bounding box if fitted to the points alone.
  { name: 'same-latitude-quito-nairobi-desktop', a: 'quito', b: 'nairobi', t: SOLSTICE_NOON, size: DESKTOP },
  // High latitude and polar day/night.
  { name: 'polar-reykjavik-moscow-desktop', a: 'reykjavik', b: 'moscow', t: DECEMBER_EVENING, size: DESKTOP },
  { name: 'extremes-reykjavik-capetown-phone', a: 'reykjavik', b: 'cape-town', t: SOLSTICE_NOON, size: PHONE },
  // Labels near the edge of the map.
  { name: 'edges-vancouver-auckland-phone', a: 'vancouver', b: 'auckland', t: SOLSTICE_NOON, size: PHONE },
]

mkdirSync('docs/qa', { recursive: true })

for (const c of cases) {
  test(`map renders: ${c.name}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

    const query = new URLSearchParams({
      lab: '1', a: c.a, b: c.b, t: c.t, w: String(c.size.w), h: String(c.size.h),
    })
    if (c.reveal) query.set('reveal', '1')
    await page.setViewportSize({ width: Math.max(c.size.w + 32, 400), height: c.size.h + 80 })
    await page.goto(`/?${query}`)

    const map = page.getByTestId('map')
    await expect(map.getByRole('img')).toBeVisible()
    await map.screenshot({ path: `docs/qa/${c.name}.png` })
    expect(errors).toEqual([])
  })
}
