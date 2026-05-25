/**
 * Knowledge Universe — orbit layout & interaction.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Orbit layout responsibility (this module)                      │
 *   │   • Click-to-center: clicking an orbit station card sets       │
 *   │     data-pos="center" on it and data-galaxy-focused="true" on  │
 *   │     the stage; CSS reads both to lift the card and reveal the  │
 *   │     backdrop. Click backdrop / × / Esc closes.                 │
 *   │   • Drag-to-rotate: pointerdown anywhere on the orbit, drag    │
 *   │     horizontally → rotate the entire carousel by setting       │
 *   │     --orbit-rotation on the stage. Snap to nearest station on  │
 *   │     release. Short drags (<6px) fall through as clicks.        │
 *   │   • Chevron rotation buttons: ±360°/N where N is the live      │
 *   │     visible-station count.                                     │
 *   │   • Reading-progress hydration: read per-chapter percentages   │
 *   │     from localStorage, average them, write back as --progress. │
 *   │   • Knows nothing about series. The card-click handler EARLY-  │
 *   │     RETURNS on cards with a `data-role` (series capsule /      │
 *   │     other-knowledge); those clicks are owned by                │
 *   │     `universe-series-mode.ts`.                                 │
 *   └────────────────────────────────────────────────────────────────┘
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Bug fix (Phase 3.5)                                            │
 *   │   The previous incarnation of click-to-center read              │
 *   │   `card.dataset.column` to derive a "book" / "lesson"           │
 *   │   bucket; the SSR migration replaced data-column with data-kind │
 *   │   and switched from slot-based positioning to orbit angles.     │
 *   │   The migrated handler now relies solely on `[data-galaxy-card]`│
 *   │   identity + data-pos="center" toggles, with a defensive role   │
 *   │   check that skips capsule and other-knowledge cards.          │
 *   └────────────────────────────────────────────────────────────────┘
 */

import { cssEscape } from './universe-angle-utils';

/**
 * Initialise click-to-center, drag-to-rotate, chevron rotation and
 * Esc-to-close on a single stage. State lives entirely on data-
 * attributes — no inline styles, no framework round-trips.
 */
export function initStageLayout(stage: HTMLElement): void {
  // Card currently in center.
  let focused: HTMLElement | null = null;
  // Cumulative orbit rotation (deg). Each rotate-orbit click bumps this
  // by ±360°/N where N is the live card count. CSS reads this off the
  // stage as --orbit-rotation and animates every card.
  let rotation = 0;

  function openCenter(card: HTMLElement) {
    if (focused === card) return;
    if (focused) closeCenter();
    focused = card;
    card.dataset.pos = 'center';
    stage.dataset.galaxyFocused = 'true';
  }

  function closeCenter() {
    if (!focused) return;
    // Removing data-pos drops the card back to its CSS-driven orbit
    // position — angle is encoded in the card's inline style, so
    // there's no per-card state to restore.
    delete focused.dataset.pos;
    focused = null;
    delete stage.dataset.galaxyFocused;
  }

  function getStep(): number {
    // Count only cards that are actually visible orbit stations.
    // Series members are tagged [data-series-member] by the hydrator
    // and hidden in universe mode; they're excluded. Capsule and
    // Other-Knowledge cards CARRY [data-galaxy-card] (they are real
    // stations) but no [data-series-member], so they ARE counted.
    const visibleCount = stage.querySelectorAll(
      '[data-galaxy-card]:not([data-series-member])',
    ).length || 1;
    return 360 / visibleCount;
  }

  function rotateOrbit(direction: number) {
    rotation += direction * getStep();
    stage.style.setProperty('--orbit-rotation', `${rotation}deg`);
    // Rotation moves stations under the focused card; close any focus
    // so the user sees the rotation, not a stale spotlight.
    if (focused) closeCenter();
  }

  // ── Drag-to-rotate ─────────────────────────────────────────────────
  // Click+hold anywhere on the orbit and drag horizontally to rotate
  // the entire carousel. Drag direction follows the user's hand.
  // RTL flips --galaxy-dir at the CSS level, so we mirror input here
  // too. On release we snap to the nearest station. A short drag
  // (< DRAG_THRESHOLD px) is interpreted as a click, so click-to-
  // center still works as before.
  const DRAG_THRESHOLD = 6;
  const DRAG_PIXELS_PER_STEP = 180;
  let drag: {
    pointerId: number;
    startX: number;
    startRotation: number;
    moved: boolean;
  } | null = null;

  function endDrag(commit: boolean) {
    if (!drag) return;
    const wasMoved = drag.moved;
    const pid = drag.pointerId;
    // Clear the dragging flag FIRST so the existing transform
    // transition is restored before the snap value is set — that way
    // the snap reads as a smooth animated move, not a jump.
    delete stage.dataset.galaxyDragging;
    if (stage.hasPointerCapture(pid)) stage.releasePointerCapture(pid);
    drag = null;
    if (wasMoved && commit) {
      const step = getStep();
      rotation = Math.round(rotation / step) * step;
      stage.style.setProperty('--orbit-rotation', `${rotation}deg`);
    }
    // If the drag actually moved, mark the next click as "swallow me"
    // so click-to-center doesn't fire on pointerup. Cleared by the
    // click handler below (or by the next pointerdown).
    if (wasMoved) stage.dataset.galaxyJustDragged = 'true';
  }

  stage.addEventListener('pointerdown', (e) => {
    // Only the primary mouse button counts; touch + pen always do.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as Element | null;
    if (!target) return;
    // Drags that start on a control element should NOT hijack the
    // control's own click semantics.
    if (target.closest(
      '[data-galaxy-cta-open], [data-galaxy-cta-close], [data-galaxy-rotate], [data-galaxy-backdrop]',
    )) return;
    // The orbit card is an <a>, and anchors + images are draggable by
    // default. Without preventDefault here the browser starts its
    // native link-drag on mousedown and our pointermove never sees the
    // motion. Touch devices are unaffected (no link-drag), which is
    // why dragging worked there but not with a mouse.
    e.preventDefault();
    drag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startRotation: rotation,
      moved: false,
    };
  });

  // Belt-and-braces: even with preventDefault on pointerdown, some
  // browsers still fire dragstart on inner anchors/images. Killing it
  // here makes sure the native drag-and-drop ghost never appears.
  stage.addEventListener('dragstart', (e) => {
    const target = e.target as Element | null;
    if (target && target.closest('[data-galaxy-card]')) {
      e.preventDefault();
    }
  });

  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      drag.moved = true;
      stage.dataset.galaxyDragging = 'true';
      // Capture so we still get events when the cursor leaves the
      // stage, and so the eventual click is suppressed.
      try { stage.setPointerCapture(drag.pointerId); } catch { /* noop */ }
      // Drop any spotlight so the user clearly sees the rotation.
      if (focused) closeCenter();
    }
    const dirSign = stage.style.getPropertyValue('--galaxy-dir').trim() === '-1' ? -1 : 1;
    const step = getStep();
    rotation =
      drag.startRotation + (dx / DRAG_PIXELS_PER_STEP) * step * dirSign;
    stage.style.setProperty('--orbit-rotation', `${rotation}deg`);
  });

  stage.addEventListener('pointerup',     () => endDrag(true));
  stage.addEventListener('pointercancel', () => endDrag(false));

  // Card click — capture phase so we beat the inner <a>'s native
  // navigation. We preventDefault unless the click came from the Open
  // CTA (which carries [data-galaxy-cta-open]).
  //
  // The series-mode module also registers a capture-phase click on
  // the same stage — and was registered FIRST by the orchestrator, so
  // its handler runs before this one. Series-mode handlers call
  // stopImmediatePropagation() on intercepted clicks (capsules /
  // Other Knowledge), so this handler never sees them. The role check
  // below is a defensive belt-and-braces in case an event slips
  // through — e.g. a synthesized click from a future feature.
  stage.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    if (!target) return;

    // Suppress the click that follows a real drag. pointerup fires
    // before click, and after pointerup `drag` is null but the moved
    // flag was reflected in `data-galaxy-dragging` — we use a separate
    // sticky flag for one tick instead.
    if (stage.dataset.galaxyJustDragged === 'true') {
      e.preventDefault();
      e.stopPropagation();
      delete stage.dataset.galaxyJustDragged;
      return;
    }

    // Open CTA — let it navigate.
    if (target.closest('[data-galaxy-cta-open]')) return;

    // Reading-entry overlay. The overlay lives INSIDE a centered
    // card, so the card-click branch below would otherwise interpret
    // a click on it as "card is centered → close center" and run
    // closeCenter() before the navigation resolves. Bailing out here
    // (BEFORE any preventDefault) preserves the overlay's native
    // <a href> behavior: plain click navigates, Ctrl/Cmd-click and
    // middle-click open in a new tab, right-click opens the context
    // menu with "Copy link address" / "Open in new tab", and Enter on
    // a keyboard-focused link follows the href. A future cinematic-
    // flight phase will install its own handler that DOES intercept
    // plain left-clicks (and only those) to animate before navigating.
    if (target.closest('[data-reading-entry]')) return;

    // Center-card secondary link ("מה יש בספר?" → /books/{slug}).
    // Same rationale as the reading-entry guard above: the link lives
    // inside the centered card, so the card-click branch below would
    // close the spotlight and swallow the navigation. Letting the
    // native <a href> take over keeps modifier-click and right-click
    // behavior intact.
    if (target.closest('[data-cc-secondary-link]')) return;

    // Close button.
    if (target.closest('[data-galaxy-cta-close]')) {
      e.preventDefault();
      closeCenter();
      return;
    }

    // Backdrop.
    if (target.closest('[data-galaxy-backdrop]')) {
      e.preventDefault();
      closeCenter();
      return;
    }

    // Rotate-orbit chevrons.
    const rotateBtn = target.closest<HTMLButtonElement>('[data-galaxy-rotate]');
    if (rotateBtn) {
      e.preventDefault();
      rotateOrbit(rotateBtn.dataset.direction === 'prev' ? -1 : 1);
      return;
    }

    // Card click. Defensive role check — series capsules and Other
    // Knowledge are owned by universe-series-mode.ts; never click-to-
    // center them.
    const card = target.closest<HTMLElement>('[data-galaxy-card]');
    if (!card) return;
    if (card.dataset.role === 'series' || card.dataset.role === 'other-knowledge') return;
    // The inner LibraryCard renders an <a>. We swallow that nav and
    // run our own behavior instead.
    e.preventDefault();
    if (card.dataset.pos === 'center') {
      // Click on card body while focused = close (acts as a second
      // tap to dismiss the spotlight). The Open CTA is the only way
      // to actually navigate.
      closeCenter();
    } else {
      openCenter(card);
    }
  }, true);

  // Rotate-orbit chevrons that live OUTSIDE the stage (pinned to the
  // viewport bottom). The stage-scoped click handler above still
  // handles in-stage rotate buttons defensively, but the canonical
  // location is now a sibling of `.library-body` so the buttons can't
  // be visually covered by a focused card. Document-level delegation
  // keeps the lookup cheap and unaware of where the buttons render.
  //
  // Visibility check: `offsetParent` returns null for position:fixed
  // elements in Chromium/WebKit. The mobile layout pins .library-galaxy
  // with position:fixed (≤1023px), so a naïve `offsetParent === null`
  // guard silently kills the rotate buttons on every phone. Use a
  // bounding-rect check instead — works for both relative and fixed
  // stages, and still rejects display:none / detached nodes.
  const isStageOnScreen = (): boolean => {
    if (!stage.isConnected) return false;
    const rect = stage.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  document.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    if (!target) return;
    const rotateBtn = target.closest<HTMLButtonElement>('[data-galaxy-rotate]');
    if (!rotateBtn) return;
    if (!isStageOnScreen()) return;
    // Skip if the click was already handled by the stage-scoped click
    // handler (button still inside the stage subtree, legacy path).
    if (stage.contains(rotateBtn)) return;
    e.preventDefault();
    rotateOrbit(rotateBtn.dataset.direction === 'prev' ? -1 : 1);
  });

  // Keyboard: Enter on the inner <a> bubbles up as a click and is
  // handled by the click listener above (preventDefault + open). Esc
  // closes a focused card. ArrowLeft / ArrowRight rotate the orbit by
  // one station — same call the chevron buttons use, so snap, focus
  // dismissal and the live station count are all shared. Document-
  // level because the stage doesn't naturally hold keyboard focus and
  // arrows should work whenever the universe is the visible content.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && focused) {
      closeCenter();
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    // Don't hijack arrows while the user is typing or holding a
    // modifier (Ctrl/Cmd-arrow are reserved for browser nav, Alt-arrow
    // for back/forward, Shift-arrow for selection).
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const active = document.activeElement as HTMLElement | null;
    if (active) {
      const tag = active.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (active.isContentEditable) return;
    }
    // Skip if the universe stage isn't even on screen — the listener
    // is global and would otherwise scroll-jack pages that share the
    // body. Bounding-rect check works for position:fixed stages
    // (mobile pins .library-galaxy with fixed positioning).
    if (!isStageOnScreen()) return;
    e.preventDefault();
    // ArrowLeft → prev chevron (-1), ArrowRight → next chevron (+1).
    // Matches the visual chevron icons in both LTR and RTL; the
    // existing rotateOrbit call carries snap + focus dismissal.
    rotateOrbit(e.key === 'ArrowLeft' ? -1 : 1);
  });

  // ── Knowledge Core + Knowledge Atlas bridge ───────────────────────
  // Two carousel-page widgets steer the orbit through plain data
  // attributes — no CustomEvent, no event bus, no shared state. This
  // one delegated click listener is the whole bridge:
  //
  //   [data-library-filter]  (Knowledge Core widget nodes)
  //     "all"      → closeCenter() — drop the spotlight, all visible.
  //     "books"    → focus first data-kind="book" station.
  //     "courses"  → focus first data-kind="course" station.
  //     "articles" → focus first data-kind="article" station (a no-op
  //                  until article content gets orbit stations).
  //
  //   [data-library-focus="<slug>"]  (Knowledge Atlas item capsules)
  //     → focus the EXACT station whose data-slug matches.
  //
  // openCenter() already lifts ANY card to the centre via
  // data-pos="center" regardless of orbit angle, so "focus" is the
  // whole bridge. Identical on desktop and mobile — no breakpoint
  // branch.
  //
  // Document-level delegation: both widgets render outside the stage
  // subtree (the Core is a position:fixed panel, the Atlas a
  // position:fixed overlay), so their clicks are caught here, not by
  // the stage-scoped handler. Same safe-leak pattern as the rotate /
  // keyboard listeners above — after a view transition the captured
  // `stage` is disconnected and isStageOnScreen() makes this a no-op.
  const LIBRARY_FILTER_TO_KIND: Record<string, 'book' | 'course' | 'article'> = {
    books:    'book',
    courses:  'course',
    articles: 'article',
  };

  document.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    if (!target) return;

    // Knowledge Atlas item → focus that exact station by slug.
    const focusTrigger = target.closest<HTMLElement>('[data-library-focus]');
    if (focusTrigger) {
      if (!isStageOnScreen()) return;
      const slug = focusTrigger.dataset.libraryFocus;
      if (!slug) return;
      const station = stage.querySelector<HTMLElement>(
        `[data-galaxy-card][data-slug="${cssEscape(slug)}"]`,
      );
      if (station) openCenter(station);
      return;
    }

    // Knowledge Core node → focus the first station of that category.
    const trigger = target.closest<HTMLElement>('[data-library-filter]');
    if (!trigger) return;
    if (!isStageOnScreen()) return;

    const filter = trigger.dataset.libraryFilter;
    if (!filter) return;

    // "all" — clear the spotlight, every station visible.
    if (filter === 'all') {
      closeCenter();
      return;
    }

    const kind = LIBRARY_FILTER_TO_KIND[filter];
    if (!kind) return;

    // First station of that kind. `:not([data-series-member])` mirrors
    // getStep() so a hidden series member is never spotlighted (a no-op
    // today — series grouping is disabled — but it keeps the bridge
    // correct if capsule injection is ever re-enabled).
    const card = stage.querySelector<HTMLElement>(
      `[data-galaxy-card][data-kind="${kind}"]:not([data-series-member])`,
    );
    // No station of that kind on the orbit → leave the current view
    // untouched rather than destroying an unrelated spotlight.
    if (card) openCenter(card);
  });

  // ── Mobile auto-focus ─────────────────────────────────────────────
  // On phones the orbit cards are clamped to 96-140px wide, which
  // makes the title/cover text hard to read at rest. To solve the
  // affordance problem ("user tries to read instead of tapping"), the
  // first eligible orbit station is auto-focused on page load so the
  // visitor immediately sees one large, fully readable card scaled
  // up at the orbit center — with the other cards visibly orbiting
  // around it as small satellites. Tap any other card (or the
  // backdrop) to change focus / dismiss.
  //
  // Mobile-only: desktop has enough card real estate that text is
  // readable at rest, and auto-focusing there would block the
  // designed "hero cosmic dashboard" composition.
  const MOBILE_MAX_WIDTH = 1023; // matches @media (max-width: 1023px)
  if (window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches) {
    // Defer one frame so the orbit hydrator (which can remove series
    // members from the visible card pool) has finished mutating the
    // DOM before we pick a card to spotlight.
    requestAnimationFrame(() => {
      if (focused) return; // a user interaction already focused something
      const first = stage.querySelector<HTMLElement>(
        '[data-galaxy-card]:not([data-series-member]):not([data-role="series"]):not([data-role="other-knowledge"])',
      );
      if (first) openCenter(first);
    });
  }
}

/**
 * Hydrate orbit-card progress bars from localStorage.
 *
 * Reading progress is stored per-chapter as
 *   yuval_reading_progress_{bookSlug}_ch{n}
 * with a `percentage` field (see scripts/progress-tracker.ts).
 * Book-level progress on the orbit card is the average percentage
 * across all chapters [1..chapterCount]; chapters with no entry count
 * as 0%, so a brand-new book reads 0% — never "no data".
 *
 * SSR ships every bar at 0%; this hydrator updates the `--progress`
 * CSS variable + the inline percentage text. Bars with chapterCount=0
 * (defensive) are left at 0% as well.
 */
export function hydrateOrbitProgress(): void {
  const bars = document.querySelectorAll<HTMLElement>('[data-orbit-progress]');
  bars.forEach((bar) => {
    const slug = bar.dataset.bookSlug;
    const total = Number(bar.dataset.chapterCount || '0');
    if (!slug || !Number.isFinite(total) || total <= 0) return;

    let sum = 0;
    for (let i = 1; i <= total; i++) {
      const raw = localStorage.getItem(`yuval_reading_progress_${slug}_ch${i}`);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const pct = Number(parsed?.percentage);
        if (Number.isFinite(pct)) sum += Math.max(0, Math.min(100, pct));
      } catch {
        /* malformed entry — treat as 0 */
      }
    }

    const avg = Math.round(sum / total);
    bar.style.setProperty('--progress', `${avg}%`);
    const pctEl = bar.querySelector<HTMLElement>('[data-orbit-progress-pct]');
    if (pctEl) pctEl.textContent = `${avg}%`;
  });
}
