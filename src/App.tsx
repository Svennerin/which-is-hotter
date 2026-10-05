import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Layout } from './components/Layout'
import { preloadWorldMap } from './map/lazyWorldMap'
import type { AppView } from './types'
import { GameView } from './views/GameView'
import { HomeView } from './views/HomeView'
import { ResultsView } from './views/ResultsView'

const queryClient = new QueryClient()

/**
 * No router: the whole app is one piece of state saying which of three views
 * to show. A URL per view would add nothing here, and it keeps deployment to
 * plain static files (no rewrite rules needed).
 */
export default function App() {
  const [view, setView] = useState<AppView>({ name: 'home' })
  const lastGameId = useRef(0)

  // A new id means a new query key, so each game fetches fresh weather.
  const startGame = () => {
    preloadWorldMap()
    setView({ name: 'game', gameId: ++lastGameId.current })
  }
  const goHome = () => setView({ name: 'home' })

  // Each view is a full screen; start every one at the top.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view.name])

  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        {view.name === 'home' && <HomeView onStart={startGame} />}
        {view.name === 'game' && (
          <GameView
            key={view.gameId}
            gameId={view.gameId}
            onFinish={(rounds, results) => setView({ name: 'results', rounds, results })}
            onHome={goHome}
          />
        )}
        {view.name === 'results' && (
          <ResultsView rounds={view.rounds} results={view.results} onPlayAgain={startGame} onHome={goHome} />
        )}
      </Layout>
    </QueryClientProvider>
  )
}
