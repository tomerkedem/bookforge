"""
Pipeline runner for BookForge
"""
import sys
sys.path.insert(0, 'src')

from pathlib import Path
from pipeline.ingest import ingest
from pipeline.parse import parse, extract_book_info, to_markdown, extract_images
from pipeline.organize import organize

# Configuration
if len(sys.argv) > 1:
    INPUT_FILE = sys.argv[1]
else:
    INPUT_FILE = r"D:\Books\Lesson 1- Introduction to AI Engineering and Generative AI.docx"

# Extract book slug from filename (remove .docx and special chars)
book_filename = Path(INPUT_FILE).stem.lower()
BOOK_SLUG = book_filename.replace(" ", "-").replace("_", "-")
OUTPUT_BASE = "src/output"

print(f"📖 Processing: {INPUT_FILE}")
print(f"📁 Output to: {OUTPUT_BASE}/{BOOK_SLUG}")
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
image_data = extract_images(INPUT_FILE, BOOK_SLUG, "src/public")
image_positions = image_data.get("positions", [])
print(f"✓ Extracted {len(image_positions)} images")
print()

# Step 4: Parse chapters
print("=" * 60)
print("Step 4: PARSE - Splitting into chapters...")
print("=" * 60)
chapters = parse(ingested)
print(f"✓ Found {len(chapters)} chapters")
for i, ch in enumerate(chapters):
    title = ch.get('title', 'Untitled')[:50]
    ch_type = ch.get('type', 'content')
    print(f"  [{ch_type}] {title}...")
print()

# Step 5: Convert to Markdown
print("=" * 60)
print("Step 5: MARKDOWN - Converting chapters to MD format...")
print("=" * 60)
chapters_md = []
for i, ch in enumerate(chapters):
    next_idx = chapters[i+1].get("heading_doc_index") if i+1 < len(chapters) else None
    md_content = to_markdown(ch, image_positions, next_idx, BOOK_SLUG)
    chapters_md.append({
        "content": md_content,
        "title": ch.get("title", ""),
        "type": ch.get("type", "content")
    })
print(f"✓ Converted {len(chapters_md)} chapters to Markdown")
print()

# Step 6: Organize into output directory
print("=" * 60)
print("Step 6: ORGANIZE - Creating MD files...")
print("=" * 60)
created = organize(
    book_name=BOOK_SLUG,
    chapters_md=chapters_md,
    output_dir=OUTPUT_BASE,
    languages=["he", "en", "es"],
    book_titles={"he": book_info.get("title", ""), "en": "", "es": ""},
    book_subtitles={"he": book_info.get("subtitle", ""), "en": "", "es": ""}
)
print(f"✓ Created {len(created)} files")
print()

# List created files
print("=" * 60)
print("Created files:")
print("=" * 60)
book_dir = Path(OUTPUT_BASE) / BOOK_SLUG
for f in sorted(book_dir.glob("*.md")):
    print(f"  {f.name}")

print()
print("✅ Pipeline completed successfully!")
print(f"   Book location: {book_dir}")
