import { useMemo, useState } from "react"
import { fill } from "../format"
import { prefersReducedMotion } from "../shell"
import type { OsData } from "../types"

type CalEvent = {
  date: string // YYYY-MM-DD
  title: string
  source?: string
  url?: string | null
  kind: "milestone" | "egg"
  /** The founder's birthday: shows the candle. */
  birthday?: boolean
}

const pad = (n: number) => String(n).padStart(2, "0")
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

const parseIso = (iso: string) => {
  const [y = 2026, m = 11, d = 1] = iso.split("-").map(Number)
  return { year: y, month: m - 1, day: d }
}

/**
 * System Calendar: displays verified project/PR dates from the Evidence Ledger,
 * system build milestones, and seasonal Fuwarch easter eggs on special dates.
 */
export function CalendarApp({ data }: { data: OsData }) {
  const t = data.ui.apps

  const milestones = useMemo<CalEvent[]>(() => {
    const items: CalEvent[] = data.ledger.map((l) => ({
      date: l.verifiedOn,
      title: l.claim,
      source: l.source,
      url: l.url,
      kind: "milestone",
    }))
    if (data.system.measuredAt) {
      const buildDate = data.system.measuredAt.slice(0, 10)
      items.push({
        date: buildDate,
        title: `${data.site.osName} v${data.system.version}`,
        source: data.site.name,
        url: null,
        kind: "milestone",
      })
    }
    return items.sort((a, b) => b.date.localeCompare(a.date))
  }, [data.ledger, data.site.name, data.site.osName, data.system.measuredAt, data.system.version])

  const initialIso = milestones[0]?.date ?? new Date().toISOString().slice(0, 10)
  const initialParsed = parseIso(initialIso)

  const [viewYear, setViewYear] = useState(initialParsed.year)
  const [viewMonth, setViewMonth] = useState(initialParsed.month)
  const [selectedDate, setSelectedDate] = useState(initialIso)

  // Seasonal easter eggs keyed by MM-DD so they work in whichever year the visitor browses.
  const eggMap: Record<string, string> = {
    "11-03": t.calendar_egg_1103,
    "10-31": t.calendar_egg_1031,
    "09-13": t.calendar_egg_0913,
    "01-01": t.calendar_egg_0101,
  }

  // The founder's birthday (from site.yml) is an egg on that day of every year, with his age that year.
  const birthday = data.site.founderBirthday
  const [blown, setBlown] = useState(false)

  const eventsForDate = (iso: string): CalEvent[] => {
    const found = milestones.filter((m) => m.date === iso)
    const mmdd = iso.slice(5)
    const events = [...found]
    const egg = eggMap[mmdd]
    if (egg) events.push({ date: iso, title: egg, kind: "egg" })
    if (birthday && mmdd === birthday.slice(5)) {
      const age = Number(iso.slice(0, 4)) - Number(birthday.slice(0, 4))
      if (age >= 0) events.push({ date: iso, title: fill(t.calendar_egg_0307, { age: String(age) }), kind: "egg", birthday: true })
    }
    return events
  }

  const monthTitle = new Intl.DateTimeFormat(data.locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(viewYear, viewMonth, 1)),
  )

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(data.locale, { weekday: "short", timeZone: "UTC" })
    // 2024-01-07 is a Sunday
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2024, 0, 7 + i))))
  }, [data.locale])

  const firstWeekday = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate()

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const jumpToDate = (iso: string) => {
    const parsed = parseIso(iso)
    setViewYear(parsed.year)
    setViewMonth(parsed.month)
    setSelectedDate(iso)
  }

  const goToday = () => {
    const todayIso = new Date().toISOString().slice(0, 10)
    jumpToDate(todayIso)
  }

  const selectedEvents = eventsForDate(selectedDate)

  return (
    <div className="os-calendar">
      <div className="os-cal-main">
        <header className="os-cal-head">
          <h2>{monthTitle}</h2>
          <div className="os-cal-nav">
            <button type="button" className="os-button" aria-label={t.calendar_prev} onClick={prevMonth}>
              ‹
            </button>
            <button type="button" className="os-button" onClick={goToday}>
              {t.calendar_today}
            </button>
            <button type="button" className="os-button" aria-label={t.calendar_next} onClick={nextMonth}>
              ›
            </button>
          </div>
        </header>

        <div className="os-cal-grid" role="grid" aria-label={monthTitle}>
          {weekdays.map((day, idx) => (
            <span key={idx} className="os-cal-weekday mono">
              {day}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`pad-${i}`} className="os-cal-empty" aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const iso = toIso(viewYear, viewMonth, day)
            const dayEvents = eventsForDate(iso)
            const hasMilestone = dayEvents.some((e) => e.kind === "milestone")
            const hasEgg = dayEvents.some((e) => e.kind === "egg")
            const isSelected = iso === selectedDate
            const isBirthday = dayEvents.some((e) => e.birthday)
            return (
              <button
                key={iso}
                type="button"
                aria-label={iso}
                aria-pressed={isSelected}
                className={`os-cal-day${isSelected ? " is-selected" : ""}${hasMilestone ? " has-milestone" : ""}${hasEgg ? " has-egg" : ""}${isBirthday ? " is-birthday" : ""}`}
                onClick={() => { setSelectedDate(iso); setBlown(false) }}
              >
                <span>{day}</span>
                {(hasMilestone || hasEgg) && (
                  <span className="os-cal-dots" aria-hidden="true">
                    {hasMilestone && <i className="os-cal-dot is-milestone" />}
                    {hasEgg && <i className="os-cal-dot is-egg" />}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <aside className="os-cal-side" aria-live="polite">
        <section>
          <h3>
            {t.calendar_selected} · <time dateTime={selectedDate}>{selectedDate}</time>
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="os-note">{t.calendar_empty_day}</p>
          ) : (
            <ul className="os-cal-events">
              {selectedEvents.map((ev, i) => (
                <li key={`${ev.date}-${i}`} className={ev.kind === "egg" ? "is-egg" : undefined}>
                  {ev.kind === "egg" && <span className="os-badge">{t.calendar_egg_badge}</span>}
                  <strong>{ev.title}</strong>
                  {ev.birthday && (
                    <div className="os-cal-candle">
                      {blown ? (
                        <p className="os-cal-wish" role="status">
                          {t.calendar_candle_done}
                          {!prefersReducedMotion() && (
                            <span className="os-confetti" aria-hidden="true">
                              {Array.from({ length: 18 }, (_, n) => <i key={n} style={{ ["--n" as string]: n }} />)}
                            </span>
                          )}
                        </p>
                      ) : (
                        <button type="button" className="os-button" onClick={() => setBlown(true)}>
                          <svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14" style={{ marginRight: 6, verticalAlign: "-2px" }}>
                            <path d="M12 3c1.8 2.2 2.2 3.8 0 5.5-2.2-1.7-1.8-3.3 0-5.5z" fill="currentColor" />
                            <rect x="9" y="10" width="6" height="10" rx="1.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.6" />
                          </svg>
                          {t.calendar_candle}
                        </button>
                      )}
                    </div>
                  )}
                  {ev.source && (
                    <span className="mono">
                      {ev.url ? (
                        <a href={ev.url} target="_blank" rel="noopener">
                          {ev.source} ↗
                        </a>
                      ) : (
                        ev.source
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>{t.calendar_milestones}</h3>
          <ul className="os-cal-timeline">
            {milestones.map((m, i) => (
              <li key={`${m.date}-${i}`}>
                <button type="button" onClick={() => jumpToDate(m.date)} aria-current={m.date === selectedDate ? "true" : undefined}>
                  <time className="mono" dateTime={m.date}>{m.date}</time>
                  <span>{m.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}
