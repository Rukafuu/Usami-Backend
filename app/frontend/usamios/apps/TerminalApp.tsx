import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { complete, run } from "../terminal/commands"
import { useShell } from "../shell"
import type { OsData } from "../types"
import { useWindows } from "../windows"

type Line = { text: string; kind: "in" | "out" | "art" }

/** A simulated shell over the site's own content. No real command is ever executed. */
export function TerminalApp({ data }: { data: OsData }) {
  const [cwd, setCwd] = useState("/")
  const [lines, setLines] = useState<Line[]>(() => [{ text: data.ui.terminal.welcome ?? "", kind: "out" }])
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const log = useRef<HTMLDivElement>(null)

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [lines])

  const prompt = `visitante@fuwarch:${cwd}$`

  const submit = async (value: string) => {
    const result = run(value, cwd, data)
    // The big mascot drawing is a separate chunk, fetched only when someone runs neofetch.
    const art: Line[] = result.art ? [{ text: (await import("../terminal/fuwarch-art.txt?raw")).default.trimEnd(), kind: "art" }] : []
    if (result.effect?.type === "clear") {
      setLines([])
    } else {
      setLines((l) => [...l, { text: `${prompt} ${value}`, kind: "in" }, ...art, ...result.lines.map((text) => ({ text, kind: "out" as const }))])
    }
    if (result.cwd) setCwd(result.cwd)
    if (value.trim()) {
      setHistory((h) => [...h, value])
      setCursor(history.length + 1)
    }
    const effect = result.effect
    if (effect?.type === "open") {
      useShell.getState().showInFiles({ folder: effect.folder, id: effect.id })
      useWindows.getState().open("files", { width: window.innerWidth, height: window.innerHeight })
    }
    if (effect?.type === "code") {
      useShell.getState().showInCode(effect.id)
      useWindows.getState().open("code", { width: window.innerWidth, height: window.innerHeight })
    }
    if (effect?.type === "app") {
      useWindows.getState().open(effect.id, { width: window.innerWidth, height: window.innerHeight })
    }
    if (effect?.type === "exit") useWindows.getState().close("terminal")
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    if (e.key === "Enter") {
      void submit(el.value)
      el.value = ""
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const next = Math.max(0, cursor - 1)
      setCursor(next)
      el.value = history[next] ?? ""
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const next = Math.min(history.length, cursor + 1)
      setCursor(next)
      el.value = history[next] ?? ""
    } else if (e.key === "Tab") {
      e.preventDefault()
      const options = complete(el.value, cwd, data)
      if (options.length === 1) {
        const words = el.value.split(/\s+/)
        words[words.length - 1] = options[0] ?? ""
        el.value = words.join(" ")
      } else if (options.length > 1) {
        setLines((l) => [...l, { text: `${prompt} ${el.value}`, kind: "in" }, { text: options.join("  "), kind: "out" }])
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  return (
    <div className="os-term" onClick={() => input.current?.focus()}>
      <div ref={log} className="os-term-log" aria-live="polite" role="log">
        {lines.map((line, i) => (
          <pre key={i} className={line.kind === "in" ? "is-in" : line.kind === "art" ? "is-art" : undefined} aria-hidden={line.kind === "art" ? true : undefined}>
            {line.text}
          </pre>
        ))}
      </div>
      <label className="os-term-row">
        <span className="os-term-prompt">{prompt}</span>
        <input ref={input} type="text" spellCheck={false} autoComplete="off" autoCapitalize="off" aria-label="Terminal" onKeyDown={onKeyDown} />
      </label>
    </div>
  )
}
