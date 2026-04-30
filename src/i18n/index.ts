/**
 * i18n public API.
 *
 * Rules:
 * - Language metadata comes from src/utils/language.ts
 * - UI text falls back to English
 * - Missing key falls back to the key itself
 * - No hardcoded RTL language list here
 */

import { translations } from './translations';
import { getSupportedLanguage, getLanguageDirection, SOURCE_LANGUAGE } from '../utils/language';

export type { Translations } from './translations';
export { translations } from './translations';

/**
 * Union of every defined translation key.
 *
 * Use this type wherever a key is passed to t()/tr() so a typo or a
 * key that was never added to translations.ts becomes a TypeScript
 * error at the call site, not a raw `highlight.title` leaking to the UI.
 *
 * For genuinely dynamic keys (template-literal or value-from-a-typed
 * union), TS infers the literal type and it just works. For keys read
 * from an `as const` array of label strings, the inference also flows
 * through. Only escape-hatch with `as TranslationKey` when truly needed.
 */
export type TranslationKey = keyof typeof translations;

const FALLBACK_LANGUAGE = SOURCE_LANGUAGE;

/**
 * Dev-only: warn once per missing key. The Set keeps the console clean
 * across re-renders/hot-reloads. In production this whole branch is
 * dead-code-eliminated by Vite (`import.meta.env.DEV` is statically
 * `false`), so there is zero runtime cost in the shipped bundle.
 */
const warnedMissingKeys = new Set<string>();

function normalizeLang(lang: string | null | undefined): string {
  return (lang || '').trim().toLowerCase();
}

export function resolveLanguage(lang: string | null | undefined): string {
  const normalized = normalizeLang(lang);

  if (!normalized) {
    return FALLBACK_LANGUAGE;
  }

  const supported = getSupportedLanguage(normalized);
  if (supported) {
    return supported.code;
  }

  return FALLBACK_LANGUAGE;
}

/**
 * Translate a key to the given language.
 * Falls back: requested lang -> en -> key itself.
 * Supports {{param}} interpolation.
 */
export function t(
  key: TranslationKey,
  lang: string,
  params?: Record<string, string | number>
): string {
  const resolvedLang = resolveLanguage(lang);
  const entry = translations[key];

  if (!entry) {
    if (import.meta.env.DEV && !warnedMissingKeys.has(key)) {
      warnedMissingKeys.add(key);
      console.warn(`[i18n] missing translation key: "${key}"`);
    }
    return key;
  }

  let text = entry[resolvedLang] ?? entry[FALLBACK_LANGUAGE] ?? key;

  if (!params) {
    return text;
  }

  return text.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`
  );
}

/**
 * Returns the writing direction for the resolved language.
 * Delegates to the central language registry.
 */
export function getI18nDirection(lang: string): 'ltr' | 'rtl' {
  return getLanguageDirection(resolveLanguage(lang));
}

/**
 * Backward-compatible alias.
 * Prefer getI18nDirection() in new code.
 */
export function isRtlLang(lang: string): boolean {
  return getI18nDirection(lang) === 'rtl';
}

/**
 * Apply translations to DOM nodes marked with:
 * - data-i18n="key"            → textContent
 * - data-i18n-title="key"      → title attribute
 * - data-i18n-aria-label="key" → aria-label attribute
 */
export function applyTranslations(root: ParentNode, lang: string): void {
  const resolvedLang = resolveLanguage(lang);

  // DOM boundary: keys arrive as raw strings from data-* attributes
  // authored in .astro templates. We can't statically verify them, so
  // we cast and rely on the runtime warn in t() to surface typos
  // during dev. Production behavior is unchanged: missing key -> key.
  const textNodes = root.querySelectorAll<HTMLElement>('[data-i18n]');
  textNodes.forEach(node => {
    const key = node.dataset.i18n;
    if (!key) return;
    node.textContent = t(key as TranslationKey, resolvedLang);
  });

  const titleNodes = root.querySelectorAll<HTMLElement>('[data-i18n-title]');
  titleNodes.forEach(node => {
    const key = node.dataset.i18nTitle;
    if (!key) return;
    node.title = t(key as TranslationKey, resolvedLang);
  });

  const ariaNodes = root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]');
  ariaNodes.forEach(node => {
    const key = node.dataset.i18nAriaLabel;
    if (!key) return;
    node.setAttribute('aria-label', t(key as TranslationKey, resolvedLang));
  });
}