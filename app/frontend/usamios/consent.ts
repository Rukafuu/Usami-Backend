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
  syncAnalytics()
}

/**
 * Cloudflare Web Analytics (cookieless page-view counts). The pages are static files that cannot know the visitor's
 * choice, so the beacon is added here, and only when a site token was configured at build time AND the visitor chose "all".
 */
export const syncAnalytics = () => {
  const token = document.getElementById("usamios")?.dataset.analyticsToken
  if (!token || getConsent() !== "all" || document.querySelector('script[src*="static.cloudflareinsights.com"]')) return
  const script = document.createElement("script")
  script.type = "module" // as in the snippet Cloudflare gives for sites it does not proxy
  script.src = "https://static.cloudflareinsights.com/beacon.min.js"
  script.setAttribute("data-cf-beacon", JSON.stringify({ token }))
  document.head.append(script)
}

const subscribe = (notify: () => void) => {
  window.addEventListener(EVENT, notify)
  return () => window.removeEventListener(EVENT, notify)
}

export const useConsent = (): Consent => useSyncExternalStore(subscribe, getConsent, () => "essential" as Consent)

/** The pages are static files, so they cannot know the visitor's choice: the page reads the cookie and adjusts itself. */
const syncWithCookie = () => {
  syncAnalytics()
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