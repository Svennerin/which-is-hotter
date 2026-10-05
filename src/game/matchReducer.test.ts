import { describe, expect, it } from 'vitest'
import type { Round } from '../types'
import { createMatch, isLastRound, matchReducer, scoreOf } from './matchReducer'
import { makeCity } from './testUtils'

// Round 1: right is hotter. Round 2: left is hotter.
const rounds: Round[] = [
  { left: makeCity('a', 10, 0, 0), right: makeCity('b', 15, 0, 60) },
  { left: makeCity('c', 25, 0, 0), right: makeCity('d', 20, 0, 60) },
]

describe('matchReducer', () => {
  it('starts on the first round, unanswered', () => {
    const state = createMatch(rounds)
    expect(state).toMatchObject({ roundIndex: 0, results: [], revealed: false })
  })

  it('marks a correct guess and reveals the answer', () => {
    const state = matchReducer(createMatch(rounds), { type: 'guess', side: 'right' })
    expect(state.revealed).toBe(true)
    expect(state.results).toEqual([{ guess: 'right', correct: true }])
  })

  it('marks a wrong guess', () => {
    const state = matchReducer(createMatch(rounds), { type: 'guess', side: 'left' })
    expect(state.results).toEqual([{ guess: 'left', correct: false }])
  })

  it('ignores a second guess for the same round', () => {
    const once = matchReducer(createMatch(rounds), { type: 'guess', side: 'left' })
    const twice = matchReducer(once, { type: 'guess', side: 'right' })
    expect(twice).toBe(once)
  })

  it('ignores "next" before the answer is revealed', () => {
    const state = createMatch(rounds)
    expect(matchReducer(state, { type: 'next' })).toBe(state)
  })

  it('advances to the next round after a reveal', () => {
    const guessed = matchReducer(createMatch(rounds), { type: 'guess', side: 'right' })
    const next = matchReducer(guessed, { type: 'next' })
    expect(next).toMatchObject({ roundIndex: 1, revealed: false })
    expect(next.results).toHaveLength(1)
  })

  it('does not advance past the last round', () => {
    let state = createMatch(rounds)
    state = matchReducer(state, { type: 'guess', side: 'right' })
    state = matchReducer(state, { type: 'next' })
    state = matchReducer(state, { type: 'guess', side: 'left' })
    expect(isLastRound(state)).toBe(true)
    expect(matchReducer(state, { type: 'next' })).toBe(state)
    expect(scoreOf(state.results)).toBe(2)
  })
})
