import { AboutApp } from "./apps/AboutApp"
import { AchievementsApp } from "./apps/AchievementsApp"
import { BrowserApp } from "./apps/BrowserApp"
import { CalendarApp } from "./apps/CalendarApp"
import { CodeStudioApp } from "./apps/CodeStudioApp"
import { FilesApp } from "./apps/FilesApp"
import { GalleryApp } from "./apps/GalleryApp"
import { MessengerApp } from "./apps/MessengerApp"
import { MusicApp } from "./apps/MusicApp"
import { SettingsApp } from "./apps/SettingsApp"
import { TaskManagerApp } from "./apps/TaskManagerApp"
import { TerminalApp } from "./apps/TerminalApp"
import type { AppId } from "./registry"
import type { OsData, PageContext } from "./types"

type Props = { id: AppId; data: OsData; page: PageContext }

/** Maps an app id to its content. Shared by desktop windows and phone screens. */
export function AppContent({ id, data, page }: Props) {
  switch (id) {
    case "browser":
      return <BrowserApp data={data} />
    case "files":
      return <FilesApp data={data} initial={{ folder: page.folder, slug: page.slug }} />
    case "code":
      return <CodeStudioApp data={data} />
    case "messenger":
      return <MessengerApp data={data} />
    case "music":
      return <MusicApp data={data} />
    case "gallery":
      return <GalleryApp data={data} />
    case "terminal":
      return <TerminalApp data={data} />
    case "achievements":
      return <AchievementsApp data={data} />
    case "calendar":
      return <CalendarApp data={data} />
    case "taskmgr":
      return <TaskManagerApp data={data} />
    case "settings":
      return <SettingsApp data={data} alternates={page.alternates} />
    case "about":
      return <AboutApp data={data} />
  }
}
