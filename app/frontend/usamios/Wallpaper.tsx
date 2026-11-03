import { Stars } from "./components/Stars"
import { useShell, WALLPAPER_IMAGES } from "./shell"

type Props = { kicker: string; headline: string; sub: string }

/** Wallpaper layer: the chosen background (illustration or colour), a few stars and the company statement. */
export function Wallpaper({ kicker, headline, sub }: Props) {
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
      <div className="os-statement">
        <span className="mono">{kicker}</span>
        <p className="os-headline">{headline}</p>
        <span className="mono">{sub}</span>
      </div>
    </div>
  )
}
