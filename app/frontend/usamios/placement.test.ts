import { describe, expect, it } from "vitest"
import { defaultPlaced, isLocked, isPlaced, parsePlacement, placedApps, withPlacement } from "./placement"
import { APP_IDS, APPS } from "./registry"

describe("app placement", () => {
  it("falls back to the registry defaults", () => {
    for (const id of APP_IDS) {
      expect(isPlaced({}, id, "desktop")).toBe(APPS[id].onDesktop)
      expect(isPlaced({}, id, "dock")).toBe(APPS[id].inDock)
      expect(isPlaced({}, id, "home")).toBe(true) // every app is on the phone home screen until removed
      expect(isPlaced({}, id, "taskbar")).toBe(false)
    }
  })

  it("lets the visitor pin and unpin in every slot", () => {
    let p = withPlacement({}, "gallery", "desktop", false)
    p = withPlacement(p, "calendar", "taskbar", true)
    p = withPlacement(p, "code", "home", false)
    expect(isPlaced(p, "gallery", "desktop")).toBe(false)
    expect(isPlaced(p, "calendar", "taskbar")).toBe(true)
    expect(placedApps(p, "taskbar")).toEqual(["calendar"])
    expect(placedApps(p, "home")).not.toContain("code")
    expect(placedApps(p, "desktop")).not.toContain("gallery")
  })

  it("only stores differences, so going back to the default leaves nothing behind", () => {
    const changed = withPlacement({}, "gallery", "desktop", false)
    expect(changed).toEqual({ gallery: { desktop: false } })
    expect(withPlacement(changed, "gallery", "desktop", true)).toEqual({})
  })

  it("protects apps that would lock the visitor out", () => {
    expect(isLocked("settings", "home")).toBe(true)
    const attempt = withPlacement({}, "settings", "home", false)
    expect(attempt).toEqual({})
    expect(isPlaced(attempt, "settings", "home")).toBe(true)
    // ...but it can still be moved around everywhere else
    expect(isLocked("settings", "dock")).toBe(false)
  })

  it("never keeps a slot placed that the registry says is locked, even if storage says otherwise", () => {
    expect(isPlaced({ settings: { home: false } }, "settings", "home")).toBe(true)
  })

  it("parses stored data defensively", () => {
    expect(parsePlacement(null)).toEqual({})
    expect(parsePlacement("not json")).toEqual({})
    expect(parsePlacement("[1,2]")).toEqual({})
    expect(parsePlacement(JSON.stringify({ ghost: { desktop: true }, gallery: { desktop: "no", dock: false } }))).toEqual({
      gallery: { dock: false },
    })
    expect(parsePlacement(JSON.stringify({ settings: { home: false } }))).toEqual({})
  })

  it("defaults are consistent with the slots", () => {
    expect(defaultPlaced("browser", "desktop")).toBe(true)
    expect(defaultPlaced("browser", "taskbar")).toBe(false)
  })
})
