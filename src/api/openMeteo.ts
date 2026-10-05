import type { City, CityWeather } from '../types'

// Open-Meteo is keyless and sends CORS headers, so the browser can call it
// directly. Verified limits: one GET carries hundreds of coordinates (URL
// length, not the API, becomes the cap around 500), so a 70-city pool is
// comfortably a single request.
const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'

export class OpenMeteoError extends Error {
  /**
   * True for HTTP 429. The free tier allows 600 *locations* per minute (a
   * 70-city request counts as 70), so a burst of games can hit this. Retrying
   * within seconds is pointless, so the UI treats it differently.
   */
  readonly rateLimited: boolean

  constructor(message: string, rateLimited = false) {
    super(message)
    this.name = 'OpenMeteoError'
    this.rateLimited = rateLimited
  }
}

export function buildWeatherUrl(cities: readonly City[]): string {
  const url = new URL(ENDPOINT)
  url.searchParams.set('latitude', cities.map((c) => c.lat).join(','))
  url.searchParams.set('longitude', cities.map((c) => c.lon).join(','))
  url.searchParams.set('current', 'temperature_2m,is_day')
  // Pin the timezone so `current.time` is always UTC, whatever the player's locale.
  url.searchParams.set('timezone', 'UTC')
  return url.toString()
}

interface RawLocation {
  current?: { time?: unknown; temperature_2m?: unknown; is_day?: unknown }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Turns the raw response into our own type. Exported separately from the fetch
 * so it can be unit-tested with plain objects.
 *
 * Quirks handled here:
 * - one coordinate returns a single object; several return an array
 * - a location can come back with null values; those cities are dropped
 *   rather than failing the whole game
 * - `current.time` is "2026-10-05T10:00" with no zone suffix, but is UTC
 */
export function parseWeatherResponse(cities: readonly City[], json: unknown): CityWeather[] {
  const locations: unknown[] = Array.isArray(json) ? json : [json]
  if (locations.length !== cities.length) {
    throw new OpenMeteoError(
      `Expected ${cities.length} locations but received ${locations.length}`,
    )
  }

  const readings: CityWeather[] = []
  locations.forEach((location, i) => {
    const current = isRecord(location) ? (location as RawLocation).current : undefined
    if (!current) return

    const { time, temperature_2m: temperature, is_day: isDay } = current
    if (typeof temperature !== 'number' || !Number.isFinite(temperature)) return
    if (typeof time !== 'string') return
    if (isDay !== 0 && isDay !== 1) return

    const observed = new Date(`${time}Z`)
    if (Number.isNaN(observed.getTime())) return

    readings.push({
      city: cities[i],
      temperatureC: temperature,
      isDay: isDay === 1,
      observedAt: observed.toISOString(),
    })
  })
  return readings
}

export async function fetchCurrentWeather(
  cities: readonly City[],
  signal?: AbortSignal,
): Promise<CityWeather[]> {
  const response = await fetch(buildWeatherUrl(cities), { signal })
  if (!response.ok) {
    // Open-Meteo explains failures as {"error": true, "reason": "..."}.
    const detail = await response.text().catch(() => '')
    throw new OpenMeteoError(
      `Weather service responded ${response.status}. ${detail}`.trim(),
      response.status === 429,
    )
  }
  return parseWeatherResponse(cities, await response.json())
}
