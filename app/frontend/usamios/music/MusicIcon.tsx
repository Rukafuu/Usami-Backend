import type { ReactNode } from "react"

export type MusicIconName =
  | "chevron-left"
  | "chevron-right"
  | "home"
  | "search"
  | "close"
  | "library"
  | "dj"
  | "vinyl"
  | "sparkle"
  | "synth"
  | "ears"
  | "computer"
  | "speaker-on"
  | "speaker-off"
  | "lock"
  | "heart-filled"
  | "heart-outline"
  | "shuffle"
  | "prev"
  | "next"
  | "play"
  | "pause"
  | "repeat"
  | "eq"

/*
 * One drawing language for the whole player: round caps, soft curves, a translucent fill under a
 * 1.7px line (duotone), and the Usami ear silhouette (a tall rounded leaf) as the recurring motif.
 */
const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const
const TINT = { fill: "currentColor", fillOpacity: 0.2 } as const

const ICONS: Record<MusicIconName, ReactNode> = {
  // Chevrons bend like an ear's edge instead of meeting in a hard point.
  "chevron-left": <path d="M14.8 5.6C11.6 8 10 10 10 12s1.6 4 4.8 6.4" {...LINE} />,
  "chevron-right": <path d="M9.2 5.6C12.4 8 14 10 14 12s-1.6 4-4.8 6.4" {...LINE} />,

  // A house with two ears on the ridge: "back to the burrow".
  home: (
    <>
      <path d="M4.5 11.4L12 5.4l7.5 6v7.6a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5v-7.6z" {...TINT} />
      <path d="M4.5 11.4L12 5.4l7.5 6v7.6a1.5 1.5 0 01-1.5 1.5h-3.8v-5.2a2.2 2.2 0 00-4.4 0v5.2H6a1.5 1.5 0 01-1.5-1.5v-7.6z" {...LINE} />
      <path d="M9.8 6.6C9 4.6 9.1 2.8 10 2.6c.8-.1 1.4 1.7 1.2 3.6M14.2 6.6c.8-2 .7-3.8-.2-4-.8-.1-1.4 1.7-1.2 3.6" {...LINE} strokeWidth={1.4} />
    </>
  ),

  // The lens carries two small ears; the handle ends in a dot.
  search: (
    <>
      <circle cx="10.6" cy="12.4" r="6" {...TINT} />
      <circle cx="10.6" cy="12.4" r="6" {...LINE} />
      <path d="M8.2 7.2C7.6 5.6 7.8 4.4 8.5 4.3c.6 0 1 1.1.9 2.4M13 7.2c.6-1.6.4-2.8-.3-2.9-.6 0-1 1.1-.9 2.4" {...LINE} strokeWidth={1.3} />
      <path d="M15.2 17l4 3.8" {...LINE} strokeWidth={2} />
    </>
  ),

  close: <path d="M7.2 7.2c3.2 3.2 6.4 6.4 9.6 9.6M16.8 7.2c-3.2 3.2-6.4 6.4-9.6 9.6" {...LINE} strokeWidth={1.9} />,

  // Three spines: two upright with ear-rounded tops, one leaning on them.
  library: (
    <>
      <path d="M4.5 19.5V8.2c0-2.6.7-4.2 1.8-4.2s1.8 1.6 1.8 4.2v11.3z" {...TINT} />
      <path d="M4.5 19.5V8.2c0-2.6.7-4.2 1.8-4.2s1.8 1.6 1.8 4.2v11.3z" {...LINE} />
      <path d="M9.6 19.5V8.2c0-2.6.7-4.2 1.8-4.2s1.8 1.6 1.8 4.2v11.3z" {...TINT} />
      <path d="M9.6 19.5V8.2c0-2.6.7-4.2 1.8-4.2s1.8 1.6 1.8 4.2v11.3z" {...LINE} />
      <path d="M15.3 6.4c.2-1.2 1-1.9 2-1.6s1.4 1.2 1.2 2.4l-2 11.6c-.2 1-1 1.5-1.9 1.3s-1.3-1-1.1-2z" {...TINT} />
      <path d="M15.3 6.4c.2-1.2 1-1.9 2-1.6s1.4 1.2 1.2 2.4l-2 11.6c-.2 1-1 1.5-1.9 1.3s-1.3-1-1.1-2z" {...LINE} />
    </>
  ),

  // Headphones whose cups are rabbit ears, with the record between them.
  dj: (
    <>
      <path d="M8.2 11.2C6.6 8 6.4 4.6 7.9 3.6c1.5-.9 3.2 1.6 3.4 5.2M15.8 11.2c1.6-3.2 1.8-6.6.3-7.6-1.5-.9-3.2 1.6-3.4 5.2" {...TINT} />
      <path d="M8.2 11.2C6.6 8 6.4 4.6 7.9 3.6c1.5-.9 3.2 1.6 3.4 5.2M15.8 11.2c1.6-3.2 1.8-6.6.3-7.6-1.5-.9-3.2 1.6-3.4 5.2" {...LINE} strokeWidth={1.5} />
      <circle cx="12" cy="15.2" r="6" {...TINT} />
      <circle cx="12" cy="15.2" r="6" {...LINE} strokeWidth={1.5} />
      <circle cx="12" cy="15.2" r="1.9" fill="currentColor" />
    </>
  ),

  // The Usami mark reduced to two ears over a round face.
  ears: (
    <>
      <path d="M8.6 10.6C6.8 7 6.9 3.4 8.5 2.8c1.6-.5 3.3 2.4 3.4 6.4M15.4 10.6c1.8-3.6 1.7-7.2.1-7.8-1.6-.5-3.3 2.4-3.4 6.4" {...TINT} fillOpacity={0.26} />
      <path d="M8.6 10.6C6.8 7 6.9 3.4 8.5 2.8c1.6-.5 3.3 2.4 3.4 6.4M15.4 10.6c1.8-3.6 1.7-7.2.1-7.8-1.6-.5-3.3 2.4-3.4 6.4" {...LINE} strokeWidth={1.5} />
      <ellipse cx="12" cy="15.4" rx="7" ry="5.6" {...TINT} fillOpacity={0.14} />
      <ellipse cx="12" cy="15.4" rx="7" ry="5.6" {...LINE} strokeWidth={1.5} />
      <path d="M9.6 15.2h.01M14.4 15.2h.01M10.6 17.4c.9.6 1.9.6 2.8 0" {...LINE} strokeWidth={1.6} />
    </>
  ),

  // Record with ear bumps on its upper edge; the label is a note head.
  vinyl: (
    <>
      <path d="M7.2 7.6C5.8 5 6 2.8 7.2 2.4c1.1-.3 2.2 1.6 2.4 3.6M16.8 7.6c1.4-2.6 1.2-4.8 0-5.2-1.1-.3-2.2 1.6-2.4 3.6" {...LINE} strokeWidth={1.4} />
      <circle cx="12" cy="14" r="7.4" {...TINT} />
      <circle cx="12" cy="14" r="7.4" {...LINE} />
      <path d="M8 14a4 4 0 014-4" {...LINE} strokeWidth={1.2} opacity={0.6} />
      <circle cx="12" cy="14" r="2.1" fill="currentColor" />
    </>
  ),

  // A four-point star with pinched, ear-like points and a small companion.
  sparkle: (
    <>
      <path d="M11.2 3.2c.5 4.4 2.6 6.5 7 7-4.4.5-6.5 2.6-7 7-.5-4.4-2.6-6.5-7-7 4.4-.5 6.5-2.6 7-7z" {...TINT} fillOpacity={0.28} />
      <path d="M11.2 3.2c.5 4.4 2.6 6.5 7 7-4.4.5-6.5 2.6-7 7-.5-4.4-2.6-6.5-7-7 4.4-.5 6.5-2.6 7-7z" {...LINE} strokeWidth={1.5} />
      <path d="M18.4 15.6c.2 1.5 1 2.3 2.4 2.5-1.4.2-2.2 1-2.4 2.5-.2-1.5-1-2.3-2.4-2.5 1.4-.2 2.2-1 2.4-2.5z" fill="currentColor" />
    </>
  ),

  // A waveform riding inside a rounded square with ear-tab corners.
  synth: (
    <>
      <rect x="3.5" y="6" width="17" height="14" rx="3.6" {...TINT} />
      <rect x="3.5" y="6" width="17" height="14" rx="3.6" {...LINE} strokeWidth={1.5} />
      <path d="M7.5 6C7 4.4 7.2 3.2 8 3.1c.7 0 1.1 1.2 1 2.9M15 6c-.5-1.6-.3-2.8.5-2.9.7 0 1.1 1.2 1 2.9" {...LINE} strokeWidth={1.3} />
      <path d="M6.8 13c1.2-3.4 2.2-3.4 3.2 0s2 3.4 3.2 0 2-3.4 4 0" {...LINE} strokeWidth={1.5} />
    </>
  ),

  // A monitor with two antenna ears.
  computer: (
    <>
      <rect x="3.5" y="7.2" width="17" height="11" rx="2.6" {...TINT} />
      <rect x="3.5" y="7.2" width="17" height="11" rx="2.6" {...LINE} strokeWidth={1.6} />
      <path d="M8.6 7.2C7.6 5 7.8 3 8.8 2.8c.9-.1 1.5 1.7 1.4 4.4M15.4 7.2c1-2.2.8-4.2-.2-4.4-.9-.1-1.5 1.7-1.4 4.4" {...LINE} strokeWidth={1.4} />
      <path d="M9 21.2h6M12 18.2v3" {...LINE} strokeWidth={1.6} />
      <path d="M9.4 12.4h.01M14.6 12.4h.01" {...LINE} strokeWidth={2} />
    </>
  ),

  "speaker-on": (
    <>
      <path d="M4.5 9.6h3L12.6 5v14l-5.1-4.6h-3A1.5 1.5 0 013 12.9v-1.8a1.5 1.5 0 011.5-1.5z" {...TINT} />
      <path d="M4.5 9.6h3L12.6 5v14l-5.1-4.6h-3A1.5 1.5 0 013 12.9v-1.8a1.5 1.5 0 011.5-1.5z" {...LINE} strokeWidth={1.6} />
      <path d="M16 9.2c1.4 1.7 1.4 4.9 0 6.6M18.8 6.6c2.6 3.2 2.6 7.6 0 10.8" {...LINE} strokeWidth={1.6} />
    </>
  ),
  "speaker-off": (
    <>
      <path d="M4.5 9.6h3L12.6 5v14l-5.1-4.6h-3A1.5 1.5 0 013 12.9v-1.8a1.5 1.5 0 011.5-1.5z" {...TINT} fillOpacity={0.14} />
      <path d="M4.5 9.6h3L12.6 5v14l-5.1-4.6h-3A1.5 1.5 0 013 12.9v-1.8a1.5 1.5 0 011.5-1.5z" {...LINE} strokeWidth={1.6} />
      <path d="M16.4 10c1.4 1.4 2.8 2.8 4.2 4.2M20.6 10c-1.4 1.4-2.8 2.8-4.2 4.2" {...LINE} strokeWidth={1.7} />
    </>
  ),

  // Padlock whose shackle is an ear; two dots for a face.
  lock: (
    <>
      <rect x="4.8" y="10.8" width="14.4" height="9.8" rx="3" {...TINT} />
      <rect x="4.8" y="10.8" width="14.4" height="9.8" rx="3" {...LINE} strokeWidth={1.6} />
      <path d="M8.2 10.8C7.6 7.2 8.6 3.4 12 3.4s4.4 3.8 3.8 7.4" {...LINE} strokeWidth={1.6} />
      <path d="M9.8 15.4h.01M14.2 15.4h.01" {...LINE} strokeWidth={2} />
    </>
  ),

  // Hearts with two tall lobes, so the silhouette also reads as ears.
  "heart-filled": <path d="M12 20.6C6 15.8 3.4 12.7 3.4 8.7 3.4 5.7 5.3 3.8 7.3 3.8c2 0 3.5 1.4 4.7 4.2 1.2-2.8 2.7-4.2 4.7-4.2 2 0 3.9 1.9 3.9 4.9 0 4-2.6 7.1-8.6 11.9z" fill="currentColor" />,
  "heart-outline": (
    <path d="M12 20.4C6.2 15.7 3.8 12.7 3.8 8.8c0-2.8 1.7-4.5 3.5-4.5 1.9 0 3.3 1.3 4.7 4 1.4-2.7 2.8-4 4.7-4 1.8 0 3.5 1.7 3.5 4.5 0 3.9-2.4 6.9-8.2 11.6z" {...TINT} fillOpacity={0.1} {...LINE} fill="currentColor" strokeWidth={1.65} />
  ),

  shuffle: (
    <>
      <path d="M3.8 7.2h2.6c2.8 0 4 1.6 5.4 4.8s2.6 4.8 5.4 4.8h2.2" {...LINE} />
      <path d="M3.8 16.8h2.6c1.7 0 2.8-.6 3.8-1.8M13.8 9c.9-1.2 2-1.8 3.7-1.8h2.2" {...LINE} />
      <path d="M17.6 4.6l2.4 2.6-2.4 2.6M17.6 14.2l2.4 2.6-2.4 2.6" {...LINE} />
    </>
  ),

  // Transport glyphs: rounded triangles and pill bars, solid so they read at 16px.
  prev: (
    <>
      <rect x="5" y="5.5" width="2.8" height="13" rx="1.4" fill="currentColor" />
      <path d="M18.4 6.6v10.8c0 1-1.1 1.5-1.9.9l-7-5.4a1.1 1.1 0 010-1.8l7-5.4c.8-.6 1.9-.1 1.9.9z" fill="currentColor" />
    </>
  ),
  next: (
    <>
      <rect x="16.2" y="5.5" width="2.8" height="13" rx="1.4" fill="currentColor" />
      <path d="M5.6 6.6v10.8c0 1 1.1 1.5 1.9.9l7-5.4a1.1 1.1 0 000-1.8l-7-5.4c-.8-.6-1.9-.1-1.9.9z" fill="currentColor" />
    </>
  ),
  play: <path d="M7.4 5.8v12.4c0 1.1 1.2 1.7 2.1 1.1l9.4-6.2c.8-.5.8-1.7 0-2.2L9.5 4.7c-.9-.6-2.1 0-2.1 1.1z" fill="currentColor" />,
  // Two ear-shaped pills, slightly tapered at the top.
  pause: (
    <>
      <path d="M6.4 18V8.2c0-2.6.8-4.2 2.1-4.2s2.1 1.6 2.1 4.2V18a2.1 2.1 0 01-4.2 0z" fill="currentColor" />
      <path d="M13.4 18V8.2c0-2.6.8-4.2 2.1-4.2s2.1 1.6 2.1 4.2V18a2.1 2.1 0 01-4.2 0z" fill="currentColor" />
    </>
  ),

  repeat: (
    <>
      <path d="M5.2 12V10.4a3.4 3.4 0 013.4-3.4h10.2M18.8 12v1.6a3.4 3.4 0 01-3.4 3.4H5.2" {...LINE} />
      <path d="M16.2 4.4L19 7l-2.8 2.6M7.8 19.6L5 17l2.8-2.6" {...LINE} />
    </>
  ),

  // Four bars whose tops are rounded like ears.
  eq: (
    <>
      <path d="M4 19v-6.4c0-1.8.6-2.8 1.5-2.8s1.5 1 1.5 2.8V19z" fill="currentColor" />
      <path d="M8.9 19V6.6c0-1.8.6-2.8 1.5-2.8s1.5 1 1.5 2.8V19z" fill="currentColor" />
      <path d="M13.8 19V9.6c0-1.8.6-2.8 1.5-2.8s1.5 1 1.5 2.8V19z" fill="currentColor" />
      <path d="M18.7 19v-4.4c0-1.8.6-2.8 1.5-2.8s1.5 1 1.5 2.8V19z" fill="currentColor" />
    </>
  ),
}

export function MusicIcon({ name, className = "os-music-svg" }: { name: MusicIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {ICONS[name]}
    </svg>
  )
}
