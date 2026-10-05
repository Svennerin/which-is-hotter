import type { City, CityWeather, Region } from '../types'

/** Builds a CityWeather for tests without needing real city data. */
export function makeCity(
  id: string,
  temperatureC: number,
  lat: number,
  lon: number,
  region: Region = 'Europe',
): CityWeather {
  const city: City = { id, name: id, country: 'Testland', lat, lon, region }
  return { city, temperatureC, isDay: true, observedAt: '2026-10-05T10:00:00.000Z' }
}
