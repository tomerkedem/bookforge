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

from pipeline.ingest import ingest
from pipeline.parse import parse, extract_images, to_markdown, extract_book_info, DEFAULT_ASSETS_DIR
from pipeline.organize import organize
from pipeline.translate import get_chapters_to_translate, build_translation_prompt, build_batch_prompt, fix_all_hebrew_files, update_content_structure_titles
from pipeline.languages import (
    SUPPORTED_LANGUAGES,
    LANGUAGE_CODES,
    SOURCE_LANGUAGE,
    get_target_languages,
    get_language_meta,
    parse_languages_arg,
)


def sync_images_to_translations(book_dir: Path, book_name: str, languages: list[str] = None):
    """
    Copy correct image references from source language chapters to all translated chapters.
    Translated files keep their text but get the same images
    at the same positions as the source file.
    
    Supports: intro.{lang}.md, chapter-XX.{lang}.md
    Languages: All configured languages.
    Uses absolute paths: /{book_name}/assets/
    """
    if languages is None:
        languages = LANGUAGE_CODES
    
    target_languages = [l for l in languages if l != SOURCE_LANGUAGE]
    
    img_pattern = re.compile(r'(<img [^>]+/>|!\[[^\]]*\]\([^)]+\))')
    
    synced_count = 0
    
    # Collect all source language files (intro + chapters)
    source_files = []
    intro_path = book_dir / f"intro.{SOURCE_LANGUAGE}.md"
    if intro_path.exists():
        source_files.append(intro_path)
    source_files.extend(sorted(book_dir.glob(f"chapter-*.{SOURCE_LANGUAGE}.md")))
    
    for source_path in source_files:
        source_content = source_path.read_text(encoding="utf-8")
        source_images = img_pattern.findall(source_content)
        
        # Sync to all target languages
        for lang_code in target_languages:
            target_path = source_path.with_name(source_path.name.replace(f".{SOURCE_LANGUAGE}.md", f".{lang_code}.md"))
            
            if not target_path.exists():
                continue
            
            target_content = target_path.read_text(encoding="utf-8")
            target_images = img_pattern.findall(target_content)
            
            if source_images == target_images:
                continue  # Already in sync
            
            # Remove old images
            clean_content = target_content
            for old_img in target_images:
                clean_content = clean_content.replace(old_img + "\n\n", "")
                clean_content = clean_content.replace(old_img + "\n", "")
                clean_content = clean_content.replace(old_img, "")
            
            # Insert correct images after title line
            if source_images:
                lines = clean_content.split("\n")
                insert_idx = 2  # After "# Title" and blank line
                for img in reversed(source_images):
                    if "../assets/" in img:
                        img = img.replace("../assets/", f"/{book_name}/assets/")
                    lines.insert(insert_idx, "")
                    lines.insert(insert_idx, img)
                clean_content = "\n".join(lines)
            
            target_path.write_text(clean_content, encoding="utf-8")
            print(f"  [SYNC] {target_path.name}: {len(target_images)} → {len(source_images)} images")
            synced_count += 1
    
    return synced_count


# Backward compatibility alias
def sync_images_to_english(book_dir: Path, book_name: str):
    """Deprecated: Use sync_images_to_translations instead."""
    return sync_images_to_translations(book_dir, book_name)


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

    # Step 1: Ingest
    print("\n[1/7] Ingest...")
    ingested = ingest(docx_path)
    print(f"  Paragraphs: {ingested['total']}")
    
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
    non_cover = [p for p in images["positions"] if p[0] >= 0]
    print(f"  Images: {len(non_cover)} chapter + {'1 cover' if images['has_cover'] else 'no cover'}")
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
        img_count = md.count("<img ") + md.count("![")
        total_images += img_count
    print(f"  {total_images} images placed across {len(chapters_md)} chapters")

    # Step 5: Organize output (cleans stale files + generates content-structure.json)
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
    sync_images_to_translations(book_dir, book_name, languages)
    # Assets already in public/{book}/assets/ - no copy needed

    print(f"\n{'=' * 60}")
    print(f"Done! {len(chapters)} chapters, {total_images} images")
    if pending_translations:
        print(f"ACTION REQUIRED: {len(pending_translations)} chapters need Translator agent")
    print(f"Output: {book_dir}")
    print(f"{'=' * 60}")

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
    Finalize book after translations: update content-structure.json and sync.
    
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
    
    # Update content-structure.json with translated titles
    updated = update_content_structure_titles(str(book_dir), languages)
    print(f"  Updated {updated} titles in content-structure.json")
    
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
