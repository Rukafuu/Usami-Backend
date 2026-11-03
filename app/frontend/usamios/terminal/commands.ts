import type { AppId } from "../registry"
import type { Entry, OsData } from "../types"
import { FUWARCH_BANNER } from "./ascii"

/**
 * The simulated shell. Pure: it reads the site's content and returns text plus an optional effect.
 * Nothing here touches the network, the file system or the real DOM, whatever the visitor types.
 */
export type Effect =
  | { type: "open"; folder: string; id: string }
  | { type: "code"; id: string }
  | { type: "app"; id: AppId }
  | { type: "exit" }
  | { type: "clear" }
/** `art` asks the terminal to print the full mascot drawing (loaded on demand) before `lines`. */
export type Result = { lines: string[]; cwd?: string; effect?: Effect; art?: "fuwarch" }

type Terminal = Record<string, string>
const msg = (t: Terminal, key: string) => t[key] ?? key

/** The destructive classics. They get a joke, never an action. */
const RM_ROOT = /^\s*(?:sudo\s+)?rm\s+(?:-[a-z]*\s+)*(?:--no-preserve-root\s+)?(?:-[a-z]*\s+)*\/\*?\s*$/i
const RECURSIVE_FORCE = /\s-(?:[a-z]*r[a-z]*f|[a-z]*f[a-z]*r)[a-z]*\b|\s-r\b.*\s-f\b|\s-f\b.*\s-r\b|\s--recursive\b|\s--force\b/i

export const isRmRoot = (line: string) => RM_ROOT.test(line) && RECURSIVE_FORCE.test(line)

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/%\{(\w+)\}/g, (_, key: string) => values[key] ?? "")

const dirOf = (cwd: string) => (cwd === "/" ? null : cwd.slice(1))

const resolveFile = (data: OsData, cwd: string, arg: string): Entry | undefined => {
  const parts = arg.replace(/^\//, "").split("/").filter(Boolean)
  const name = parts.pop()
  const folder = parts[0] ?? dirOf(cwd)
  return data.entries.find((e) => e.filename === name && (!folder || e.folder === folder))
}

const resolveDir = (data: OsData, cwd: string, arg: string): string | null => {
  if (arg === "" || arg === "/" || arg === "~") return "/"
  if (arg === ".." ) return "/"
  if (arg === ".") return cwd
  const name = arg.replace(/^\//, "").replace(/\/$/, "")
  return data.folders.includes(name) ? `/${name}` : null
}

function cat(data: OsData, entry: Entry): string[] {
  const { entry: labels, evidence } = data.ui
  const out = [entry.filename, "", entry.description]
  if (entry.proven.length) out.push("", `[${labels.proven}]`, ...entry.proven.map((p) => `  + ${p}`))
  if (entry.planned.length) out.push("", `[${labels.planned}]`, ...entry.planned.map((p) => `  - ${p}`))
  if (entry.route === "evidencias")
    out.push("", `[${evidence.title}]`, ...data.ledger.map((l) => `  ${l.verifiedOn}  ${l.claim}  <${l.url ?? l.source}>`))
  const links = entry.sources.filter((s) => s.url)
  if (links.length) out.push("", `[${labels.sources}]`, ...links.map((s) => `  > ${s.url}`))
  return out
}

function neofetch(data: OsData, t: Terminal): string[] {
  return [
    FUWARCH_BANNER,
    "-----------------------------",
    `OS:       ${data.site.osName} (emulado)`,
    `Version:  v${data.system.version}`,
    `Host:     browser`,
    `Shell:    fuwarch-sh 0.1`,
    `Files:    ${data.entries.length}`,
    `Company:  ${data.site.name}`,
    "",
    msg(t, "neofetch_note"),
  ]
}

function aboutInfo(data: OsData, t: Terminal): string[] {
  const out = [
    `${data.site.name} · ${data.site.osName} v${data.system.version}`,
    data.site.headline,
    "",
    data.site.description,
  ]
  if (data.site.pillars.length) {
    out.push("", ...data.site.pillars.map((p) => `  • ${p.title} — ${p.text}`))
  }
  out.push("", `(${msg(t, "neofetch_note")})`)
  return out
}

function projectsList(data: OsData): string[] {
  const items = data.entries.filter((e) => e.folder !== "empresa")
  return items.flatMap((e, idx) => {
    const badge = data.ui.status[e.status] ?? e.status
    const stack = e.stack.length ? ` [${e.stack.join(", ")}]` : ""
    const block = [`[${badge}] ${e.folder}/${e.filename}${stack}`, `  ${e.description}`]
    return idx === 0 ? block : ["", ...block]
  })
}

function skillsList(data: OsData): string[] {
  const stacks = [...new Set(data.entries.flatMap((e) => e.stack))]
  const out: string[] = []
  if (stacks.length) out.push(`[${data.ui.entry.stack}]`, `  ${stacks.join(" · ")}`)
  if (data.services.length) {
    if (out.length) out.push("")
    out.push(...data.services.map((s) => `  • ${s.title} — ${s.text}`))
  }
  return out
}

function contactInfo(data: OsData): string[] {
  const lucas = data.entries.find((e) => e.id === "lucas")
  const contact = data.entries.find((e) => e.id === "contact")
  const out: string[] = []
  if (lucas) {
    out.push(lucas.description)
    for (const s of lucas.sources) if (s.url) out.push(`  > ${s.label}: ${s.url}`)
  }
  if (contact) {
    if (out.length) out.push("")
    out.push(contact.description)
  }
  return out
}

export function run(line: string, cwd: string, data: OsData): Result {
  const t: Terminal = data.ui.terminal
  const trimmed = line.trim()
  if (!trimmed) return { lines: [] }

  if (isRmRoot(trimmed)) return { lines: [msg(t, "rm_root")] }

  const [command = "", ...rest] = trimmed.split(/\s+/)
  const arg = rest.join(" ")

  switch (command) {
    case "help":
      return { lines: msg(t, "help").split("\n") }
    case "about":
      return { lines: aboutInfo(data, t) }
    case "projects":
      return { lines: projectsList(data) }
    case "skills":
      return { lines: skillsList(data) }
    case "contact":
      return { lines: contactInfo(data) }
    case "usami": {
      if (arg && arg !== "--about" && arg !== "-a") {
        return { lines: [fill(msg(t, "usage"), { usage: "usami [--about]" })] }
      }
      const usamiEntry = data.entries.find((e) => e.id === "usami")
      return { lines: usamiEntry ? cat(data, usamiEntry) : [data.site.headline] }
    }
    case "ps":
      return {
        lines: [
          "PID  TTY   CMD",
          "01   ?     fuwarch-wm",
          "02   ?     vfs-content-store",
          "03   ?     theme-engine",
          "04   ?     usami-presence.d",
          "05   tty0  fuwarch-sh",
        ],
      }
    case "top":
      return { lines: [`→ ${data.ui.apps.taskmgr}`], effect: { type: "app", id: "taskmgr" } }
    case "code": {
      const cleaned = arg ? arg.replace(/\..*$/, "").toLowerCase() : "hane"
      const targetId = cleaned === "new" ? "scratch" : cleaned
      return { lines: [`→ ${data.ui.apps.code || "Usami Code Studio"} (${targetId})`], effect: { type: "code", id: targetId } }
    }
    case "cal":
    case "calendar":
      return { lines: [`→ ${data.ui.apps.calendar}`], effect: { type: "app", id: "calendar" } }
    case "msg":
    case "chat":
    case "messenger":
      return { lines: [`→ ${data.ui.apps.messenger || "Usami Messenger"}`], effect: { type: "app", id: "messenger" } }
    case "achievements":
      return { lines: [`→ ${data.ui.apps.achievements || "Conquistas"}`], effect: { type: "app", id: "achievements" } }
    case "music":
      return { lines: [`→ ${data.ui.apps.music || "Usami Music"}`], effect: { type: "app", id: "music" } }
    case "pwd":
      return { lines: [cwd] }
    case "whoami":
      return { lines: [msg(t, "whoami")] }
    case "clear":
      return { lines: [], effect: { type: "clear" } }
    case "exit":
      return { lines: [], effect: { type: "exit" } }
    case "neofetch":
      return { lines: neofetch(data, t), art: "fuwarch" }
    case "evidence": {
      const ledger = data.entries.find((e) => e.route === "evidencias")
      return ledger ? { lines: [`→ ${ledger.filename}`], effect: { type: "open", folder: ledger.folder, id: ledger.id } } : { lines: [] }
    }
    case "ls": {
      const target = arg ? resolveDir(data, cwd, arg) : cwd
      if (target === null) return { lines: [fill(msg(t, "no_such"), { path: arg })] }
      if (target === "/") return { lines: [data.folders.map((f) => `${f}/`).join("  ")] }
      return { lines: data.entries.filter((e) => e.folder === dirOf(target)).map((e) => e.filename) }
    }
    case "cd": {
      const target = resolveDir(data, cwd, arg)
      return target === null ? { lines: [fill(msg(t, "no_such"), { path: arg })] } : { lines: [], cwd: target }
    }
    case "cat":
    case "open": {
      if (!arg) return { lines: [fill(msg(t, "usage"), { usage: `${command} <file>` })] }
      const entry = resolveFile(data, cwd, arg)
      if (!entry) return { lines: [fill(msg(t, "no_such"), { path: arg })] }
      return command === "cat"
        ? { lines: cat(data, entry) }
        : { lines: [`→ ${entry.filename}`], effect: { type: "open", folder: entry.folder, id: entry.id } }
    }
    case "sudo":
      return { lines: [msg(t, "sudo")] }
    case "rm":
    case "mv":
    case "cp":
    case "mkdir":
    case "touch":
      return { lines: [msg(t, "read_only")] }
    default:
      return { lines: [fill(msg(t, "not_found"), { cmd: command })] }
  }
}

/** Tab completion: commands for the first word, flags or folders/files for the rest. */
export function complete(partial: string, cwd: string, data: OsData): string[] {
  const words = partial.split(/\s+/)
  const last = words[words.length - 1] ?? ""
  const commands = [
    "help", "about", "projects", "skills", "contact", "usami", "code", "messenger", "music", "achievements",
    "ls", "cd", "pwd", "cat", "open", "evidence", "ps", "top", "cal", "calendar", "neofetch", "whoami", "clear", "exit",
  ]
  const pool =
    words.length <= 1
      ? commands
      : words[0] === "usami"
        ? ["--about"]
        : words[0] === "code"
          ? ["hane", "lira", "laya", "usami", "enois", "scratch"]
          : cwd === "/"
          ? [...data.folders.map((f) => `${f}/`), ...data.entries.map((e) => `${e.folder}/${e.filename}`)]
          : data.entries.filter((e) => e.folder === dirOf(cwd)).map((e) => e.filename)
  return pool.filter((p) => p.startsWith(last))
}
