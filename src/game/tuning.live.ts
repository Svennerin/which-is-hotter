// Not a unit test: a tuning aid that hits the real Open-Meteo API.
// Run with `npm run tune` to see how the pairing thresholds in config.ts behave
// against today's real weather (how often a full game is possible, how hard the
// rounds are). Kept out of `npm test` so tests never depend on the network.

import { describe, it } from 'vitest'
import { fetchCurrentWeather } from '../api/openMeteo'
import { CITIES } from '../data/cities'
import { DISTANCE_VARIETY, GAME_CONFIG, RELAXED_RULES, STRICT_RULES } from './config'
import { distanceKm, selectPairs } from './pairing'
import { sample } from './random'

const TRIALS = 6

describe('pairing thresholds against live weather', () => {
  it('reports success rate and round difficulty', async () => {
    const strictCounts: number[] = []
    const relaxedCounts: number[] = []
    const gaps: number[] = []
    const distances: number[] = []
    let crossRegion = 0
    const bands = [0, 0, 0] // near | mid | far, see DISTANCE_VARIETY
    let totalPairs = 0
    let example = ''

    for (let trial = 0; trial < TRIALS; trial++) {
      // Open-Meteo's free tier is 600 locations/minute and a pool is 70, so
      // space the requests out to stay under it.
      if (trial > 0) await new Promise((resolve) => setTimeout(resolve, 13_000))
      const pool = await fetchCurrentWeather(sample(CITIES, GAME_CONFIG.poolSize, Math.random))
      const strict = selectPairs(pool, STRICT_RULES, GAME_CONFIG.roundsPerGame, Math.random)
      const relaxed = selectPairs(pool, RELAXED_RULES, GAME_CONFIG.roundsPerGame, Math.random)
      strictCounts.push(strict.length)
      relaxedCounts.push(relaxed.length)
      for (const { a, b } of strict) {
        gaps.push(Math.abs(a.temperatureC - b.temperatureC))
        distances.push(distanceKm(a, b))
        bands[DISTANCE_VARIETY.bandEdgesKm.filter((edge) => distanceKm(a, b) >= edge).length]++
        totalPairs++
        if (a.city.region !== b.city.region) crossRegion++
      }
      if (trial === 0) {
        example = strict
          .map(
            ({ a, b }) =>
              `${a.city.name} ${a.temperatureC}°C vs ${b.city.name} ${b.temperatureC}°C (${Math.round(distanceKm(a, b))} km)`,
          )
          .join('\n  ')
      }
    }

    const avg = (xs: number[]) => (xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(2)
    console.log(`Pools of ${GAME_CONFIG.poolSize}, ${TRIALS} trials`)
    console.log(`Strict pairs per pool:  ${strictCounts.join(' ')}  (full games: ${strictCounts.filter((n) => n >= 10).length}/${TRIALS})`)
    console.log(`Relaxed pairs per pool: ${relaxedCounts.join(' ')}`)
    console.log(`Mean gap ${avg(gaps)}°C, mean distance ${avg(distances)} km, cross-continent ${crossRegion}/${totalPairs}`)
    console.log(`Distance bands (near <${DISTANCE_VARIETY.bandEdgesKm[0]} km | mid | far >${DISTANCE_VARIETY.bandEdgesKm[1]} km): ${bands.join(' | ')}`)
    console.log(`Example game:\n  ${example}`)
  }, 300_000)
})
