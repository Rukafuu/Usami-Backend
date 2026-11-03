import { describe, expect, it } from "vitest"
import { frameRows, framePixels, SPRITE_HEIGHT, SPRITE_WIDTH, type Frame } from "./sprite"
import { clampPosition, nextLine, nextStep, walkDuration } from "./behavior"

describe("nextLine", () => {
  it("never repeats the last line and stays in range", () => {
    for (let last = 0; last < 5; last++) {
      for (let i = 0; i < 100; i++) {
        const line = nextLine(5, last, () => i / 100)
        expect(line).not.toBe(last)
        expect(line).toBeGreaterThanOrEqual(0)
        expect(line).toBeLessThan(5)
      }
    }
  })

  it("handles one or no lines and a first draw", () => {
    expect(nextLine(1, 0, Math.random)).toBe(0)
    expect(nextLine(0, null, Math.random)).toBe(0)
    expect(nextLine(3, null, () => 0.99)).toBeLessThan(3)
  })
})

describe("nextStep", () => {
  it("falls asleep after several idle decisions", () => {
    expect(nextStep(0.5, 4, false, () => 0.9).mood).toBe("sleep")
  })

  it("never walks when it has to stay still", () => {
    for (let i = 0; i < 50; i++) expect(nextStep(0.2, 0, true, () => i / 50).mood).not.toBe("walk")
  })

  it("walks to a different spot, inside the track", () => {
    const step = nextStep(0.5, 0, false, () => 0.5 + 0.0001 * 0)
    // random() = 0.5 is not < 0.4, so it walks; the target is too close and gets pushed away.
    expect(step.mood).toBe("walk")
    expect(Math.abs(step.target - 0.5)).toBeGreaterThanOrEqual(0.12)
    expect(step.target).toBe(clampPosition(step.target))
  })
})

describe("walkDuration", () => {
  it("scales with distance and has a floor", () => {
    expect(walkDuration(0.5, 760)).toBeCloseTo(10000, -2)
    expect(walkDuration(0.0001, 760)).toBe(400)
  })
})

describe("sprite", () => {
  const frames: Frame[] = ["idle", "blink", "stepA", "stepB", "sleep", "wave", "happy", "dizzy"]
  it.each(frames)("%s fits the grid", (frame) => {
    const rows = frameRows(frame)
    expect(rows).toHaveLength(SPRITE_HEIGHT)
    rows.forEach((row) => expect(row).toHaveLength(SPRITE_WIDTH))
    framePixels(frame).forEach((p) => {
      expect(p.x).toBeLessThan(SPRITE_WIDTH)
      expect(p.y).toBeLessThan(SPRITE_HEIGHT)
    })
  })
})
