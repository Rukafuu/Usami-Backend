import type { Entry, Locale } from "./types"

/** URL of a file's own page; the same URL the server renders for crawlers. */
export const entryPath = (locale: Locale, entry: Pick<Entry, "folder" | "id" | "route">) =>
  entry.route === "evidencias" ? `/${locale}/evidencias` : `/${locale}/${entry.folder}/${entry.id}`

export const folderPath = (locale: Locale, folder: string) => `/${locale}/${folder}`
