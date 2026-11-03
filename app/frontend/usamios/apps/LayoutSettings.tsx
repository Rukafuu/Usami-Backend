import { groupLabel } from "../components/Groups"
import { addToGroup, buildItems, createGroup, deleteGroup, moveItem, removeFromGroup, renameGroup, groupOf, type Surface } from "../layout"
import { placedApps } from "../placement"
import { AppIcon, type AppId } from "../registry"
import { useShell } from "../shell"
import type { OsData } from "../types"

const WITH = "with:"
const NONE = "__none__"

/** Arrange the icons of one surface: order with arrows, groups with a name and members. Works with keyboard and touch. */
function SurfaceLayout({ surface, data }: { surface: Surface; data: OsData }) {
  const t = data.ui.apps
  const placement = useShell((s) => s.placement)
  const uninstalled = useShell((s) => s.uninstalled)
  const arrangement = useShell((s) => s.layouts[surface])
  const { setArrangement } = useShell.getState()

  const placed = placedApps(placement, surface === "desktop" ? "desktop" : "home", uninstalled)
  const items = buildItems(placed, arrangement)
  const title = surface === "desktop" ? `${t.slot_group_pc} · ${t.slot_desktop}` : `${t.slot_group_phone} · ${t.slot_home}`
  const titles = (id: AppId) => t[id]

  const assign = (id: AppId, value: string) => {
    if (value === NONE) setArrangement(surface, (a) => removeFromGroup(a, id))
    else if (value.startsWith(WITH)) {
      // "Group with <app>": the two apps become a new group (a group needs at least two).
      const other = value.slice(WITH.length) as AppId
      setArrangement(surface, (a) => createGroup(a, "", [other, id], placed, other).arrangement)
    }
    else setArrangement(surface, (a) => addToGroup(a, value, id))
  }

  return (
    <section className="os-layout" aria-label={title}>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="os-note">{t.layout_empty}</p>
      ) : (
        <ol className="os-layout-list" aria-label={t.layout_order}>
          {items.map((item, index) => {
            const name = item.kind === "app" ? titles(item.id) : groupLabel(item.group, arrangement.groups.indexOf(item.group), data)
            return (
              <li key={item.key}>
                <span className="os-taskmgr-app">
                  {item.kind === "app" ? <AppIcon id={item.id} /> : <span className="os-mini-group" aria-hidden="true" />}
                  {name}
                </span>
                {item.kind === "app" && (
                  <label className="os-layout-select">
                    <span className="sr-only">{`${name} — ${t.layout_group_select}`}</span>
                    <select value={groupOf(arrangement, item.id)?.id ?? NONE} onChange={(e) => assign(item.id, e.target.value)}>
                      <option value={NONE}>{t.layout_no_group}</option>
                      {arrangement.groups.map((g, i) => (
                        <option key={g.id} value={g.id}>{groupLabel(g, i, data)}</option>
                      ))}
                      {!groupOf(arrangement, item.id) && (
                        <optgroup label={t.layout_new_group}>
                          {items.filter((o) => o.kind === "app" && o.id !== item.id).map((o) => (
                            <option key={o.key} value={`${WITH}${(o as { id: AppId }).id}`}>{`${t.layout_group_with} ${titles((o as { id: AppId }).id)}`}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </label>
                )}
                <span className="os-layout-arrows">
                  <button type="button" className="os-button" disabled={index === 0} aria-label={`${name} — ${t.layout_move_up}`}
                    onClick={() => setArrangement(surface, (a) => moveItem(a, placed, item.key, -1))}>↑</button>
                  <button type="button" className="os-button" disabled={index === items.length - 1} aria-label={`${name} — ${t.layout_move_down}`}
                    onClick={() => setArrangement(surface, (a) => moveItem(a, placed, item.key, 1))}>↓</button>
                </span>
              </li>
            )
          })}
        </ol>
      )}

      {arrangement.groups.length > 0 && (
        <div className="os-layout-groups">
          <h4>{t.layout_groups}</h4>
          {arrangement.groups.map((g, i) => (
            <div key={g.id} className="os-layout-group">
              <label>
                <span className="sr-only">{`${groupLabel(g, i, data)} — ${t.layout_group_name}`}</span>
                <input
                  type="text"
                  value={g.name}
                  maxLength={40}
                  placeholder={groupLabel({ ...g, name: "" }, i, data)}
                  aria-label={`${groupLabel(g, i, data)} — ${t.layout_group_name}`}
                  onChange={(e) => setArrangement(surface, (a) => renameGroup(a, g.id, e.target.value))}
                />
              </label>
              <span className="os-note">{g.apps.length ? g.apps.map(titles).join(", ") : t.layout_group_empty}</span>
              <button type="button" className="os-button" onClick={() => setArrangement(surface, (a) => deleteGroup(a, g.id))}>
                {t.layout_delete_group}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function LayoutSettings({ data }: { data: OsData }) {
  return (
    <div className="os-layout-pane">
      <p className="os-note">{data.ui.apps.layout_note}</p>
      <SurfaceLayout surface="desktop" data={data} />
      <SurfaceLayout surface="home" data={data} />
    </div>
  )
}
