#!/usr/bin/env node
// Measures a Claude Code session from its transcript (.jsonl) and prints the numbers
// config/content/build.yml needs. Nothing is estimated: every figure is summed from
// the `usage` blocks the API returned, or counted from the transcript itself.
//
//   node script/measure_session.mjs <transcript.jsonl>
//
// Definitions (kept explicit because "tokens spent" is ambiguous):
//   input_tokens          fresh input the model read at full price
//   cache_creation_tokens input written to the prompt cache
//   cache_read_tokens     cached input re-read on later turns (the same context counts again every turn)
//   output_tokens         tokens the model generated
import { readFileSync } from "node:fs"

const file = process.argv[2]
if (!file) {
  console.error("usage: node script/measure_session.mjs <transcript.jsonl>")
  process.exit(1)
}

const records = readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => {
  try { return JSON.parse(line) } catch { return null }
}).filter(Boolean)

// One API response can be written as several records (one per content block) with the same
// message id and the same usage. Count each response once, keeping the largest usage seen.
const responses = new Map()
const models = new Set()
for (const r of records) {
  const msg = r.message
  if (r.type !== "assistant" || !msg?.usage || !msg.id) continue
  if (msg.model && !msg.model.startsWith("<")) models.add(msg.model)
  const u = msg.usage
  const prev = responses.get(msg.id)
  if (!prev || (u.output_tokens ?? 0) >= (prev.output_tokens ?? 0)) responses.set(msg.id, u)
}

const totals = { input_tokens: 0, cache_creation_tokens: 0, cache_read_tokens: 0, output_tokens: 0 }
for (const u of responses.values()) {
  totals.input_tokens += u.input_tokens ?? 0
  totals.cache_creation_tokens += u.cache_creation_input_tokens ?? 0
  totals.cache_read_tokens += u.cache_read_input_tokens ?? 0
  totals.output_tokens += u.output_tokens ?? 0
}

const SYSTEM_PREFIXES = ["[SYSTEM NOTIFICATION", "<task-notification", "<ci-monitor-event", "<side-sessions-event", "Caveat:", "<command-"]
const stripReminders = (text) => text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim()

let prompts = 0
for (const r of records) {
  if (r.type !== "user" || r.isMeta || r.isSidechain) continue
  const content = r.message?.content
  const blocks = typeof content === "string" ? [{ type: "text", text: content }] : Array.isArray(content) ? content : []
  if (blocks.some((b) => b.type === "tool_result")) continue
  const text = stripReminders(blocks.filter((b) => b.type === "text").map((b) => b.text).join("\n"))
  const hasImage = blocks.some((b) => b.type === "image")
  if (!text && !hasImage) continue
  if (SYSTEM_PREFIXES.some((p) => text.startsWith(p))) continue
  prompts += 1
}

const stamps = records.map((r) => Date.parse(r.timestamp)).filter(Number.isFinite)
const started = new Date(Math.min(...stamps)).toISOString()
const ended = new Date(Math.max(...stamps)).toISOString()

console.log(JSON.stringify({
  measured_at: new Date().toISOString(),
  started_at: started,
  last_activity_at: ended,
  models: [...models].sort(),
  api_responses: responses.size,
  prompts,
  ...totals,
  total_tokens: totals.input_tokens + totals.cache_creation_tokens + totals.output_tokens,
}, null, 2))
