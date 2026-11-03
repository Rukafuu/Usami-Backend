import { useSyncExternalStore } from "react"

/** Phone paradigm (home grid, dock, full-screen apps) below this width or on small touch screens. */
export const MOBILE_QUERY = "(max-width: 760px), (pointer: coarse) and (max-width: 1024px)"

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(MOBILE_QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

export const useIsMobile = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, () => false)
