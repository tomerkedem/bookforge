/**
 * Library Mock Data
 * ────────────────────────────────────────────────────────────────────────────
 * Development fixtures for the future living library screen.
 *
 * Rules:
 *  - No UI labels here. Status/type values stay as machine keys; display
 *    strings come from i18n at render time.
 *  - Hebrew + English titles where realistic; other localized fields are
 *    optional and may be absent for some items (tests fallback behavior).
 *  - Mirrors realistic relationships (series, courses, related articles)
 *    so recommendation logic has something meaningful to chew on.
 */

import type { LibraryCatalog, LibraryItem, LibrarySeries } from '../types/library';

// ── Series ──────────────────────────────────────────────────────────────────

const series: LibrarySeries[] = [
  {
    id: 'series-ai-engineering',
    titles: {
      he: 'סדרת AI Engineering',
      en: 'AI Engineering Series',
    },
    summaries: {
      he: 'מסע מקיף ביסודות ובמערכות AI מודרניות.',
      en: 'A comprehensive journey through AI foundations and modern systems.',
    },
    categoryKey: 'ai-engineering',
    dominantColor: '#6c5cff',
    itemIds: [
      'course-ai-engineering',
      'lesson-1-intro-to-ai-engineering',
      'lesson-2-machine-learning',
      'summary-lesson-1',
      'summary-lesson-2',
      'article-llm-eval-pitfalls',
    ],
  },
  {
    id: 'series-mcp-systems',
    titles: {
      he: 'סדרת MCP Systems',
      en: 'MCP Systems Series',
    },
    summaries: {
      he: 'בניית סוכנים מבוססי Model Context Protocol מקצה לקצה.',
      en: 'Building Model Context Protocol agents end to end.',
    },
    categoryKey: 'ai-systems',
    dominantColor: '#38e1ff',
    itemIds: [
      'book-building-mcp',
      'article-mcp-tool-design',
      'lab-mcp-quickstart',
    ],
  },
];

// ── Items ───────────────────────────────────────────────────────────────────

const items: LibraryItem[] = [
  // 1. Course (real one in the project)
  {
    id: 'course-ai-engineering',
    slug: 'ai-engineering',
    type: 'course',
    status: 'ready',
    sourceKind: 'pipeline',
    titles: {
      he: 'AI Engineering',
      en: 'AI Engineering',
    },
    subtitles: {
      he: 'קורס מלא בהנחיית ערן סלע',
      en: 'Full course by Eran Sela',
    },
    summaries: {
      he: 'מיסודות ML ועד בנייה מעשית של מערכות הסתברותיות.',
      en: 'From ML foundations to practical probabilistic systems.',
    },
    topics: {
      he: ['Machine Learning', 'מערכות הסתברותיות', 'AI Engineering'],
      en: ['Machine Learning', 'Probabilistic Systems', 'AI Engineering'],
    },
    categoryKey: 'ai-engineering',
    level: 'intermediate',
    seriesId: 'series-ai-engineering',
    orderInSeries: 1,
    languages: ['he', 'en', 'es'],
    createdAt: '2025-09-01T00:00:00.000Z',
    updatedAt: '2026-04-20T00:00:00.000Z',
    href: '/courses/ai-engineering',
    relatedIds: ['book-ai-developer-fitness', 'book-building-mcp'],
  },

  // 2. Course lesson
  {
    id: 'lesson-1-intro-to-ai-engineering',
    slug: 'Lesson-1-Introduction-To-AI-Engineering-and-Generative-AI',
    type: 'course_lesson',
    status: 'ready',
    sourceKind: 'pipeline',
    titles: {
      he: 'שיעור 1 - מבוא ל-AI Engineering ו-Generative AI',
      en: 'Lesson 1 - Introduction to AI Engineering and Generative AI',
    },
    categoryKey: 'ai-engineering',
    level: 'foundations',
    seriesId: 'series-ai-engineering',
    courseSlug: 'ai-engineering',
    orderInSeries: 2,
    languages: ['he', 'en'],
    createdAt: '2025-09-15T00:00:00.000Z',
    updatedAt: '2026-01-12T00:00:00.000Z',
    wordCount: 28400,
    href: '/read/Lesson-1-Introduction-To-AI-Engineering-and-Generative-AI/intro',
    relatedIds: ['summary-lesson-1', 'lesson-2-machine-learning'],
  },

  // 3. Course lesson
  {
    id: 'lesson-2-machine-learning',
    slug: 'Lesson-2-Machine-Learning',
    type: 'course_lesson',
    status: 'ready',
    sourceKind: 'pipeline',
    titles: {
      he: 'שיעור 2 - Machine Learning',
      en: 'Lesson 2 - Machine Learning',
    },
    categoryKey: 'ai-engineering',
    level: 'foundations',
    seriesId: 'series-ai-engineering',
    courseSlug: 'ai-engineering',
    orderInSeries: 3,
    languages: ['he', 'en'],
    createdAt: '2025-10-02T00:00:00.000Z',
    updatedAt: '2026-02-04T00:00:00.000Z',
    wordCount: 31200,
    href: '/read/Lesson-2-Machine-Learning/intro',
    relatedIds: ['summary-lesson-2', 'lesson-1-intro-to-ai-engineering'],
  },

  // 4. Lesson summary
  {
    id: 'summary-lesson-1',
    slug: 'summary-lesson-1-intro',
    type: 'lesson_summary',
    status: 'ready',
    sourceKind: 'manual',
    titles: {
      he: 'סיכום שיעור 1 - מבוא',
      en: 'Lesson 1 Summary - Introduction',
    },
    summaries: {
      he: 'הנקודות המרכזיות מהשיעור הראשון בקורס AI Engineering.',
      en: 'Key takeaways from the first AI Engineering lesson.',
    },
    categoryKey: 'ai-engineering',
    seriesId: 'series-ai-engineering',
    courseSlug: 'ai-engineering',
    orderInSeries: 4,
    languages: ['he', 'en'],
    createdAt: '2025-09-16T00:00:00.000Z',
    updatedAt: '2026-01-13T00:00:00.000Z',
    readingMinutes: 7,
    wordCount: 1400,
    href: '/read/Lesson-1-Introduction-To-AI-Engineering-and-Generative-AI/summary',
    relatedIds: ['lesson-1-intro-to-ai-engineering'],
  },

  // 5. Lesson summary
  {
    id: 'summary-lesson-2',
    slug: 'summary-lesson-2-ml',
    type: 'lesson_summary',
    status: 'ready',
    sourceKind: 'manual',
    titles: {
      he: 'סיכום שיעור 2 - Machine Learning',
      en: 'Lesson 2 Summary - Machine Learning',
    },
    summaries: {
      he: 'תקציר ממוקד של מושגי ML מהשיעור השני.',
      en: 'Focused recap of ML concepts from lesson 2.',
    },
    categoryKey: 'ai-engineering',
    seriesId: 'series-ai-engineering',
    courseSlug: 'ai-engineering',
    orderInSeries: 5,
    languages: ['he', 'en'],
    createdAt: '2025-10-03T00:00:00.000Z',
    updatedAt: '2026-02-05T00:00:00.000Z',
    readingMinutes: 9,
    wordCount: 1800,
    href: '/read/Lesson-2-Machine-Learning/summary',
    relatedIds: ['lesson-2-machine-learning'],
  },

  // 6. Book - Python (real)
  {
    id: 'book-practical-python',
    slug: 'practical-python-for-ai-engineering',
    type: 'book',
    status: 'ready',
    sourceKind: 'pipeline',
    titles: {
      he: 'Python מעשי להנדסת AI',
      en: 'Practical Python for AI Engineering',
    },
    summaries: {
      he: 'מדריך מעשי ל-Python בעולם ה-AI.',
      en: 'A hands-on Python guide for the AI world.',
    },
    topics: {
      he: ['Python', 'הנדסת AI', 'תכנות'],
      en: ['Python', 'AI Engineering', 'Programming'],
    },
    categoryKey: 'foundations',
    level: 'foundations',
    languages: ['he', 'en'],
    createdAt: '2025-08-01T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
    wordCount: 86000,
    href: '/books/practical-python-for-ai-engineering',
    relatedIds: ['book-ai-developer-fitness', 'article-python-async-pitfalls'],
  },

  // 7. Book - AI Developer Fitness
  {
    id: 'book-ai-developer-fitness',
    slug: 'AI-Developer-Fitness',
    type: 'book',
    status: 'ready',
    sourceKind: 'pipeline',
    titles: {
      he: 'AI Developer Fitness',
      en: 'AI Developer Fitness',
    },
    summaries: {
      he: 'אימון הנדסי בעידן מערכות הסתברותיות.',
      en: 'Engineering fitness for the probabilistic-systems era.',
    },
    categoryKey: 'ai-engineering',
    level: 'intermediate',
    languages: ['he', 'en'],
    createdAt: '2025-11-10T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:00.000Z',
    wordCount: 64000,
    href: '/books/AI-Developer-Fitness',
    relatedIds: ['course-ai-engineering', 'book-practical-python'],
  },

  // 8. Book - Building MCP
  {
    id: 'book-building-mcp',
    slug: 'Building-AI-Systems-with-MCP',
    type: 'book',
    status: 'ready',
    sourceKind: 'pipeline',
    titles: {
      he: 'בניית מערכות AI עם MCP',
      en: 'Building AI Systems with MCP',
    },
    summaries: {
      he: 'מדריך מקצה לקצה לבניית סוכנים על Model Context Protocol.',
      en: 'End-to-end guide to building agents on the Model Context Protocol.',
    },
    categoryKey: 'ai-systems',
    level: 'advanced',
    seriesId: 'series-mcp-systems',
    orderInSeries: 1,
    languages: ['he', 'en'],
    createdAt: '2025-12-01T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
    wordCount: 72000,
    href: '/books/Building-AI-Systems-with-MCP',
    relatedIds: ['article-mcp-tool-design', 'lab-mcp-quickstart'],
  },

  // 9. Book - Clean Code (mock-only)
  {
    id: 'book-clean-code',
    slug: 'clean-code',
    type: 'book',
    status: 'ready',
    sourceKind: 'manual',
    titles: {
      he: 'Clean Code',
      en: 'Clean Code',
    },
    summaries: {
      he: 'עקרונות לכתיבת קוד נקי וקריא.',
      en: 'Principles for writing clean, readable code.',
    },
    categoryKey: 'foundations',
    level: 'foundations',
    languages: ['en'],
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-12-20T00:00:00.000Z',
    wordCount: 90000,
    href: '/books/clean-code',
    relatedIds: ['book-practical-python'],
  },

  // 10-12. AI articles
  {
    id: 'article-llm-eval-pitfalls',
    slug: 'llm-eval-pitfalls',
    type: 'article',
    status: 'new',
    sourceKind: 'generated',
    titles: {
      he: 'מלכודות בהערכת LLMs',
      en: 'Pitfalls in LLM Evaluation',
    },
    summaries: {
      he: 'מה לא לעשות כשבונים קבוצת evaluation.',
      en: 'What not to do when building an evaluation harness.',
    },
    topics: {
      en: ['LLM', 'Evaluation', 'Best Practices'],
    },
    categoryKey: 'ai-engineering',
    seriesId: 'series-ai-engineering',
    orderInSeries: 6,
    languages: ['he', 'en'],
    createdAt: '2026-04-28T00:00:00.000Z',
    updatedAt: '2026-04-28T00:00:00.000Z',
    readingMinutes: 6,
    wordCount: 1200,
    href: '/articles/llm-eval-pitfalls',
    relatedIds: ['course-ai-engineering'],
  },
  {
    id: 'article-mcp-tool-design',
    slug: 'mcp-tool-design',
    type: 'article',
    status: 'ready',
    sourceKind: 'generated',
    titles: {
      he: 'עיצוב כלים ב-MCP',
      en: 'Tool Design in MCP',
    },
    summaries: {
      en: 'Naming, schemas, and idempotency for MCP tools.',
    },
    topics: {
      en: ['MCP', 'Tool Design', 'Agents'],
    },
    categoryKey: 'ai-systems',
    seriesId: 'series-mcp-systems',
    orderInSeries: 2,
    languages: ['en'],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-22T00:00:00.000Z',
    readingMinutes: 8,
    wordCount: 1600,
    href: '/articles/mcp-tool-design',
    relatedIds: ['book-building-mcp'],
  },
  {
    id: 'article-python-async-pitfalls',
    slug: 'python-async-pitfalls',
    type: 'article',
    status: 'ready',
    sourceKind: 'generated',
    titles: {
      he: 'מלכודות ב-async של Python',
      en: 'Async Pitfalls in Python',
    },
    categoryKey: 'foundations',
    languages: ['en'],
    createdAt: '2026-02-12T00:00:00.000Z',
    updatedAt: '2026-02-15T00:00:00.000Z',
    readingMinutes: 5,
    wordCount: 1000,
    href: '/articles/python-async-pitfalls',
    relatedIds: ['book-practical-python'],
  },

  // 13. Slides
  {
    id: 'slides-rag-overview',
    slug: 'rag-overview-slides',
    type: 'slides',
    status: 'ready',
    sourceKind: 'manual',
    titles: {
      he: 'מצגת - סקירת RAG',
      en: 'Deck - RAG Overview',
    },
    categoryKey: 'ai-systems',
    languages: ['en'],
    createdAt: '2026-01-20T00:00:00.000Z',
    updatedAt: '2026-01-20T00:00:00.000Z',
    href: '/slides/rag-overview',
  },

  // 14. Lab
  {
    id: 'lab-mcp-quickstart',
    slug: 'mcp-quickstart-lab',
    type: 'lab',
    status: 'processing',
    sourceKind: 'pipeline',
    titles: {
      he: 'מעבדה - התחלה מהירה ב-MCP',
      en: 'Lab - MCP Quickstart',
    },
    summaries: {
      en: 'Spin up an MCP server in 15 minutes.',
    },
    categoryKey: 'ai-systems',
    seriesId: 'series-mcp-systems',
    orderInSeries: 3,
    languages: ['en'],
    createdAt: '2026-04-29T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
    href: '/labs/mcp-quickstart',
    relatedIds: ['book-building-mcp'],
  },

  // 15. Transcript
  {
    id: 'transcript-lesson-1',
    slug: 'transcript-lesson-1',
    type: 'transcript',
    status: 'ready',
    sourceKind: 'pipeline',
    titles: {
      he: 'תמלול שיעור 1',
      en: 'Lesson 1 Transcript',
    },
    categoryKey: 'ai-engineering',
    seriesId: 'series-ai-engineering',
    courseSlug: 'ai-engineering',
    languages: ['he'],
    createdAt: '2025-09-15T00:00:00.000Z',
    updatedAt: '2025-09-16T00:00:00.000Z',
    wordCount: 12500,
    href: '/transcripts/lesson-1',
    relatedIds: ['lesson-1-intro-to-ai-engineering'],
  },

  // 16. Document
  {
    id: 'doc-style-guide',
    slug: 'bookforge-style-guide',
    type: 'document',
    status: 'ready',
    sourceKind: 'manual',
    titles: {
      he: 'מדריך סגנון BookForge',
      en: 'BookForge Style Guide',
    },
    languages: ['he', 'en'],
    createdAt: '2025-07-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    href: '/docs/style-guide',
  },

  // 17. Failed item
  {
    id: 'article-broken-import',
    slug: 'broken-article',
    type: 'article',
    status: 'failed',
    sourceKind: 'pipeline',
    titles: {
      en: 'Article With Failed Ingest',
    },
    categoryKey: 'foundations',
    languages: ['en'],
    createdAt: '2026-04-20T00:00:00.000Z',
    updatedAt: '2026-04-20T00:00:00.000Z',
    href: '/articles/broken-article',
  },

  // 18. Archived item
  {
    id: 'book-legacy-intro-to-ml',
    slug: 'legacy-intro-ml',
    type: 'book',
    status: 'archived',
    sourceKind: 'manual',
    titles: {
      he: 'מבוא ישן ל-ML',
      en: 'Legacy Intro to ML',
    },
    categoryKey: 'foundations',
    level: 'foundations',
    languages: ['en'],
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-09-01T00:00:00.000Z',
    wordCount: 40000,
    href: '/books/legacy-intro-ml',
  },
];

// ── Catalog ─────────────────────────────────────────────────────────────────

export const libraryMockCatalog: LibraryCatalog = {
  schemaVersion: 1,
  generatedAt: '2026-05-02T00:00:00.000Z',
  items,
  series,
};
