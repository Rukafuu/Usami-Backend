import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { data, page } from "../test/fixtures"
import { App } from "./App"
import { createGroup } from "./layout"
import { APP_IDS } from "./registry"
import { useShell } from "./shell"
import { useWindows } from "./windows"

const renderOS = (overrides: Partial<typeof page> = {}) => render(<App data={data} page={{ ...page, ...overrides }} />)

const setPhone = (phone: boolean) => {
  window.matchMedia = (query: string) =>
    ({ matches: phone && query.includes("max-width"), media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList
}

beforeEach(() => {
  setPhone(false)
  useWindows.setState({ windows: {}, order: [], topZ: 10 })
  useShell.getState().resetPrefs()
  useShell.setState({ mode: "os", filesTarget: null, celebrating: false })
  for (const attr of Object.keys(document.documentElement.dataset)) delete document.documentElement.dataset[attr]
  window.sessionStorage.setItem("usamios:booted", "1")
  window.history.replaceState({}, "", "/pt")
  document.body.innerHTML = ""
})

describe("desktop", () => {
  it("starts on a clean desktop with shortcuts and a taskbar", () => {
    renderOS()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    const icons = screen.getByRole("list", { name: "Atalhos da área de trabalho" })
    // Every app starts on the desktop.
    expect(within(icons).getAllByRole("button")).toHaveLength(APP_IDS.length)
    expect(within(icons).getAllByRole("button").map((b) => b.textContent)).toEqual(expect.arrayContaining(["Navegador", "Arquivos", "Galeria", "Terminal"]))
    expect(screen.getByRole("button", { name: /Iniciar/ })).toBeInTheDocument()
    expect(window.location.pathname).toBe("/pt")
  })

  it("opens an app from a desktop shortcut with a double-click or Enter", async () => {
    renderOS()
    await userEvent.dblClick(screen.getByRole("button", { name: "Arquivos" }))
    expect(screen.getByRole("dialog", { name: "Arquivos" })).toHaveFocus()

    screen.getByRole("button", { name: "Galeria" }).focus()
    await userEvent.keyboard("{Enter}")
    expect(screen.getByRole("dialog", { name: "Galeria" })).toBeInTheDocument()
    expect(screen.getByText("Hane · onboarding.")).toBeInTheDocument()
    // Videos without a file are honest placeholders, not broken players.
    const soon = screen.getByRole("img", { name: "Hane · vídeo de demonstração (em breve)." })
    expect(within(soon).getByText("em breve")).toBeInTheDocument()
    expect(document.querySelector("video")).toBeNull()
  })

  it("minimizes to the taskbar and restores from it", async () => {
    renderOS()
    await userEvent.dblClick(screen.getByRole("button", { name: "Navegador" }))
    await userEvent.click(screen.getByRole("button", { name: "Minimizar" }))
    expect(screen.queryByRole("dialog", { name: "Navegador" })).not.toBeInTheDocument()

    const tasks = screen.getByRole("list", { name: "Aplicativos abertos" })
    await userEvent.click(within(tasks).getByRole("button", { name: "Navegador" }))
    expect(screen.getByRole("dialog", { name: "Navegador" })).toBeInTheDocument()
  })

  it("maximizes and restores a window", async () => {
    renderOS()
    await userEvent.dblClick(screen.getByRole("button", { name: "Navegador" }))
    await userEvent.click(screen.getByRole("button", { name: "Maximizar" }))
    expect(screen.getByRole("dialog", { name: "Navegador" })).toHaveClass("is-max")
    await userEvent.click(screen.getByRole("button", { name: "Restaurar" }))
    expect(screen.getByRole("dialog", { name: "Navegador" })).not.toHaveClass("is-max")
  })

  it("closes the focused window with Escape", async () => {
    renderOS()
    await userEvent.dblClick(screen.getByRole("button", { name: "Arquivos" }))
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("Start menu launches settings and the about window, and closes with Escape", async () => {
    renderOS()
    await userEvent.click(screen.getByRole("button", { name: /Iniciar/ }))
    const menu = screen.getByRole("dialog", { name: "Menu Iniciar" })
    await userEvent.click(within(menu).getByRole("button", { name: "Sobre o sistema" }))
    const about = screen.getByRole("dialog", { name: "Sobre o sistema" })
    expect(within(about).getByText("1.939.110")).toBeInTheDocument()
    expect(within(about).getByText("266.973")).toBeInTheDocument()
    expect(within(about).getByText("46.401.509")).toBeInTheDocument()
    expect(within(about).getByText("11")).toBeInTheDocument()
    expect(within(about).getByText("rails")).toBeInTheDocument()
    expect(within(about).getByText(/ainda não é uma distribuição Linux/)).toBeInTheDocument()
    expect(within(about).getByText("Mascote e companion")).toBeInTheDocument()
    expect(within(about).getByText(/Usami é a personagem central/)).toBeInTheDocument()
    expect(within(about).getByText("Ambiente de execução")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /Iniciar/ }))
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("dialog", { name: "Menu Iniciar" })).not.toBeInTheDocument()
  })

  it("settings change the theme and wallpaper", async () => {
    renderOS()
    act(() => useWindows.getState().open("settings", { width: 1280, height: 800 }))
    await userEvent.click(screen.getByRole("radio", { name: "Creme (claro)" }))
    expect(document.documentElement.dataset.theme).toBe("light")
    expect(document.documentElement.dataset.wallpaper).toBe("fuwarch") // the illustration stays whatever the theme
    await userEvent.click(screen.getByRole("button", { name: "Papéis de parede" }))
    const wallpapers = screen.getByRole("group", { name: "Papel de parede" })
    await userEvent.click(within(wallpapers).getByRole("radio", { name: "Automático (segue o tema)" }))
    expect(document.documentElement.dataset.wallpaper).toBe("cream") // automatic: light theme gets the cream wallpaper
    await userEvent.click(within(wallpapers).getByRole("radio", { name: "Caramelo" }))
    expect(document.documentElement.dataset.wallpaper).toBe("caramel")
    expect(window.localStorage.getItem("usamios:wallpaper")).toBe("caramel")
    await userEvent.click(screen.getByRole("button", { name: "Aparência" }))
    await userEvent.click(screen.getByRole("radio", { name: "Seguir o sistema" }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it("colour-vision modes replace the accent and lock the accent picker", async () => {
    renderOS()
    act(() => useWindows.getState().open("settings", { width: 1280, height: 800 }))
    const accents = screen.getByRole("group", { name: "Cor de destaque" })
    await userEvent.click(within(accents).getByRole("radio", { name: "Rosa Fuwarch" }))
    expect(document.documentElement.dataset.accent).toBe("rose")

    await userEvent.click(screen.getByRole("radio", { name: "Daltonismo: vermelho-verde" }))
    expect(document.documentElement.dataset.vision).toBe("redgreen")
    expect(accents).toBeDisabled()
    expect(screen.getByText("Neste modo de visão a cor é definida pelo modo.")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("radio", { name: "Padrão" }))
    expect(document.documentElement.dataset.vision).toBeUndefined()
    expect(accents).toBeEnabled()
  })

  it("the system wallpaper is the Fuwarch hug; the Start menu opens a wallpapers tab with the illustrations", async () => {
    renderOS()
    const wall = () => document.querySelector<HTMLImageElement>("img.os-wall")
    // landscape for desktops; a portrait source takes over on tall screens (phones)
    expect(wall()?.getAttribute("src")).toBe("/wallpapers/fuwarch-hug-landscape.jpg")
    expect(document.querySelector("picture source")?.getAttribute("srcset")).toBe("/wallpapers/fuwarch-hug.jpg")
    expect(document.querySelector("picture source")?.getAttribute("media")).toBe("(orientation: portrait)")
    expect(document.querySelector(".os-desk")).toHaveClass("has-image")

    await userEvent.click(screen.getByRole("button", { name: /Iniciar/ }))
    const menu = screen.getByRole("dialog", { name: "Menu Iniciar" })
    await userEvent.click(within(menu).getByRole("button", { name: "Papéis de parede" }))
    expect(screen.getByRole("dialog", { name: "Configurações" })).toBeInTheDocument()

    const group = screen.getByRole("group", { name: "Papel de parede" })
    expect(within(group).getByRole("radio", { name: "Fuwarch abraçado" })).toBeChecked()
    await userEvent.click(within(group).getByRole("radio", { name: "Partida de xadrez" }))
    expect(document.documentElement.dataset.wallpaper).toBe("chess")
    expect(wall()?.getAttribute("src")).toBe("/wallpapers/chess-night.jpg")
    expect(window.localStorage.getItem("usamios:wallpaper")).toBe("chess")

    // Plain colour wallpapers drop the illustration again.
    await userEvent.click(within(group).getByRole("radio", { name: "Café noturno" }))
    expect(wall()).toBeNull()
    expect(document.querySelector(".os-desk")).not.toHaveClass("has-image")
  })

  it("language lives in Settings: the tray button opens it, and choosing a language loads that page", async () => {
    const assign = vi.fn()
    vi.stubGlobal("location", { ...window.location, assign })
    try {
      renderOS()
      expect(screen.queryByRole("link", { name: "EN" })).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole("button", { name: /Idioma: Português/ }))
      expect(screen.getByRole("dialog", { name: "Configurações" })).toBeInTheDocument()
      expect(screen.getByRole("radio", { name: "Português" })).toBeChecked()
      await userEvent.click(screen.getByRole("radio", { name: "English" }))
      expect(assign).toHaveBeenCalledWith("http://x.test/en")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("display settings change text size, icon size, motion and glass, and can be reset", async () => {
    renderOS()
    act(() => useWindows.getState().open("settings", { width: 1280, height: 800 }))
    await userEvent.click(screen.getByRole("button", { name: "Tela e movimento" }))
    await userEvent.click(screen.getByRole("radio", { name: "Muito grande" }))
    expect(document.documentElement.dataset.text).toBe("xl")
    const icons = screen.getByRole("group", { name: "Tamanho dos ícones da área de trabalho" })
    await userEvent.click(within(icons).getByRole("radio", { name: "Grande" }))
    expect(document.documentElement.dataset.icons).toBe("large")
    await userEvent.click(screen.getByRole("radio", { name: "Sempre reduzir" }))
    expect(document.documentElement.dataset.motion).toBe("reduce")
    await userEvent.click(screen.getByRole("checkbox", { name: "Efeitos de vidro" }))
    expect(document.documentElement.dataset.glass).toBe("off")

    await userEvent.click(screen.getByRole("button", { name: "Sistema" }))
    await userEvent.click(screen.getByRole("button", { name: "Restaurar padrões" }))
    expect(document.documentElement.dataset.text).toBeUndefined()
    expect(document.documentElement.dataset.glass).toBeUndefined()
  })

  it("the browser shows company, projects, services and the founder, and opens projects in Explorer", async () => {
    renderOS()
    await userEvent.dblClick(screen.getByRole("button", { name: "Navegador" }))
    expect(screen.getByRole("heading", { name: "IA que conversa, lembra e age." })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Projetos" }))
    expect(screen.getByText("hane.core")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Serviços" }))
    expect(screen.getByText("Aplicações")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Sobre mim" }))
    expect(screen.getByText(/Lucas Frischeisen/)).toBeInTheDocument()
  })

  it("a file's own URL opens it in the file explorer", () => {
    renderOS({ folder: "sistemas", slug: "usami" })
    expect(screen.getByRole("heading", { name: "usami.companion" })).toBeInTheDocument()
    expect(screen.getByText("Listas em inglês.")).toBeInTheDocument()
  })

  it("choosing a file updates the URL so it can be shared", async () => {
    renderOS({ folder: "sistemas", slug: "hane" })
    await userEvent.click(screen.getByRole("button", { name: /usami.companion/ }))
    expect(window.location.pathname).toBe("/pt/sistemas/usami")
  })

  it("plays boot, guest login and initialisation on the first visit, each skippable", async () => {
    window.sessionStorage.clear()
    renderOS()
    expect(screen.getByRole("status")).toBeInTheDocument()
    await userEvent.keyboard("{Enter}")
    const signIn = await screen.findByRole("button", { name: "Entrar" })
    expect(screen.getByText("Visitante")).toBeInTheDocument()
    await userEvent.click(signIn)
    expect(screen.getByText("Preparando sua área de trabalho…")).toBeInTheDocument()
    await userEvent.keyboard("{Enter}")
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("classic mode hands the page back", async () => {
    const opener = Object.assign(document.createElement("button"), { hidden: true })
    opener.setAttribute("data-shell-open", "")
    const main = document.createElement("main")
    document.body.append(main, opener)
    renderOS()
    expect(main).toHaveAttribute("inert")
    await userEvent.click(screen.getByRole("button", { name: /Iniciar/ }))
    await userEvent.click(screen.getByRole("button", { name: "Modo clássico" }))
    expect(main).not.toHaveAttribute("inert")
    expect(opener.hidden).toBe(false)
  })

  it("Task Manager shows real open windows, lets the visitor focus or close them, and labels virtual daemons honestly", async () => {
    renderOS()
    await userEvent.dblClick(screen.getByRole("button", { name: "Navegador" }))
    await userEvent.click(screen.getByRole("button", { name: "Gerenciador de tarefas (1)" }))

    const tm = screen.getByRole("dialog", { name: "Gerenciador de tarefas" })
    // The total is whatever the registry holds today: new apps must not break this test.
    expect(within(tm).getByText(`2 / ${APP_IDS.length}`)).toBeInTheDocument()
    expect(within(tm).getByText(/Processos conceituais do ambiente emulado/)).toBeInTheDocument()
    expect(within(tm).getByText(/fuwarch-wm/)).toBeInTheDocument()

    // Close the Browser window right from the Task Manager table.
    const rows = within(tm).getAllByRole("row")
    const browserRow = rows.find((r) => r.textContent?.includes("Navegador"))!
    await userEvent.click(within(browserRow).getByRole("button", { name: "Encerrar" }))
    expect(screen.queryByRole("dialog", { name: "Navegador" })).not.toBeInTheDocument()
    expect(within(tm).getByText(`1 / ${APP_IDS.length}`)).toBeInTheDocument()
  })

  it("shows the founder's portrait and his own about-me text in the file explorer", () => {
    renderOS({ folder: "empresa", slug: "lucas" })
    const files = screen.getByRole("dialog", { name: "Arquivos" })
    expect(within(files).getByRole("img", { name: "Lucas, de cabelo rosa" })).toHaveAttribute("src", "/media/lucas-400.jpg")
    expect(within(files).getByRole("heading", { name: "Sobre mim" })).toBeInTheDocument()
    expect(within(files).getByText("Na USAMI, quero transformar ideias em produtos.")).toBeInTheDocument()
  })

  it("opens Usami Code Studio from the file explorer, explores real commits/PRs, and edits in the blank Scratchpad", async () => {
    renderOS({ folder: "sistemas", slug: "hane" })
    await userEvent.click(screen.getByRole("button", { name: "Abrir no Code Studio" }))

    const codeWin = screen.getByRole("dialog", { name: "Usami Code Studio" })
    expect(within(codeWin).getByText("Open Source Explorer")).toBeInTheDocument()
    expect(within(codeWin).getByText(/TOOL_ROLES/)).toBeInTheDocument()

    const tree = within(codeWin).getByRole("complementary", { name: "Arquivos do repositório" })
    await userEvent.click(within(tree).getByRole("button", { name: /src\/capabilities\.js/ }))
    expect(within(codeWin).getByText(/KNOWN_CAPABILITIES/)).toBeInTheDocument()

    // Real Hane commit history has its own tab, at full width (the file list is hidden there)
    await userEvent.click(within(codeWin).getByRole("button", { name: /Commits e PRs/ }))
    expect(within(codeWin).getByText("7c7db80")).toBeInTheDocument()
    expect(within(codeWin).queryByRole("complementary", { name: "Arquivos do repositório" })).not.toBeInTheDocument()
    await userEvent.click(within(codeWin).getByRole("button", { name: /^Código$/ }))

    // Switch to Laya to inspect merged PRs #269 and #706
    await userEvent.selectOptions(within(codeWin).getByRole("combobox", { name: "Repositório" }), "laya")
    expect(within(codeWin).getByText(/Jensen-Shannon/)).toBeInTheDocument()
    await userEvent.click(within(codeWin).getByRole("button", { name: /Commits e PRs/ }))
    expect(within(codeWin).getAllByText(/PR #706/).length).toBeGreaterThan(0)
    expect(within(codeWin).getAllByText(/PR #269/).length).toBeGreaterThan(0)

    // Open the blank Scratchpad project and write custom code
    await userEvent.click(within(codeWin).getByRole("button", { name: /\+ Projeto em branco/ }))
    expect(within(codeWin).getByText("Scratchpad")).toBeInTheDocument()
    const editor = within(codeWin).getByRole("textbox", { name: "Editor main.js" })
    await userEvent.clear(editor)
    await userEvent.type(editor, "const fuwarch = 42;")
    expect(editor).toHaveValue("const fuwarch = 42;")
  })

  it("clicking the taskbar clock opens the Calendar with verified milestones and date easter eggs", async () => {
    renderOS()
    await userEvent.click(screen.getByRole("button", { name: /Calendário \(/ }))

    const cal = screen.getByRole("dialog", { name: "Calendário" })
    expect(within(cal).getByText("Marcos verificados")).toBeInTheDocument()
    expect(within(cal).getAllByText(/Hane · Apache-2\.0/).length).toBeGreaterThan(0)
    // 2026-11-03 is both the build date and the Fuwarch anniversary easter egg.
    expect(within(cal).getByText("Aniversário do Fuwarch Linux.")).toBeInTheDocument()

    await userEvent.click(within(cal).getByRole("button", { name: "2026-11-02" }))
    expect(within(cal).getByText("github.com/Rukafuu/Hane ↗")).toBeInTheDocument()
  })

  it("shows the founder's birthday (07/03/1998) every year, with his age and a candle to blow out", async () => {
    renderOS()
    await userEvent.click(screen.getByRole("button", { name: /Calendário \(/ }))
    const cal = screen.getByRole("dialog", { name: "Calendário" })

    // Walk back from Nov 2026 to Mar 2026.
    for (let i = 0; i < 8; i++) await userEvent.click(within(cal).getByRole("button", { name: "Mês anterior" }))
    await userEvent.click(within(cal).getByRole("button", { name: "2026-03-07" }))
    expect(within(cal).getByText(/Aniversário do Lucas — 28 anos\./)).toBeInTheDocument()

    await userEvent.click(within(cal).getByRole("button", { name: /Soprar a vela/ }))
    expect(within(cal).getByRole("status")).toHaveTextContent("Parabéns, Lucas")
    expect(within(cal).queryByRole("button", { name: /Soprar a vela/ })).not.toBeInTheDocument()
  })

  it("Usami Messenger answers questions with verified facts, opens apps as a guide, and unlocks Achievements", async () => {
    renderOS()
    act(() => useWindows.getState().open("messenger", { width: 1280, height: 800 }))

    const msn = screen.getByRole("dialog", { name: "Usami Messenger" })
    expect(within(msn).getByText(/Online · Guia do Sistema/)).toBeInTheDocument()

    // Click a quick topic
    await userEvent.click(within(msn).getByRole("button", { name: "Experiência técnica" }))
    expect(within(msn).getByText(/459 testes automatizados/)).toBeInTheDocument()

    // Ask about Hane in free text and use Usami's action button to open Code Studio
    const input = within(msn).getByRole("textbox", { name: "Mensagem para a Usami" })
    await userEvent.type(input, "me fala sobre o hane{Enter}")
    await userEvent.click(within(msn).getByRole("button", { name: /Abrir Hane no Code Studio/ }))
    expect(screen.getByRole("dialog", { name: "Usami Code Studio" })).toBeInTheDocument()

    // Send an MSN Nudge and verify Achievements unlocked
    await userEvent.click(within(msn).getByRole("button", { name: /Chamar atenção/ }))
    act(() => useWindows.getState().open("achievements", { width: 1280, height: 800 }))
    const ach = screen.getByRole("dialog", { name: "Conquistas" })
    expect(within(ach).getByText("Guia do Sistema")).toBeInTheDocument()
    expect(within(ach).getByText("Caçador de Segredos")).toBeInTheDocument()
    expect(within(ach).getAllByText(/Desbloqueada/).length).toBeGreaterThanOrEqual(4)
  })

  it("Usami Music keeps the SoundCloud player off until the visitor allows all cookies", async () => {
    document.cookie = "usami_consent=; Max-Age=0; Path=/"
    renderOS()
    act(() => useWindows.getState().open("music", { width: 1280, height: 800 }))
    const musicWin = screen.getByRole("dialog", { name: "Usami Music" })

    expect(within(musicWin).queryByTitle(/^SoundCloud — /)).not.toBeInTheDocument()
    // The cover art lives on SoundCloud's CDN too, so nothing from SoundCloud is requested yet.
    expect(musicWin.querySelector('img[src*="sndcdn"]')).toBeNull()
    expect(within(musicWin).getByText(/cookies de terceiros/)).toBeInTheDocument()
    expect(within(musicWin).getByRole("button", { name: /Reproduzir/ })).toBeDisabled()

    await userEvent.click(within(musicWin).getByRole("button", { name: "Permitir todos e carregar" }))
    expect(document.cookie).toContain("usami_consent=all")
    expect(within(musicWin).getByTitle(/^SoundCloud — /)).toBeInTheDocument()
    expect(musicWin.querySelector('img[src*="sndcdn"]')).not.toBeNull()
    document.cookie = "usami_consent=; Max-Age=0; Path=/"
  })

  it("Usami Music plays Lucas's SoundCloud tracks from Reskyume (@rukafuu) and Amarynth Lira (@amarynth-lira)", async () => {
    document.cookie = "usami_consent=all; Path=/"
    renderOS()
    act(() => useWindows.getState().open("music", { width: 1280, height: 800 }))

    const musicWin = screen.getByRole("dialog", { name: "Usami Music" })
    expect(within(musicWin).getByRole("heading", { name: "Aus der Ferne, em rosa" })).toBeInTheDocument()
    expect(within(musicWin).getByText("Todas (20)")).toBeInTheDocument()

    // Filter by Reskyume tracks (from sets/my-tracks) and select one
    await userEvent.click(within(musicWin).getByRole("tab", { name: "Reskyume (10)" }))
    await userEvent.click(within(musicWin).getByRole("button", { name: /Horizonte de eventos/ }))
    expect(within(musicWin).getByRole("heading", { name: "Horizonte de eventos" })).toBeInTheDocument()

    // Filter by Amarynth Lira tracks and select one
    await userEvent.click(within(musicWin).getByRole("tab", { name: "Amarynth Lira (10)" }))
    await userEvent.click(within(musicWin).getByRole("button", { name: /Dona do Servidor/ }))
    expect(within(musicWin).getByRole("heading", { name: "Dona do Servidor" })).toBeInTheDocument()
    expect(within(musicWin).getByTitle("SoundCloud — Dona do Servidor")).toHaveAttribute(
      "src",
      expect.stringContaining("amarynth-lira%2Fdona-do-servidor-5"),
    )
    document.cookie = "usami_consent=; Max-Age=0; Path=/"
  })
})

describe("easter eggs", () => {
  const konami = async () => userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowDown}{ArrowDown}{ArrowLeft}{ArrowRight}{ArrowLeft}{ArrowRight}ba")

  it("the Konami code triggers a celebration that Escape dismisses", async () => {
    renderOS()
    await konami()
    expect(screen.getByText("Código Konami detectado!")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByText("Código Konami detectado!")).not.toBeInTheDocument()
  })

  it("a wrong sequence does nothing, and the code works again afterwards", async () => {
    renderOS()
    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowDown}x{ArrowDown}{ArrowLeft}")
    expect(screen.queryByText("Código Konami detectado!")).not.toBeInTheDocument()
    await konami()
    expect(screen.getByText("Código Konami detectado!")).toBeInTheDocument()
  })

  it("the Start menu offers a pet for those who do not know the code", async () => {
    renderOS()
    await userEvent.click(screen.getByRole("button", { name: /Iniciar/ }))
    await userEvent.click(screen.getByRole("button", { name: "Fazer um carinho no Fuwarch" }))
    expect(screen.getByText("+30 vidas e um cafuné virtual do Fuwarch.")).toBeInTheDocument()
  })

  it("sudo rm -rf / in the terminal gets a joke and nothing else happens", async () => {
    renderOS()
    await userEvent.dblClick(screen.getByRole("button", { name: "Terminal" }))
    const input = screen.getByRole("textbox", { name: "Terminal" })
    await userEvent.type(input, "sudo rm -rf /{Enter}")
    expect(screen.getByText(/rm: removendo/)).toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Terminal" })).toBeInTheDocument()
    expect(document.body.textContent).toContain("Nada foi apagado")
  })

  it("neofetch prints the full mascot drawing from Lucas, hidden from screen readers", async () => {
    renderOS()
    await userEvent.dblClick(screen.getByRole("button", { name: "Terminal" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Terminal" }), "neofetch{Enter}")
    const art = await waitFor(() => {
      const el = document.querySelector("pre.is-art")
      expect(el).not.toBeNull()
      return el as HTMLElement
    })
    expect(art.textContent!.split("\n")).toHaveLength(68)
    expect(art).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByText(/Fuwarch Linux \(emulado\)/)).toBeInTheDocument()
  })

  it("the terminal navigates, reads files and opens them in the explorer", async () => {
    renderOS()
    await userEvent.dblClick(screen.getByRole("button", { name: "Terminal" }))
    const input = screen.getByRole("textbox", { name: "Terminal" })
    await userEvent.type(input, "cd sistemas{Enter}cat hane.core{Enter}")
    expect(screen.getByText("+ Orçamento de chamadas")).toBeInTheDocument()
    await userEvent.type(input, "open usami.companion{Enter}")
    expect(screen.getByRole("dialog", { name: "Arquivos" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "usami.companion" })).toBeInTheDocument()
  })
})

describe("phone", () => {
  it("shows a home grid and dock, opens apps full screen and goes back home", async () => {
    setPhone(true)
    renderOS()
    const grid = screen.getByRole("list", { name: "Atalhos da área de trabalho" })
    // One launcher per registered app, however many there are today.
    expect(within(grid).getAllByRole("button")).toHaveLength(APP_IDS.length)
    for (const id of APP_IDS) expect(within(grid).getByRole("button", { name: data.ui.apps[id] })).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "Aplicativos abertos" })).toBeInTheDocument()

    await userEvent.click(within(grid).getByRole("button", { name: "Arquivos" }))
    expect(screen.getByRole("dialog", { name: "Arquivos" })).toBeInTheDocument()
    expect(screen.queryByRole("list", { name: "Atalhos da área de trabalho" })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Voltar" }))
    expect(screen.getByRole("list", { name: "Atalhos da área de trabalho" })).toBeInTheDocument()
  })
})

describe("pinning apps (desktop and phone)", () => {
  it("right-click on a desktop icon offers to remove it, and the choice sticks", async () => {
    renderOS()
    const icons = () => within(screen.getByRole("list", { name: "Atalhos da área de trabalho" }))
    expect(icons().getByRole("button", { name: "Galeria" })).toBeInTheDocument()

    await userEvent.pointer({ keys: "[MouseRight]", target: icons().getByRole("button", { name: "Galeria" }) })
    const menu = screen.getByRole("menu", { name: "Galeria" })
    expect(within(menu).getByRole("menuitem", { name: "Abrir" })).toBeInTheDocument()
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Remover da área de trabalho" }))

    expect(icons().queryByRole("button", { name: "Galeria" })).not.toBeInTheDocument()
    expect(window.localStorage.getItem("usamios:placement")).toBe(JSON.stringify({ gallery: { desktop: false } }))
  })

  it("the Start menu still lists an app that was taken off the desktop, and can put it back", async () => {
    useShell.getState().setPlaced("gallery", "desktop", false)
    renderOS()
    await userEvent.click(screen.getByRole("button", { name: /Iniciar/ }))
    const start = screen.getByRole("dialog", { name: "Menu Iniciar" })
    const row = within(start).getByRole("button", { name: "Galeria" })
    await userEvent.pointer({ keys: "[MouseRight]", target: row })
    await userEvent.click(screen.getByRole("menuitem", { name: "Adicionar à área de trabalho" }))
    expect(within(screen.getByRole("list", { name: "Atalhos da área de trabalho" })).getByRole("button", { name: "Galeria" })).toBeInTheDocument()
  })

  it("pinning to the taskbar keeps the app there, open or not, without duplicating it", async () => {
    useShell.getState().setPlaced("calendar", "taskbar", true)
    renderOS()
    const tasks = () => within(screen.getByRole("list", { name: "Aplicativos abertos" }))
    expect(tasks().getAllByRole("button")).toHaveLength(1)
    await userEvent.click(tasks().getByRole("button", { name: "Calendário" })) // opens it from the pin
    expect(screen.getByRole("dialog", { name: "Calendário" })).toBeInTheDocument()
    expect(tasks().getAllByRole("button", { name: "Calendário" })).toHaveLength(1)

    await userEvent.pointer({ keys: "[MouseRight]", target: tasks().getByRole("button", { name: "Calendário" }) })
    await userEvent.click(screen.getByRole("menuitem", { name: "Desafixar da barra de tarefas" }))
    // still open, so it stays as a running app; unpinned means it leaves when closed
    expect(tasks().getAllByRole("button", { name: "Calendário" })).toHaveLength(1)
    expect(useShell.getState().placement).toEqual({})
  })

  it("the Apps tab in Settings pins and unpins in every place, and Settings cannot leave the phone home", async () => {
    renderOS()
    act(() => useWindows.getState().open("settings", { width: 1280, height: 800 }))
    await userEvent.click(screen.getByRole("button", { name: "Aplicativos" }))

    const box = (app: string, place: string) => screen.getByRole("checkbox", { name: `${app} — ${place}` })
    expect(box("Terminal", "Área de trabalho")).toBeChecked()
    await userEvent.click(box("Terminal", "Área de trabalho"))
    expect(box("Terminal", "Área de trabalho")).not.toBeChecked()
    await userEvent.click(box("Terminal", "Barra de tarefas"))
    expect(box("Terminal", "Barra de tarefas")).toBeChecked()
    expect(box("Terminal", "Dock")).toBeChecked()

    expect(box("Configurações", "Tela inicial")).toBeChecked()
    expect(box("Configurações", "Tela inicial")).toBeDisabled()

    await userEvent.click(screen.getByRole("button", { name: "Restaurar a organização padrão" }))
    expect(box("Terminal", "Área de trabalho")).toBeChecked()
    expect(useShell.getState().placement).toEqual({})
  })

  it("on the phone, removing an app from the home screen moves it to the library, and removing it from the dock empties that slot", async () => {
    setPhone(true)
    useShell.getState().setPlaced("gallery", "home", false)
    useShell.getState().setPlaced("terminal", "dock", false)
    renderOS()
    const grid = screen.getByRole("list", { name: "Atalhos da área de trabalho" })
    expect(within(grid).queryByRole("button", { name: "Galeria" })).not.toBeInTheDocument()

    const library = screen.getByRole("region", { name: "Biblioteca de aplicativos" })
    expect(within(library).getByRole("button", { name: "Galeria" })).toBeInTheDocument()

    const dock = screen.getByRole("navigation", { name: "Aplicativos abertos" })
    expect(within(dock).queryByRole("button", { name: "Terminal" })).not.toBeInTheDocument()

    await userEvent.click(within(library).getByRole("button", { name: "Galeria" }))
    expect(screen.getByRole("dialog", { name: "Galeria" })).toBeInTheDocument()
  })

  it("on the phone there is no library while everything is on the home screen, and a long press opens the menu", async () => {
    setPhone(true)
    renderOS()
    expect(screen.queryByRole("region", { name: "Biblioteca de aplicativos" })).not.toBeInTheDocument()
    const grid = within(screen.getByRole("list", { name: "Atalhos da área de trabalho" }))
    await userEvent.pointer({ keys: "[MouseRight]", target: grid.getByRole("button", { name: "Galeria" }) }) // same menu as a long press
    const menu = screen.getByRole("menu", { name: "Galeria" })
    expect(within(menu).getByRole("menuitem", { name: "Remover da tela inicial" })).toBeInTheDocument()
    expect(within(menu).getByRole("menuitem", { name: "Remover do dock" })).toBeInTheDocument()
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Remover da tela inicial" }))
    expect(screen.getByRole("region", { name: "Biblioteca de aplicativos" })).toBeInTheDocument()
  })

  it("the protected app cannot be removed from the phone home screen, even from the menu", async () => {
    setPhone(true)
    renderOS()
    const grid = within(screen.getByRole("list", { name: "Atalhos da área de trabalho" }))
    await userEvent.pointer({ keys: "[MouseRight]", target: grid.getByRole("button", { name: "Configurações" }) })
    expect(screen.getByRole("menuitem", { name: "Remover da tela inicial" })).toBeDisabled()
  })
})

describe("organising apps: uninstall, groups, order", () => {
  const desktopList = () => within(screen.getByRole("list", { name: "Atalhos da área de trabalho" }))
  const labels = () => desktopList().getAllByRole("listitem").map((li) => li.textContent?.trim())
  const rightClick = (el: HTMLElement) => userEvent.pointer({ keys: "[MouseRight]", target: el })

  it("uninstalling asks a gentle question first, and keeping the app is the default", async () => {
    renderOS()
    await rightClick(desktopList().getByRole("button", { name: "Galeria" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Desinstalar" }))

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByRole("heading", { name: "Tem certeza que eu não fui útil pra você?" })).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Fico com você" })).toHaveFocus()

    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(desktopList().getByRole("button", { name: "Galeria" })).toBeInTheDocument()
    expect(useShell.getState().uninstalled).toEqual([])
  })

  it("uninstalling removes the app everywhere and closes its window; Settings can bring it back", async () => {
    renderOS()
    await userEvent.dblClick(desktopList().getByRole("button", { name: "Galeria" }))
    expect(screen.getByRole("dialog", { name: "Galeria" })).toBeInTheDocument()

    await rightClick(desktopList().getByRole("button", { name: "Galeria" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Desinstalar" }))
    await userEvent.click(screen.getByRole("button", { name: "Desinstalar mesmo assim" }))

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(screen.queryByRole("dialog", { name: "Galeria" })).not.toBeInTheDocument()
    expect(desktopList().queryByRole("button", { name: "Galeria" })).not.toBeInTheDocument()
    expect(window.localStorage.getItem("usamios:uninstalled")).toBe(JSON.stringify(["gallery"]))

    await userEvent.click(screen.getByRole("button", { name: /Iniciar/ }))
    const start = screen.getByRole("dialog", { name: "Menu Iniciar" })
    expect(within(start).queryByRole("button", { name: "Galeria" })).not.toBeInTheDocument()
    expect(within(start).getByRole("button", { name: "Terminal" })).toBeInTheDocument()

    // A uninstalled app cannot be opened by any route.
    act(() => useWindows.getState().open("gallery", { width: 1280, height: 800 }))
    expect(screen.queryByRole("dialog", { name: "Galeria" })).not.toBeInTheDocument()

    await userEvent.click(within(start).getByRole("button", { name: "Configurações" }))
    await userEvent.click(screen.getByRole("button", { name: "Aplicativos" }))
    expect(screen.getByText(/Galeria \(desinstalado\)/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Reinstalar" }))
    expect(desktopList().getByRole("button", { name: "Galeria" })).toBeInTheDocument()
    expect(window.localStorage.getItem("usamios:uninstalled")).toBeNull()
  })

  it("essential apps cannot be uninstalled, from the menu or from Settings", async () => {
    renderOS()
    act(() => useWindows.getState().open("settings", { width: 1280, height: 800 }))
    await userEvent.click(screen.getByRole("button", { name: "Aplicativos" }))
    const row = screen.getByRole("row", { name: /Configurações/ })
    expect(within(row).getByText("Essencial")).toBeInTheDocument()
    expect(within(row).queryByRole("button", { name: /Desinstalar/ })).not.toBeInTheDocument()
    act(() => useShell.getState().askUninstall("settings"))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  // A drag the way a mouse (or a finger) does it: press, move, release over something. jsdom has no layout, so we say what is under the pointer.
  const drag = (from: HTMLElement, to: Element, at: { x?: number; y?: number; rect?: Partial<DOMRect> } = {}) => {
    const x = at.x ?? 300
    const y = at.y ?? 200
    if (at.rect) vi.spyOn(to, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}), ...at.rect } as DOMRect)
    document.elementFromPoint = vi.fn(() => to)
    fireEvent(from, new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 10, clientY: 10 }))
    fireEvent(window, new MouseEvent("pointermove", { bubbles: true, clientX: 40, clientY: 40 }))
    fireEvent(window, new MouseEvent("pointermove", { bubbles: true, clientX: x, clientY: y }))
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true, clientX: x, clientY: y }))
  }
  const desktopUl = () => screen.getByRole("list", { name: "Atalhos da área de trabalho" })
  const item = (name: string) => desktopList().getByRole("button", { name }).closest("li")!

  it("dragging an app onto the middle of another makes a group; a group opens a panel and launches its apps", async () => {
    renderOS()
    drag(item("Galeria"), item("Terminal")) // middle of Terminal
    expect(desktopList().queryByRole("button", { name: "Galeria" })).not.toBeInTheDocument()
    expect(desktopList().queryByRole("button", { name: "Terminal" })).not.toBeInTheDocument()

    await userEvent.click(desktopList().getByRole("button", { name: "Abrir o grupo Grupo 1" }))
    const panel = screen.getByRole("dialog", { name: "Grupo 1" })
    expect(within(panel).getAllByRole("button").map((b) => b.textContent)).toEqual(expect.arrayContaining(["Galeria", "Terminal"]))
    await userEvent.click(within(panel).getByRole("button", { name: "Galeria" }))
    expect(screen.getByRole("dialog", { name: "Galeria" })).toBeInTheDocument()
    expect(screen.queryByRole("dialog", { name: "Grupo 1" })).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem("usamios:layouts")!).desktop.groups[0].apps).toEqual(["terminal", "gallery"])
  })

  it("dropping another app on a group adds it; the menu can add and remove too", async () => {
    renderOS()
    drag(item("Galeria"), item("Terminal"))
    drag(item("Arquivos"), desktopList().getByRole("button", { name: "Abrir o grupo Grupo 1" }).closest("li")!)
    expect(useShell.getState().layouts.desktop.groups[0]!.apps).toEqual(["terminal", "gallery", "files"])

    await rightClick(desktopList().getByRole("button", { name: "Navegador" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Adicionar ao grupo Grupo 1" }))
    expect(useShell.getState().layouts.desktop.groups[0]!.apps).toContain("browser")
  })

  it("dragging an app out of a group undoes the group when only two were in it", async () => {
    renderOS()
    drag(item("Galeria"), item("Terminal"))
    await userEvent.click(desktopList().getByRole("button", { name: "Abrir o grupo Grupo 1" }))
    const panel = screen.getByRole("dialog", { name: "Grupo 1" })

    // drop it on the empty desktop, far from any icon
    drag(within(panel).getByRole("button", { name: "Galeria" }), desktopUl(), { x: 480, y: 300 })
    expect(useShell.getState().layouts.desktop.groups).toEqual([])
    expect(desktopList().getByRole("button", { name: "Galeria" })).toBeInTheDocument()
    expect(desktopList().getByRole("button", { name: "Terminal" })).toBeInTheDocument()
    expect(desktopList().queryByRole("button", { name: /Abrir o grupo/ })).not.toBeInTheDocument()
  })

  it("an app can be dropped on any free cell of the desktop", () => {
    renderOS()
    // x=480 -> column 5 and y=300 -> row 2 (0-based; cells are 96 x 104 px), i.e. CSS grid line 6 and 3
    drag(item("Terminal"), desktopUl(), { x: 480, y: 300 })
    const li = item("Terminal")
    expect(li.style.gridColumn).toBe("6")
    expect(li.style.gridRow).toBe("3")
    expect(JSON.parse(window.localStorage.getItem("usamios:layouts")!).desktop.cells["app:terminal"]).toEqual({ col: 5, row: 2 })
  })

  it("dropping on the edge of another icon swaps their places", () => {
    renderOS()
    const placeOf = (name: string) => [item(name).style.gridColumn, item(name).style.gridRow]
    const files = placeOf("Arquivos")
    const terminal = placeOf("Terminal")
    drag(item("Terminal"), item("Arquivos"), { x: 5, rect: { width: 100 } }) // left edge of Arquivos
    expect(placeOf("Terminal")).toEqual(files)
    expect(placeOf("Arquivos")).toEqual(terminal)
  })

  it("a plain click is still a click: a tiny movement does not start a drag", async () => {
    renderOS()
    const el = desktopList().getByRole("button", { name: "Terminal" })
    fireEvent(el, new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 10, clientY: 10 }))
    fireEvent(window, new MouseEvent("pointermove", { bubbles: true, clientX: 12, clientY: 11 }))
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true, clientX: 12, clientY: 11 }))
    expect(document.querySelector(".os-drag-ghost")).toBeNull()
    await userEvent.dblClick(el)
    expect(screen.getByRole("dialog", { name: "Terminal" })).toBeInTheDocument()
    expect(useShell.getState().layouts.desktop.cells).toBeUndefined()
  })

  it("Settings > Layout reorders icons with the arrows and the change shows on the desktop", async () => {
    renderOS()
    const before = labels()
    expect(before.indexOf("Terminal")).toBeGreaterThan(before.indexOf("Galeria"))

    act(() => useWindows.getState().open("settings", { width: 1280, height: 800 }))
    await userEvent.click(screen.getByRole("button", { name: "Organização" }))
    const list = within(screen.getByRole("region", { name: /Área de trabalho/ }))
    await userEvent.click(list.getByRole("button", { name: "Terminal — Mover para antes" }))
    await userEvent.click(list.getByRole("button", { name: "Terminal — Mover para antes" }))
    const after = labels()
    expect(after.indexOf("Terminal")).toBeLessThan(after.indexOf("Galeria"))
    expect(list.getByRole("button", { name: "Navegador — Mover para antes" })).toBeDisabled()
  })

  it("Settings > Layout groups two apps, renames the group and dissolves it", async () => {
    renderOS()
    act(() => useWindows.getState().open("settings", { width: 1280, height: 800 }))
    await userEvent.click(screen.getByRole("button", { name: "Organização" }))
    const section = within(screen.getByRole("region", { name: /Área de trabalho/ }))
    await userEvent.selectOptions(section.getByRole("combobox", { name: "Galeria — Grupo" }), "Agrupar com Terminal")

    const name = section.getByRole("textbox", { name: /Grupo 1 — Nome do grupo/ })
    await userEvent.clear(name)
    await userEvent.type(name, "Ferramentas")
    expect(desktopList().getByRole("button", { name: "Abrir o grupo Ferramentas" })).toBeInTheDocument()

    await userEvent.click(section.getByRole("button", { name: "Desfazer grupo" }))
    expect(desktopList().getByRole("button", { name: "Galeria" })).toBeInTheDocument()
    expect(desktopList().getByRole("button", { name: "Terminal" })).toBeInTheDocument()
    expect(useShell.getState().layouts.desktop.groups).toEqual([])
  })

  it("on the phone the same gestures work: drag onto an app for a group, out of the sheet to undo it", async () => {
    setPhone(true)
    useShell.getState().setPlaced("calendar", "home", false)
    useShell.getState().setUninstalled("taskmgr", true)
    renderOS()
    const library = screen.getByRole("region", { name: "Biblioteca de aplicativos" })
    expect(within(library).getByRole("button", { name: "Calendário" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Gerenciador de tarefas" })).not.toBeInTheDocument()

    const grid = () => within(screen.getByRole("list", { name: "Atalhos da área de trabalho" }))
    const phoneItem = (name: string) => grid().getByRole("button", { name }).closest("li")!
    drag(phoneItem("Galeria"), phoneItem("Terminal"))
    await userEvent.click(grid().getByRole("button", { name: "Abrir o grupo Grupo 1" }))
    const sheet = screen.getByRole("dialog", { name: "Grupo 1" })

    drag(within(sheet).getByRole("button", { name: "Galeria" }), document.querySelector(".os-home")!)
    expect(useShell.getState().layouts.home.groups).toEqual([])
    expect(grid().getByRole("button", { name: "Galeria" })).toBeInTheDocument()
    expect(grid().getByRole("button", { name: "Terminal" })).toBeInTheDocument()
  })
})

describe("naming a group", () => {
  const desktopList = () => within(screen.getByRole("list", { name: "Atalhos da área de trabalho" }))
  const makeGroup = () => useShell.getState().setArrangement("desktop", (a) => createGroup(a, "", ["terminal", "gallery"]).arrangement)
  const openPanel = async () => userEvent.click(desktopList().getByRole("button", { name: /Abrir o grupo/ }))

  it("the pencil in the panel renames the group, and Enter saves it", async () => {
    makeGroup()
    renderOS()
    await openPanel()
    await userEvent.click(screen.getByRole("button", { name: "Renomear grupo" }))
    const input = screen.getByRole("textbox", { name: "Nome do grupo" })
    expect(input).toHaveFocus()
    await userEvent.type(input, "Ferramentas{Enter}")

    expect(screen.getByRole("heading", { name: "Ferramentas" })).toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Ferramentas" })).toBeInTheDocument() // the panel stays open
    expect(desktopList().getByRole("button", { name: "Abrir o grupo Ferramentas" })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem("usamios:layouts")!).desktop.groups[0].name).toBe("Ferramentas")
  })

  it("right-clicking the group opens it ready to rename", async () => {
    makeGroup()
    renderOS()
    await userEvent.pointer({ keys: "[MouseRight]", target: desktopList().getByRole("button", { name: /Abrir o grupo/ }) })
    const input = screen.getByRole("textbox", { name: "Nome do grupo" })
    expect(input).toHaveFocus()
    await userEvent.type(input, "Meus apps{Enter}")
    expect(desktopList().getByRole("button", { name: "Abrir o grupo Meus apps" })).toBeInTheDocument()
  })

  it("Escape while renaming cancels the rename and keeps the panel open", async () => {
    makeGroup()
    renderOS()
    await openPanel()
    await userEvent.click(screen.getByRole("button", { name: "Renomear grupo" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Nome do grupo" }), "Nada{Escape}")
    expect(screen.queryByRole("textbox", { name: "Nome do grupo" })).not.toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Grupo 1" })).toBeInTheDocument()
    expect(useShell.getState().layouts.desktop.groups[0]!.name).toBe("")
  })

  it("clicking elsewhere keeps the name that was being typed", async () => {
    makeGroup()
    renderOS()
    await openPanel()
    await userEvent.click(screen.getByRole("button", { name: "Renomear grupo" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Nome do grupo" }), "Guardado")
    await userEvent.click(document.body)
    expect(screen.queryByRole("dialog", { name: /Guardado|Grupo 1/ })).not.toBeInTheDocument()
    expect(useShell.getState().layouts.desktop.groups[0]!.name).toBe("Guardado")
  })

  it("an empty name goes back to the default, and long names are capped", async () => {
    makeGroup()
    useShell.getState().setArrangement("desktop", (a) => ({ ...a, groups: a.groups.map((g) => ({ ...g, name: "Antigo" })) }))
    renderOS()
    await openPanel()
    await userEvent.click(screen.getByRole("button", { name: "Renomear grupo" }))
    const input = screen.getByRole("textbox", { name: "Nome do grupo" })
    await userEvent.clear(input)
    await userEvent.keyboard("{Enter}")
    expect(screen.getByRole("heading", { name: "Grupo 1" })).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Renomear grupo" }))
    expect(screen.getByRole("textbox", { name: "Nome do grupo" })).toHaveAttribute("maxLength", "40")
  })

  it("works on the phone too", async () => {
    setPhone(true)
    useShell.getState().setArrangement("home", (a) => createGroup(a, "", ["terminal", "gallery"]).arrangement)
    renderOS()
    const grid = within(screen.getByRole("list", { name: "Atalhos da área de trabalho" }))
    await userEvent.click(grid.getByRole("button", { name: "Abrir o grupo Grupo 1" }))
    await userEvent.click(screen.getByRole("button", { name: "Renomear grupo" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Nome do grupo" }), "Trabalho{Enter}")
    expect(grid.getByRole("button", { name: "Abrir o grupo Trabalho" })).toBeInTheDocument()
  })
})