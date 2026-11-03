import { useEffect, useRef, useState } from "react"
import { GroupPanel, GroupTile, groupLabel } from "../components/Groups"
import type { MenuHandlers } from "../components/AppMenu"
import { applyDrop, assignCells, buildItems, renameGroup } from "../layout"
import { placedApps } from "../placement"
import { AppIcon, type AppId } from "../registry"
import { useShell } from "../shell"
import type { OsData } from "../types"
import { DragGhost, readHit, useDrag } from "../useDrag"

type Props = {
  data: OsData
  titles: Record<AppId, string>
  onOpen: (id: AppId) => void
  menu: (id: AppId) => MenuHandlers
}

const ICON_PX = { small: 40, default: 52, large: 68 } as const
const CELL_W = 88
const GAP = 8
const LABEL_H = 44

/** Rows and columns that fit in the desktop area (a sensible default until it is measured, e.g. in tests). */
function useGridSize(ref: React.RefObject<HTMLElement | null>, cellH: number) {
  const [size, setSize] = useState({ cols: 8, rows: 8 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      setSize({
        cols: Math.max(1, Math.floor((width + GAP) / (CELL_W + GAP))),
        rows: Math.max(1, Math.floor((height + GAP) / (cellH + GAP))),
      })
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, cellH])
  return size
}

/**
 * Desktop icons on a grid. Click selects, double-click or Enter opens, right-click offers pinning, grouping and uninstalling.
 * Drag an icon to any free cell, onto the middle of another app to make a group, or out of a group panel to take it out.
 */
export function DesktopIcons({ data, titles, onOpen, menu }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const ref = useRef<HTMLUListElement>(null)
  const placement = useShell((s) => s.placement)
  const uninstalled = useShell((s) => s.uninstalled)
  const arrangement = useShell((s) => s.layouts.desktop)
  const iconSize = useShell((s) => s.iconSize)
  const { setArrangement } = useShell.getState()

  const cellH = ICON_PX[iconSize] + LABEL_H
  const { cols, rows } = useGridSize(ref, cellH)
  const placed = placedApps(placement, "desktop", uninstalled)
  const items = buildItems(placed, arrangement)
  const resolved = assignCells(items.map((i) => i.key), arrangement.cells, cols, rows)

  const { drag, bind } = useDrag(({ key, x, y, target }) => {
    const rect = ref.current?.getBoundingClientRect()
    const grid = rect ? { rect, cellW: CELL_W + GAP, cellH: cellH + GAP, cols, rows } : undefined
    const hit = readHit(target, x, y, grid)
    if (hit.kind === "panel" || hit.kind === "none") return
    setArrangement("desktop", (a) => applyDrop(a, { surface: "desktop", placed, resolved }, key, hit))
    setOpenGroup(null)
  })

  const ghost = drag && items.find((i) => i.key === drag.key)
  const appOfKey = (key: string) => (key.startsWith("app:") ? (key.slice(4) as AppId) : null)
  const draggedApp = drag ? appOfKey(drag.key) : null

  return (
    <>
      <ul
        ref={ref}
        className="os-icons"
        aria-label={data.ui.shell.desktop_icons}
        style={{ gridTemplateColumns: `repeat(${cols}, ${CELL_W}px)`, gridTemplateRows: `repeat(${rows}, ${cellH}px)` }}
      >
        {items.map((item) => {
          const cell = resolved[item.key] ?? { col: 0, row: 0 }
          return (
            <li
              key={item.key}
              data-item-key={item.key}
              className={drag?.key === item.key ? "is-dragging" : undefined}
              style={{ gridColumn: cell.col + 1, gridRow: cell.row + 1 }}
              {...bind(item.key)}
            >
              {item.kind === "app" ? (
                <button
                  type="button"
                  className={selected === item.key ? "is-selected" : undefined}
                  onClick={() => setSelected(item.key)}
                  onDoubleClick={() => onOpen(item.id)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onOpen(item.id))}
                  onBlur={() => setSelected((s) => (s === item.key ? null : s))}
                  {...menu(item.id)}
                >
                  <span className="os-icon-tile">
                    <AppIcon id={item.id} />
                  </span>
                  <span className="os-icon-label">{titles[item.id]}</span>
                </button>
              ) : (
                <GroupTile
                  data={data}
                  apps={item.apps}
                  label={groupLabel(item.group, arrangement.groups.indexOf(item.group), data)}
                  onOpen={() => { setRenaming(false); setOpenGroup(item.group.id) }}
                  onRename={() => { setRenaming(true); setOpenGroup(item.group.id) }}
                />
              )}
            </li>
          )
        })}
      </ul>

      <DragGhost drag={drag}>
        {draggedApp ? (
          <>
            <span className="os-icon-tile"><AppIcon id={draggedApp} /></span>
            <span className="os-icon-label">{titles[draggedApp]}</span>
          </>
        ) : ghost && ghost.kind === "group" ? (
          <>
            <span className="os-icon-tile os-group-tile">{ghost.apps.slice(0, 4).map((id) => <AppIcon key={id} id={id} />)}</span>
            <span className="os-icon-label">{groupLabel(ghost.group, arrangement.groups.indexOf(ghost.group), data)}</span>
          </>
        ) : null}
      </DragGhost>

      {items.map((item) =>
        item.kind === "group" && openGroup === item.group.id ? (
          <GroupPanel
            key={item.key}
            data={data}
            titles={titles}
            apps={item.apps}
            label={groupLabel(item.group, arrangement.groups.indexOf(item.group), data)}
            name={item.group.name}
            startEditing={renaming}
            onRename={(name) => setArrangement("desktop", (a) => renameGroup(a, item.group.id, name))}
            onOpenApp={onOpen}
            onClose={() => setOpenGroup(null)}
            menu={menu}
            dragBind={(id) => bind(`app:${id}`, "panel")}
          />
        ) : null,
      )}
    </>
  )
}
