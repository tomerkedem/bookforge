"""
Full pipeline: Word → chapters → images → markdown → translate → output.

Supported format: .docx (Word) only.
PDF is not supported - convert to Word first.

Usage:
    python -m pipeline.build <docx_path> <book_name> [--title "..."] [--languages he,en,es,fr]

Example:
    python -m pipeline.build "D:\\Books\\MyBook.docx" my-book --title "הספר שלי" --languages he,en,es

Run from the project root (bookforge/src/).

Translation:
    Step 5.5 identifies chapters needing translation for all specified languages.
    When run from Copilot, the Translator agent handles translation.
    Use --skip-translate to skip translation (e.g., for re-parse only).
"""

import argparse
import re
import shutil
import sys
from pathlib import Path

# Ensure src/ is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.ingest import ingest_and_write_json
from pipeline.parse import (
    parse,
    extract_images,
    to_markdown,
    extract_book_info,
    DEFAULT_ASSETS_DIR,
    reset_clean_stats,
    dump_clean_stats,
)
from pipeline.organize import organize
from pipeline.translate import get_chapters_to_translate, build_batch_prompt, fix_all_hebrew_files, update_content_structure_titles
from pipeline.languages import (
    SUPPORTED_LANGUAGES,
    LANGUAGE_CODES,
    SOURCE_LANGUAGE,
    get_target_languages,
    get_language_meta,
    parse_languages_arg,
)


def copy_assets_to_public(book_slug: str, output_dir: str = "output"):
    """
    DEPRECATED: Assets are now saved directly to public/{book}/assets/.
    This function is kept for backward compatibility but does nothing.
    """
    pass  # No longer needed - images go directly to public/


def run_pipeline(docx_path: str, book_name: str,
                 title: str = "", languages: list[str] = None,
                 output_dir: str = "output", skip_translate: bool = False):
    """
    Run the full book processing pipeline.
    
    Args:
        docx_path: Path to Word document
        book_name: Book slug name
        title: Book title (source language)
        languages: List of language codes to support (default: all from config)
        output_dir: Output directory path
        skip_translate: Skip translation step
    """
    if languages is None:
        languages = LANGUAGE_CODES
    else:
        # Validate and filter languages
        languages = [l for l in languages if l in LANGUAGE_CODES or l == SOURCE_LANGUAGE]
        if SOURCE_LANGUAGE not in languages:
            languages.insert(0, SOURCE_LANGUAGE)  # Always include source

    print(f"{'=' * 60}")
    print(f"BookForge Pipeline: {book_name}")
    print(f"{'=' * 60}")

    # Reset instrumentation counters. The parse module tracks how many
    # times each markdown-cleanup rule fires, so we can see which rules
    # are still needed after the ingest fix. Counters are dumped at
    # the end of this run to clean_markdown_stats.json.
    reset_clean_stats()

    # Step 1: Ingest
    print("\n[1/7] Ingest...")
    book_dir = Path(output_dir) / book_name
    book_dir.mkdir(parents=True, exist_ok=True)

    ingested = ingest_and_write_json(
        file_path=docx_path,
        output_path=book_dir / "book-manifest.json",
        language=SOURCE_LANGUAGE,
    )

    print(f"  Blocks: {ingested.get('total_blocks', 0)}")
    
    # Extract book info from cover page (title + subtitle)
    book_info = extract_book_info(ingested)
    if book_info["title"]:
        print(f"  כותרת: {book_info['title']}")
    if book_info["subtitle"]:
        print(f"  תת-כותרת: {book_info['subtitle']}")
    
    # Use extracted title if not provided via CLI
    source_title = title or book_info.get("title", "")
    source_subtitle = book_info.get("subtitle", "")
    
    # Build titles/subtitles dicts for all languages
    book_titles = {SOURCE_LANGUAGE: source_title} if source_title else {}
    book_subtitles = {SOURCE_LANGUAGE: source_subtitle} if source_subtitle else {}

    # Step 2: Parse chapters
    print("\n[2/7] Parse chapters...")
    chapters = parse(ingested)
    print(f"  Chapters: {len(chapters)}")

    # Step 3: Extract images (saved directly to public/{book}/assets/)
    print("\n[3/7] Extract images...")
    images = extract_images(docx_path, book_name, DEFAULT_ASSETS_DIR)
    chapter_images = [p for p in images["positions"] if p[3] != "cover.png"]
    cover_text = "1 cover" if images.get("has_cover") else "no cover"
    print(f"  Images: {len(chapter_images)} chapter + {cover_text}")
    print(f"  Saved to: public/{book_name}/assets/")

    # Step 4: Generate markdown with images (absolute paths: /{book}/assets/)
    print("\n[4/7] Generate markdown...")
    chapters_md = []
    total_images = 0
    for i, ch in enumerate(chapters):
        next_idx = chapters[i + 1].get("heading_doc_index") if i + 1 < len(chapters) else None
        md = to_markdown(ch, images["positions"], next_heading_idx=next_idx, book_name=book_name)
        chapters_md.append({
            "number": ch["number"],
            "content": md,
            "type": ch.get("type", "content")  # intro, cover, or content
        })
        img_count = md.count("<img ")
        total_images += img_count
    print(f"  {total_images} images placed across {len(chapters_md)} chapters")

    # Step 5: Organize output (cleans stale files + generates book-manifest.json)
    print("\n[5/7] Organize output...")
    created = organize(book_name, chapters_md, output_dir,
                       languages=languages,
                       book_titles=book_titles,
                       book_subtitles=book_subtitles)
    print(f"  Source files: {len(created)}")
    print(f"  Languages: {', '.join(languages)}")
    
    # Step 5.5: Fix RTL issues and dashes in all files
    book_dir = Path(output_dir) / book_name
    fix_count = fix_all_hebrew_files(str(book_dir))
    if fix_count > 0:
        print(f"  Fixed RTL/dashes in {fix_count} files")

    # Step 6: Translate (identify chapters needing translation)
    target_languages = [l for l in languages if l != SOURCE_LANGUAGE]
    pending_translations = []
    batch_prompt = ""
    if skip_translate:
        print("\n[6/7] Translate... SKIPPED (--skip-translate)")
    else:
        print("\n[6/7] Translate...")
        pending_translations = get_chapters_to_translate(str(book_dir), target_languages)
        if pending_translations:
            batch_prompt = build_batch_prompt(pending_translations, target_languages)
            # Count by language dynamically
            lang_counts = {}
            for p in pending_translations:
                lang_counts[p["lang_code"]] = lang_counts.get(p["lang_code"], 0) + 1
            
            print(f"  {len(pending_translations)} chapters need translation:")
            for lang_code, count in sorted(lang_counts.items()):
                lang_meta = get_language_meta(lang_code)
                lang_name = lang_meta.label_en if lang_meta else lang_code
                print(f"    - {lang_name}: {count} chapters")
            print("  >> Batch prompt ready for Translator agent")
            print("  >> הפעל את סוכן translator כדי לתרגם")
        else:
            print("  All chapters already translated (all languages up to date)")

    # Step 7: Sync images to all translations
    print("\n[7/7] Sync & finalize...")
   
    # Assets already in public/{book}/assets/ - no copy needed

    print(f"\n{'=' * 60}")
    print(f"Done! {len(chapters)} chapters, {total_images} images")
    if pending_translations:
        print(f"ACTION REQUIRED: {len(pending_translations)} chapters need Translator agent")
    print(f"Output: {book_dir}")
    print(f"{'=' * 60}")

    # Dump markdown cleanup statistics. The resulting JSON shows how many
    # times each cleanup rule in parse.py actually fired on this run, so
    # we can decide which rules are still needed and which are dead code.
    stats_path = book_dir / "clean_markdown_stats.json"
    dump_clean_stats(str(stats_path))
    print(f"Cleanup stats: {stats_path}")

    return {
        "chapters": len(chapters),
        "images": total_images,
        "has_cover": images["has_cover"],
        "output_dir": str(book_dir),
        "pending_translations": pending_translations,
        "batch_prompt": batch_prompt,
    }


def finalize_book(book_name: str, languages: list[str] = None, output_dir: str = "output"):
    """
    Finalize book after translations: update book-manifest.json and sync.
    
    Call this after Translator agent completes all translations.
    
    Args:
        book_name: Book slug name
        languages: List of language codes (default: all from config)
        output_dir: Output directory path
    """
    if languages is None:
        languages = LANGUAGE_CODES
    
    project_root = Path(__file__).resolve().parent.parent.parent
    book_dir = project_root / output_dir / book_name
    
    if not book_dir.exists():
        print(f"❌ Book directory not found: {book_dir}")
        return
    
    print(f"Finalizing {book_name}...")
    
    # Update book-manifest.json with translated titles
    updated = update_content_structure_titles(str(book_dir), languages)
    print(f"  Updated {updated} titles in book-manifest.json")
    
    # Sync to src/output
    src_output = project_root / "src" / "output" / book_name
    if src_output.exists():
        shutil.rmtree(src_output)
    shutil.copytree(book_dir, src_output)
    print(f"  Synced to {src_output}")
    
    print("✓ Finalize complete")


def main():
    # Always resolve output relative to project root (parent of src/)
    project_root = Path(__file__).resolve().parent.parent.parent
    default_output = str(project_root / "output")
    default_languages = ",".join(LANGUAGE_CODES)

    parser = argparse.ArgumentParser(description="BookForge: Word → Chapters pipeline")
    parser.add_argument("docx_path", nargs='?', help="Path to Word (.docx) file")
    parser.add_argument("book_name", help="Book slug name (e.g. my-book)")
    parser.add_argument("--title", default="", help="Book title (source language)")
    parser.add_argument("--languages", default=default_languages,
                        help=f"Comma-separated language codes (default: {default_languages})")
    parser.add_argument("--output-dir", default=default_output, help="Output directory")
    parser.add_argument("--skip-translate", action="store_true",
                        help="Skip translation step (re-parse only)")
    parser.add_argument("--finalize", action="store_true",
                        help="Run finalize only (after translations done)")
    args = parser.parse_args()

    # Parse language codes
    languages = parse_languages_arg(args.languages)
    if not languages:
        print(f"❌ No valid languages specified. Supported: {', '.join(LANGUAGE_CODES)}")
        sys.exit(1)

    if args.finalize:
        # Finalize mode: just update titles and sync
        finalize_book(args.book_name, languages, args.output_dir)
    elif not args.docx_path:
        print("❌ docx_path is required unless using --finalize")
        sys.exit(1)
    else:
        run_pipeline(args.docx_path, args.book_name,
                     title=args.title, languages=languages,
                     output_dir=args.output_dir,
                     skip_translate=args.skip_translate)


if __name__ == "__main__":
    main()