import { describe, expect, it } from 'vitest'
import { CITIES } from '../data/cities'
import type { CityWeather } from '../types'
import { RELAXED_RULES, STRICT_RULES, type PairRules } from './config'
import { distanceKm, hotterSide, isValidPair, selectPairs, toRound } from './pairing'
import { sample, seededRng } from './random'
import { makeCity } from './testUtils'

// Two cities roughly 3,000 km apart at the same latitude, easy to nudge.
const rules: PairRules = { minGapC: 1, maxGapC: 6, minDistanceKm: 2500, maxLatitudeDiffDeg: 35 }
const base = makeCity('base', 20, 40, 0)
const far = (temp: number, lat = 40, lon = 40) => makeCity('other', temp, lat, lon)

describe('isValidPair', () => {
  it('accepts a pair inside every limit', () => {
    expect(isValidPair(base, far(23), rules)).toBe(true)
  })

  it('rejects gaps below the minimum and above the maximum', () => {
    expect(isValidPair(base, far(20.5), rules)).toBe(false)
    expect(isValidPair(base, far(27), rules)).toBe(false)
  })

  it('treats the gap limits as inclusive', () => {
    expect(isValidPair(base, far(21), rules)).toBe(true)
    expect(isValidPair(base, far(26), rules)).toBe(true)
  })

  it('is not thrown off by floating-point noise at the boundary', () => {
    // 20.1 + 0.9 style arithmetic can land a hair under 1.0.
    expect(isValidPair(makeCity('a', 20.1, 40, 0), far(21.1), rules)).toBe(true)
    expect(isValidPair(makeCity('a', 17.3, 40, 0), far(23.3), rules)).toBe(true)
  })

  it('works regardless of argument order', () => {
    expect(isValidPair(far(23), base, rules)).toBe(isValidPair(base, far(23), rules))
  })

  it('rejects cities that are too close together', () => {
    expect(isValidPair(base, far(23, 40, 5), rules)).toBe(false)
  })

  it('rejects polar-versus-tropical pairs via the latitude limit', () => {
    expect(isValidPair(makeCity('arctic', 20, 70, 0), makeCity('tropic', 23, 5, 90), rules)).toBe(false)
  })

  it('compares absolute latitude, so a cross-hemisphere pair can be valid', () => {
    expect(isValidPair(makeCity('n', 20, 35, 0), makeCity('s', 23, -35, 90), rules)).toBe(true)
  })

  it('rejects a city paired with itself', () => {
    expect(isValidPair(base, makeCity('base', 23, 40, 40), rules)).toBe(false)
  })
})

describe('selectPairs', () => {
  // A fixed pool built from the real city list with fake temperatures.
  function fakePool(seed: number, size = 70): CityWeather[] {
    const rng = seededRng(seed)
    return sample(CITIES, size, rng).map((city) => ({
      city,
      // Cooler away from the equator, plus noise: roughly realistic spread.
      temperatureC: Math.round((30 - Math.abs(city.lat) * 0.5 + (rng() - 0.5) * 16) * 10) / 10,
      isDay: true,
      observedAt: '2026-10-05T10:00:00.000Z',
    }))
  }

  it('returns pairs that all satisfy the rules', () => {
    const pairs = selectPairs(fakePool(1), STRICT_RULES, 10, seededRng(2))
    expect(pairs.length).toBeGreaterThan(0)
    for (const { a, b } of pairs) expect(isValidPair(a, b, STRICT_RULES)).toBe(true)
  })

  it('never uses a city twice', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const pairs = selectPairs(fakePool(seed), STRICT_RULES, 10, seededRng(seed))
      const ids = pairs.flatMap((p) => [p.a.city.id, p.b.city.id])
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('fills a ten-round game from a realistic pool', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const pairs = selectPairs(fakePool(seed), STRICT_RULES, 10, seededRng(seed))
      expect(pairs).toHaveLength(10)
    }
  })

  it('never returns more pairs than requested', () => {
    expect(selectPairs(fakePool(3), STRICT_RULES, 4, seededRng(3))).toHaveLength(4)
  })

  it('returns fewer pairs rather than breaking a rule when the pool is too small', () => {
    const pool = [makeCity('a', 20, 40, 0), makeCity('b', 23, 40, 60), makeCity('c', 40, 40, 120)]
    const pairs = selectPairs(pool, STRICT_RULES, 10, seededRng(1))
    expect(pairs).toHaveLength(1)
  })

  it('returns nothing for an empty or single-city pool', () => {
    expect(selectPairs([], STRICT_RULES, 10, seededRng(1))).toEqual([])
    expect(selectPairs([base], STRICT_RULES, 10, seededRng(1))).toEqual([])
  })

  it('is deterministic for a given seed', () => {
    const pool = fakePool(5)
    const ids = (seed: number) =>
      selectPairs(pool, STRICT_RULES, 10, seededRng(seed)).map((p) => p.a.city.id + p.b.city.id)
    expect(ids(9)).toEqual(ids(9))
    expect(ids(9)).not.toEqual(ids(10))
  })

  it('prefers pairs from different continents when they are available', () => {
    // Two valid pairings of the same four cities; only one crosses continents.
    const pool = [
      makeCity('eu1', 20, 45, 0, 'Europe'),
      makeCity('eu2', 22, 45, 50, 'Europe'),
      makeCity('as1', 24, 45, 100, 'Asia'),
      makeCity('as2', 26, 45, 150, 'Asia'),
    ]
    const noJitter = () => 0
    const pairs = selectPairs(pool, { ...STRICT_RULES, maxGapC: 10 }, 2, noJitter)
    for (const { a, b } of pairs) expect(a.city.region).not.toBe(b.city.region)
  })

  it('still finds pairs under the relaxed rules when strict ones are scarce', () => {
    // 1.5 km short of nothing: a 2,000 km pair fails strict but passes relaxed.
    const pool = [makeCity('a', 20, 40, 0), makeCity('b', 22, 40, 23.5)]
    expect(distanceKm(pool[0], pool[1])).toBeGreaterThan(1500)
    expect(distanceKm(pool[0], pool[1])).toBeLessThan(2500)
    expect(selectPairs(pool, STRICT_RULES, 10, seededRng(1))).toHaveLength(0)
    expect(selectPairs(pool, RELAXED_RULES, 10, seededRng(1))).toHaveLength(1)
  })
})

describe('toRound and hotterSide', () => {
  const pair = { a: makeCity('a', 20, 0, 0), b: makeCity('b', 25, 0, 60) }

  it('puts each city on one side and keeps both', () => {
    for (const roll of [0, 0.49, 0.5, 0.99]) {
      const round = toRound(pair, () => roll)
      expect([round.left.city.id, round.right.city.id].sort()).toEqual(['a', 'b'])
    }
  })

  it('swaps the sides depending on the random roll', () => {
    expect(toRound(pair, () => 0.1).left.city.id).toBe('a')
    expect(toRound(pair, () => 0.9).left.city.id).toBe('b')
  })

  it('reports the hotter side', () => {
    expect(hotterSide({ left: pair.a, right: pair.b })).toBe('right')
    expect(hotterSide({ left: pair.b, right: pair.a })).toBe('left')
  })
})
