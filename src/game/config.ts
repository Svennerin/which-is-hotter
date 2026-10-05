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

/** Scoring weights for ordering valid pairs (see pairing.ts). */
export const PAIR_SCORE = {
  /**
   * Small nudge towards different continents. Kept modest on purpose: when
   * this and distance were large, every pair came out intercontinental and
   * the map was always zoomed all the way out.
   */
  differentRegion: 0.25,
  /** Random jitter so repeat games over the same data still differ. */
  jitter: 1,
} as const

/**
 * Keeps a game visually varied. Pairs are grouped by distance and each group is
 * capped, so a single game mixes tightly zoomed regional maps with
 * world-spanning ones. Edges are in km: [near | mid | far].
 */
export const DISTANCE_VARIETY = {
  bandEdgesKm: [5000, 10000],
  /** Max pairs per band (near, mid, far). Filled nearest-first; ignored only if the pool is short. */
  maxPerBand: [3, 4, 4],
} as const
