import { readFileSync } from "node:fs"
import { resolve as resolvePath } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Resolves the real CSS tokens (main.css + themes.css) for every combination of
 * theme × accent × vision mode and checks WCAG contrast. If a colour is changed in the CSS
 * and no longer reads well, this test fails — in any theme, accent or colour-vision mode.
 */

const css = ["main.css", "themes.css"]
  .map((f) => readFileSync(resolvePath(process.cwd(), "app/frontend/styles", f), "utf8"))
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")

type Vars = Record<string, string>

const blocks = new Map<string, Vars>()
for (const [, selector, body] of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
  const key = selector!.trim().replace(/\s+/g, " ")
  const vars = blocks.get(key) ?? {}
  for (const [, name, value] of body!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[name!] = value!.trim()
  blocks.set(key, vars)
}

const block = (selector: string): Vars => blocks.get(selector) ?? {}

const resolve = (value: string, vars: Vars, depth = 0): string => {
  if (depth > 8) throw new Error(`var() cycle in ${value}`)
  return value.replace(/var\((--[\w-]+)(?:,\s*([^()]+(?:\([^()]*\))?[^()]*))?\)/g, (_, name: string, fallback?: string) => {
    const found = vars[name]
    if (found !== undefined) return resolve(found, vars, depth + 1)
    if (fallback !== undefined) return resolve(fallback.trim(), vars, depth + 1)
    throw new Error(`undefined ${name}`)
  })
}

const scenarioVars = (theme: "dark" | "light", accent: string, vision: string): Vars => {
  const vars: Vars = { ...block(":root") }
  if (theme === "light") Object.assign(vars, block(':root[data-theme="light"]'))
  if (accent !== "caramel") Object.assign(vars, block(`:root[data-accent="${accent}"]`))
  if (vision !== "none") Object.assign(vars, block(`:root[data-vision="${vision}"]`))
  if (vision === "contrast") Object.assign(vars, block(`:root[data-vision="contrast"][data-theme="${theme}"]`))
  return vars
}

const channel = (v: number) => {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const luminance = (hex: string) => {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!)
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

// [foreground token, background token, why it matters]
const PAIRS: [string, string, string][] = [
  ["--fg", "--bg", "headings on the page"],
  ["--text", "--bg", "body text on the page"],
  ["--mute", "--bg", "secondary text on the page"],
  ["--dim", "--bg", "metadata on the page"],
  ["--accent", "--bg", "links and labels on the page"],
  ["--fg", "--surface", "text in windows"],
  ["--text", "--surface", "body text in windows"],
  ["--mute", "--surface", "secondary text in windows"],
  ["--dim", "--surface", "metadata in windows"],
  ["--accent", "--surface", "links and labels in windows"],
  ["--text", "--surface-2", "text on title bars and hovers"],
  ["--mute", "--surface-2", "secondary text on title bars and hovers"],
  ["--accent", "--surface-2", "accents on title bars and hovers"],
  ["--fg", "--surface-3", "selected rows"],
  ["--on-accent", "--accent", "text on accent buttons and chips"],
]

const THEMES = ["dark", "light"] as const
const ACCENTS = ["caramel", "rose", "sage", "slate"]
const VISIONS = ["none", "redgreen", "blueyellow", "contrast"]

describe("colour contrast (WCAG)", () => {
  for (const theme of THEMES) {
    for (const vision of VISIONS) {
      // Accents only apply when no vision mode is active (vision modes pick their own accent).
      const accents = vision === "none" ? ACCENTS : ["caramel"]
      for (const accent of accents) {
        it(`${theme} · accent ${accent} · vision ${vision}`, () => {
          const vars = scenarioVars(theme, accent, vision)
          const minimum = vision === "contrast" ? 7 : 4.5
          const failures: string[] = []
          for (const [fg, bg, why] of PAIRS) {
            const a = resolve(vars[fg] ?? "", vars)
            const b = resolve(vars[bg] ?? "", vars)
            const r = ratio(a, b)
            if (!Number.isFinite(r)) failures.push(`${fg} (${a || "undefined"}) on ${bg} (${b || "undefined"}) could not be resolved`)
            else if (r < minimum) failures.push(`${fg} ${a} on ${bg} ${b} = ${r.toFixed(2)} (< ${minimum}) — ${why}`)
          }
          expect(failures).toEqual([])
        })
      }
    }
  }

  it("the colour-blind palettes keep the accent distinguishable from the danger colour", () => {
    for (const vision of ["redgreen", "blueyellow"]) {
      for (const theme of THEMES) {
        const vars = scenarioVars(theme, "caramel", vision)
        const accent = resolve(vars["--accent"]!, vars)
        const danger = resolve(vars["--danger"]!, vars)
        expect(accent).not.toBe(danger)
      }
    }
  })
})
