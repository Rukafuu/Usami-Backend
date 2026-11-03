import { sameOrigin } from "./guard"
import { buildMessages, cleanHistory, endsWithQuestion, MAX_BODY } from "./messages"
import { errorStream, SSE_HEADERS, translate } from "./sse"
import { visitorKey, type Verdict } from "./limiter-core"
import type { Locale } from "./types"

export type AssistantEnv = {
  NVIDIA_API_KEY?: string
  NVIDIA_MODEL?: string
  DAILY_LIMIT?: string
  LIMITER: { getByName(name: string): { take(key: string, dailyLimit: number): Promise<Verdict> } }
}

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
const DEFAULT_MODEL = "poolside/laguna-xs-2.1"
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } })

/**
 * POST /:locale/assistant  { messages: [{role, content}, ...] }  ->  text/event-stream
 * Same contract the Rails endpoint had. The visitor's text is only forwarded to the AI provider: never stored, never logged.
 */
export async function handleAssistant(
  request: Request,
  env: AssistantEnv,
  locale: Locale,
  prompts: Record<string, string>,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403)
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY) return json({ error: "too_large" }, 413)

  const raw = await request.text()
  if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413)
  let body: { messages?: unknown }
  try {
    body = JSON.parse(raw) as { messages?: unknown }
  } catch {
    return json({ error: "empty" }, 422)
  }
  const turns = cleanHistory(body.messages)
  if (!endsWithQuestion(turns)) return json({ error: "empty" }, 422)

  const key = env.NVIDIA_API_KEY?.trim()
  const system = prompts[locale]
  if (!key || !system) return json({ error: "unavailable" }, 503)

  // Fail closed: if the limiter cannot answer, nothing is sent to the provider.
  const now = Date.now()
  let verdict: Verdict
  try {
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown"
    verdict = await env.LIMITER.getByName("main").take(await visitorKey(ip, now), Number(env.DAILY_LIMIT ?? 400))
  } catch {
    verdict = "day"
  }
  if (verdict !== "ok") return new Response(JSON.stringify({ error: "busy" }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60", "Cache-Control": "no-store" } })

  try {
    const upstream = await fetcher(NVIDIA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: env.NVIDIA_MODEL?.trim() || DEFAULT_MODEL, messages: buildMessages(system, turns), max_tokens: 500, temperature: 0.4, stream: true }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!upstream.ok || !upstream.body) return new Response(errorStream("provider"), { headers: SSE_HEADERS })
    return new Response(translate(upstream.body), { headers: SSE_HEADERS })
  } catch {
    return new Response(errorStream("provider"), { headers: SSE_HEADERS })
  }
}