import { describe, expect, it, vi } from 'vitest'
import type { City, CityWeather } from '../types'
import { GAME_CONFIG } from './config'
import { buildGame, NotEnoughPairsError } from './loadGame'
import { seededRng } from './random'

// Eight cities spread around the 40th parallel: far apart, same latitude, so
// only the temperatures decide which pairs are valid.
const cities: City[] = [0, 45, 90, 135, 180, -135, -90, -45].map((lon, i) => ({
  id: `c${i}`,
  name: `City ${i}`,
  country: 'Testland',
  lat: 40,
  lon,
  region: i % 2 === 0 ? 'Europe' : 'Asia',
}))

function weatherFor(temps: number[]) {
  return async (requested: readonly City[]): Promise<CityWeather[]> =>
    requested.map((city) => ({
      city,
      temperatureC: temps[Number(city.id.slice(1))],
      isDay: true,
      observedAt: '2026-10-05T10:00:00.000Z',
    }))
}

// Strictly valid pairs: (0,1) (2,3) (4,5) (6,7) only; neighbours across pairs differ by 8.
const FOUR_PAIRS = [10, 12, 20, 22, 30, 32, 40, 42]
const NO_PAIRS = [20, 20, 20, 20, 20, 20, 20, 20]

describe('buildGame', () => {
  it('needs one request when the first batch is good enough', async () => {
    // Make ten pairs possible by using the real city list with many cities.
    const many: City[] = Array.from({ length: 40 }, (_, i) => ({
      id: `m${i}`,
      name: `M${i}`,
      country: 'Testland',
      lat: 40,
      lon: -180 + i * 9,
      region: i % 2 === 0 ? 'Europe' : 'Asia',
    }))
    // Adjacent-in-list cities are only 9° (~760 km) apart, so alternate temps
    // by index mod 4 and rely on distance filtering plus plenty of choice.
    const fetchPool = vi.fn(async (requested: readonly City[]) =>
      requested.map((city, i) => ({
        city,
        temperatureC: 10 + (i % 4) * 2,
        isDay: true,
        observedAt: '2026-10-05T10:00:00.000Z',
      })),
    )
    const rounds = await buildGame({ fetchPool, cities: many, rng: seededRng(1) })
    expect(rounds).toHaveLength(GAME_CONFIG.roundsPerGame)
    expect(fetchPool).toHaveBeenCalledTimes(1)
  })

  it('refetches once, then falls back to a shorter game', async () => {
    const fetchPool = vi.fn(weatherFor(FOUR_PAIRS))
    const rounds = await buildGame({ fetchPool, cities, rng: seededRng(1) })
    expect(rounds).toHaveLength(4)
    expect(fetchPool).toHaveBeenCalledTimes(2)
  })

  it('never reuses a city in a shorter game', async () => {
    const rounds = await buildGame({ fetchPool: weatherFor(FOUR_PAIRS), cities, rng: seededRng(7) })
    const ids = rounds.flatMap((r) => [r.left.city.id, r.right.city.id])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('throws NotEnoughPairsError when no usable pairs exist', async () => {
    const fetchPool = vi.fn(weatherFor(NO_PAIRS))
    await expect(buildGame({ fetchPool, cities, rng: seededRng(1) })).rejects.toBeInstanceOf(
      NotEnoughPairsError,
    )
    expect(fetchPool).toHaveBeenCalledTimes(2)
  })

  it('keeps the first batch when the refetch fails', async () => {
    const good = weatherFor(FOUR_PAIRS)
    const fetchPool = vi
      .fn<(cities: readonly City[]) => Promise<CityWeather[]>>()
      .mockImplementationOnce(good)
      .mockRejectedValueOnce(new Error('network down'))
    const rounds = await buildGame({ fetchPool, cities, rng: seededRng(1) })
    expect(rounds).toHaveLength(4)
  })

  it('surfaces the error when the first request fails', async () => {
    const fetchPool = vi.fn().mockRejectedValue(new Error('offline'))
    await expect(buildGame({ fetchPool, cities })).rejects.toThrow('offline')
  })

  it('surfaces the refetch error when there is nothing to fall back on', async () => {
    const fetchPool = vi
      .fn<(cities: readonly City[]) => Promise<CityWeather[]>>()
      .mockImplementationOnce(weatherFor(NO_PAIRS))
      .mockRejectedValueOnce(new Error('429'))
    await expect(buildGame({ fetchPool, cities })).rejects.toThrow('429')
  })
})
