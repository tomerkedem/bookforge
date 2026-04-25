/**
 * Constants used by the unified chapter sidebar.
 *
 * Tweak these to adjust reading-time estimates or auto-completion
 * behavior across the sidebar without hunting through the rendering
 * code.
 */

/**
 * Reading speed (words per minute) per UI language. Hebrew readers
 * trend slower than English; the gap shrinks for technical material
 * but stays meaningful enough to justify per-language values.
 *
 * If we add telemetry later we can tune these per user; for now
 * locked at sane defaults.
 */
export const WPM_BY_LANG: Record<string, number> = {
  he: 180,
  en: 220,
  es: 200,
};

/** Fallback WPM when the current language isn't in WPM_BY_LANG. */
export const DEFAULT_WPM = 200;

/**
 * Page-scroll percentage at which a chapter automatically flips to
 * "completed". Per spec this is the only trigger — there is no
 * time-on-page requirement.
 */
export const AUTO_COMPLETE_THRESHOLD = 95;

/**
 * UI language codes the sidebar recognizes for visibility toggling.
 * data-lang attributes carrying values outside this set are ignored
 * (those values name code-block syntax dialects like "bash" or
 * "python", not UI languages).
 */
export const KNOWN_UI_LANGS = new Set(['he', 'en', 'es']);