import { useSyncExternalStore } from "react"

export type Consent = "essential" | "all"

const COOKIE = "usami_consent"
const EVENT = "usami:consent"
const MAX_AGE = 60 * 60 * 24 * 180

/** The visitor's cookie choice. Until they choose, only essentials are active. */
export const getConsent = (): Consent => {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`))
  return match?.split("=")[1] === "all" ? "all" : "essential"
}

export const hasChosen = (): boolean => /(?:^|; )usami_consent=(all|essential)(?:;|$)/.test(document.cookie)

/** Saves the choice in the same first-party cookie the server uses, and tells the page. */
export const setConsent = (choice: Consent) => {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${COOKIE}=${choice}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`
  document.querySelector<HTMLElement>("[data-consent-banner]")?.setAttribute("hidden", "")
  window.dispatchEvent(new Event(EVENT))
}

const subscribe = (notify: () => void) => {
  window.addEventListener(EVENT, notify)
  return () => window.removeEventListener(EVENT, notify)
}

export const useConsent = (): Consent => useSyncExternalStore(subscribe, getConsent, () => "essential" as Consent)

/** The pages are static files, so they cannot know the visitor's choice: the page reads the cookie and adjusts itself. */
const syncWithCookie = () => {
  if (!hasChosen()) return
  document.querySelector<HTMLElement>("[data-consent-banner]")?.setAttribute("hidden", "")
  const note = document.querySelector<HTMLElement>("[data-consent-current]")
  if (note) note.textContent = note.getAttribute(getConsent() === "all" ? "data-all" : "data-essential")
}

/** The banner is a plain form (works without JavaScript); with JavaScript we save the choice without reloading. */
export const wireConsentForms = () => {
  syncWithCookie()
  document.addEventListener("submit", (event) => {
    const form = (event.target as HTMLElement | null)?.closest<HTMLFormElement>("[data-consent-form]")
    if (!form) return
    const choice = (event.submitter as HTMLButtonElement | null)?.value
    if (choice !== "essential" && choice !== "all") return
    event.preventDefault()
    setConsent(choice)
    const note = form.parentElement?.querySelector("[data-consent-current]")
    if (note) note.textContent = choice === "all" ? note.getAttribute("data-all") : note.getAttribute("data-essential")
  })
}