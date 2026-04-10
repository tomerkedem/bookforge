# Yuval Platform - Astro Components Documentation

## Overview

This document describes all Astro components and pages for the Yuval digital reading platform. The platform supports Hebrew (RTL) and English (LTR) with mobile-first responsive design, View Transitions for smooth navigation, and full accessibility compliance.

## Components

### BackToTop.astro

Floating button that appears after scrolling past a configurable threshold. Smoothly scrolls user back to the top of the page.

Props:
- threshold?: number - Scroll distance in pixels before button appears (default: 300)

Features:
- Smooth show/hide animation with opacity and translate
- requestAnimationFrame-throttled scroll listener
- Accessible focus-visible ring
- Passive scroll event for performance

### BookCard.astro

Displays a book with cover image, title, description, and call-to-action button.

Props:
- slug: string - Book URL slug
- title_he: string - Hebrew title
- title_en: string - English title
- description_he: string - Hebrew description
- description_en: string - English description
- coverImage: string - Image URL
- dominantColor?: string - Overlay color on hover
- class?: string - Additional CSS classes

Features:
- Dominant color overlay on hover
- Card-float effect with layered shadows
- Responsive image handling
- Accessible focus states
- Smooth transitions

### Breadcrumbs.astro

Breadcrumb navigation trail with bilingual labels and proper ARIA markup.

Props:
- items: BreadcrumbItem[] - Array of { label_he, label_en, href? }
- class?: string - Additional CSS classes

Features:
- aria-label="Breadcrumb" and aria-current="page" on last item
- RTL chevron rotation via Tailwind rtl: modifier
- Truncation on mobile (max-w-[200px])
- Focus-visible ring on links
- data-he / data-en for language switching

### ChapterMeta.astro

Reusable chapter metadata bar displayed below the chapter title. Shows word count, estimated reading time, and number of sections with matching icons.

Props:
- wordCount: number - Total word count
- readingTimeMinutes: number - Estimated reading time in minutes
- sections: number - Number of sections
- language: Language - Current language ('he' or 'en')

Features:
- Inline SVG icons for each metric
- RTL-aware layout (row-reverse for Hebrew)
- Responsive wrapping on small screens
- Accessible (aria-hidden on decorative icons)

### ChapterNavigation.astro

Navigation between chapters with previous/next buttons and chapter info.

Props:
- currentChapterId: number
- chapters: Chapter[]
- bookSlug: string
- language?: Language

Features:
- Previous/next links with chapter titles
- Current chapter indicator (center)
- RTL-aware arrow direction
- Focus ring for keyboard navigation

### ChapterSidebars.astro

Dual sidebar layout: table of contents on one side, chapter outline on the other. On mobile, collapses into a bottom drawer with tab navigation.

Features:
- Desktop: fixed sidebars with scroll
- Mobile: drawer with body scroll lock
- ARIA tab/tabpanel roles on mobile drawer
- Language-aware active chapter highlighting

### Header.astro

Sticky header with logo, theme toggle, and language toggle.

Props:
- language?: Language
- showLanguageToggle?: boolean
- class?: string

Features:
- Skip-to-content link for keyboard users
- Backdrop blur effect
- Focus-visible ring on logo
- RTL flex-row-reverse

### LanguageToggle.astro

Bilingual language switch for Hebrew/English.

Props:
- currentLanguage?: Language

Features:
- localStorage persistence
- Custom event dispatch ('language-changed')
- Focus-visible ring on buttons
- Visual active state indicator

### ReadingProgress.astro

Sticky progress bar showing reading progress in current chapter.

Props:
- scrollPercentage?: number
- language?: Language
- class?: string

Features:
- Automatic scroll tracking
- Accessible ARIA labels
- Smooth progress animation

## Layouts

### BaseLayout.astro

Root layout for all pages.

Features:
- Astro View Transitions (ClientRouter)
- Dark mode FOUC prevention script
- Google Fonts with display=swap
- color-scheme meta for scrollbars
- Skip-to-content target (#main-content)
- BackToTop component
- Smooth scrolling (scroll-smooth on html)
- Language persistence across navigations
- Open Graph and Schema.org meta

### ReadingLayout.astro

Specialized layout for chapter reading.

Features:
- optimized typography (prose styles)
- highlight.js syntax highlighting (GitHub Dark)
- Code copy button on all pre blocks
- Lazy-loaded content images
- LTR code blocks in RTL pages
- Language badge on code blocks
- Re-initializes on view transitions

## Pages

### index.astro (/)

Homepage displaying all available books in a grid layout. Includes empty state with book icon and guidance text.

### books/[slug].astro (/books/:slug)

Book detail page with breadcrumbs, cover image (lazy-loaded), metadata, and chapter list.

### read/[book]/[chapter].astro (/read/:book/:chapter)

Chapter reading page with breadcrumbs, sticky chapter header, dual sidebars, code copy buttons, and chapter navigation.

### 404.astro

Custom 404 page with large "404" display, explanation text, and back-to-home button.

## Scripts (src/scripts/)

### reading-page.ts
Thin init that wires up the three reading modules. Handles AbortController cleanup on page transitions.

### language-switcher.ts
Language switching via data-lang attributes. Listens to 'language-changed' custom events.

### progress-tracker.ts
Reading progress with debounced scroll save and back/forward history restore.

### sticky-header.ts
Sticky header scroll behavior with threshold-based class toggling.

## Theme (src/styles/theme.css)

Single source of truth for all light/dark CSS custom properties. Includes:
- Color tokens for bg, text, border, accent, highlight
- Fade-in-up animation for main content
- prefers-reduced-motion media query
- Default transitions on interactive elements

### read/[book]/[chapter].astro (/read/:book/:chapter)

Reading page for individual chapters with full typography and navigation.

## Utilities

### language.ts

Language management utilities for RTL/LTR switching and localStorage persistence.

### reading-progress.ts

Reading progress tracking and scroll position restoration.

### data-loader.ts

Data loading utilities for books and chapters from various sources.

## Design System Integration

All components use Tailwind CSS with custom colors:

Color Classes:
- text-yuval-text - Primary text (#1a1a1a)
- text-yuval-text-secondary - Secondary text (#4a4a4a)
- text-yuval-text-tertiary - Tertiary text (#888888)
- bg-yuval-bg - Primary background (#ffffff)
- bg-yuval-bg-secondary - Secondary background (#fafaf8)
- border-yuval-border - Primary border (#f0ede8)

Font Classes:
- font-heading - Frank Ruhl Libre (headings)
- font-body - Heebo (body text)
- font-code - JetBrains Mono (code)

## Mobile-First Design

All components use mobile-first CSS:
1. Base styles for mobile
2. sm: for tablets (640px+)
3. lg: for desktop (1024px+)

## Language Support

RTL/LTR Handling:
- Hebrew content uses dir="rtl" and text-right
- English content uses dir="ltr" and text-left
- Flex directions reverse for RTL
- Arrow icons flip direction

## Accessibility

All components follow WCAG AA guidelines:
- Proper semantic HTML
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
