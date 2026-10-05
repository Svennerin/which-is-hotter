import { Button } from '../components/Button'

export function HomeView({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">Which city is hotter right now?</h1>
      <p className="mt-4 text-lg text-slate-700">
        Ten rounds. Each shows two cities on a map, and you pick the one with the higher temperature. The map
        shades the night side of the planet in real time, so you can see where the sun is up.
      </p>

      <ol className="mx-auto mt-6 max-w-md space-y-2 text-left text-slate-800">
        <li className="flex gap-3">
          <span aria-hidden="true" className="font-bold">1.</span>
          Look at the map: where are the cities, and is it day or night there?
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="font-bold">2.</span>
          Choose the hotter city.
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="font-bold">3.</span>
          See both live temperatures and whether you were right.
        </li>
      </ol>

      <Button onClick={onStart} className="mt-8 px-10 text-lg">
        Start game
      </Button>
      <p className="mt-4 text-sm text-slate-600">Uses live weather data, so an internet connection is required.</p>
    </div>
  )
}
