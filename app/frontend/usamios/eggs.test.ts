import { afterEach, describe, expect, it, vi } from "vitest"
import { data } from "../test/fixtures"
import { printConsoleGreeting } from "./eggs"

afterEach(() => vi.restoreAllMocks())

describe("F12 easter egg", () => {
  it("prints the mascot, a joke and how to reach Lucas", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    await printConsoleGreeting(data, "https://github.com/Rukafuu")
    const output = log.mock.calls.map((c) => String(c[0])).join("\n")
    expect(output).toContain("F U W A R C H")
    // the full drawing from Lucas (68 lines), not the small one used by neofetch
    expect(output.split("\n").length).toBeGreaterThan(68)
    expect(output).toContain("@@@@@@@@@@@@")
    expect(output).toContain("Olá, curioso(a)!")
    expect(output).toContain("https://github.com/Rukafuu")
  })
})
