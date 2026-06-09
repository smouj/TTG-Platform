// ============================================================
// Trading Tazos Game — i18n Types
// ============================================================

export type Lang = "en" | "es" | "pt" | "de" | "fr" | "it" | "ja" | "ko" | "zh" | "ru"

export const LANGS: { code: Lang; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
]

export interface Dictionary {
  // Site info
  siteTitle: string
  siteSubtitle: string
  siteIssue: string
  siteTagline: string
  siteFooterTribute: string
  siteFooterTrademark: string
  settings_title: string
  siteMastheadBadge: string

  // Nav
  nav_dashboard: string
  nav_play_now: string
  nav_back_to_home: string

  // Tabs
  tabAlbum: string
  tabBattle: string
  tabScanner: string
  tabStats: string

  // Battle
  battle_title: string
  battle_tagline: string
  battle_need_5_tazos: string
  battle_owned_tazos: string
  battle_need_5_suffix: string
  battle_start: string
  battle_loading: string
  battle_rematch: string
  battle_next_turn: string
  battle_resolve_turn: string
  battle_rival_thinking: string
  battle_rival_throwing: string
  battle_phase_select: string
  battle_phase_horizontal: string
  battle_phase_vertical: string
  battle_phase_charge: string
  battle_phase_resolving: string
  battle_phase_penalty: string
  battle_phase_turn_end: string
  battle_phase_rival: string
  battle_your_hand: string
  battle_no_tazos_hand: string
  battle_turn: string
  battle_turns_suffix: string
  battle_turn_complete: string
  battle_you: string
  battle_rival: string
  battle_log_title: string
  battle_log_empty: string
  battle_captured: string
  battle_captured_suffix: string

  // Aim
  aim_horizontal_title: string
  aim_horizontal_lock: string
  aim_vertical_title: string
  aim_vertical_lock: string
  aim_charge_title: string
  aim_charge_throw: string
  aim_left: string
  aim_center: string
  aim_right: string
  aim_top: string
  aim_bottom: string
  aim_accuracy: string
  aim_shrinking: string
  aim_growing: string
  aim_risk_high: string
  aim_risk_medium: string
  aim_risk_low: string

  // Result
  result_player: string
  result_opponent: string
  result_vs: string
  result_turns: string
  result_captures: string
  result_lost: string

  // Info cards
  info_aim_title: string
  info_aim_desc: string
  info_charge_title: string
  info_charge_desc: string
  info_capture_title: string
  info_capture_desc: string

  // Penalty
  penalty_place_tazo: string
  penalty_click_arena: string

  // Scanner
  scanner_upload: string
  scanner_detect: string
  scanner_scanning: string
  scanner_no_detection: string
  scanner_crop_title: string

  // Stats
  stats_total: string
  stats_owned: string
  stats_attack: string
  stats_defense: string
  stats_spin: string

  // Album filters
  album_search_placeholder: string
  album_filter_franchise: string
  album_filter_rarity: string
  album_filter_condition: string
  album_filter_owned: string
  album_filter_all: string
  album_sort_by: string
  album_sort_name: string
  album_sort_attack: string
  album_sort_defense: string
  album_sort_spin: string
  album_grid_compact: string
  album_grid_normal: string

  // Tazo detail
  tazo_attack: string
  tazo_defense: string
  tazo_spin: string
  tazo_weight: string
  tazo_resistance: string
  tazo_stability: string
  tazo_bounce: string
  tazo_precision: string
  tazo_role: string
  tazo_control: string
  tazo_close: string
  tazo_owned: string
  tazo_not_owned: string

  // Editor
  editor_name: string
  editor_franchise: string
  editor_rarity: string
  editor_condition: string
  editor_status: string
  editor_save: string

  // Download page
  download_title: string
  download_subtitle: string
  download_intro: string
  download_windows: string
  download_mac: string
  download_linux: string
  download_coming_soon: string
  download_version: string
  download_size: string
  download_cta: string
  download_also_web: string
  download_requirements: string
  download_requirements_list: string
  download_source: string
  download_source_desc: string

  // Common
  common_loading: string
  common_error: string
  common_retry: string
  common_all: string
  common_clear: string
  common_yes: string
  common_no: string
  common_cancel: string
  common_confirm_delete: string
  common_back: string
  common_and: string

  // Auth
  auth_login: string
  auth_login_subtitle: string
  auth_register: string
  auth_register_subtitle: string
  auth_email: string
  auth_password: string
  auth_name: string
  auth_name_placeholder: string
  auth_password_min: string
  auth_password_confirm: string
  auth_password_strength: string
  auth_password_strength_weak: string
  auth_password_strength_fair: string
  auth_password_strength_good: string
  auth_password_strength_strong: string
  auth_agree_terms_prefix: string
  auth_no_account: string
  auth_have_account: string
  auth_email_placeholder: string
  auth_oauth_divider: string
  auth_oauth_terms: string
  auth_terms: string
  auth_privacy: string
  auth_logout: string
  auth_my_collection: string
  auth_my_decks: string

  // Collection
  collection_title: string
  collection_empty: string
  collection_empty_cta: string
  collection_total: string

  // Decks
  decks_title: string
  decks_empty: string
  decks_create: string
  decks_name: string
  decks_name_placeholder: string
  decks_select_tazos: string
  decks_active: string
  decks_activate: string
  decks_delete: string
  decks_tazo_count: string
  decks_min_tazos: string
  // Shop / Bag system
  shop_title: string
  shop_login_cta: string
  shop_buy: string
shop_earn_title: string
  shop_earn_battles: string
  shop_earn_daily: string
  shop_earn_quests: string
  shop_earn_perfect: string
  shop_need_credits: string
  shop_opening: string
  shop_revealed: string
  shop_buy_another: string
  shop_view_collection: string
  shop_bag_standard: string
  shop_bag_premium: string
  shop_bag_mega: string
  shop_rare_boost: string
  shop_bonus_chance: string
  shop_tearing: string
  shop_revealing: string
  shop_dismiss: string
}
