import { useState } from "react"
import type { MediaItem, OsData } from "../types"

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="os-app-icon">
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5l5 3.5-5 3.5z" />
  </svg>
)

/** Evidence media (screenshots, demo videos, diagrams) grouped by project. Videos without a file show as "coming soon". */
export function GalleryApp({ data }: { data: OsData }) {
  const [open, setOpen] = useState<MediaItem | null>(null)
  const t = data.ui.apps

  if (data.gallery.length === 0) {
    return (
      <div className="os-empty">
        <p>{t.gallery_empty}</p>
      </div>
    )
  }

  const groups = [...new Set(data.gallery.map((m) => m.entry))].map((id) => ({
    entry: data.entries.find((e) => e.id === id),
    items: data.gallery.filter((m) => m.entry === id),
  }))

  return (
    <div className="os-gallery">
      {open && open.src && (
        <figure className="os-viewer">
          <button type="button" className="os-button" onClick={() => setOpen(null)}>
            {t.gallery_close}
          </button>
          {open.kind === "video" ? <video src={open.src} controls /> : <img src={open.src} alt={open.caption} />}
          <figcaption>{open.caption}</figcaption>
        </figure>
      )}

      {groups.map(({ entry, items }) => (
        <section key={entry?.id ?? "other"}>
          <h2 className="mono">{entry?.filename ?? ""}</h2>
          <ul className="os-thumbs">
            {items.map((item) => (
              <li key={item.id}>
                {item.placeholder || !item.src ? (
                  <div className="os-soon" role="img" aria-label={item.caption}>
                    <PlayIcon />
                    <span className="mono">{t.gallery_soon}</span>
                    <span>{item.caption}</span>
                  </div>
                ) : (
                  <button type="button" onClick={() => setOpen(item)} aria-pressed={open?.id === item.id}>
                    <img src={item.thumb ?? item.src} alt="" loading="lazy" />
                    <span>{item.caption}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
