// Every tunable number in the game lives here so difficulty is easy to adjust.

export const GAME_CONFIG = {
  roundsPerGame: 10,
  /** Shorter games are allowed as a last resort, but never fewer than this. */
  minRoundsForShortGame: 3,
  /** Cities fetched per batch. Open-Meteo handles this in a single GET. */
  poolSize: 70,
} as const

export interface PairRules {
  /** Smallest/largest allowed |temperature difference| in °C. */
  minGapC: number
  maxGapC: number
  /** Cities closer than this make a dull, cramped map. */
  minDistanceKm: number
  /**
   * Largest allowed difference in absolute latitude. A cheap stand-in for
   * "same broad climate zone": it stops polar-vs-tropical pairs where the
   * answer is obvious, without needing a climate classification dataset.
   */
  maxLatitudeDiffDeg: number
}

/** First attempt: the difficulty we actually want. */
export const STRICT_RULES: PairRules = {
  minGapC: 1,
  maxGapC: 6,
  minDistanceKm: 2500,
  maxLatitudeDiffDeg: 35,
}

/** Used if the strict rules cannot fill a whole game from one batch. */
export const RELAXED_RULES: PairRules = {
  minGapC: 0.5,
  maxGapC: 8,
  minDistanceKm: 1500,
  maxLatitudeDiffDeg: 50,
}

/** Scoring weights for choosing among valid pairs (see pairing.ts). */
export const PAIR_SCORE = {
  /** Bonus when the two cities are on different continents. */
  differentRegion: 1,
  /** Distance is rewarded up to this cap; beyond it the map just zooms out. */
  distanceCapKm: 9000,
  /** Random jitter so repeat games over the same data still differ. */
  jitter: 1,
} as const
