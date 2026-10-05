import { geoCircle } from 'd3-geo'
import type { Polygon } from 'geojson'
import { antisolarPoint, subsolarPoint } from '../geo/sun'

/**
 * Radii, in degrees from the point opposite the sun, of the stacked night
 * layers. 90° is the horizon (sunset); 96°, 102° and 108° are where the sun is
 * 6°, 12° and 18° below it, i.e. the ends of civil, nautical and astronomical
 * twilight. Each circle sits inside the previous, so with a low opacity per
 * layer the shading deepens smoothly into full night.
 */
export const NIGHT_BAND_RADII = [90, 96, 102, 108] as const

/** One polygon per band, from outermost (lightest) to innermost (darkest). */
export function nightBands(at: Date): Polygon[] {
  const centre = antisolarPoint(subsolarPoint(at))
  return NIGHT_BAND_RADII.map((radius) =>
    geoCircle().center([centre.lon, centre.lat]).radius(radius)(),
  )
}
