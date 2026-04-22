"""
Organizes chapter markdown files into the output directory.
Creates the folder structure for each book.
Cleans stale files from previous runs and generates book-manifest.json.

Now supports dynamic languages - pass any list of language codes.
"""

import json
import re
from pathlib import Path
from .languages import LANGUAGE_CODES, SOURCE_LANGUAGE


def wrap_hebrew_tables_with_rtl(content: str) -> str:
    """
    Wrap markdown tables in Hebrew content with RTL direction divs.
    
    Detects markdown tables (lines starting/ending with |) and wraps them
    with <div dir="rtl"> ... </div> for proper right-to-left display.
    
    Args:
        content: Markdown content potentially containing tables
        
    Returns:
        Content with tables wrapped in RTL divs
    """
    lines = content.split('\n')
    result = []
    in_table = False
    table_lines = []
    
    for line in lines:
        stripped = line.strip()
        is_table_line = stripped.startswith('|') and stripped.endswith('|')
        
        if is_table_line and not in_table:
            # Start of a new table
            in_table = True
            table_lines = [line]
        elif is_table_line and in_table:
            # Continuation of current table
            table_lines.append(line)
        elif in_table and not is_table_line:
            # End of table - wrap it with RTL div
            result.append('<div dir="rtl">')
            result.append('')
            result.extend(table_lines)
            result.append('')
            result.append('</div>')
            result.append(line)  # Add the non-table line
            in_table = False
            table_lines = []
        else:
            # Regular line, not in table
            result.append(line)
    
    # Handle case where file ends with a table
    if in_table and table_lines:
        result.append('<div dir="rtl">')
        result.append('')
        result.extend(table_lines)
        result.append('')
        result.append('</div>')
    
    return '\n'.join(result)


def organize(book_name: str, chapters_md: list[dict], output_dir: str = "output",
             languages: list[str] = None,
             book_titles: dict[str, str] = None,
             book_subtitles: dict[str, str] = None,
             book_authors: dict[str, str] = None,
             book_descriptions: dict[str, str] = None) -> list[str]:
    """
    Organize chapter files into output directory.
    
    Args:
        book_name: Name of the book (used for folder/slug)
        chapters_md: List of chapter dicts with 'content' and optional 'type'
        output_dir: Base output directory
        languages: List of language codes to support (default: all from config)
        book_titles: Dict of {lang: title} for book titles
        book_subtitles: Dict of {lang: subtitle} for book subtitles
        book_authors: Dict of {lang: author} for book author/credits
        book_descriptions: Dict of {lang: description} for book descriptions
    """
    if languages is None:
        languages = LANGUAGE_CODES
    if book_titles is None:
        book_titles = {}
    if book_subtitles is None:
        book_subtitles = {}
    if book_authors is None:
        book_authors = {}
    if book_descriptions is None:
        book_descriptions = {}
        
    slug = _slugify(book_name)
    book_dir = Path(output_dir) / slug
    book_dir.mkdir(parents=True, exist_ok=True)

    # Note: Assets are stored in public/{slug}/assets/, not in output/
    # See parse.py extract_images() for asset handling

    # Clean stale chapter files from previous runs (for all languages)
    _clean_stale_chapters(book_dir, chapters_md, languages)

    created = []
    content_chapter_num = 0  # Counter for regular chapters (not intro)

    for chapter in chapters_md:
        chapter_type = chapter.get("type", "content")
        
        if chapter_type == "intro":
            # Introduction saved as intro.he.md
            he_file = book_dir / "intro.he.md"
            print(f"  [INTRO] מבוא נשמר כ-intro.he.md")
        else:
            # Regular chapters numbered from 01
            content_chapter_num += 1
            num = str(content_chapter_num).zfill(2)
            he_file = book_dir / f"chapter-{num}.he.md"
        
        # Wrap Hebrew tables with RTL direction for proper display
        content_with_rtl = wrap_hebrew_tables_with_rtl(chapter["content"])
        he_file.write_text(content_with_rtl, encoding="utf-8")
        created.append(str(he_file))

    # Generate book-manifest.json with dynamic language support
    _generate_content_structure(book_dir, chapters_md, languages, book_titles, book_subtitles, book_authors, book_descriptions)

    return created


def _clean_stale_chapters(book_dir: Path, chapters_md: list[dict], languages: list[str]):
    """
    Remove chapter files from previous runs that no longer correspond to
    the current book's chapter list.

    Rules:
    - Count only content chapters (not intro) when deciding valid
      chapter numbers. Content chapters are numbered 01..N where N
      is the count of content chapters.
    - Delete chapter-XX files whose number exceeds N.
    - Delete intro.{lang}.md if the current book has no intro chapter
      but a stale one exists from a previous run.

    Previously this function used `chapter_count - 1` which assumed an
    intro always exists, silently leaving stale files behind when it did not.
    """
    content_chapter_count = sum(
        1 for ch in chapters_md if ch.get("type", "content") != "intro"
    )
    has_intro = any(ch.get("type") == "intro" for ch in chapters_md)

    for lang in languages:
        # Clean stale chapter-XX files beyond the current count
        for f in book_dir.glob(f"chapter-*.{lang}.md"):
            match = re.match(r"chapter-(\d+)\.", f.name)
            if match:
                num = int(match.group(1))
                if num > content_chapter_count:
                    f.unlink()
                    print(f"  [CLEAN] Removed stale: {f.name}")

        # Remove a stale intro file if the current book no longer has an intro
        if not has_intro:
            intro_file = book_dir / f"intro.{lang}.md"
            if intro_file.exists():
                intro_file.unlink()
                print(f"  [CLEAN] Removed stale: {intro_file.name}")


def _generate_content_structure(book_dir: Path, chapters_md: list[dict],
                                 languages: list[str],
                                 book_titles: dict[str, str],
                                 book_subtitles: dict[str, str],
                                 book_authors: dict[str, str],
                                 book_descriptions: dict[str, str]):
    """Generate book-manifest.json from chapter markdown content with dynamic language support."""
    chapters_json = []
    content_chapter_num = 0  # Counter for regular chapters
    default_title = _format_title(book_dir.name)
    
    for ch in chapters_md:
        content = ch["content"]
        lines = content.split("\n")
        chapter_type = ch.get("type", "content")

        # Title from first # heading (source language)
        title_source = ""
        for line in lines:
            m = re.match(r"^#\s+(.+)", line)
            if m:
                title_source = m.group(1).strip()
                break

        sections = sum(1 for line in lines if re.match(r"^##\s+", line))
        has_images = "<img " in content or "![" in content
        word_count = len(content.split())

        if chapter_type == "intro":
            chapter_id = "intro"
            file_slug = "intro"
        else:
            content_chapter_num += 1
            chapter_id = content_chapter_num
            file_slug = f"chapter-{str(content_chapter_num).zfill(2)}"

        # Build titles dict for all languages (placeholder until translation)
        chapter_titles = {lang: title_source for lang in languages}

        chapter_entry = {
            "id": chapter_id,
            "file_slug": file_slug,
            "type": chapter_type,
            "titles": chapter_titles,
            "sections": sections,
            "has_images": has_images,
            "word_count": word_count,
            "topics": []
        }
        chapters_json.append(chapter_entry)

    # Build book-level titles/subtitles/descriptions for all languages
    titles = {}
    subtitles = {}
    descriptions = {}
    authors = {}

    for lang in languages:
        titles[lang] = book_titles.get(lang) or book_titles.get(SOURCE_LANGUAGE) or default_title
        subtitles[lang] = book_subtitles.get(lang) or book_subtitles.get(SOURCE_LANGUAGE) or ""
        descriptions[lang] = book_descriptions.get(lang) or book_descriptions.get(SOURCE_LANGUAGE) or ""
        authors[lang] = book_authors.get(lang) or book_authors.get(SOURCE_LANGUAGE) or ""

    book_data = {
        "titles": titles,
        "subtitles": subtitles,
        "descriptions": descriptions,
        "chapters": chapters_json,
        "languages": languages
    }

    # Only add credits when there's an author; Astro reads book.credits.author
    if any(authors.values()):
        book_data["credits"] = {"author": authors}

    data = {"book": book_data}

    json_path = book_dir / "book-manifest.json"
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  [OK] book-manifest.json: {len(chapters_json)} chapters, {len(languages)} languages")


def _format_title(slug: str) -> str:
    return slug.replace("-", " ").title()


def _slugify(name: str) -> str:
    name = name.lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_]+", "-", name)
    return name.strip("-")