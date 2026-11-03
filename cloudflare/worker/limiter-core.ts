/** Minimal SQL surface the limiter needs, so the rules can be tested without Cloudflare. */
export interface Sql {
  exec(query: string, ...bindings: (string | number)[]): { toArray(): Record<string, string | number>[] }
}

export const PER_MINUTE = 8
export const PER_HOUR = 60

export type Verdict = "ok" | "minute" | "hour" | "day"

export function ensureSchema(sql: Sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS hits (k TEXT NOT NULL, t INTEGER NOT NULL)")
  sql.exec("CREATE INDEX IF NOT EXISTS hits_k ON hits (k, t)")
  sql.exec("CREATE TABLE IF NOT EXISTS day (d TEXT PRIMARY KEY, n INTEGER NOT NULL)")
}

const count = (sql: Sql, query: string, ...bindings: (string | number)[]) => Number(sql.exec(query, ...bindings).toArray()[0]?.n ?? 0)

/**
 * Counts one call for `key` (an already-scrambled visitor id) unless a limit is reached: per minute, per hour, and a
 * daily cap for everybody together (so a flood can never run up the bill). Rejected calls write nothing.
 */
export function take(sql: Sql, key: string, now: number, dailyLimit: number): Verdict {
  sql.exec("DELETE FROM hits WHERE t < ?", now - 3_600_000)
  if (count(sql, "SELECT COUNT(*) AS n FROM hits WHERE k = ? AND t > ?", key, now - 60_000) >= PER_MINUTE) return "minute"
  if (count(sql, "SELECT COUNT(*) AS n FROM hits WHERE k = ?", key) >= PER_HOUR) return "hour"

  const today = new Date(now).toISOString().slice(0, 10)
  sql.exec("DELETE FROM day WHERE d < ?", today)
  if (count(sql, "SELECT n FROM day WHERE d = ?", today) >= dailyLimit) return "day"

  sql.exec("INSERT INTO hits (k, t) VALUES (?, ?)", key, now)
  sql.exec("INSERT INTO day (d, n) VALUES (?, 1) ON CONFLICT(d) DO UPDATE SET n = n + 1", today)
  return "ok"
}

/** Visitors are identified only by a hash that changes every day, so nothing links a person across days. */
export async function visitorKey(ip: string, now: number): Promise<string> {
  const day = new Date(now).toISOString().slice(0, 10)
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${day}|${ip}`))
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("")
}