import { useState, type FormEvent } from "react"
import type { OsData } from "../types"

// Same lists and limits as app/models/contact_request.rb and cloudflare/worker/contact.ts.
const SERVICES = ["design_engineering", "design_system", "ai_agents", "fullstack", "consulting"]
const BUDGETS = ["under_5k", "5k_to_15k", "15k_to_30k", "over_30k", "international_usd"]
const TIMELINES = ["urgent", "standard", "flexible"]

type Status = "idle" | "sending" | "sent" | "invalid" | "failed"

/** The quote request, inside the emulated system. It posts to the same endpoint as the /contato page; the Worker emails it. */
export function QuoteApp({ data }: { data: OsData }) {
  const t = data.ui.contact_form
  const email = data.entries.flatMap((e) => e.sources).find((s) => s.icon === "email")?.detail
  const [status, setStatus] = useState<Status>("idle")
  const [formKey, setFormKey] = useState(0)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = new FormData(event.currentTarget)
    setStatus("sending")
    try {
      const response = await fetch(`/${data.locale}/contato`, { method: "POST", body, headers: { Accept: "application/json" } })
      setStatus(response.ok ? "sent" : response.status === 422 ? "invalid" : "failed")
    } catch {
      setStatus("failed")
    }
  }

  if (status === "sent") {
    return (
      <div className="os-quote os-quote-done" role="status">
        <h2>{data.ui.thanks_page.heading}</h2>
        <p>{data.ui.thanks_page.lead}</p>
        <button type="button" className="os-button" onClick={() => { setFormKey((k) => k + 1); setStatus("idle") }}>{t.app_again}</button>
      </div>
    )
  }

  return (
    <form className="os-quote" key={formKey} onSubmit={submit}>
      <header>
        <h2>{t.heading}</h2>
        <p>{t.lead}</p>
      </header>

      <div className="os-quote-row">
        <label>
          <span>{t.fields.name}</span>
          <input type="text" name="contact_request[name]" placeholder={t.placeholders.name} required maxLength={100} autoComplete="name" />
        </label>
        <label>
          <span>{t.fields.email}</span>
          <input type="email" name="contact_request[email]" placeholder={t.placeholders.email} required maxLength={120} autoComplete="email" />
        </label>
      </div>

      <label>
        <span>{t.fields.contact_handle}</span>
        <input type="text" name="contact_request[contact_handle]" placeholder={t.placeholders.contact_handle} maxLength={100} />
        <small>{t.hints.contact_handle}</small>
      </label>

      <fieldset>
        <legend>{t.fields.services}</legend>
        <small>{t.hints.services}</small>
        <div className="os-quote-chips">
          {SERVICES.map((id) => (
            <label key={id} className="os-quote-chip">
              <input type="checkbox" name="contact_request[services][]" value={id} />
              <span>{t.services[id]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>{t.fields.budget}</legend>
        <small>{t.hints.budget}</small>
        <div className="os-quote-chips">
          {BUDGETS.map((id) => (
            <label key={id} className="os-quote-chip">
              <input type="radio" name="contact_request[budget]" value={id} />
              <span>{t.budgets[id]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>{t.fields.timeline}</legend>
        <div className="os-quote-chips">
          {TIMELINES.map((id) => (
            <label key={id} className="os-quote-chip">
              <input type="radio" name="contact_request[timeline]" value={id} />
              <span>{t.timelines[id]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        <span>{t.fields.details}</span>
        <textarea name="contact_request[details]" rows={5} placeholder={t.placeholders.details} required minLength={10} maxLength={4000} />
        <small>{t.hints.details}</small>
      </label>

      {/* Anti-spam trap: people never see it, bots fill it. */}
      <div className="os-quote-trap" aria-hidden="true">
        <input type="text" name="contact_request[honeypot]" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "invalid" && <p className="os-quote-error" role="alert">{t.app_error_invalid}</p>}
      {status === "failed" && <p className="os-quote-error" role="alert">{t.app_error_failed} {email ?? ""}</p>}

      <div className="os-quote-actions">
        <button type="submit" className="os-button is-primary" disabled={status === "sending"}>{status === "sending" ? t.app_sending : t.submit}</button>
        <p className="os-note">{t.privacy_note} {t.promise_text}</p>
      </div>
    </form>
  )
}