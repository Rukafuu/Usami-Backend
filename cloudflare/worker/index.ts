import { handleAssistant, type AssistantEnv } from "./assistant"
import { handleConsent } from "./consent"
import { preferredLocale } from "./locale"
import prompts from "./prompts.generated.json"
import { LOCALES, type Locale } from "./types"

export { Limiter } from "./limiter"

type Env = AssistantEnv & { ASSETS: Fetcher }

const ROUTE = new RegExp(`^/(${LOCALES.join("|")})/(assistant|consentimento)$`)

/**
 * The site itself is static files (served by Cloudflare's asset layer). Only three things need code, so only these
 * paths reach this Worker (see "run_worker_first" in wrangler.jsonc): the language redirect on "/", the assistant, and
 * saving the cookie choice.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === "/") {
      const locale = preferredLocale(request.headers.get("Accept-Language"))
      return new Response(null, { status: 302, headers: { Location: `/${locale}`, Vary: "Accept-Language", "Cache-Control": "no-store" } })
    }

    const match = ROUTE.exec(url.pathname)
    if (match) {
      const locale = match[1] as Locale
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } })
      return match[2] === "assistant" ? handleAssistant(request, env, locale, prompts) : handleConsent(request, locale)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>