/**
 * Shared helpers for the Book Overview components.
 *
 * Extracted verbatim from src/pages/books/[slug].astro so the page and
 * the new components agree on i18n fallback, credit handling, and inline
 * markdown rendering. Keep behavior identical — see the Hero/Summary/
 * Chapters components for the call sites.
 */

import { SOURCE_LANGUAGE } from '../../utils/language';
import { t } from '../../i18n';

export type LocalizedMap = Record<string, string | undefined>;

/**
 * Resolve a per-language string with a fallback chain:
 * requested lang → fallback (source) → first non-empty value → "".
 */
export function getLocalizedText(
  value: LocalizedMap | undefined,
  lang: string,
  fallback: string = SOURCE_LANGUAGE
): string {
  if (!value) return '';
  return value[lang] ?? value[fallback] ?? Object.values(value).find(Boolean) ?? '';
}

/**
 * Resolve a credit field that may be either a plain string (legacy) or
 * a per-language map. Falls back the same way as getLocalizedText.
 */
export function getCreditText(
  value: string | Record<string, string> | undefined,
  lang: string,
  fallback: string = SOURCE_LANGUAGE
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value[fallback] ?? Object.values(value).find(Boolean) ?? '';
}

/**
 * Serialize a credit map to JSON for the `data-credit-localized`
 * attribute. The page-level language-changed handler reads this to
 * re-render credit names client-side without a navigation.
 */
export function creditDataAttr(value: string | Record<string, string> | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return JSON.stringify({ [SOURCE_LANGUAGE]: value });
  return JSON.stringify(value);
}

export function formatChapterCount(count: number, lang: string): string {
  if (count === 1) return t('book.chapterOne', lang);
  return t('book.chapters', lang, { n: count.toString() });
}

/** Reading time estimate at ~200 wpm; min 1 minute. */
export function formatReadingTime(wordCount: number, lang: string): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  if (lang === 'he') return `${minutes} דקות קריאה`;
  if (lang === 'es') return `${minutes} min de lectura`;
  return `${minutes} min read`;
}

export function formatSectionsLabel(sections: number, lang: string): string {
  return sections === 1
    ? t('book.sectionOne', lang)
    : t('book.sections', lang, { n: sections.toString() });
}

/**
 * Convert a small subset of inline markdown to safe HTML.
 *
 * Supports the markers that show up in book descriptions written in Word:
 *   **text**  ->  <strong>text</strong>
 *   *text*    ->  <em>text</em>
 *   `text`    ->  <code>text</code>
 *
 * Everything else is escaped so there's no risk of injecting arbitrary
 * HTML from manifest data. The pattern order matters — ** must be
 * processed before * so "*" inside "**...**" isn't consumed first.
 */
export function renderInlineMarkdown(text: string): string {
  // Escape HTML first so user content can't break out. We intentionally
  // do NOT escape backticks, asterisks, or underscores here — they're
  // markdown syntax we'll consume in the next step.
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return escaped
    // Bold: **text**
    .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* (single asterisks, not consumed by bold)
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
    // Inline code: `text`
    .replace(/`([^`\n]+?)`/g, '<code>$1</code>');
}
