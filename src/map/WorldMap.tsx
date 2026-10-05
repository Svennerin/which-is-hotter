import { useMemo } from 'react'
import type { CityWeather } from '../types'
import { buildMapLayers } from './layers'
import { placeLabels } from './labels'
import { useElementSize } from './useElementSize'

interface WorldMapProps {
  /** The city shown as slot A (circle marker) and slot B (diamond marker). */
  a: CityWeather
  b: CityWeather
  /** The moment the night shading represents: the weather data's timestamp. */
  at: Date
  /** When true, labels also show each city's temperature and day/night. */
  revealed: boolean
}

const MARKER_RADIUS = 9
const NIGHT_BAND_OPACITY = 0.14
// One map per page, so a fixed id is safe (React's generated ids are not valid in url()).
const NIGHT_CLIP_ID = 'night-clip'

function labelText(slot: 'A' | 'B', w: CityWeather, revealed: boolean): string {
  if (!revealed) return `${slot} · ${w.city.name}`
  return `${slot} · ${w.city.name} · ${w.temperatureC.toFixed(1)}°C ${w.isDay ? '☀' : '☾'}`
}

/**
 * The centrepiece: a stylised world map framed on the two cities.
 *
 * Layers, bottom to top: ocean, faint graticule, land, night shading, country
 * borders, markers and labels. Borders sit *above* the night shading so they
 * stay readable on the dark side.
 */
export function WorldMap({ a, b, at, revealed }: WorldMapProps) {
  const { ref, width, height } = useElementSize<HTMLDivElement>()

  const layers = useMemo(
    () => (width > 0 && height > 0 ? buildMapLayers(a.city, b.city, at, width, height) : null),
    [a.city, b.city, at, width, height],
  )

  const textA = labelText('A', a, revealed)
  const textB = labelText('B', b, revealed)
  const labels = layers
    ? placeLabels([layers.markerA, layers.markerB], [textA.length, textB.length], width, height)
    : null

  const description =
    `Map showing A: ${a.city.name}, ${a.city.country} and B: ${b.city.name}, ${b.city.country}. ` +
    `Shaded areas are currently in night.`

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden bg-slate-200">
      {layers && labels && (
        <svg
          role="img"
          aria-label={description}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block"
        >
          <path d={layers.sphere} className="fill-map-ocean" />
          <path d={layers.graticule} className="fill-none stroke-map-graticule" strokeOpacity={0.35} strokeWidth={0.6} />
          <path d={layers.land} className="fill-map-land stroke-map-coast" strokeWidth={0.5} />

          {layers.nightBands.map((band, i) => (
            <path key={i} d={band} className="fill-map-night" fillOpacity={NIGHT_BAND_OPACITY} />
          ))}

          <path d={layers.borders} className="fill-none stroke-map-border" strokeWidth={0.7} strokeOpacity={0.85} strokeLinejoin="round" />

          {/*
            Dark borders vanish against shaded land, so the night side gets a
            second, light pass of borders and coastline, clipped to the night
            polygon. Both passes are real country geometry: borders stay
            visible on either side of the terminator.
          */}
          <clipPath id={NIGHT_CLIP_ID}>
            <path d={layers.nightBands[0]} />
          </clipPath>
          <g clipPath={`url(#${NIGHT_CLIP_ID})`} className="fill-none stroke-white" strokeLinejoin="round">
            <path d={layers.land} strokeOpacity={0.4} strokeWidth={0.8} />
            <path d={layers.borders} strokeOpacity={0.55} strokeWidth={0.7} />
          </g>

          <Marker slot="A" x={layers.markerA.x} y={layers.markerA.y} />
          <Marker slot="B" x={layers.markerB.x} y={layers.markerB.y} />
          <Label text={textA} placement={labels[0]} />
          <Label text={textB} placement={labels[1]} />
        </svg>
      )}
    </div>
  )
}

/** Circle for A, diamond for B, each with its letter: not colour alone. */
function Marker({ slot, x, y }: { slot: 'A' | 'B'; x: number; y: number }) {
  const fill = slot === 'A' ? 'fill-marker-a' : 'fill-marker-b'
  return (
    <g transform={`translate(${x} ${y})`}>
      {slot === 'A' ? (
        <circle r={MARKER_RADIUS} className={`${fill} stroke-white`} strokeWidth={2.5} />
      ) : (
        <rect
          x={-MARKER_RADIUS + 1}
          y={-MARKER_RADIUS + 1}
          width={(MARKER_RADIUS - 1) * 2}
          height={(MARKER_RADIUS - 1) * 2}
          transform="rotate(45)"
          className={`${fill} stroke-white`}
          strokeWidth={2.5}
        />
      )}
      <text textAnchor="middle" dy="0.35em" className="fill-white text-[10px] font-bold" aria-hidden="true">
        {slot}
      </text>
    </g>
  )
}

/** A white halo (paint-order: stroke) keeps text legible on land, sea and night. */
function Label({ text, placement }: { text: string; placement: { x: number; y: number; anchor: 'start' | 'middle' | 'end' } }) {
  return (
    <text
      x={placement.x}
      y={placement.y}
      textAnchor={placement.anchor}
      aria-hidden="true"
      className="fill-slate-900 stroke-white text-[13px] font-semibold"
      strokeWidth={4}
      strokeLinejoin="round"
      style={{ paintOrder: 'stroke' }}
    >
      {text}
    </text>
  )
}
