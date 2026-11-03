import { useShell } from "./shell"
import type { AppId } from "./registry"
import { useWindows } from "./windows"

/** Uninstalls an app for real: it disappears everywhere and its window is closed. Reinstall lives in Settings. */
export function uninstallApp(id: AppId) {
  useShell.getState().setUninstalled(id, true)
  useWindows.getState().close(id)
}

export const reinstallApp = (id: AppId) => useShell.getState().setUninstalled(id, false)
