/**
 * Active-section tracking for the section list.
 *
 * IntersectionObserver watches the live h2/h3 elements of the active
 * chapter. As the reader scrolls, we recompute which heading is
 * "active" (closest to the top of the viewport, with a buffer zone)
 * and highlight the matching outline entry.
 *
 * State is module-level mutable on purpose: there's only ever one
 * sidebar instance, scroll-spy is a singleton concept, and exposing
 * setters everywhere would just add ceremony.
 */

let outlineSpyObserver: IntersectionObserver | null = null;
let outlineHeadingOrder: HTMLElement[] = [];
const outlineHeadingMap = new Map<string, HTMLElement>();
const outlineVisibleIds = new Set<string>();
let activeOutlineId: string | null = null;

/** Register an outline `<li>` for a heading id so scroll-spy knows
 *  which row to highlight. Render code calls this once per section. */
export function registerOutlineEntry(headingId: string, li: HTMLElement): void {
  outlineHeadingMap.set(headingId, li);
}

/** Drop all heading registrations. Called before re-rendering an
 *  outline so stale entries don't survive. */
export function clearOutlineRegistry(): void {
  outlineHeadingMap.clear();
}

/**
 * Highlight the given heading id as active in the outline. If the
 * sidebar is internally scrollable and the active row is offscreen,
 * scrolls the sidebar (not the page) to bring the row into view.
 */
export function setActiveOutlineItem(id: string | null): void {
  if (activeOutlineId === id) return;
  activeOutlineId = id;

  document.querySelectorAll('.usb-sections li.active, #mobile-chapter-outline li.active')
    .forEach(li => li.classList.remove('active'));

  if (!id) return;

  document.querySelectorAll(
    `.usb-sections li[data-heading-id="${id}"], #mobile-chapter-outline li[data-heading-id="${id}"]`,
  ).forEach(li => li.classList.add('active'));

  /* Auto-scroll the sidebar's own container so the active row stays
     visible during scroll-spy updates. We deliberately don't scroll
     the page — that would fight the user's actual scroll. */
  const sidebar = document.getElementById('unified-sidebar');
  const li = outlineHeadingMap.get(id);
  if (sidebar && li && sidebar.scrollHeight > sidebar.clientHeight) {
    const sRect = sidebar.getBoundingClientRect();
    const lRect = li.getBoundingClientRect();
    const margin = 60;
    if (lRect.top < sRect.top + margin) {
      sidebar.scrollTo({
        top: sidebar.scrollTop + (lRect.top - sRect.top) - margin,
        behavior: 'smooth',
      });
    } else if (lRect.bottom > sRect.bottom - margin) {
      sidebar.scrollTo({
        top: sidebar.scrollTop + (lRect.bottom - sRect.bottom) + margin,
        behavior: 'smooth',
      });
    }
  }
}

/**
 * Pick the most-active heading from current visibility info and
 * apply it. "Active zone" is the upper quarter of the viewport — a
 * heading activates as it crosses ~25% from the top, and stays
 * active until the next one arrives. If no headings are in the
 * active zone (e.g. the user is mid-section between two headings),
 * we fall back to the last one that has scrolled past the trigger.
 */
export function recomputeActiveOutline(): void {
  if (outlineHeadingOrder.length === 0) return;

  const firstVisible = outlineHeadingOrder.find(h => outlineVisibleIds.has(h.id));
  if (firstVisible) {
    setActiveOutlineItem(firstVisible.id);
    return;
  }

  const triggerY = window.innerHeight * 0.25;
  let candidate: HTMLElement | null = null;
  for (const h of outlineHeadingOrder) {
    const top = h.getBoundingClientRect().top;
    if (top <= triggerY) candidate = h;
    else break;
  }
  setActiveOutlineItem(candidate ? candidate.id : outlineHeadingOrder[0]?.id || null);
}

/**
 * (Re-)wire the IntersectionObserver to a new set of headings.
 * Disposes any previous observer first.
 *
 * The rootMargin "-15% 0px -60% 0px" defines an active band that
 * sits in the upper quarter of the viewport — once a heading scrolls
 * into that band it counts as visible. Out-of-band headings count as
 * not visible regardless of whether they're technically on screen.
 */
export function setupOutlineScrollSpy(headings: HTMLElement[]): void {
  if (outlineSpyObserver) {
    outlineSpyObserver.disconnect();
    outlineSpyObserver = null;
  }
  outlineVisibleIds.clear();
  outlineHeadingOrder = headings;
  activeOutlineId = null;

  if (!('IntersectionObserver' in window) || headings.length === 0) return;

  outlineSpyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = (entry.target as HTMLElement).id;
      if (!id) return;
      if (entry.isIntersecting) outlineVisibleIds.add(id);
      else outlineVisibleIds.delete(id);
    });
    recomputeActiveOutline();
  }, {
    rootMargin: '-15% 0px -60% 0px',
    threshold: 0,
  });

  headings.forEach(h => outlineSpyObserver!.observe(h));
  recomputeActiveOutline();
}

/** Read-only access to the currently-active outline id. Used by the
 *  mobile drawer builder so it can preselect the right row. */
export function getActiveOutlineId(): string | null {
  return activeOutlineId;
}