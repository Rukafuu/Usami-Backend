import { APP_IDS, APPS, type AppId, type Slot } from "./registry"

/** Only the visitor's changes are stored; everything else comes from the registry defaults. */
export type Placement = Partial<Record<AppId, Partial<Record<Slot, boolean>>>>

/**
 * Where an app is pinned when the visitor has not changed anything:
 * the registry decides for the desktop and the dock, every app is on the phone home screen,
 * and the PC taskbar starts empty (running apps appear there anyway).
 */
export const defaultPlaced = (id: AppId, slot: Slot): boolean => {
  switch (slot) {
    case "desktop":
      return APPS[id].onDesktop
    case "dock":
      return APPS[id].inDock
    case "home":
      return true
    case "taskbar":
      return false
  }
}

/** Slots an app cannot be removed from. */
export const isLocked = (id: AppId, slot: Slot) => APPS[id].locked?.includes(slot) ?? false

export const isPlaced = (placement: Placement, id: AppId, slot: Slot): boolean =>
  isLocked(id, slot) ? true : (placement[id]?.[slot] ?? defaultPlaced(id, slot))

/** Apps pinned to a slot, in registry order. */
export const placedApps = (placement: Placement, slot: Slot, uninstalled: readonly AppId[] = []): AppId[] =>
  APP_IDS.filter((id) => !uninstalled.includes(id) && isPlaced(placement, id, slot))

export const canUninstall = (id: AppId) => !APPS[id].essential

/** Parses the stored list of uninstalled apps: known, removable, unique. */
export const parseUninstalled = (raw: string | null): AppId[] => {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return APP_IDS.filter((id) => canUninstall(id) && parsed.includes(id))
  } catch {
    return []
  }
}

/** Returns a new placement with one change; a value equal to the default is dropped, so "reset" is just an empty object. */
export const withPlacement = (placement: Placement, id: AppId, slot: Slot, value: boolean): Placement => {
  if (isLocked(id, slot)) return placement
  const { [id]: current = {}, ...others } = placement
  const { [slot]: _old, ...rest } = current
  const next = value === defaultPlaced(id, slot) ? rest : { ...rest, [slot]: value }
  return Object.keys(next).length ? { ...others, [id]: next } : others
}

/** Parses what was stored, keeping only known apps and slots with real booleans. */
export const parsePlacement = (raw: string | null): Placement => {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return {}
    let result: Placement = {}
    for (const id of APP_IDS) {
      const entry = (parsed as Record<string, unknown>)[id]
      if (typeof entry !== "object" || entry === null) continue
      for (const slot of ["desktop", "taskbar", "home", "dock"] as Slot[]) {
        const value = (entry as Record<string, unknown>)[slot]
        if (typeof value === "boolean") result = withPlacement(result, id, slot, value)
      }
    }
    return result
  } catch {
    return {}
  }
}
