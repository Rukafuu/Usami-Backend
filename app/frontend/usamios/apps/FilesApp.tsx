import { useEffect, useMemo, useRef, useState } from "react"
import { ChannelIcon } from "../components/ChannelIcon"
import { useAchievements } from "../achievements"
import { REPO_PROJECTS } from "../code/repositories"
import { entryPath } from "../paths"
import { useShell } from "../shell"
import type { Entry, OsData } from "../types"
import { useWindows } from "../windows"

type Props = { data: OsData; initial: { folder: string | null; slug: string | null } }

const FileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
  </svg>
)

const firstIn = (entries: Entry[], folder: string) => entries.find((e) => e.folder === folder)

function resolveInitial(data: OsData, initial: Props["initial"]) {
  const entry = data.entries.find((e) => e.folder === initial.folder && e.id === initial.slug)
  const folder = initial.folder && data.folders.includes(initial.folder) ? initial.folder : (data.folders[0] ?? "")
  return { folder, id: entry?.id ?? firstIn(data.entries, folder)?.id ?? "" }
}

/** Projects as files: folders on the left, files in the middle, the open file on the right. */
export function FilesApp({ data, initial }: Props) {
  const start = useMemo(() => resolveInitial(data, initial), [data, initial])
  const [folder, setFolder] = useState(start.folder)
  const [selectedId, setSelectedId] = useState(start.id)
  const target = useShell((s) => s.filesTarget)

  const files = data.entries.filter((e) => e.folder === folder)
  const selected = data.entries.find((e) => e.folder === folder && e.id === selectedId) ?? files[0]

  useEffect(() => {
    if (selected) useAchievements.getState().recordProjectVisit(selected.id)
  }, [selected])

  // The address bar follows the visitor's choices, so every file has a shareable URL.
  // Merely opening the desktop must not rewrite the URL (the home page stays the home page).
  const userChose = useRef(false)

  useEffect(() => {
    if (!selected || !userChose.current) return
    userChose.current = false
    const path = entryPath(data.locale, selected)
    if (window.location.pathname !== path) window.history.pushState({ folder, id: selected.id }, "", path)
    document.title = `${selected.filename} — ${data.site.name}`
  }, [selected, folder, data.locale, data.site.name])

  useEffect(() => {
    const onPop = () => {
      const [, , f, id] = window.location.pathname.split("/")
      const entry = data.entries.find((e) => e.folder === f && e.id === id)
      if (entry) {
        setFolder(entry.folder)
        setSelectedId(entry.id)
      }
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [data.entries])

  useEffect(() => {
    if (!target) return
    userChose.current = true
    setFolder(target.folder)
    setSelectedId(target.id)
  }, [target])

  const choose = (nextFolder: string, id: string) => {
    userChose.current = true
    setFolder(nextFolder)
    setSelectedId(id)
  }
  const chooseFolder = (name: string) => choose(name, firstIn(data.entries, name)?.id ?? "")

  return (
    <div className="os-files">
      <nav aria-label={data.ui.shell.folders_label}>
        <span className="mono">{data.ui.shell.folders_label}</span>
        {data.folders.map((name) => (
          <button key={name} type="button" aria-current={name === folder ? "true" : undefined} onClick={() => chooseFolder(name)}>
            {data.ui.folders[name]}
          </button>
        ))}
      </nav>

      <ul className="os-list">
        {files.map((entry) => (
          <li key={entry.id}>
            <button type="button" aria-current={entry.id === selected?.id ? "true" : undefined} onClick={() => choose(folder, entry.id)}>
              <FileIcon />
              <span>
                <b>{entry.filename}</b>
                <small>
                  {entry.status === "live" ? "● " : "○ "}
                  {data.ui.status[entry.status]}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <aside className="os-preview" aria-live="polite">
        {selected && <Preview entry={selected} data={data} />}
      </aside>
    </div>
  )
}

function Preview({ entry, data }: { entry: Entry; data: OsData }) {
  const { ui } = data
  const hasCodeRepo = REPO_PROJECTS.some((r) => r.entryId === entry.id)

  const openInCode = () => {
    useShell.getState().showInCode(entry.id)
    useWindows.getState().open("code", { width: window.innerWidth, height: window.innerHeight })
  }

  return (
    <article>
      <div className="os-preview-head">
        <span className={`os-badge${entry.status === "live" ? " is-live" : ""}`}>{ui.status[entry.status]}</span>
        {hasCodeRepo && (
          <button type="button" className="os-button mono" onClick={openInCode}>
            {ui.apps.files_open_code}
          </button>
        )}
      </div>
      <h2>{entry.filename}</h2>
      <p>{entry.description}</p>

      {entry.photo && (
        <img className="os-portrait" src={entry.photo.small} srcSet={`${entry.photo.small} 400w, ${entry.photo.src} 800w`} sizes="150px" width={entry.photo.width} height={entry.photo.height} alt={entry.photo.alt} />
      )}
      {entry.about && entry.about.length > 0 && (
        <section className="os-about-me" aria-label={ui.entry.about}>
          <h3>{ui.entry.about}</h3>
          {entry.about.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        </section>
      )}

      {entry.stack.length > 0 && (
        <ul className="os-chips" aria-label={ui.entry.stack}>
          {entry.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {entry.proven.length > 0 && (
        <section>
          <h3>{ui.entry.proven}</h3>
          <ul className="os-facts">
            {entry.proven.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {entry.planned.length > 0 && (
        <section>
          <h3 className="is-plan">{ui.entry.planned}</h3>
          <ul className="os-facts is-plan">
            {entry.planned.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {!entry.listsTranslated && <p className="os-note">{ui.entry.translation_pending}</p>}

      {entry.route === "evidencias" && <Ledger data={data} />}

      {entry.sources.some((s) => s.icon) ? (
        <section aria-label={ui.entry.sources}>
          <h3 className="mono os-channels-title">{ui.entry.sources}</h3>
          <ul className="os-channels">
            {entry.sources.map((s) =>
              s.url ? (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener">
                    <ChannelIcon icon={s.icon} />
                    <span className="os-channel-text">
                      <strong>{s.label}</strong>
                      {s.detail && <span className="mono">{s.detail}</span>}
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : entry.sources.length > 0 && (
        <p className="os-sources">
          <span className="mono">{ui.entry.sources}</span>
          {entry.sources.map((s) =>
            s.url ? (
              <a key={s.url} href={s.url} target="_blank" rel="noopener" className={s.icon ? "has-icon" : undefined}>
                <ChannelIcon icon={s.icon} />
                {s.label} ↗
              </a>
            ) : null,
          )}
        </p>
      )}
    </article>
  )
}

function Ledger({ data }: { data: OsData }) {
  const { evidence } = data.ui
  return (
    <div className="os-table">
      <table>
        <thead>
          <tr>
            <th scope="col">{evidence.claim}</th>
            <th scope="col">{evidence.source}</th>
            <th scope="col">{evidence.verified}</th>
          </tr>
        </thead>
        <tbody>
          {data.ledger.map((item) => (
            <tr key={item.claim}>
              <td>{item.claim}</td>
              <td>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener">
                    {item.source} ↗
                  </a>
                ) : (
                  item.source
                )}
              </td>
              <td className="mono">
                <time dateTime={item.verifiedOn}>{item.verifiedOn}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
