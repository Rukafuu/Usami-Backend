const encoder = new TextEncoder()
const decoder = new TextDecoder()

/** One server-sent event, in the same shape the Rails endpoint used: "delta" {text}, "done" {}, "error" {code}. */
export const event = (name: "delta" | "done" | "error", data: unknown): Uint8Array =>
  encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Accel-Buffering": "no",
}

/** The text piece inside one line of the provider's stream, or null. Whitespace-only pieces are real text. */
export function parseDelta(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith("data:")) return null
  const payload = trimmed.slice(5).trim()
  if (!payload || payload === "[DONE]") return null
  try {
    const text = (JSON.parse(payload) as { choices?: { delta?: { content?: unknown } }[] }).choices?.[0]?.delta?.content
    return typeof text === "string" && text.length > 0 ? text : null
  } catch {
    return null
  }
}

/** Turns the provider's stream (OpenAI style) into our events. Any failure becomes one "error" event, never details. */
export function translate(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = upstream.getReader()
  let buffer = ""
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        // Keep reading until there is something to hand over: a stream is only asked for more after it delivered data.
        for (;;) {
          const { done, value } = await reader.read()
          if (done) {
            controller.enqueue(event("done", {}))
            controller.close()
            return
          }
          buffer += decoder.decode(value, { stream: true })
          let delivered = false
          let newline = buffer.indexOf("\n")
          while (newline >= 0) {
            const text = parseDelta(buffer.slice(0, newline))
            buffer = buffer.slice(newline + 1)
            if (text) {
              controller.enqueue(event("delta", { text }))
              delivered = true
            }
            newline = buffer.indexOf("\n")
          }
          if (delivered) return
        }
      } catch {
        controller.enqueue(event("error", { code: "provider" }))
        controller.close()
      }
    },    cancel() {
      void reader.cancel()
    },
  })
}

export const errorStream = (code: string): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(event("error", { code }))
      controller.close()
    },
  })