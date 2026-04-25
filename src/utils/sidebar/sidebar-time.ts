/**
 * Reading-time computation.
 *
 * All time math goes through this module so the sidebar header,
 * chapter cards, and section list always agree on minutes — there's
 * one WPM, one rounding policy, and one source of truth for
 * proportional distribution.
 */

import { getCurrentLang, getWPM, getCurrentChapterId, getBookSlug } from './sidebar-helpers';
import { getCompletedChapters, getChapterScrollPercent } from './sidebar-storage';

/**
 * Total remaining reading time across the book, in minutes. Sums
 * word counts of unread chapters, then for the active chapter
 * applies the in-progress percentage so "44 min remaining" actually
 * shrinks as the user scrolls instead of dropping in chunks at
 * chapter boundaries.
 */
export function computeTimeRemaining(): number {
  const book = getBookSlug();
  if (!book) return 0;
  const completed = new Set(getCompletedChapters(book));
  const currentId = getCurrentChapterId() || '';
  const wpm = getWPM();

  let remainingWords = 0;
  document.querySelectorAll<HTMLElement>('.usb-chapter[data-chapter-id]').forEach(li => {
    const id = li.dataset.chapterId || '';
    if (!id) return;
    const words = parseInt(li.dataset.wordCount || '0', 10) || 0;
    if (completed.has(id)) return;
    if (id === currentId) {
      /* Only the unread fraction of the active chapter counts. */
      const pct = getChapterScrollPercent(book, id);
      remainingWords += Math.max(0, words * (100 - pct) / 100);
    } else {
      remainingWords += words;
    }
  });

  return Math.max(0, Math.ceil(remainingWords / wpm));
}

/** Localized "X minutes remaining" / "Done" string. */
export function formatTimeRemaining(minutes: number): string {
  const lang = getCurrentLang();
  if (minutes <= 0) {
    return lang === 'he' ? 'סיימת' : 'Done';
  }
  if (lang === 'he') {
    return minutes < 60
      ? `נשארו כ-${minutes} דקות`
      : `נשארו כ-${Math.round(minutes / 60)} שעות`;
  }
  return minutes < 60
    ? `~${minutes} min remaining`
    : `~${Math.round(minutes / 60)}h remaining`;
}

/** Localized "X minutes read" string for a chapter card. */
export function formatChapterTime(words: number): string {
  if (!words || words <= 0) return '';
  const minutes = Math.max(1, Math.ceil(words / getWPM()));
  const lang = getCurrentLang();
  return lang === 'he' ? `${minutes} דקות קריאה` : `${minutes} min read`;
}

/**
 * Distribute a chapter's total reading time across its sections,
 * weighted by how much text falls under each heading. Output sums
 * exactly to `chapterMinutes` — no off-by-one drift between the
 * chapter card and the section list below it.
 *
 * Algorithm: largest-remainder rounding. Each section gets
 * floor(ideal_minutes), then leftover minutes are handed to the
 * sections with the largest fractional parts. Sections are bumped
 * to a minimum of 1 minute so we never display a "0 דק'" entry.
 *
 * @param charCounts  character count per section, in heading order
 * @param chapterWords total word count of the chapter (from manifest)
 * @returns array of integer minutes parallel to charCounts
 */
export function distributeChapterMinutesFromData(
  charCounts: number[],
  chapterWords: number,
): number[] {
  if (charCounts.length === 0) return [];

  const chapterMinutes = chapterWords > 0
    ? Math.max(1, Math.ceil(chapterWords / getWPM()))
    : 0;

  /* No chapter word count → fall back to direct estimate per section
     (chars / 5 / WPM). Rare; only happens when the manifest didn't
     ship a word_count for this chapter. */
  if (chapterMinutes === 0) {
    return charCounts.map(c => Math.max(1, Math.ceil((c / 5) / getWPM())));
  }

  const totalChars = charCounts.reduce((sum, c) => sum + c, 0) || 1;
  const idealFloats = charCounts.map(c => (c / totalChars) * chapterMinutes);
  const floors = idealFloats.map(f => Math.floor(f));
  const remainders = idealFloats.map((f, i) => ({ idx: i, frac: f - floors[i] }));

  /* Bump zeros to 1 so no section displays "0 minutes". The bumped
     count gets reconciled against the leftover pool below. */
  for (let i = 0; i < floors.length; i++) {
    if (floors[i] === 0) floors[i] = 1;
  }

  const distributed = floors.reduce((s, f) => s + f, 0);
  let leftover = chapterMinutes - distributed;

  if (leftover > 0) {
    /* Hand out remaining minutes by largest fractional part. */
    remainders.sort((a, b) => b.frac - a.frac);
    for (const { idx } of remainders) {
      if (leftover <= 0) break;
      floors[idx] += 1;
      leftover -= 1;
    }
  } else if (leftover < 0) {
    /* Bumping zeros over-allocated. Take minutes back from sections
       with smallest fractional parts — but never below 1. */
    remainders.sort((a, b) => a.frac - b.frac);
    for (const { idx } of remainders) {
      if (leftover >= 0) break;
      if (floors[idx] > 1) {
        floors[idx] -= 1;
        leftover += 1;
      }
    }
  }

  return floors;
}