import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute("data-theme")
  window.localStorage.clear()
  window.sessionStorage.clear()
})

// jsdom has no canvas; the starfield is decoration and simply skips drawing.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"]

// jsdom has no matchMedia; default to "no preference, no reduced motion".
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList
