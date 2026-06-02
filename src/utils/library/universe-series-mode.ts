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
  // Coverflow carousel state is DOM-derived so this module's
  // chevrons / drag / click-to-focus work whether series mode was
  // entered through enterSeriesMode (clicking a series capsule) or
  // through applyCourseFilter in universe-series-actions.ts
  // (clicking the "Show series items" button on a focused course
  // card). Both paths add `.is-active-series-member` to the
  // relevant orbit cards and set `data-stage-mode="series"` on the
  // stage — that's our contract. The focused index lives on the
  // stage's dataset so it survives across calls and across modules.
  function getActiveMembers(): HTMLElement[] {
    if (stage.dataset.stageMode !== 'series') return [];
    return Array.from(
      stage.querySelectorAll<HTMLElement>(
        '.galaxy-card.is-active-series-member',
      ),
    );
  }
  function getFocusedMemberIndex(membersLen: number): number {
    if (membersLen <= 0) return 0;
    const raw = stage.dataset.seriesFocusedIndex;
    const n = Number(raw);
    if (Number.isFinite(n)) {
      return Math.max(0, Math.min(membersLen - 1, n));
    }
    // First entry — start in the middle so the carousel reads as
    // visually balanced rather than pushed against one edge.
    return Math.floor((membersLen - 1) / 2);
  }
  // Carousel chrome rendered statically in the SSR HTML (see
  // index.astro inside .library-galaxy). Looked up once on init;
  // CSS handles show/hide via [data-stage-mode="series"].
  const carouselPrevBtn = stage.querySelector<HTMLButtonElement>(
    '[data-series-carousel-nav="prev"]',
  );
  const carouselNextBtn = stage.querySelector<HTMLButtonElement>(
    '[data-series-carousel-nav="next"]',
  );
  const posCurrentEl = stage.querySelector<HTMLElement>(
    '[data-series-pos-current]',
  );
  const posTotalEl = stage.querySelector<HTMLElement>(
    '[data-series-pos-total]',
  );
  // Mobile bottom-nav series counter ("3 / 6"). It lives OUTSIDE the
  // stage (the fixed mobile nav sibling), so it's looked up on document
  // and mirrors the same focused/total values as the desktop pill above.
  const mobilePosCurrentEl = document.querySelector<HTMLElement>(
    '[data-series-mobile-pos-current]',
  );
  const mobilePosTotalEl = document.querySelector<HTMLElement>(
    '[data-series-mobile-pos-total]',
  );

  function refreshCarouselState(): void {
    const members = getActiveMembers();
    const focused = getFocusedMemberIndex(members.length);
    if (carouselPrevBtn) {
      const atStart = focused <= 0 || members.length === 0;
      carouselPrevBtn.disabled = atStart;
      carouselPrevBtn.setAttribute('aria-disabled', String(atStart));
    }
    if (carouselNextBtn) {
      const atEnd = focused >= members.length - 1 || members.length === 0;
      carouselNextBtn.disabled = atEnd;
      carouselNextBtn.setAttribute('aria-disabled', String(atEnd));
    }
    const currentText = String(members.length === 0 ? 0 : focused + 1);
    const totalText = String(members.length);
    if (posCurrentEl) {
      posCurrentEl.textContent = currentText;
    }
    if (posTotalEl) {
      posTotalEl.textContent = totalText;
    }
    if (mobilePosCurrentEl) {
      mobilePosCurrentEl.textContent = currentText;
    }
    if (mobilePosTotalEl) {
      mobilePosTotalEl.textContent = totalText;
    }
  }

  function setFocusedMemberIndex(idx: number): void {
    const members = getActiveMembers();
    if (!members.length) return;
    const clamped = Math.max(0, Math.min(members.length - 1, idx));
    stage.dataset.seriesFocusedIndex = String(clamped);
    members.forEach(card => {
      card.style.setProperty('--series-focused-index', String(clamped));
    });
    refreshCarouselState();
  }

  // Direct click handlers on the chevron buttons — not delegated
  // through the stage's capture-phase click listener below, so the
  // click path is independent of any other module's listener order.
  function onChevronClick(direction: -1 | 1): (e: MouseEvent) => void {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (stage.dataset.stageMode !== 'series') return;
      const members = getActiveMembers();
      if (!members.length) return;
      const current = getFocusedMemberIndex(members.length);
      setFocusedMemberIndex(current + direction);
    };
  }
  carouselPrevBtn?.addEventListener('click', onChevronClick(-1));
  carouselNextBtn?.addEventListener('click', onChevronClick(1));

  // Observe stage attribute changes so the chrome (chevron disabled
  // states, position pill) refreshes whenever series mode is
  // entered/exited by ANY module. Without this, applyCourseFilter
  // in universe-series-actions.ts would activate series mode and
  // populate members but leave our pill showing stale "1 / 0".
  const stateObserver = new MutationObserver(() => {
    if (stage.dataset.stageMode === 'series') {
      // First entry from another module: seed the focused index
      // and apply --series-focused-index to every member.
      const members = getActiveMembers();
      if (members.length > 0 && stage.dataset.seriesFocusedIndex === undefined) {
        const initial = Math.floor((members.length - 1) / 2);
        stage.dataset.seriesFocusedIndex = String(initial);
        members.forEach(card => {
          card.style.setProperty('--series-focused-index', String(initial));
        });
      }
    } else {
      // Series mode just exited — clear the persisted focus so the
      // next entry recomputes the middle index from scratch.
      delete stage.dataset.seriesFocusedIndex;
    }
    refreshCarouselState();
  });
  stateObserver.observe(stage, {
    attributes: true,
    attributeFilter: ['data-stage-mode'],
  });
  // Initial sync in case the stage already entered series mode
  // before this module finished wiring (rare but cheap to handle).
  refreshCarouselState();

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
    // Initial focused index = middle of the row, so a series of any
    // size opens visually balanced around the stage centre. Stored
    // on the stage dataset so getFocusedMemberIndex() picks it up.
    const initialFocus = Math.max(0, Math.floor((totalMembers - 1) / 2));
    stage.dataset.seriesFocusedIndex = String(initialFocus);
    members.forEach((card, i) => {
      card.classList.add('is-active-series-member');
      card.style.setProperty('--series-active-index', String(i));
      card.style.setProperty('--series-active-total', String(totalMembers));
      card.style.setProperty('--series-focused-index', String(initialFocus));
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

    // Carousel chrome (chevrons + position pill) refreshes itself via
    // the MutationObserver above watching `data-stage-mode`. CSS
    // shows them automatically via the same attribute, so there's
    // nothing else to do here.
  }

  function exitSeriesMode(): void {
    if (!activeSeriesName) return;
    activeSeriesName = null;

    // Reset disabled state on the SSR chevrons so they're ready for
    // the next series-mode entry (CSS hides them automatically when
    // [data-stage-mode="series"] disappears below).
    if (carouselPrevBtn) {
      carouselPrevBtn.disabled = false;
      carouselPrevBtn.removeAttribute('aria-disabled');
    }
    if (carouselNextBtn) {
      carouselNextBtn.disabled = false;
      carouselNextBtn.removeAttribute('aria-disabled');
    }

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
        card.style.removeProperty('--series-focused-index');
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

      // Carousel chevrons handle clicks via direct listeners attached
      // at init time (see onChevronClick above). Defensive bail-out
      // here so a stray bubble-phase click on a chevron isn't
      // interpreted as a card click further down.
      if (target.closest<HTMLButtonElement>('[data-series-carousel-nav]')) {
        return;
      }

      // In series mode, intercept the orbit's rotate chevrons so they
      // advance the carousel's focused book instead of rotating the
      // (now-invisible) outer orbit. Without this the chevrons would
      // silently spin the muted background and leave the universe in
      // an unexpected rotation after exit.
      if (stage.dataset.stageMode === 'series') {
        const rotateBtn = target.closest<HTMLButtonElement>(
          '[data-galaxy-rotate]',
        );
        if (rotateBtn) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const members = getActiveMembers();
          const current = getFocusedMemberIndex(members.length);
          const delta = rotateBtn.dataset.direction === 'prev' ? -1 : 1;
          setFocusedMemberIndex(current + delta);
          return;
        }
      }

      // Coverflow click-to-focus: a tap on a non-focused carousel
      // book rotates it into the centre slot instead of opening the
      // spotlight. The focused (centre) book falls through to the
      // layout module's openCenter for the existing spotlight UX.
      const seriesMember = target.closest<HTMLElement>(
        '.galaxy-card.is-active-series-member',
      );
      if (seriesMember && stage.dataset.stageMode === 'series') {
        const idxRaw = seriesMember.style.getPropertyValue(
          '--series-active-index',
        );
        const idx = Number(idxRaw);
        const members = getActiveMembers();
        const current = getFocusedMemberIndex(members.length);
        if (
          Number.isFinite(idx) &&
          idx !== current &&
          seriesMember.dataset.pos !== 'center'
        ) {
          e.preventDefault();
          e.stopImmediatePropagation();
          setFocusedMemberIndex(idx);
          return;
        }
      }
    },
    true,
  );

  // Rotate-chevron interception at the document level — the orbit
  // controls live OUTSIDE the stage subtree (pinned to the viewport
  // bottom), so the stage-scoped handler above can't catch them.
  // universe-series-mode is initialised BEFORE universe-layout by the
  // orchestrator, so registering a capture-phase listener here means
  // ours fires first; stopImmediatePropagation prevents the layout
  // module's document-level handler from also running rotateOrbit.
  // In series mode the chevrons advance the carousel; outside series
  // mode this listener is a pure no-op.
  document.addEventListener(
    'click',
    e => {
      if (stage.dataset.stageMode !== 'series') return;
      const target = e.target as Element | null;
      if (!target) return;
      const rotateBtn = target.closest<HTMLButtonElement>(
        '[data-galaxy-rotate]',
      );
      if (!rotateBtn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const members = getActiveMembers();
      const current = getFocusedMemberIndex(members.length);
      const delta = rotateBtn.dataset.direction === 'prev' ? -1 : 1;
      setFocusedMemberIndex(current + delta);
    },
    true,
  );

  // ── Drag-to-navigate ─────────────────────────────────────────────
  // In series mode, dragging horizontally on the stage advances the
  // carousel. Registered in capture phase BEFORE the layout module's
  // own pointerdown (which is bubble-phase and would otherwise start
  // an orbit-rotation drag on the muted background). On a real drag
  // we also swallow the trailing click so click-to-focus doesn't
  // double-trigger. Outside series mode the handler is a no-op.
  const DRAG_NAV_THRESHOLD = 6;
  const DRAG_NAV_PIXELS_PER_STEP = 120;
  let dragNav: {
    pointerId: number;
    startX: number;
    startFocus: number;
    moved: boolean;
  } | null = null;

  stage.addEventListener(
    'pointerdown',
    e => {
      if (stage.dataset.stageMode !== 'series') return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const target = e.target as Element | null;
      if (!target) return;
      // Skip drag start on the carousel chevrons, the Other Knowledge
      // pill, the position indicator, the rotate buttons and the
      // series-capsule capsule itself — they all have explicit click
      // semantics and should not be hijacked by drag.
      if (
        target.closest(
          '[data-series-carousel-nav], ' +
          '[data-series-carousel-position], ' +
          '[data-galaxy-rotate], ' +
          '.galaxy-card[data-role="other-knowledge"]',
        )
      ) {
        return;
      }
      // Take ownership of the gesture so the layout module's
      // pointerdown (bubble-phase) never starts an orbit drag.
      e.stopImmediatePropagation();
      e.preventDefault();
      const members = getActiveMembers();
      dragNav = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startFocus: getFocusedMemberIndex(members.length),
        moved: false,
      };
    },
    true,
  );

  stage.addEventListener(
    'pointermove',
    e => {
      if (!dragNav || e.pointerId !== dragNav.pointerId) return;
      const dx = e.clientX - dragNav.startX;
      if (!dragNav.moved) {
        if (Math.abs(dx) < DRAG_NAV_THRESHOLD) return;
        dragNav.moved = true;
        try { stage.setPointerCapture(dragNav.pointerId); } catch { /* noop */ }
      }
      // In LTR a drag right (dx > 0) should reveal the previous book
      // (decrease focus). RTL flips the X axis via --galaxy-dir, so
      // we mirror input here too.
      const dirSign =
        stage.style.getPropertyValue('--galaxy-dir').trim() === '-1' ? -1 : 1;
      const advance = (-dx * dirSign) / DRAG_NAV_PIXELS_PER_STEP;
      const targetIdx = Math.round(dragNav.startFocus + advance);
      const members = getActiveMembers();
      const current = getFocusedMemberIndex(members.length);
      if (targetIdx !== current) {
        setFocusedMemberIndex(targetIdx);
      }
    },
    true,
  );

  function endDragNav(e: PointerEvent): void {
    if (!dragNav || e.pointerId !== dragNav.pointerId) return;
    const wasMoved = dragNav.moved;
    const pid = dragNav.pointerId;
    dragNav = null;
    if (stage.hasPointerCapture(pid)) {
      try { stage.releasePointerCapture(pid); } catch { /* noop */ }
    }
    // Suppress the click that follows a real drag so click-to-focus
    // doesn't accidentally jump to whatever card sits under the
    // cursor at pointerup. Capture + once so we only eat the very
    // next click and don't leave a dangling listener.
    if (wasMoved) {
      const swallow = (ev: Event): void => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      };
      stage.addEventListener('click', swallow, { once: true, capture: true });
    }
  }
  stage.addEventListener('pointerup', endDragNav, true);
  stage.addEventListener('pointercancel', endDragNav, true);

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
