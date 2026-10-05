import { Suspense, useState } from 'react'
import { CITIES } from '../data/cities'
import { isDaylight, subsolarPoint } from '../geo/sun'
import { LazyWorldMap } from '../map/lazyWorldMap'
import type { CityWeather } from '../types'

// Hand-picked pairs that make an interesting preview: a mix of zoom levels,
// and cities far enough apart that the day/night line usually falls between them.
const PREVIEW_PAIRS: [string, string][] = [
  ['london', 'sydney'],
  ['tokyo', 'los-angeles'],
  ['cape-town', 'reykjavik'],
  ['dubai', 'sao-paulo'],
  ['mumbai', 'chicago'],
  ['dublin', 'rome'],
]

/**
 * The hero's picture: the real game map, showing the actual night side of the
 * planet right now. It uses no weather request, so it costs no API quota and
 * appears instantly. Temperatures are never shown (revealed is false), so the
 * placeholder value below is never displayed.
 */
export function HeroMap() {
  // Chosen once per visit; the lazy initialiser keeps it stable across renders.
  const [{ a, b, at }] = useState(() => {
    const at = new Date()
    const sun = subsolarPoint(at)
    const [idA, idB] = PREVIEW_PAIRS[Math.floor(Math.random() * PREVIEW_PAIRS.length)]
    const make = (id: string): CityWeather => {
      const city = CITIES.find((c) => c.id === id)!
      return { city, temperatureC: 0, isDay: isDaylight(city, sun), observedAt: at.toISOString() }
    }
    return { a: make(idA), b: make(idB), at }
  })

  return (
    <figure>
      <div className="h-64 overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-300 sm:h-80 lg:h-96">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-200 motion-reduce:animate-none" aria-hidden="true" />}>
          <LazyWorldMap a={a} b={b} at={at} revealed={false} />
        </Suspense>
      </div>
      <figcaption className="mt-2 text-sm text-slate-600">
        The real night side of Earth, right now. Which of these two is hotter?
      </figcaption>
    </figure>
  )
}
