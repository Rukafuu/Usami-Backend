import { sameOrigin } from "./guard"
import { visitorKey, type Verdict } from "./limiter-core"
import type { Locale } from "./types"

export type ContactEnv = {
  RESEND_API_KEY?: string
  CONTACT_TO?: string
  LIMITER: { getByName(name: string): { take(key: string, dailyLimit: number): Promise<Verdict> } }
}

// Same rules as app/models/contact_request.rb: change both together.
export const SERVICES = ["design_engineering", "design_system", "ai_agents", "fullstack", "consulting"] as const
export const BUDGETS = ["under_5k", "5k_to_15k", "15k_to_30k", "over_30k", "international_usd"] as const
export const TIMELINES = ["urgent", "standard", "flexible"] as const
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_BODY = 20_000
const DAILY_LIMIT = 30

export type Quote = { name: string; email: string; handle: string; services: string[]; budget: string; timeline: string; details: string }
export type Parsed = { spam: true } | { spam: false; quote: Quote } | { spam: false; errors: string[] }

/** The form's fields arrive as contact_request[field] (Rails) or plain names. */
const field = (form: FormData, name: string) => String(form.get(`contact_request[${name}]`) ?? form.get(name) ?? "").trim()
const list = (form: FormData, name: string) => [...form.getAll(`contact_request[${name}][]`), ...form.getAll(`${name}[]`)].map(String).filter(Boolean)

export function parseQuote(form: FormData): Parsed {
  if (field(form, "honeypot")) return { spam: true }

  const quote: Quote = {
    name: field(form, "name"),
    email: field(form, "email"),
    handle: field(form, "contact_handle"),
    services: list(form, "services"),
    budget: field(form, "budget"),
    timeline: field(form, "timeline"),
    details: field(form, "details"),
  }
  const errors: string[] = []
  if (!quote.name || quote.name.length > 100) errors.push("name")
  if (!quote.email || quote.email.length > 120 || !EMAIL.test(quote.email)) errors.push("email")
  if (quote.handle.length > 100) errors.push("contact_handle")
  if (quote.details.length < 10 || quote.details.length > 4000) errors.push("details")
  if (quote.budget && !(BUDGETS as readonly string[]).includes(quote.budget)) errors.push("budget")
  if (quote.timeline && !(TIMELINES as readonly string[]).includes(quote.timeline)) errors.push("timeline")
  if (quote.services.some((s) => !(SERVICES as readonly string[]).includes(s))) errors.push("services")
  return errors.length ? { spam: false, errors } : { spam: false, quote }
}

export const subject = (q: Quote) => `Novo orçamento — ${q.name}`.slice(0, 120)

export function emailText(q: Quote, locale: Locale): string {
  return [
    `Nome: ${q.name}`,
    `E-mail: ${q.email}`,
    `Contato extra: ${q.handle || "—"}`,
    `Serviços: ${q.services.join(", ") || "—"}`,
    `Orçamento: ${q.budget || "—"}`,
    `Prazo: ${q.timeline || "—"}`,
    `Idioma do site: ${locale}`,
    "",
    q.details,
  ].join("\n")
}

const MESSAGES: Record<Locale, { invalid: string; failed: string; back: string }> = {
  pt: { invalid: "Confira os campos do formulário (nome, e-mail e uma descrição de pelo menos 10 caracteres).", failed: "Não consegui enviar agora. Escreva direto para", back: "Voltar ao formulário" },
  en: { invalid: "Please check the form fields (name, email and a description of at least 10 characters).", failed: "I could not send it right now. Please write directly to", back: "Back to the form" },
  es: { invalid: "Revisa los campos del formulario (nombre, correo y una descripción de al menos 10 caracteres).", failed: "No pude enviarlo ahora. Escribe directamente a", back: "Volver al formulario" },
  ja: { invalid: "フォームの入力内容（お名前、メール、10文字以上の内容）をご確認ください。", failed: "現在送信できません。次のアドレスへ直接ご連絡ください:", back: "フォームに戻る" },
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

/** The OS app posts with "Accept: application/json" and gets a status code it can show in its own window. */
const wantsJson = (request: Request) => (request.headers.get("Accept") ?? "").includes("application/json")

function notice(locale: Locale, text: string, status: number, json = false): Response {
  if (json) return new Response(JSON.stringify({ error: status === 422 ? "invalid" : "failed" }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } })
  const back = MESSAGES[locale].back
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Usami</title></head><body><main><p>${escapeHtml(text)}</p><p><a href="/${locale}/contato">${escapeHtml(back)}</a></p></main></body></html>`
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } })
}
/**
 * POST /:locale/contato — the quote form (works as a plain form without JavaScript). Validates, rate-limits per visitor,
 * and sends the request to Lucas by email through Resend. Nothing is stored here.
 */
export async function handleContact(request: Request, env: ContactEnv, locale: Locale, fetcher: typeof fetch = fetch): Promise<Response> {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 })
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY) return new Response("Payload Too Large", { status: 413 })

  const json = wantsJson(request)
  const fail = (text: string, status: number) => notice(locale, text, status, json)
  const form = await request.formData().catch(() => null)
  if (!form) return fail(MESSAGES[locale].invalid, 422)

  const thanks = json
    ? new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } })
    : new Response(null, { status: 303, headers: { Location: `/${locale}/obrigado`, "Cache-Control": "no-store" } })
  const parsed = parseQuote(form)
  if (parsed.spam) return thanks // bots get the same answer as people, and nothing is sent
  if ("errors" in parsed) return fail(MESSAGES[locale].invalid, 422)

  const to = env.CONTACT_TO?.trim()
  const key = env.RESEND_API_KEY?.trim()
  if (!to || !key) return fail(`${MESSAGES[locale].failed} ${to ?? ""}`.trim(), 503)

  let verdict: Verdict
  try {
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown"
    verdict = await env.LIMITER.getByName("contact").take(await visitorKey(ip, Date.now()), DAILY_LIMIT)
  } catch {
    verdict = "day"
  }
  if (verdict !== "ok") return fail(`${MESSAGES[locale].failed} ${to}`, 429)

  try {
    const sent = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: "Usami <onboarding@resend.dev>", to: [to], reply_to: parsed.quote.email, subject: subject(parsed.quote), text: emailText(parsed.quote, locale) }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!sent.ok) return fail(`${MESSAGES[locale].failed} ${to}`, 502)
  } catch {
    return fail(`${MESSAGES[locale].failed} ${to}`, 502)
  }
  return thanks
}