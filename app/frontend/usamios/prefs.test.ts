import { beforeEach, describe, expect, it } from "vitest"
import { applyPrefs, DEFAULT_PREFS, loadPrefs, useShell } from "./shell"

const root = () => document.documentElement

beforeEach(() => {
  useShell.getState().resetPrefs()
  for (const attr of Object.keys(root().dataset)) delete root().dataset[attr]
})

describe("preferences", () => {
  it("start from safe defaults", () => {
    expect(loadPrefs()).toEqual(DEFAULT_PREFS)
  })

  it("persist per browser and survive a reload", () => {
    const { setPref } = useShell.getState()
    setPref("vision", "redgreen")
    setPref("accent", "rose")
    setPref("textSize", "large")
    setPref("glass", false)
    expect(loadPrefs()).toMatchObject({ vision: "redgreen", accent: "rose", textSize: "large", glass: false })
  })

  it("ignore garbage in storage", () => {
    window.localStorage.setItem("usamios:vision", "sepia")
    window.localStorage.setItem("usamios:textSize", "99")
    window.localStorage.setItem("usamios:glass", "maybe")
    expect(loadPrefs()).toEqual(DEFAULT_PREFS)
  })

  it("restoring defaults clears everything", () => {
    const { setPref, resetPrefs } = useShell.getState()
    setPref("accent", "sage")
    resetPrefs()
    expect(loadPrefs()).toEqual(DEFAULT_PREFS)
    expect(useShell.getState().accent).toBe("caramel")
  })
})

describe("applying preferences to the page", () => {
  it("writes only what differs from the defaults", () => {
    applyPrefs(DEFAULT_PREFS)
    expect(root().dataset.vision).toBeUndefined()
    expect(root().dataset.accent).toBeUndefined()
    expect(root().dataset.text).toBeUndefined()
    expect(root().dataset.glass).toBeUndefined()
    expect(root().dataset.theme).toBeUndefined()
  })

  it("maps each setting to its data attribute", () => {
    applyPrefs({ ...DEFAULT_PREFS, theme: "light", vision: "blueyellow", accent: "slate", textSize: "xl", iconSize: "large", motion: "reduce", glass: false })
    expect(root().dataset).toMatchObject({ theme: "light", vision: "blueyellow", accent: "slate", text: "xl", icons: "large", motion: "reduce", glass: "off" })
  })

  it("the system wallpaper is the Fuwarch illustration", () => {
    expect(DEFAULT_PREFS.wallpaper).toBe("fuwarch")
    applyPrefs(DEFAULT_PREFS)
    expect(root().dataset.wallpaper).toBe("fuwarch")
  })

  it("the automatic wallpaper follows the theme", () => {
    applyPrefs({ ...DEFAULT_PREFS, wallpaper: "auto", theme: "dark" })
    expect(root().dataset.wallpaper).toBe("coffee")
    applyPrefs({ ...DEFAULT_PREFS, wallpaper: "auto", theme: "light" })
    expect(root().dataset.wallpaper).toBe("cream")
    applyPrefs({ ...DEFAULT_PREFS, theme: "light", wallpaper: "caramel" })
    expect(root().dataset.wallpaper).toBe("caramel")
  })

  it("high contrast pins a theme so its palette knows light from dark", () => {
    applyPrefs({ ...DEFAULT_PREFS, vision: "contrast" })
    expect(["light", "dark"]).toContain(root().dataset.theme)
  })
})
