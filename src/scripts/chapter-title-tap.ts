import { t, resolveLanguage } from '../i18n';

const MOBILE_MQ = '(max-width: 1023px)';

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || 'en'
  );
}

export function initChapterTitleTap(signal: AbortSignal): void {
  const block = document.getElementById('chapter-header');
  if (!block) return;

  const mq = window.matchMedia(MOBILE_MQ);

  function applyMobileAffordance(isMobile: boolean): void {
    if (!block) return;
    if (isMobile) {
      block.setAttribute('role', 'button');
      block.setAttribute('tabindex', '0');
      block.setAttribute('aria-label', t('chapter.scrollToTop', getLang()) || 'Scroll to top');
      block.classList.add('chapter-title-tap-enabled');
    } else {
      block.removeAttribute('role');
      block.removeAttribute('tabindex');
      block.removeAttribute('aria-label');
      block.classList.remove('chapter-title-tap-enabled');
    }
  }

  function scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onActivate(e: Event): void {
    if (!mq.matches) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('a, button, input, select, textarea')) return;
    if (e instanceof KeyboardEvent) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
    }
    scrollToTop();
  }

  applyMobileAffordance(mq.matches);

  block.addEventListener('click', onActivate, { signal });
  block.addEventListener('keydown', onActivate, { signal });

  const onChange = (e: MediaQueryListEvent) => applyMobileAffordance(e.matches);
  mq.addEventListener('change', onChange);
  signal.addEventListener('abort', () => mq.removeEventListener('change', onChange));
}
