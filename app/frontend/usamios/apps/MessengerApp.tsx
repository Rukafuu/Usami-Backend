import { useEffect, useRef, useState } from "react"
import { useAchievements } from "../achievements"
import { askAssistant, type Turn } from "../assistant"
import { REPO_PROJECTS } from "../code/repositories"
import type { AppId } from "../registry"
import { prefersReducedMotion, useShell } from "../shell"
import type { OsData } from "../types"
import { useWindows } from "../windows"

type QuickTopic = "company" | "projects" | "tech" | "experience" | "fuwarch" | "contact"

type MsgAction =
  | { kind: "app"; appId: AppId; label: string }
  | { kind: "code"; repoId: string; label: string }
  | { kind: "files"; folder: string; id: string; label: string }

type ChatMessage = {
  id: string
  sender: "usami" | "visitor" | "system"
  text: string
  bullets?: string[]
  actions?: MsgAction[]
}

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight })

const buildReply = (input: string, topic: QuickTopic | null, data: OsData): Omit<ChatMessage, "id" | "sender"> => {
  const q = input.toLowerCase()
  const founder = data.entries.find((e) => e.id === "founder")
  const contact = data.entries.find((e) => e.id === "contact")
  const allStacks = [...new Set(data.entries.flatMap((e) => e.stack))]

  // Specific project matching first when typed in free text
  if (!topic) {
    for (const repo of REPO_PROJECTS) {
      if (repo.entryId === "scratch") continue
      if (q.includes(repo.entryId) || q.includes(repo.name.toLowerCase())) {
        const entry = data.entries.find((e) => e.id === repo.entryId)
        return {
          text: `${repo.name} (${repo.repoLabel}) — ${entry?.description ?? repo.verificationSummary}`,
          bullets: entry?.proven.slice(0, 4) ?? [repo.verificationSummary],
          actions: [
            { kind: "code", repoId: repo.entryId, label: `Abrir ${repo.name} no Code Studio` },
            ...(entry ? [{ kind: "files" as const, folder: entry.folder, id: entry.id, label: `Ver ${entry.filename} no Explorer` }] : []),
          ],
        }
      }
    }
  }

  const effectiveTopic: QuickTopic =
    topic ??
    (/contato|email|falar|hire|contact|github|linkedin/.test(q)
      ? "contact"
      : /tecnolog|stack|linguag|framework|rust|python|java|react|rails|node/.test(q)
        ? "tech"
        : /experi|lucas|fundador|quem|autor|carreira|pr|contribui/.test(q)
          ? "experience"
          : /fuwarch|sistema|os|linux|desktop|proposito|propósito|por que/.test(q)
            ? "fuwarch"
            : /empresa|servi|usami|negocio|negócio|parceir|invest/.test(q)
              ? "company"
              : "projects")

  switch (effectiveTopic) {
    case "company":
      return {
        text: `${data.site.name} — ${data.site.headline} ${data.site.description}`,
        bullets: data.services.map((s) => `${s.title}: ${s.text}`),
        actions: [
          { kind: "app", appId: "browser", label: "Abrir Navegador Institucional" },
          { kind: "files", folder: "empresa", id: "manifesto", label: "Ler company.md" },
        ],
      }

    case "projects": {
      const mainEntries = data.entries.filter((e) => e.folder === "sistemas" || e.folder === "contribuicoes")
      return {
        text: "Você pode inspecionar nossos projetos reais e PRs aceitos diretamente no Explorer ou no Usami Code Studio:",
        bullets: mainEntries.map((e) => `${e.filename} — ${e.description}`),
        actions: [
          { kind: "code", repoId: "hane", label: "Inspecionar Hane no Code Studio" },
          { kind: "code", repoId: "lira", label: "Inspecionar LiraVtuber" },
          { kind: "code", repoId: "laya", label: "Ver PRs #269 e #706 no Laya" },
          { kind: "app", appId: "files", label: "Abrir Arquivos (Explorer)" },
        ],
      }
    }

    case "tech":
      return {
        text: "Todas as stacks abaixo são verificadas nos repositórios públicos e neste próprio ambiente Fuwarch Web:",
        bullets: [
          `Stack consolidada: ${allStacks.join(" · ")}`,
          `Fuwarch Web: Ruby on Rails + React 19 + TypeScript + Zustand + Vite`,
          `IA & Agentes: Whisper STT, TTS com streaming (~1,0s até o 1º áudio), RAG híbrido (SQLite/FTS5/Grafo) e orquestração auditada (Planner/Executor/Reviewer)`,
        ],
        actions: [
          { kind: "app", appId: "code", label: "Explorar código no Code Studio" },
          { kind: "app", appId: "about", label: "Ver Sobre o Sistema" },
        ],
      }

    case "experience":
      return {
        text: founder
          ? `${founder.filename} — ${founder.description}`
          : "Lucas Frischeisen (Rukafuu) desenvolve sistemas de IA local, agentes auditáveis, plataformas full-stack e contribuições open-source.",
        bullets: [
          ...(founder?.proven.slice(0, 4) ?? []),
          "Contribuições upstream aceitas no Laya: PR #269 (+614/-0) e PR #706 (+637/-15) em avaliação metamórfica.",
          "Usami Companion: 459 testes automatizados passando (421 Node.js + 38 Python).",
        ],
        actions: [
          { kind: "files", folder: "empresa", id: "founder", label: "Abrir founder.md" },
          { kind: "code", repoId: "laya", label: "Ver diffs do Laya no Code Studio" },
        ],
      }

    case "fuwarch":
      return {
        text: "O Fuwarch Linux é um ambiente desktop interativo emulado no navegador que combina portfólio de engenharia, demonstração técnica e o universo digital da Usami.",
        bullets: [
          "Cada janela mostra evidências reais dos repositórios (commits, PRs, arquitetura e testes).",
          "Você pode usar o Terminal (fuwarch-sh), escrever código no Scratchpad da IDE, ver marcos no Calendário e desbloquear Conquistas.",
          "Para uma leitura tradicional em página corrida, o Modo Clássico e o Navegador interno estão sempre a um clique.",
        ],
        actions: [
          { kind: "app", appId: "terminal", label: "Abrir Terminal" },
          { kind: "app", appId: "achievements", label: "Ver Conquistas" },
          { kind: "app", appId: "calendar", label: "Abrir Calendário" },
        ],
      }

    case "contact":
      return {
        text: contact?.description ?? "Você pode falar com Lucas Frischeisen pelos canais verificados abaixo:",
        bullets: [
          ...(contact?.proven ?? []),
          ...(contact?.sources.map((s) => `${s.label}: ${s.url ?? ""}`) ?? ["GitHub: https://github.com/Rukafuu"]),
        ],
        actions: [
          { kind: "files", folder: "empresa", id: "contact", label: "Abrir contact.vcf no Explorer" },
        ],
      }
  }
}

/**
 * Usami Messenger — MSN-inspired companion chat and interactive guide for Fuwarch Linux.
 * Strictly grounded in verified OsData and repository metadata (no hallucinated capabilities).
 */
export function MessengerApp({ data }: { data: OsData }) {
  const t = data.ui.apps
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "usami",
      text:
        t.messenger_welcome ||
        "Olá! Eu sou a Usami, guia do Fuwarch Linux ☕ Posso te apresentar a empresa, os projetos reais (Hane, LiraVtuber, Usami, Énois e Laya), a stack técnica ou abrir qualquer ferramenta para você.",
      actions: [
        { kind: "app", appId: "code", label: "Abrir Usami Code Studio" },
        { kind: "app", appId: "files", label: "Explorar Arquivos" },
      ],
    },
  ])
  const [input, setInput] = useState("")
  const [nudging, setNudging] = useState(false)
  const [thinking, setThinking] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages])

  const triggerAction = (action: MsgAction) => {
    if (action.kind === "app") {
      useWindows.getState().open(action.appId, viewport())
    } else if (action.kind === "code") {
      useShell.getState().showInCode(action.repoId)
      useWindows.getState().open("code", viewport())
    } else if (action.kind === "files") {
      useShell.getState().showInFiles({ folder: action.folder, id: action.id })
      useWindows.getState().open("files", viewport())
    }
  }

  const askTopic = (topic: QuickTopic, label: string) => {
    useAchievements.getState().unlock("chatted_usami")
    const reply = buildReply(label, topic, data)
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: "visitor", text: label },
      { id: `a-${Date.now() + 1}`, sender: "usami", ...reply },
    ])
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || thinking) return
    setInput("")
    useAchievements.getState().unlock("chatted_usami")
    const stamp = Date.now()
    const answerId = `a-${stamp + 1}`
    setMessages((prev) => [...prev, { id: `u-${stamp}`, sender: "visitor", text: trimmed }])

    // Live answer from Usami (server-side, grounded in the site's content). If it is unavailable,
    // the verified canned reply below is used instead, so the chat always answers.
    const history: Turn[] = [
      ...messages.filter((m) => m.id !== "welcome" && m.sender !== "system").map((m): Turn => ({ role: m.sender === "visitor" ? "user" : "assistant", content: m.text })),
      { role: "user", content: trimmed },
    ]
    setThinking(true)
    let received = ""
    const failure = await askAssistant(data.locale, history, (piece) => {
      received += piece
      setMessages((prev) => (prev.some((m) => m.id === answerId) ? prev.map((m) => (m.id === answerId ? { ...m, text: received } : m)) : [...prev, { id: answerId, sender: "usami", text: received }]))
    })
    setThinking(false)
    if (!failure) return
    const reply = buildReply(trimmed, null, data)
    setMessages((prev) => (received ? prev : [...prev.filter((m) => m.id !== answerId), { id: answerId, sender: "usami", ...reply }]))
  }

  const sendNudge = () => {
    useAchievements.getState().unlock("easter_egg")
    useAchievements.getState().unlock("chatted_usami")
    if (!prefersReducedMotion()) {
      setNudging(true)
      window.setTimeout(() => setNudging(false), 480)
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: "system",
        text: t.messenger_nudge_sent || "〰 Você enviou um chamado de atenção (Nudge) para a Usami!",
      },
      {
        id: `a-${Date.now() + 1}`,
        sender: "usami",
        text:
          t.messenger_nudge_reply ||
          "Ei! Minha xícara de café quase virou aqui no desktop! ☕✨ (Conquista secreta desbloqueada!)",
      },
    ])
  }

  const topics: { id: QuickTopic; label: string }[] = [
    { id: "company", label: t.messenger_topic_company || "A empresa" },
    { id: "projects", label: t.messenger_topic_projects || "Projetos" },
    { id: "tech", label: t.messenger_topic_tech || "Tecnologias" },
    { id: "experience", label: t.messenger_topic_experience || "Experiência técnica" },
    { id: "fuwarch", label: t.messenger_topic_fuwarch || "Propósito do Fuwarch" },
    { id: "contact", label: t.messenger_topic_contact || "Contato" },
  ]

  return (
    <div className={`os-messenger${nudging ? " is-nudging" : ""}`}>
      <header className="os-msn-head">
        <div className="os-msn-profile">
          <div className="os-msn-avatar">
            <img src="/brand/logo-64.png" alt="Usami" width="38" height="38" />
            <span className="os-msn-dot" aria-hidden="true" />
          </div>
          <div className="os-msn-meta">
            <div className="os-msn-title">
              <strong>Usami</strong>
              <span className="os-badge is-live">{t.messenger_status || "Online · Guia do Sistema"}</span>
            </div>
            <p className="mono os-msn-sub">
              {t.messenger_substatus || "explorando repositórios e preparando café ☕ · guia local verificada"}
            </p>
          </div>
        </div>
        <button type="button" className="os-button mono os-msn-nudge" onClick={sendNudge}>
          〰 {t.messenger_nudge || "Chamar atenção"}
        </button>
      </header>

      <div className="os-msn-topics" role="group" aria-label={t.messenger_topics_label || "Perguntas rápidas"}>
        {topics.map((tp) => (
          <button key={tp.id} type="button" className="os-msn-chip" onClick={() => askTopic(tp.id, tp.label)}>
            {tp.label}
          </button>
        ))}
      </div>

      <div ref={logRef} className="os-msn-log" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`os-msn-msg is-${m.sender}`}>
            {m.sender !== "system" && (
              <span className="os-msn-sender mono">
                {m.sender === "usami" ? "Usami diz:" : `${t.messenger_you || "Você"} diz:`}
              </span>
            )}
            <p>{m.text}</p>
            {m.bullets && m.bullets.length > 0 && (
              <ul className="os-facts">
                {m.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {m.actions && m.actions.length > 0 && (
              <div className="os-msn-actions">
                {m.actions.map((act, i) => (
                  <button key={i} type="button" className="os-button mono" onClick={() => triggerAction(act)}>
                    {act.label} →
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        className="os-msn-input"
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage()
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.messenger_placeholder || "Pergunte sobre projetos, Hane, Lira, Laya, tecnologias ou contato..."}
          aria-label={t.messenger_input_label || "Mensagem para a Usami"}
        />
        <button type="submit" className="os-button mono">
          {t.messenger_send || "Enviar"}
        </button>
      </form>
    </div>
  )
}
