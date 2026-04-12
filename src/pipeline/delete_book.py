"""
Delete a book from the BookForge output.

Usage:
    python src/pipeline/delete_book.py <book-slug>

What it removes:
    output/<book-slug>/          all chapter MD files, content-structure.json, assets/
    public/covers/<book-slug>.png  cover image (if exists)

Prints a summary of what was deleted.
"""

import sys
import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def delete_book(slug: str) -> None:
    if not slug or "/" in slug or "\\" in slug or slug.startswith("."):
        print(f"ERROR: invalid slug '{slug}'")
        sys.exit(1)

    deleted = []
    missing = []

    # 1. output/<slug>/
    book_dir = REPO_ROOT / "output" / slug
    if book_dir.exists():
        shutil.rmtree(book_dir)
        deleted.append(str(book_dir.relative_to(REPO_ROOT)))
    else:
        missing.append(str(book_dir.relative_to(REPO_ROOT)))

    # 2. public/<slug>/assets/ (images)
    assets_dir = REPO_ROOT / "public" / slug / "assets"
    if assets_dir.exists():
        shutil.rmtree(assets_dir)
        deleted.append(str(assets_dir.relative_to(REPO_ROOT)))
        # Remove empty parent dir if exists
        parent = assets_dir.parent
        if parent.exists() and not any(parent.iterdir()):
            parent.rmdir()
            deleted.append(str(parent.relative_to(REPO_ROOT)))
    else:
        missing.append(str(assets_dir.relative_to(REPO_ROOT)))

    # 3. public/covers/<slug>.png (legacy location)
    cover = REPO_ROOT / "public" / "covers" / f"{slug}.png"
    if cover.exists():
        cover.unlink()
        deleted.append(str(cover.relative_to(REPO_ROOT)))
    else:
        missing.append(str(cover.relative_to(REPO_ROOT)))

    # Report
    if deleted:
        print(f"Deleted ({len(deleted)} paths):")
        for p in deleted:
            print(f"  [ok] {p}")
    if missing:
        print(f"Not found (skipped):")
        for p in missing:
            print(f"  [-] {p}")

    if not deleted:
        print(f"Nothing to delete for book '{slug}'.")
        sys.exit(1)

    print(f"\nBook '{slug}' removed. Run the pipeline to re-process it.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python src/pipeline/delete_book.py <book-slug>")
        sys.exit(1)
    delete_book(sys.argv[1])
