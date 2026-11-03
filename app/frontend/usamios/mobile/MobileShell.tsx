import { AppContent } from "../AppContent"
import { AppMenu, useAppMenu } from "../components/AppMenu"
import { useState } from "react"
import { Clock } from "../Clock"
import { GroupPanel, GroupTile, groupLabel } from "../components/Groups"
import { applyDrop, buildItems, renameGroup } from "../layout"
import { DragGhost, readHit, useDrag } from "../useDrag"
import { placedApps } from "../placement"
import { useShell } from "../shell"
import { Wallpaper } from "../Wallpaper"
import { APP_IDS, AppIcon, type AppId } from "../registry"
import type { OsData, PageContext } from "../types"
import { focusedApp, useWindows } from "../windows"

type Props = { data: OsData; page: PageContext; titles: Record<AppId, string>; onClassic: () => void }

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight })

/**
 * Phone paradigm on the same window store: one app in front at a time, full screen.
 * "Back" and the home bar send it to the background (minimize), like a phone.
 */
export function MobileShell({ data, page, titles, onClassic }: Props) {
  const windows = useWindows((s) => s.windows)
  const front = focusedApp(windows)
  const { open, minimize, minimizeAll } = useWindows.getState()
  const launch = (id: AppId) => open(id, viewport())
  const placement = useShell((s) => s.placement)
  const appMenu = useAppMenu()
  const uninstalled = useShell((s) => s.uninstalled)
  const arrangement = useShell((s) => s.layouts.home)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const homeApps = placedApps(placement, "home", uninstalled)
  const dockApps = placedApps(placement, "dock", uninstalled)
  const items = buildItems(homeApps, arrangement)
  const { setArrangement } = useShell.getState()
  // Same gestures as a phone: drag onto an app to make a group, out of a group to take an app out.
  const { drag, bind } = useDrag(({ key, x, y, target }) => {
    const hit = readHit(target, x, y)
    if (hit.kind === "panel" || hit.kind === "none") return
    setArrangement("home", (a) => applyDrop(a, { surface: "home", placed: homeApps }, key, hit))
    setOpenGroup(null)
  })
  const draggedId = drag?.key.startsWith("app:") ? (drag.key.slice(4) as AppId) : null
  // Apps taken off the home screen stay one tap away in the library (uninstalled ones do not).
  const library = APP_IDS.filter((id) => !homeApps.includes(id) && !uninstalled.includes(id))

  return (
    <div className="os os--mobile">
      <Wallpaper />
      <header className="os-status">
        <Clock locale={data.locale} />
        <span className="mono">{data.site.osName}</span>
      </header>

      {front ? (
        <section className="os-phone-app" role="dialog" aria-label={titles[front]}>
          <header className="os-phone-appbar">
            <button type="button" onClick={() => minimize(front)} aria-label={data.ui.shell.back}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <h1>{titles[front]}</h1>
          </header>
          <div className="os-phone-body">
            <AppContent id={front} data={data} page={page} />
          </div>
        </section>
      ) : (
        <main className="os-home">
          <p className="os-home-title">{data.site.headline}</p>
          <ul className="os-home-grid" aria-label={data.ui.shell.desktop_icons}>
            {items.map((item) => (
              <li key={item.key} data-item-key={item.key} className={drag?.key === item.key ? "is-dragging" : undefined} {...bind(item.key)}>
                {item.kind === "app" ? (
                  <button type="button" onClick={() => launch(item.id)} {...appMenu.handlers(item.id, "home")}>
                    <span className="os-icon-tile"><AppIcon id={item.id} /></span>
                    <span>{titles[item.id]}</span>
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
            ))}
          </ul>
          {library.length > 0 && (
            <section className="os-library" aria-label={data.ui.apps.app_library}>
              <h2 className="mono">{data.ui.apps.app_library}</h2>
              <ul className="os-home-grid">
                {library.map((id) => (
                  <li key={id}>
                    <button type="button" onClick={() => launch(id)} {...appMenu.handlers(id, "home")}>
                      <span className="os-icon-tile"><AppIcon id={id} /></span>
                      <span>{titles[id]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <button type="button" className="os-home-classic" onClick={onClassic}>
            {data.ui.shell.classic}
          </button>
        </main>
      )}

      {!front && (
        <nav className="os-phone-dock" aria-label={data.ui.shell.running}>
          {dockApps.map((id) => (
            <button key={id} type="button" onClick={() => launch(id)} aria-label={titles[id]} {...appMenu.handlers(id, "dock")}>
              <AppIcon id={id} />
            </button>
          ))}
        </nav>
      )}

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
            onRename={(name) => setArrangement("home", (a) => renameGroup(a, item.group.id, name))}
            onOpenApp={launch}
            onClose={() => setOpenGroup(null)}
            menu={(id) => appMenu.handlers(id, "home")}
            dragBind={(id) => bind(`app:${id}`, "panel")}
          />
        ) : null,
      )}
      <DragGhost drag={drag}>
        {draggedId && (
          <>
            <span className="os-icon-tile"><AppIcon id={draggedId} /></span>
            <span className="os-icon-label">{titles[draggedId]}</span>
          </>
        )}
      </DragGhost>
      <AppMenu state={appMenu.state} data={data} titles={titles} onOpenApp={launch} onClose={appMenu.close} />
      <button type="button" className="os-homebar" onClick={minimizeAll} aria-label={data.ui.shell.home} />
    </div>
  )
}
