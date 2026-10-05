import { describe, expect, it } from 'vitest'
import type { City } from '../types'
import { buildWeatherUrl, OpenMeteoError, parseWeatherResponse } from './openMeteo'

const paris: City = { id: 'paris', name: 'Paris', country: 'France', lat: 48.857, lon: 2.352, region: 'Europe' }
const sydney: City = { id: 'sydney', name: 'Sydney', country: 'Australia', lat: -33.869, lon: 151.209, region: 'Oceania' }

const location = (temperature: unknown, isDay: unknown, time: unknown = '2026-10-05T10:00') => ({
  current: { time, temperature_2m: temperature, is_day: isDay },
})

describe('buildWeatherUrl', () => {
  it('sends every city in one request, in order', () => {
    const url = new URL(buildWeatherUrl([paris, sydney]))
    expect(url.searchParams.get('latitude')).toBe('48.857,-33.869')
    expect(url.searchParams.get('longitude')).toBe('2.352,151.209')
    expect(url.searchParams.get('current')).toBe('temperature_2m,is_day')
    expect(url.searchParams.get('timezone')).toBe('UTC')
  })
})

describe('parseWeatherResponse', () => {
  it('maps an array response onto the matching cities', () => {
    const result = parseWeatherResponse([paris, sydney], [location(18, 1), location(17.5, 0)])
    expect(result).toEqual([
      { city: paris, temperatureC: 18, isDay: true, observedAt: '2026-10-05T10:00:00.000Z' },
      { city: sydney, temperatureC: 17.5, isDay: false, observedAt: '2026-10-05T10:00:00.000Z' },
    ])
  })

  it('accepts the bare object Open-Meteo returns for a single location', () => {
    const result = parseWeatherResponse([paris], location(18, 1))
    expect(result).toHaveLength(1)
    expect(result[0].city).toBe(paris)
  })

  it('drops locations with missing or malformed values instead of failing', () => {
    const result = parseWeatherResponse(
      [paris, sydney],
      [location(null, 1), location(17.5, 0)],
    )
    expect(result.map((r) => r.city.id)).toEqual(['sydney'])
  })

  it('drops locations with an unusable is_day or timestamp', () => {
    const result = parseWeatherResponse(
      [paris, sydney],
      [location(18, 2), location(17.5, 0, 'not a date')],
    )
    expect(result).toEqual([])
  })

  it('throws when the number of locations does not match the request', () => {
    expect(() => parseWeatherResponse([paris, sydney], [location(18, 1)])).toThrow(OpenMeteoError)
  })

  it('treats an error payload as a mismatch rather than crashing', () => {
    expect(() => parseWeatherResponse([paris, sydney], { error: true, reason: 'nope' })).toThrow(
      OpenMeteoError,
    )
  })
})
