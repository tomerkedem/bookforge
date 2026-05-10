/**
 * Knowledge Universe — series mode interactions.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Series mode responsibility (this module)                       │
 *   │   • Click on a series capsule → enterSeriesMode(name):         │
 *   │       - mute every other galaxy-card (faded, pointer-events:0) │
 *   │       - hide the active series's own capsule                   │
 *   │       - reveal the active series's members in a horizontal     │
 *   │         carousel (CSS reads is-active-series-member class)     │
 *   │       - inject one "Other Knowledge" capsule that exits on     │
 *   │         click and shows the count of items outside the series. │
 *   │   • Click on Other Knowledge → exitSeriesMode().               │
 *   │   • Esc → exitSeriesMode (only when no card is click-to-       │
 *   │     centered; the layout module owns Esc-to-close-focus first).│
 *   │   • Keyboard activation (Enter / Space) on capsules.           │
 *   │   • Pure class/attribute toggles + a single synthesized DOM    │
 *   │     node for Other Knowledge. No reading data, no navigation.  │
 *   └────────────────────────────────────────────────────────────────┘
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Coordination with universe-layout.ts                           │
 *   │   • This module's click handler MUST run BEFORE the layout     │
 *   │     module's card-click handler so it can intercept capsule    │
 *   │     and Other-Knowledge clicks before they reach openCenter.   │
 *   │     Both register capture-phase listeners on the same stage    │
 *   │     element; registration order = firing order, so this module │
 *   │     must be initialised first by the orchestrator in           │
 *   │     library.astro.                                             │
 *   │   • This handler uses stopImmediatePropagation() — that stops  │
 *   │     same-node capture handlers (i.e. the layout module's       │
 *   │     handler) from firing on intercepted clicks. Defensive: the │
 *   │     layout module also early-returns on cards with a data-role.│
 *   └────────────────────────────────────────────────────────────────┘
 */

import type { UniverseState } from './universe-series-hydrator';
import { cssEscape } from './universe-angle-utils';

/**
 * Public handle returned by `initSeriesMode`, letting other modules
 * drive the orbit's series-mode without duplicating the click /
 * keyboard wiring. The "Show / Hide series items" buttons in the
 * focused-capsule action panel call these handles to filter the
 * orbit to a single series's members — the same visual state a
 * direct click on a series capsule produces.
 */
export interface SeriesModeHandle {
  enter(seriesName: string): void;
  exit(): void;
  /** Currently-active series name, or null when not in series mode. */
  active(): string | null;
}

export function initSeriesMode(
  stage: HTMLElement,
  state: UniverseState,
): SeriesModeHandle {
  const { slugSet, seriesAvailable, labels, isHidden } = state;

  let activeSeriesName: string | null = null;

  function enterSeriesMode(seriesName: string): void {
    if (activeSeriesName === seriesName) return;
    if (activeSeriesName) exitSeriesMode();
    // Force-clear any Other Knowledge node still mid-fade-out from a
    // previous exit before we add a new one.
    stage
      .querySelectorAll<HTMLElement>('.galaxy-card[data-role="other-knowledge"]')
      .forEach(el => el.remove());
    activeSeriesName = seriesName;

    const members = Array.from(
      stage.querySelectorAll<HTMLElement>(
        `.galaxy-card[data-series-member="${cssEscape(seriesName)}"]`,
      ),
    );
    const totalMembers = members.length;
    members.forEach((card, i) => {
      card.classList.add('is-active-series-member');
      card.style.setProperty('--series-active-index', String(i));
      card.style.setProperty('--series-active-total', String(totalMembers));
    });

    // Hide the active series's own capsule — its books are now shown
    // individually as the carousel.
    const activeCapsule = stage.querySelector<HTMLElement>(
      `.galaxy-card[data-role="series"][data-series-capsule="${cssEscape(seriesName)}"]`,
    );
    if (activeCapsule) activeCapsule.classList.add('is-active-series-capsule');

    // Mute everything that is NOT a member of the active series and
    // NOT the freshly-injected Other Knowledge capsule.
    stage
      .querySelectorAll<HTMLElement>('.galaxy-card:not([data-series-member])')
      .forEach(card => {
        if (card.classList.contains('is-active-series-capsule')) return;
        card.classList.add('is-muted');
      });

    // Other Knowledge count = visible items in universe minus active
    // series members. seriesAvailable already excludes hidden items.
    let visibleTotal = 0;
    slugSet.forEach(slug => {
      if (!isHidden(slug)) visibleTotal++;
    });
    const otherCount = Math.max(
      0,
      visibleTotal - (seriesAvailable.get(seriesName) || 0),
    );
    const ok = buildOtherKnowledgeCard(otherCount, labels);
    stage.appendChild(ok);
    // Two-frame fade-in: opacity 0 in initial style → 1 next frame.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ok.classList.add('is-visible');
      });
    });

    stage.dataset.stageMode = 'series';
    stage.dataset.activeSeries = seriesName;
  }

  function exitSeriesMode(): void {
    if (!activeSeriesName) return;
    activeSeriesName = null;

    // Fade out Other Knowledge and remove after transition.
    const ok = stage.querySelector<HTMLElement>(
      '.galaxy-card[data-role="other-knowledge"]',
    );
    if (ok) {
      ok.classList.remove('is-visible');
      ok.addEventListener(
        'transitionend',
        () => ok.remove(),
        { once: true },
      );
      // Safety fallback in case transitionend is missed (e.g. reduced
      // motion or display:none mid-transition).
      window.setTimeout(() => {
        if (ok.isConnected) ok.remove();
      }, 600);
    }

    // Restore class state on every card.
    stage
      .querySelectorAll<HTMLElement>('.is-active-series-member')
      .forEach(card => {
        card.classList.remove('is-active-series-member');
        card.style.removeProperty('--series-active-index');
        card.style.removeProperty('--series-active-total');
      });
    stage
      .querySelectorAll<HTMLElement>('.is-active-series-capsule')
      .forEach(card => card.classList.remove('is-active-series-capsule'));
    stage
      .querySelectorAll<HTMLElement>('.is-muted')
      .forEach(card => card.classList.remove('is-muted'));

    delete stage.dataset.stageMode;
    delete stage.dataset.activeSeries;
  }

  // Click handler — capture phase. MUST be registered before the
  // layout module's card-click handler. Series capsules and Other
  // Knowledge swallow the click via stopImmediatePropagation so they
  // never reach openCenter on the same node.
  stage.addEventListener(
    'click',
    e => {
      const target = e.target as Element | null;
      if (!target) return;

      const seriesCapsule = target.closest<HTMLElement>(
        '.galaxy-card[data-role="series"]',
      );
      if (seriesCapsule) {
        const sn = seriesCapsule.dataset.seriesCapsule;
        if (sn) {
          e.preventDefault();
          e.stopImmediatePropagation();
          enterSeriesMode(sn);
        }
        return;
      }

      const ok = target.closest<HTMLElement>(
        '.galaxy-card[data-role="other-knowledge"]',
      );
      if (ok) {
        e.preventDefault();
        e.stopImmediatePropagation();
        exitSeriesMode();
        return;
      }
    },
    true,
  );

  // Keyboard activation for role="button" capsules. Enter dispatches a
  // synthetic click on most elements; Space does not, so handle both.
  stage.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as Element | null;
    if (!target) return;

    const seriesCapsule = target.closest<HTMLElement>(
      '.galaxy-card[data-role="series"]',
    );
    if (seriesCapsule) {
      const sn = seriesCapsule.dataset.seriesCapsule;
      if (sn) {
        e.preventDefault();
        enterSeriesMode(sn);
      }
      return;
    }

    const ok = target.closest<HTMLElement>(
      '.galaxy-card[data-role="other-knowledge"]',
    );
    if (ok) {
      e.preventDefault();
      exitSeriesMode();
    }
  });

  // Esc exits series mode — but only when no card is click-to-centered.
  // The layout module's Esc handler closes the focused card first; a
  // second Esc press lands here and exits the series. The shared signal
  // is `stage.dataset.galaxyFocused`, set by the layout module.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!activeSeriesName) return;
    if (stage.dataset.galaxyFocused === 'true') return;
    exitSeriesMode();
  });

  return {
    enter: enterSeriesMode,
    exit: exitSeriesMode,
    active: () => activeSeriesName,
  };
}

/**
 * Build the synthesized "Other Knowledge" pill that appears in series
 * mode. Carries [data-galaxy-card] so it counts as a real station for
 * the layout module's getStep(); carries [data-role="other-knowledge"]
 * so the layout module's card-click handler skips it (this module owns
 * its click).
 */
function buildOtherKnowledgeCard(itemCount: number, labels: UniverseState['labels']): HTMLElement {
  const card = document.createElement('div');
  card.className = 'galaxy-card';
  // See note in buildSeriesCapsuleCard — getStep() needs this attribute.
  card.setAttribute('data-galaxy-card', '');
  card.dataset.role = 'other-knowledge';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${labels.otherKnowledgeLabel} — ${labels.closeLabel}`);

  const inner = document.createElement('div');
  inner.className = 'galaxy-other-knowledge';

  const icon = document.createElement('span');
  icon.className = 'galaxy-other-knowledge-icon';
  icon.setAttribute('aria-hidden', 'true');
  // Three-dot glyph — reads as "more / collection".
  icon.textContent = '⋯';
  inner.appendChild(icon);

  const text = document.createElement('div');
  text.className = 'galaxy-other-knowledge-text';

  const label = document.createElement('span');
  label.className = 'galaxy-other-knowledge-label';
  label.textContent = labels.otherKnowledgeLabel;
  text.appendChild(label);

  const count = document.createElement('span');
  count.className = 'galaxy-other-knowledge-count';
  const countNum = document.createElement('strong');
  countNum.textContent = String(itemCount);
  count.append(countNum, document.createTextNode(' ' + labels.itemsShortLabel));
  text.appendChild(count);

  inner.appendChild(text);
  card.appendChild(inner);
  return card;
}
