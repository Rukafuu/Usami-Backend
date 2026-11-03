import { useEffect, useRef, useState, type FormEvent } from "react"
import { markBooted, prefersReducedMotion } from "../shell"

type Strings = {
  skip: string
  boot: string[]
  loginUser: string
  loginNote: string
  loginAction: string
  initTitle: string
  init: string[]
}
type Props = { name: string; strings: Strings; onDone: () => void }
type Phase = "boot" | "login" | "init"

const BOOT_LINE_MS = 280
const INIT_LINE_MS = 520
const PASSWORD_LENGTH = 8
const TYPE_MS = 120
const LEAVE_MS = 500

/**
 * Startup sequence in three acts: kernel-style boot log, a decorative guest login, and desktop initialisation.
 * Nothing here is real authentication or loading; the login note says so. Any key or tap moves to the next act,
 * and reduced motion skips the whole thing.
 */
export function Boot({ name, strings, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("boot")
  const [lines, setLines] = useState(0)
  const [typed, setTyped] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const finish = () => {
    markBooted()
    setLeaving(true)
    window.setTimeout(onDone, LEAVE_MS)
  }

  useEffect(() => {
    if (!prefersReducedMotion()) return
    markBooted()
    onDone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Act 1: boot log, then on to the login screen.
  useEffect(() => {
    if (phase !== "boot") return
    const timer = window.setTimeout(
      () => (lines < strings.boot.length ? setLines((n) => n + 1) : setPhase("login")),
      lines < strings.boot.length ? BOOT_LINE_MS : 600,
    )
    return () => window.clearTimeout(timer)
  }, [phase, lines, strings.boot.length])

  // Act 2: a guest "types" a password, then signs in on their own unless the visitor clicks first.
  useEffect(() => {
    if (phase !== "login") return
    const timer = window.setTimeout(
      () => (typed < PASSWORD_LENGTH ? setTyped((n) => n + 1) : setPhase("init")),
      typed === 0 ? 700 : typed < PASSWORD_LENGTH ? TYPE_MS : 800,
    )
    return () => window.clearTimeout(timer)
  }, [phase, typed])

  // Focused a beat late: the Enter that skipped the boot log must not also press the new button.
  useEffect(() => {
    if (phase !== "login") return
    const timer = window.setTimeout(() => buttonRef.current?.focus(), 250)
    return () => window.clearTimeout(timer)
  }, [phase])

  // Act 3: desktop initialisation lines, then fade out.
  const [initLine, setInitLine] = useState(0)
  useEffect(() => {
    if (phase !== "init") return
    const timer = window.setTimeout(
      () => (initLine < strings.init.length ? setInitLine((n) => n + 1) : finish()),
      INIT_LINE_MS,
    )
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, initLine, strings.init.length])

  // Any key or tap moves along. The login form handles its own button, so Enter there is not doubled.
  useEffect(() => {
    const next = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(".os-login button")) return
      if (phase === "boot") setPhase("login")
      else if (phase === "login") setPhase("init")
      else finish()
    }
    window.addEventListener("keydown", next)
    window.addEventListener("pointerdown", next)
    return () => {
      window.removeEventListener("keydown", next)
      window.removeEventListener("pointerdown", next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const signIn = (event: FormEvent) => {
    event.preventDefault()
    setPhase("init")
  }

  return (
    <div className={`os-boot is-${phase}${leaving ? " is-leaving" : ""}`} role="status" aria-live="polite">
      {phase === "boot" && (
        <>
          <img src="/brand/logo-192.png" width="96" height="96" alt="" className="os-boot-logo" />
          <p className="os-boot-word">{name}</p>
          <pre className="os-boot-log" aria-hidden="true">
            {strings.boot
              .slice(0, lines)
              .map((line, i) => (i === 0 ? line : `[  OK  ] ${line}`))
              .join("\n")}
          </pre>
          <div className="os-boot-bar" aria-hidden="true">
            <span style={{ width: `${(lines / strings.boot.length) * 100}%` }} />
          </div>
        </>
      )}

      {phase === "login" && (
        <form className="os-login" onSubmit={signIn}>
          <img src="/brand/logo-192.png" width="88" height="88" alt="" className="os-login-avatar" />
          <p className="os-login-user">{strings.loginUser}</p>
          <div className="os-login-field" aria-hidden="true">
            {"•".repeat(typed) || " "}
            <span className="os-login-caret" />
          </div>
          <button type="submit" ref={buttonRef} className="os-login-go">{strings.loginAction}</button>
          <p className="os-login-note">{strings.loginNote}</p>
        </form>
      )}

      {phase === "init" && (
        <>
          <span className="os-spinner" aria-hidden="true" />
          <p className="os-init-title">{strings.initTitle}</p>
          <pre className="os-boot-log" aria-hidden="true">{strings.init.slice(0, initLine).join("\n")}</pre>
        </>
      )}

      <p className="mono os-boot-skip">{strings.skip}</p>
    </div>
  )
}
