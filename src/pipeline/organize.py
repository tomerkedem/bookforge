"""
Organizes chapter markdown files into the output directory.
Creates the folder structure for each book.
Cleans stale files from previous runs and generates content-structure.json.
"""

import json
import re
from pathlib import Path


def organize(book_name: str, chapters_md: list[dict], output_dir: str = "output",
             book_title_he: str = "", book_title_en: str = "",
             book_title_es: str = "") -> list[str]:
    slug = _slugify(book_name)
    book_dir = Path(output_dir) / slug
    book_dir.mkdir(parents=True, exist_ok=True)

    # Note: Assets are stored in public/{slug}/assets/, not in output/
    # See parse.py extract_images() for asset handling

    # Clean stale chapter files from previous runs
    _clean_stale_chapters(book_dir, len(chapters_md))

    created = []

    for chapter in chapters_md:
        num = str(chapter["number"]).zfill(2)
        he_file = book_dir / f"chapter-{num}.he.md"
        he_file.write_text(chapter["content"], encoding="utf-8")
        created.append(str(he_file))

    # Generate content-structure.json
    _generate_content_structure(book_dir, chapters_md, book_title_he, book_title_en, book_title_es)

    return created


def _clean_stale_chapters(book_dir: Path, chapter_count: int):
    """Remove chapter files with numbers beyond the current chapter count."""
    for pattern in ["chapter-*.he.md", "chapter-*.en.md"]:
        for f in book_dir.glob(pattern):
            match = re.match(r"chapter-(\d+)\.", f.name)
            if match:
                num = int(match.group(1))
                if num > chapter_count:
                    f.unlink()
                    print(f"  [CLEAN] Removed stale: {f.name}")


def _generate_content_structure(book_dir: Path, chapters_md: list[dict],
                                 book_title_he: str, book_title_en: str,
                                 book_title_es: str):
    """Generate content-structure.json from chapter markdown content."""
    chapters_json = []
    for ch in chapters_md:
        content = ch["content"]
        lines = content.split("\n")

        # Title from first # heading
        title_he = ""
        for line in lines:
            m = re.match(r"^#\s+(.+)", line)
            if m:
                title_he = m.group(1).strip()
                break

        sections = sum(1 for line in lines if re.match(r"^##\s+", line))
        has_images = "<img " in content or "![" in content
        word_count = len(content.split())

        chapters_json.append({
            "id": ch["number"] - 1,
            "title_he": title_he,
            "title_en": title_he,  # Placeholder until translation
            "title_es": title_he,  # Placeholder until translation
            "sections": sections,
            "has_images": has_images,
            "word_count": word_count,
            "topics": []
        })

    data = {
        "book": {
            "title_he": book_title_he or _format_title(book_dir.name),
            "title_en": book_title_en or _format_title(book_dir.name),
            "title_es": book_title_es or book_title_en or _format_title(book_dir.name),
            "chapters": chapters_json
        }
    }

    json_path = book_dir / "content-structure.json"
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  [OK] content-structure.json: {len(chapters_json)} chapters")


def _format_title(slug: str) -> str:
    return slug.replace("-", " ").title()


def _slugify(name: str) -> str:
    name = name.lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_]+", "-", name)
    return name.strip("-")