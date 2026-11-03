import { createRoot } from "react-dom/client"
import "../styles/usamios.css"
import { App } from "../usamios/App"
import { printConsoleGreeting } from "../usamios/eggs"
import { wireConsentForms } from "../usamios/consent"
import { useShell } from "../usamios/shell"
import type { Locale, OsData, PageContext } from "../usamios/types"

const mount = document.getElementById("usamios")

wireConsentForms()

async function start(el: HTMLElement) {
  const { endpoint, locale, folder, slug, alternates } = el.dataset
  if (!endpoint || !locale || !alternates) return

  // If anything goes wrong the server-rendered page simply stays as it is.
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } })
  if (!response.ok) return
  const data = (await response.json()) as OsData

  const page: PageContext = {
    locale: locale as Locale,
    folder: folder || null,
    slug: slug || null,
    alternates: JSON.parse(alternates) as Record<Locale, string>,
  }

  // Easter egg for whoever opens the developer tools (F12): the mascot, a joke and a way to reach Lucas.
  const contact = data.entries.find((e) => e.id === "lucas")?.sources.find((s) => s.url)?.url
  if (contact) printConsoleGreeting(data, contact)

  document.querySelector("[data-shell-open]")?.addEventListener("click", () => useShell.getState().setMode("os"))
  createRoot(el).render(<App data={data} page={page} />)
}

if (mount) start(mount).catch(() => undefined)
