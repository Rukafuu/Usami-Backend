import { useEffect, useState, type ReactNode } from "react"
import { ACCENTS, ICON_SIZES, TEXT_SIZES, VISIONS, WALLPAPERS, WALLPAPER_IMAGES, useShell, type SettingsCategory, type Theme } from "../shell"
import { LayoutSettings } from "./LayoutSettings"
import { canUninstall, isLocked, isPlaced } from "../placement"
import { reinstallApp } from "../installer"
import { APP_IDS, AppIcon, type AppId, type Slot } from "../registry"
import type { Locale, OsData } from "../types"

const LANGS: { code: Locale; label: string; lang: string }[] = [
  { code: "pt", label: "Português", lang: "pt-BR" },
  { code: "en", label: "English", lang: "en" },
  { code: "es", label: "Español", lang: "es" },
  { code: "ja", label: "日本語", lang: "ja" },
]

type Category = SettingsCategory
const SLOT_COLUMNS: Slot[] = ["desktop", "taskbar", "home", "dock"]
const CATEGORIES: Category[] = ["appearance", "wallpaper", "apps", "layout", "display", "language", "system"]

function Radios<T extends string>({ name, legend, options, value, onChange, note, disabled }: {
  name: string
  legend: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  note?: ReactNode
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled}>
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.value}>
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.label}
        </label>
      ))}
      {note && <p className="os-note">{note}</p>}
    </fieldset>
  )
}

/** System settings, grouped like a real OS. Every choice applies instantly and persists in this browser. */
export function SettingsApp({ data, alternates }: { data: OsData; alternates: Record<Locale, string> }) {
  const [category, setCategory] = useState<Category>("appearance")
  const prefs = useShell()
  const { setPref, resetPrefs } = prefs

  // Something else (the taskbar language button) can ask Settings to open on a given category.
  const requested = useShell((s) => s.settingsCategory)
  useEffect(() => {
    if (requested) setCategory(requested)
  }, [requested])
  const t = data.ui.apps
  const sizeLabels: Record<string, string> = { small: t.size_small, default: t.size_default, large: t.size_large, xl: t.size_xl }
  const categoryLabels: Record<Category, string> = {
    appearance: t.cat_appearance, wallpaper: t.cat_wallpaper, apps: t.cat_apps, layout: t.cat_layout, display: t.cat_display, language: t.cat_language, system: t.cat_system,
  }
  const themeValue = prefs.theme ?? "system"
  const accentLocked = prefs.vision !== "none"

  return (
    <div className="os-settings">
      <nav aria-label={t.settings}>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" aria-current={c === category ? "page" : undefined} onClick={() => setCategory(c)}>
            {categoryLabels[c]}
          </button>
        ))}
      </nav>

      <form className="os-settings-pane" onSubmit={(e) => e.preventDefault()}>
        {category === "appearance" && (
          <>
            <Radios<"system" | Theme>
              name="theme" legend={t.theme} value={themeValue}
              onChange={(v) => setPref("theme", v === "system" ? null : v)}
              options={[{ value: "system", label: t.theme_system }, { value: "light", label: t.theme_light }, { value: "dark", label: t.theme_dark }]}
            />
            <Radios
              name="vision" legend={t.vision} value={prefs.vision} onChange={(v) => setPref("vision", v)} note={t.vision_note}
              options={VISIONS.map((v) => ({ value: v, label: t[`vision_${v === "none" ? "none" : v}` as keyof typeof t] as string }))}
            />
            <fieldset disabled={accentLocked}>
              <legend>{t.accent}</legend>
              <div className="os-swatches">
                {ACCENTS.map((a) => (
                  <label key={a} className="os-swatch os-accent" data-accent-preview={a}>
                    <input type="radio" name="accent" checked={prefs.accent === a} onChange={() => setPref("accent", a)} />
                    <span className="os-swatch-preview" aria-hidden="true" />
                    {t.accents[a]}
                  </label>
                ))}
              </div>
              {accentLocked && <p className="os-note">{t.accent_locked}</p>}
            </fieldset>
          </>
        )}

        {category === "apps" && (
          <fieldset>
            <legend>{t.cat_apps}</legend>
            <p className="os-note">{t.apps_note}</p>
            <div className="os-table">
              <table className="os-placement">
                <thead>
                  <tr>
                    <td />
                    <th scope="colgroup" colSpan={2}>{t.slot_group_pc}</th>
                    <th scope="colgroup" colSpan={2}>{t.slot_group_phone}</th>
                  </tr>
                  <tr>
                    <th scope="col">{t.cat_apps}</th>
                    {SLOT_COLUMNS.map((slot) => (
                      <th key={slot} scope="col">{t[`slot_${slot}` as keyof typeof t] as string}</th>
                    ))}
                    <th scope="col">{t.app_install}</th>
                  </tr>
                </thead>
                <tbody>
                  {APP_IDS.map((id: AppId) => (
                    <tr key={id}>
                      <th scope="row">
                        <span className="os-taskmgr-app"><AppIcon id={id} />{t[id]}{prefs.uninstalled.includes(id) ? ` (${t.app_uninstalled})` : ""}</span>
                      </th>
                      {SLOT_COLUMNS.map((slot: Slot, column: number) => {
                        const placed = isPlaced(prefs.placement, id, slot)
                        const locked = isLocked(id, slot)
                        return (
                          <td key={slot} data-label={`${column < 2 ? t.slot_group_pc : t.slot_group_phone} · ${t[`slot_${slot}` as keyof typeof t] as string}`}>
                            <input
                              type="checkbox"
                              checked={placed}
                              disabled={locked || prefs.uninstalled.includes(id)}
                              title={locked ? t.apps_locked : undefined}
                              aria-label={`${t[id]} — ${t[`slot_${slot}` as keyof typeof t] as string}`}
                              onChange={(e) => prefs.setPlaced(id, slot, e.target.checked)}
                            />
                          </td>
                        )
                      })}
                      <td>
                        {prefs.uninstalled.includes(id) ? (
                          <button type="button" className="os-button" onClick={() => reinstallApp(id)}>{t.app_reinstall}</button>
                        ) : canUninstall(id) ? (
                          <button type="button" className="os-button" aria-label={`${t.app_uninstall} ${t[id]}`} onClick={() => prefs.askUninstall(id)}>{t.app_uninstall}</button>
                        ) : (
                          <span className="os-note" title={t.ctx_essential}>{t.app_essential}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="os-button" onClick={prefs.resetPlacement}>
              {t.apps_reset}
            </button>
          </fieldset>
        )}
        {category === "layout" && <LayoutSettings data={data} />}

        {category === "wallpaper" && (
          <fieldset>
            <legend>{t.wallpaper}</legend>
            <div className="os-wallpapers">
              {WALLPAPERS.map((w) => (
                <label key={w} className="os-swatch os-wp" data-wallpaper={w}>
                  <input type="radio" name="wallpaper" checked={prefs.wallpaper === w} onChange={() => setPref("wallpaper", w)} />
                  <span
                    className="os-swatch-preview"
                    aria-hidden="true"
                    style={WALLPAPER_IMAGES[w] ? { backgroundImage: `url(${WALLPAPER_IMAGES[w]?.thumb})` } : undefined}
                  />
                  {t.wallpapers[w]}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {category === "display" && (
          <>
            <Radios name="text" legend={t.text_size} value={prefs.textSize} onChange={(v) => setPref("textSize", v)}
              options={TEXT_SIZES.map((s) => ({ value: s, label: sizeLabels[s] ?? s }))} />
            <Radios name="icons" legend={t.icon_size} value={prefs.iconSize} onChange={(v) => setPref("iconSize", v)}
              options={ICON_SIZES.map((s) => ({ value: s, label: sizeLabels[s] ?? s }))} />
            <Radios name="motion" legend={t.motion} value={prefs.motion} onChange={(v) => setPref("motion", v)}
              options={[{ value: "system", label: t.motion_system }, { value: "reduce", label: t.motion_reduce }]} />
            <fieldset>
              <label>
                <input type="checkbox" checked={prefs.glass} onChange={(e) => setPref("glass", e.target.checked)} />
                {t.transparency}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={prefs.cursor === "paw"}
                  onChange={(e) => setPref("cursor", e.target.checked ? "paw" : "system")}
                />
                {t.paw_cursor || "Cursor de patinha rosa"}
              </label>
            </fieldset>
          </>
        )}

        {category === "language" && (
          <Radios<Locale>
            name="language" legend={data.ui.shell.language} value={data.locale}
            // The language is part of the URL (each page exists in four languages), so choosing one loads that page.
            onChange={(code) => window.location.assign(alternates[code])}
            options={LANGS.map((l) => ({ value: l.code, label: l.label }))}
          />
        )}

        {category === "system" && (
          <fieldset>
            <legend>{t.cat_system}</legend>
            <button type="button" className="os-button" onClick={resetPrefs}>
              {t.reset}
            </button>
          </fieldset>
        )}
      </form>
    </div>
  )
}
