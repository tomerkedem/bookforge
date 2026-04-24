/**
 * Image lightbox — click any image inside .reading-content to open a
 * fullscreen zoomed view with prev/next navigation across all images
 * in the currently active language content.
 */

import { t } from '../i18n';
import { getLang } from './reading-location';

let lightboxEl: HTMLElement | null = null;
let currentIdx = 0;
let currentImages: HTMLImageElement[] = [];
let lastFocused: HTMLElement | null = null;
let stylesInjected = false;

const FILENAME_ALT = /^image[-_]?\d+\.(png|jpe?g|webp|svg|gif|avif)$/i;

/** Any image matching this selector is clickable-to-zoom. */
const ZOOM_SELECTOR = '.reading-content img, .book-cover-img';

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'yuval-lightbox-styles';
  style.textContent = `
    .reading-content img,
    .book-cover-img { cursor: zoom-in; }

    .img-lightbox {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .img-lightbox.is-open {
      display: flex;
      animation: lbFadeIn 200ms ease-out;
    }

    .img-lightbox-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(10, 8, 4, 0.86);
      -webkit-backdrop-filter: blur(14px);
      backdrop-filter: blur(14px);
      cursor: zoom-out;
    }

    .img-lightbox-figure {
      position: relative;
      z-index: 1;
      max-width: 94vw;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      animation: lbZoomIn 280ms cubic-bezier(0.2, 0, 0, 1);
      pointer-events: none;
    }

    .img-lightbox-img {
      max-width: 94vw;
      max-height: 82vh;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 12px;
      background: #fff;
      box-shadow:
        0 14px 40px rgba(0, 0, 0, 0.55),
        0 0 0 1px rgba(201, 162, 39, 0.45),
        0 0 30px rgba(201, 162, 39, 0.18);
      pointer-events: auto;
      cursor: zoom-out;
    }

    .img-lightbox-caption {
      color: rgba(255, 255, 255, 0.88);
      font-size: 0.92rem;
      max-width: 70ch;
      text-align: center;
      font-family: var(--reading-font-family, inherit);
      line-height: 1.4;
      pointer-events: auto;
    }
    .img-lightbox-caption:empty { display: none; }

    .img-lightbox-btn {
      position: absolute;
      z-index: 2;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(145deg, #c9a227, #ddb52f);
      color: #fff;
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
      border: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.45),
        0 0 0 1px rgba(232, 197, 71, 0.5),
        inset 0 1px 1.5px rgba(255, 255, 255, 0.3);
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
    .img-lightbox-btn:hover {
      box-shadow:
        0 6px 20px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(232, 197, 71, 0.65),
        0 0 24px rgba(232, 197, 71, 0.35),
        inset 0 1px 1.5px rgba(255, 255, 255, 0.4);
    }
    .img-lightbox-btn:focus-visible {
      outline: 2px solid #e8c547;
      outline-offset: 3px;
    }

    .img-lightbox-close { top: 22px; inset-inline-end: 22px; }
    .img-lightbox-close:hover { transform: scale(1.08) rotate(90deg); }

    .img-lightbox-prev,
    .img-lightbox-next {
      top: 50%;
      transform: translateY(-50%);
    }
    .img-lightbox-prev { inset-inline-start: 22px; }
    .img-lightbox-next { inset-inline-end: 22px; }
    .img-lightbox-prev:hover,
    .img-lightbox-next:hover { transform: translateY(-50%) scale(1.1); }

    .img-lightbox-counter {
      position: absolute;
      bottom: 22px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      color: #e8c547;
      font-size: 0.82rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.08em;
      padding: 6px 16px;
      border-radius: 99px;
      background: rgba(0, 0, 0, 0.45);
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
      box-shadow: inset 0 0 0 1px rgba(201, 162, 39, 0.35);
      direction: ltr;
      unicode-bidi: isolate;
    }
    .img-lightbox-counter:empty { display: none; }

    @keyframes lbFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes lbZoomIn {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .img-lightbox.is-open,
      .img-lightbox-figure {
        animation: none;
      }
      .img-lightbox-btn { transition: none; }
    }

    @media (max-width: 640px) {
      .img-lightbox-btn {
        width: 38px;
        height: 38px;
        font-size: 19px;
      }
      .img-lightbox-close { top: 12px; inset-inline-end: 12px; }
      .img-lightbox-prev  { inset-inline-start: 8px; }
      .img-lightbox-next  { inset-inline-end: 8px; }
      .img-lightbox-img   { max-height: 78vh; border-radius: 10px; }
    }
  `;
  document.head.appendChild(style);
}

function ensureLightbox(): HTMLElement {
  if (lightboxEl && document.body.contains(lightboxEl)) return lightboxEl;
  injectStyles();

  const lang = getLang();
  const box = document.createElement('div');
  box.className = 'img-lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = `
    <div class="img-lightbox-backdrop" data-close="1"></div>
    <button class="img-lightbox-btn img-lightbox-prev" type="button"
            aria-label="${t('lightbox.prev', lang)}">‹</button>
    <button class="img-lightbox-btn img-lightbox-next" type="button"
            aria-label="${t('lightbox.next', lang)}">›</button>
    <button class="img-lightbox-btn img-lightbox-close" type="button"
            aria-label="${t('lightbox.close', lang)}">×</button>
    <figure class="img-lightbox-figure">
      <img class="img-lightbox-img" alt="" />
      <figcaption class="img-lightbox-caption"></figcaption>
    </figure>
    <div class="img-lightbox-counter" aria-live="polite"></div>
  `;

  box.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.dataset.close === '1') { closeLightbox(); return; }
    if (target.closest('.img-lightbox-close')) { closeLightbox(); return; }
    if (target.closest('.img-lightbox-prev'))  { navigate(-1); return; }
    if (target.closest('.img-lightbox-next'))  { navigate(1);  return; }
    if (target.classList.contains('img-lightbox-img')) { closeLightbox(); return; }
  });

  document.body.appendChild(box);
  lightboxEl = box;
  return box;
}

function collectImages(clicked: HTMLImageElement): HTMLImageElement[] {
  // Chapter reading view: cycle through all images in the active language.
  const chapterContainer = document.getElementById('chapter-container');
  if (chapterContainer && clicked.closest('.reading-content')) {
    const activeLang = chapterContainer.querySelector<HTMLElement>('[data-lang]:not(.hidden)')
      || chapterContainer.querySelector<HTMLElement>('[data-lang]')
      || chapterContainer;
    return Array.from(activeLang.querySelectorAll<HTMLImageElement>('img'));
  }
  // Book-detail cover: single image, no cycling.
  return [clicked];
}

function render() {
  const img = currentImages[currentIdx];
  if (!img || !lightboxEl) return;
  const lbImg = lightboxEl.querySelector<HTMLImageElement>('.img-lightbox-img');
  const cap   = lightboxEl.querySelector<HTMLElement>('.img-lightbox-caption');
  const cnt   = lightboxEl.querySelector<HTMLElement>('.img-lightbox-counter');
  if (!lbImg || !cap || !cnt) return;

  lbImg.src = img.currentSrc || img.src;
  lbImg.alt = img.alt || '';

  const isFilename = FILENAME_ALT.test(img.alt || '');
  cap.textContent = !isFilename && img.alt ? img.alt : '';

  cnt.textContent = currentImages.length > 1
    ? `${currentIdx + 1} / ${currentImages.length}`
    : '';

  // Hide prev/next when only one image
  const prev = lightboxEl.querySelector<HTMLElement>('.img-lightbox-prev');
  const next = lightboxEl.querySelector<HTMLElement>('.img-lightbox-next');
  const single = currentImages.length <= 1;
  if (prev) prev.style.display = single ? 'none' : '';
  if (next) next.style.display = single ? 'none' : '';
}

function openLightbox(img: HTMLImageElement) {
  const box = ensureLightbox();
  currentImages = collectImages(img);
  const idx = currentImages.indexOf(img);
  if (idx === -1) {
    currentImages = [img];
    currentIdx = 0;
  } else {
    currentIdx = idx;
  }

  lastFocused = document.activeElement as HTMLElement | null;
  render();
  box.classList.add('is-open');
  box.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Defer focus to the close button so Esc works immediately
  requestAnimationFrame(() => {
    box.querySelector<HTMLButtonElement>('.img-lightbox-close')?.focus();
  });
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('is-open');
  lightboxEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastFocused?.focus?.();
  lastFocused = null;
}

function navigate(dir: number) {
  if (currentImages.length < 2) return;
  currentIdx = (currentIdx + dir + currentImages.length) % currentImages.length;
  render();
}

function isOpen(): boolean {
  return !!lightboxEl?.classList.contains('is-open');
}

export function initImageLightbox(controller: AbortController) {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'IMG') return;
    const img = target as HTMLImageElement;
    if (!img.matches(ZOOM_SELECTOR)) return;
    e.preventDefault();
    openLightbox(img);
  };

  const onKey = (e: KeyboardEvent) => {
    if (!isOpen()) return;
    if (e.key === 'Escape')       { e.preventDefault(); closeLightbox(); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); navigate(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); }
  };

  document.addEventListener('click',   onClick, { signal: controller.signal });
  document.addEventListener('keydown', onKey,   { signal: controller.signal });
}
