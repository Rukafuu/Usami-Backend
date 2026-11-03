import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { fill } from "../format"
import type { Entry, MediaItem, OsData } from "../types"

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="os-app-icon">
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5l5 3.5-5 3.5z" />
  </svg>
)

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="os-app-icon">
    <path d="M3 7.5A1.5 1.5 0 014.5 6H9l2 2h8.5A1.5 1.5 0 0121 9.5v8a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5z" />
  </svg>
)

/** "Hane — agents with a budget…" -> "Hane": the short name of a project, for the folder label. */
const shortName = (entry: Entry | undefined) => (entry?.title ?? entry?.filename ?? "").split(" — ")[0] ?? ""

type Folder = { id: string; entry: Entry | undefined; items: MediaItem[] }

/**
 * Evidence media in one folder per project. A folder lists its images; an image opens in a viewer (previous / next,
 * arrow keys, Esc to close, link to the original file). Videos without a file show as "coming soon".
 */
export function GalleryApp({ data }: { data: OsData }) {
  const t = data.ui.apps
  const [folderId, setFolderId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const lastOpener = useRef<HTMLElement | null>(null)
  const viewerRef = useRef<HTMLElement>(null)

  if (data.gallery.length === 0) {
    return (
      <div className="os-empty">
        <p>{t.gallery_empty}</p>
      </div>
    )
  }

  // Folders follow the order of the projects, not the order the images were added.
  const ids = new Set(data.gallery.map((m) => m.entry))
  const folders: Folder[] = data.entries
    .filter((e) => ids.has(e.id))
    .map((entry) => ({ id: entry.id, entry, items: data.gallery.filter((m) => m.entry === entry.id) }))
  const folder = folders.find((f) => f.id === folderId) ?? null
  const openable = folder ? folder.items.filter((m) => !m.placeholder && m.src) : []
  const current = viewing !== null ? openable[viewing] : undefined

  const close = () => {
    setViewing(null)
    window.setTimeout(() => lastOpener.current?.focus(), 0)
  }
  const step = (delta: number) => setViewing((i) => (i === null ? i : (i + delta + openable.length) % openable.length))

  const onViewerKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation() // closes the viewer, not the whole window
      close()
    } else if (e.key === "ArrowLeft") step(-1)
    else if (e.key === "ArrowRight") step(1)
  }

  if (folder && current) {
    return (
      <Viewer
        item={current}
        position={fill(t.gallery_count, { n: String((viewing ?? 0) + 1), total: String(openable.length) })}
        folderName={shortName(folder.entry)}
        ui={{ close: t.gallery_close, prev: t.gallery_prev, next: t.gallery_next, original: t.gallery_original }}
        single={openable.length < 2}
        onClose={close}
        onStep={step}
        onKeyDown={onViewerKey}
        refEl={viewerRef}
      />
    )
  }

  if (folder) {
    return (
      <div className="os-gallery">
        <nav className="os-gal-bar" aria-label={t.gallery}>
          <button type="button" className="os-button" onClick={() => setFolderId(null)}>
            ← {t.gallery_back}
          </button>
          <h2>{shortName(folder.entry)}</h2>
        </nav>
        <ul className="os-thumbs">
          {folder.items.map((item) => {
            const index = openable.indexOf(item)
            return (
              <li key={item.id}>
                {item.placeholder || !item.src ? (
                  <div className="os-soon" role="img" aria-label={item.caption}>
                    <PlayIcon />
                    <span className="mono">{t.gallery_soon}</span>
                    <span>{item.caption}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      lastOpener.current = e.currentTarget
                      setViewing(index)
                    }}
                  >
                    <img src={item.thumb ?? item.src} alt="" loading="lazy" />
                    <span>{item.caption}</span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <div className="os-gallery">
      <h2 className="mono os-gal-title">{t.gallery_folders}</h2>
      <ul className="os-gal-folders">
        {folders.map((f) => {
          const previews = f.items.filter((m) => !m.placeholder && m.thumb).slice(0, 3)
          const name = shortName(f.entry)
          return (
            <li key={f.id}>
              <button type="button" onClick={() => setFolderId(f.id)} aria-label={`${name} · ${fill(t.gallery_items, { n: String(f.items.length) })}`}>
                <span className="os-gal-stack" aria-hidden="true">
                  {previews.length ? previews.map((m, i) => <img key={m.id} src={m.thumb ?? undefined} alt="" loading="lazy" style={{ ["--i" as string]: i }} />) : <FolderIcon />}
                </span>
                <strong>{name}</strong>
                <span className="mono">{fill(t.gallery_items, { n: String(f.items.length) })}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Viewer({ item, position, folderName, ui, single, onClose, onStep, onKeyDown, refEl }: {
  item: MediaItem
  position: string
  folderName: string
  ui: { close: string; prev: string; next: string; original: string }
  single: boolean
  onClose: () => void
  onStep: (delta: number) => void
  onKeyDown: (e: KeyboardEvent) => void
  refEl: React.RefObject<HTMLElement | null>
}) {
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => closeButton.current?.focus(), [])
  return (
    <section ref={refEl} className="os-gal-viewer" aria-label={`${folderName} · ${position}`} onKeyDown={onKeyDown}>
      <header>
        <button ref={closeButton} type="button" className="os-button" onClick={onClose}>
          ← {ui.close}
        </button>
        <span className="mono" aria-live="polite">{folderName} · {position}</span>
        {item.src && (
          <a className="os-button" href={item.src} target="_blank" rel="noopener">
            {ui.original}
          </a>
        )}
      </header>
      <div className="os-gal-stage">
        {!single && <button type="button" className="os-gal-nav is-prev" aria-label={ui.prev} onClick={() => onStep(-1)}>‹</button>}
        {item.kind === "video" ? <video src={item.src ?? undefined} controls /> : <img src={item.src ?? undefined} alt={item.caption} />}
        {!single && <button type="button" className="os-gal-nav is-next" aria-label={ui.next} onClick={() => onStep(1)}>›</button>}
      </div>
      <p className="os-gal-caption">{item.caption}</p>
    </section>
  )
}
