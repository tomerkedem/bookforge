/**
 * Mobile drawer logic. Bottom sheet with two tabs:
 *   - "In This Chapter" (outline of current chapter's headings)
 *   - "Chapters" (full chapter list)
 *
 * Triggered by a FAB defined in the Astro template. We expose a
 * single init function that wires everything up; the rest is
 * internal.
 *
 * The mobile UI is intentionally separate from the desktop sidebar
 * because the two have different layouts and different UX patterns
 * (drawer vs. always-visible rail). They share the same data
 * sources but render independently.
 */

import { getCurrentLang, getVisibleContentDiv } from './sidebar-helpers';
import { getActiveOutlineId } from './sidebar-outline';
import { loadChapterContent } from './sidebar-navigation';

let drawerInitialized = false;

/** Build the mobile outline list from the current chapter's
 *  headings. Called every time the drawer opens so it always shows
 *  fresh data. */
export function buildMobileOutline(): void {
  const mobileOutline = document.getElementById('mobile-chapter-outline');
  if (!mobileOutline) return;
  const ul = mobileOutline.querySelector('ul');
  if (!ul) return;
  ul.innerHTML = '';

  const contentDiv = getVisibleContentDiv();
  if (!contentDiv) return;

  const headings = Array.from(contentDiv.querySelectorAll('h2, h3')) as HTMLElement[];
  if (headings.length === 0) {
    const li = document.createElement('li');
    li.style.color = '#ccc';
    li.style.fontSize = '12px';
    li.setAttribute('data-i18n', 'sidebar.noSectionsFound');
    const lang = getCurrentLang();
    li.textContent = lang === 'he' ? 'לא נמצאו סעיפים' : 'No sections found';
    ul.appendChild(li);
    return;
  }

  const activeId = getActiveOutlineId();

  headings.forEach((heading, i) => {
    const level = heading.tagName.toLowerCase();
    const text = heading.textContent?.trim() || `Section ${i + 1}`;
    const id = heading.id || `section-${i}`;
    if (!heading.id) heading.id = id;

    const li = document.createElement('li');
    li.setAttribute('data-level', level);
    li.setAttribute('data-heading-id', id);
    if (id === activeId) li.classList.add('active');

    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = text;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    li.appendChild(link);
    ul.appendChild(li);
  });
}

/** Close the mobile drawer + restore body scroll. Safe to call when
 *  the drawer is already closed. */
export function closeDrawer(): void {
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  const btn = document.getElementById('mobile-toc-toggle');
  drawer?.classList.remove('open');
  overlay?.classList.remove('active');
  btn?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/**
 * Wire up the mobile drawer FAB, overlay, tab buttons, and chapter
 * link click handlers. Idempotent — guarded by `drawerInitialized`,
 * so re-init paths (e.g. astro:after-swap) don't re-bind handlers.
 */
export function initMobileToc(): void {
  if (drawerInitialized) return;

  const btn = document.getElementById('mobile-toc-toggle');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  const drawer = document.getElementById('mobile-drawer');
  if (!btn || !overlay || !drawer) return;

  drawerInitialized = true;

  function openDrawer(): void {
    buildMobileOutline();
    drawer!.classList.add('open');
    overlay!.classList.add('active');
    btn!.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) closeDrawer();
    else openDrawer();
  });

  overlay.addEventListener('click', closeDrawer);

  drawer.querySelectorAll<HTMLElement>('.mobile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      drawer.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
      drawer.querySelectorAll('.mobile-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');

      const panel = target === 'outline'
        ? document.getElementById('mobile-outline-panel')
        : document.getElementById('mobile-chapters-panel');

      panel?.classList.add('active');
    });
  });

  drawer.querySelectorAll<HTMLAnchorElement>('a.mobile-toc-link').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      closeDrawer();
      const url = link.getAttribute('href')?.split('?')[0] || '';
      await loadChapterContent(url);
    });
  });
}

/** Re-arm the init guard after a chapter swap so initMobileToc()
 *  can rebind to the freshly-rendered drawer DOM. Called by the
 *  sidebar-init module on astro:after-swap. */
export function resetMobileInitGuard(): void {
  drawerInitialized = false;
}