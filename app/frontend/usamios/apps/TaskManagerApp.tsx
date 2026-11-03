import { useEffect, useState } from "react"
import { AppIcon, APP_IDS, type AppId } from "../registry"
import { useShell } from "../shell"
import type { OsData } from "../types"
import { focusedApp, useWindows, type Win } from "../windows"

const SESSION_START = Date.now()

const formatUptime = (ms: number) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight })

/**
 * Task Manager: real session state (open windows, session uptime, viewport, DOM nodes)
 * alongside clearly-labelled virtual Fuwarch daemons. Never fabricates host CPU/RAM metrics.
 */
export function TaskManagerApp({ data }: { data: OsData }) {
  const order = useWindows((s) => s.order)
  const windows = useWindows((s) => s.windows)
  const front = focusedApp(windows)
  const { focus, close, activate } = useWindows.getState()
  const theme = useShell((s) => s.theme)
  const vision = useShell((s) => s.vision)

  const [now, setNow] = useState(() => Date.now())
  const [vp, setVp] = useState(viewport)
  const [domCount, setDomCount] = useState(() => document.querySelectorAll("*").length)

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNow(Date.now())
      setDomCount(document.querySelectorAll("*").length)
    }, 1000)
    const onResize = () => setVp(viewport())
    window.addEventListener("resize", onResize)
    return () => {
      window.clearInterval(tick)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  const t = data.ui.apps
  const fmt = new Intl.NumberFormat(data.locale)

  const stateLabel = (id: AppId, win: Win) => {
    if (win.mode === "minimized") return t.taskmgr_state_minimized
    if (front === id) return t.taskmgr_state_focused
    if (win.mode === "maximized") return t.taskmgr_state_maximized
    return t.taskmgr_state_normal
  }

  const restoreOrFocus = (id: AppId) => {
    const win = windows[id]
    if (!win) return
    if (win.mode === "minimized") activate(id, viewport())
    else focus(id)
  }

  const daemons = [
    { pid: "01", name: "fuwarch-wm", detail: `zustand · ${order.length}/${APP_IDS.length} apps` },
    { pid: "02", name: "vfs-content-store", detail: `readonly · ${data.entries.length} entries · ${data.ledger.length} claims` },
    { pid: "03", name: "theme-engine", detail: `theme=${theme ?? "system"} · vision=${vision}` },
    { pid: "04", name: "usami-presence.d", detail: `${data.site.name} · locale=${data.locale}` },
    { pid: "05", name: "fuwarch-sh", detail: windows.terminal ? "active (tty0)" : "idle" },
  ]

  return (
    <div className="os-taskmgr">
      <section aria-label={t.taskmgr_session}>
        <h3>{t.taskmgr_session}</h3>
        <dl className="os-taskmgr-stats">
          <div>
            <dt>{t.taskmgr_uptime}</dt>
            <dd className="mono">{formatUptime(now - SESSION_START)}</dd>
          </div>
          <div>
            <dt>{t.taskmgr_open_count}</dt>
            <dd className="mono">{order.length} / {APP_IDS.length}</dd>
          </div>
          <div>
            <dt>{t.taskmgr_viewport}</dt>
            <dd className="mono">{vp.width} × {vp.height} px</dd>
          </div>
          <div>
            <dt>{t.taskmgr_dom_nodes}</dt>
            <dd className="mono">{fmt.format(domCount)}</dd>
          </div>
        </dl>
      </section>

      <section aria-label={t.taskmgr_windows}>
        <h3>{t.taskmgr_windows}</h3>
        {order.length === 0 ? (
          <p className="os-note">{t.taskmgr_no_windows}</p>
        ) : (
          <div className="os-table">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t.taskmgr_col_app}</th>
                  <th scope="col">{t.taskmgr_col_state}</th>
                  <th scope="col">{t.taskmgr_col_layer}</th>
                  <th scope="col">{t.taskmgr_col_actions}</th>
                </tr>
              </thead>
              <tbody>
                {order.map((id) => {
                  const win = windows[id]
                  if (!win) return null
                  return (
                    <tr key={id}>
                      <td>
                        <span className="os-taskmgr-app">
                          <AppIcon id={id} />
                          <span>{t[id]}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`os-badge${front === id ? " is-live" : ""}`}>
                          {stateLabel(id, win)}
                        </span>
                      </td>
                      <td className="mono">z:{win.z}</td>
                      <td>
                        <div className="os-taskmgr-actions">
                          <button type="button" className="os-button" onClick={() => restoreOrFocus(id)}>
                            {t.taskmgr_focus}
                          </button>
                          <button type="button" className="os-button is-danger" onClick={() => close(id)}>
                            {t.taskmgr_end}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-label={t.taskmgr_daemons}>
        <h3>{t.taskmgr_daemons}</h3>
        <p className="os-note">{t.taskmgr_daemons_note}</p>
        <ul className="os-taskmgr-daemons">
          {daemons.map((d) => (
            <li key={d.pid}>
              <span className="mono">[{d.pid}] {d.name}</span>
              <span className="mono">{d.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
