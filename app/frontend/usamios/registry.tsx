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
    icon: (
      <>
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.16" stroke="none" />
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4.2" ry="9" />
        <path d="M3.6 9h16.8M3.6 15h16.8" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </>
    ),
  },
  files: {
    id: "files", category: "main", size: { w: 900, h: 540 }, onDesktop: true, inDock: true,
    icon: (
      <>
        <path d="M3 8.5h18v9a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5v-9z" fill="currentColor" fillOpacity="0.18" stroke="none" />
        <path d="M3 6.8A2.3 2.3 0 015.3 4.5h4.1c.6 0 1.2.28 1.6.75l1.2 1.5h6.5A2.3 2.3 0 0121 9.05v8.45a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5V6.8z" />
        <path d="M3 10h18" />
        <path d="M9.5 14h5" />
      </>
    ),
  },
  code: {
    id: "code", category: "main", size: { w: 960, h: 600 }, onDesktop: true, inDock: true,
    icon: (
      <>
        <rect x="2.5" y="4" width="19" height="16" rx="3" fill="currentColor" fillOpacity="0.15" stroke="none" />
        <rect x="2.5" y="4" width="19" height="16" rx="3" />
        <path d="M2.5 8.2h19" />
        <circle cx="5.5" cy="6.1" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="8" cy="6.1" r="0.8" fill="currentColor" stroke="none" />
        <path d="M8.8 11.5L6.2 14l2.6 2.5M15.2 11.5l2.6 2.5-2.6 2.5M13.1 10.8l-2.2 6.4" />
      </>
    ),
  },
  messenger: {
    id: "messenger", category: "main", size: { w: 720, h: 540 }, onDesktop: true, inDock: true,
    icon: (
      <>
        <path d="M12 3.5c4.97 0 9 3.58 9 8 0 4.42-4.03 8-9 8-1.46 0-2.84-.31-4.06-.86L3.5 20l1.4-3.7A7.5 7.5 0 013 11.5c0-4.42 4.03-8 9-8z" fill="currentColor" fillOpacity="0.18" stroke="none" />
        <path d="M12 3.5c4.97 0 9 3.58 9 8 0 4.42-4.03 8-9 8-1.46 0-2.84-.31-4.06-.86L3.5 20l1.4-3.7A7.5 7.5 0 013 11.5c0-4.42 4.03-8 9-8z" />
        <circle cx="8.5" cy="11.5" r="1.15" fill="currentColor" stroke="none" />
        <circle cx="12" cy="11.5" r="1.15" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="11.5" r="1.15" fill="currentColor" stroke="none" />
      </>
    ),
  },
  music: {
    id: "music", category: "main", size: { w: 980, h: 620 }, onDesktop: true, inDock: true,
    icon: (
      <>
        <circle cx="10.5" cy="13.5" r="6.5" fill="currentColor" fillOpacity="0.18" stroke="none" />
        <circle cx="10.5" cy="13.5" r="6.5" />
        <circle cx="10.5" cy="13.5" r="2" fill="currentColor" stroke="none" />
        <path d="M15.5 14.5V4.5l5-1.2v3.2l-5 1.2" />
        <circle cx="13.8" cy="15.2" r="2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  gallery: {
    id: "gallery", category: "main", size: { w: 820, h: 540 }, onDesktop: true, inDock: true,
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" fillOpacity="0.15" stroke="none" />
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="8.5" cy="9.2" r="1.8" fill="currentColor" fillOpacity="0.45" />
        <path d="M4.2 18.2l5.3-5.4a1.4 1.4 0 012 0l2.5 2.5 2.3-2.3a1.2 1.2 0 011.7 0l2.6 2.6" />
      </>
    ),
  },
  terminal: {
    id: "terminal", category: "main", size: { w: 720, h: 600 }, onDesktop: true, inDock: true,
    icon: (
      <>
        <rect x="2.5" y="4" width="19" height="16" rx="3" fill="currentColor" fillOpacity="0.16" stroke="none" />
        <rect x="2.5" y="4" width="19" height="16" rx="3" />
        <path d="M6.8 9.2L10.3 12l-3.5 2.8" />
        <path d="M12.2 15h4.8" />
      </>
    ),
  },
  achievements: {
    id: "achievements", category: "system", size: { w: 660, h: 520 }, onDesktop: true, inDock: false,
    icon: (
      <>
        <path d="M7 4h10v5a5 5 0 01-10 0V4z" fill="currentColor" fillOpacity="0.2" stroke="none" />
        <path d="M7 4h10v5a5 5 0 01-10 0V4z" />
        <path d="M7 6H4.5a1.5 1.5 0 00-1.5 1.5v.5a3.5 3.5 0 003.5 3.5H7M17 6h2.5A1.5 1.5 0 0121 7.5V8a3.5 3.5 0 01-3.5 3.5H17" />
        <path d="M12 14v3.5M8.5 20h7M9.5 17.5h5" />
        <circle cx="12" cy="8.2" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  calendar: {
    id: "calendar", category: "system", size: { w: 680, h: 500 }, onDesktop: true, inDock: false,
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2.8" fill="currentColor" fillOpacity="0.15" stroke="none" />
        <rect x="3" y="5" width="18" height="16" rx="2.8" />
        <path d="M8 3.2v3.2M16 3.2v3.2M3 9.5h18" />
        <circle cx="8.2" cy="13.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="15.8" cy="13.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="8.2" cy="17" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  taskmgr: {
    id: "taskmgr", category: "system", size: { w: 680, h: 480 }, onDesktop: true, inDock: false,
    icon: (
      <>
        <rect x="2.5" y="4" width="19" height="16" rx="3" fill="currentColor" fillOpacity="0.15" stroke="none" />
        <rect x="2.5" y="4" width="19" height="16" rx="3" />
        <path d="M5.5 13h3l2.2-4.5 2.6 7 2.2-4.2h3" />
        <circle cx="18.5" cy="7.2" r="1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  settings: {
    id: "settings", category: "system", size: { w: 720, h: 520 }, onDesktop: true, inDock: true, locked: ["home"], essential: true,
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" fillOpacity="0.14" stroke="none" />
        <path d="M5.5 8.5h13M5.5 15.5h13" />
        <circle cx="9.5" cy="8.5" r="2.2" fill="var(--surface, #211713)" />
        <circle cx="9.5" cy="8.5" r="2.2" />
        <circle cx="14.5" cy="15.5" r="2.2" fill="var(--surface, #211713)" />
        <circle cx="14.5" cy="15.5" r="2.2" />
      </>
    ),
  },
  about: {
    id: "about", category: "system", size: { w: 560, h: 560 }, onDesktop: true, inDock: false,
    icon: (
      <>
        <path d="M12 2.8l7.5 3.2v5.4c0 5-3.2 8.7-7.5 10.1-4.3-1.4-7.5-5.1-7.5-10.1V6L12 2.8z" fill="currentColor" fillOpacity="0.16" stroke="none" />
        <path d="M12 2.8l7.5 3.2v5.4c0 5-3.2 8.7-7.5 10.1-4.3-1.4-7.5-5.1-7.5-10.1V6L12 2.8z" />
        <path d="M12 11v4.8" />
        <circle cx="12" cy="8.1" r="1.1" fill="currentColor" stroke="none" />
      </>
    ),
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
