import { useEffect, useRef } from "react"
import { fill } from "../format"
import { uninstallApp } from "../installer"
import { AppIcon, type AppId } from "../registry"
import { useShell } from "../shell"
import type { OsData } from "../types"

/**
 * "Are you sure?" before uninstalling. Gentle on purpose: the safe answer (keep the app) has focus,
 * and nothing is lost either way, since every uninstalled app can be reinstalled from Settings.
 */
export function UninstallDialog({ data, titles }: { data: OsData; titles: Record<AppId, string> }) {
  const target = useShell((s) => s.uninstallTarget)
  const keep = useRef<HTMLButtonElement>(null)
  const t = data.ui.apps

  useEffect(() => {
    if (!target) return
    keep.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && useShell.getState().askUninstall(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [target])

  if (!target) return null
  const cancel = () => useShell.getState().askUninstall(null)

  return (
    <div className="os-modal" onPointerDown={(e) => e.target === e.currentTarget && cancel()}>
      <div className="os-alert" role="alertdialog" aria-modal="true" aria-labelledby="uninstall-title" aria-describedby="uninstall-body">
        <img src="/brand/logo-192.png" alt="" width="72" height="72" />
        <h2 id="uninstall-title">{t.uninstall_title}</h2>
        <p id="uninstall-body">{fill(t.uninstall_body, { app: titles[target] })}</p>
        <div className="os-alert-icon" aria-hidden="true"><AppIcon id={target} /></div>
        <div className="os-alert-actions">
          <button ref={keep} type="button" className="os-button is-primary" onClick={cancel}>
            {t.uninstall_keep}
          </button>
          <button type="button" className="os-button" onClick={() => uninstallApp(target)}>
            {t.uninstall_confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
