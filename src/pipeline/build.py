"""
Generates Astro component skeleton for each book chapter.
Creates index page and chapter pages.
"""

from pathlib import Path


def build_skeleton(book_name: str, chapters: list[dict], src_dir: str = "src") -> list[str]:
    pages_dir = Path(src_dir) / "pages" / _slugify(book_name)
    pages_dir.mkdir(parents=True, exist_ok=True)

    created = []

    index = _build_index(book_name, chapters)
    index_file = pages_dir / "index.astro"
    index_file.write_text(index, encoding="utf-8")
    created.append(str(index_file))

    for chapter in chapters:
        content = _build_chapter(book_name, chapter)
        num = str(chapter["number"]).zfill(2)
        chapter_file = pages_dir / f"chapter-{num}.astro"
        chapter_file.write_text(content, encoding="utf-8")
        created.append(str(chapter_file))

    return created


def _build_index(book_name: str, chapters: list[dict]) -> str:
    items = "\n".join([
        f'  <li><a href="/{ _slugify(book_name)}/chapter-{str(c["number"]).zfill(2)}">{c["title"]}</a></li>'
        for c in chapters
    ])
    return f"""---
import Layout from '../../layouts/Layout.astro';
---
<Layout title="{book_name}" lang="he">
  <h1>{book_name}</h1>
  <ul>
{items}
  </ul>
</Layout>
"""


def _build_chapter(book_name: str, chapter: dict) -> str:
    return f"""---
import Layout from '../../../layouts/Layout.astro';
const title = "{chapter['title']}";
---
<Layout title={{title}} lang="he">
  <h1>{{title}}</h1>
  <!-- chapter content loaded from output/{_slugify(book_name)}/chapter-{str(chapter['number']).zfill(2)}.he.md -->
</Layout>
"""


def _slugify(name: str) -> str:
    import re
    name = name.lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_]+", "-", name)
    return name.strip("-")