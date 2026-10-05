import { Button } from '../components/Button'
import { scoreOf } from '../game/matchReducer'
import { formatTemperature, hotterOf } from '../lib/format'
import type { GuessResult, Round } from '../types'

interface ResultsViewProps {
  rounds: readonly Round[]
  results: readonly GuessResult[]
  onPlayAgain: () => void
  onHome: () => void
}

function verdict(score: number, total: number): string {
  const ratio = score / total
  if (ratio === 1) return 'Perfect. You have a thermometer for a brain.'
  if (ratio >= 0.8) return 'Excellent: you read the globe well.'
  if (ratio >= 0.6) return 'Solid. The map helped.'
  if (ratio >= 0.4) return 'Not bad: these pairs are deliberately close.'
  return 'Tough round of weather. Try again!'
}

export function ResultsView({ rounds, results, onPlayAgain, onHome }: ResultsViewProps) {
  const score = scoreOf(results)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">Game over</h1>
        <p className="mt-2 text-6xl font-extrabold tabular-nums" aria-label={`You scored ${score} out of ${rounds.length}`}>
          {score} / {rounds.length}
        </p>
        <p className="mt-2 text-lg text-slate-700">{verdict(score, rounds.length)}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={onPlayAgain}>Play again</Button>
          <Button variant="secondary" onClick={onHome}>
            Back to start
          </Button>
        </div>
      </div>

      <h2 className="mt-10 mb-3 text-lg font-bold">Round by round</h2>
      <ol className="space-y-2">
        {rounds.map((round, i) => {
          const result = results[i]
          const hotter = hotterOf(round)
          return (
            <li key={i} className="flex items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200">
              <span
                className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-sm font-bold ${
                  result.correct ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                }`}
              >
                <span aria-hidden="true">{result.correct ? '✓ ' : '✗ '}</span>
                {result.correct ? 'Right' : 'Wrong'}
              </span>
              <p>
                <span className="font-semibold">{round.left.city.name}</span> {formatTemperature(round.left.temperatureC)}{' '}
                vs <span className="font-semibold">{round.right.city.name}</span>{' '}
                {formatTemperature(round.right.temperatureC)}
                <span className="block text-sm text-slate-600">
                  {hotter.city.name} was hotter. You picked {result.guess === 'left' ? round.left.city.name : round.right.city.name}.
                </span>
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
