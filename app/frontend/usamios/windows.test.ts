import { beforeEach, describe, expect, it } from "vitest"
import { focusedApp, minSizeOf, resizeRect, TASKBAR, useWindows } from "./windows"

const viewport = { width: 1280, height: 800 }
const state = () => useWindows.getState()

beforeEach(() => useWindows.setState({ windows: {}, order: [], topZ: 10 }))

describe("window manager", () => {
  it("opens windows above the taskbar and lists them in opening order", () => {
    state().open("files", viewport)
    state().open("browser", viewport)
    const files = state().windows.files!
    expect(files.y + files.h).toBeLessThanOrEqual(viewport.height - TASKBAR)
    expect(state().order).toEqual(["files", "browser"])
    expect(focusedApp(state().windows)).toBe("browser")
  })

  it("cascades new windows so they don't stack exactly", () => {
    state().open("files", viewport)
    state().open("gallery", viewport)
    expect(state().windows.gallery!.x).not.toBe(state().windows.files!.x)
  })

  it("re-opening an app focuses (and restores) its window instead of duplicating it", () => {
    state().open("files", viewport)
    state().minimize("files")
    state().open("files", viewport)
    expect(state().order).toEqual(["files"])
    expect(state().windows.files!.mode).toBe("normal")
  })

  it("minimized windows lose focus to the next visible one", () => {
    state().open("files", viewport)
    state().open("browser", viewport)
    state().minimize("browser")
    expect(focusedApp(state().windows)).toBe("files")
  })

  it("taskbar click restores, focuses or minimizes depending on state", () => {
    state().open("files", viewport)
    state().open("browser", viewport)
    state().activate("files", viewport) // behind → front
    expect(focusedApp(state().windows)).toBe("files")
    state().activate("files", viewport) // in front → minimized
    expect(state().windows.files!.mode).toBe("minimized")
    state().activate("files", viewport) // minimized → restored and in front
    expect(state().windows.files!.mode).toBe("normal")
    expect(focusedApp(state().windows)).toBe("files")
  })

  it("a maximized window comes back maximized after being minimized", () => {
    state().open("files", viewport)
    state().toggleMaximize("files")
    state().minimize("files")
    state().activate("files", viewport)
    expect(state().windows.files!.mode).toBe("maximized")
  })

  it("maximized windows ignore drag and resize", () => {
    state().open("files", viewport)
    const { x, w } = state().windows.files!
    state().toggleMaximize("files")
    state().move("files", 5, 5, viewport)
    state().resize("files", 2000, 2000, viewport)
    expect(state().windows.files!.x).toBe(x)
    expect(state().windows.files!.w).toBe(w)
  })

  it("keeps windows reachable and within minimum size", () => {
    state().open("files", viewport)
    state().move("files", -5000, 9000, viewport)
    const win = state().windows.files!
    expect(win.x + win.w).toBeGreaterThanOrEqual(96)
    expect(win.y).toBeLessThanOrEqual(viewport.height - TASKBAR - 40)
    state().resize("files", 10, 10, viewport)
    expect(state().windows.files!.w).toBe(320)
    expect(state().windows.files!.h).toBe(220)
  })

  it("show desktop minimizes everything; closing removes from the taskbar", () => {
    state().open("files", viewport)
    state().open("about", viewport)
    state().minimizeAll()
    expect(focusedApp(state().windows)).toBeNull()
    state().close("files")
    expect(state().order).toEqual(["about"])
  })

  it("apps that need room have a larger minimum size, and cannot be squeezed below it", () => {
    for (const id of ["code", "messenger", "music"] as const) {
      state().open(id, viewport)
      state().resize(id, 10, 10, viewport)
      const min = minSizeOf(id)
      expect(state().windows[id]!.w).toBe(min.w)
      expect(state().windows[id]!.h).toBe(min.h)
      expect(min.h).toBeGreaterThan(220)
    }
    expect(minSizeOf("files")).toEqual({ w: 320, h: 220 })
  })

  it("opens small viewports with every app at least at its minimum size", () => {
    state().open("code", { width: 900, height: 500 })
    const win = state().windows.code!
    expect(win.w).toBeGreaterThanOrEqual(minSizeOf("code").w)
    expect(win.h).toBeGreaterThanOrEqual(minSizeOf("code").h)
  })

  it("brings every window back inside the screen when the browser window shrinks", () => {
    state().open("files", viewport)
    state().open("code", viewport)
    state().move("files", 900, 500, viewport)
    const small = { width: 800, height: 520 }
    state().clampAll(small)
    for (const win of Object.values(state().windows)) {
      expect(win!.x).toBeGreaterThanOrEqual(0)
      expect(win!.y).toBeGreaterThanOrEqual(0)
      expect(win!.x + win!.w).toBeLessThanOrEqual(small.width)
      expect(win!.y + win!.h).toBeLessThanOrEqual(small.height - TASKBAR)
    }
    // maximized windows are left alone
    state().toggleMaximize("files")
    const before = { ...state().windows.files! }
    state().clampAll({ width: 500, height: 400 })
    expect(state().windows.files).toEqual(before)
  })
})

describe("resizing from edges and corners", () => {
  const start = { x: 200, y: 100, w: 600, h: 400 }
  const min = { w: 320, h: 220 }
  const vp = { width: 1280, height: 800 }

  it("east and south edges grow or shrink the window and keep the opposite corner", () => {
    expect(resizeRect(start, "e", 100, 0, vp, min)).toEqual({ x: 200, y: 100, w: 700, h: 400 })
    expect(resizeRect(start, "s", 0, -50, vp, min)).toEqual({ x: 200, y: 100, w: 600, h: 350 })
  })

  it("west and north edges move the window with them while the far edge stays put", () => {
    const west = resizeRect(start, "w", -80, 0, vp, min)
    expect(west).toEqual({ x: 120, y: 100, w: 680, h: 400 })
    expect(west.x + west.w).toBe(start.x + start.w)
    const north = resizeRect(start, "n", 0, 40, vp, min)
    expect(north.y + north.h).toBe(start.y + start.h)
    expect(north.h).toBe(360)
  })

  it("corners combine both edges", () => {
    expect(resizeRect(start, "nw", 50, 30, vp, min)).toEqual({ x: 250, y: 130, w: 550, h: 370 })
    expect(resizeRect(start, "se", 10, 10, vp, min)).toEqual({ x: 200, y: 100, w: 610, h: 410 })
  })

  it("never goes below the minimum, and the edge that is not being dragged does not move", () => {
    const r = resizeRect(start, "w", 5000, 0, vp, min)
    expect(r.w).toBe(min.w)
    expect(r.x + r.w).toBe(start.x + start.w)
    const t = resizeRect(start, "n", 0, 5000, vp, min)
    expect(t.h).toBe(min.h)
    expect(t.y + t.h).toBe(start.y + start.h)
  })

  it("never leaves the screen or goes under the taskbar", () => {
    expect(resizeRect(start, "w", -5000, 0, vp, min).x).toBe(0)
    expect(resizeRect(start, "n", 0, -5000, vp, min).y).toBe(0)
    expect(resizeRect(start, "e", 5000, 0, vp, min).x + resizeRect(start, "e", 5000, 0, vp, min).w).toBe(vp.width)
    const s = resizeRect(start, "s", 0, 5000, vp, min)
    expect(s.y + s.h).toBe(vp.height - TASKBAR)
  })

  it("the store resizes a window from an edge and ignores maximized windows", () => {
    state().open("files", vp)
    const win = state().windows.files!
    const startRect = { x: win.x, y: win.y, w: win.w, h: win.h }
    state().resizeFrom("files", "w", startRect, -50, 0, vp)
    expect(state().windows.files!.w).toBe(win.w + 50)
    expect(state().windows.files!.x + state().windows.files!.w).toBe(win.x + win.w)
    state().toggleMaximize("files")
    const before = { ...state().windows.files! }
    state().resizeFrom("files", "se", startRect, 100, 100, vp)
    expect(state().windows.files).toEqual(before)
  })
})