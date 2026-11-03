/** Pure rules for the desktop critter, so they can be tested without a DOM or timers. */
export type Mood = "idle" | "walk" | "sleep"

/** Position along the track, 0 (left end) to 1 (right end). */
export const clampPosition = (value: number): number => Math.min(1, Math.max(0, value))

/** Next phrase: never the one just said, and every phrase comes round before one repeats too soon. */
export function nextLine(count: number, last: number | null, random: () => number): number {
  if (count <= 1) return 0
  const pick = Math.floor(random() * (count - 1))
  // Skip over `last` so the draw stays uniform among the others.
  return last !== null && pick >= last ? pick + 1 : pick
}

export type Step = { mood: Mood; target: number; after: number }

const MIN_WALK = 0.12

/**
 * What to do next. `idleFor` is how many decisions in a row it already stood still (it falls asleep
 * after a few); `still` forbids walking (reduced motion), so it only ever rests.
 */
export function nextStep(position: number, idleFor: number, still: boolean, random: () => number): Step {
  if (idleFor >= 4) return { mood: "sleep", target: position, after: 9000 + random() * 6000 }
  if (still || random() < 0.4) return { mood: "idle", target: position, after: 2200 + random() * 3000 }
  let target = clampPosition(random())
  // A walk that is too short looks like a twitch: make it a proper stroll to the other side.
  if (Math.abs(target - position) < MIN_WALK) target = position < 0.5 ? clampPosition(position + 0.3) : clampPosition(position - 0.3)
  return { mood: "walk", target, after: 0 }
}

/** Milliseconds to cross `distance` of a track `trackPx` wide at `speed` px per second. */
export const walkDuration = (distance: number, trackPx: number, speed = 38): number =>
  Math.max(400, (Math.abs(distance) * trackPx) / speed * 1000)
