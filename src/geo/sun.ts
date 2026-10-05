import { geoDistance } from 'd3-geo'

// Approximate solar position, good to roughly 0.1°. That is far more than a
// day/night map needs: one degree of error moves the terminator ~110 km.
// Formulas follow the low-precision algorithm in the Astronomical Almanac.

export interface LatLon {
  lat: number
  lon: number
}

const DEG = Math.PI / 180
const MS_PER_DAY = 86_400_000
const J2000_MS = Date.UTC(2000, 0, 1, 12)

/** Wrap an angle in degrees into [-180, 180). */
function wrap180(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180
}

/** The point on Earth where the sun is directly overhead at `date`. */
export function subsolarPoint(date: Date): LatLon {
  const n = (date.getTime() - J2000_MS) / MS_PER_DAY // days since J2000.0

  const meanLongitude = 280.46 + 0.9856474 * n
  const meanAnomaly = (357.528 + 0.9856003 * n) * DEG
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * DEG
  const obliquity = (23.439 - 0.0000004 * n) * DEG

  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude))
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  )

  // Greenwich mean sidereal time: how far the Earth has turned relative to the
  // stars. The sun's longitude is its right ascension minus that rotation.
  const gmst = 280.46061837 + 360.98564736629 * n

  return { lat: declination / DEG, lon: wrap180(rightAscension / DEG - gmst) }
}

/** The opposite point: the centre of the night side. */
export function antisolarPoint(sun: LatLon): LatLon {
  return { lat: -sun.lat, lon: wrap180(sun.lon + 180) }
}

/** Angular distance (degrees) between a place and the subsolar point. */
export function angleFromSun(place: LatLon, sun: LatLon): number {
  return (geoDistance([place.lon, place.lat], [sun.lon, sun.lat]) * 180) / Math.PI
}

/**
 * Whether the sun is above the horizon. The horizon is exactly 90° from the
 * subsolar point, so daylight means "less than 90°". (Refraction lifts the sun
 * ~0.8° in reality; negligible here.)
 */
export function isDaylight(place: LatLon, sun: LatLon): boolean {
  return angleFromSun(place, sun) < 90
}
