/**
 * Pixel art for the desktop critter. An original drawing (not Anthropic's artwork), kept as text so
 * it can be reviewed in a diff: `.` empty, `o` body, `d` eye, `s` shade, `a` spark.
 */
export type Frame = "idle" | "blink" | "stepA" | "stepB" | "sleep" | "wave" | "happy" | "dizzy"

export const SPRITE_WIDTH = 13
export const SPRITE_HEIGHT = 10

const HEAD = [
  "......a......",
  ".....aoa.....",
  "...ooooooo...",
  "..ooooooooo..",
]
const BODY_OPEN = ["..oodooodoo..", "..oodooodoo.."]
const BODY_SHUT = ["..ooooooooo..", "..osdoosdoo.."]
const BODY_HAPPY = ["..oodooodoo..", "..ododododo.."]
const BODY_DIZZY = ["..ododododo..", "..oodooodoo.."]
const ARMS = [".ooooooooooo.", "..ooooooooo.."]
const ARMS_WAVE = ["..ooooooooooo", "..ooooooooo.."]
const LEGS_A = ["...o.o.o.o...", "...s.s.s.s..."]
const LEGS_B = ["....o.o.o.o..", "....s.s.s.s.."]

const FRAMES: Record<Frame, string[]> = {
  idle: [...HEAD, ...BODY_OPEN, ...ARMS, ...LEGS_A].map(fit),
  blink: [...HEAD, ...BODY_SHUT, ...ARMS, ...LEGS_A].map(fit),
  stepA: [...HEAD, ...BODY_OPEN, ...ARMS, ...LEGS_A].map(fit),
  stepB: [...HEAD, ...BODY_OPEN, ...ARMS, ...LEGS_B].map(fit),
  sleep: [...HEAD, ...BODY_SHUT, ...ARMS, ...LEGS_A].map(fit),
  wave: [...HEAD, ...BODY_OPEN, ...ARMS_WAVE, ...LEGS_A].map(fit),
  happy: [...HEAD, ...BODY_HAPPY, ...ARMS_WAVE, ...LEGS_B].map(fit),
  dizzy: [...HEAD, ...BODY_DIZZY, ...ARMS, ...LEGS_B].map(fit),
}

/** Rows are written by hand: pad or cut them to the grid so a typo can never break the drawing. */
function fit(row: string): string {
  return row.padEnd(SPRITE_WIDTH, ".").slice(0, SPRITE_WIDTH)
}

export type Pixel = { x: number; y: number; kind: "o" | "d" | "s" | "a" }

export const framePixels = (frame: Frame): Pixel[] => {
  const pixels: Pixel[] = []
  FRAMES[frame].forEach((row, y) => {
    ;[...row].forEach((char, x) => {
      if (char === "o" || char === "d" || char === "s" || char === "a") pixels.push({ x, y, kind: char })
    })
  })
  return pixels
}

export const frameRows = (frame: Frame): readonly string[] => FRAMES[frame]
