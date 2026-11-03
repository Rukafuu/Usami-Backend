import type { ReactNode } from "react"

/**
 * Every app UsamiOS knows about. The shell (desktop icons, taskbar, start menu,
 * phone home screen and dock) is generated from this table — add an app here first.
 */
export type AppId =
  | "browser"
  | "files"
  | "code"
  | "messenger"
  | "music"
  | "gallery"
  | "terminal"
  | "achievements"
  | "calendar"
  | "taskmgr"
  | "settings"
  | "about"

export type AppCategory = "main" | "system"

/** Places an app can be pinned: PC desktop, PC taskbar, phone home screen, phone dock. */
export type Slot = "desktop" | "taskbar" | "home" | "dock"
export const SLOTS: Slot[] = ["desktop", "taskbar", "home", "dock"]

export type AppDef = {
  id: AppId
  category: AppCategory
  size: { w: number; h: number }
  /** Shown as a desktop shortcut and on the phone home grid. */
  onDesktop: boolean
  /** Pinned to the phone dock. */
  inDock: boolean
  /** Cannot be uninstalled: without it the visitor could not get anything back (Settings holds "reinstall"). */
  essential?: boolean
  /** Slots the visitor cannot take this app out of (it would leave no way back in, e.g. Settings on a phone). */
  locked?: Slot[]
  icon: ReactNode
}

export const APPS: Record<AppId, AppDef> = {
  browser: {
    id: "browser", category: "main", size: { w: 860, h: 560 }, onDesktop: true, inDock: true,
    icon: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  },
  files: {
    id: "files", category: "main", size: { w: 900, h: 540 }, onDesktop: true, inDock: true,
    icon: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
  },
  code: {
    id: "code", category: "main", size: { w: 960, h: 600 }, onDesktop: false, inDock: true,
    icon: <><path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12" /></>,
  },
  messenger: {
    id: "messenger", category: "main", size: { w: 720, h: 540 }, onDesktop: false, inDock: true,
    icon: <><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></>,
  },
  music: {
    id: "music", category: "main", size: { w: 860, h: 560 }, onDesktop: false, inDock: true,
    icon: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  },
  gallery: {
    id: "gallery", category: "main", size: { w: 820, h: 540 }, onDesktop: true, inDock: true,
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>,
  },
  terminal: {
    id: "terminal", category: "main", size: { w: 720, h: 600 }, onDesktop: true, inDock: true,
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" /></>,
  },
  achievements: {
    id: "achievements", category: "system", size: { w: 660, h: 520 }, onDesktop: false, inDock: false,
    icon: <><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" /></>,
  },
  calendar: {
    id: "calendar", category: "system", size: { w: 680, h: 500 }, onDesktop: false, inDock: false,
    icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  },
  taskmgr: {
    id: "taskmgr", category: "system", size: { w: 680, h: 480 }, onDesktop: false, inDock: false,
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M6 13h3l2-4 2 6 2-3h3" /></>,
  },
  settings: {
    id: "settings", category: "system", size: { w: 720, h: 520 }, onDesktop: false, inDock: true, locked: ["home"], essential: true,
    icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
  },
  about: {
    id: "about", category: "system", size: { w: 560, h: 560 }, onDesktop: false, inDock: false,
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  },
}

export const APP_IDS = Object.keys(APPS) as AppId[]

export function AppIcon({ id }: { id: AppId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="os-app-icon">
      {APPS[id].icon}
    </svg>
  )
}
