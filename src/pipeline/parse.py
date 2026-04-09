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

    for idx, para in enumerate(paragraphs):
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
                "style": style,
                "para_index": idx  # Track paragraph position for image mapping
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
    Extracts images from a Word document and maps them to paragraph positions.
    The FIRST image by document position (lowest para_idx) becomes cover.png.
    Other images are numbered by their appearance order.
    Returns a dict with:
      - 'files': mapping rel_id to file path
      - 'positions': list of (paragraph_index, rel_id, filename)
    """
    try:
        from docx import Document
        from docx.oxml import parse_xml
    except ImportError:
        raise ImportError("pip install python-docx")

    doc = Document(docx_path)
    assets_dir = Path(output_dir) / book_name / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Build rel_id to image data mapping
    image_data = {}
    for rel_id, rel in doc.part.rels.items():
        if "image" not in rel.reltype:
            continue
        try:
            img_data = rel.target_part.blob
            content_type = rel.target_part.content_type
            ext = content_type.split("/")[-1]
            if ext == "jpeg":
                ext = "jpg"
            image_data[rel_id] = {"data": img_data, "ext": ext}
        except Exception:
            continue

    # Step 2: Map images to paragraph positions (find where each image appears)
    image_positions_temp = []  # (para_idx, rel_id)
    for para_idx, para in enumerate(doc.paragraphs):
        for run in para.runs:
            run_xml = run._element.xml.decode('utf-8') if isinstance(run._element.xml, bytes) else run._element.xml
            if '<w:drawing' in run_xml or '<w:pict' in run_xml:
                for rel_id in image_data.keys():
                    if rel_id in run_xml:
                        image_positions_temp.append((para_idx, rel_id))
                        break

    # Step 3: Sort by paragraph position to get document order
    image_positions_temp.sort(key=lambda x: x[0])

    # Step 4: Save images - FIRST by position = cover.png, rest = image-XX
    image_files = {}
    image_positions = []
    
    for idx, (para_idx, rel_id) in enumerate(image_positions_temp):
        img_info = image_data[rel_id]
        
        if idx == 0:
            # First image by POSITION (not by rel_id order) = cover
            cover_path = assets_dir / "cover.png"
            with open(cover_path, "wb") as f:
                f.write(img_info["data"])
            image_files[rel_id] = str(cover_path)
            filename = "cover.png"
        else:
            # Subsequent images numbered by appearance order
            img_path = assets_dir / f"image-{str(idx).zfill(2)}.{img_info['ext']}"
            with open(img_path, "wb") as f:
                f.write(img_info["data"])
            image_files[rel_id] = str(img_path)
            filename = f"image-{str(idx).zfill(2)}.{img_info['ext']}"
        
        image_positions.append((para_idx, rel_id, filename))

    return {
        'files': image_files,
        'positions': image_positions
    }


def to_markdown(chapter: dict, image_positions: list = None) -> str:
    """
    Convert chapter to Markdown with embedded images at correct positions.
    
    Args:
        chapter: Chapter dict with title and content blocks
        image_positions: List of (para_index, rel_id, filename) tuples
    """
    lines = [f"# {chapter['title']}", ""]
    
    # Build a map of para_index to image filenames for quick lookup
    image_map = {}
    if image_positions:
        for para_idx, rel_id, filename in image_positions:
            if para_idx not in image_map:
                image_map[para_idx] = []
            image_map[para_idx].append(filename)

    for item in chapter["content"]:
        style = item["style"]
        text = item["text"]
        para_idx = item.get("para_index")
        
        # Insert images that appear at this paragraph position
        if para_idx is not None and para_idx in image_map:
            for img_filename in image_map[para_idx]:
                lines.append(f"![{img_filename}](../assets/{img_filename})")
                lines.append("")

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