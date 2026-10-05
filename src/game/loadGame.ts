import { fetchCurrentWeather } from '../api/openMeteo'
import { CITIES } from '../data/cities'
import type { City, CityPair, CityWeather, Round } from '../types'
import { GAME_CONFIG, RELAXED_RULES, STRICT_RULES, type PairRules } from './config'
import { selectPairs, toRound } from './pairing'
import { sample, type Rng } from './random'

/** Thrown when even the fallbacks cannot produce a playable game. */
export class NotEnoughPairsError extends Error {
  constructor() {
    super('Could not find enough well-matched city pairs in the current weather data.')
    this.name = 'NotEnoughPairsError'
  }
}

export interface BuildGameOptions {
  /** How to get weather for a set of cities. Injected so tests need no network. */
  fetchPool: (cities: readonly City[]) => Promise<CityWeather[]>
  cities?: readonly City[]
  rng?: Rng
}

/**
 * Builds a whole game from at most two weather requests. The fallback ladder,
 * stopping at the first step that yields a full game:
 *
 *   1. strict rules on batch 1
 *   2. relaxed rules on the same batch (no extra request)
 *   3. fetch a fresh random pool once, strict then relaxed rules
 *   4. relaxed rules on both batches combined
 *   5. otherwise the best shorter game found, if it has at least
 *      `minRoundsForShortGame` rounds; else throw NotEnoughPairsError
 *
 * Nothing is requested during play: every round is built here, up front.
 */
export async function buildGame({
  fetchPool,
  cities = CITIES,
  rng = Math.random,
}: BuildGameOptions): Promise<Round[]> {
  const { roundsPerGame, minRoundsForShortGame, poolSize } = GAME_CONFIG

  let best: CityPair[] = []
  // Returns true when the attempt filled a whole game.
  const attempt = (pool: readonly CityWeather[], rules: PairRules): boolean => {
    const pairs = selectPairs(pool, rules, roundsPerGame, rng)
    if (pairs.length > best.length) best = pairs
    return pairs.length >= roundsPerGame
  }
  const finish = () => best.map((pair) => toRound(pair, rng))

  const first = await fetchPool(sample(cities, poolSize, rng))
  if (attempt(first, STRICT_RULES) || attempt(first, RELAXED_RULES)) return finish()

  try {
    const second = await fetchPool(sample(cities, poolSize, rng))
    if (attempt(second, STRICT_RULES) || attempt(second, RELAXED_RULES)) return finish()

    const combined = [...new Map([...first, ...second].map((w) => [w.city.id, w])).values()]
    if (attempt(combined, RELAXED_RULES)) return finish()
  } catch (error) {
    // A failed second request should not throw away a usable first batch.
    if (best.length < minRoundsForShortGame) throw error
  }

  if (best.length < minRoundsForShortGame) throw new NotEnoughPairsError()
  return finish()
}

/** The production entry point: real cities, real API, real randomness. */
export function loadGame(signal?: AbortSignal): Promise<Round[]> {
  return buildGame({ fetchPool: (cities) => fetchCurrentWeather(cities, signal) })
}
