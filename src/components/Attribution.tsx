/**
 * Open-Meteo's free tier requires visible attribution (CC BY 4.0), so it is on
 * every screen via the layout footer.
 */
export function Attribution() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-slate-600">
      <p>
        Weather data by{' '}
        <a className="font-medium underline" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo.com
        </a>{' '}
        (
        <a
          className="underline"
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        ). Map shapes from{' '}
        <a className="underline" href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">
          Natural Earth
        </a>
        .
      </p>
    </footer>
  )
}
