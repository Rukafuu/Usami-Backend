import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { fill } from "../format"
import { addToGroup, groupOf, removeFromGroup, type Surface } from "../layout"
import { canUninstall, isLocked, isPlaced } from "../placement"
import type { AppId, Slot } from "../registry"
import { useShell } from "../shell"
import type { OsData } from "../types"

/** Where the menu was opened from decides which pinning actions it offers. */
export type MenuContext = "desktop" | "start" | "taskbar" | "home" | "dock"

const SLOTS_FOR: Record<MenuContext, Slot[]> = {
  desktop: ["desktop", "taskbar"],
  start: ["desktop", "taskbar"],
  taskbar: ["taskbar", "desktop"],
  home: ["home", "dock"],
  dock: ["dock", "home"],
}

export type MenuHandlers = ReturnType<ReturnType<typeof useAppMenu>["handlers"]>

export type MenuState = { id: AppId; context: MenuContext; x: number; y: number } | null

type Props = { state: MenuState; data: OsData; titles: Record<AppId, string>; onOpenApp: (id: AppId) => void; onClose: () => void }

/** Context menu for an app: open it, and pin or unpin it from the places that make sense for where you are. */
export function AppMenu({ state, data, titles, onOpenApp, onClose }: Props) {
  const ref = useRef<HTMLUListElement>(null)
  const placement = useShell((s) => s.placement)
  const layouts = useShell((s) => s.layouts)
  const { setPlaced, setArrangement, askUninstall } = useShell.getState()
  const t = data.ui.apps

  useEffect(() => {
    if (!state) return
    ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer, true)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer, true)
    }
  }, [state, onClose])

  if (!state) return null

  // Grid items (desktop icons, phone home) can also be grouped; the taskbar, Start menu and dock cannot.
  const surface: Surface | null = state.context === "desktop" ? "desktop" : state.context === "home" ? "home" : null
  const arrangement = surface ? layouts[surface] : null
  const currentGroup = arrangement ? groupOf(arrangement, state.id) : undefined
  const groupName = (g: { id: string; name: string }) => g.name || `${t.group_default} ${(arrangement?.groups.findIndex((x) => x.id === g.id) ?? 0) + 1}`

  const label = (slot: Slot, placed: boolean) => t[`ctx_${placed ? "remove" : "add"}_${slot}` as keyof typeof t] as string
  // Keep the menu inside the screen.
  const left = Math.max(8, Math.min(state.x, window.innerWidth - 240))
  const top = Math.max(8, Math.min(state.y, window.innerHeight - 160))

  return (
    <ul ref={ref} className="os-ctx" role="menu" aria-label={titles[state.id]} style={{ left, top }}>
      <li role="none">
        <button type="button" role="menuitem" onClick={() => { onOpenApp(state.id); onClose() }}>
          {t.ctx_open}
        </button>
      </li>
      {SLOTS_FOR[state.context].map((slot) => {
        const placed = isPlaced(placement, state.id, slot)
        const locked = isLocked(state.id, slot)
        return (
          <li key={slot} role="none">
            <button
              type="button"
              role="menuitem"
              disabled={locked && placed}
              title={locked && placed ? t.apps_locked : undefined}
              onClick={() => { setPlaced(state.id, slot, !placed); onClose() }}
            >
              {label(slot, placed)}
            </button>
          </li>
        )
      })}
      {surface && arrangement && currentGroup && (
        <li role="none">
          <button type="button" role="menuitem" onClick={() => { setArrangement(surface, (a) => removeFromGroup(a, state.id)); onClose() }}>
            {fill(t.ctx_leave_group, { name: groupName(currentGroup) })}
          </button>
        </li>
      )}
      {surface && arrangement && !currentGroup && arrangement.groups.map((g) => (
        <li key={g.id} role="none">
          <button type="button" role="menuitem" onClick={() => { setArrangement(surface, (a) => addToGroup(a, g.id, state.id)); onClose() }}>
            {fill(t.ctx_add_to_group, { name: groupName(g) })}
          </button>
        </li>
      ))}
      
      <li role="none" className="os-ctx-sep">
        <button
          type="button"
          role="menuitem"
          disabled={!canUninstall(state.id)}
          title={canUninstall(state.id) ? undefined : t.ctx_essential}
          onClick={() => { askUninstall(state.id); onClose() }}
        >
          {t.ctx_uninstall}
        </button>
      </li>
    </ul>
  )
}

/** Right-click, the keyboard menu key and a long press all open the same menu. */
export function useAppMenu() {
  const [state, setState] = useState<MenuState>(null)
  const timer = useRef<number | undefined>(undefined)
  const justOpened = useRef(false)

  const openAt = (id: AppId, context: MenuContext, x: number, y: number, byLongPress = false) => {
    if (byLongPress) {
      // The finger lifting after a long press would otherwise count as a tap on the app.
      justOpened.current = true
      window.setTimeout(() => (justOpened.current = false), 800)
    }
    setState({ id, context, x, y })
  }

  const handlers = (id: AppId, context: MenuContext) => ({
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault()
      openAt(id, context, e.clientX, e.clientY)
    },
    // Touch screens: a long press does the same (iOS never fires contextmenu).
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.pointerType !== "touch") return
      const { clientX, clientY } = e
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => openAt(id, context, clientX, clientY, true), 500)
    },
    onPointerUp: () => window.clearTimeout(timer.current),
    onPointerCancel: () => window.clearTimeout(timer.current),
    onPointerMove: () => window.clearTimeout(timer.current),
    // The click that ends a long press must not also launch the app.
    onClickCapture: (e: React.MouseEvent) => {
      if (justOpened.current) {
        justOpened.current = false
        e.preventDefault()
        e.stopPropagation()
      }
    },
  })

  return { state, handlers, close: () => setState(null) }
}
