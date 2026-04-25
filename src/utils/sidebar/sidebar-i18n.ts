/**
 * Sidebar i18n.
 *
 * Two distinct paths:
 *   1. Per-chapter titles: stored as JSON on the [data-titles]
 *      attribute and swapped manually since they're not in the
 *      translation registry.
 *   2. Static UI strings: rendered with [data-i18n] keys and updated
 *      via the project-wide applyTranslations helper.
 */

import { getTitleFromDataset } from './sidebar-helpers';

/**
 * Re-render all sidebar text in the requested language. Called on
 * init, on chapter swap, and on language-changed events.
 *
 * The applyTranslations import is dynamic to keep this file
 * lightweight at module load — i18n is an async-friendly cross-cut,
 * not a hot path.
 */
export function updateSidebarText(lang: string): void {
  /* Per-chapter titles. The same selector covers desktop sidebar
     cards AND the mobile drawer's chapter list. */
  document
    .querySelectorAll<HTMLElement>('.usb-card-title-text[data-titles], .toc-chapter-title-text[data-titles]')
    .forEach((span) => {
      span.textContent = getTitleFromDataset(span, lang);
    });

  /* Static UI strings (header, completion suffix, "no sections"
     placeholder, mobile tabs). applyTranslations walks data-i18n
     attributes within the given subtree. */
  import('../../i18n').then(({ applyTranslations }) => {
    const sidebar = document.getElementById('unified-sidebar');
    const mobile = document.querySelector('.mobile-drawer');
    if (sidebar) applyTranslations(sidebar, lang);
    if (mobile) applyTranslations(mobile, lang);
  }).catch(() => {});
}