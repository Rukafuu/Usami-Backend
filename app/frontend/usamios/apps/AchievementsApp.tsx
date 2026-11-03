import { ACHIEVEMENT_IDS, CORE_PROJECT_IDS, useAchievements, type AchievementId } from "../achievements"
import type { OsData } from "../types"

type AchievementMeta = {
  title: string
  desc: string
  hint: string
}

const FALLBACK_META: Record<AchievementId, AchievementMeta> = {
  first_boot: {
    title: "Bem-vindo ao Fuwarch",
    desc: "Iniciou uma sessão no ambiente desktop Fuwarch Linux.",
    hint: "Basta ligar o Fuwarch Web.",
  },
  terminal_opened: {
    title: "Linha de Comando",
    desc: "Abriu o terminal virtual fuwarch-sh.",
    hint: "Abra o aplicativo Terminal.",
  },
  ide_visited: {
    title: "Engenharia Aberta",
    desc: "Inspecionou código e PRs reais no Usami Code Studio.",
    hint: "Abra o Usami Code Studio.",
  },
  chatted_usami: {
    title: "Guia do Sistema",
    desc: "Conversou com a Usami no Usami Messenger.",
    hint: "Envie uma pergunta no Usami Messenger.",
  },
  all_projects: {
    title: "Explorador de Projetos",
    desc: "Visitou os 5 projetos principais (Hane, LiraVtuber, Usami, Énois e Laya).",
    hint: "Explore Hane, LiraVtuber, Usami, Énois e Laya no Explorer ou na IDE.",
  },
  customizer: {
    title: "Identidade Própria",
    desc: "Personalizou tema, papel de parede ou cores nas Configurações.",
    hint: "Altere uma preferência em Configurações.",
  },
  scratch_coder: {
    title: "Mão na Massa",
    desc: "Escreveu código próprio no Projeto em Branco (Scratchpad) da IDE.",
    hint: "Edite ou crie um arquivo no modo Scratchpad do Code Studio.",
  },
  easter_egg: {
    title: "Caçador de Segredos",
    desc: "Descobriu um easter egg escondido no Fuwarch Linux.",
    hint: "Experimente o código Konami, faça carinho no Fuwarch ou chame a atenção da Usami no Messenger.",
  },
}

export const getAchievementMeta = (data: OsData, id: AchievementId): AchievementMeta => {
  const custom = data.ui.apps.achievements_items?.[id]
  return custom ?? FALLBACK_META[id]
}

export function AchievementsApp({ data }: { data: OsData }) {
  const unlocked = useAchievements((s) => s.unlocked)
  const visitedProjects = useAchievements((s) => s.visitedProjects)
  const reset = useAchievements((s) => s.reset)
  const t = data.ui.apps

  const unlockedCount = ACHIEVEMENT_IDS.filter((id) => Boolean(unlocked[id])).length
  const totalCount = ACHIEVEMENT_IDS.length
  const pct = Math.round((unlockedCount / totalCount) * 100)

  const labelTitle = t.achievements || "Conquistas"
  const labelSubtitle =
    t.achievements_subtitle ||
    "Conquistas salvas localmente no navegador (localStorage) enquanto você explora o Fuwarch Linux."
  const labelProgress = t.achievements_progress || "Progresso da exploração"
  const labelUnlocked = t.achievements_unlocked || "Desbloqueada"
  const labelLocked = t.achievements_locked || "Bloqueada"
  const labelProjectsVisited = t.achievements_projects_visited || "Projetos inspecionados"
  const labelReset = t.achievements_reset || "Reiniciar conquistas"

  return (
    <div className="os-achievements">
      <header className="os-ach-head">
        <div>
          <h2>{labelTitle}</h2>
          <p className="os-note">{labelSubtitle}</p>
        </div>
        <div className="os-ach-summary">
          <span className="mono os-ach-count">
            {unlockedCount} / {totalCount} ({pct}%)
          </span>
          <button type="button" className="os-button mono" onClick={reset}>
            {labelReset}
          </button>
        </div>
      </header>

      <div className="os-ach-bar-wrap" aria-label={labelProgress}>
        <div className="os-ach-bar" style={{ width: `${pct}%` }} />
      </div>

      <p className="mono os-ach-projects">
        {labelProjectsVisited}: {visitedProjects.length} / {CORE_PROJECT_IDS.length} (
        {CORE_PROJECT_IDS.map((id) => (visitedProjects.includes(id) ? `✓ ${id}` : id)).join(" · ")})
      </p>

      <ul className="os-ach-list">
        {ACHIEVEMENT_IDS.map((id) => {
          const isUnlocked = Boolean(unlocked[id])
          const meta = getAchievementMeta(data, id)
          const dateStr = unlocked[id]?.slice(0, 10)
          return (
            <li key={id} className={`os-ach-card${isUnlocked ? " is-unlocked" : ""}`}>
              <div className="os-ach-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M12 2.8l2.6 5.6 6.1.75-4.5 4.2 1.15 6.05L12 16.4l-5.35 3 1.15-6.05-4.5-4.2 6.1-.75L12 2.8z"
                    fill="currentColor"
                    fillOpacity={isUnlocked ? "0.32" : "0.08"}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="os-ach-body">
                <div className="os-ach-row">
                  <strong>{meta.title}</strong>
                  <span className={`os-badge${isUnlocked ? " is-live" : ""}`}>
                    {isUnlocked ? `${labelUnlocked}${dateStr ? ` · ${dateStr}` : ""}` : labelLocked}
                  </span>
                </div>
                <p>{isUnlocked ? meta.desc : meta.hint}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
