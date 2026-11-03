import { useEffect, useState } from "react"
import type { Locale } from "./types"

const format = (locale: Locale) => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date())

export function Clock({ locale, label, pressed, onClick }: { locale: Locale; label?: string; pressed?: boolean; onClick?: () => void }) {
  const [now, setNow] = useState(() => format(locale))
  useEffect(() => {
    setNow(format(locale))
    const id = window.setInterval(() => setNow(format(locale)), 15_000)
    return () => window.clearInterval(id)
  }, [locale])

  if (onClick) {
    return (
      <button type="button" className="os-clock os-clock-btn" aria-label={label ? `${label} (${now})` : now} aria-pressed={pressed} onClick={onClick}>
        <time>{now}</time>
      </button>
    )
  }

  return <time className="os-clock">{now}</time>
}
