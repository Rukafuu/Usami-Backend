import { beforeEach, describe, expect, it } from "vitest"
import { setConsent, syncAnalytics } from "./consent"

const beacons = () => document.querySelectorAll('script[src*="static.cloudflareinsights.com"]')

describe("analytics only after \"Allow all\"", () => {
  beforeEach(() => {
    document.cookie = "usami_consent=; Max-Age=0; Path=/"
    document.head.querySelectorAll("script").forEach((s) => s.remove())
    document.body.innerHTML = '<div id="usamios" data-analytics-token="tok-123"></div>'
  })

  it("does nothing without a choice or with essential only", () => {
    syncAnalytics()
    expect(beacons()).toHaveLength(0)
    setConsent("essential")
    expect(beacons()).toHaveLength(0)
  })

  it("adds the beacon once, with the site token, when the visitor allows all", () => {
    setConsent("all")
    expect(beacons()).toHaveLength(1)
    syncAnalytics() // a second call (e.g. next navigation in the page) never adds a second beacon
    expect(beacons()).toHaveLength(1)
    expect(beacons()[0]!.getAttribute("data-cf-beacon")).toBe('{"token":"tok-123"}')
    expect((beacons()[0] as HTMLScriptElement).type).toBe("module")
  })

  it("does nothing when no token was configured at build time", () => {
    document.body.innerHTML = '<div id="usamios"></div>'
    setConsent("all")
    expect(beacons()).toHaveLength(0)
  })
})