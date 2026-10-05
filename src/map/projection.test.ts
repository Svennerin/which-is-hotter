import { geoNaturalEarth1 } from 'd3-geo'
import { describe, expect, it } from 'vitest'
import type { LatLon } from '../geo/sun'
import { FRAMING, createProjection } from './projection'

const paris: LatLon = { lat: 48.86, lon: 2.35 }
const london: LatLon = { lat: 51.5, lon: -0.12 }
const sydney: LatLon = { lat: -33.87, lon: 151.21 }
const tokyo: LatLon = { lat: 35.68, lon: 139.69 }
const losAngeles: LatLon = { lat: 34.05, lon: -118.24 }
const suva: LatLon = { lat: -18.14, lon: 178.44 }
const apia: LatLon = { lat: -13.83, lon: -171.76 } // just across the dateline from Suva
const quito: LatLon = { lat: -0.18, lon: -78.47 }
const nairobi: LatLon = { lat: -1.29, lon: 36.82 } // same latitude as Quito
const reykjavik: LatLon = { lat: 64.15, lon: -21.94 }
const capeTown: LatLon = { lat: -33.92, lon: 18.42 }

const SIZES = [
  { width: 360, height: 280 }, // phone
  { width: 960, height: 540 }, // desktop
]

function project(p: LatLon, a: LatLon, b: LatLon, width: number, height: number) {
  const point = createProjection(a, b, width, height)([p.lon, p.lat])
  if (!point) throw new Error('projection returned null')
  return point
}

const pairs: [string, LatLon, LatLon][] = [
  ['a far pair (Paris-Sydney)', paris, sydney],
  ['a pair straddling the dateline (Suva-Apia)', suva, apia],
  ['a trans-Pacific pair (Tokyo-Los Angeles)', tokyo, losAngeles],
  ['two cities on the same latitude (Quito-Nairobi)', quito, nairobi],
  ['a very close pair (Paris-London)', paris, london],
  ['a pair at opposite extremes (Reykjavik-Cape Town)', reykjavik, capeTown],
]

describe.each(SIZES)('createProjection at $width x $height', ({ width, height }) => {
  it.each(pairs)('keeps both cities inside the viewport for %s', (_name, a, b) => {
    for (const city of [a, b]) {
      const [x, y] = project(city, a, b, width, height)
      expect(x).toBeGreaterThan(8)
      expect(x).toBeLessThan(width - 8)
      expect(y).toBeGreaterThan(8)
      expect(y).toBeLessThan(height - 8)
    }
  })

  it('does not split a dateline pair across opposite edges of the map', () => {
    const [xSuva] = project(suva, suva, apia, width, height)
    const [xApia] = project(apia, suva, apia, width, height)
    // Suva is west of Apia in longitude terms (178E -> 172W is eastwards), so
    // Apia must be to its right, and close by.
    expect(xApia).toBeGreaterThan(xSuva)
    expect(xApia - xSuva).toBeLessThan(width * 0.6)
  })

  it('does not split a trans-Pacific pair across opposite edges either', () => {
    const [xTokyo] = project(tokyo, tokyo, losAngeles, width, height)
    const [xLa] = project(losAngeles, tokyo, losAngeles, width, height)
    expect(xLa).toBeGreaterThan(xTokyo)
  })

  it('never zooms in past the maximum zoom', () => {
    const worldScale = geoNaturalEarth1().fitExtent(
      [
        [FRAMING.paddingPx, FRAMING.paddingPx],
        [width - FRAMING.paddingPx, height - FRAMING.paddingPx],
      ],
      { type: 'Sphere' },
    ).scale()
    const scale = createProjection(paris, london, width, height).scale()
    expect(scale).toBeLessThanOrEqual(worldScale * FRAMING.maxZoom + 1e-6)
    expect(scale).toBeGreaterThanOrEqual(worldScale - 1e-6)
  })

  it('zooms in further for a close pair than for a far pair', () => {
    const near = createProjection(paris, london, width, height).scale()
    const far = createProjection(paris, sydney, width, height).scale()
    expect(near).toBeGreaterThan(far)
  })
})
