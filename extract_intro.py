#!/usr/bin/env python3
"""Extract the intro chapter for testing."""
import sys
sys.path.insert(0, 'src')

from pathlib import Path
from pipeline.ingest import ingest
from pipeline.parse import parse, extract_book_info, to_markdown, extract_images

INPUT_FILE = r"D:\Books\Practical Python for AI Engineering.docx"
BOOK_SLUG = "practical-python-for-ai-engineering"
OUTPUT_BASE = "output"

print(f"Processing intro chapter...")
print()

# Ingest
ingested = ingest(INPUT_FILE)
book_info = extract_book_info(ingested)
image_data = extract_images(INPUT_FILE, BOOK_SLUG, "public")
image_positions = image_data.get("positions", [])

# Parse
chapters = parse(ingested)

# Find intro chapter
intro_idx = None
for idx, ch in enumerate(chapters):
    if ch.get('type') == 'intro':
        intro_idx = idx
        break

if intro_idx is None:
    print("No intro chapter found!")
    exit(1)

ch = chapters[intro_idx]
next_ch_idx = chapters[intro_idx + 1].get("heading_doc_index") if intro_idx + 1 < len(chapters) else None

print(f"Extracting: {ch.get('title', 'Untitled')}")

# Convert to Markdown
md_content = to_markdown(ch, image_positions, next_ch_idx, BOOK_SLUG)

# Save
output_dir = Path(OUTPUT_BASE) / BOOK_SLUG
output_dir.mkdir(parents=True, exist_ok=True)

intro_path = output_dir / "intro.he.md"
intro_path.write_text(md_content, encoding='utf-8')
print(f"✓ Saved: {intro_path.name}")

word_count = len(md_content.split())
sections = len([line for line in md_content.split('\n') if line.startswith('## ')])
reading_time = max(1, word_count // 200)

print(f"  Word count: {word_count}")
print(f"  Sections: {sections}")
print(f"  Estimated reading time: {reading_time} min")

print("\n✅ Intro extracted successfully!")
print(f"   Location: {output_dir}/intro.he.md")
