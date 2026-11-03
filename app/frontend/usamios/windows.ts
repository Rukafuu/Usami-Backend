import { create } from "zustand"
import { APPS, type AppId } from "./registry"
import { useShell } from "./shell"

export type WinMode = "normal" | "minimized" | "maximized"
export type Rect = { x: number; y: number; w: number; h: number }
export type Win = Rect & { z: number; mode: WinMode; /** mode to return to when un-minimized */ restoreTo: "normal" | "maximized" }
export type Viewport = { width: number; height: number }

export const TASKBAR = 48
const MARGIN = 12
const MIN = { w: 320, h: 220 }
const CASCADE = 28

export type WindowsState = {
  windows: Partial<Record<AppId, Win>>
  /** Taskbar order: apps in the order they were opened. */
  order: AppId[]
  topZ: number
  open: (id: AppId, viewport: Viewport) => void
  close: (id: AppId) => void
  focus: (id: AppId) => void
  minimize: (id: AppId) => void
  toggleMaximize: (id: AppId) => void
  /** Taskbar click: restore if minimized, minimize if already in front, otherwise bring to front. */
  activate: (id: AppId, viewport: Viewport) => void
  minimizeAll: () => void
  move: (id: AppId, x: number, y: number, viewport: Viewport) => void
  resize: (id: AppId, w: number, h: number, viewport: Viewport) => void
}

/** The window the visitor is working in: highest z among the visible ones. */
export const focusedApp = (windows: WindowsState["windows"]): AppId | null => {
  let best: [AppId, number] | null = null
  for (const [id, win] of Object.entries(windows) as [AppId, Win][]) {
    if (win.mode !== "minimized" && (!best || win.z > best[1])) best = [id, win.z]
  }
  return best ? best[0] : null
}

const initialRect = (id: AppId, openCount: number, viewport: Viewport): Rect => {
  const size = APPS[id].size
  const w = Math.max(MIN.w, Math.min(size.w, viewport.width - MARGIN * 2))
  const h = Math.max(MIN.h, Math.min(size.h, viewport.height - TASKBAR - MARGIN * 2))
  const offset = (openCount % 6) * CASCADE
  const x = Math.max(MARGIN, Math.min(Math.round((viewport.width - w) / 2) - 60 + offset, viewport.width - w - MARGIN))
  const y = Math.max(MARGIN, Math.min(Math.round((viewport.height - TASKBAR - h) / 2) - 40 + offset, viewport.height - TASKBAR - h))
  return { x, y, w, h }
}

export const useWindows = create<WindowsState>()((set, get) => {
  const update = (id: AppId, patch: (win: Win, topZ: number) => Partial<Win> | null, raise = false) =>
    set((s) => {
      const win = s.windows[id]
      if (!win) return s
      const changes = patch(win, s.topZ)
      if (!changes) return s
      const z = raise ? s.topZ + 1 : win.z
      return { windows: { ...s.windows, [id]: { ...win, ...changes, z } }, topZ: raise ? z : s.topZ }
    })

  return {
    windows: {},
    order: [],
    topZ: 10,

    open: (id, viewport) => {
      // An uninstalled app does not exist as far as the system is concerned (terminal commands, links, menus).
      if (useShell.getState().uninstalled.includes(id)) return
      const existing = get().windows[id]
      if (existing) {
        update(id, (win) => ({ mode: win.mode === "minimized" ? win.restoreTo : win.mode }), true)
        return
      }
      set((s) => {
        const z = s.topZ + 1
        const win: Win = { ...initialRect(id, s.order.length, viewport), z, mode: "normal", restoreTo: "normal" }
        return { windows: { ...s.windows, [id]: win }, order: [...s.order, id], topZ: z }
      })
    },

    close: (id) =>
      set((s) => {
        const { [id]: _closed, ...rest } = s.windows
        return { windows: rest, order: s.order.filter((o) => o !== id) }
      }),

    focus: (id) => update(id, (win, topZ) => (win.z === topZ && win.mode !== "minimized" ? null : {}), true),

    minimize: (id) =>
      update(id, (win) => (win.mode === "minimized" ? null : { mode: "minimized", restoreTo: win.mode === "maximized" ? "maximized" : "normal" })),

    toggleMaximize: (id) => update(id, (win) => ({ mode: win.mode === "maximized" ? "normal" : "maximized" }), true),

    activate: (id, viewport) => {
      const win = get().windows[id]
      if (!win) return get().open(id, viewport)
      if (win.mode === "minimized") return update(id, (w) => ({ mode: w.restoreTo }), true)
      if (focusedApp(get().windows) === id) return get().minimize(id)
      get().focus(id)
    },

    minimizeAll: () =>
      set((s) => {
        const windows = { ...s.windows }
        for (const [id, win] of Object.entries(windows) as [AppId, Win][]) {
          if (win.mode !== "minimized") windows[id] = { ...win, mode: "minimized", restoreTo: win.mode === "maximized" ? "maximized" : "normal" }
        }
        return { windows }
      }),

    // Keep a grabbable part of the title bar on screen and above the taskbar.
    move: (id, x, y, viewport) =>
      update(id, (win) =>
        win.mode !== "normal"
          ? null
          : {
              x: Math.min(Math.max(x, 96 - win.w), viewport.width - 96),
              y: Math.min(Math.max(y, 0), viewport.height - TASKBAR - 40),
            },
      ),

    resize: (id, w, h, viewport) =>
      update(id, (win) =>
        win.mode !== "normal"
          ? null
          : {
              // Never larger than the room left on screen, never smaller than the minimum (the minimum wins).
              w: Math.max(MIN.w, Math.min(w, viewport.width - win.x)),
              h: Math.max(MIN.h, Math.min(h, viewport.height - TASKBAR - win.y)),
            },
      ),
  }
})
