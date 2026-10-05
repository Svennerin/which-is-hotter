import { useEffect, useRef } from 'react'
import { describeLocation, formatTemperature, formatUtcTime, hotterOf, observedAt } from '../lib/format'
import type { CityWeather, GuessResult, Round } from '../types'
import { Button } from './Button'
import { SlotBadge } from './SlotBadge'

interface RevealPanelProps {
  round: Round
  result: GuessResult
  isLastRound: boolean
  onNext: () => void
}

/** Shown after a guess: both temperatures, day/night, and whether the guess was right. */
export function RevealPanel({ round, result, isLastRound, onNext }: RevealPanelProps) {
  const nextRef = useRef<HTMLButtonElement>(null)
  const hotter = hotterOf(round)
  const gap = Math.abs(round.left.temperatureC - round.right.temperatureC)

  // Move focus to the next action so keyboard users do not have to hunt for it
  // after the choice buttons disappear.
  useEffect(() => {
    nextRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="reveal-heading" className="mt-4 space-y-4">
      {/* aria-live announces the verdict to screen readers when it appears. */}
      <div
        role="status"
        className={`rounded-xl p-4 ring-1 ${
          result.correct ? 'bg-emerald-50 text-emerald-950 ring-emerald-300' : 'bg-rose-50 text-rose-950 ring-rose-300'
        }`}
      >
        <h2 id="reveal-heading" className="text-xl font-bold">
          <span aria-hidden="true">{result.correct ? '✓ ' : '✗ '}</span>
          {result.correct ? 'Correct!' : 'Not quite.'}
        </h2>
        <p>
          {describeLocation(hotter)} is hotter, by {formatTemperature(gap)}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CityCard slot="A" weather={round.left} isHotter={hotter === round.left} picked={result.guess === 'left'} />
        <CityCard slot="B" weather={round.right} isHotter={hotter === round.right} picked={result.guess === 'right'} />
      </div>

      <p className="text-sm text-slate-600">
        Temperatures as of {formatUtcTime(observedAt(round).toISOString())}. Values come from weather-model grid
        cells, not thermometers in the cities themselves.
      </p>

      <Button ref={nextRef} onClick={onNext} className="w-full sm:w-auto">
        {isLastRound ? 'See results' : 'Next round'}
      </Button>
    </section>
  )
}

function CityCard({
  slot,
  weather,
  isHotter,
  picked,
}: {
  slot: 'A' | 'B'
  weather: CityWeather
  isHotter: boolean
  picked: boolean
}) {
  return (
    <div className={`rounded-xl bg-white p-4 ring-2 ${isHotter ? 'ring-amber-500' : 'ring-slate-200'}`}>
      <div className="flex items-center gap-2">
        <SlotBadge slot={slot} />
        <div className="min-w-0">
          <p className="truncate font-bold">{weather.city.name}</p>
          <p className="truncate text-sm text-slate-600">{weather.city.country}</p>
        </div>
      </div>
      <p className="mt-3 text-4xl font-bold tabular-nums">{formatTemperature(weather.temperatureC)}</p>
      <p className="mt-1 text-slate-800">
        <span aria-hidden="true">{weather.isDay ? '☀ ' : '☾ '}</span>
        {weather.isDay ? 'Daytime' : 'Night'}
      </p>
      <p className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
        {isHotter && <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">Hotter</span>}
        {picked && <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-800">Your pick</span>}
      </p>
    </div>
  )
}
