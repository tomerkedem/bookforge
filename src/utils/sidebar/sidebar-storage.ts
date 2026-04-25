/**
 * localStorage adapters for chapter completion + scroll progress.
 *
 * Two distinct keys are intentional:
 *   1. yuval_ch_complete_<book>  → array of completed chapter IDs.
 *      Survives clearing scroll progress; explicit reset removes.
 *   2. reading_progress_<book>_ch<id>  → scroll position + percentage.
 *      Lives in ReadingProgressManager. We READ from it here for the
 *      "in progress but not yet complete" signal but never write to
 *      it from this module (the scroll listener does the writing).
 */

/** Returns the list of chapter IDs the user has completed in `book`. */
export function getCompletedChapters(book: string): string[] {
  if (!book) return [];
  try {
    const raw = localStorage.getItem(`yuval_ch_complete_${book}`);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

/** Persist the list of completed chapter IDs for `book`. */
export function setCompletedChapters(book: string, ids: string[]): void {
  if (!book) return;
  const unique = Array.from(new Set(ids.map(String)));
  localStorage.setItem(`yuval_ch_complete_${book}`, JSON.stringify(unique));
}

/** Mark a chapter completed. Idempotent — does nothing if already
 *  in the completed list. */
export function markChapterComplete(book: string, chapterId: string | number): void {
  const ids = getCompletedChapters(book);
  const id = String(chapterId);
  if (ids.includes(id)) return;
  ids.push(id);
  setCompletedChapters(book, ids);
}

/**
 * Remove a chapter from completed list AND wipe its scroll-progress
 * record. Both are needed so the chapter resets to a clean 0% state,
 * not "94% — almost there".
 */
export function unmarkChapterComplete(book: string, chapterId: string | number): void {
  const ids = getCompletedChapters(book);
  const id = String(chapterId);
  const next = ids.filter(x => x !== id);
  if (next.length !== ids.length) {
    setCompletedChapters(book, next);
  }
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('reading_progress_') && k.includes(`_${book}_ch${id}`)) {
      try { localStorage.removeItem(k); } catch {}
    }
  });
}

/**
 * Highest scroll percentage ever recorded for `chapterId` in `book`.
 * Walks all reading_progress_* keys for the chapter so concurrent
 * sessions / writes don't lose ground. Returns 0 if no record exists.
 */
export function getChapterScrollPercent(book: string, chapterId: string | number): number {
  const id = String(chapterId);
  let max = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.includes(`_${book}_ch${id}`)) continue;
    try {
      const d = JSON.parse(localStorage.getItem(k) || '{}');
      if (typeof d.percentage === 'number' && d.percentage > max) {
        max = d.percentage;
      }
    } catch {}
  }
  return max;
}