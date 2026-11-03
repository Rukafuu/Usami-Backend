/** Requests that change anything must come from our own pages (the Worker has no sessions, so this replaces CSRF tokens). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin")
  if (!origin) return false
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

/** A local path only, so a return address can never send anybody to another site. */
export function safeReturnPath(value: unknown, fallback: string): string {
  const path = typeof value === "string" ? value : ""
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : fallback
}