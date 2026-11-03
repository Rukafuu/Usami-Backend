import { useEffect, useRef } from "react"
import { Sprite } from "./pet/ClaudePet"
import type { Frame } from "./pet/sprite"
import { prefersReducedMotion } from "./shell"
import { FUWARCH_BANNER } from "./terminal/ascii"
import type { OsData } from "./types"

/** ↑ ↑ ↓ ↓ ← → ← → B A */
export const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]

/** Calls `onMatch` when the Konami code is typed anywhere on the page. */
export function useKonami(onMatch: () => void) {
  const progress = useRef(0)
  const callback = useRef(onMatch)
  callback.current = onMatch

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      progress.current = key === KONAMI[progress.current] ? progress.current + 1 : key === KONAMI[0] ? 1 : 0
      if (progress.current === KONAMI.length) {
        progress.current = 0
        callback.current()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
}

const RAIN_COUNT = 36
const RAIN_FRAMES: Frame[] = ["idle", "happy", "wave", "dizzy", "happy", "stepA"]

/** Celebration toast with falling logos and a rain of pixel critters. Skipped when motion is reduced. */
export function Celebration({ data, onDone }: { data: OsData; onDone: () => void }) {
  const { eggs } = data.ui
  const still = prefersReducedMotion()

  useEffect(() => {
    const timer = window.setTimeout(onDone, 6000)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDone()
    window.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("keydown", onKey)
    }
  }, [onDone])

  return (
    <div className="os-celebrate" role="status" onClick={onDone}>
      {!still &&
        Array.from({ length: 16 }, (_, i) => (
          <img key={i} src="/brand/logo-64.png" alt="" aria-hidden="true" className="os-fall"
            style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.25}s`, animationDuration: `${2.6 + (i % 5) * 0.4}s` }} />
        ))}
      {!still &&
        Array.from({ length: RAIN_COUNT }, (_, i) => (
          <span key={`c${i}`} className="os-rain" aria-hidden="true"
            style={{ left: `${(i * 29 + (i % 3) * 7) % 96}%`, animationDelay: `${(i % 9) * 0.28}s`, animationDuration: `${2.8 + (i % 6) * 0.45}s`, ["--pet-w" as string]: `${28 + (i % 4) * 10}px` }}>
            <span className="os-rain-in" style={{ animationDelay: `${(i % 5) * -0.3}s` }}>
              <Sprite frame={RAIN_FRAMES[i % RAIN_FRAMES.length] ?? "idle"} />
            </span>
          </span>
        ))}
      <div className="os-celebrate-card">
        <img src="/brand/logo-192.png" alt="" width="72" height="72" />
        <strong>{eggs.konami_title}</strong>
        <span>{eggs.konami_text}</span>
      </div>
    </div>
  )
}

/**
 * What a curious visitor finds when they press F12: the mascot (a large ASCII drawing, loaded only
 * when it is about to be printed), a joke and a way to reach Lucas.
 */
export async function printConsoleGreeting(data: OsData, contactUrl: string) {
  const { eggs } = data.ui
  const { default: art } = await import("./terminal/fuwarch-art.txt?raw")
  // Tiny type and tight lines keep the 127-column drawing in proportion inside the console.
  console.log(`%c${art.trimEnd()}`, "color:#d4a477;font-family:monospace;font-size:6px;line-height:6px;font-weight:bold")
  console.log(`%c${FUWARCH_BANNER}`, "color:#d4a477;font-family:monospace;font-size:13px;font-weight:bold")
  console.log(`%c${eggs.console_intro}`, "font-size:14px;font-weight:600")
  console.log(`%c${eggs.console_contact.replace("%{url}", contactUrl)}`, "font-size:13px")
}
