"""
Full pipeline: Word → chapters → images → markdown → translate → output.

Supported format: .docx (Word) only.
PDF is not supported - convert to Word first.

Usage:
    python -m pipeline.build <docx_path> <book_name> [--title-he "..."] [--title-en "..."] [--skip-translate]

Example:
    python -m pipeline.build "D:\\Books\\MyBook.docx" my-book --title-he "הספר שלי" --title-en "My Book"

Run from the project root (bookforge/src/).

Translation:
    Step 5.5 identifies Hebrew chapters needing translation.
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
from pipeline.translate import get_chapters_to_translate, build_translation_prompt, build_batch_prompt


def sync_images_to_translations(book_dir: Path, book_name: str):
    """
    Copy correct image references from Hebrew chapters to all translated chapters.
    Translated files keep their text but get the same images
    at the same positions as the Hebrew source.
    
    Supports: intro.he.md, chapter-XX.he.md
    Languages: English (.en.md), Spanish (.es.md), and future languages.
    Uses absolute paths: /{book_name}/assets/
    """
    # Import target languages from translate module
    from pipeline.translate import TARGET_LANGUAGES
    
    img_pattern = re.compile(r'(<img [^>]+/>|!\[[^\]]*\]\([^)]+\))')
    
    synced_count = 0
    
    # Collect all Hebrew source files (intro + chapters)
    he_files = []
    intro_path = book_dir / "intro.he.md"
    if intro_path.exists():
        he_files.append(intro_path)
    he_files.extend(sorted(book_dir.glob("chapter-*.he.md")))
    
    for he_path in he_files:
        he_content = he_path.read_text(encoding="utf-8")
        he_images = img_pattern.findall(he_content)
        
        # Sync to all target languages
        for lang in TARGET_LANGUAGES:
            lang_code = lang["code"]
            target_path = he_path.with_name(he_path.name.replace(".he.md", f".{lang_code}.md"))
            
            if not target_path.exists():
                continue
            
            target_content = target_path.read_text(encoding="utf-8")
            target_images = img_pattern.findall(target_content)
            
            if he_images == target_images:
                continue  # Already in sync
            
            # Remove old images
            clean_content = target_content
            for old_img in target_images:
                clean_content = clean_content.replace(old_img + "\n\n", "")
                clean_content = clean_content.replace(old_img + "\n", "")
                clean_content = clean_content.replace(old_img, "")
            
            # Insert correct images after title line
            if he_images:
                lines = clean_content.split("\n")
                insert_idx = 2  # After "# Title" and blank line
                for img in reversed(he_images):
                    if "../assets/" in img:
                        img = img.replace("../assets/", f"/{book_name}/assets/")
                    lines.insert(insert_idx, "")
                    lines.insert(insert_idx, img)
                clean_content = "\n".join(lines)
            
            target_path.write_text(clean_content, encoding="utf-8")
            print(f"  [SYNC] {target_path.name}: {len(target_images)} → {len(he_images)} images")
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
                 title_he: str = "", title_en: str = "", title_es: str = "",
                 output_dir: str = "output", skip_translate: bool = False):
    """Run the full book processing pipeline."""

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
    if not title_he and book_info["title"]:
        title_he = book_info["title"]
    subtitle_he = book_info.get("subtitle", "")

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
                       book_title_he=title_he, book_title_en=title_en,
                       book_title_es=title_es, book_subtitle_he=subtitle_he)
    print(f"  Hebrew files: {len(created)}")

    # Step 6: Translate (identify chapters needing translation)
    book_dir = Path(output_dir) / book_name
    pending_translations = []
    batch_prompt = ""
    if skip_translate:
        print("\n[6/7] Translate... SKIPPED (--skip-translate)")
    else:
        print("\n[6/7] Translate...")
        pending_translations = get_chapters_to_translate(str(book_dir))
        if pending_translations:
            batch_prompt = build_batch_prompt(pending_translations)
            # Count by language
            en_count = sum(1 for p in pending_translations if p["lang_code"] == "en")
            es_count = sum(1 for p in pending_translations if p["lang_code"] == "es")
            print(f"  {len(pending_translations)} chapters need translation:")
            if en_count > 0:
                print(f"    - English: {en_count} chapters")
            if es_count > 0:
                print(f"    - Spanish: {es_count} chapters")
            print("  >> Batch prompt ready for Translator agent")
            print("  >> הפעל את סוכן translator כדי לתרגם")
        else:
            print("  All chapters already translated (all languages up to date)")

    # Step 7: Sync images to all translations
    print("\n[7/7] Sync & finalize...")
    sync_images_to_translations(book_dir, book_name)
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


def main():
    # Always resolve output relative to project root (parent of src/)
    project_root = Path(__file__).resolve().parent.parent.parent
    default_output = str(project_root / "output")

    parser = argparse.ArgumentParser(description="BookForge: Word → Chapters pipeline")
    parser.add_argument("docx_path", help="Path to Word (.docx) file")
    parser.add_argument("book_name", help="Book slug name (e.g. my-book)")
    parser.add_argument("--title-he", default="", help="Hebrew title")
    parser.add_argument("--title-en", default="", help="English title")
    parser.add_argument("--title-es", default="", help="Spanish title")
    parser.add_argument("--output-dir", default=default_output, help="Output directory")
    parser.add_argument("--skip-translate", action="store_true",
                        help="Skip translation step (re-parse only)")
    args = parser.parse_args()

    run_pipeline(args.docx_path, args.book_name,
                 title_he=args.title_he, title_en=args.title_en,
                 title_es=args.title_es, output_dir=args.output_dir,
                 skip_translate=args.skip_translate)


if __name__ == "__main__":
    main()
