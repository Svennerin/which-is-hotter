import { geoDistance } from 'd3-geo'
import type { CityPair, CityWeather, Round } from '../types'
import { PAIR_SCORE, type PairRules } from './config'
import { shuffle, type Rng } from './random'

const EARTH_RADIUS_KM = 6371

export function distanceKm(a: CityWeather, b: CityWeather): number {
  return geoDistance([a.city.lon, a.city.lat], [b.city.lon, b.city.lat]) * EARTH_RADIUS_KM
}

/**
 * Temperatures arrive with one decimal. Rounding the gap to one decimal stops
 * floating-point noise (e.g. 1.0000000000000009) from flipping a boundary case.
 */
function temperatureGap(a: CityWeather, b: CityWeather): number {
  return Math.round(Math.abs(a.temperatureC - b.temperatureC) * 10) / 10
}

/** Does this pair satisfy every rule? Pure and order-independent. */
export function isValidPair(a: CityWeather, b: CityWeather, rules: PairRules): boolean {
  if (a.city.id === b.city.id) return false

  const gap = temperatureGap(a, b)
  if (gap < rules.minGapC || gap > rules.maxGapC) return false

  if (Math.abs(Math.abs(a.city.lat) - Math.abs(b.city.lat)) > rules.maxLatitudeDiffDeg) return false

  return distanceKm(a, b) >= rules.minDistanceKm
}

/**
 * Higher is better. Rewards what makes a round fun to look at (cities on
 * different continents, far enough apart to show a varied map) and adds jitter
 * so two games over similar data do not produce identical rounds.
 */
function scorePair(a: CityWeather, b: CityWeather, rng: Rng): number {
  const regionBonus = a.city.region !== b.city.region ? PAIR_SCORE.differentRegion : 0
  const distanceBonus = Math.min(distanceKm(a, b), PAIR_SCORE.distanceCapKm) / PAIR_SCORE.distanceCapKm
  return regionBonus + distanceBonus + rng() * PAIR_SCORE.jitter
}

/**
 * Picks up to `count` valid pairs where no city appears twice.
 *
 * Greedy on purpose: score every valid pair, then repeatedly take the best one
 * whose cities are both still unused. It is not guaranteed to find the maximum
 * possible number of pairs, but with a ~70-city pool it reliably finds 10, and
 * it is far easier to read than a matching algorithm. If it ever comes up
 * short, the caller relaxes the rules (see loadGame.ts).
 */
export function selectPairs(
  pool: readonly CityWeather[],
  rules: PairRules,
  count: number,
  rng: Rng,
): CityPair[] {
  const candidates: { pair: CityPair; score: number }[] = []
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      if (isValidPair(pool[i], pool[j], rules)) {
        candidates.push({ pair: { a: pool[i], b: pool[j] }, score: scorePair(pool[i], pool[j], rng) })
      }
    }
  }
  candidates.sort((x, y) => y.score - x.score)

  const used = new Set<string>()
  const chosen: CityPair[] = []
  for (const { pair } of candidates) {
    if (chosen.length === count) break
    if (used.has(pair.a.city.id) || used.has(pair.b.city.id)) continue
    used.add(pair.a.city.id)
    used.add(pair.b.city.id)
    chosen.push(pair)
  }

  // Selection order is by score, so shuffle to avoid the "best" rounds always
  // coming first.
  return shuffle(chosen, rng)
}

/** Randomly assigns each city to the left or right slot. */
export function toRound(pair: CityPair, rng: Rng): Round {
  return rng() < 0.5 ? { left: pair.a, right: pair.b } : { left: pair.b, right: pair.a }
}

/** The hotter side of a round. Rounds never tie because the minimum gap is > 0. */
export function hotterSide(round: Round): 'left' | 'right' {
  return round.left.temperatureC > round.right.temperatureC ? 'left' : 'right'
}
