export type ArtistId = "all" | "rukafuu" | "lira"

export type MusicTrack = {
  id: string
  title: string
  artist: "Reskyume" | "Amarynth Lira"
  artistId: "rukafuu" | "lira"
  profileUrl: string
  trackUrl: string
  artworkUrl: string
  tag: string
}

export const SOUNDCLOUD_PROFILES = {
  rukafuu: {
    name: "Reskyume (Lucas Frischeisen)",
    handle: "@rukafuu",
    url: "https://soundcloud.com/rukafuu/sets/my-tracks",
    tracksUrl: "https://soundcloud.com/rukafuu/tracks",
    bio: "Produções autorais (FL Studio desde 2018 · Playlist My tracks)",
  },
  lira: {
    name: "Amarynth Lira",
    handle: "@amarynth-lira",
    url: "https://soundcloud.com/amarynth-lira/tracks",
    bio: "AI-driven singer managed & coded by @rukafuu",
  },
} as const

export const MUSIC_TRACKS: MusicTrack[] = [
  // Reskyume — https://soundcloud.com/rukafuu/sets/my-tracks (10 tracks)
  {
    id: "rukafuu-sissy",
    title: "Aus der Ferne, em rosa",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/sissy",
    artworkUrl: "https://i1.sndcdn.com/artworks-YJe5LXaOVBsCAcqG-sKNMfg-t500x500.jpg",
    tag: "Original · Reskyume",
  },
  {
    id: "rukafuu-losemyid",
    title: "Lose My Mind (ID)",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/losemyid",
    artworkUrl: "https://i1.sndcdn.com/artworks-iaam4d7TIy2x01AH-6rodrQ-t500x500.jpg",
    tag: "ID · Dance & EDM",
  },
  {
    id: "rukafuu-mosquitoes",
    title: "Mosquitoes Invasion",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/mosquitoes-invasion",
    artworkUrl: "https://i1.sndcdn.com/artworks-xfRMzC6u7r6Zntl3-aLdCxg-t500x500.jpg",
    tag: "Original · Dubstep",
  },
  {
    id: "rukafuu-horizonte",
    title: "Horizonte de eventos",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/horizonte",
    artworkUrl: "https://i1.sndcdn.com/artworks-0kp9crDz9p8ytp0o-e0qhJg-t500x500.jpg",
    tag: "Original · Classical",
  },
  {
    id: "rukafuu-god-father",
    title: "God:Father",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/god-father",
    artworkUrl: "https://i1.sndcdn.com/artworks-wlCy4lmCkYFDgSuF-Rzd62g-t500x500.jpg",
    tag: "Original · Dubstep",
  },
  {
    id: "rukafuu-not-easy",
    title: "Not easy",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/not-easy",
    artworkUrl: "https://i1.sndcdn.com/artworks-VHNakhy9C7GciGO6-ffuqBA-t500x500.jpg",
    tag: "Original · Pop",
  },
  {
    id: "rukafuu-paranoid",
    title: "Paranoid",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/paranoid",
    artworkUrl: "https://i1.sndcdn.com/artworks-NWQU2zHNcIqLt1Xc-ivHnfA-t500x500.jpg",
    tag: "Original · Dance & EDM",
  },
  {
    id: "rukafuu-unspoken",
    title: "Unspoken",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/unspoken",
    artworkUrl: "https://i1.sndcdn.com/artworks-XpKPjbCTULCk4hzM-Qomqrw-t500x500.jpg",
    tag: "Original · Future Bass",
  },
  {
    id: "rukafuu-babadoom",
    title: "Meu Peru Babadoom",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/mc-theus-cba-meu-peru-babadoom",
    artworkUrl: "https://i1.sndcdn.com/artworks-v5it2MptTQTwxuv0-mOAmfA-t500x500.jpg",
    tag: "Original · Tearout Dubstep",
  },
  {
    id: "rukafuu-next-you",
    title: "Rukasu & Kill the Party - Next You",
    artist: "Reskyume",
    artistId: "rukafuu",
    profileUrl: "https://soundcloud.com/rukafuu/sets/my-tracks",
    trackUrl: "https://soundcloud.com/rukafuu/rukasu-kill-the-party-next-you",
    artworkUrl: "https://i1.sndcdn.com/artworks-w7ylv9GTuNcEMnsX-bZesEg-t500x500.jpg",
    tag: "Collab · Dance & EDM",
  },

  // Amarynth Lira — https://soundcloud.com/amarynth-lira/tracks (10 tracks)
  {
    id: "lira-we-glow",
    title: "We glow",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/we-glow-10",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · Vocal",
  },
  {
    id: "lira-dona-do-servidor",
    title: "Dona do Servidor",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/dona-do-servidor-5",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · PT-BR",
  },
  {
    id: "lira-chip-de-ouro",
    title: "Chip de Ouro",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/chip-de-ouro-6",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · PT-BR",
  },
  {
    id: "lira-silicon-sins",
    title: "SILICON SINS",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/silicon-sins-9",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · Synth",
  },
  {
    id: "lira-rainha-do-nada",
    title: "Rainha do Nada",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/rainha-do-nada-3",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · PT-BR",
  },
  {
    id: "lira-break-the-silence",
    title: "Break the silence",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/break-the-silence-13",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · Electronic",
  },
  {
    id: "lira-dev-de-ia-safado",
    title: "Dev de IA Safado",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/dev-de-ia-safado-1",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · Humor",
  },
  {
    id: "lira-im-feeling-alive",
    title: "I'm feeling alive",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/im-feeling-alive-11",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · Vocal",
  },
  {
    id: "lira-nao-foi-sorte",
    title: "Não foi sorte foi Deus",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/nao-foi-sorte-foi-deus-7",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · PT-BR",
  },
  {
    id: "lira-synthetic-halo",
    title: "SYNTHETIC HALO",
    artist: "Amarynth Lira",
    artistId: "lira",
    profileUrl: "https://soundcloud.com/amarynth-lira",
    trackUrl: "https://soundcloud.com/amarynth-lira/synthetic-halo-8",
    artworkUrl: "https://i1.sndcdn.com/artworks-9dr1CrjVDItlvynZ-mGVMfg-t500x500.jpg",
    tag: "Amarynth Lira · Synth",
  },
]

export const buildSoundCloudEmbedUrl = (trackUrl: string, autoPlay = false): string => {
  const params = new URLSearchParams({
    url: trackUrl,
    color: "#b98252",
    auto_play: autoPlay ? "true" : "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    show_teaser: "false",
    visual: "false",
  })
  return `https://w.soundcloud.com/player/?${params.toString()}`
}
