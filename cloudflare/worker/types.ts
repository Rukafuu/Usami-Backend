export type Locale = "pt" | "en" | "es" | "ja"
export const LOCALES: Locale[] = ["pt", "en", "es", "ja"]

export type Turn = { role: "user" | "assistant" | "system"; content: string }