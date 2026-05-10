/**
 * Knowledge Universe — orbit-angle math + DOM helpers.
 *
 * Pure functions, no DOM mutation, no side effects. Imported from both
 * the library.astro frontmatter (SSR initial layout) and the runtime
 * hydrator (post-metadata angle recompute) so the math is defined in
 * exactly one place.
 *
 *   getEvenOrbitAngle(i, total, startDeg?) → degrees for one orbit
 *                            station among `total` stations distributed
 *                            evenly around 360°. Item TYPE has no effect
 *                            on the orbit slot — every visible item
 *                            (book, lesson, series, future kinds) shares
 *                            one global index space.
 *   cssEscape(value)      → escape attribute-selector input. Used to
 *                            embed user-typed series names safely in
 *                            `[data-series-member="..."]` queries.
 *
 * Math convention: angles in degrees, 0° = right, 90° = down, 180° =
 * left, 270° = up.
 *
 *
 * History: an earlier layout split the orbit into per-type arcs
 * (`bookAngle`, `lessonAngle`, `seriesAngle`) that placed each kind on
 * its own half-circle. With small or imbalanced inventories that
 * produced a visibly clustered orbit — books crammed onto the inline-
 * start arc, lessons on the inline-end arc, and series huddled at the
 * apex — and adding a new item piled onto the matching cluster instead
 * of using the empty space elsewhere. The unified helper below
 * replaces all three per-type formulas. The previous functions have
 * been removed; if a future product decision needs per-kind clustering
 * back, recover the old `bookAngle` / `lessonAngle` / `seriesAngle`
 * implementations from git history rather than reintroducing a kind-
 * branching call site here.
 */

/**
 * Default starting angle for the unified distribution. Tuned to sit
 * just below the page's top centre so item #0 doesn't crowd the
 * "Knowledge Universe" page title at 270° (12 o'clock); items walk
 * clockwise from here. Configurable per call when a different anchor
 * is needed (e.g. a future "rotate to the user's last-read item"
 * affordance).
 */
export const ORBIT_START_DEG = 250;

/**
 * Distribute `total` orbit stations evenly around 360°, returning the
 * angle for `index`. The same function is the source of truth for SSR
 * (library.astro) and the client-side hydrator
 * (universe-series-hydrator.ts) so the initial paint and the post-
 * metadata recompute always agree on slot positions.
 *
 *   total = 5  → stations every 72°  (250, 322, 34, 106, 178)
 *   total = 8  → stations every 45°  (250, 295, 340, 25, 70, 115, 160, 205)
 *   total = 12 → stations every 30°
 *
 * Adding a new visible item raises `total` by 1 — every existing item
 * shifts a small amount counter-clockwise so the result is still an
 * even spread, never a pile-up. Callers that want a stable anchor
 * across re-orderings should make sure their station-sort produces a
 * stable index for each item before passing it in.
 */
export function getEvenOrbitAngle(
  index: number,
  total: number,
  startDeg: number = ORBIT_START_DEG,
): number {
  if (total <= 0) return ((startDeg % 360) + 360) % 360;
  const step = 360 / total;
  const raw = startDeg + step * index;
  return ((raw % 360) + 360) % 360;
}

/**
 * CSS.escape with a manual fallback. Series names are user-typed in the
 * admin and may contain quotes, brackets or backslashes — characters
 * that would otherwise break attribute-selector syntax.
 */
export function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/["\\\[\]]/g, '\\$&');
}
