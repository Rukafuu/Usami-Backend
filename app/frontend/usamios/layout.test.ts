import { describe, expect, it } from "vitest"
import {
  addToGroup, appKey, applyDrop, assignCells, buildItems, createGroup, deleteGroup, EMPTY_ARRANGEMENT, groupKey, groupOf, isEmptyLayouts,
  moveItem, moveItemTo, moveToCell, parseLayouts, removeFromGroup, renameGroup, type Arrangement,
} from "./layout"
import { canUninstall, parseUninstalled, placedApps } from "./placement"
import type { AppId } from "./registry"

const placed: AppId[] = ["browser", "files", "gallery", "terminal"]
const keys = (arr: Arrangement, apps: AppId[] = placed) => buildItems(apps, arr).map((i) => i.key)

describe("order", () => {
  it("starts in registry order", () => {
    expect(keys(EMPTY_ARRANGEMENT)).toEqual(placed.map(appKey))
  })

  it("moves an item earlier or later, and stops at the edges", () => {
    let arr = moveItem(EMPTY_ARRANGEMENT, placed, appKey("terminal"), -1)
    expect(keys(arr)).toEqual(["app:browser", "app:files", "app:terminal", "app:gallery"])
    arr = moveItem(arr, placed, appKey("terminal"), 1)
    expect(keys(arr)).toEqual(placed.map(appKey))
    expect(moveItem(EMPTY_ARRANGEMENT, placed, appKey("browser"), -1)).toBe(EMPTY_ARRANGEMENT)
    expect(moveItem(EMPTY_ARRANGEMENT, placed, appKey("terminal"), 1)).toBe(EMPTY_ARRANGEMENT)
  })

  it("drag and drop puts an item where another one is", () => {
    const arr = moveItemTo(EMPTY_ARRANGEMENT, placed, appKey("terminal"), appKey("files"))
    expect(keys(arr)).toEqual(["app:browser", "app:terminal", "app:files", "app:gallery"])
    expect(moveItemTo(arr, placed, appKey("files"), appKey("files"))).toBe(arr)
  })

  it("keeps the visitor's order when apps appear or disappear from the grid", () => {
    const arr = moveItemTo(EMPTY_ARRANGEMENT, placed, appKey("terminal"), appKey("browser"))
    expect(keys(arr, ["files", "terminal"])).toEqual(["app:terminal", "app:files"])
    // an app that shows up later goes after the ones the visitor already ordered
    expect(keys(arr, ["code", ...placed])).toEqual(["app:terminal", "app:browser", "app:files", "app:gallery", "app:code"])
  })
})

describe("groups", () => {
  it("creates a group that replaces its apps on the grid", () => {
    const { arrangement, id } = createGroup(EMPTY_ARRANGEMENT, "Meus favoritos", ["files", "gallery"], placed)
    const items = buildItems(placed, arrangement)
    // the group takes the spot of its first app (files)
    expect(items.map((i) => i.key)).toEqual(["app:browser", groupKey(id), "app:terminal"])
    const group = items.find((i) => i.kind === "group")
    expect(group && group.kind === "group" && group.apps).toEqual(["files", "gallery"])
    expect(groupOf(arrangement, "files")?.name).toBe("Meus favoritos")
  })

  it("an app lives in one group at a time, and a group left with one app disappears", () => {
    const first = createGroup(EMPTY_ARRANGEMENT, "A", ["files", "gallery"], placed)
    const second = createGroup(first.arrangement, "B", ["browser", "terminal"], placed)
    const moved = addToGroup(second.arrangement, second.id, "files") // leaves A with a single app: A dissolves
    expect(groupOf(moved, "files")?.id).toBe(second.id)
    expect(moved.groups.some((g) => g.id === first.id)).toBe(false)
  })

  it("renames (trimmed and capped) and deletes a group, freeing its apps", () => {
    const { arrangement, id } = createGroup(EMPTY_ARRANGEMENT, "x", ["files", "gallery"], placed)
    const renamed = renameGroup(arrangement, id, `  ${"y".repeat(80)}  `)
    expect(renamed.groups[0]!.name).toHaveLength(40)
    const gone = deleteGroup(renamed, id)
    expect(gone.groups).toEqual([])
    expect(keys(gone)).toEqual(expect.arrayContaining(placed.map(appKey)))
    expect(keys(gone)).toHaveLength(placed.length)
  })
  it("hides a group none of whose apps are placed here, but keeps its members", () => {
    const { arrangement } = createGroup(EMPTY_ARRANGEMENT, "G", ["files"])
    expect(keys(arrangement, ["browser"])).toEqual(["app:browser"])
    expect(keys(arrangement, ["browser", "files"])).toHaveLength(2)
  })
})

describe("stored layouts", () => {
  it("round-trip and survive garbage", () => {
    const { arrangement } = createGroup(EMPTY_ARRANGEMENT, "G", ["files", "gallery"])
    const layouts = parseLayouts(JSON.stringify({ desktop: arrangement, home: EMPTY_ARRANGEMENT }))
    expect(layouts.desktop.groups[0]!.apps).toEqual(["files", "gallery"])
    expect(parseLayouts(null)).toEqual({ desktop: EMPTY_ARRANGEMENT, home: EMPTY_ARRANGEMENT })
    expect(isEmptyLayouts(parseLayouts("{{nope"))).toBe(true)
  })

  it("drops unknown apps, duplicates, bad ids and unknown order keys", () => {
    const raw = JSON.stringify({
      desktop: {
        order: ["app:browser", "app:ghost", "group:g9", "app:browser", 7],
        groups: [
          { id: "g1", name: "ok", apps: ["files", "ghost", "files"] },
          { id: "g1", name: "dup id", apps: ["gallery"] },
          { id: "evil", name: "bad id", apps: ["gallery"] },
          { id: "g2", name: "reuses files", apps: ["files"] },
          { id: "g3", name: "empty", apps: [] },
        ],
      },
    })
    const { desktop } = parseLayouts(raw)
    expect(desktop.groups).toEqual([{ id: "g1", name: "ok", apps: ["files"] }])
    expect(desktop.order).toEqual(["app:browser"])
  })
})

describe("uninstalling", () => {
  it("essential apps cannot be uninstalled", () => {
    expect(canUninstall("settings")).toBe(false)
    expect(canUninstall("gallery")).toBe(true)
  })

  it("an uninstalled app is placed nowhere", () => {
    expect(placedApps({}, "desktop", ["gallery"])).not.toContain("gallery")
    expect(placedApps({}, "home", ["gallery"])).not.toContain("gallery")
    expect(placedApps({}, "desktop")).toContain("gallery")
  })

  it("parses the stored list defensively and never accepts essential apps", () => {
    expect(parseUninstalled(null)).toEqual([])
    expect(parseUninstalled("oops")).toEqual([])
    expect(parseUninstalled(JSON.stringify(["gallery", "ghost", "settings", "gallery"]))).toEqual(["gallery"])
  })
})

describe("minimum group size", () => {
  const two = () => createGroup(EMPTY_ARRANGEMENT, "G", ["files", "gallery"], placed).arrangement

  it("taking an app out of a two-app group dissolves it and leaves both apps on the grid", () => {
    const out = removeFromGroup(two(), "gallery")
    expect(out.groups).toEqual([])
    expect(keys(out)).toEqual(expect.arrayContaining(["app:files", "app:gallery"]))
  })

  it("the remaining app takes the place the group had", () => {
    const arr = createGroup(EMPTY_ARRANGEMENT, "G", ["files", "gallery"], placed).arrangement // browser, group, terminal
    const out = removeFromGroup(arr, "gallery")
    expect(keys(out)).toEqual(["app:browser", "app:files", "app:terminal", "app:gallery"])
  })

  it("a group of three survives losing one app", () => {
    let arr = two()
    arr = addToGroup(arr, "g1", "terminal")
    arr = removeFromGroup(arr, "files")
    expect(arr.groups).toEqual([{ id: "g1", name: "G", apps: ["gallery", "terminal"] }])
  })

  it("moving an app between groups dissolves the one it leaves behind", () => {
    const first = createGroup(EMPTY_ARRANGEMENT, "A", ["files", "gallery"], placed)
    const second = createGroup(first.arrangement, "B", ["browser", "terminal"], placed)
    const moved = addToGroup(second.arrangement, second.id, "files")
    expect(moved.groups.map((g) => g.id)).toEqual([second.id])
    expect(keys(moved)).toContain("app:gallery")
  })
})

describe("desktop cells", () => {
  const all = ["app:browser", "app:files", "app:gallery", "app:terminal"]

  it("fills free cells column by column from the top-left", () => {
    const cells = assignCells(all, undefined, 3, 2)
    expect(cells).toEqual({
      "app:browser": { col: 0, row: 0 },
      "app:files": { col: 0, row: 1 },
      "app:gallery": { col: 1, row: 0 },
      "app:terminal": { col: 1, row: 1 },
    })
  })

  it("keeps the cell the visitor chose and flows the others around it", () => {
    const cells = assignCells(all, { "app:files": { col: 2, row: 1 } }, 3, 2)
    expect(cells["app:files"]).toEqual({ col: 2, row: 1 })
    expect(cells["app:browser"]).toEqual({ col: 0, row: 0 })
    expect(new Set(Object.values(cells).map((c) => `${c.col},${c.row}`)).size).toBe(4)
  })

  it("ignores cells that no longer fit or are already taken, and never loses an item", () => {
    const cells = assignCells(all, { "app:browser": { col: 9, row: 9 }, "app:files": { col: 0, row: 0 }, "app:gallery": { col: 0, row: 0 } }, 2, 2)
    expect(Object.keys(cells)).toHaveLength(4)
    expect(new Set(Object.values(cells).map((c) => `${c.col},${c.row}`)).size).toBe(4)
  })

  it("grows extra columns when the screen is too small", () => {
    const cells = assignCells(all, undefined, 1, 2)
    expect(Math.max(...Object.values(cells).map((c) => c.col))).toBe(1)
  })
})

describe("drag and drop rules", () => {
  const ctx = (surface: "desktop" | "home" = "desktop") => ({ surface, placed, resolved: assignCells(placed.map(appKey), undefined, 6, 4) })

  it("dropping an app on the middle of another makes a group at the target's place", () => {
    const arr = applyDrop(EMPTY_ARRANGEMENT, ctx(), appKey("gallery"), { kind: "item", key: appKey("files"), zone: "center" })
    expect(arr.groups).toEqual([{ id: "g1", name: "", apps: ["files", "gallery"] }])
    expect(keys(arr)).toEqual(["app:browser", "group:g1", "app:terminal"])
  })

  it("the group inherits the target's cell on the desktop", () => {
    const start = moveToCell(EMPTY_ARRANGEMENT, appKey("files"), { col: 3, row: 2 })
    const arr = applyDrop(start, { surface: "desktop", placed, resolved: assignCells(placed.map(appKey), start.cells, 6, 4) }, appKey("gallery"), { kind: "item", key: appKey("files"), zone: "center" })
    expect(arr.cells).toEqual({ "group:g1": { col: 3, row: 2 } })
  })

  it("dropping on a group adds the app to it", () => {
    const grouped = applyDrop(EMPTY_ARRANGEMENT, ctx(), appKey("gallery"), { kind: "item", key: appKey("files"), zone: "center" })
    const arr = applyDrop(grouped, ctx(), appKey("terminal"), { kind: "item", key: "group:g1", zone: "center" })
    expect(arr.groups[0]!.apps).toEqual(["files", "gallery", "terminal"])
  })

  it("dragging an app out of a two-app group onto an empty cell undoes the group", () => {
    const grouped = applyDrop(EMPTY_ARRANGEMENT, ctx(), appKey("gallery"), { kind: "item", key: appKey("files"), zone: "center" })
    const arr = applyDrop(grouped, ctx(), appKey("gallery"), { kind: "cell", cell: { col: 5, row: 3 } })
    expect(arr.groups).toEqual([])
    expect(arr.cells?.["app:gallery"]).toEqual({ col: 5, row: 3 })
    expect(keys(arr)).toEqual(expect.arrayContaining(["app:files", "app:gallery"]))
  })

  it("dragging an app out of a three-app group keeps the group of the other two", () => {
    let arr = applyDrop(EMPTY_ARRANGEMENT, ctx(), appKey("gallery"), { kind: "item", key: appKey("files"), zone: "center" })
    arr = applyDrop(arr, ctx(), appKey("terminal"), { kind: "item", key: "group:g1", zone: "center" })
    arr = applyDrop(arr, ctx(), appKey("terminal"), { kind: "cell", cell: { col: 4, row: 0 } })
    expect(arr.groups[0]!.apps).toEqual(["files", "gallery"])
  })

  it("an app dragged out of a group can be dropped on another app to join that one instead", () => {
    let arr = applyDrop(EMPTY_ARRANGEMENT, ctx(), appKey("gallery"), { kind: "item", key: appKey("files"), zone: "center" })
    arr = applyDrop(arr, ctx(), appKey("gallery"), { kind: "item", key: appKey("terminal"), zone: "center" })
    expect(arr.groups.map((g) => g.apps)).toEqual([["terminal", "gallery"]])
  })

  it("dropping on an empty desktop cell moves the icon there", () => {
    const arr = applyDrop(EMPTY_ARRANGEMENT, ctx(), appKey("terminal"), { kind: "cell", cell: { col: 5, row: 1 } })
    expect(arr.cells).toEqual({ "app:terminal": { col: 5, row: 1 } })
  })

  it("dropping on the edge of another desktop icon swaps their places", () => {
    const c = ctx()
    const arr = applyDrop(EMPTY_ARRANGEMENT, c, appKey("terminal"), { kind: "item", key: appKey("files"), zone: "before" })
    expect(arr.cells?.["app:terminal"]).toEqual(c.resolved["app:files"])
    expect(arr.cells?.["app:files"]).toEqual(c.resolved["app:terminal"])
  })

  it("on the phone the edges reorder and an empty drop sends the app to the end", () => {
    const home = ctx("home")
    const before = applyDrop(EMPTY_ARRANGEMENT, home, appKey("terminal"), { kind: "item", key: appKey("files"), zone: "before" })
    expect(keys(before)).toEqual(["app:browser", "app:terminal", "app:files", "app:gallery"])
    const end = applyDrop(EMPTY_ARRANGEMENT, home, appKey("browser"), { kind: "cell" })
    expect(keys(end)).toEqual(["app:files", "app:gallery", "app:terminal", "app:browser"])
  })

  it("does nothing when dropped on itself or on nothing", () => {
    expect(applyDrop(EMPTY_ARRANGEMENT, ctx(), appKey("files"), { kind: "item", key: appKey("files"), zone: "center" })).toBe(EMPTY_ARRANGEMENT)
    expect(applyDrop(EMPTY_ARRANGEMENT, ctx(), appKey("files"), { kind: "none" })).toBe(EMPTY_ARRANGEMENT)
  })

  it("moving groups themselves never nests them", () => {
    const grouped = applyDrop(EMPTY_ARRANGEMENT, ctx(), appKey("gallery"), { kind: "item", key: appKey("files"), zone: "center" })
    const arr = applyDrop(grouped, ctx(), "group:g1", { kind: "cell", cell: { col: 2, row: 2 } })
    expect(arr.groups).toHaveLength(1)
    expect(arr.cells?.["group:g1"]).toEqual({ col: 2, row: 2 })
  })

  it("stored cells survive a round trip and garbage cells are dropped", () => {
    const arr = moveToCell(EMPTY_ARRANGEMENT, appKey("files"), { col: 3, row: 2 })
    expect(parseLayouts(JSON.stringify({ desktop: arr })).desktop.cells).toEqual({ "app:files": { col: 3, row: 2 } })
    const bad = JSON.stringify({ desktop: { cells: { "app:files": { col: -1, row: 2 }, "app:ghost": { col: 1, row: 1 }, "app:gallery": { col: "x", row: 1 } } } })
    expect(parseLayouts(bad).desktop.cells).toBeUndefined()
  })
})