import { useEffect, useRef } from "react"
import type { MenuHandlers } from "../components/AppMenu"
import { useShell } from "../shell"
import { APP_IDS, APPS, AppIcon, type AppId } from "../registry"
import type { OsData } from "../types"

type Props = {
  data: OsData
  titles: Record<AppId, string>
  onOpen: (id: AppId) => void
  onClassic: () => void
  onClose: () => void
  onPet: () => void
  onWallpapers: () => void
  menu: (id: AppId) => MenuHandlers
}

/** Start menu: every app grouped by category (main apps, easter eggs, system utilities and classic view). */
export function StartMenu({ data, titles, onOpen, onClassic, onClose, onPet, onWallpapers, menu }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector("button")?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (!ref.current?.contains(target) && !target.closest("[data-start-button]")) onClose()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer)
    }
  }, [onClose])

  const launch = (id: AppId) => {
    onOpen(id)
    onClose()
  }

  const uninstalled = useShell((s) => s.uninstalled)
  const installed = APP_IDS.filter((id) => !uninstalled.includes(id))
  const mainApps = installed.filter((id) => APPS[id].category === "main")
  const systemApps = installed.filter((id) => APPS[id].category === "system")

  return (
    <div ref={ref} className="os-start" role="dialog" aria-label={data.ui.shell.start_menu}>
      <p className="os-start-head">
        <span>{data.site.osName}</span>
        <span className="mono">v{data.system.version}</span>
      </p>
      <ul className="os-start-apps">
        {mainApps.map((id) => (
          <li key={id}>
            <button type="button" onClick={() => launch(id)} {...menu(id)}>
              <AppIcon id={id} />
              {titles[id]}
            </button>
          </li>
        ))}
      </ul>
      <ul className="os-start-eggs">
        <li>
          <button type="button" onClick={() => { onPet(); onClose() }}>
            {data.ui.eggs.start_label}
          </button>
        </li>
      </ul>
      <ul className="os-start-system">
        <li>
          <button type="button" onClick={() => { onWallpapers(); onClose() }}>
            <AppIcon id="gallery" />
            {data.ui.apps.cat_wallpaper}
          </button>
        </li>
        {systemApps.map((id) => (
          <li key={id}>
            <button type="button" onClick={() => launch(id)} {...menu(id)}>
              <AppIcon id={id} />
              {titles[id]}
            </button>
          </li>
        ))}
        <li>
          <button type="button" onClick={onClassic}>
            {data.ui.shell.classic}
          </button>
        </li>
      </ul>
    </div>
  )
}
