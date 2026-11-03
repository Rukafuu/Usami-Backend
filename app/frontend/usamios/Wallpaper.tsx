import { Stars } from "./components/Stars"
import { useShell, WALLPAPER_IMAGES } from "./shell"

/** Wallpaper layer: the chosen background (illustration or colour) and a few stars. Nothing is written over it, so the art stays clean. */
export function Wallpaper() {
  const wallpaper = useShell((s) => s.wallpaper)
  const image = WALLPAPER_IMAGES[wallpaper]

  return (
    <div
      className={`os-desk${image ? " has-image" : ""}`}
      style={image ? ({ "--wall-l": `url(${image.src})`, "--wall-p": `url(${image.portrait ?? image.src})` } as React.CSSProperties) : undefined}
      aria-hidden="true"
    >
      {image ? (
        <picture>
          {image.portrait && <source media="(orientation: portrait)" srcSet={image.portrait} />}
          <img className="os-wall" src={image.src} alt="" decoding="async" />
        </picture>
      ) : (
        <Stars />
      )}
      {!image && <div className="os-moon" />}
    </div>
  )
}
