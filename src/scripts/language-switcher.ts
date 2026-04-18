import {
  SUPPORTED_LANGUAGES,
  getLanguageFromStorage,
  setLanguageToStorage,
} from '../utils/language';

import { applyLanguageToPage } from '../utils/language';
import { resolveLanguage } from '../i18n';
import type { Language } from '../types/index';

function getCurrentPageLanguage(): string {
  const params = new URLSearchParams(window.location.search);
  const rawUrlLang = params.get('lang');
  const urlLang = rawUrlLang ? resolveLanguage(rawUrlLang) : '';

  const available = Array.from(document.querySelectorAll<HTMLElement>('[data-lang]'))
    .map((node) => node.dataset.lang)
    .filter((lang): lang is string => Boolean(lang));

  if (urlLang && available.includes(urlLang)) {
    return urlLang;
  }

  const stored = resolveLanguage(getLanguageFromStorage());
  if (available.includes(stored)) {
    return stored;
  }

  return urlLang || stored;
}

function updateChapterNavigation(lang: string) {
  const nav = document.getElementById('chapter-nav');
  if (!nav) return;

  const isRtl = document.documentElement.dir === 'rtl';
  // Keep logical order (prev → current → next). Let dir=rtl on the nav itself
  // flip the visual order via flex-row, so prev sits at start (right in RTL).
  nav.classList.remove('sm:flex-row-reverse');
  nav.classList.add('sm:flex-row');
  nav.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

  nav.querySelectorAll<HTMLElement>('[data-chapter-titles]').forEach((node) => {
    const raw = node.dataset.chapterTitles;
    if (!raw) return;

    try {
      const titles = JSON.parse(raw) as Record<string, string>;
      const text = titles[lang] ?? titles.he ?? titles.en ?? Object.values(titles)[0] ?? '';

      if (node.matches('a')) {
        const label = node.querySelector<HTMLElement>('.chapter-nav-label');
        if (label) label.textContent = text;
      } else {
        node.textContent = text;
      }
    } catch {
      // ignore malformed title payloads
    }
  });

  const prev = nav.querySelector<HTMLElement>('[data-nav="prev"]');
  const next = nav.querySelector<HTMLElement>('[data-nav="next"]');

  if (prev) {
    const arrow = prev.querySelector<HTMLElement>('.chapter-nav-arrow');
    if (arrow) {
      arrow.textContent = isRtl ? '→' : '←';
    }
  }

  if (next) {
    const arrow = next.querySelector<HTMLElement>('.chapter-nav-arrow');
    if (arrow) {
      arrow.textContent = isRtl ? '←' : '→';
    }
  }
}

/**
 * Switch content blocks by data-lang
 */
function switchLanguage(lang: string) {
  const targets = ['chapter-container', 'chapter-header', 'chapter-meta-bar', 'breadcrumb-container'];
  const langCodes = SUPPORTED_LANGUAGES.map(l => l.code);

  for (const id of targets) {
    const el = document.getElementById(id);
    if (!el) continue;

    for (const code of langCodes) {
      const block = el.querySelector<HTMLElement>(`[data-lang="${code}"]`);
      if (!block) continue;

      const isActive = code === lang;
      block.classList.toggle('hidden', !isActive);
      block.classList.toggle('visible', isActive);
    }
  }

  const meta = SUPPORTED_LANGUAGES.find(l => l.code === lang);
  const params = new URLSearchParams(window.location.search);

  if (params.get('lang') !== lang) {
    params.set('lang', lang);
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }

  document.documentElement.lang = lang;
  document.documentElement.dir = meta?.dir ?? 'ltr';

  applyLanguageToPage(lang as Language);
  updateChapterNavigation(lang);
  window.dispatchEvent(
    new CustomEvent('language-ui-sync', {
      detail: { language: lang },
      bubbles: true,
    })
  );
}

/**
 * Init language system
 */
export function initLanguageSwitcher(controller: AbortController) {
  const currentLanguage = getCurrentPageLanguage();

  const params = new URLSearchParams(window.location.search);
  if (params.get('lang') !== currentLanguage) {
    params.set('lang', currentLanguage);
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }

  setLanguageToStorage(currentLanguage as Language);
  switchLanguage(currentLanguage);

  window.addEventListener('language-changed', (event: Event) => {
    const rawLang = (event as CustomEvent<{ language: string }>).detail?.language;
    const lang = resolveLanguage(rawLang);

    setLanguageToStorage(lang as Language);
    switchLanguage(lang);
  }, { signal: controller.signal });
}