import { useEffect, useState } from "react"
import { useAchievements } from "../achievements"
import { DEFAULT_SCRATCH_FILES, findRepoProject, REPO_PROJECTS, type CodeFile } from "../code/repositories"
import { useShell } from "../shell"
import type { OsData } from "../types"
import { useWindows } from "../windows"

type ViewMode = "editor" | "commits" | "arch"

const SCRATCH_STORAGE_KEY = "usamios.code.scratch.v1"

const loadScratchFiles = (): CodeFile[] => {
  try {
    const raw = window.localStorage.getItem(SCRATCH_STORAGE_KEY)
    if (!raw) return DEFAULT_SCRATCH_FILES
    const parsed = JSON.parse(raw) as CodeFile[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SCRATCH_FILES
  } catch {
    return DEFAULT_SCRATCH_FILES
  }
}

const saveScratchFiles = (files: CodeFile[]) => {
  try {
    window.localStorage.setItem(SCRATCH_STORAGE_KEY, JSON.stringify(files))
  } catch {
    // Ignore storage quota errors in restricted browsing modes.
  }
}

const inferLang = (path: string): CodeFile["lang"] => {
  if (path.endsWith(".py")) return "py"
  if (path.endsWith(".md")) return "md"
  if (path.endsWith(".diff") || path.endsWith(".patch")) return "diff"
  return "js"
}

const classifyLine = (line: string, lang: CodeFile["lang"]): string | undefined => {
  const trimmed = line.trimStart()
  if (lang === "diff") {
    if (trimmed.startsWith("+++") || trimmed.startsWith("---")) return "is-meta"
    if (trimmed.startsWith("+")) return "is-add"
    if (trimmed.startsWith("#")) return "is-comment"
  }
  if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("#") || trimmed.startsWith('"""')) {
    return lang === "md" && trimmed.startsWith("#") ? "is-heading" : "is-comment"
  }
  if (/^(import|export|const|function|return|from|def|try|except|with|if)\b/.test(trimmed)) return "is-kw"
  return undefined
}

/**
 * Usami Code Studio — IDE with Open Source Explorer mode + interactive Scratchpad workspace.
 * Lets visitors inspect real source excerpts, git commit history and merged PRs from Lucas's
 * repositories, or open a blank project to write and edit their own code/notes in the browser.
 */
export function CodeStudioApp({ data }: { data: OsData }) {
  const codeTarget = useShell((s) => s.codeTarget)
  const initialRepo = findRepoProject(codeTarget)

  const [scratchFiles, setScratchFiles] = useState<CodeFile[]>(loadScratchFiles)
  const [repoId, setRepoId] = useState<string>(initialRepo.entryId)
  const baseRepo = findRepoProject(repoId)
  const isScratch = baseRepo.entryId === "scratch"
  const files = isScratch ? scratchFiles : baseRepo.files

  const [openPaths, setOpenPaths] = useState<string[]>(() => files.map((f) => f.path))
  const [activePath, setActivePath] = useState<string>(() => files[0]?.path ?? "")
  const [viewMode, setViewMode] = useState<ViewMode>("editor")
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [creatingFile, setCreatingFile] = useState(false)

  const selectRepo = (nextId: string) => {
    const next = findRepoProject(nextId)
    const nextFiles = next.entryId === "scratch" ? scratchFiles : next.files
    setRepoId(next.entryId)
    setOpenPaths(nextFiles.map((f) => f.path))
    setActivePath(nextFiles[0]?.path ?? "")
    setViewMode("editor")
    setSelectedCommitId(null)
    setCreatingFile(false)
  }

  useEffect(() => {
    if (codeTarget) selectRepo(codeTarget)
  }, [codeTarget])

  useEffect(() => {
    useAchievements.getState().recordProjectVisit(baseRepo.entryId)
  }, [baseRepo.entryId])

  const openFile = (path: string) => {
    setOpenPaths((prev) => (prev.includes(path) ? prev : [...prev, path]))
    setActivePath(path)
    setViewMode("editor")
  }

  const closeTab = (path: string) => {
    const next = openPaths.filter((p) => p !== path)
    if (next.length === 0) return
    setOpenPaths(next)
    if (activePath === path) setActivePath(next[0] ?? "")
  }

  const updateScratchContent = (path: string, text: string) => {
    useAchievements.getState().unlock("scratch_coder")
    const nextLines = text.split("\n")
    setScratchFiles((prev) => {
      const updated = prev.map((f) => (f.path === path ? { ...f, lines: nextLines } : f))
      saveScratchFiles(updated)
      return updated
    })
  }

  const createScratchFile = () => {
    useAchievements.getState().unlock("scratch_coder")
    const trimmed = newFileName.trim() || `untitled-${scratchFiles.length + 1}.js`
    const safeName = trimmed.includes(".") ? trimmed : `${trimmed}.js`
    if (!scratchFiles.some((f) => f.path === safeName)) {
      const created: CodeFile = {
        path: safeName,
        lang: inferLang(safeName),
        lines: [`// ${safeName}`, ""],
      }
      const next = [...scratchFiles, created]
      setScratchFiles(next)
      saveScratchFiles(next)
    }
    setOpenPaths((prev) => (prev.includes(safeName) ? prev : [...prev, safeName]))
    setActivePath(safeName)
    setNewFileName("")
    setCreatingFile(false)
    setViewMode("editor")
  }

  const forkFileToScratch = (file: CodeFile) => {
    const targetPath = file.path.split("/").pop() || file.path
    const nextFile: CodeFile = { path: targetPath, lang: file.lang, lines: [...file.lines] }
    const exists = scratchFiles.some((f) => f.path === targetPath)
    const next = exists
      ? scratchFiles.map((f) => (f.path === targetPath ? nextFile : f))
      : [...scratchFiles, nextFile]
    setScratchFiles(next)
    saveScratchFiles(next)
    setRepoId("scratch")
    setOpenPaths(next.map((f) => f.path))
    setActivePath(targetPath)
    setViewMode("editor")
  }

  const activeFile = files.find((f) => f.path === activePath) ?? files[0]
  const entry = data.entries.find((e) => e.id === baseRepo.entryId)
  const t = data.ui.apps

  const labelRepo = t.code_repo || "Repositório"
  const labelFiles = t.code_files || "Arquivos do repositório"
  const labelEditor = t.code_tab_editor || "Código"
  const labelCommits = t.code_tab_commits || "Commits e PRs"
  const labelArch = t.code_tab_arch || "Arquitetura"
  const labelCode = t.code || "Usami Code Studio"
  const labelBlank = t.code_blank || "Projeto em branco"
  const labelNewFile = t.code_new_file || "Novo arquivo"
  const labelFork = t.code_fork_scratch || "Editar cópia no rascunho"

  const openTerminal = () => {
    useWindows.getState().open("terminal", { width: window.innerWidth, height: window.innerHeight })
  }

  return (
    <div className="os-code">
      <header className="os-code-top">
        <div className="os-code-brand">
          <span className="os-badge is-live">{isScratch ? "Scratchpad" : "Open Source Explorer"}</span>
          <label className="os-code-select">
            <span className="mono">{labelRepo}:</span>
            <select aria-label={labelRepo} value={baseRepo.entryId} onChange={(e) => selectRepo(e.target.value)}>
              {REPO_PROJECTS.map((r) => (
                <option key={r.entryId} value={r.entryId}>
                  {r.name} ({r.repoLabel})
                </option>
              ))}
            </select>
          </label>
          {!isScratch && (
            <button type="button" className="os-button mono os-code-blank-btn" onClick={() => selectRepo("scratch")}>
              + {labelBlank}
            </button>
          )}
        </div>

        <nav className="os-code-modes" aria-label={labelCode}>
          <button type="button" aria-current={viewMode === "editor" ? "page" : undefined} onClick={() => setViewMode("editor")}>
            {labelEditor}
          </button>
          {!isScratch && (
            <>
              <button type="button" aria-current={viewMode === "commits" ? "page" : undefined} onClick={() => setViewMode("commits")}>
                {labelCommits} ({baseRepo.commits.length})
              </button>
              <button type="button" aria-current={viewMode === "arch" ? "page" : undefined} onClick={() => setViewMode("arch")}>
                {labelArch}
              </button>
            </>
          )}
        </nav>

        {baseRepo.repoUrl && (
          <a className="os-code-ext mono" href={baseRepo.repoUrl} target="_blank" rel="noopener">
            {baseRepo.repoLabel} ↗
          </a>
        )}
      </header>

      <div className={`os-code-workspace${viewMode === "editor" ? "" : " is-solo"}`}>
        {/* The file list only matters while editing; commits and architecture get the full width. */}
        {viewMode === "editor" && (
        <aside className="os-code-tree" aria-label={labelFiles}>
          <div className="os-code-tree-section">
            <div className="os-code-tree-head">
              <p className="mono">{labelFiles}</p>
              {isScratch && (
                <button type="button" className="os-code-add-btn mono" onClick={() => setCreatingFile((v) => !v)}>
                  + {labelNewFile}
                </button>
              )}
            </div>

            {isScratch && creatingFile && (
              <form
                className="os-code-newfile"
                onSubmit={(e) => {
                  e.preventDefault()
                  createScratchFile()
                }}
              >
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="ex: script.js"
                  aria-label={labelNewFile}
                  autoFocus
                />
                <button type="submit" className="os-button mono">OK</button>
              </form>
            )}

            <ul>
              {files.map((file) => (
                <li key={file.path}>
                  <button
                    type="button"
                    aria-current={viewMode === "editor" && activeFile?.path === file.path ? "true" : undefined}
                    onClick={() => openFile(file.path)}
                  >
                    <span className="os-code-lang mono">{file.lang.toUpperCase()}</span>
                    <span>{file.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </aside>
        )}

        <div className="os-code-main">
          {viewMode === "editor" && activeFile && (
            <>
              <div className="os-code-tabs" role="tablist">
                {openPaths.map((path) => (
                  <div key={path} className={`os-code-tab${path === activeFile.path ? " is-active" : ""}`}>
                    <button type="button" role="tab" aria-selected={path === activeFile.path} onClick={() => setActivePath(path)}>
                      {path.split("/").pop()}
                    </button>
                    {openPaths.length > 1 && (
                      <button
                        type="button"
                        className="os-code-tab-close"
                        aria-label={`${data.ui.shell.close} ${path}`}
                        onClick={() => closeTab(path)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {!isScratch && (
                  <button
                    type="button"
                    className="os-code-fork-btn mono"
                    onClick={() => forkFileToScratch(activeFile)}
                  >
                    ✎ {labelFork}
                  </button>
                )}
              </div>

              <div className="os-code-editor" role="region" aria-label={activeFile.path}>
                {isScratch ? (
                  <div className="os-code-writable">
                    <div className="os-code-gutter" aria-hidden="true">
                      {activeFile.lines.map((_, i) => (
                        <span key={i} className="os-code-ln">{i + 1}</span>
                      ))}
                    </div>
                    <textarea
                      className="os-code-textarea mono"
                      aria-label={`Editor ${activeFile.path}`}
                      value={activeFile.lines.join("\n")}
                      spellCheck={false}
                      onChange={(e) => updateScratchContent(activeFile.path, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") {
                          e.preventDefault()
                          const el = e.currentTarget
                          const start = el.selectionStart
                          const end = el.selectionEnd
                          const current = activeFile.lines.join("\n")
                          const next = `${current.slice(0, start)}  ${current.slice(end)}`
                          updateScratchContent(activeFile.path, next)
                          requestAnimationFrame(() => {
                            el.selectionStart = el.selectionEnd = start + 2
                          })
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="os-code-lines">
                    {activeFile.lines.map((line, i) => (
                      <div key={i} className={`os-code-line ${classifyLine(line, activeFile.lang) ?? ""}`}>
                        <span className="os-code-ln" aria-hidden="true">{i + 1}</span>
                        <span className="os-code-src">{line || " "}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === "commits" && (
            <div className="os-code-pane">
              <h3>{labelCommits} · {baseRepo.repoLabel}</h3>
              <ul className="os-code-commits">
                {baseRepo.commits.map((c) => (
                  <li key={c.id} className={selectedCommitId === c.id ? "is-selected" : undefined}>
                    <div className="os-code-commit-head">
                      <span className="os-badge is-live">{c.id}</span>
                      <time className="mono" dateTime={c.date}>{c.date}</time>
                    </div>
                    <strong>{c.title}</strong>
                    <span className="mono">{c.stats}</span>
                    {c.url && (
                      <a className="mono" href={c.url} target="_blank" rel="noopener">
                        {c.url} ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {viewMode === "arch" && (
            <div className="os-code-pane">
              <h3>{baseRepo.name} · {labelArch}</h3>
              {entry ? (
                <>
                  <p>{entry.description}</p>
                  {entry.stack.length > 0 && (
                    <ul className="os-chips" aria-label={data.ui.entry.stack}>
                      {entry.stack.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  )}
                  {entry.proven.length > 0 && (
                    <section>
                      <h3>{data.ui.entry.proven}</h3>
                      <ul className="os-facts">
                        {entry.proven.map((p) => <li key={p}>{p}</li>)}
                      </ul>
                    </section>
                  )}
                  {entry.planned.length > 0 && (
                    <section>
                      <h3 className="is-plan">{data.ui.entry.planned}</h3>
                      <ul className="os-facts is-plan">
                        {entry.planned.map((p) => <li key={p}>{p}</li>)}
                      </ul>
                    </section>
                  )}
                </>
              ) : (
                <p>{baseRepo.verificationSummary}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="os-code-status">
        <span className="mono">⎇ {baseRepo.branch}</span>
        <span className="mono os-code-summary">✓ {baseRepo.verificationSummary}</span>
        <button type="button" className="os-button mono" onClick={openTerminal}>
          {t.terminal}
        </button>
      </footer>
    </div>
  )
}
