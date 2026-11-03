export type Turn = { role: "user" | "assistant"; content: string }

/** Why the live assistant could not answer; the chat then falls back to its verified canned replies. */
export type AssistantFailure = "unavailable" | "busy" | "provider" | "network"

const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ""

/**
 * Streams Usami's answer from /:locale/assistant (server-sent events) and calls `onText` with each piece.
 * Resolves with null on success, or the reason it failed. Nothing about the visitor is stored client-side.
 */
export async function askAssistant(locale: string, messages: Turn[], onText: (piece: string) => void, signal?: AbortSignal): Promise<AssistantFailure | null> {
  let response: Response
  try {
    response = await fetch(`/${locale}/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream", "X-CSRF-Token": csrf() },
      body: JSON.stringify({ messages }),
      signal,
    })
  } catch {
    return "network"
  }
  if (response.status === 429) return "busy"
  if (!response.ok || !response.body) return response.status === 503 ? "unavailable" : "network"

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let failure: AssistantFailure | null = null
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let end: number
      while ((end = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        const event = /^event: (.+)$/m.exec(block)?.[1]
        const data = /^data: (.+)$/m.exec(block)?.[1]
        if (event === "delta" && data) onText((JSON.parse(data) as { text: string }).text)
        else if (event === "error") failure = "provider"
      }
    }
  } catch {
    return failure ?? "network"
  }
  return failure
}