#!/usr/bin/env python3
"""
Extract intro and chapter 1 exactly as they appear in the source,
without modifications or transformations.
"""
import sys
sys.path.insert(0, 'src')

from pathlib import Path
from pipeline.ingest import ingest
from pipeline.parse import parse, extract_book_info, extract_images

INPUT_FILE = r"D:\Books\Practical Python for AI Engineering.docx"
BOOK_SLUG = "practical-python-for-ai-engineering"
OUTPUT_BASE = "output"

print("Extracting intro and chapter 1 exactly as they appear in the source...")
print()

# Ingest and parse
ingested = ingest(INPUT_FILE)
book_info = extract_book_info(ingested)
image_data = extract_images(INPUT_FILE, BOOK_SLUG, "public")
image_positions = image_data.get("positions", [])
chapters = parse(ingested)

output_dir = Path(OUTPUT_BASE) / BOOK_SLUG
output_dir.mkdir(parents=True, exist_ok=True)

# Simple conversion without transformation
def simple_to_markdown(chapter, chapter_num):
    """Convert chapter to markdown without any cleaning or transformations."""
    lines = [f"# {chapter['title']}", ""]
    
    for item in chapter.get('content', []):
        style = item.get('style', '')
        text = item.get('text', '')
        
        if style == 'Spacing':
            lines.append("")
        elif 'Heading 2' in style:
            lines.append(f"## {text}")
            lines.append("")
        elif 'Heading 3' in style:
            lines.append(f"### {text}")
            lines.append("")
        else:
            # Just add the text as-is, no transformations
            lines.append(text)
            lines.append("")
    
    return '\n'.join(lines)

# Extract intro
for idx, ch in enumerate(chapters):
    if ch.get('type') == 'intro':
        print(f"✓ Extracting intro: {ch.get('title')}")
        md = simple_to_markdown(ch, 0)
        intro_path = output_dir / "intro.he.md"
        intro_path.write_text(md, encoding='utf-8')
        print(f"  Saved: {intro_path.name}")
        print()
        break

# Extract chapter 1
for idx, ch in enumerate(chapters):
    if ch.get('type') == 'content' and idx > 0:  # Skip intro
        print(f"✓ Extracting chapter 1: {ch.get('title')}")
        md = simple_to_markdown(ch, 1)
        ch1_path = output_dir / "chapter-01.he.md"
        ch1_path.write_text(md, encoding='utf-8')
        print(f"  Saved: {ch1_path.name}")
        print()
        break

print("✅ Done! Chapters extracted exactly as they appear in the source.")
