import { useEffect, useRef, useState } from "react"
import { fill } from "../format"
import type { Group } from "../layout"
import { AppIcon, type AppId } from "../registry"
import type { OsData } from "../types"
import type { MenuHandlers } from "./AppMenu"

/** The name shown for a group: the one the visitor chose, or "Group N". */
export const groupLabel = (group: Group, index: number, data: OsData) => group.name || `${data.ui.apps.group_default} ${index + 1}`

/** A group on the grid: a tile previewing up to four of its apps. Right-click (or long-press) it to rename. */
export function GroupTile({ label, data, apps, onOpen, onRename, className }: {
  label: string
  data: OsData
  apps: AppId[]
  onOpen: () => void
  /** Opens the group ready to be renamed. */
  onRename?: () => void
  className?: string
}) {
  const timer = useRef<number | undefined>(undefined)
  const held = useRef(false)
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        if (held.current) return e.preventDefault()
        onOpen()
      }}
      onContextMenu={(e) => {
        if (!onRename) return
        e.preventDefault()
        onRename()
      }}
      // Touch: holding for half a second renames (iOS never fires contextmenu).
      onPointerDown={(e) => {
        held.current = false
        if (!onRename || e.pointerType !== "touch") return
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => {
          held.current = true
          onRename()
        }, 500)
      }}
      onPointerUp={() => window.clearTimeout(timer.current)}
      onPointerMove={() => window.clearTimeout(timer.current)}
      aria-label={fill(data.ui.apps.group_open, { name: label })}
      aria-haspopup="dialog"
    >
      <span className="os-icon-tile os-group-tile" aria-hidden="true">
        {apps.slice(0, 4).map((id) => (
          <AppIcon key={id} id={id} />
        ))}
      </span>
      <span className="os-icon-label">{label}</span>
    </button>
  )
}

/** Opens when a group is tapped: a small panel on the desktop, a sheet on the phone (see the CSS). The name can be edited in place. */
export function GroupPanel({ label, name, apps, titles, data, onOpenApp, onClose, onRename, startEditing = false, menu, dragBind }: {
  label: string
  /** The name the visitor chose ("" when it still uses the default). */
  name: string
  apps: AppId[]
  titles: Record<AppId, string>
  data: OsData
  onOpenApp: (id: AppId) => void
  onClose: () => void
  onRename: (name: string) => void
  startEditing?: boolean
  menu: (id: AppId) => MenuHandlers
  /** Makes an app in the panel draggable: dropping it outside the panel takes it out of the group. */
  dragBind?: (id: AppId) => object
}) {
  const ref = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(startEditing)
  const [draft, setDraft] = useState(name)
  const live = useRef({ editing, draft, onClose, onRename })
  live.current = { editing, draft, onClose, onRename }
  const t = data.ui.apps

  const commit = () => {
    if (!live.current.editing) return
    live.current.onRename(live.current.draft)
    setEditing(false)
  }

  useEffect(() => {
    if (editing) {
      input.current?.focus()
      input.current?.select()
    }
  }, [editing])

  useEffect(() => {
    if (!startEditing) ref.current?.querySelector<HTMLButtonElement>("ul button")?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      // Escape while renaming only cancels the rename.
      if (live.current.editing) return
      live.current.onClose()
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (!ref.current?.contains(target) && !target.closest(".os-ctx")) live.current.onClose()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer, true)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer, true)
      // Closing the panel (clicking elsewhere) keeps a name that was being typed.
      if (live.current.editing) live.current.onRename(live.current.draft)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={ref} className="os-group-panel" role="dialog" aria-label={label}>
      <header>
        {editing ? (
          <input
            ref={input}
            className="os-group-name"
            type="text"
            value={draft}
            maxLength={40}
            placeholder={label}
            aria-label={t.layout_group_name}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              else if (e.key === "Escape") {
                setDraft(name)
                setEditing(false)
              }
            }}
            onBlur={commit}
          />
        ) : (
          <>
            <h2>{label}</h2>
            <button type="button" className="os-winbtn" onClick={() => { setDraft(name); setEditing(true) }} aria-label={t.group_rename} title={t.group_rename}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" /></svg>
            </button>
          </>
        )}
        <button type="button" className="os-winbtn" onClick={onClose} aria-label={t.group_close}>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>
        </button>
      </header>
      <ul>
        {apps.map((id) => (
          <li key={id}>
            <button type="button" onClick={() => { onOpenApp(id); onClose() }} {...menu(id)} {...dragBind?.(id)}>
              <span className="os-icon-tile"><AppIcon id={id} /></span>
              <span className="os-icon-label">{titles[id]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}