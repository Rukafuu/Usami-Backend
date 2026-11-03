import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import type { Cell, Hit } from "./layout"

export type DragSource = "grid" | "panel"
export type DragState = { key: string; x: number; y: number } | null
export type DropEvent = { key: string; source: DragSource; x: number; y: number; target: Element | null }

const MOUSE_SLOP = 6
const TOUCH_SLOP = 8
/** A finger has to rest this long before moving counts as a drag; moving sooner is a scroll. */
const TOUCH_HOLD_MS = 180

/**
 * Pointer-based drag and drop that works the same with a mouse and a finger (HTML5 drag and drop does not on phones).
 * The hook only tracks the gesture; the caller decides what a drop means.
 */
export function useDrag(onDrop: (event: DropEvent) => void) {
  const [drag, setDrag] = useState<DragState>(null)
  const dropRef = useRef(onDrop)
  dropRef.current = onDrop
  const cleanup = useRef<(() => void) | null>(null)
  const swallowClick = useRef(false)

  useEffect(() => () => cleanup.current?.(), [])

  const bind = (key: string, source: DragSource = "grid") => ({
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.button !== 0) return
      cleanup.current?.()
      const start = { x: e.clientX, y: e.clientY, t: Date.now(), touch: e.pointerType === "touch" }
      let active = false

      const move = (ev: PointerEvent) => {
        const dist = Math.hypot(ev.clientX - start.x, ev.clientY - start.y)
        if (!active) {
          if (dist < (start.touch ? TOUCH_SLOP : MOUSE_SLOP)) return
          // A finger that moves before resting is scrolling, not dragging.
          if (start.touch && Date.now() - start.t < TOUCH_HOLD_MS) return end(false)
          active = true
        }
        ev.preventDefault()
        setDrag({ key, x: ev.clientX, y: ev.clientY })
      }
      const up = (ev: PointerEvent) => {
        const wasActive = active
        end(false)
        if (!wasActive) return
        swallowClick.current = true
        window.setTimeout(() => (swallowClick.current = false), 0)
        dropRef.current({ key, source, x: ev.clientX, y: ev.clientY, target: document.elementFromPoint(ev.clientX, ev.clientY) })
      }
      const end = (_commit: boolean) => {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
        window.removeEventListener("pointercancel", cancel)
        setDrag(null)
        cleanup.current = null
      }
      const cancel = () => end(false)

      window.addEventListener("pointermove", move, { passive: false })
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", cancel)
      cleanup.current = cancel
    },
    // The click that ends a drag must not also launch the app.
    onClickCapture: (e: React.MouseEvent) => {
      if (swallowClick.current) {
        swallowClick.current = false
        e.preventDefault()
        e.stopPropagation()
      }
    },
    "data-drag-key": key,
  })

  return { drag, bind }
}

export type GridGeometry = { rect: DOMRect; cellW: number; cellH: number; cols: number; rows: number }

/**
 * Turns "what is under the pointer" into a `Hit`:
 * another icon (middle = make a group, edges = reposition), an empty cell, or nothing (a window, the taskbar, a menu).
 */
export function readHit(target: Element | null, x: number, y: number, grid?: GridGeometry): Hit | { kind: "panel" } {
  if (!target) return { kind: "none" }
  if (target.closest(".os-group-panel")) return { kind: "panel" }
  if (target.closest(".os-win, .os-taskbar, .os-start, .os-ctx, .os-phone-dock, .os-modal")) return { kind: "none" }

  const item = target.closest<HTMLElement>("[data-item-key]")
  if (item) {
    const r = item.getBoundingClientRect()
    const rel = r.width ? (x - r.left) / r.width : 0.5
    return { kind: "item", key: item.dataset.itemKey!, zone: rel > 0.28 && rel < 0.72 ? "center" : rel <= 0.28 ? "before" : "after" }
  }
  if (grid) {
    const col = Math.floor((x - grid.rect.left) / grid.cellW)
    const row = Math.floor((y - grid.rect.top) / grid.cellH)
    if (col >= 0 && row >= 0 && col < grid.cols && row < grid.rows) return { kind: "cell", cell: { col, row } satisfies Cell }
    return { kind: "none" }
  }
  return { kind: "cell" }
}

/** The icon that follows the pointer while dragging. */
export function DragGhost({ drag, children }: { drag: DragState; children: React.ReactNode }) {
  if (!drag) return null
  return (
    <div className="os-drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
      {children}
    </div>
  )
}
