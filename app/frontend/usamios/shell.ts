import { create } from "zustand"
import { useAchievements } from "./achievements"
import { EMPTY_LAYOUTS, isEmptyLayouts, parseLayouts, type Arrangement, type Layouts, type Surface } from "./layout"
import { canUninstall, parsePlacement, parseUninstalled, withPlacement, type Placement } from "./placement"
import type { AppId, Slot } from "./registry"

export type Theme = "light" | "dark"
export type Mode = "os" | "classic"
export type Wallpaper = "fuwarch" | "chess" | "cafe" | "melody" | "stargaze" | "auto" | "coffee" | "cream" | "caramel"
export type Vision = "none" | "redgreen" | "blueyellow" | "contrast"
export type Accent = "caramel" | "rose" | "sage" | "slate"
export type TextSize = "small" | "default" | "large" | "xl"
export type IconSize = "small" | "default" | "large"
export type MotionPref = "system" | "reduce"
export type CursorStyle = "paw" | "system"
export type FilesTarget = { folder: string; id: string } | null
export type SettingsCategory = "appearance" | "wallpaper" | "apps" | "layout" | "display" | "language" | "system"

/** Illustrated wallpapers (files in public/wallpapers). The first is the system default. */
/** `src` is the landscape version (desktop and tablets); `portrait`, when present, is used on tall screens such as phones. */
export const WALLPAPER_IMAGES: Partial<Record<Wallpaper, { src: string; thumb: string; portrait?: string }>> = {
  fuwarch: { src: "/wallpapers/fuwarch-hug-landscape.jpg", thumb: "/wallpapers/fuwarch-hug-landscape-thumb.jpg", portrait: "/wallpapers/fuwarch-hug.jpg" },
  chess: { src: "/wallpapers/chess-night.jpg", thumb: "/wallpapers/chess-night-thumb.jpg", portrait: "/wallpapers/chess-night-portrait.jpg" },
  cafe: { src: "/wallpapers/cafe-night-landscape.jpg", thumb: "/wallpapers/cafe-night-landscape-thumb.jpg", portrait: "/wallpapers/cafe-night-portrait.jpg" },
  melody: { src: "/wallpapers/melody-studio-landscape.jpg", thumb: "/wallpapers/melody-studio-landscape-thumb.jpg", portrait: "/wallpapers/melody-studio-portrait.jpg" },
  stargaze: { src: "/wallpapers/starlit-window-landscape.jpg", thumb: "/wallpapers/starlit-window-landscape-thumb.jpg", portrait: "/wallpapers/starlit-window-portrait.jpg" },
}
export const WALLPAPERS: Wallpaper[] = ["fuwarch", "chess", "cafe", "melody", "stargaze", "auto", "coffee", "cream", "caramel"]
export const VISIONS: Vision[] = ["none", "redgreen", "blueyellow", "contrast"]
export const ACCENTS: Accent[] = ["caramel", "rose", "sage", "slate"]
export const TEXT_SIZES: TextSize[] = ["small", "default", "large", "xl"]
export const ICON_SIZES: IconSize[] = ["small", "default", "large"]

/** Everything the visitor can personalise. Persisted per browser; every field has a safe default. */
export type Prefs = {
  /** null = follow the operating system */
  theme: Theme | null
  wallpaper: Wallpaper
  vision: Vision
  accent: Accent
  textSize: TextSize
  iconSize: IconSize
  motion: MotionPref
  glass: boolean
  cursor: CursorStyle
  /** Show the pixel critter that walks along the taskbar. */
  pet: boolean
}

export const DEFAULT_PREFS: Prefs = {
  theme: null, wallpaper: "fuwarch", vision: "none", accent: "caramel",
  textSize: "default", iconSize: "default", motion: "system", glass: true, cursor: "paw", pet: true,
}

const MODE_KEY = "usamios:mode"
const BOOTED_KEY = "usamios:booted"
const PLACEMENT_KEY = "usamios:placement"
const LAYOUTS_KEY = "usamios:layouts"
const UNINSTALLED_KEY = "usamios:uninstalled"
const PREF_KEY = (name: keyof Prefs) => `usamios:${name}`

const VALID: { [K in keyof Prefs]: (value: string) => Prefs[K] | undefined } = {
  theme: (v) => (v === "light" || v === "dark" ? v : undefined),
  wallpaper: (v) => WALLPAPERS.find((w) => w === v),
  vision: (v) => VISIONS.find((x) => x === v),
  accent: (v) => ACCENTS.find((x) => x === v),
  textSize: (v) => TEXT_SIZES.find((x) => x === v),
  iconSize: (v) => ICON_SIZES.find((x) => x === v),
  motion: (v) => (v === "system" || v === "reduce" ? v : undefined),
  glass: (v) => (v === "on" ? true : v === "off" ? false : undefined),
  cursor: (v) => (v === "paw" || v === "system" ? v : undefined),
  pet: (v) => (v === "on" ? true : v === "off" ? false : undefined),
}

// Storage can be missing or throw (private windows, blocked cookies): never depend on it.
const read = (area: "local" | "session", key: string): string | null => {
  try {
    return (area === "local" ? window.localStorage : window.sessionStorage).getItem(key)
  } catch {
    return null
  }
}
const write = (area: "local" | "session", key: string, value: string | null) => {
  try {
    const store = area === "local" ? window.localStorage : window.sessionStorage
    if (value === null) store.removeItem(key)
    else store.setItem(key, value)
  } catch {
    /* ignore */
  }
}

const serialise = (value: Prefs[keyof Prefs]): string | null =>
  typeof value === "boolean" ? (value ? "on" : "off") : value

export const loadPrefs = (): Prefs => {
  const prefs: Prefs = { ...DEFAULT_PREFS }
  ;(Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]).forEach((name) => {
    const stored = read("local", PREF_KEY(name))
    const parsed = stored === null ? undefined : (VALID[name] as (v: string) => Prefs[typeof name] | undefined)(stored)
    if (parsed !== undefined) (prefs[name] as Prefs[typeof name]) = parsed
  })
  return prefs
}

export const systemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"

export const prefersReducedMotion = () =>
  document.documentElement.dataset.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches

export const hasBooted = () => read("session", BOOTED_KEY) === "1"
export const markBooted = () => write("session", BOOTED_KEY, "1")

const initialMode = (): Mode => {
  if (new URLSearchParams(window.location.search).has("classic")) return "classic"
  return read("local", MODE_KEY) === "classic" ? "classic" : "os"
}

export type ShellState = Prefs & {
  mode: Mode
  filesTarget: FilesTarget
  codeTarget: string | null
  settingsCategory: SettingsCategory | null
  /** The visitor's pinning choices (see placement.ts). */
  placement: Placement
  /** Order and groups of the icons on the desktop and on the phone home screen. */
  layouts: Layouts
  /** Apps the visitor uninstalled (they can be reinstalled from Settings). */
  uninstalled: AppId[]
  /** The app waiting for the "are you sure?" answer. */
  uninstallTarget: AppId | null
  celebrating: boolean
  setPref: <K extends keyof Prefs>(name: K, value: Prefs[K]) => void
  resetPrefs: () => void
  setMode: (mode: Mode) => void
  showInFiles: (target: NonNullable<FilesTarget>) => void
  showInCode: (id: string) => void
  showSettings: (category: SettingsCategory) => void
  setPlaced: (id: AppId, slot: Slot, value: boolean) => void
  resetPlacement: () => void
  setArrangement: (surface: Surface, change: (current: Arrangement) => Arrangement) => void
  askUninstall: (id: AppId | null) => void
  setUninstalled: (id: AppId, uninstalled: boolean) => void
  celebrate: (on?: boolean) => void
}

export const useShell = create<ShellState>()((set) => ({
  ...loadPrefs(),
  mode: initialMode(),
  filesTarget: null,
  codeTarget: null,
  settingsCategory: null,
  placement: parsePlacement(read("local", PLACEMENT_KEY)),
  layouts: parseLayouts(read("local", LAYOUTS_KEY)),
  uninstalled: parseUninstalled(read("local", UNINSTALLED_KEY)),
  uninstallTarget: null,
  celebrating: false,

  setPref: (name, value) => {
    write("local", PREF_KEY(name), value === null ? null : serialise(value))
    useAchievements.getState().unlock("customizer")
    set({ [name]: value } as Pick<Prefs, typeof name>)
  },

  resetPrefs: () => {
    ;(Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]).forEach((name) => write("local", PREF_KEY(name), null))
    write("local", PLACEMENT_KEY, null)
    write("local", LAYOUTS_KEY, null)
    write("local", UNINSTALLED_KEY, null)
    set({ ...DEFAULT_PREFS, placement: {}, layouts: EMPTY_LAYOUTS, uninstalled: [], uninstallTarget: null })
  },

  setMode: (mode) => {
    write("local", MODE_KEY, mode)
    set({ mode })
  },

  showInFiles: (target) => set({ filesTarget: target }),
  showInCode: (id) => set({ codeTarget: id }),
  showSettings: (category) => set({ settingsCategory: category }),

  setPlaced: (id, slot, value) =>
    set((s) => {
      const placement = withPlacement(s.placement, id, slot, value)
      write("local", PLACEMENT_KEY, Object.keys(placement).length ? JSON.stringify(placement) : null)
      return { placement }
    }),

  // "Restore the default layout": where apps are pinned, their order and groups. Uninstalled apps stay uninstalled.
  resetPlacement: () => {
    write("local", PLACEMENT_KEY, null)
    write("local", LAYOUTS_KEY, null)
    set({ placement: {}, layouts: EMPTY_LAYOUTS })
  },

  setArrangement: (surface, change) =>
    set((s) => {
      const layouts = { ...s.layouts, [surface]: change(s.layouts[surface]) }
      write("local", LAYOUTS_KEY, isEmptyLayouts(layouts) ? null : JSON.stringify(layouts))
      return { layouts }
    }),

  askUninstall: (id) => set({ uninstallTarget: id && canUninstall(id) ? id : null }),

  setUninstalled: (id, uninstalled) =>
    set((s) => {
      if (!canUninstall(id)) return s
      const list = uninstalled ? [...new Set([...s.uninstalled, id])] : s.uninstalled.filter((a) => a !== id)
      write("local", UNINSTALLED_KEY, list.length ? JSON.stringify(list) : null)
      return { uninstalled: list, uninstallTarget: null }
    }),
  celebrate: (on = true) => set({ celebrating: on }),
}))

/**
 * Writes the preferences onto <html> as data attributes (see styles/themes.css).
 * Vision modes need to know whether the page is light or dark, so they pin the theme explicitly.
 */
export function applyPrefs(prefs: Prefs, root: HTMLElement = document.documentElement) {
  const set = (name: string, value: string | null) => (value === null ? delete root.dataset[name] : (root.dataset[name] = value))
  const theme = prefs.theme ?? (prefs.vision === "contrast" ? systemTheme() : null)
  set("theme", theme)
  // "auto" follows the effective theme: coffee at night, cream by day.
  const effective = prefs.theme ?? systemTheme()
  set("wallpaper", prefs.wallpaper === "auto" ? (effective === "light" ? "cream" : "coffee") : prefs.wallpaper)
  set("vision", prefs.vision === "none" ? null : prefs.vision)
  set("accent", prefs.accent === "caramel" ? null : prefs.accent)
  set("text", prefs.textSize === "default" ? null : prefs.textSize)
  set("icons", prefs.iconSize === "default" ? null : prefs.iconSize)
  set("motion", prefs.motion === "reduce" ? "reduce" : null)
  set("glass", prefs.glass ? null : "off")
  set("cursor", prefs.cursor === "paw" ? null : prefs.cursor)
}
