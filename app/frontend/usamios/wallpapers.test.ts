import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { WALLPAPER_IMAGES } from "./shell"

describe("illustrated wallpapers", () => {
  it("provides 5 illustrated wallpapers with both desktop (landscape), mobile (portrait), and thumbnail files in public/", () => {
    const entries = Object.entries(WALLPAPER_IMAGES)
    expect(entries).toHaveLength(5)
    for (const [name, files] of entries) {
      expect(files?.src, `${name} desktop src`).toBeTruthy()
      expect(files?.portrait, `${name} mobile portrait`).toBeTruthy()
      expect(files?.thumb, `${name} thumbnail`).toBeTruthy()
      for (const file of [files!.src, files!.thumb, files!.portrait].filter((f): f is string => Boolean(f))) {
        expect(existsSync(resolve(process.cwd(), "public", file.replace(/^\//, ""))), `${name}: ${file}`).toBe(true)
      }
    }
  })
})
