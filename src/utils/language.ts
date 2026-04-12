import type { Language, LanguageContext, LanguageMeta, LanguageName } from '../types/index';
import { t } from '../i18n';

export const LANGUAGES = {
  HE: 'he' as const,
  EN: 'en' as const,
  ES: 'es' as const,
} as const;

/**
 * Master list of supported languages.
 * To add a new language: append one entry here — nothing else changes.
 */
export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'he', label: 'עברית',   labelEn: 'Hebrew',  dir: 'rtl' },
  { code: 'en', label: 'English', labelEn: 'English', dir: 'ltr' },
  { code: 'es', label: 'Español', labelEn: 'Español', dir: 'ltr' },
];

export const DEFAULT_LANGUAGE: Language = LANGUAGES.EN;
const LANG_STORAGE_KEY = 'yuval_language';
const LANG_COOKIE_NAME = 'yuval-lang';

const VALID_CODES = new Set<string>(SUPPORTED_LANGUAGES.map(l => l.code));

/**
 * Get the metadata object for a language code
 */
export const getLanguageMeta = (lang: Language): LanguageMeta => {
  return SUPPORTED_LANGUAGES.find(l => l.code === lang) ?? SUPPORTED_LANGUAGES[1];
};

/**
 * Get language context with direction and alignment
 */
export const getLanguageContext = (lang: Language): LanguageContext => {
  const meta = getLanguageMeta(lang);
  return {
    current: lang,
    direction: meta.dir,
    textAlign: meta.dir === 'rtl' ? 'right' : 'left',
    label: meta.labelEn,
  };
};

/**
 * Get human-readable language label
 */
export const getLanguageLabel = (lang: Language): LanguageName => {
  return getLanguageMeta(lang).labelEn;
};

/**
 * Validate that a value is a supported Language code
 */
export const isValidLanguage = (lang: unknown): lang is Language => {
  return typeof lang === 'string' && VALID_CODES.has(lang);
};

/**
 * Generate storage key for language preference
 * Centralized to prevent duplication
 */
export const getStorageKey = (key: string): string => {
  return `yuval_${key}`;
};

/**
 * Get language from multiple sources: URL param, localStorage, cookie, default
 * Single source of truth for language detection
 */
export const getLanguageFromStorage = (): Language => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  // Priority 1: URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && isValidLanguage(urlLang)) {
    return urlLang as Language;
  }

  // Priority 2: localStorage
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored && isValidLanguage(stored)) {
    return stored as Language;
  }

  // Priority 3: cookie (for server-side support)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === LANG_COOKIE_NAME && value && isValidLanguage(value)) {
      return value as Language;
    }
  }

  // Fallback to default
  return DEFAULT_LANGUAGE;
};

/**
 * Set language to localStorage AND update document attributes
 * Single function to handle all language updates
 */
export const setLanguageToStorage = (lang: Language): void => {
  if (typeof window === 'undefined') return;

  // Save to localStorage
  localStorage.setItem(LANG_STORAGE_KEY, lang);

  // Save to cookie (yuval-lang as specified in acceptance criteria)
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  document.cookie = `${LANG_COOKIE_NAME}=${lang}; expires=${expiryDate.toUTCString()}; path=/`;

  // Update document attributes
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === LANGUAGES.HE ? 'rtl' : 'ltr';
};

/**
 * Apply language to page.
 *
 * Handles two systems:
 *
 * 1. NEW — data-i18n="key"
 *    Looks up the key in the central translations registry.
 *    Works for any number of languages with no HTML changes.
 *
 * 2. LEGACY — data-he / data-en / data-es (kept for dynamic content like book/chapter titles)
 *    Falls back to data-en, then data-he for missing translations.
 *    Single-lang elements are shown/hidden.
 */
export const applyLanguageToPage = (lang: Language): void => {
  // ── 1. New i18n system ──────────────────────────────────────────────────────
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')!;
    el.textContent = t(key, lang);
  });

  // ── 2. Legacy data-{lang} system (dynamic content) ──────────────────────────
  const allLangCodes = SUPPORTED_LANGUAGES.map(l => l.code);

  document.querySelectorAll('[data-he], [data-en], [data-es]').forEach(el => {
    const values: Partial<Record<Language, string | null>> = {};
    allLangCodes.forEach(code => {
      values[code] = el.getAttribute(`data-${code}`);
    });

    const hasMultiple = allLangCodes.filter(code => values[code] !== null).length > 1;
    if (hasMultiple) {
      const text = values[lang] ?? values['en'] ?? values['he'] ?? null;
      if (text !== null) el.textContent = text;
    } else {
      const ownLang = allLangCodes.find(code => values[code] !== null);
      if (ownLang) {
        (el as HTMLElement).classList.toggle('hidden', ownLang !== lang);
      }
    }
  });

  setLanguageToStorage(lang);
};

/**
 * Initialize language on page load
 * Handles all aspects of initial language setup
 */
export const initializeLanguage = (): Language => {
  const lang = getLanguageFromStorage();
  applyLanguageToPage(lang);
  return lang;
};

/**
 * Dispatch language changed event for all components to listen to
 * Standard way to notify app of language changes
 */
export const dispatchLanguageChangeEvent = (lang: Language): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('language-changed', {
        detail: { language: lang },
        bubbles: true,
      })
    );
  }
};

/**
 * Listen for language changes with automatic cleanup
 * Returns cleanup function
 */
export const onLanguageChange = (
  callback: (lang: Language) => void,
  signal?: AbortSignal
): void => {
  if (typeof window === 'undefined') return;

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ language: Language }>;
    callback(customEvent.detail.language);
  };

  window.addEventListener('language-changed', handler, { signal });
};
