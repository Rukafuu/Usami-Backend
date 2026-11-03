import type { Turn } from "./types"

export const MAX_TURNS = 6
export const MAX_CHARS = 600
export const MAX_BODY = 8_000

/** Last turns only, only user/assistant roles, bounded text. A visitor can never smuggle in a "system" turn. */
export function cleanHistory(history: unknown): Turn[] {
  if (!Array.isArray(history)) return []
  const turns: Turn[] = []
  for (const item of history) {
    if (typeof item !== "object" || item === null) continue
    const { role, content } = item as { role?: unknown; content?: unknown }
    if (role !== "user" && role !== "assistant") continue
    const text = typeof content === "string" ? content.trim().slice(0, MAX_CHARS) : ""
    if (text) turns.push({ role, content: text })
  }
  return turns.slice(-MAX_TURNS)
}

/** The visitor must be asking something: the last turn is theirs and has text. */
export const endsWithQuestion = (turns: Turn[]): boolean => turns.at(-1)?.role === "user"

export const buildMessages = (system: string, turns: Turn[]): Turn[] => [{ role: "system", content: system }, ...turns]