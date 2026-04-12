"""
Full pipeline: Word/PDF → chapters → images → markdown → translate → output.

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
from pipeline.parse import parse, extract_images, to_markdown, DEFAULT_ASSETS_DIR
from pipeline.organize import organize
from pipeline.translate import get_chapters_to_translate, build_translation_prompt, build_batch_prompt


def sync_images_to_english(book_dir: Path, book_name: str):
    """
    Copy correct image references from Hebrew chapters to English chapters.
    English files keep their translated text but get the same images
    at the same positions as the Hebrew source.
    
    Uses absolute paths: /{book_name}/assets/
    """
    img_pattern = re.compile(r'(<img [^>]+/>|!\[[^\]]*\]\([^)]+\))')

    for he_path in sorted(book_dir.glob("chapter-*.he.md")):
        en_path = he_path.with_name(he_path.name.replace(".he.md", ".en.md"))
        if not en_path.exists():
            continue

        he_content = he_path.read_text(encoding="utf-8")
        en_content = en_path.read_text(encoding="utf-8")

        he_images = img_pattern.findall(he_content)
        en_images = img_pattern.findall(en_content)

        if he_images == en_images:
            continue  # Already in sync

        # Remove old images from English
        en_clean = en_content
        for old_img in en_images:
            en_clean = en_clean.replace(old_img + "\n\n", "")
            en_clean = en_clean.replace(old_img + "\n", "")
            en_clean = en_clean.replace(old_img, "")

        # Insert correct images after title line (using absolute path)
        if he_images:
            lines = en_clean.split("\n")
            insert_idx = 2  # After "# Title" and blank line
            for img in reversed(he_images):
                # Ensure absolute path format
                if "../assets/" in img:
                    img = img.replace("../assets/", f"/{book_name}/assets/")
                lines.insert(insert_idx, "")
                lines.insert(insert_idx, img)
            en_clean = "\n".join(lines)

        en_path.write_text(en_clean, encoding="utf-8")
        print(f"  [SYNC] {en_path.name}: {len(en_images)} → {len(he_images)} images")


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
        chapters_md.append({"number": ch["number"], "content": md})
        img_count = md.count("<img ") + md.count("![")
        total_images += img_count
    print(f"  {total_images} images placed across {len(chapters_md)} chapters")

    # Step 5: Organize output (cleans stale files + generates content-structure.json)
    print("\n[5/7] Organize output...")
    created = organize(book_name, chapters_md, output_dir,
                       book_title_he=title_he, book_title_en=title_en,
                       book_title_es=title_es)
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
            print(f"  {len(pending_translations)} chapters need translation")
            print("  >> Batch prompt ready for Translator agent")
        else:
            print("  All chapters already translated (EN files up to date)")

    # Step 7: Sync images to English (no need to copy to public - already there)
    print("\n[7/7] Sync & finalize...")
    sync_images_to_english(book_dir, book_name)
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

    parser = argparse.ArgumentParser(description="BookForge: Word/PDF → Chapters pipeline")
    parser.add_argument("docx_path", help="Path to Word (.docx) or PDF file")
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
