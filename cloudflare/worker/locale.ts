import { LOCALES, type Locale } from "./types"

/** "/" has no content of its own: the language the browser asked for, else Portuguese. */
export function preferredLocale(acceptLanguage: string | null): Locale {
  const asked = (acceptLanguage ?? "")
    .split(",")
    .map((part) => /^\s*([a-z]{2})/i.exec(part)?.[1]?.toLowerCase())
  return (asked.find((code): code is Locale => !!code && (LOCALES as string[]).includes(code)) ?? "pt") as Locale
}