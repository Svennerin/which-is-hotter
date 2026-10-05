import type { GuessResult, Round, Side } from '../types'
import { hotterSide } from './pairing'

/**
 * Progress through one game. The rounds themselves are fixed up front (see
 * loadGame.ts); this only tracks where the player is and how they did.
 */
export interface MatchState {
  rounds: readonly Round[]
  roundIndex: number
  /** One entry per round the player has already answered. */
  results: readonly GuessResult[]
  /** True once the current round is answered and the answer is on screen. */
  revealed: boolean
}

export type MatchAction = { type: 'guess'; side: Side } | { type: 'next' }

export function createMatch(rounds: readonly Round[]): MatchState {
  return { rounds, roundIndex: 0, results: [], revealed: false }
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'guess': {
      // Ignore a second click while the answer is already showing.
      if (state.revealed) return state
      const correct = hotterSide(state.rounds[state.roundIndex]) === action.side
      return {
        ...state,
        results: [...state.results, { guess: action.side, correct }],
        revealed: true,
      }
    }
    case 'next': {
      // "Next" only makes sense after a reveal, and never past the last round.
      if (!state.revealed || isLastRound(state)) return state
      return { ...state, roundIndex: state.roundIndex + 1, revealed: false }
    }
  }
}

export function isLastRound(state: MatchState): boolean {
  return state.roundIndex === state.rounds.length - 1
}

export function scoreOf(results: readonly GuessResult[]): number {
  return results.filter((r) => r.correct).length
}
