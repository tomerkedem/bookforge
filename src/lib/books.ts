export interface Book {
  id: string;
  slug: string;
  title: { he: string; en: string };
  description: { he: string; en: string };
  totalChapters: number;
  available: boolean;
  coverColor: string; // Tailwind gradient classes
  lang: 'he' | 'en';
}

export interface ChapterMeta {
  id: string;
  title: { he: string; en: string };
  order: number;
}

export const BOOKS: Book[] = [
  {
    id: 'sample-book',
    slug: 'sample-book',
    title: { he: 'ספר לדוגמה', en: 'Sample Book' },
    description: {
      he: 'ספר דוגמה המציג את יכולות BookForge — חילוץ, תרגום ופרסום דיגיטלי.',
      en: 'A sample book showcasing BookForge capabilities — extraction, translation and digital publishing.',
    },
    totalChapters: 3,
    available: true,
    coverColor: 'from-blue-600 to-indigo-700',
    lang: 'he',
  },
  {
    id: 'ai-developer-fitness',
    slug: 'ai-developer-fitness',
    title: { he: 'כושר לגוף ולקוד', en: 'AI Developer Fitness' },
    description: {
      he: 'מדריך כושר מקצועי לאנשי פיתוח תוכנה — גוף בריא, קוד טוב.',
      en: 'A professional fitness guide for software developers — healthy body, better code.',
    },
    totalChapters: 0,
    available: false,
    coverColor: 'from-emerald-500 to-teal-700',
    lang: 'he',
  },
];

export const CHAPTERS: Record<string, ChapterMeta[]> = {
  'sample-book': [
    { id: 'chapter-01', title: { he: 'פרק 1: מבוא לנושא', en: 'Chapter 1: Introduction' }, order: 1 },
    { id: 'chapter-02', title: { he: 'פרק 2: עקרונות מתקדמים', en: 'Chapter 2: Advanced Principles' }, order: 2 },
    { id: 'chapter-03', title: { he: 'פרק 3: סיכום ומסקנות', en: 'Chapter 3: Summary' }, order: 3 },
  ],
};

export function getBook(slug: string): Book | undefined {
  return BOOKS.find((b) => b.slug === slug);
}

export function getChapters(bookSlug: string): ChapterMeta[] {
  return CHAPTERS[bookSlug] ?? [];
}
