import { useCallback, useEffect, useRef, useState } from "react"
import { prefersReducedMotion } from "../shell"
import type { Ui } from "../types"
import { nextLine, nextStep, walkDuration, type Mood } from "./behavior"
import { framePixels, SPRITE_HEIGHT, SPRITE_WIDTH, type Frame } from "./sprite"

type Props = { pet: Ui["claude_pet"]; variant: "desktop" | "phone" }

const BUBBLE_MS = 6500

export function Sprite({ frame }: { frame: Frame }) {
  return (
    <svg className="os-pet-sprite" viewBox={`0 0 ${SPRITE_WIDTH} ${SPRITE_HEIGHT}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {framePixels(frame).map((p) => (
        <rect key={`${p.x}-${p.y}`} className={`px-${p.kind}`} x={p.x} y={p.y} width="1" height="1" />
      ))}
    </svg>
  )
}

/**
 * A pixel critter that strolls along the bottom edge, naps, and says things when clicked.
 * It is decoration plus one real control (the button); with reduced motion it only stands there.
 */
export function ClaudePet({ pet, variant }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const position = useRef(0.7)
  const talking = useRef(false)
  const lastLine = useRef<number | null>(null)
  const bubbleTimer = useRef<number | undefined>(undefined)
  const waveTimer = useRef<number | undefined>(undefined)

  const [pos, setPos] = useState(position.current)
  const [duration, setDuration] = useState(0)
  const [facing, setFacing] = useState<1 | -1>(-1)
  const [mood, setMood] = useState<Mood>("idle")
  const [step, setStep] = useState(false)
  const [blink, setBlink] = useState(false)
  const [waving, setWaving] = useState(false)
  const [line, setLine] = useState<string | null>(null)

  // Wander: pick what to do, wait it out, repeat.
  useEffect(() => {
    let timer = 0
    let alive = true
    let idleFor = 0
    const decide = () => {
      if (!alive) return
      if (talking.current) {
        timer = window.setTimeout(decide, 1500)
        return
      }
      const width = trackRef.current?.clientWidth ?? 600
      const next = nextStep(position.current, idleFor, prefersReducedMotion(), Math.random)
      idleFor = next.mood === "walk" ? 0 : idleFor + 1
      if (next.mood === "walk") {
        const ms = walkDuration(next.target - position.current, width)
        setFacing(next.target > position.current ? 1 : -1)
        setDuration(ms)
        setMood("walk")
        position.current = next.target
        setPos(next.target)
        timer = window.setTimeout(() => {
          setMood("idle")
          timer = window.setTimeout(decide, 600)
        }, ms)
      } else {
        setMood(next.mood)
        timer = window.setTimeout(decide, next.after)
      }
    }
    timer = window.setTimeout(decide, 2000)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [])

  // Legs: swap frames while walking.
  useEffect(() => {
    if (mood !== "walk") return
    const id = window.setInterval(() => setStep((s) => !s), 220)
    return () => window.clearInterval(id)
  }, [mood])

  // Eyes: an occasional blink while awake and standing.
  useEffect(() => {
    if (mood !== "idle") return
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (!prefersReducedMotion()) {
          setBlink(true)
          timer = window.setTimeout(() => {
            setBlink(false)
            schedule()
          }, 140)
        } else schedule()
      }, 2200 + Math.random() * 3200)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [mood])

  useEffect(
    () => () => {
      window.clearTimeout(bubbleTimer.current)
      window.clearTimeout(waveTimer.current)
    },
    [],
  )

  const hide = useCallback(() => {
    window.clearTimeout(bubbleTimer.current)
    talking.current = false
    setLine(null)
  }, [])

  const speak = () => {
    // Stop where it is, so the bubble is never left behind by a walk in progress.
    const track = trackRef.current
    const button = buttonRef.current
    if (track && button && mood === "walk") {
      const room = track.clientWidth - button.offsetWidth
      const here = room > 0 ? (button.getBoundingClientRect().left - track.getBoundingClientRect().left) / room : position.current
      position.current = Math.min(1, Math.max(0, here))
      setDuration(0)
      setPos(position.current)
    }
    setMood("idle")
    const index = nextLine(pet.lines.length, lastLine.current, Math.random)
    lastLine.current = index
    talking.current = true
    setLine(pet.lines[index] ?? null)
    setWaving(true)
    window.clearTimeout(waveTimer.current)
    waveTimer.current = window.setTimeout(() => setWaving(false), 900)
    window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(hide, BUBBLE_MS)
  }

  const frame: Frame = waving ? "wave" : mood === "sleep" ? "sleep" : mood === "walk" ? (step ? "stepB" : "stepA") : blink ? "blink" : "idle"
  const side = pos < 0.3 ? "start" : pos > 0.7 ? "end" : "mid"

  return (
    <div ref={trackRef} className={`os-pet os-pet--${variant}`} onKeyDown={(e) => e.key === "Escape" && line && hide()}>
      <div className="os-pet-actor" style={{ left: `calc(${pos} * (100% - var(--pet-w)))`, transitionDuration: `${duration}ms` }}>
        {line && (
          <p className="os-pet-bubble" data-side={side} role="status">
            {line}
          </p>
        )}
        {!line && mood === "sleep" && (
          <span className="os-pet-zzz" aria-hidden="true">
            zzz
          </span>
        )}
        <button ref={buttonRef} type="button" className="os-pet-btn" aria-label={mood === "sleep" ? `${pet.label} (${pet.asleep})` : pet.label} onClick={speak}>
          <span className="os-pet-flip" style={{ transform: `scaleX(${facing})` }}>
            <Sprite frame={frame} />
          </span>
        </button>
      </div>
    </div>
  )
}
