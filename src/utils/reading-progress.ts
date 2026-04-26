import type { ReadingProgress } from '../types/index';
import { getStorageKey } from './language';

export class ReadingProgressManager {
  private static readonly PREFIX = 'reading_progress_';

  static getKey(bookId: string, chapterId: number | string): string {
    return getStorageKey(`${this.PREFIX}${bookId}_ch${chapterId}`);
  }

  static saveProgress(bookId: string, chapterId: number | string, scrollPosition: number, percentage?: number): void {
    if (typeof window === 'undefined') return;

    const progress: ReadingProgress & { percentage?: number } = {
      bookId,
      chapterId,
      scrollPosition,
      lastUpdated: Date.now(),
      percentage,
    };

    localStorage.setItem(this.getKey(bookId, chapterId), JSON.stringify(progress));
  }

  static getProgress(bookId: string, chapterId: number | string): ReadingProgress | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(this.getKey(bookId, chapterId));
    if (!stored) return null;

    try {
      return JSON.parse(stored) as ReadingProgress;
    } catch {
      return null;
    }
  }

  static clearProgress(bookId: string, chapterId: number | string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(bookId, chapterId));
  }

  static getScrollPercentage(scrollPosition: number, contentHeight: number): number {
    if (contentHeight === 0) return 0;
    return Math.min(100, (scrollPosition / contentHeight) * 100);
  }

  static restoreScroll(bookId: string, chapterId: number | string): number {
    const progress = this.getProgress(bookId, chapterId);
    return progress?.scrollPosition ?? 0;
  }
}