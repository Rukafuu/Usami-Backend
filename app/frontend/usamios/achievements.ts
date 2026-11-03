import { create } from "zustand"

export type AchievementId =
  | "first_boot"
  | "terminal_opened"
  | "ide_visited"
  | "chatted_usami"
  | "all_projects"
  | "customizer"
  | "scratch_coder"
  | "easter_egg"

export const ACHIEVEMENT_IDS: AchievementId[] = [
  "first_boot",
  "terminal_opened",
  "ide_visited",
  "chatted_usami",
  "all_projects",
  "customizer",
  "scratch_coder",
  "easter_egg",
]

export const CORE_PROJECT_IDS = ["hane", "lira", "usami", "enois", "laya"] as const

const ACHIEVEMENTS_KEY = "usamios:achievements"
const VISITED_PROJECTS_KEY = "usamios:visited_projects"

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const writeJson = (key: string, value: unknown | null) => {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / private mode errors */
  }
}

export type AchievementsState = {
  unlocked: Partial<Record<AchievementId, string>>
  visitedProjects: string[]
  lastToast: AchievementId | null
  unlock: (id: AchievementId) => void
  recordProjectVisit: (projectId: string) => void
  dismissToast: () => void
  reset: () => void
}

export const useAchievements = create<AchievementsState>()((set) => ({
  unlocked: readJson<Partial<Record<AchievementId, string>>>(ACHIEVEMENTS_KEY, {}),
  visitedProjects: readJson<string[]>(VISITED_PROJECTS_KEY, []),
  lastToast: null,

  unlock: (id) =>
    set((s) => {
      if (s.unlocked[id]) return s
      const next = { ...s.unlocked, [id]: new Date().toISOString() }
      writeJson(ACHIEVEMENTS_KEY, next)
      return { unlocked: next, lastToast: id }
    }),

  recordProjectVisit: (projectId) =>
    set((s) => {
      const normalized = projectId.toLowerCase()
      if (!(CORE_PROJECT_IDS as readonly string[]).includes(normalized)) return s
      const visited = s.visitedProjects.includes(normalized)
        ? s.visitedProjects
        : [...s.visitedProjects, normalized]
      writeJson(VISITED_PROJECTS_KEY, visited)

      const allVisited = CORE_PROJECT_IDS.every((p) => visited.includes(p))
      if (allVisited && !s.unlocked.all_projects) {
        const nextUnlocked = { ...s.unlocked, all_projects: new Date().toISOString() }
        writeJson(ACHIEVEMENTS_KEY, nextUnlocked)
        return { visitedProjects: visited, unlocked: nextUnlocked, lastToast: "all_projects" }
      }
      return { visitedProjects: visited }
    }),

  dismissToast: () => set({ lastToast: null }),

  reset: () => {
    writeJson(ACHIEVEMENTS_KEY, null)
    writeJson(VISITED_PROJECTS_KEY, null)
    set({ unlocked: {}, visitedProjects: [], lastToast: null })
  },
}))
