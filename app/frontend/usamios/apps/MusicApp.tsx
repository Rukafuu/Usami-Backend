import { useEffect, useMemo, useRef, useState } from "react"
import {
  buildSoundCloudEmbedUrl,
  MUSIC_TRACKS,
  SOUNDCLOUD_PROFILES,
  type ArtistId,
  type MusicTrack,
} from "../music/tracks"
import { setConsent, useConsent } from "../consent"
import { prefersReducedMotion } from "../shell"
import type { OsData } from "../types"

const formatMs = (ms: number) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const BARS = 20

const CURATED_MIXES = [
  {
    id: "mix-dj",
    title: "DJ Usami",
    subtitle: "Click to start listening",
    badge: "AI MIX",
    accent: "is-dj",
    icon: "◉",
    filter: "all" as ArtistId,
    trackId: "rukafuu-sissy",
  },
  {
    id: "mix-reskyume",
    title: "Reskyume Originals",
    subtitle: "FL Studio · Bass & ID",
    badge: "RESKYUME",
    accent: "is-warm",
    icon: "♪",
    filter: "rukafuu" as ArtistId,
    trackId: "rukafuu-losemyid",
  },
  {
    id: "mix-lira-pt",
    title: "Lira · Sessões PT-BR",
    subtitle: "Vocal & Pop Autoral",
    badge: "LIRA",
    accent: "is-rose",
    icon: "✦",
    filter: "lira" as ArtistId,
    trackId: "lira-chip-de-ouro",
  },
  {
    id: "mix-lira-synth",
    title: "Silicon & Synthetic Halo",
    subtitle: "Synthwave & Electronic",
    badge: "SYNTH",
    accent: "is-gold",
    icon: "◈",
    filter: "lira" as ArtistId,
    trackId: "lira-silicon-sins",
  },
] as const

/**
 * Usami Music — Spotify Desktop-inspired SoundCloud player for Lucas's own productions
 * (Reskyume @ soundcloud.com/rukafuu & Amarynth Lira @ soundcloud.com/amarynth-lira).
 */
export function MusicApp({ data }: { data: OsData }) {
  const t = data.ui.apps
  const c = data.ui.consent
  // The SoundCloud player sets third-party cookies, so it only loads after "Allow all".
  const allowed = useConsent() === "all"
  const [artistFilter, setArtistFilter] = useState<ArtistId>("all")
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState<string>(MUSIC_TRACKS[0]!.id)
  const [likedIds, setLikedIds] = useState<string[]>(["rukafuu-sissy", "lira-we-glow", "lira-silicon-sins"])
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [volume, setVolume] = useState(80)
  const [muted, setMuted] = useState(false)
  const [positionMs, setPositionMs] = useState(0)
  const [durationMs, setDurationMs] = useState(180_000)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const playlist = useMemo(() => {
    const byArtist =
      artistFilter === "all" ? MUSIC_TRACKS : MUSIC_TRACKS.filter((tr) => tr.artistId === artistFilter)
    const q = query.trim().toLowerCase()
    if (!q) return byArtist
    return byArtist.filter(
      (tr) =>
        tr.title.toLowerCase().includes(q) ||
        tr.artist.toLowerCase().includes(q) ||
        tr.tag.toLowerCase().includes(q),
    )
  }, [artistFilter, query])

  const currentTrack: MusicTrack =
    MUSIC_TRACKS.find((tr) => tr.id === activeId) ?? playlist[0] ?? MUSIC_TRACKS[0]!

  const isLiked = likedIds.includes(currentTrack.id)
  const toggleLike = (id: string) => {
    setLikedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

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
          if (
            typeof msg.value.relativePosition === "number" &&
            msg.value.relativePosition > 0 &&
            msg.value.currentPosition > 0
          ) {
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
    const pool = playlist.length > 0 ? playlist : MUSIC_TRACKS
    if (shuffle && pool.length > 1) {
      const others = pool.filter((tr) => tr.id !== currentTrack.id)
      const pick = others[Math.floor(Math.random() * others.length)]
      if (pick) selectTrack(pick, true)
      return
    }
    const idx = pool.findIndex((tr) => tr.id === currentTrack.id)
    const nextIdx = idx < 0 ? 0 : (idx + delta + pool.length) % pool.length
    const next = pool[nextIdx]
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

  const activateMix = (filter: ArtistId, trackId: string) => {
    setArtistFilter(filter)
    const target = MUSIC_TRACKS.find((tr) => tr.id === trackId) ?? MUSIC_TRACKS[0]!
    selectTrack(target, allowed)
  }

  const reduced = prefersReducedMotion()

  return (
    <div className="os-music">
      {/* Top Bar (Spotify Desktop Navigation + Search) */}
      <header className="os-music-topbar">
        <div className="os-music-nav-arrows">
          <button
            type="button"
            className="os-music-circle-btn"
            onClick={() => stepTrack(-1)}
            title={t.music_prev || "Faixa anterior"}
            aria-label="Voltar faixa"
          >
            ‹
          </button>
          <button
            type="button"
            className="os-music-circle-btn"
            onClick={() => stepTrack(1)}
            title={t.music_next || "Próxima faixa"}
            aria-label="Avançar faixa"
          >
            ›
          </button>
        </div>

        <div className="os-music-search-row">
          <button
            type="button"
            className={`os-music-home-btn${artistFilter === "all" && !query ? " is-active" : ""}`}
            onClick={() => {
              setArtistFilter("all")
              setQuery("")
            }}
            aria-label="Início da biblioteca"
            title="Início"
          >
            ⌂
          </button>
          <label className="os-music-search">
            <span className="os-music-search-ico" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você quer ouvir?"
              aria-label="Buscar faixa ou artista"
            />
            {query && (
              <button
                type="button"
                className="os-music-search-clear"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
              >
                ×
              </button>
            )}
          </label>
        </div>

        <div className="os-music-top-profiles mono">
          <a href={SOUNDCLOUD_PROFILES.rukafuu.url} target="_blank" rel="noopener">
            @rukafuu ↗
          </a>
          <a href={SOUNDCLOUD_PROFILES.lira.url} target="_blank" rel="noopener">
            @amarynth-lira ↗
          </a>
          <span className="os-music-user-pill" title="Lucas Frischeisen (Reskyume)">
            <img src="/brand/logo-64.png" alt="" width="22" height="22" />
            <span>Luke</span>
          </span>
        </div>
      </header>

      {/* Main 3-Pane Spotify Desktop Workspace */}
      <div className="os-music-workspace">
        {/* Left Pane: Sua Biblioteca */}
        <aside className="os-music-playlist" aria-label={t.music_playlist || "Playlist autoral"}>
          <header className="os-music-pl-head">
            <div className="os-music-lib-title">
              <span className="os-music-lib-ico" aria-hidden="true">|||</span>
              <strong>Sua Biblioteca</strong>
              <span className="os-music-lib-count mono">{t.music_playlist || "Playlist autoral"} ({playlist.length})</span>
            </div>
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
                    <span className="os-music-lib-thumb" aria-hidden="true">
                      {allowed ? (
                        <img src={tr.artworkUrl} alt="" width="40" height="40" loading="lazy" />
                      ) : (
                        <span className={`os-music-thumb-fallback is-${tr.artistId}`}>
                          {tr.artistId === "rukafuu" ? "R" : "L"}
                        </span>
                      )}
                      <span className="os-music-idx mono">
                        {isCurrent && playing ? "♫" : String(idx + 1).padStart(2, "0")}
                      </span>
                    </span>
                    <span className="os-music-tr-body">
                      <strong>{tr.title}</strong>
                      <small className="mono">{tr.artist} · {tr.tag}</small>
                    </span>
                    {isCurrent && (
                      <span className="os-music-active-speaker" aria-hidden="true">
                        {playing ? "🔊" : "♪"}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Center Pane: Shortcuts, Active Track Hero Stage + SoundCloud Widget & Mixes */}
        <section className="os-music-deck" aria-label="Início e reprodutor">
          {/* Top 2x2 Quick-Access Grid (like Spotify's top shortcut cards) */}
          <div className="os-music-quickgrid">
            {CURATED_MIXES.map((mix) => {
              const isMixActive = currentTrack.id === mix.trackId
              return (
                <button
                  key={mix.id}
                  type="button"
                  className={`os-music-quickcard ${mix.accent}${isMixActive ? " is-active" : ""}`}
                  onClick={() => activateMix(mix.filter, mix.trackId)}
                >
                  <span className="os-music-quickart" aria-hidden="true">
                    {mix.icon}
                  </span>
                  <span className="os-music-quickmeta">
                    <strong>{mix.title}</strong>
                    <small>{mix.subtitle}</small>
                  </span>
                  <span className="os-music-quickplay" aria-hidden="true">
                    {isMixActive && playing ? "ılı" : "▶"}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Featured Stage Card (Active Track + SoundCloud Embed / Cookie Consent) */}
          <div className="os-music-stage">
            <div className="os-music-hero">
              {/* Cover art is hosted by SoundCloud, so it also waits for "Allow all". */}
              {allowed ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="os-music-art"
                  width="92"
                  height="92"
                />
              ) : (
                <span className="os-music-art os-music-art--empty" aria-hidden="true">♪</span>
              )}
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

            <div className="os-music-embed">
              {allowed ? (
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
              ) : (
                <div className="os-music-consent">
                  <p>{c.music_blocked}</p>
                  <div>
                    <button type="button" className="os-button is-primary" onClick={() => setConsent("all")}>
                      {c.music_allow}
                    </button>
                    <a className="os-button" href={currentTrack.trackUrl} target="_blank" rel="noopener">
                      {c.music_open} ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* "Feito para Luke" Shelf */}
          <div className="os-music-shelf">
            <header className="os-music-shelf-head">
              <div>
                <small className="mono">Feito para</small>
                <h3>Luke · Estúdio Fuwarch</h3>
              </div>
              <span className="mono os-music-shelf-tag">100% Autoral · SoundCloud</span>
            </header>

            <div className="os-music-shelf-grid">
              <div className="os-music-album-card" onClick={() => activateMix("rukafuu", "rukafuu-sissy")}>
                <div className="os-music-album-cover is-warm">
                  <span>RESKYUME</span>
                  <strong>FL Studio IDs</strong>
                </div>
                <strong>Produções Reskyume</strong>
                <small>{SOUNDCLOUD_PROFILES.rukafuu.bio}</small>
              </div>

              <div className="os-music-album-card" onClick={() => activateMix("lira", "lira-we-glow")}>
                <div className="os-music-album-cover is-rose">
                  <span>AMARYNTH LIRA</span>
                  <strong>Vocal & AI</strong>
                </div>
                <strong>Amarynth Lira Essentials</strong>
                <small>{SOUNDCLOUD_PROFILES.lira.bio}</small>
              </div>

              <div className="os-music-album-card" onClick={() => activateMix("lira", "lira-synthetic-halo")}>
                <div className="os-music-album-cover is-gold">
                  <span>NIGHT SESSION</span>
                  <strong>Synth & Bass</strong>
                </div>
                <strong>Late Night Coding Mix</strong>
                <small>Faixas para programar no Fuwarch</small>
              </div>
            </div>
          </div>
        </section>

        {/* Right Pane: Connect & Studio Spectrum (like Spotify's right Connect sidebar) */}
        <aside className="os-music-connect" aria-label="Connect e Dispositivo">
          <header className="os-music-connect-head">
            <strong>Connect</strong>
            <span className="os-badge is-live">Fuwarch Audio</span>
          </header>

          <div className="os-music-device-card is-active">
            <div className="os-music-device-row">
              <span className="os-music-device-ico" aria-hidden="true">💻</span>
              <div>
                <strong>Este computador</strong>
                <small>Fuwarch PipeWire · SoundCloud API</small>
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
          </div>

          <div className="os-music-artist-box">
            <span className="mono os-music-artist-label">Créditos da faixa</span>
            <strong>{currentTrack.artist}</strong>
            <p>
              {currentTrack.artistId === "rukafuu"
                ? SOUNDCLOUD_PROFILES.rukafuu.bio
                : SOUNDCLOUD_PROFILES.lira.bio}
            </p>
            <a
              className="os-button"
              href={currentTrack.profileUrl}
              target="_blank"
              rel="noopener"
            >
              Ver perfil no SoundCloud ↗
            </a>
          </div>
        </aside>
      </div>

      {/* Bottom Full-Width Spotify Player Bar */}
      <footer className="os-music-playerbar">
        {/* Left: Now Playing Info */}
        <div className="os-music-now">
          {allowed ? (
            <img
              src={currentTrack.artworkUrl}
              alt=""
              className="os-music-now-art"
              width="52"
              height="52"
            />
          ) : (
            <span className="os-music-now-art os-music-art--empty" aria-hidden="true">♪</span>
          )}
          <div className="os-music-now-text">
            <strong>{currentTrack.title}</strong>
            <small>{currentTrack.artist}</small>
          </div>
          <button
            type="button"
            className={`os-music-like-btn${isLiked ? " is-liked" : ""}`}
            onClick={() => toggleLike(currentTrack.id)}
            aria-label={isLiked ? "Remover dos favoritos" : "Salvar nos favoritos"}
            title={isLiked ? "Salvo nas Músicas Curtidas" : "Salvar nas Músicas Curtidas"}
          >
            {isLiked ? "♥" : "♡"}
          </button>
        </div>

        {/* Center: Transport + Progress Bar */}
        <div className="os-music-controls">
          <div className="os-music-transport">
            <button
              type="button"
              className={`os-music-icon-btn${shuffle ? " is-on" : ""}`}
              aria-label="Ordem aleatória"
              aria-pressed={shuffle}
              onClick={() => setShuffle((s) => !s)}
              title="Ordem aleatória"
            >
              ⇄
            </button>
            <button
              type="button"
              className="os-music-icon-btn"
              aria-label={t.music_prev || "Faixa anterior"}
              onClick={() => stepTrack(-1)}
            >
              ⏮
            </button>
            <button
              type="button"
              className="os-music-play"
              aria-label={playing ? (t.music_pause || "Pausar") : (t.music_play || "Reproduzir")}
              onClick={togglePlay}
              disabled={!allowed}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              className="os-music-icon-btn"
              aria-label={t.music_next || "Próxima faixa"}
              onClick={() => stepTrack(1)}
            >
              ⏭
            </button>
            <button
              type="button"
              className={`os-music-icon-btn${repeat ? " is-on" : ""}`}
              aria-label="Repetir faixa"
              aria-pressed={repeat}
              onClick={() => setRepeat((r) => !r)}
              title="Repetir"
            >
              ↻
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
        </div>

        {/* Right: Volume & Output */}
        <div className="os-music-vol">
          <button
            type="button"
            className="os-music-icon-btn"
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
      </footer>

      {/* Bottom Spotify-style Active Device Status Strip */}
      <div className={`os-music-devicebar${allowed ? " is-ready" : ""}`}>
        <span>
          {allowed
            ? `🔊 Tocando em Fuwarch Linux · ${currentTrack.artist} — ${currentTrack.title}`
            : "🔒 SoundCloud em espera · Clique em Permitir acima para ativar o áudio"}
        </span>
        <span className="mono">SoundCloud Direct · @rukafuu & @amarynth-lira</span>
      </div>
    </div>
  )
}
