// Shared domain types. Kept in one small file so every layer (API, pairing,
// map, UI) agrees on the same vocabulary.

export type Region =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Oceania'

/** A curated, static entry from src/data/cities.ts. */
export interface City {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  region: Region
}

/** One city's current conditions, as reported by Open-Meteo's model grid. */
export interface CityWeather {
  city: City
  temperatureC: number
  /** Open-Meteo's own day/night flag; used to cross-check our sun maths. */
  isDay: boolean
  /** ISO 8601 UTC timestamp the model values are valid for. */
  observedAt: string
}

/** Two cities with weather attached, before they are shuffled into a round. */
export interface CityPair {
  a: CityWeather
  b: CityWeather
}

/** Which slot a city is shown in: slot A is the left/top button. */
export type Side = 'left' | 'right'

export interface Round {
  /** Sides are shuffled so the hotter city is not always in the same slot. */
  left: CityWeather
  right: CityWeather
}

export interface GuessResult {
  guess: Side
  correct: boolean
}

/**
 * The single piece of app-level state: which of the three views is showing.
 * Progress *within* a game lives in game/matchReducer.ts.
 */
export type AppView =
  | { name: 'home' }
  | { name: 'game'; gameId: number }
  | { name: 'results'; rounds: readonly Round[]; results: readonly GuessResult[] }
