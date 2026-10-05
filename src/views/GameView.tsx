import { useQuery } from '@tanstack/react-query'
import { OpenMeteoError } from '../api/openMeteo'
import { Button } from '../components/Button'
import { StatusMessage } from '../components/StatusMessage'
import { loadGame, NotEnoughPairsError } from '../game/loadGame'
import type { GuessResult, Round } from '../types'
import { MatchView } from './MatchView'

interface GameViewProps {
  /** Changing this starts a brand new game (new random pool, new request). */
  gameId: number
  onFinish: (rounds: readonly Round[], results: readonly GuessResult[]) => void
  onHome: () => void
}

/**
 * Owns the one network request. TanStack Query supplies the loading/error
 * state, the automatic retries and the Retry button's refetch.
 */
export function GameView({ gameId, onFinish, onHome }: GameViewProps) {
  const query = useQuery({
    queryKey: ['game', gameId],
    queryFn: ({ signal }) => loadGame(signal),
    // The rounds must never change under the player, so never refetch on focus
    // or reconnect: a game is one fixed snapshot of the weather.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Transient network failures are worth retrying; a rate limit or a pool
    // with no valid pairs is not (a plain retry will not fix either).
    retry: (failureCount, error) => {
      if (error instanceof NotEnoughPairsError) return false
      if (error instanceof OpenMeteoError && error.rateLimited) return false
      return failureCount < 2
    },
  })

  if (query.isPending) {
    return (
      <StatusMessage title="Fetching live temperatures…" busy>
        Asking Open-Meteo for the current weather in a random set of cities.
      </StatusMessage>
    )
  }

  if (query.isError) {
    const { error } = query
    const actions = (
      <>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          {query.isFetching ? 'Retrying…' : 'Try again'}
        </Button>
        <Button variant="secondary" onClick={onHome}>
          Back to start
        </Button>
      </>
    )

    // Empty state: the request worked but produced no playable game.
    if (error instanceof NotEnoughPairsError) {
      return (
        <StatusMessage title="No good matchups right now" actions={actions}>
          Today&rsquo;s weather didn&rsquo;t give enough well-matched city pairs. Trying again picks a fresh set of
          cities.
        </StatusMessage>
      )
    }
    if (error instanceof OpenMeteoError && error.rateLimited) {
      return (
        <StatusMessage title="The weather service is busy" role="alert" actions={actions}>
          Open-Meteo&rsquo;s free tier limits how many requests one connection can make per minute. Wait a minute,
          then try again.
        </StatusMessage>
      )
    }
    return (
      <StatusMessage title="Couldn’t load the weather" role="alert" actions={actions}>
        Check your connection and try again.
      </StatusMessage>
    )
  }

  return <MatchView rounds={query.data} onFinish={onFinish} />
}
