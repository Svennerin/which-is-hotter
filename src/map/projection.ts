import { geoCircle, geoInterpolate, geoNaturalEarth1, type GeoProjection } from 'd3-geo'
import type { GeometryCollection, Polygon } from 'geojson'
import type { LatLon } from '../geo/sun'

/**
 * How the map is framed. Tune these to change the feel of the zoom.
 */
export const FRAMING = {
  /**
   * Each city gets an invisible circle of this radius that must stay inside the
   * frame. It is what keeps two cities at the same latitude from collapsing to
   * a zero-height box, and it leaves room around the markers for labels.
   */
  bufferDegrees: 7,
  /** Pixels kept clear around the framed area. */
  paddingPx: 28,
  /** Never zoom in further than this multiple of the whole-world fit. */
  maxZoom: 6,
}

const toPoint = (p: LatLon): [number, number] => [p.lon, p.lat]

/**
 * A projection that frames both cities in a `width` x `height` viewport.
 *
 * Approach, all via d3-geo built-ins rather than hand-written geometry:
 * 1. Rotate the globe so the pair's midpoint is the centre of the map. d3 cuts
 *    the map at the antimeridian of the *rotated* globe, so a pair straddling
 *    the dateline is no longer split across the left and right edges.
 * 2. `fitExtent` to the two buffer circles to pick scale and translation.
 * 3. Clamp the zoom between "whole world visible" and `maxZoom`.
 */
export function createProjection(a: LatLon, b: LatLon, width: number, height: number): GeoProjection {
  const pad = FRAMING.paddingPx
  const extent: [[number, number], [number, number]] = [
    [pad, pad],
    [Math.max(pad + 1, width - pad), Math.max(pad + 1, height - pad)],
  ]
  const [midLon] = geoInterpolate(toPoint(a), toPoint(b))(0.5)

  const makeBase = () => geoNaturalEarth1().rotate([-midLon, 0])

  const circle = (p: LatLon): Polygon =>
    geoCircle().center(toPoint(p)).radius(FRAMING.bufferDegrees)()
  const buffers: GeometryCollection = {
    type: 'GeometryCollection',
    geometries: [circle(a), circle(b)],
  }

  // The tightest view that is still the whole world: our lower zoom limit.
  const world = makeBase().fitExtent(extent, { type: 'Sphere' })
  const minScale = world.scale()
  const maxScale = minScale * FRAMING.maxZoom

  const fitted = makeBase().fitExtent(extent, buffers)
  const scale = fitted.scale()

  let projection: GeoProjection
  if (scale <= minScale) {
    // The pair is so far apart that only the whole world shows both.
    projection = world
  } else if (scale > maxScale) {
    // Very close pair: zoom in no further than the limit, keeping the same
    // centre point (the fit centres the buffers on the middle of the extent).
    const centre = [width / 2, height / 2]
    const [tx, ty] = fitted.translate()
    const ratio = maxScale / scale
    projection = fitted
      .scale(maxScale)
      .translate([centre[0] - ratio * (centre[0] - tx), centre[1] - ratio * (centre[1] - ty)])
  } else {
    projection = fitted
  }

  // Skip drawing anything outside the viewport: at high zoom that discards
  // most of the 50m land polygons and keeps the SVG paths small.
  return projection.clipExtent([
    [-20, -20],
    [width + 20, height + 20],
  ])
}
