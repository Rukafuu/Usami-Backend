import { useEffect, useState } from "react"
import { useAchievements } from "./achievements"
import { Boot } from "./components/Boot"
import { UninstallDialog } from "./components/UninstallDialog"
import { DesktopShell } from "./desktop/DesktopShell"
import { Celebration, useKonami } from "./eggs"
import { MobileShell } from "./mobile/MobileShell"
import { APP_IDS, type AppId } from "./registry"
import { applyPrefs, DEFAULT_PREFS, hasBooted, useShell, type Prefs } from "./shell"
import type { OsData, PageContext } from "./types"
import { useIsMobile } from "./useIsMobile"
import { useWindows } from "./windows"

type Props = { data: OsData; page: PageContext }

const CLASSIC_PARTS = "body > .skip, body > header.bar, body > main, body > footer"

const FALLBACK_TITLES: Record<AppId, string> = {
  browser: "Navegador",
  files: "Arquivos",
  code: "Usami Code Studio",
  messenger: "Usami Messenger",
  music: "Usami Music",
  gallery: "Galeria",
  terminal: "Terminal",
  achievements: "Conquistas",
  calendar: "Calendário",
  taskmgr: "Gerenciador de tarefas",
  settings: "Configurações",
  about: "Sobre o sistema",
  quote: "Orçamento",
}

const bootStrings = (shell: OsData["ui"]["shell"]) => ({
  skip: shell.boot_skip,
  boot: shell.boot,
  loginUser: shell.login_user,
  loginNote: shell.login_note,
  loginAction: shell.login_action,
  initTitle: shell.init_title,
  init: shell.init,
})

const pickPrefs =(state: Prefs): Prefs =>
  Object.fromEntries((Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]).map((k) => [k, state[k]])) as Prefs

/**
 * UsamiOS layered over the server-rendered site. The classic page stays in the DOM
 * (crawlers, screen readers, no-JS visitors) and is made inert while the OS is up.
 */
export function App({ data, page }: Props) {
  const mode = useShell((s) => s.mode)
  const celebrating = useShell((s) => s.celebrating)
  const windows = useWindows((s) => s.windows)
  const isMobile = useIsMobile()
  const [booted, setBooted] = useState(hasBooted() || page.slug !== null)

  useKonami(() => useShell.getState().celebrate())

  useEffect(() => {
    if (mode === "os" && booted) useAchievements.getState().unlock("first_boot")
  }, [mode, booted])

  useEffect(() => {
    if (windows.terminal) useAchievements.getState().unlock("terminal_opened")
    if (windows.code) useAchievements.getState().unlock("ide_visited")
  }, [windows.terminal, windows.code])

  useEffect(() => {
    if (celebrating) useAchievements.getState().unlock("easter_egg")
  }, [celebrating])

  // Preferences live on <html> as data attributes; re-apply on any change and when the system theme flips.
  useEffect(() => {
    const apply = () => applyPrefs(pickPrefs(useShell.getState()))
    apply()
    const unsubscribe = useShell.subscribe(apply)
    const media = window.matchMedia("(prefers-color-scheme: light)")
    media.addEventListener("change", apply)
    return () => {
      unsubscribe()
      media.removeEventListener("change", apply)
    }
  }, [])

  useEffect(() => {
    const toggle = document.querySelector<HTMLButtonElement>("[data-shell-open]")
    if (toggle) toggle.hidden = mode === "os"
    if (mode !== "os") return
    const parts = Array.from(document.querySelectorAll<HTMLElement>(CLASSIC_PARTS))
    parts.forEach((el) => el.setAttribute("inert", ""))
    return () => parts.forEach((el) => el.removeAttribute("inert"))
  }, [mode])

  // Arriving on a file's own URL opens it straight away in the file explorer.
  useEffect(() => {
    if (mode === "os" && booted && page.slug) {
      useWindows.getState().open("files", { width: window.innerWidth, height: window.innerHeight })
    }
  }, [mode, booted, page.slug])

  if (mode !== "os") return null

  const titles = Object.fromEntries(APP_IDS.map((id) => [id, data.ui.apps[id] || FALLBACK_TITLES[id]])) as Record<AppId, string>
  const normalizedData: OsData = {
    ...data,
    ui: {
      ...data.ui,
      apps: { ...data.ui.apps, ...titles },
    },
  }
  const toClassic = () => useShell.getState().setMode("classic")
  const Shell = isMobile ? MobileShell : DesktopShell

  return (
    <>
      <Shell data={normalizedData} page={page} titles={titles} onClassic={toClassic} />
      <UninstallDialog data={normalizedData} titles={titles} />
      {celebrating && <Celebration data={normalizedData} onDone={() => useShell.getState().celebrate(false)} />}
      {!booted && <Boot name={normalizedData.site.osName} strings={bootStrings(normalizedData.ui.shell)} onDone={() => setBooted(true)} />}
    </>
  )
}