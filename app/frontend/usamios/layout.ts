import { APP_IDS, type AppId } from "./registry"

/**
 * Order and groups of the icons on the two grids: the PC desktop and the phone home screen.
 * Everything here is pure; the shell store only persists the result.
 */
export type Surface = "desktop" | "home"
export type Group = { id: string; name: string; apps: AppId[] }
/** A position on the desktop grid (column and row, from 0). */
export type Cell = { col: number; row: number }
/** `cells` only exists on the desktop: icons can sit on any free cell there. The phone home screen just reflows. */
export type Arrangement = { order: string[]; groups: Group[]; cells?: Record<string, Cell> }
export type Layouts = Record<Surface, Arrangement>

export const EMPTY_ARRANGEMENT: Arrangement = { order: [], groups: [] }
export const EMPTY_LAYOUTS: Layouts = { desktop: EMPTY_ARRANGEMENT, home: EMPTY_ARRANGEMENT }
export const MAX_GROUP_NAME = 40

export type Item =
  | { key: string; kind: "app"; id: AppId }
  | { key: string; kind: "group"; group: Group; apps: AppId[] }

export const appKey = (id: AppId) => `app:${id}`
export const groupKey = (id: string) => `group:${id}`

/** What the grid shows: free apps and groups, in the visitor's order, then anything new in the default order. */
export function buildItems(placed: readonly AppId[], arrangement: Arrangement): Item[] {
  const grouped = new Set(arrangement.groups.flatMap((g) => g.apps))
  const base: Item[] = [
    ...APP_IDS.filter((id) => placed.includes(id) && !grouped.has(id)).map((id): Item => ({ key: appKey(id), kind: "app", id })),
    ...arrangement.groups
      .map((group) => ({ group, apps: APP_IDS.filter((id) => group.apps.includes(id) && placed.includes(id)) }))
      .filter(({ apps }) => apps.length > 0)
      .map(({ group, apps }): Item => ({ key: groupKey(group.id), kind: "group", group, apps })),
  ]
  const byKey = new Map(base.map((item) => [item.key, item]))
  const ordered = arrangement.order.flatMap((key) => (byKey.has(key) ? [byKey.get(key)!] : []))
  const seen = new Set(ordered.map((i) => i.key))
  return [...ordered, ...base.filter((i) => !seen.has(i.key))]
}

const keysOf = (placed: readonly AppId[], arrangement: Arrangement) => buildItems(placed, arrangement).map((i) => i.key)

/** Moves an item one step earlier (-1) or later (+1). */
export function moveItem(arrangement: Arrangement, placed: readonly AppId[], key: string, delta: -1 | 1): Arrangement {
  const keys = keysOf(placed, arrangement)
  const from = keys.indexOf(key)
  const to = from + delta
  if (from < 0 || to < 0 || to >= keys.length) return arrangement
  const next = [...keys]
  next.splice(from, 1)
  next.splice(to, 0, key)
  // On the desktop, the two items that swapped places follow the order again instead of a cell picked earlier.
  const neighbour = keys[to]!
  const { [key]: _a, [neighbour]: _b, ...cells } = arrangement.cells ?? {}
  return { order: next, groups: arrangement.groups, ...(Object.keys(cells).length ? { cells } : {}) }
}

/** Drag and drop: put `key` where `targetKey` is (before it when moving up, after it when moving down). */
export function moveItemTo(arrangement: Arrangement, placed: readonly AppId[], key: string, targetKey: string): Arrangement {
  const keys = keysOf(placed, arrangement)
  const from = keys.indexOf(key)
  const to = keys.indexOf(targetKey)
  if (from < 0 || to < 0 || from === to) return arrangement
  const next = [...keys]
  next.splice(from, 1)
  next.splice(to, 0, key)
  return { ...arrangement, order: next }
}

const withoutApp = (groups: Group[], id: AppId) => groups.map((g) => ({ ...g, apps: g.apps.filter((a) => a !== id) }))
const nextGroupId = (groups: Group[]) => {
  let n = 1
  while (groups.some((g) => g.id === `g${n}`)) n += 1
  return `g${n}`
}
const cleanName = (name: string) => name.trim().slice(0, MAX_GROUP_NAME)

/**
 * A group needs at least two apps. When one leaves and a single app remains (or none), the group dissolves
 * and the remaining app takes the group's place on the grid — exactly what phones do.
 */
export function dissolveSmall(arrangement: Arrangement): Arrangement {
  let { order, groups, cells } = arrangement
  for (const group of groups.filter((g) => g.apps.length < 2)) {
    const only = group.apps[0]
    const gKey = groupKey(group.id)
    order = only ? order.map((k) => (k === gKey ? appKey(only) : k)) : order.filter((k) => k !== gKey)
    if (cells && cells[gKey]) {
      const { [gKey]: cell, ...rest } = cells
      cells = only ? { ...rest, [appKey(only)]: cell! } : rest
    }
  }
  groups = groups.filter((g) => g.apps.length >= 2)
  return { order, groups, ...(cells && Object.keys(cells).length ? { cells } : {}) }
}

/**
 * New group holding the given apps (an app lives in at most one group per surface).
 * It takes the spot of `anchor` (default: the first app), like folders do on a phone.
 */
export function createGroup(
  arrangement: Arrangement,
  name: string,
  apps: AppId[],
  placed?: readonly AppId[],
  anchor: AppId = apps[0]!,
): { arrangement: Arrangement; id: string } {
  const id = nextGroupId(arrangement.groups)
  const emptied = arrangement.groups.map((g) => ({ ...g, apps: g.apps.filter((a) => !apps.includes(a)) }))
  const groups = [...emptied, { id, name: cleanName(name), apps }]
  const members = new Set(apps.map(appKey))
  let order = [...arrangement.order.filter((k) => !members.has(k)), groupKey(id)]
  if (placed) {
    const keys = keysOf(placed, arrangement)
    const at = keys.indexOf(appKey(anchor))
    const rest = keys.filter((k) => !members.has(k))
    const first = at < 0 ? rest.length : keys.slice(0, at).filter((k) => !members.has(k)).length
    order = [...rest.slice(0, first), groupKey(id), ...rest.slice(first)]
  }
  // The group inherits the anchor's cell, so it appears right where the app was dropped on.
  let cells = arrangement.cells ? { ...arrangement.cells } : undefined
  if (cells) {
    const anchored = cells[appKey(anchor)]
    for (const k of members) delete cells[k]
    if (anchored) cells[groupKey(id)] = anchored
  }
  const next = dissolveSmall({ order, groups, ...(cells && Object.keys(cells).length ? { cells } : {}) })
  return { id, arrangement: next }
}

export function renameGroup(arrangement: Arrangement, id: string, name: string): Arrangement {
  return { ...arrangement, groups: arrangement.groups.map((g) => (g.id === id ? { ...g, name: cleanName(name) } : g)) }
}

/** Deleting a group frees its apps back onto the grid. */
export function deleteGroup(arrangement: Arrangement, id: string): Arrangement {
  const key = groupKey(id)
  const { [key]: _gone, ...cells } = arrangement.cells ?? {}
  return {
    order: arrangement.order.filter((k) => k !== key),
    groups: arrangement.groups.filter((g) => g.id !== id),
    ...(Object.keys(cells).length ? { cells } : {}),
  }
}

export function addToGroup(arrangement: Arrangement, id: string, app: AppId): Arrangement {
  if (!arrangement.groups.some((g) => g.id === id)) return arrangement
  const key = appKey(app)
  const groups = withoutApp(arrangement.groups, app).map((g) => (g.id === id ? { ...g, apps: [...g.apps, app] } : g))
  const { [key]: _gone, ...cells } = arrangement.cells ?? {}
  return dissolveSmall({
    order: arrangement.order.filter((k) => k !== key),
    groups,
    ...(Object.keys(cells).length ? { cells } : {}),
  })
}

/** Takes an app out of its group; a group left with fewer than two apps dissolves. */
export function removeFromGroup(arrangement: Arrangement, app: AppId): Arrangement {
  return dissolveSmall({ ...arrangement, groups: withoutApp(arrangement.groups, app) })
}
export const groupOf = (arrangement: Arrangement, app: AppId): Group | undefined => arrangement.groups.find((g) => g.apps.includes(app))

const parseArrangement = (raw: unknown): Arrangement => {
  if (typeof raw !== "object" || raw === null) return EMPTY_ARRANGEMENT
  const { order, groups, cells } = raw as { order?: unknown; groups?: unknown; cells?: unknown }
  const used = new Set<AppId>()
  const seenIds = new Set<string>()
  const cleanGroups: Group[] = []
  if (Array.isArray(groups)) {
    for (const g of groups) {
      if (typeof g !== "object" || g === null) continue
      const { id, name, apps } = g as { id?: unknown; name?: unknown; apps?: unknown }
      if (typeof id !== "string" || !/^g\d+$/.test(id) || seenIds.has(id) || !Array.isArray(apps)) continue
      const members = APP_IDS.filter((a) => apps.includes(a) && !used.has(a))
      if (members.length === 0) continue
      members.forEach((a) => used.add(a))
      seenIds.add(id)
      cleanGroups.push({ id, name: typeof name === "string" ? cleanName(name) : "", apps: members })
    }
  }
  const validKeys = new Set([...APP_IDS.map(appKey), ...cleanGroups.map((g) => groupKey(g.id))])
  const cleanOrder = Array.isArray(order) ? [...new Set(order.filter((k): k is string => typeof k === "string" && validKeys.has(k)))] : []
  const cleanCells: Record<string, Cell> = {}
  if (typeof cells === "object" && cells !== null) {
    for (const [key, value] of Object.entries(cells as Record<string, unknown>)) {
      const { col, row } = (value ?? {}) as { col?: unknown; row?: unknown }
      if (validKeys.has(key) && Number.isInteger(col) && Number.isInteger(row) && (col as number) >= 0 && (row as number) >= 0 && (col as number) < 200 && (row as number) < 200) {
        cleanCells[key] = { col: col as number, row: row as number }
      }
    }
  }
  return { order: cleanOrder, groups: cleanGroups, ...(Object.keys(cleanCells).length ? { cells: cleanCells } : {}) }
}

export function parseLayouts(raw: string | null): Layouts {
  if (!raw) return EMPTY_LAYOUTS
  try {
    const parsed = JSON.parse(raw) as Partial<Record<Surface, unknown>>
    return { desktop: parseArrangement(parsed?.desktop), home: parseArrangement(parsed?.home) }
  } catch {
    return EMPTY_LAYOUTS
  }
}

export const isEmptyLayouts = (l: Layouts) =>
  [l.desktop, l.home].every((a) => a.order.length === 0 && a.groups.length === 0 && Object.keys(a.cells ?? {}).length === 0)

/* ---------- free positions on the desktop grid ---------- */

const cellId = (c: Cell) => `${c.col},${c.row}`

/**
 * Where every item sits: the cell the visitor chose when it is valid and free,
 * otherwise the next free cell, filling column by column from the top-left.
 */
export function assignCells(keys: readonly string[], stored: Record<string, Cell> | undefined, cols: number, rows: number): Record<string, Cell> {
  const result: Record<string, Cell> = {}
  const used = new Set<string>()
  for (const key of keys) {
    const c = stored?.[key]
    if (c && c.col < cols && c.row < rows && !used.has(cellId(c))) {
      result[key] = c
      used.add(cellId(c))
    }
  }
  let col = 0
  let row = 0
  for (const key of keys) {
    if (result[key]) continue
    while (used.has(cellId({ col, row }))) {
      row += 1
      if (row >= Math.max(rows, 1)) {
        row = 0
        col += 1
      }
    }
    result[key] = { col, row }
    used.add(cellId({ col, row }))
  }
  return result
}

export function moveToCell(arrangement: Arrangement, key: string, cell: Cell): Arrangement {
  return { ...arrangement, cells: { ...(arrangement.cells ?? {}), [key]: cell } }
}

/** Swaps the cells of two items (desktop). */
function swapCells(arrangement: Arrangement, a: string, b: string, resolved: Record<string, Cell>): Arrangement {
  const ca = resolved[a]
  const cb = resolved[b]
  if (!ca || !cb) return arrangement
  return { ...arrangement, cells: { ...(arrangement.cells ?? {}), [a]: cb, [b]: ca } }
}

/** What is under the pointer when an icon is dropped. */
export type Hit =
  | { kind: "item"; key: string; zone: "center" | "before" | "after" }
  | { kind: "cell"; cell?: Cell }
  | { kind: "none" }

type DropContext = { surface: Surface; placed: readonly AppId[]; resolved?: Record<string, Cell> }

/**
 * Drag and drop, the way phones do it:
 *  - an app dropped on the middle of another app makes a group of the two;
 *  - an app dropped on a group joins it;
 *  - an app dragged out of a group leaves it (a group left with one app dissolves);
 *  - dropped on an empty cell (desktop) it moves there; at an item's edge it takes that item's place.
 */
export function applyDrop(arrangement: Arrangement, ctx: DropContext, dragKey: string, hit: Hit): Arrangement {
  if (hit.kind === "none" || hit.kind === "item" && hit.key === dragKey) return arrangement
  const dragged = dragKey.startsWith("app:") ? (dragKey.slice(4) as AppId) : null
  const fromGroup = dragged ? groupOf(arrangement, dragged) : undefined

  if (hit.kind === "item") {
    const target = hit.key
    if (hit.zone === "center" && dragged) {
      if (target.startsWith("group:")) return addToGroup(arrangement, target.slice(6), dragged)
      const targetApp = target.slice(4) as AppId
      return createGroup(arrangement, "", [targetApp, dragged], ctx.placed, targetApp).arrangement
    }
    // Edge of an item (or a group being moved): reposition, leaving the old group first when needed.
    let next = dragged && fromGroup ? removeFromGroup(arrangement, dragged) : arrangement
    if (ctx.surface === "desktop" && ctx.resolved) {
      const resolved = { ...ctx.resolved }
      if (fromGroup && !resolved[dragKey]) resolved[dragKey] = resolved[target] ?? { col: 0, row: 0 }
      const targetCell = resolved[target]
      if (!targetCell) return next
      // Free cell for the dragged item: if it was inside a group it has no cell yet, so it simply takes the target's.
      return fromGroup ? moveToCell(next, dragKey, targetCell) : swapCells(next, dragKey, target, resolved)
    }
    next = moveItemTo(next, ctx.placed, dragKey, target)
    return hit.zone === "after" ? moveItem(next, ctx.placed, dragKey, 1) : next
  }

  // Empty space.
  const out = dragged && fromGroup ? removeFromGroup(arrangement, dragged) : arrangement
  if (ctx.surface === "desktop" && hit.cell) return moveToCell(out, dragKey, hit.cell)
  // Phone: back to the grid, at the end.
  const keys = keysOf(ctx.placed, out).filter((k) => k !== dragKey)
  return { ...out, order: [...keys, dragKey] }
}