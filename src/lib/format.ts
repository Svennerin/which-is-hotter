import type { CityWeather, Round } from '../types'

/** One decimal on purpose: two cities can round to the same whole degree. */
export function formatTemperature(celsius: number): string {
  return `${celsius.toFixed(1)}°C`
}

/** "2026-10-05T10:00:00.000Z" -> "10:00 UTC". Always UTC so it matches the data. */
export function formatUtcTime(iso: string): string {
  return `${iso.slice(11, 16)} UTC`
}

/** The moment a round's data is valid for; also what the night shading uses. */
export function observedAt(round: Round): Date {
  // Both cities almost always share a timestamp; take the older to be safe.
  const [a, b] = [round.left.observedAt, round.right.observedAt].sort()
  return new Date(a < b ? a : b)
}

export function hotterOf(round: Round): CityWeather {
  return round.left.temperatureC > round.right.temperatureC ? round.left : round.right
}

export function describeLocation(w: CityWeather): string {
  return `${w.city.name}, ${w.city.country}`
}
