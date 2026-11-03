import { safeReturnPath, sameOrigin } from "./guard"
import type { Locale } from "./types"

export const CONSENT_COOKIE = "usami_consent"
const MAX_AGE = 60 * 60 * 24 * 180

/** POST /:locale/consentimento (the banner works as a plain form without JavaScript). Saves the choice in a cookie. */
export async function handleConsent(request: Request, locale: Locale): Promise<Response> {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 })
  const form = await request.formData().catch(() => null)
  const choice = form?.get("choice")
  if (choice !== "essential" && choice !== "all") return new Response("Unprocessable", { status: 422 })

  const back = safeReturnPath(form?.get("return_to"), `/${locale}`)
  return new Response(null, {
    status: 303,
    headers: {
      Location: back,
      "Set-Cookie": `${CONSENT_COOKIE}=${choice}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax; Secure`,
      "Cache-Control": "no-store",
    },
  })
}