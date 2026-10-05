import { describe, expect, it } from 'vitest'
import { angleFromSun, antisolarPoint, isDaylight, subsolarPoint } from './sun'

describe('subsolarPoint', () => {
  it('sits near the Tropic of Cancer at the June solstice', () => {
    const sun = subsolarPoint(new Date('2026-06-21T12:00:00Z'))
    expect(sun.lat).toBeCloseTo(23.4, 0)
    expect(Math.abs(sun.lon)).toBeLessThan(1.5)
  })

  it('sits near the Tropic of Capricorn at the December solstice', () => {
    const sun = subsolarPoint(new Date('2026-12-21T12:00:00Z'))
    expect(sun.lat).toBeCloseTo(-23.4, 0)
  })

  it('is near the equator at the March equinox', () => {
    const sun = subsolarPoint(new Date('2026-03-20T12:00:00Z'))
    expect(Math.abs(sun.lat)).toBeLessThan(0.5)
  })

  it('moves west by 15 degrees per hour', () => {
    const noon = subsolarPoint(new Date('2026-03-20T12:00:00Z'))
    const evening = subsolarPoint(new Date('2026-03-20T18:00:00Z'))
    // Six hours later the sun is ~90° further west.
    expect(evening.lon).toBeCloseTo(noon.lon - 90, 0)
  })

  it('keeps longitude within [-180, 180] across the antimeridian', () => {
    const sun = subsolarPoint(new Date('2026-03-20T00:00:00Z'))
    expect(Math.abs(sun.lon)).toBeGreaterThan(170)
    expect(Math.abs(sun.lon)).toBeLessThanOrEqual(180)
  })
})

describe('antisolarPoint', () => {
  it('mirrors latitude and flips longitude', () => {
    expect(antisolarPoint({ lat: 20, lon: 30 })).toEqual({ lat: -20, lon: -150 })
    expect(antisolarPoint({ lat: -5, lon: 170 })).toEqual({ lat: 5, lon: -10 })
  })
})

describe('isDaylight', () => {
  const solstice = subsolarPoint(new Date('2026-06-21T12:00:00Z'))

  it('puts London in daylight and Sydney in darkness at 12:00 UTC', () => {
    expect(isDaylight({ lat: 51.5, lon: -0.1 }, solstice)).toBe(true)
    expect(isDaylight({ lat: -33.9, lon: 151.2 }, solstice)).toBe(false)
  })

  it('handles polar day and polar night at the June solstice', () => {
    expect(isDaylight({ lat: 85, lon: 120 }, solstice)).toBe(true)
    expect(isDaylight({ lat: -85, lon: 0 }, solstice)).toBe(false)
  })

  it('gives angles summing to 180 for a place and its antipode', () => {
    const place = { lat: 10, lon: 20 }
    const antipode = { lat: -10, lon: -160 }
    expect(angleFromSun(place, solstice) + angleFromSun(antipode, solstice)).toBeCloseTo(180, 5)
  })
})
