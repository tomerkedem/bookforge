#!/usr/bin/env python3
"""
Extract ONLY Chapter 1 from the Word document for testing.
This is a minimal pipeline to verify code block handling works correctly.
"""
import sys
sys.path.insert(0, 'src')

from pathlib import Path
from pipeline.ingest import ingest
from pipeline.parse import parse, extract_book_info, to_markdown, extract_images
from pipeline.organize import organize

# Configuration
INPUT_FILE = r"D:\Books\Practical Python for AI Engineering.docx"
BOOK_SLUG = "practical-python-for-ai-engineering"
OUTPUT_BASE = "output"

print(f"📖 Processing: {INPUT_FILE}")
print(f"📁 Output to: {OUTPUT_BASE}/{BOOK_SLUG}")
print(f"⚠️  CHAPTER 1 ONLY (for testing)")
print()

# Step 1: Ingest
print("=" * 60)
print("Step 1: INGEST - Reading Word document...")
print("=" * 60)
ingested = ingest(INPUT_FILE)
print(f"✓ Found {len(ingested.get('paragraphs', []))} paragraphs")
print()

# Step 2: Extract book info
print("=" * 60)
print("Step 2: EXTRACT - Getting book metadata...")
print("=" * 60)
book_info = extract_book_info(ingested)
print(f"✓ Title: {book_info.get('title', 'Unknown')}")
print(f"✓ Subtitle: {book_info.get('subtitle', '')}")
print()

# Step 3: Extract images
print("=" * 60)
print("Step 3: IMAGES - Extracting images from document...")
print("=" * 60)
image_data = extract_images(INPUT_FILE, BOOK_SLUG, "public")
image_positions = image_data.get("positions", [])
print(f"✓ Extracted {len(image_positions)} images")
print()

# Step 4: Parse chapters
print("=" * 60)
print("Step 4: PARSE - Splitting into chapters...")
print("=" * 60)
chapters = parse(ingested)
print(f"✓ Found {len(chapters)} total chapters")
for i, ch in enumerate(chapters[:3]):  # Show first 3
    title = ch.get('title', 'Untitled')[:50]
    ch_type = ch.get('type', 'content')
    print(f"  [{i}] [{ch_type}] {title}...")
print()

# Step 5: Extract ONLY Chapter 1 (intro or first content chapter)
print("=" * 60)
print("Step 5: EXTRACT CHAPTER 1 ONLY...")
print("=" * 60)
# Find the first CONTENT chapter (skip intro if present)
chapter_1_idx = None
for idx, ch in enumerate(chapters):
    if ch.get('type') == 'intro':
        continue  # Skip intro
    chapter_1_idx = idx
    break

if chapter_1_idx is None:
    print("❌ No content chapters found!")
    exit(1)

ch = chapters[chapter_1_idx]
next_ch_idx = chapters[chapter_1_idx + 1].get("heading_doc_index") if chapter_1_idx + 1 < len(chapters) else None

print(f"✓ Extracting: {ch.get('title', 'Untitled')}")

# Convert to Markdown
md_content = to_markdown(ch, image_positions, next_ch_idx, BOOK_SLUG)

# Save ONLY chapter 1
print()
print("=" * 60)
print("Step 6: SAVE...")
print("=" * 60)

output_dir = Path(OUTPUT_BASE) / BOOK_SLUG
output_dir.mkdir(parents=True, exist_ok=True)

# Save chapter 1 in Hebrew
chapter_path = output_dir / "chapter-01.he.md"
chapter_path.write_text(md_content, encoding='utf-8')
print(f"✓ Saved: {chapter_path.name}")

# Calculate word count and sections
word_count = len(md_content.split())
# Count level 2 headings (##)
sections = len([line for line in md_content.split('\n') if line.startswith('## ')])
reading_time = max(1, word_count // 200)  # Assume 200 words per minute

# Save content-structure.json with all required fields
import json
content_structure = {
    "book": {
        "titles": {"he": book_info.get("title", ""), "en": "", "es": ""},
        "subtitles": {"he": book_info.get("subtitle", ""), "en": "", "es": ""},
        "chapters": [{
            "id": 1,
            "file_slug": "chapter-01",
            "type": "content",
            "titles": {"he": ch.get('title', ''), "en": "", "es": ""},
            "sections": sections,
            "has_images": False,
            "word_count": word_count,
            "topics": []
        }]
    }
}

structure_path = output_dir / "content-structure.json"
structure_path.write_text(json.dumps(content_structure, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"✓ Saved: {structure_path.name}")
print(f"  Word count: {word_count}")
print(f"  Sections: {sections}")
print(f"  Estimated reading time: {reading_time} min")

print()
print("✅ Chapter 1 extracted successfully!")
print(f"   Location: {output_dir}/chapter-01.he.md")
print()
print("📋 NEXT STEPS:")
print("   1. Review chapter-01.he.md")
print("   2. Check code blocks formatting")
print("   3. Confirm code and text are properly separated")
print("   4. If good: we'll extract all chapters")
