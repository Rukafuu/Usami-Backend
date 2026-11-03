import { setConsent, useConsent } from "../consent"
import type { OsData } from "../types"

const elapsed = (from: string | null, to: string | null, locale: string) => {
  if (!from || !to) return null
  const minutes = Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 60_000))
  const hours = Math.floor(minutes / 60)
  const fmt = new Intl.NumberFormat(locale)
  return hours > 0 ? `${fmt.format(hours)} h ${fmt.format(minutes % 60)} min` : `${fmt.format(minutes)} min`
}

const fmtFor = (locale: string, n: number) => new Intl.NumberFormat(locale).format(n)

/** "About this system": real build metadata. Anything not measured says so instead of guessing. */
export function AboutApp({ data }: { data: OsData }) {
  const { system, ui, locale } = data
  const t = ui.apps
  const consent = useConsent()
  const num = (n: number | null) => (n === null ? t.not_measured : new Intl.NumberFormat(locale).format(n))
  const freshInput =
    system.tokens.input === null && system.tokens.cacheCreation === null
      ? null
      : (system.tokens.input ?? 0) + (system.tokens.cacheCreation ?? 0)
  const measured = system.measuredAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(system.measuredAt))
    : t.not_measured

  const rows: [string, string][] = [
    [t.about_models, system.models.join(", ")],
    [t.about_prompts, num(system.prompts)],
    [t.about_responses, num(system.apiResponses)],
    [t.about_tokens_out, num(system.tokens.output)],
    [t.about_tokens_in, num(freshInput)],
    [t.about_total, num(system.totalTokens)],
    [t.about_tokens_cache, num(system.tokens.cacheRead)],
    [t.about_time, elapsed(system.startedAt, system.measuredAt, locale) ?? t.not_measured],
    [t.about_measured, measured],
  ]

  return (
    <div className="os-about">
      <header>
        <img src="/brand/logo-192.png" alt="" width="64" height="64" />
        <div>
          <h2>{data.site.osName}</h2>
          <p className="mono">v{system.version} · {data.site.name}</p>
        </div>
      </header>

      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="os-note">{t.about_total_note}</p>
      <p className="os-note">{t.about_note}</p>
      <p className="os-note">{t.about_emulated}</p>

      <h3>{t.about_mascot_title}</h3>
      <p>{t.about_mascot_text}</p>

      <h3>{t.about_env_title}</h3>
      <dl>
        <div>
          <dt>{t.about_env_host}</dt>
          <dd>Browser Web (SPA + SSR fallback)</dd>
        </div>
        <div>
          <dt>{t.about_env_storage}</dt>
          <dd>localStorage / sessionStorage (usamios:*)</dd>
        </div>
        <div>
          <dt>{t.about_env_files}</dt>
          <dd>{fmtFor(locale, data.entries.length)} ({fmtFor(locale, data.ledger.length)} {data.ui.evidence.title.toLowerCase()})</dd>
        </div>
      </dl>

      <h3>{ui.consent.about_title}</h3>
      <p>{consent === "all" ? ui.consent.current_all : ui.consent.current_essential}</p>
      <p className="os-about-consent">
        <button type="button" className="os-button" aria-pressed={consent === "essential"} onClick={() => setConsent("essential")}>{ui.consent.essential}</button>
        <button type="button" className="os-button is-primary" aria-pressed={consent === "all"} onClick={() => setConsent("all")}>{ui.consent.all}</button>
      </p>
      <p className="os-note">
        <a href={`/${locale}/privacidade`} target="_blank" rel="noopener">{ui.consent.privacy} ↗</a>
        {" · "}
        <a href={`/${locale}/cookies`} target="_blank" rel="noopener">{ui.consent.cookies} ↗</a>
      </p>

      <h3>{t.about_libraries}</h3>
      <table>
        <tbody>
          {system.libraries.map((lib) => (
            <tr key={`${lib.ecosystem}:${lib.name}`}>
              <td>{lib.name}</td>
              <td className="mono">{lib.version ?? "—"}</td>
              <td className="mono">{lib.ecosystem}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
