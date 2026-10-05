import { geoGraticule10, geoPath } from 'd3-geo'
import type { LatLon } from '../geo/sun'
import { nightBands } from './nightShading'
import { createProjection } from './projection'
import { borders, land } from './worldData'

export interface MapLayers {
  /** The outline of the globe; filled as the ocean. */
  sphere: string
  graticule: string
  land: string
  borders: string
  /** Night polygons, outermost (lightest) first. */
  nightBands: string[]
  /** Marker positions in viewport pixels. */
  markerA: { x: number; y: number }
  markerB: { x: number; y: number }
}

/**
 * Everything the SVG needs, as path strings. React renders these; d3 only does
 * the maths. Pure so it is easy to test and to memoise.
 */
export function buildMapLayers(
  a: LatLon,
  b: LatLon,
  at: Date,
  width: number,
  height: number,
): MapLayers {
  const projection = createProjection(a, b, width, height)
  const path = geoPath(projection)
  const place = (p: LatLon) => {
    const point = projection([p.lon, p.lat])
    // Natural Earth shows the whole globe, so every city projects; fall back
    // to the centre rather than crash if that ever stops being true.
    return { x: point?.[0] ?? width / 2, y: point?.[1] ?? height / 2 }
  }

  return {
    sphere: path({ type: 'Sphere' }) ?? '',
    graticule: path(geoGraticule10()) ?? '',
    land: path(land) ?? '',
    borders: path(borders) ?? '',
    nightBands: nightBands(at).map((band) => path(band) ?? ''),
    markerA: place(a),
    markerB: place(b),
  }
}
