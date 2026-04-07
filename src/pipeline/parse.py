"""
Splits raw paragraphs into chapters based on headings.
Extracts images from Word documents.
Returns a list of chapters with title, content, and images.
"""

import os
from pathlib import Path


INTRO_KEYWORDS = ["מבוא", "פתיחה", "הקדמה", "introduction", "preface", "foreword"]
COVER_KEYWORDS = ["שער", "cover", "title"]


def parse(ingested: dict) -> list[dict]:
    paragraphs = ingested["paragraphs"]
    chapters = []
    current = None

    for para in paragraphs:
        style = para["style"]
        text = para["text"]

        if "Heading 1" in style:
            if current:
                chapters.append(current)

            chapter_type = _classify_chapter(text, len(chapters))
            current = {
                "number": len(chapters) + 1,
                "title": text,
                "content": [],
                "has_images": False,
                "type": chapter_type
            }
        elif current:
            current["content"].append({
                "text": text,
                "style": style
            })

    if current:
        chapters.append(current)

    return chapters


def _classify_chapter(title: str, index: int) -> str:
    title_lower = title.lower()

    if index == 0 and len(title_lower) < 50:
        for keyword in COVER_KEYWORDS:
            if keyword in title_lower:
                return "cover"

    for keyword in INTRO_KEYWORDS:
        if keyword in title_lower:
            return "intro"

    return "content"


def extract_images(docx_path: str, book_name: str, output_dir: str = "output") -> dict:
    """
    Extracts images from a Word document.
    First image goes to assets/cover.png.
    Chapter images go to assets/.
    Returns a dict mapping image index to file path.
    """
    try:
        from docx import Document
    except ImportError:
        raise ImportError("pip install python-docx")

    doc = Document(docx_path)
    assets_dir = Path(output_dir) / book_name / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    image_map = {}

    for i, rel in enumerate(doc.part.rels.values()):
        if "image" not in rel.reltype:
            continue

        try:
            img_data = rel.target_part.blob
            content_type = rel.target_part.content_type
            ext = content_type.split("/")[-1]
            if ext == "jpeg":
                ext = "jpg"

            if i == 0:
                cover_path = assets_dir / "cover.png"
                with open(cover_path, "wb") as f:
                    f.write(img_data)
                image_map[i] = str(cover_path)
            else:
                img_path = assets_dir / f"image-{str(i).zfill(2)}.{ext}"
                with open(img_path, "wb") as f:
                    f.write(img_data)
                image_map[i] = str(img_path)

        except Exception:
            continue

    return image_map


def to_markdown(chapter: dict) -> str:
    lines = [f"# {chapter['title']}", ""]

    for item in chapter["content"]:
        style = item["style"]
        text = item["text"]

        if "Heading 2" in style:
            lines.append(f"## {text}")
        elif "Heading 3" in style:
            lines.append(f"### {text}")
        elif "List" in style:
            lines.append(f"- {text}")
        else:
            lines.append(text)

        lines.append("")

    return "\n".join(lines)