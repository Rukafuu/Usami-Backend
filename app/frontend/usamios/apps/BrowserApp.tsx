import { useState } from "react"
import { useShell } from "../shell"
import type { Entry, OsData } from "../types"
import { useWindows } from "../windows"

type Page = "company" | "projects" | "services" | "about_me"
const PAGES: Page[] = ["company", "projects", "services", "about_me"]
const ADDRESS: Record<Page, string> = {
  company: "usami://empresa",
  projects: "usami://projetos",
  services: "usami://servicos",
  about_me: "usami://sobre",
}

/** Institutional content: the company, its projects, what it offers, and the founder. */
export function BrowserApp({ data }: { data: OsData }) {
  const [page, setPage] = useState<Page>("company")
  const labels = data.ui.apps.browser_pages
  const founder = data.entries.find((e) => e.id === "lucas")
  const projects = data.entries.filter((e) => e.folder !== "empresa")

  const openInFiles = (entry: Entry) => {
    useShell.getState().showInFiles({ folder: entry.folder, id: entry.id })
    useWindows.getState().open("files", { width: window.innerWidth, height: window.innerHeight })
  }

  return (
    <div className="os-browser">
      <div className="os-addr">
        <nav aria-label={data.ui.apps.browser}>
          {PAGES.map((p) => (
            <button key={p} type="button" aria-current={p === page ? "page" : undefined} onClick={() => setPage(p)}>
              {labels[p]}
            </button>
          ))}
        </nav>
        <output className="os-url">{ADDRESS[page]}</output>
      </div>

      <article className="os-page">
        {page === "company" && (
          <>
            <h2>{data.site.headline}</h2>
            <p>{data.site.description}</p>
            <ul className="os-cards">
              {data.site.pillars.map((p) => (
                <li key={p.title}><strong>{p.title}</strong><span>{p.text}</span></li>
              ))}
            </ul>
          </>
        )}
        {page === "projects" && (
          <>
            <h2>{labels.projects}</h2>
            <ul className="os-cards is-projects">
              {projects.map((entry) => (
                <li key={entry.id}>
                  <span className={`os-badge${entry.status === "live" ? " is-live" : ""}`}>
                    {data.ui.status[entry.status] ?? entry.status}
                  </span>
                  <strong>{entry.filename}</strong>
                  <span>{entry.description}</span>
                  {entry.stack.length > 0 && (
                    <span className="mono os-card-stack">{entry.stack.join(" · ")}</span>
                  )}
                  <button type="button" className="os-button" onClick={() => openInFiles(entry)}>
                    {data.ui.apps.browser_open_files}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {page === "services" && (
          <>
            <h2>{labels.services}</h2>
            <ul className="os-cards">
              {data.services.map((s) => (
                <li key={s.title}><strong>{s.title}</strong><span>{s.text}</span></li>
              ))}
            </ul>
          </>
        )}
        {page === "about_me" && founder && (
          <>
            <h2>{labels.about_me}</h2>
            {founder.photo && (
              <img className="os-portrait" src={founder.photo.small} srcSet={`${founder.photo.small} 400w, ${founder.photo.src} 800w`} sizes="150px" width={founder.photo.width} height={founder.photo.height} alt={founder.photo.alt} />
            )}
            <p>{founder.description}</p>
            {founder.about && founder.about.length > 0 && (
              <div className="os-about-me">
                {founder.about.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
              </div>
            )}
            {founder.sources.map((s) =>
              s.url ? <p key={s.url}><a href={s.url} target="_blank" rel="noopener">{s.label} ↗</a></p> : null,
            )}
          </>
        )}
      </article>
    </div>
  )
}
