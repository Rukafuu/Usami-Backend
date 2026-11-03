import { useCallback, useEffect, useState } from "react"
import { AppContent } from "../AppContent"
import { AppMenu, useAppMenu } from "../components/AppMenu"
import { ClaudePet } from "../pet/ClaudePet"
import { Wallpaper } from "../Wallpaper"
import type { AppId } from "../registry"
import type { OsData, PageContext } from "../types"
import { useShell } from "../shell"
import { useWindows } from "../windows"
import { DesktopIcons } from "./DesktopIcons"
import { StartMenu } from "./StartMenu"
import { Taskbar } from "./Taskbar"
import { WindowFrame } from "./WindowFrame"

type Props = { data: OsData; page: PageContext; titles: Record<AppId, string>; onClassic: () => void }

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight })

/** Desktop paradigm: wallpaper with shortcuts, floating windows, taskbar with Start menu. */
export function DesktopShell({ data, page, titles, onClassic }: Props) {
  const order = useWindows((s) => s.order)
  const showPet = useShell((s) => s.pet)
  const [startOpen, setStartOpen] = useState(false)
  const closeStart = useCallback(() => setStartOpen(false), [])
  const appMenu = useAppMenu()
  const openWallpapers = () => {
    useShell.getState().showSettings("wallpaper")
    open("settings")
  }
  const open = (id: AppId) => useWindows.getState().open(id, viewport())

  // When the browser window changes size no window may stay out of reach.
  useEffect(() => {
    const clamp = () => useWindows.getState().clampAll(viewport())
    window.addEventListener("resize", clamp)
    return () => window.removeEventListener("resize", clamp)
  }, [])

  return (
    <div className="os os--desktop">
      <Wallpaper />
      <DesktopIcons data={data} titles={titles} onOpen={open} menu={(id) => appMenu.handlers(id, "desktop")} />

      {order.map((id) => (
        <WindowFrame key={id} id={id} title={titles[id]} ui={data.ui.shell}>
          <AppContent id={id} data={data} page={page} />
        </WindowFrame>
      ))}

      {startOpen && <StartMenu data={data} titles={titles} onOpen={open} onClassic={onClassic} onClose={closeStart} onPet={() => useShell.getState().celebrate()} onWallpapers={openWallpapers} menu={(id) => appMenu.handlers(id, "start")} />}
      <Taskbar
        data={data}
        titles={titles}
        startOpen={startOpen}
        onToggleStart={() => setStartOpen((o) => !o)}
        onActivate={(id) => useWindows.getState().activate(id, viewport())}
        onOpenLanguage={() => {
          useShell.getState().showSettings("language")
          open("settings")
        }}
        menu={(id) => appMenu.handlers(id, "taskbar")}
      />
      {showPet && data.ui.claude_pet?.lines?.length > 0 && <ClaudePet pet={data.ui.claude_pet} variant="desktop" />}
      <AppMenu state={appMenu.state} data={data} titles={titles} onOpenApp={open} onClose={appMenu.close} />
    </div>
  )
}
