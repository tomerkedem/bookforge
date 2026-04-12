/**
 * i18n public API.
 *
 * Usage (Astro/TypeScript):
 *   import { t } from '../i18n';
 *   t('nav.books', lang)             // → "Books"
 *   t('nav.chapterOf', lang, { n: 3, total: 11 }) // → "Chapter 3 of 11"
 *
 * Usage (HTML):
 *   <span data-i18n="nav.books">Books</span>
 *   The applyLanguageToPage() function in language.ts handles DOM swapping.
 *
 * Adding a new language:
 *   1. Add to SUPPORTED_LANGUAGES in src/utils/language.ts
 *   2. Add translations to src/i18n/translations.ts
 *   Nothing else needs to change.
 */

import { translations } from './translations';

export type { Translations } from './translations';
export { translations } from './translations';

/**
 * Translate a key to the given language.
 * Falls back: requested lang → 'en' → key itself.
 * Supports {{param}} interpolation.
 */
export function t(
  key: string,
  lang: string,
  params?: Record<string, string | number>
): string {
  const entry = translations[key];
  if (!entry) return key;

  const text = entry[lang] ?? entry['en'] ?? key;
  if (!params) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`
  );
}

/**
 * Returns true if the language is RTL.
 * Decoupled from language.ts so scripts can import without bringing in DOM code.
 */
export function isRtlLang(lang: string): boolean {
  const RTL_LANGS = new Set(['he', 'ar', 'fa', 'ur', 'yi', 'dv']);
  return RTL_LANGS.has(lang);
}
