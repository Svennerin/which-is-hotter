import { angleFromSun, subsolarPoint } from '../geo/sun'
import type { Round } from '../types'

/**
 * Development-only: compares our own day/night calculation (which draws the
 * shading) with Open-Meteo's `is_day` flag for each city, and warns on a real
 * disagreement. Cities within 1.5° of the terminator are skipped because the
 * two sources define sunrise slightly differently there.
 */
export function crossCheckDayNight(rounds: readonly Round[]): void {
  for (const round of rounds) {
    for (const w of [round.left, round.right]) {
      const sun = subsolarPoint(new Date(w.observedAt))
      const angle = angleFromSun(w.city, sun)
      if (Math.abs(angle - 90) < 1.5) continue
      if (angle < 90 !== w.isDay) {
        console.warn(
          `[day/night] ${w.city.name}: map shading says ${angle < 90 ? 'day' : 'night'} ` +
            `but Open-Meteo is_day=${w.isDay} (${angle.toFixed(1)}° from the sun)`,
        )
      }
    }
  }
}
