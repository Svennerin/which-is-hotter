import { Button } from '../components/Button'
import { HeroMap } from './HeroMap'

const STEPS = [
  'Look at the map: where are the cities, and is it day or night there?',
  'Choose the hotter city.',
  'See both live temperatures and whether you were right.',
]

export function HomeView({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid items-center gap-8 py-2 lg:grid-cols-2 lg:gap-12 lg:py-8">
      <div>
        <p className="text-sm font-bold tracking-widest text-slate-600 uppercase">A live weather guessing game</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          Which city is hotter right now?
        </h1>
        <p className="mt-4 text-lg text-slate-700">
          Ten rounds. Each shows two cities on a map, and you pick the one with the higher temperature. The map shades
          the night side of the planet in real time, so you can see where the sun is up.
        </p>

        <Button onClick={onStart} className="mt-6 w-full px-10 text-lg sm:w-auto">
          Start game
        </Button>
        <p className="mt-3 text-sm text-slate-600">Uses live weather data, so an internet connection is required.</p>

        <ol className="mt-8 space-y-2 text-slate-800">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span aria-hidden="true" className="font-bold">
                {i + 1}.
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <HeroMap />
    </div>
  )
}
