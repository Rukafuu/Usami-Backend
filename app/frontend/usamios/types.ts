export type Locale = "pt" | "en" | "es" | "ja"

export type Source = { label: string; url: string | null; /** Key of a channel icon in /brand/channels (email, whatsapp, linkedin, enois, github, soundcloud). */ icon?: string; /** Readable address shown next to the label (e.g. the handle or number). */ detail?: string }

export type Entry = {
  id: string
  folder: string
  filename: string
  /** Descriptive title ("Hane — agents with a budget…"); the short project name is the part before the dash. */
  title?: string
  status: string
  route: string | null
  stack: string[]
  description: string
  proven: string[]
  planned: string[]
  listsTranslated: boolean
  sources: Source[]
  /** The founder's own about-me text (paragraphs) and portrait; only his entry has them. */
  about?: string[]
  photo?: { src: string; small: string; width: number; height: number; alt: string } | null
}

export type LedgerItem = { claim: string; source: string; url: string | null; verifiedOn: string }
export type TitledText = { title: string; text: string }
export type MediaItem = { id: string; entry: string; kind: "image" | "video" | "diagram"; src: string | null; thumb: string | null; placeholder: boolean; caption: string }
export type Library = { name: string; version: string | null; ecosystem: "ruby" | "npm" }

export type SystemInfo = {
  version: string
  startedAt: string | null
  measuredAt: string | null
  models: string[]
  prompts: number | null
  apiResponses: number | null
  tokens: { input: number | null; cacheCreation: number | null; cacheRead: number | null; output: number | null }
  totalTokens: number | null
  libraries: Library[]
}

export type Ui = {
  shell: {
    folders_label: string
    close: string
    classic: string
    open_shell: string
    theme: string
    language: string
    sub: string
    boot_skip: string
    boot: string[]
    login_user: string
    login_note: string
    login_action: string
    init_title: string
    init: string[]
    start: string
    start_menu: string
    minimize: string
    maximize: string
    restore: string
    home: string
    back: string
    running: string
    desktop_icons: string
  }
  apps: {
    browser: string
    files: string
    files_open_code: string
    code: string
    code_repo: string
    code_files: string
    code_tab_editor: string
    code_tab_commits: string
    code_tab_arch: string
    code_blank?: string
    code_new_file?: string
    code_fork_scratch?: string
    messenger?: string
    messenger_status?: string
    messenger_substatus?: string
    messenger_welcome?: string
    messenger_nudge?: string
    messenger_nudge_sent?: string
    messenger_nudge_reply?: string
    messenger_topics_label?: string
    messenger_topic_company?: string
    messenger_topic_projects?: string
    messenger_topic_tech?: string
    messenger_topic_experience?: string
    messenger_topic_fuwarch?: string
    messenger_topic_contact?: string
    messenger_you?: string
    messenger_placeholder?: string
    messenger_input_label?: string
    messenger_send?: string
    achievements?: string
    achievements_subtitle?: string
    achievements_progress?: string
    achievements_unlocked?: string
    achievements_locked?: string
    achievements_projects_visited?: string
    achievements_reset?: string
    achievements_items?: Partial<Record<string, { title: string; desc: string; hint: string }>>
    music?: string
    music_playlist?: string
    music_visualizer?: string
    music_prev?: string
    music_play?: string
    music_pause?: string
    music_next?: string
    music_progress?: string
    music_volume?: string
    gallery: string
    settings: string
    about: string
    quote: string
    browser_pages: { company: string; projects: string; services: string; about_me: string }
    browser_open_files: string
    gallery_empty: string
    theme: string
    theme_system: string
    theme_light: string
    theme_dark: string
    wallpaper: string
    wallpapers: Record<string, string>
    about_built_with: string
    about_models: string
    about_prompts: string
    about_context: string
    about_total: string
    about_time: string
    about_libraries: string
    not_measured: string
    about_note: string
    about_emulated: string
    terminal: string
    calendar: string
    calendar_today: string
    calendar_prev: string
    calendar_next: string
    calendar_milestones: string
    calendar_selected: string
    calendar_empty_day: string
    calendar_egg_badge: string
    calendar_egg_1103: string
    calendar_egg_1031: string
    calendar_egg_0913: string
    calendar_egg_0101: string
    calendar_egg_0307: string
    calendar_candle: string
    calendar_candle_done: string
    about_mascot_title: string
    about_mascot_text: string
    about_env_title: string
    about_env_host: string
    about_env_storage: string
    about_env_files: string
    taskmgr: string
    taskmgr_session: string
    taskmgr_uptime: string
    taskmgr_open_count: string
    taskmgr_viewport: string
    taskmgr_dom_nodes: string
    taskmgr_windows: string
    taskmgr_no_windows: string
    taskmgr_col_app: string
    taskmgr_col_state: string
    taskmgr_col_layer: string
    taskmgr_col_actions: string
    taskmgr_state_focused: string
    taskmgr_state_normal: string
    taskmgr_state_minimized: string
    taskmgr_state_maximized: string
    taskmgr_focus: string
    taskmgr_end: string
    taskmgr_daemons: string
    taskmgr_daemons_note: string
    gallery_soon: string
    gallery_close: string
    gallery_folders: string
    gallery_back: string
    gallery_prev: string
    gallery_next: string
    gallery_original: string
    gallery_count: string
    gallery_items: string
    cat_appearance: string
    cat_wallpaper: string
    cat_apps: string
    slot_group_pc: string
    slot_group_phone: string
    slot_desktop: string
    slot_taskbar: string
    slot_home: string
    slot_dock: string
    apps_note: string
    apps_locked: string
    apps_reset: string
    app_library: string
    ctx_open: string
    ctx_add_desktop: string
    ctx_remove_desktop: string
    ctx_add_taskbar: string
    ctx_remove_taskbar: string
    ctx_add_home: string
    ctx_remove_home: string
    ctx_add_dock: string
    ctx_remove_dock: string
    ctx_uninstall: string
    ctx_essential: string
    ctx_add_to_group: string
    ctx_leave_group: string
    uninstall_title: string
    uninstall_body: string
    uninstall_keep: string
    uninstall_confirm: string
    app_install: string
    app_uninstall: string
    app_reinstall: string
    app_essential: string
    app_uninstalled: string
    group_default: string
    group_open: string
    group_close: string
    group_rename: string
    cat_layout: string
    layout_note: string
    layout_order: string
    layout_move_up: string
    layout_move_down: string
    layout_group_select: string
    layout_no_group: string
    layout_new_group: string
    layout_group_with: string
    layout_groups: string
    layout_group_name: string
    layout_delete_group: string
    layout_empty: string
    layout_group_empty: string
    cat_display: string
    cat_language: string
    cat_system: string
    vision: string
    vision_none: string
    vision_redgreen: string
    vision_blueyellow: string
    vision_contrast: string
    vision_note: string
    accent: string
    accent_locked: string
    accents: Record<string, string>
    text_size: string
    size_small: string
    size_default: string
    size_large: string
    size_xl: string
    icon_size: string
    motion: string
    motion_system: string
    motion_reduce: string
    transparency: string
    paw_cursor?: string
    reset: string
    about_tokens_out: string
    about_tokens_in: string
    about_tokens_cache: string
    about_total_note: string
    about_responses: string
    about_measured: string
  }
  entry: { proven: string; planned: string; stack: string; sources: string; translation_pending: string; about: string }
  status: Record<string, string>
  folders: Record<string, string>
  evidence: { title: string; claim: string; source: string; verified: string }
  nav: { evidence: string }
  terminal: Record<string, string>
  consent: { essential: string; all: string; privacy: string; cookies: string; current_essential: string; current_all: string; current_none: string; music_blocked: string; music_allow: string; music_open: string; assistant_note: string; about_title: string }
  eggs: { konami_title: string; konami_text: string; start_label: string; console_intro: string; console_contact: string }
  claude_pet: { name: string; label: string; asleep: string; toggle?: string; lines: string[] }
  contact_form: {
    heading: string
    lead: string
    fields: Record<"name" | "email" | "contact_handle" | "services" | "budget" | "timeline" | "details", string>
    placeholders: Record<"name" | "email" | "contact_handle" | "details", string>
    hints: Record<"contact_handle" | "services" | "budget" | "details", string>
    services: Record<string, string>
    budgets: Record<string, string>
    timelines: Record<string, string>
    submit: string
    privacy_note: string
    promise_text: string
    app_sending: string
    app_error_invalid: string
    app_error_failed: string
    app_again: string
  }
  thanks_page: { heading: string; lead: string; image_alt: string }
}

export type OsData = {
  locale: Locale
  site: { name: string; osName: string; founderBirthday?: string; headline: string; description: string; pillars: TitledText[] }
  ui: Ui
  folders: string[]
  entries: Entry[]
  ledger: LedgerItem[]
  services: TitledText[]
  gallery: MediaItem[]
  system: SystemInfo
}

export type PageContext = {
  locale: Locale
  folder: string | null
  slug: string | null
  alternates: Record<Locale, string>
}
