import { describe, expect, it } from "vitest"
import { data } from "../../test/fixtures"
import { complete, isRmRoot, run } from "./commands"

describe("destructive classics get a joke, never an action", () => {
  it.each([
    "sudo rm -rf /",
    "sudo rm -rf /*",
    "rm -rf /",
    "sudo rm -fr /",
    "sudo rm -r -f /",
    "sudo rm -rf --no-preserve-root /",
    "  SUDO rm -rf /  ",
  ])("%s", (line) => {
    expect(isRmRoot(line)).toBe(true)
    const result = run(line, "/", data)
    expect(result.lines).toEqual([data.ui.terminal.rm_root])
    expect(result.effect).toBeUndefined()
  })

  it("does not mistake harmless commands for the classic", () => {
    expect(isRmRoot("rm notes.txt")).toBe(false)
    expect(isRmRoot("rm -rf ./cache")).toBe(false)
    expect(isRmRoot("ls /")).toBe(false)
  })

  it("other writes are refused and sudo is mocked", () => {
    expect(run("rm hane.core", "/sistemas", data).lines).toEqual([data.ui.terminal.read_only])
    expect(run("mkdir x", "/", data).lines).toEqual([data.ui.terminal.read_only])
    expect(run("sudo ls", "/", data).lines).toEqual([data.ui.terminal.sudo])
  })
})

describe("navigating the content", () => {
  it("lists folders, then the files in a folder", () => {
    expect(run("ls", "/", data).lines).toEqual(["sistemas/  empresa/"])
    expect(run("ls sistemas", "/", data).lines).toEqual(["hane.core", "usami.companion"])
  })

  it("cd moves around and cd .. goes home; unknown folders are reported", () => {
    expect(run("cd sistemas", "/", data).cwd).toBe("/sistemas")
    expect(run("cd ..", "/sistemas", data).cwd).toBe("/")
    expect(run("cd nada", "/", data).lines[0]).toContain("nada")
    expect(run("pwd", "/sistemas", data).lines).toEqual(["/sistemas"])
  })

  it("cat shows what is proven apart from what is planned, with sources", () => {
    const text = run("cat sistemas/hane.core", "/", data).lines.join("\n")
    expect(text).toContain("[Provado]")
    expect(text).toContain("+ Orçamento de chamadas")
    expect(text).toContain("[Planejado]")
    expect(text).toContain("- workspace.write")
    expect(text).toContain("https://github.com/Rukafuu/Hane")
  })

  it("cat on the ledger prints every claim with its date", () => {
    expect(run("cat empresa/evidencias.ledger", "/", data).lines.join("\n")).toContain("2026-11-02  Hane · Apache-2.0")
  })

  it("open and evidence ask the shell to show the file", () => {
    expect(run("open hane.core", "/sistemas", data).effect).toEqual({ type: "open", folder: "sistemas", id: "hane" })
    expect(run("evidence", "/", data).effect).toEqual({ type: "open", folder: "empresa", id: "ledger" })
  })

  it("reports missing files, usage and unknown commands", () => {
    expect(run("cat nope.txt", "/", data).lines[0]).toContain("nope.txt")
    expect(run("cat", "/", data).lines[0]).toContain("cat <file>")
    expect(run("banana", "/", data).lines[0]).toContain("banana")
    expect(run("   ", "/", data).lines).toEqual([])
  })

  it("neofetch is honest that the system is emulated", () => {
    const result = run("neofetch", "/", data)
    expect(result.art).toBe("fuwarch")
    const text = result.lines.join("\n")
    expect(text).toContain("F U W A R C H")
    expect(text).toContain("Fuwarch Linux (emulado)")
    expect(text).toContain("emulado no navegador")
  })

  it("clear and exit are effects, not text", () => {
    expect(run("clear", "/", data).effect).toEqual({ type: "clear" })
    expect(run("exit", "/", data).effect).toEqual({ type: "exit" })
  })

  it("about, projects, skills, contact and usami --about present real content", () => {
    const aboutText = run("about", "/", data).lines.join("\n")
    expect(aboutText).toContain("Usami · Fuwarch Linux v0.3")
    expect(aboutText).toContain("Presença — Voz e memória.")

    const projectsText = run("projects", "/", data).lines.join("\n")
    expect(projectsText).toContain("[Público] sistemas/hane.core [Node.js]")
    expect(projectsText).toContain("[Em desenvolvimento] sistemas/usami.companion")
    expect(projectsText).not.toContain("lucas.txt")

    const skillsText = run("skills", "/", data).lines.join("\n")
    expect(skillsText).toContain("Node.js")
    expect(skillsText).toContain("Aplicações — Web, desktop e mobile.")

    const contactText = run("contact", "/", data).lines.join("\n")
    expect(contactText).toContain("Lucas Frischeisen")
    expect(contactText).toContain("https://github.com/Rukafuu")

    const usamiText = run("usami --about", "/", data).lines.join("\n")
    expect(usamiText).toContain("usami.companion")
    expect(usamiText).toContain("+ Voz em streaming")
    expect(run("usami --unknown", "/", data).lines[0]).toContain("usami [--about]")
  })

  it("ps prints virtual processes and top/cal/code launch system apps", () => {
    const psText = run("ps", "/", data).lines.join("\n")
    expect(psText).toContain("fuwarch-wm")
    expect(psText).toContain("fuwarch-sh")
    expect(run("top", "/", data).effect).toEqual({ type: "app", id: "taskmgr" })
    expect(run("cal", "/", data).effect).toEqual({ type: "app", id: "calendar" })
    expect(run("code laya", "/", data).effect).toEqual({ type: "code", id: "laya" })
  })
})

describe("tab completion", () => {
  it("completes commands, flags and file names", () => {
    expect(complete("ne", "/", data)).toEqual(["neofetch"])
    expect(complete("pr", "/", data)).toEqual(["projects"])
    expect(complete("usami --", "/", data)).toEqual(["--about"])
    expect(complete("code l", "/", data)).toEqual(["lira", "laya"])
    expect(complete("cat ha", "/sistemas", data)).toEqual(["hane.core"])
    expect(complete("cd si", "/", data)).toContain("sistemas/")
  })
})
