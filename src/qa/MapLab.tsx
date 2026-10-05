import { useMemo } from 'react'
import { CITIES } from '../data/cities'
import { isDaylight, subsolarPoint } from '../geo/sun'
import { WorldMap } from '../map/WorldMap'
import type { CityWeather } from '../types'

// Development-only harness for visual QA (see playwright/map.spec.ts).
// Example: /?lab&a=paris&b=sydney&t=2026-06-21T12:00Z&w=960&h=540&reveal=1
// It lets a test render any pair at any UTC time and size, with no network.

function findCity(id: string) {
  const city = CITIES.find((c) => c.id === id)
  if (!city) throw new Error(`Unknown city id "${id}"`)
  return city
}

export function MapLab() {
  const params = new URLSearchParams(window.location.search)
  const t = params.get('t') ?? '2026-06-21T12:00Z'
  const width = Number(params.get('w') ?? 960)
  const height = Number(params.get('h') ?? 540)
  const revealed = params.has('reveal')
  const idA = params.get('a') ?? 'paris'
  const idB = params.get('b') ?? 'sydney'

  const { a, b, at } = useMemo(() => {
    const at = new Date(t)
    const sun = subsolarPoint(at)
    const make = (id: string, temperatureC: number): CityWeather => {
      const city = findCity(id)
      return { city, temperatureC, isDay: isDaylight(city, sun), observedAt: at.toISOString() }
    }
    return { a: make(idA, 18.4), b: make(idB, 21.7), at }
  }, [idA, idB, t])

  return (
    <div className="p-4">
      <div data-testid="map" style={{ width, height }} className="overflow-hidden rounded-xl">
        <WorldMap a={a} b={b} at={at} revealed={revealed} />
      </div>
    </div>
  )
}
