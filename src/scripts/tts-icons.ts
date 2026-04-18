/**
 * TTS icon system — 2026 unified visual language.
 * All icons: 24×24 canvas, 1.75 stroke, rounded caps/joins, currentColor.
 * No fills, no gradients, no baked colors. Active state driven by parent class.
 */

export type IconName =
  | 'speaker'
  | 'play'
  | 'pause'
  | 'stop'
  | 'resume'
  | 'voice'
  | 'speed'
  | 'selectionStart'
  | 'close'
  | 'check'
  | 'preview';

/**
 * Icon path definitions. Each string is the inner SVG path markup
 * rendered inside a 24×24 viewBox.
 */
export const ICON_PATHS: Record<IconName, string> = {
  // Speaker cone + two concentric sound arcs
  speaker: `
    <path d="M4 9.5h3l5-3.5v12l-5-3.5H4v-5z" />
    <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M18 7a7 7 0 0 1 0 10" />
  `,
  // Rounded triangle — not sharp
  play: `
    <path d="M9 5.5v13a1 1 0 0 0 1.54.84l9.5-6.5a1 1 0 0 0 0-1.68l-9.5-6.5A1 1 0 0 0 9 5.5z" />
  `,
  // Two rounded bars
  pause: `
    <path d="M9.5 5.5v13" />
    <path d="M14.5 5.5v13" />
  `,
  // Single rounded square
  stop: `
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
  `,
  // Curved arrow (resume/continue glyph)
  resume: `
    <path d="M4 12a8 8 0 1 1 2.5 5.8" />
    <path d="M4 19v-4h4" />
    <path d="M11 9l5 3-5 3V9z" />
  `,
  // Microphone
  voice: `
    <rect x="9.5" y="3.5" width="5" height="10" rx="2.5" />
    <path d="M6 11.5a6 6 0 0 0 12 0" />
    <path d="M12 17.5v3" />
    <path d="M9 20.5h6" />
  `,
  // Gauge arc + needle
  speed: `
    <path d="M4 16a8 8 0 0 1 16 0" />
    <path d="M12 16l4-4" />
    <circle cx="12" cy="16" r="1" />
  `,
  // I-beam cursor with caret
  selectionStart: `
    <path d="M7 4h4" />
    <path d="M7 20h4" />
    <path d="M9 4v16" />
    <path d="M15 9l4 3-4 3" />
  `,
  // X
  close: `
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  `,
  // Checkmark
  check: `
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  `,
  // Mini preview (play inside speaker-like circle)
  preview: `
    <circle cx="12" cy="12" r="8" />
    <path d="M10.5 9.5v5l4-2.5-4-2.5z" />
  `,
};

export type IconSize = 16 | 18 | 20 | 22;

export function icon(name: IconName, size: IconSize = 20, extraClass = ''): string {
  const paths = ICON_PATHS[name];
  const cls = `tts-icon tts-icon-${name}${extraClass ? ' ' + extraClass : ''}`;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${paths.replace(/\s+/g, ' ').trim()}</svg>`;
}
