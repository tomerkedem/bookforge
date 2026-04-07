"""
Organizes chapter markdown files into the output directory.
Creates the folder structure for each book.
"""

import re
from pathlib import Path


def organize(book_name: str, chapters_md: list[dict], output_dir: str = "output") -> list[str]:
    slug = _slugify(book_name)
    book_dir = Path(output_dir) / slug
    book_dir.mkdir(parents=True, exist_ok=True)

    assets_dir = book_dir / "assets"
    assets_dir.mkdir(exist_ok=True)

    created = []

    for chapter in chapters_md:
        num = str(chapter["number"]).zfill(2)
        he_file = book_dir / f"chapter-{num}.he.md"
        he_file.write_text(chapter["content"], encoding="utf-8")
        created.append(str(he_file))

    return created


def _slugify(name: str) -> str:
    name = name.lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_]+", "-", name)
    return name.strip("-")