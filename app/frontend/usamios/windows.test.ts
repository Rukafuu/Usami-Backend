import { beforeEach, describe, expect, it } from "vitest"
import { focusedApp, TASKBAR, useWindows } from "./windows"

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
})
