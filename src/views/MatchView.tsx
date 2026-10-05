import { Suspense, useEffect, useMemo, useReducer, useRef } from 'react'
import { Button } from '../components/Button'
import { RevealPanel } from '../components/RevealPanel'
import { SlotBadge } from '../components/SlotBadge'
import { crossCheckDayNight } from '../game/devChecks'
import { createMatch, isLastRound, matchReducer, scoreOf } from '../game/matchReducer'
import { describeLocation, observedAt } from '../lib/format'
import { LazyWorldMap } from '../map/lazyWorldMap'
import type { CityWeather, GuessResult, Round } from '../types'

interface MatchViewProps {
  rounds: readonly Round[]
  onFinish: (rounds: readonly Round[], results: readonly GuessResult[]) => void
}

/** Plays through a fixed list of rounds. All data is already loaded. */
export function MatchView({ rounds, onFinish }: MatchViewProps) {
  const [state, dispatch] = useReducer(matchReducer, rounds, createMatch)
  const round = rounds[state.roundIndex]
  const result = state.results[state.roundIndex]
  const headingRef = useRef<HTMLHeadingElement>(null)

  // A stable Date per round: the map memoises on it.
  const at = useMemo(() => observedAt(round), [round])

  useEffect(() => {
    if (import.meta.env.DEV) crossCheckDayNight(rounds)
  }, [rounds])

  // After "Next round" the old controls vanish; park focus on the new round's
  // heading so screen-reader and keyboard users land somewhere sensible.
  useEffect(() => {
    if (state.roundIndex > 0) headingRef.current?.focus()
  }, [state.roundIndex])

  const last = isLastRound(state)
  const handleNext = () => (last ? onFinish(rounds, state.results) : dispatch({ type: 'next' }))
  const score = scoreOf(state.results)

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-xl font-bold">
          Round {state.roundIndex + 1} of {rounds.length}
        </h1>
        <p className="font-semibold tabular-nums">Score: {score}</p>
      </div>

      <div className="h-72 overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-300 sm:h-96 lg:h-[30rem]">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-200 motion-reduce:animate-none" aria-hidden="true" />}>
          <LazyWorldMap a={round.left} b={round.right} at={at} revealed={state.revealed} />
        </Suspense>
      </div>
      <p className="mt-2 text-sm text-slate-600">Shaded areas are in night at the time of the weather reading.</p>

      {state.revealed && result ? (
        <RevealPanel round={round} result={result} isLastRound={last} onNext={handleNext} />
      ) : (
        <section aria-labelledby="question" className="mt-4">
          <h2 id="question" className="mb-3 text-lg font-semibold">
            Which city is hotter right now?
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceButton slot="A" weather={round.left} onChoose={() => dispatch({ type: 'guess', side: 'left' })} />
            <ChoiceButton slot="B" weather={round.right} onChoose={() => dispatch({ type: 'guess', side: 'right' })} />
          </div>
        </section>
      )}
    </div>
  )
}

function ChoiceButton({ slot, weather, onChoose }: { slot: 'A' | 'B'; weather: CityWeather; onChoose: () => void }) {
  return (
    <Button
      variant="secondary"
      onClick={onChoose}
      aria-label={`${slot}: ${describeLocation(weather)} is hotter`}
      className="min-h-16 justify-start gap-3 text-left text-lg hover:ring-slate-500"
    >
      <SlotBadge slot={slot} size={32} />
      <span className="flex flex-col">
        <span>{weather.city.name}</span>
        <span className="text-sm font-normal text-slate-600">{weather.city.country}</span>
      </span>
    </Button>
  )
}
