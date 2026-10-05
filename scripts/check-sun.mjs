// One-off validation: does our sun maths agree with Open-Meteo's own `is_day`
// flag for every bundled city, right now? Run with:
//   node --experimental-strip-types scripts/check-sun.mjs
// Cities within 1.5° of the terminator are reported separately because the two
// sources define "sunrise" slightly differently (refraction, disc vs. centre).

import { CITIES } from '../src/data/cities.ts'
import { angleFromSun, subsolarPoint } from '../src/geo/sun.ts'

const url = new URL('https://api.open-meteo.com/v1/forecast')
url.searchParams.set('latitude', CITIES.map((c) => c.lat).join(','))
url.searchParams.set('longitude', CITIES.map((c) => c.lon).join(','))
url.searchParams.set('current', 'temperature_2m,is_day')

const res = await fetch(url)
if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
const data = await res.json()

const time = new Date(`${data[0].current.time}:00Z`)
const sun = subsolarPoint(time)
console.log(`Data time ${time.toISOString()}  subsolar point ${sun.lat.toFixed(2)}, ${sun.lon.toFixed(2)}`)
console.log(`${data.length} locations in one request, URL length ${url.href.length}`)

let agree = 0
const disagree = []
const borderline = []
data.forEach((d, i) => {
  const city = CITIES[i]
  const angle = angleFromSun(city, sun)
  const ours = angle < 90
  const theirs = d.current.is_day === 1
  if (ours === theirs) agree++
  else if (Math.abs(angle - 90) < 1.5) borderline.push(`${city.name} (${angle.toFixed(2)}°)`)
  else disagree.push(`${city.name} ours=${ours} theirs=${theirs} angle=${angle.toFixed(2)}`)
})
console.log(`Agree: ${agree}/${data.length}`)
console.log('Borderline (within 1.5° of terminator):', borderline.join(', ') || 'none')
console.log('Real disagreements:', disagree.join('; ') || 'none')
