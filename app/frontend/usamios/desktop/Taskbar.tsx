import type { MenuHandlers } from "../components/AppMenu"
import { placedApps } from "../placement"
import { AppIcon, type AppId } from "../registry"
import { useShell } from "../shell"
import type { OsData } from "../types"
import { focusedApp, useWindows } from "../windows"
import { Clock } from "../Clock"

type Props = {
  data: OsData
  titles: Record<AppId, string>
  startOpen: boolean
  onToggleStart: () => void
  onActivate: (id: AppId) => void
  onOpenLanguage: () => void
  menu: (id: AppId) => MenuHandlers
}

const LANGUAGE_NAMES = { pt: "Português", en: "English", es: "Español", ja: "日本語" } as const

/** Bottom taskbar: Start button, one button per open app, language and clock in the tray. */
export function Taskbar({ data, titles, startOpen, onToggleStart, onActivate, onOpenLanguage, menu }: Props) {
  const order = useWindows((s) => s.order)
  const windows = useWindows((s) => s.windows)
  const front = focusedApp(windows)
  const placement = useShell((s) => s.placement)
  const uninstalled = useShell((s) => s.uninstalled)
  // Pinned apps keep a spot on the taskbar whether or not they are open; other open apps follow them.
  const pinned = placedApps(placement, "taskbar", uninstalled)
  const running = order.filter((id) => !pinned.includes(id))

  return (
    <footer className="os-taskbar">
      <button type="button" className="os-startbtn" data-start-button aria-expanded={startOpen} aria-haspopup="dialog" onClick={onToggleStart}>
        <img src="/brand/logo-64.png" alt="" width="22" height="22" />
        <span>{data.ui.shell.start}</span>
      </button>

      <ul className="os-tasks" aria-label={data.ui.shell.running}>
        {pinned.map((id) => (
          <li key={id}>
            <button
              type="button"
              className={`is-pinned${windows[id] ? " is-open" : ""}${windows[id]?.mode === "minimized" ? " is-min" : ""}`}
              aria-pressed={front === id}
              aria-label={titles[id]}
              title={titles[id]}
              onClick={() => onActivate(id)}
              {...menu(id)}
            >
              <AppIcon id={id} />
            </button>
          </li>
        ))}
        {running.map((id) => (
          <li key={id}>
            <button
              type="button"
              aria-pressed={front === id}
              className={windows[id]?.mode === "minimized" ? "is-min" : undefined}
              onClick={() => onActivate(id)}
              {...menu(id)}
            >
              <AppIcon id={id} />
              <span>{titles[id]}</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="os-tray-btn"
        aria-label={`${titles.taskmgr} (${order.length})`}
        aria-pressed={front === "taskmgr"}
        onClick={() => onActivate("taskmgr")}
      >
        <AppIcon id="taskmgr" />
        <span className="mono">{order.length}</span>
      </button>

      <button type="button" className="os-tray-lang" onClick={onOpenLanguage} aria-label={`${data.ui.shell.language}: ${LANGUAGE_NAMES[data.locale]}`} title={LANGUAGE_NAMES[data.locale]}>
        {data.locale === "ja" ? "日本語" : data.locale.toUpperCase()}
      </button>
      <Clock locale={data.locale} label={titles.calendar} pressed={front === "calendar"} onClick={() => onActivate("calendar")} />
    </footer>
  )
}
