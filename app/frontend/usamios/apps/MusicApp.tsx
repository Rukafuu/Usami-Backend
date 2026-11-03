import { useEffect, useMemo, useRef, useState } from "react"
import {
  buildSoundCloudEmbedUrl,
  MUSIC_TRACKS,
  SOUNDCLOUD_PROFILES,
  type ArtistId,
  type MusicTrack,
} from "../music/tracks"
import { prefersReducedMotion } from "../shell"
import type { OsData } from "../types"

const formatMs = (ms: number) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const BARS = 24

/**
 * Usami Music — SoundCloud-powered player for Lucas's own productions
 * (Reskyume @ soundcloud.com/rukafuu & Amarynth Lira @ soundcloud.com/amarynth-lira).
 */
export function MusicApp({ data }: { data: OsData }) {
  const t = data.ui.apps
  const [artistFilter, setArtistFilter] = useState<ArtistId>("all")
  const [activeId, setActiveId] = useState<string>(MUSIC_TRACKS[0]!.id)
  const [playing, setPlaying] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [volume, setVolume] = useState(80)
  const [muted, setMuted] = useState(false)
  const [positionMs, setPositionMs] = useState(0)
  const [durationMs, setDurationMs] = useState(180_000)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const playlist = useMemo(
    () => (artistFilter === "all" ? MUSIC_TRACKS : MUSIC_TRACKS.filter((tr) => tr.artistId === artistFilter)),
    [artistFilter],
  )

  const currentTrack: MusicTrack =
    MUSIC_TRACKS.find((tr) => tr.id === activeId) ?? playlist[0] ?? MUSIC_TRACKS[0]!

  const postWidget = (method: string, value?: unknown) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify(value === undefined ? { method } : { method, value }),
        "https://w.soundcloud.com",
      )
    } catch {
      /* ignore cross-origin frame errors in test environments */
    }
  }

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (typeof ev.origin === "string" && !ev.origin.includes("soundcloud.com")) return
      try {
        const msg = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data
        if (!msg || typeof msg !== "object") return
        if (msg.method === "ready") {
          postWidget("addEventListener", "play")
          postWidget("addEventListener", "pause")
          postWidget("addEventListener", "finish")
          postWidget("addEventListener", "playProgress")
          postWidget("setVolume", muted ? 0 : volume)
        } else if (msg.method === "play") {
          setPlaying(true)
        } else if (msg.method === "pause") {
          setPlaying(false)
        } else if (msg.method === "finish") {
          setPlaying(false)
        } else if (msg.method === "playProgress" && msg.value) {
          if (typeof msg.value.currentPosition === "number") setPositionMs(msg.value.currentPosition)
          if (typeof msg.value.relativePosition === "number" && msg.value.relativePosition > 0 && msg.value.currentPosition > 0) {
            setDurationMs(Math.round(msg.value.currentPosition / msg.value.relativePosition))
          }
        }
      } catch {
        /* ignore malformed messages */
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [muted, volume])

  const selectTrack = (track: MusicTrack, shouldPlay = true) => {
    setActiveId(track.id)
    setPositionMs(0)
    setAutoPlay(shouldPlay)
    setPlaying(shouldPlay)
  }

  const togglePlay = () => {
    const next = !playing
    setPlaying(next)
    setAutoPlay(next)
    postWidget(next ? "play" : "pause")
  }

  const stepTrack = (delta: number) => {
    const idx = playlist.findIndex((tr) => tr.id === currentTrack.id)
    const nextIdx = idx < 0 ? 0 : (idx + delta + playlist.length) % playlist.length
    const next = playlist[nextIdx]
    if (next) selectTrack(next, true)
  }

  const changeVolume = (nextVol: number) => {
    setVolume(nextVol)
    setMuted(nextVol === 0)
    postWidget("setVolume", nextVol)
  }

  const toggleMute = () => {
    const nextMuted = !muted
    setMuted(nextMuted)
    postWidget("setVolume", nextMuted ? 0 : volume)
  }

  const seekTo = (nextMs: number) => {
    setPositionMs(nextMs)
    postWidget("seekTo", nextMs)
  }

  const reduced = prefersReducedMotion()

  return (
    <div className="os-music">
      <div className="os-music-deck">
        <div className="os-music-hero">
          <img
            src={currentTrack.artworkUrl}
            alt={currentTrack.title}
            className="os-music-art"
            width="88"
            height="88"
          />
          <div className="os-music-info">
            <div className="os-music-badges">
              <span className="os-badge is-live">{currentTrack.artist}</span>
              <span className="os-badge">{currentTrack.tag}</span>
            </div>
            <h2>{currentTrack.title}</h2>
            <div className="os-music-links mono">
              <a href={currentTrack.trackUrl} target="_blank" rel="noopener">
                Ouvir no SoundCloud ↗
              </a>
              <span>·</span>
              <a href={SOUNDCLOUD_PROFILES.rukafuu.url} target="_blank" rel="noopener">
                @rukafuu ↗
              </a>
              <span>·</span>
              <a href={SOUNDCLOUD_PROFILES.lira.url} target="_blank" rel="noopener">
                @amarynth-lira ↗
              </a>
            </div>
          </div>
        </div>

        <div
          className={`os-music-viz${playing && !reduced ? " is-playing" : ""}`}
          role="img"
          aria-label={t.music_visualizer || "Visualizador de áudio"}
        >
          {Array.from({ length: BARS }, (_, i) => {
            const baseHeight = 20 + ((i * 37) % 65)
            return (
              <span
                key={i}
                className="os-music-bar"
                style={{
                  height: playing ? `${baseHeight}%` : "18%",
                  animationDelay: `${(i % 8) * 0.09}s`,
                }}
              />
            )
          })}
        </div>

        <div className="os-music-controls">
          <div className="os-music-transport">
            <button
              type="button"
              className="os-button mono"
              aria-label={t.music_prev || "Faixa anterior"}
              onClick={() => stepTrack(-1)}
            >
              ⏮
            </button>
            <button
              type="button"
              className="os-button is-primary mono os-music-play"
              aria-label={playing ? (t.music_pause || "Pausar") : (t.music_play || "Reproduzir")}
              onClick={togglePlay}
            >
              {playing ? "⏸ Pausar" : "▶ Tocar"}
            </button>
            <button
              type="button"
              className="os-button mono"
              aria-label={t.music_next || "Próxima faixa"}
              onClick={() => stepTrack(1)}
            >
              ⏭
            </button>
          </div>

          <label className="os-music-seek">
            <span className="mono">{formatMs(positionMs)}</span>
            <input
              type="range"
              min={0}
              max={durationMs}
              value={Math.min(positionMs, durationMs)}
              aria-label={t.music_progress || "Progresso da faixa"}
              onChange={(e) => seekTo(Number(e.target.value))}
            />
            <span className="mono">{formatMs(durationMs)}</span>
          </label>

          <div className="os-music-vol">
            <button
              type="button"
              className="os-button mono"
              aria-label={muted ? "Ativar som" : "Silenciar"}
              onClick={toggleMute}
            >
              {muted || volume === 0 ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              aria-label={t.music_volume || "Volume"}
              onChange={(e) => changeVolume(Number(e.target.value))}
            />
            <span className="mono">{muted ? 0 : volume}%</span>
          </div>
        </div>

        <div className="os-music-embed">
          <iframe
            ref={iframeRef}
            title={`SoundCloud — ${currentTrack.title}`}
            width="100%"
            height="110"
            scrolling="no"
            frameBorder="no"
            allow="autoplay; encrypted-media"
            src={buildSoundCloudEmbedUrl(currentTrack.trackUrl, autoPlay)}
          />
        </div>
      </div>

      <aside className="os-music-playlist" aria-label={t.music_playlist || "Playlist autoral"}>
        <header className="os-music-pl-head">
          <span className="mono">{t.music_playlist || "Playlist autoral"} ({playlist.length})</span>
          <div className="os-music-filters" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={artistFilter === "all"}
              onClick={() => setArtistFilter("all")}
            >
              Todas ({MUSIC_TRACKS.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={artistFilter === "rukafuu"}
              onClick={() => setArtistFilter("rukafuu")}
            >
              Reskyume (3)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={artistFilter === "lira"}
              onClick={() => setArtistFilter("lira")}
            >
              Amarynth Lira (10)
            </button>
          </div>
        </header>

        <ul className="os-music-tracks">
          {playlist.map((tr, idx) => {
            const isCurrent = tr.id === currentTrack.id
            return (
              <li key={tr.id}>
                <button
                  type="button"
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={() => selectTrack(tr, true)}
                >
                  <span className="os-music-idx mono">
                    {isCurrent && playing ? "♫" : String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="os-music-tr-body">
                    <strong>{tr.title}</strong>
                    <small className="mono">{tr.artist} · {tr.tag}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}
