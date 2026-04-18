import type { Language, LanguageContext, LanguageMeta, LanguageName } from '../types/index';

/**
 * Master list of supported languages.
 * Add new languages here only.
 */
export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'he', label: 'עברית', labelEn: 'Hebrew', dir: 'rtl', locale: 'he-IL' },
  { code: 'en', label: 'English', labelEn: 'English', dir: 'ltr', locale: 'en-US' },
  { code: 'es', label: 'Español', labelEn: 'Spanish', dir: 'ltr', locale: 'es-ES' },
];

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

export const SOURCE_LANGUAGE: Language = 'he';
export const DEFAULT_LANGUAGE: Language = SOURCE_LANGUAGE;

const LANG_STORAGE_KEY = 'yuval_language';
const LANG_COOKIE_NAME = 'yuval-lang';

const VALID_CODES = new Set<string>(LANGUAGE_CODES);

/**
 * Constant map: LANGUAGES.EN -> 'en'
 */
export const LANGUAGES = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code.toUpperCase(), l.code])
) as Record<string, Language>;

/**
 * Get metadata for language
 */
export const getLanguageMeta = (lang: Language): LanguageMeta => {
  return SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];
};

/**
 * Resolve arbitrary string to a supported language metadata object
 */
export const getSupportedLanguage = (
  lang: string | null | undefined
): LanguageMeta | undefined => {
  const normalized = (lang || '').trim().toLowerCase();
  if (!normalized) return undefined;
  return SUPPORTED_LANGUAGES.find((l) => l.code === normalized);
};

/**
 * Get locale from metadata
 */
export const getLanguageLocale = (lang: Language): string => {
  return getLanguageMeta(lang).locale;
};

/**
 * Get direction only from metadata
 */
export const getLanguageDirection = (lang: Language): 'ltr' | 'rtl' => {
  return getLanguageMeta(lang).dir;
};

/**
 * Context helper
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
 * Label helper
 */
export const getLanguageLabel = (lang: Language): LanguageName => {
  return getLanguageMeta(lang).labelEn;
};

/**
 * Validate language
 */
export const isValidLanguage = (lang: unknown): lang is Language => {
  return typeof lang === 'string' && VALID_CODES.has(lang);
};

/**
 * Storage key helper
 */
export const getStorageKey = (key: string): string => {
  return `yuval_${key}`;
};

/**
 * Read language from storage
 */
export const getLanguageFromStorage = (): Language => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored && isValidLanguage(stored)) {
    return stored;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === LANG_COOKIE_NAME && value && isValidLanguage(value)) {
      return value;
    }
  }

  return DEFAULT_LANGUAGE;
};

/**
 * Persist language
 */
export const setLanguageToStorage = (lang: Language): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(LANG_STORAGE_KEY, lang);

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  document.cookie = `${LANG_COOKIE_NAME}=${lang}; expires=${expiryDate.toUTCString()}; path=/`;

  document.documentElement.lang = lang;
  document.documentElement.dir = getLanguageDirection(lang);
};

/**
 * Apply language globally
 */
export const applyLanguageToPage = (lang: Language): void => {
  setLanguageToStorage(lang);

  if (typeof document === 'undefined') {
    return;
  }

  void import('../i18n').then(({ applyTranslations }) => {
    applyTranslations(document, lang);
  });
};

/**
 * Init language
 */
export const initializeLanguage = (): Language => {
  const lang = getLanguageFromStorage();
  applyLanguageToPage(lang);
  return lang;
};

/**
 * Emit language change event
 */
export const dispatchLanguageChangeEvent = (lang: Language): void => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<{ language: Language }>('language-changed', {
      detail: { language: lang },
      bubbles: true,
    })
  );
};

/**
 * Listen to language change
 */
export const onLanguageChange = (
  callback: (lang: Language) => void,
  signal?: AbortSignal
): void => {
  if (typeof window === 'undefined') return;

  const handler = (e: Event): void => {
    const customEvent = e as CustomEvent<{ language: Language }>;
    callback(customEvent.detail.language);
  };

  window.addEventListener('language-changed', handler, { signal });
};