import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function start() {
  const root = createRoot(document.getElementById('root')!)

  // Visual-QA harness; `import.meta.env.DEV` is false in production builds, so
  // the bundler removes this branch and the lab never ships.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('lab')) {
    const { MapLab } = await import('./qa/MapLab')
    root.render(<MapLab />)
    return
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
