import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { WALLPAPER_IMAGES } from "./shell"

describe("illustrated wallpapers", () => {
  it("every wallpaper image and thumbnail exists in public/", () => {
    for (const [name, files] of Object.entries(WALLPAPER_IMAGES)) {
      for (const file of [files!.src, files!.thumb, files!.portrait].filter((f): f is string => Boolean(f))) {
        expect(existsSync(resolve(process.cwd(), "public", file.replace(/^\//, ""))), `${name}: ${file}`).toBe(true)
      }
    }
  })
})
