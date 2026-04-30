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

const FALLBACK_LANGUAGE = SOURCE_LANGUAGE;

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
  key: string,
  lang: string,
  params?: Record<string, string | number>
): string {
  const resolvedLang = resolveLanguage(lang);
  const entry = translations[key];

  if (!entry) {
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

  const textNodes = root.querySelectorAll<HTMLElement>('[data-i18n]');
  textNodes.forEach(node => {
    const key = node.dataset.i18n;
    if (!key) return;
    node.textContent = t(key, resolvedLang);
  });

  const titleNodes = root.querySelectorAll<HTMLElement>('[data-i18n-title]');
  titleNodes.forEach(node => {
    const key = node.dataset.i18nTitle;
    if (!key) return;
    node.title = t(key, resolvedLang);
  });

  const ariaNodes = root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]');
  ariaNodes.forEach(node => {
    const key = node.dataset.i18nAriaLabel;
    if (!key) return;
    node.setAttribute('aria-label', t(key, resolvedLang));
  });
}