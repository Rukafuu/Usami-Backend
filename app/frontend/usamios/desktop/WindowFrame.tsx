import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import type { AppId } from "../registry"
import { AppIcon } from "../registry"
import type { Ui } from "../types"
import { useWindows } from "../windows"

type Props = { id: AppId; title: string; ui: Ui["shell"]; children: ReactNode }

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight })

/** Pointer drag helper: calls onMove with the delta from where the drag started. */
const drag = (e: ReactPointerEvent<HTMLElement>, onMove: (dx: number, dy: number) => void) => {
  const handle = e.currentTarget
  const startX = e.clientX
  const startY = e.clientY
  handle.setPointerCapture(e.pointerId)
  const move = (ev: PointerEvent) => onMove(ev.clientX - startX, ev.clientY - startY)
  const up = () => {
    handle.removeEventListener("pointermove", move)
    handle.removeEventListener("pointerup", up)
  }
  handle.addEventListener("pointermove", move)
  handle.addEventListener("pointerup", up)
}

/** A desktop window: drag by the title bar, resize from the corner, minimize / maximize / close. */
export function WindowFrame({ id, title, ui, children }: Props) {
  const win = useWindows((s) => s.windows[id])
  const isFront = useWindows((s) => s.windows[id]?.z === s.topZ)
  const { focus, close, minimize, toggleMaximize, move, resize } = useWindows.getState()
  const ref = useRef<HTMLElement>(null)
  const visible = Boolean(win && win.mode !== "minimized")

  // Focus moves into a window whenever it appears, so keyboard users land inside it.
  useEffect(() => {
    if (visible) ref.current?.focus({ preventScroll: true })
  }, [visible])

  if (!win) return null

  const onTitleDown = (e: ReactPointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("button") || win.mode !== "normal") return
    const { x, y } = win
    drag(e, (dx, dy) => move(id, x + dx, y + dy, viewport()))
  }
  const onResizeDown = (e: ReactPointerEvent<HTMLElement>) => {
    e.stopPropagation()
    const { w, h } = win
    drag(e, (dx, dy) => resize(id, w + dx, h + dy, viewport()))
  }

  return (
    <section
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-label={title}
      hidden={win.mode === "minimized"}
      className={`os-win${isFront ? " is-front" : ""}${win.mode === "maximized" ? " is-max" : ""}`}
      style={win.mode === "maximized" ? { zIndex: win.z } : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      onPointerDown={() => focus(id)}
      onKeyDown={(e) => e.key === "Escape" && close(id)}
    >
      <header className="os-titlebar" onPointerDown={onTitleDown} onDoubleClick={() => toggleMaximize(id)}>
        <AppIcon id={id} />
        <span className="os-title">{title}</span>
        <button type="button" className="os-winbtn" aria-label={ui.minimize} onClick={() => minimize(id)}>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 9h8" /></svg>
        </button>
        <button type="button" className="os-winbtn" aria-label={win.mode === "maximized" ? ui.restore : ui.maximize} onClick={() => toggleMaximize(id)}>
          <svg viewBox="0 0 12 12" aria-hidden="true">
            {win.mode === "maximized" ? <path d="M3.5 4.5h5v5h-5zM5 4.5V3h4.5v4.5H8.5" /> : <path d="M2.5 2.5h7v7h-7z" />}
          </svg>
        </button>
        <button type="button" className="os-winbtn is-close" aria-label={ui.close} onClick={() => close(id)}>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>
        </button>
      </header>
      <div className="os-body">{children}</div>
      {win.mode === "normal" && <span className="os-resize" aria-hidden="true" onPointerDown={onResizeDown} />}
    </section>
  )
}
