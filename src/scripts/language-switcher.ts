import { LANGUAGES, getLanguageFromStorage, setLanguageToStorage, isValidLanguage } from '../utils/language';
import type { Language } from '../types/index';

/**
 * Switch content between Hebrew and English using data-lang attributes.
 * Targets chapter-container and chapter-header specifically.
 */
function switchLanguage(lang: string) {
  const targets = ['chapter-container', 'chapter-header'];

  for (const id of targets) {
    const el = document.getElementById(id);
    if (!el) continue;

    const he = el.querySelector(':scope > [data-lang="he"]');
    const en = el.querySelector(':scope > [data-lang="en"]');
    if (!he || !en) continue;

    const isHe = lang === 'he';
    he.classList.toggle('hidden', !isHe);
    he.classList.toggle('visible', isHe);
    en.classList.toggle('hidden', isHe);
    en.classList.toggle('visible', !isHe);
  }

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
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
