import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const css = readFileSync(resolve(process.cwd(), "app/frontend/styles/usamios.css"), "utf8")
const rule = (selector: string) => css.match(new RegExp(`${selector.replace(/[.[\]]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? ""

describe("group panel shape", () => {
  it("is always square, on the desktop and as a phone sheet", () => {
    expect(rule(".os-group-panel")).toMatch(/aspect-ratio:\s*1\s*\/\s*1/)
    expect(rule(".os-group-panel")).toMatch(/width:\s*var\(--panel-size\)/)
    // The phone sheet only changes size and position, never the aspect ratio or a separate height.
    expect(rule(".os--mobile .os-group-panel, .os-group-panel.is-sheet")).not.toMatch(/height|aspect-ratio/)
  })

  it("scrolls inside the square instead of growing when a group has many apps", () => {
    expect(rule(".os-group-panel")).toMatch(/overflow:\s*hidden/)
    expect(css).toMatch(/\.os-group-panel ul \{[^}]*overflow-y:\s*auto/)
  })
})
