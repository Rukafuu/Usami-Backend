import { useEffect, useState } from "react"
import { markBooted, prefersReducedMotion } from "../shell"

type Props = { name: string; lines: string[]; skipLabel: string; onDone: () => void }

const LINE_MS = 420

/** Short boot sequence. Any key or tap skips it; reduced motion skips it entirely. */
export function Boot({ name, lines, skipLabel, onDone }: Props) {
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion()) {
      markBooted()
      onDone()
      return
    }
    const done = () => {
      markBooted()
      setLeaving(true)
      window.setTimeout(onDone, 500)
    }
    const timer = window.setTimeout(
      () => (shown < lines.length ? setShown((n) => n + 1) : done()),
      shown < lines.length ? LINE_MS : 500,
    )
    const skip = () => {
      window.clearTimeout(timer)
      done()
    }
    window.addEventListener("keydown", skip, { once: true })
    window.addEventListener("pointerdown", skip, { once: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("keydown", skip)
      window.removeEventListener("pointerdown", skip)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown])

  return (
    <div className={`os-boot${leaving ? " is-leaving" : ""}`} role="status" aria-live="polite">
      <img src="/brand/logo-192.png" width="96" height="96" alt="" className="os-boot-logo" />
      <p className="os-boot-word">{name}</p>
      <pre className="os-boot-log">{lines.slice(0, shown).join("\n")}</pre>
      <p className="mono">{skipLabel}</p>
    </div>
  )
}
