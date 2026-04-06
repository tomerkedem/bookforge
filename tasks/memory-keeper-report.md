# Memory Keeper Report - sample-book

## Status: FAIL

## Files: All present

All 12 required files exist:
- output/sample-book/chapter-01.he.md - EXISTS
- output/sample-book/chapter-02.he.md - EXISTS
- output/sample-book/chapter-03.he.md - EXISTS
- output/sample-book/chapter-01.en.md - EXISTS
- output/sample-book/chapter-02.en.md - EXISTS
- output/sample-book/chapter-03.en.md - EXISTS
- output/sample-book/content-structure.json - EXISTS
- output/sample-book/design-system.json - EXISTS
- src/components/sample-book/ChapterNav.astro - EXISTS
- src/components/sample-book/ReadingProgress.astro - EXISTS
- src/components/sample-book/TableOfContents.astro - EXISTS
- src/pages/sample-book/[chapter].astro - EXISTS

## Consistency: CONFLICT DETECTED

### book_id
- content-structure.json: "sample-book"
- design-system.json: "sample-book"
- Result: CONSISTENT

### Chapter count
- content-structure.json declares total_chapters: 3
- MD files found: chapter-01, chapter-02, chapter-03 (Hebrew + English)
- Result: CONSISTENT

### Chapter title mismatch - chapter-02 (CRITICAL)
- content-structure.json title (he): "פרק 2: הרחבה ופיתוח"
- content-structure.json title (en): "Chapter 2: Expansion and Development"
- chapter-02.he.md heading: "פרק 2: עקרונות מתקדמים"
- chapter-02.en.md heading: "Chapter 2: Advanced Principles"
- Result: CONFLICT - JSON metadata and MD file headings do not match for chapter 2

## Consistency Check Result (JSON)

```json
{
  "consistent": false,
  "conflicts": [
    {
      "description": "Chapter 2 title in content-structure.json does not match the heading in the MD files",
      "existing_decision": "content-structure.json: 'פרק 2: הרחבה ופיתוח' / 'Chapter 2: Expansion and Development'",
      "new_decision": "chapter-02.he.md: 'פרק 2: עקרונות מתקדמים' / chapter-02.en.md: 'Chapter 2: Advanced Principles'"
    }
  ]
}
```

## Summary: All 12 files exist and book_id is consistent, but chapter-02 title conflicts between content-structure.json and the actual MD file headings - requires resolution before proceeding.
