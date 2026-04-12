import { LANGUAGES, SUPPORTED_LANGUAGES, getLanguageFromStorage, setLanguageToStorage, isValidLanguage } from '../utils/language';
import type { Language } from '../types/index';

/**
 * Switch content to the selected language using data-lang attributes.
 * Shows only the matching [data-lang] block; hides all others.
 * Works for any number of languages — driven by SUPPORTED_LANGUAGES.
 */
function switchLanguage(lang: string) {
  const targets = ['chapter-container', 'chapter-header', 'chapter-meta-bar'];
  const langCodes = SUPPORTED_LANGUAGES.map(l => l.code);

  for (const id of targets) {
    const el = document.getElementById(id);
    if (!el) continue;

    for (const code of langCodes) {
      const block = el.querySelector<HTMLElement>(`:scope > [data-lang="${code}"]`);
      if (!block) continue;
      const isActive = code === lang;
      block.classList.toggle('hidden', !isActive);
      block.classList.toggle('visible', isActive);
    }
  }

  const meta = SUPPORTED_LANGUAGES.find(l => l.code === lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = meta?.dir ?? 'ltr';
}

/**
 * Initialize language switching from URL param or localStorage.
 * Listens for 'language-changed' custom events.
 */
export function initLanguageSwitcher(controller: AbortController) {
  const urlParams = new URLSearchParams(window.location.search);
  let currentLanguage = urlParams.get('lang');

  if (!currentLanguage || !isValidLanguage(currentLanguage)) {
    currentLanguage = getLanguageFromStorage() || LANGUAGES.EN;
  }

  setLanguageToStorage(currentLanguage as Language);
  switchLanguage(currentLanguage);

  window.addEventListener('language-changed', (event: Event) => {
    const lang = (event as CustomEvent<{ language: string }>).detail?.language;
    if (lang) {
      setLanguageToStorage(lang as Language);
      switchLanguage(lang);
    }
  }, { signal: controller.signal });
}
