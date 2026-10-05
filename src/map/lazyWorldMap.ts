import { lazy } from 'react'

// The map pulls in d3-geo and ~750 kB of country geometry, which the home
// screen does not need. Loading it on demand keeps the first paint small.
const load = () => import('./WorldMap')

export const LazyWorldMap = lazy(() => load().then((module) => ({ default: module.WorldMap })))

/**
 * Called when the player clicks Start, so the map code downloads while the
 * weather request is in flight instead of after it. The two run in parallel.
 */
export function preloadWorldMap(): void {
  void load()
}
