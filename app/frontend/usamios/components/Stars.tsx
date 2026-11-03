import { useEffect, useRef } from "react"
import { prefersReducedMotion } from "../shell"

type Star = { x: number; y: number; r: number; depth: number; phase: number }

/** Decorative starfield. Static when the visitor prefers reduced motion. */
export function Stars() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext("2d")
    if (!el || !ctx) return

    const reduced = prefersReducedMotion()
    let stars: Star[] = []
    let width = 0
    let height = 0
    let px = 0
    let py = 0
    let frame = 0

    const color = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--star").trim() || "247, 245, 251"

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      width = el.width = Math.round(window.innerWidth * ratio)
      height = el.height = Math.round(window.innerHeight * ratio)
      const count = Math.round((window.innerWidth * window.innerHeight) / 9000)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.random() * 1.1 + 0.3) * ratio,
        depth: Math.random() * 0.9 + 0.1,
        phase: Math.random() * 6,
      }))
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      const rgb = color()
      for (const s of stars) {
        const alpha = reduced ? 0.55 : 0.35 + 0.35 * Math.sin(time / 1800 + s.phase)
        ctx.fillStyle = `rgba(${rgb}, ${alpha * s.depth})`
        ctx.beginPath()
        ctx.arc(s.x + px * s.depth * 14, s.y + py * s.depth * 14, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      if (!reduced) frame = requestAnimationFrame(draw)
    }

    const onPointer = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5
      py = e.clientY / window.innerHeight - 0.5
    }
    const onResize = () => {
      resize()
      if (reduced) draw(0)
    }

    resize()
    frame = requestAnimationFrame(draw)
    window.addEventListener("resize", onResize)
    window.addEventListener("pointermove", onPointer)
    const themeObserver = new MutationObserver(() => reduced && draw(0))
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("pointermove", onPointer)
      themeObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvas} className="os-stars" aria-hidden="true" />
}
