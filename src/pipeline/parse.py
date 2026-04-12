"""
Splits raw paragraphs into chapters based on headings.
Extracts images from Word documents.
Returns a list of chapters with title, content, and images.
"""

import os
import re
from pathlib import Path


INTRO_KEYWORDS = ["מבוא", "פתיחה", "הקדמה", "introduction", "preface", "foreword"]
COVER_KEYWORDS = ["שער", "cover", "title"]


def _clean_title(text: str) -> str:
    """
    Clean title/subtitle extracted from cover page.
    Removes HTML tags, markdown formatting, and extra whitespace.
    """
    # Remove HTML tags (e.g., <div style="...">, </div>)
    cleaned = re.sub(r'<[^>]+>', '', text)
    # Remove markdown bold/italic
    cleaned = re.sub(r'\*+', '', cleaned)
    # Remove tabs and normalize whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def extract_book_info(ingested: dict) -> dict:
    """
    Extract book title and subtitle from the cover page.
    Looks at paragraphs BEFORE the first Heading 1.
    
    In a typical Word document:
    - First significant paragraph = Book title
    - Second significant paragraph = Subtitle
    
    Returns: {title: str, subtitle: str}
    """
    paragraphs = ingested.get("paragraphs", [])
    title = ""
    subtitle = ""
    
    # Find first Heading 1 position
    first_heading_idx = None
    for idx, para in enumerate(paragraphs):
        style = para.get("style", "")
        if "Heading 1" in style:
            first_heading_idx = idx
            break
    
    # Collect significant text paragraphs before Heading 1
    cover_texts = []
    limit = first_heading_idx if first_heading_idx is not None else min(20, len(paragraphs))
    
    for idx in range(limit):
        para = paragraphs[idx]
        text = para.get("text", "").strip()
        style = para.get("style", "")
        
        # Skip empty, spacing, and heading paragraphs
        if not text or style == "Spacing" or "Heading" in style:
            continue
        
        # Skip if looks like author name or date
        if len(text) < 100:  # Short enough to be title/subtitle
            cover_texts.append(text)
        
        # Usually only need first 2 significant texts
        if len(cover_texts) >= 2:
            break
    
    if len(cover_texts) >= 1:
        title = _clean_title(cover_texts[0])
    if len(cover_texts) >= 2:
        subtitle = _clean_title(cover_texts[1])
    
    return {"title": title, "subtitle": subtitle}


def _clean_heading(text: str) -> str:
    """
    Remove bold/italic markdown from headings - they're already styled by structure.
    Handles Word artifacts like **פרק 1****:** or ***text***.
    """
    # Remove all asterisk formatting from headings
    # They shouldn't have markdown bold/italic since heading style is already prominent
    cleaned = re.sub(r'\*+', '', text)
    # Clean up extra spaces that may result
    cleaned = re.sub(r'\s{2,}', ' ', cleaned)
    return cleaned.strip()


def _fix_code_blocks(text: str) -> str:
    """
    Fix code block format from Word documents.
    
    Word format: python``` ... ```
    Target format: ```python ... ```
    
    Supported languages: python, javascript, bash, markdown, etc.
    Normalizes language names to lowercase.
    Normalizes md → markdown.
    """
    import re
    
    # Pattern: language``` at start of line, then code, then ``` at end
    # Match: python``` or javascript``` etc.
    pattern = r'^(\w+)```\s*\n([\s\S]*?)```\s*$'
    
    def replace_block(match):
        lang = match.group(1).lower()  # Normalize to lowercase
        # Normalize md → markdown
        if lang == 'md':
            lang = 'markdown'
        code = match.group(2).rstrip()
        return f'```{lang}\n{code}\n```'
    
    # Process multiline - use MULTILINE flag
    result = re.sub(pattern, replace_block, text, flags=re.MULTILINE)
    
    # Also handle inline pattern on same line: python```code```
    inline_pattern = r'(\w+)```([^`]+)```'
    def replace_inline(match):
        lang = match.group(1).lower()
        if lang == 'md':
            lang = 'markdown'
        code = match.group(2)
        return f'```{lang}\n{code}\n```'
    result = re.sub(inline_pattern, replace_inline, result)
    
    # Normalize existing language tags (case normalization)
    result = re.sub(r'```Python\b', '```python', result)
    result = re.sub(r'```Bash\b', '```bash', result)
    result = re.sub(r'```Markdown\b', '```markdown', result)
    result = re.sub(r'```MD\b', '```markdown', result, flags=re.IGNORECASE)
    result = re.sub(r'```md\b', '```markdown', result)
    
    return result


def _clean_markdown_final(text: str) -> str:
    """
    Final comprehensive cleanup of markdown artifacts from Word formatting.
    This is the LAST line of defense - catches all edge cases.
    
    IMPORTANT: This function must NOT break intentional bold formatting.
    It only fixes malformed patterns from Word conversion.
    
    Patterns fixed:
    - **** (4+ asterisks) → **
    - **:** or **: ** → :
    - **, ** between bold markers → ,
    - ** ** (spaced asterisks) → space
    - ה**text** → **הtext** (Hebrew prefix letters)
    - **text**.** → **text**.
    - line ending with . ** label → line ending with . **label**
    - Unbalanced ** on a line (odd count) → balanced
    - python``` code ``` → ```python code ```
    - "- •" or "- 1)" duplicate bullets → single prefix
    - " **" (space before closing) → "**"
    - "%digit)" corrupted numbering → "digit)" (also %digit.)
    - "1) text" at line start → "**(1)** text" (prevent hidden list numbers)
    - ": **" (colon then space before close) → ":** " (bold ends at colon)
    """
    import re
    
    # First fix code blocks
    text = _fix_code_blocks(text)
    
    # Fix corrupted numbering: %1), %2), %1., %2. etc. → 1), 2), 1., 2. etc.
    # This happens when Word encoding corrupts digit-based list markers
    text = re.sub(r'%(\d+)([\.\)])', r'\1\2', text)
    
    # Fix duplicate list prefixes: "- •", "- 1)", "- 2." etc.
    # These happen when parse.py adds "- " and text already has prefix
    # Match "- " followed by bullet or numbered prefix
    text = re.sub(r'^(\s*)-\s+(•)', r'\1\2', text, flags=re.MULTILINE)
    text = re.sub(r'^(\s*)-\s+(\d+[\)\.])(\s)', r'\1\2\3', text, flags=re.MULTILINE)
    
    # Convert standalone "1)" at start of line to "**(1)**" to prevent markdown list interpretation
    # This ensures the number is displayed visibly instead of being hidden by list rendering
    text = re.sub(r'^(\d+)\)\s+', r'**(\1)** ', text, flags=re.MULTILINE)
    
    # Fix space before closing ** (end of line or followed by punctuation)
    text = re.sub(r' \*\*$', '**', text, flags=re.MULTILINE)
    text = re.sub(r' \*\*([.,;:!?)])', r'**\1', text)
    
    # Fix ": **" pattern (colon with space before closing bold) → ":** "
    # Common in Hebrew text like "**שם: **טקסט" → "**שם:** טקסט"
    text = re.sub(r': \*\*', ':** ', text)
    
    # Process line by line to handle unbalanced ** properly
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Count ** pairs
        asterisk_count = line.count('**')
        
        # 1. Fix consecutive asterisks (4 or more) → **
        line = re.sub(r'\*{4,}', '**', line)
        
        # 2. Fix **:** pattern → :
        line = re.sub(r'\*\*:\*\*', ':', line)
        line = re.sub(r'\*\*:\s*\*\*', ': ', line)
        
        # 3. Fix trailing **.** or **. → .
        line = re.sub(r'\*\*\.\*\*', '.', line)
        line = re.sub(r'\*\*\.$', '.', line)
        
        # 4. Fix **, ** pattern (comma between bold markers)
        line = re.sub(r'\*\*,\s*\*\*', ', ', line)
        
        # 5. Fix ** ** pattern (space between markers)
        line = re.sub(r'\*\*\s+\*\*', ' ', line)
        
        # 6. Fix Hebrew prefix letters before bold: ה**text** → **הtext**
        # Hebrew prefix letters (אותיות השימוש): ה, ו, ב, כ, ל, מ, ש
        line = re.sub(r'([הובכלמש])\*\*([^*]+)\*\*', r'**\1\2**', line)
        
        # 7. Fix sentence ending with ". **label" → ". **label**"
        # Pattern: text ends with . then space then ** then text without closing **
        match = re.search(r'\.\s+\*\*([^*]+)$', line)
        if match and line.count('**') % 2 != 0:
            # Odd number of ** means unbalanced - add closing
            line = line + '**'
        
        # 8. Fix bullet points with misplaced **: "- text:** label**" → "- **text: label**"
        line = re.sub(r'^(- )([^*]+):\*\*\s*([^*]+)\*\*$', r'\1**\2: \3**', line)
        
        # 9. Fix pattern: "- תת-בעיה 1:** האלגוריתם**" → "- **תת-בעיה 1: האלגוריתם**"
        line = re.sub(r'^(- )([^*:]+):\*\*\s*([^*]+)\*\*', r'\1**\2: \3**', line)
        
        # 10. Fix label patterns at line start: " text**:" → " **text:**"
        line = re.sub(r'^(\s*)([^\s*][^*\n]{2,})\*\*:', r'\1**\2:**', line)
        
        # 11. Fix standalone ** on its own line (no content)
        if re.match(r'^\s*\*\*\s*$', line):
            line = ''
        
        # 12. Fix quotes: "**text**" → "text"
        line = re.sub(r'"\*\*([^*"]+)\*\*"', r'"\1"', line)
        
        # 13. Recount and handle remaining unbalanced **
        final_count = line.count('**')
        if final_count % 2 != 0 and final_count > 0:
            # Still unbalanced - check if it's an unclosed bold at end
            if re.search(r'\*\*[^*]+$', line) and not re.search(r'[^*]\*\*$', line):
                # Has opening ** but no closing - add it
                line = line + '**'
            elif re.search(r'^\s*\*\*\s*$', line):
                # Just ** alone - remove it
                line = ''
        
        # 14. Clean multiple spaces
        line = re.sub(r' {2,}', ' ', line)
        
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


def parse(ingested: dict) -> list[dict]:
    paragraphs = ingested["paragraphs"]
    chapters = []
    current = None

    for idx, para in enumerate(paragraphs):
        style = para["style"]
        text = para["text"]
        # Use original document index for image mapping (aligned with extract_images)
        doc_idx = para.get("doc_para_index", idx)
        
        # Handle spacing paragraphs (empty lines for visual separation)
        if style == "Spacing":
            if current:
                blank_count = para.get("blank_lines", 1)
                for _ in range(blank_count):
                    current["content"].append({
                        "text": "",
                        "style": "Spacing",
                        "para_index": doc_idx
                    })
            continue

        if "Heading 1" in style:
            if current:
                chapters.append(current)

            # Clean heading text - remove markdown asterisks
            clean_title = _clean_heading(text)
            chapter_type = _classify_chapter(clean_title, len(chapters))
            current = {
                "number": len(chapters) + 1,
                "title": clean_title,
                "heading_doc_index": doc_idx,
                "content": [],
                "has_images": False,
                "type": chapter_type
            }
        elif current:
            # Also clean Heading 2/3 text
            if "Heading" in style:
                text = _clean_heading(text)
            current["content"].append({
                "text": text,
                "style": style,
                "para_index": doc_idx  # Original doc index for image alignment
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


# Default: save images to public/ for web serving (not output/)
# Resolved to absolute path relative to project root
from pathlib import Path as _Path
_PROJECT_ROOT = _Path(__file__).resolve().parent.parent.parent
DEFAULT_ASSETS_DIR = str(_PROJECT_ROOT / "public")


def extract_images(docx_path: str, book_name: str, assets_base_dir: str = DEFAULT_ASSETS_DIR) -> dict:
    """
    Extracts images from a Word document and maps them to paragraph positions.
    
    Images are saved directly to public/{book_name}/assets/ for web serving.
    No duplicate copies in output/ folder.
    
    Cover image detection logic:
    - If an image exists BEFORE the first Heading 1 → that's the cover
    - Otherwise, no cover.png is created (all images numbered sequentially)
    
    Returns a dict with:
      - 'files': mapping rel_id to file path
      - 'positions': list of (paragraph_index, rel_id, filename, width_px, height_px)
      - 'has_cover': boolean indicating if cover was found
      - 'book_name': slug for URL paths
    """
    try:
        from docx import Document
        from docx.oxml import parse_xml
    except ImportError:
        raise ImportError("pip install python-docx")

    import re

    doc = Document(docx_path)
    assets_dir = Path(assets_base_dir) / book_name / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Find first TWO Heading 1 positions
    # (to handle cases like "פתיחה" + cover image + "Chapter 1")
    first_heading_idx = None
    second_heading_idx = None
    heading_count = 0
    for idx, para in enumerate(doc.paragraphs):
        if para.style and "Heading 1" in para.style.name:
            heading_count += 1
            if heading_count == 1:
                first_heading_idx = idx
            elif heading_count == 2:
                second_heading_idx = idx
                break
    
    # Step 2: Build rel_id to image data mapping
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

    # Step 3: Check for images in SDT elements (before paragraphs - cover page)
    # These appear at position -1 (before first paragraph)
    image_positions_temp = []  # (para_idx, rel_id, w_px, h_px)
    
    body = doc.element.body
    for element in body:
        tag_name = element.tag.split('}')[-1] if '}' in element.tag else element.tag
        if tag_name == 'sdt':  # Structured Document Tag (cover page)
            # Search for images in this SDT
            blips = element.xpath('.//a:blip', namespaces={
                'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'
            })
            for blip in blips:
                embed_id = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                if embed_id and embed_id in image_data:
                    # Position -1 means before first paragraph (cover)
                    image_positions_temp.append((-1, embed_id, 0, 0))
    
    # Step 4: Map images in paragraphs (with dimensions)
    for para_idx, para in enumerate(doc.paragraphs):
        for run in para.runs:
            run_xml = run._element.xml.decode('utf-8') if isinstance(run._element.xml, bytes) else run._element.xml
            if '<w:drawing' in run_xml or '<w:pict' in run_xml:
                # Extract exact rel_id via regex (avoid substring false matches)
                embeds = re.findall(r'r:embed="(rId\d+)"', run_xml)
                matched_rel_id = None
                for eid in embeds:
                    if eid in image_data:
                        matched_rel_id = eid
                        break
                if not matched_rel_id:
                    # Fallback: substring search (legacy)
                    for rel_id in image_data.keys():
                        if rel_id in run_xml:
                            matched_rel_id = rel_id
                            break
                if matched_rel_id:
                    # Extract dimensions from wp:extent (EMU → pixels at 96 DPI)
                    w_px, h_px = 0, 0
                    extents = re.findall(r'<wp:extent\s+cx="(\d+)"\s+cy="(\d+)"', run_xml)
                    if extents:
                        cx, cy = int(extents[0][0]), int(extents[0][1])
                        w_px = round(cx / 914400 * 96)
                        h_px = round(cy / 914400 * 96)
                    image_positions_temp.append((para_idx, matched_rel_id, w_px, h_px))

    # Step 5: Sort by paragraph position
    image_positions_temp.sort(key=lambda x: x[0])

    # Step 6: Determine if we have a cover image
    # Priority: Images at position -1 (SDT/cover page) > Early paragraph images
    has_cover = False
    cover_rel_id = None
    
    if len(image_positions_temp) > 0:
        first_img_idx = image_positions_temp[0][0]
        
        # Position -1 means SDT (cover page) - always use as cover
        if first_img_idx == -1:
            # If multiple images at -1, use the LAST one (user deleted first)
            sdt_images = [img for img in image_positions_temp if img[0] == -1]
            if len(sdt_images) > 1:
                cover_rel_id = sdt_images[-1][1]  # Last image in SDT
                print(f"[OK] Cover image found: SDT image (cover page), using last of {len(sdt_images)} images")
            else:
                cover_rel_id = image_positions_temp[0][1]
                print(f"[OK] Cover image found: SDT image (cover page)")
            has_cover = True
        # If first image appears within first 15 paragraphs, it's the cover
        elif first_img_idx < 15:
            has_cover = True
            cover_rel_id = image_positions_temp[0][1]
            print(f"[OK] Cover image found: first image at paragraph {first_img_idx}")
        else:
            print(f"[WARN] No cover: First image at para {first_img_idx} (too late in document)")
            print(f"  All images will be numbered sequentially (no cover.png)")
    
    # Step 7: Save images
    image_files = {}
    image_positions = []
    image_counter = 1  # Start from 1 for chapter images
    
    for para_idx, rel_id, w_px, h_px in image_positions_temp:
        img_info = image_data[rel_id]
        
        if has_cover and rel_id == cover_rel_id:
            # This is the cover image
            cover_path = assets_dir / "cover.png"
            with open(cover_path, "wb") as f:
                f.write(img_info["data"])
            image_files[rel_id] = str(cover_path)
            filename = "cover.png"
        else:
            # Regular chapter image
            img_path = assets_dir / f"image-{str(image_counter).zfill(2)}.{img_info['ext']}"
            with open(img_path, "wb") as f:
                f.write(img_info["data"])
            image_files[rel_id] = str(img_path)
            filename = f"image-{str(image_counter).zfill(2)}.{img_info['ext']}"
            image_counter += 1
        
        image_positions.append((para_idx, rel_id, filename, w_px, h_px))

    return {
        'files': image_files,
        'positions': image_positions,
        'has_cover': has_cover,
        'book_name': book_name  # For absolute URL paths
    }


def to_markdown(chapter: dict, image_positions: list = None, next_heading_idx: int = None, book_name: str = "") -> str:
    """
    Convert chapter to Markdown with embedded images at correct positions.
    
    Images are placed using range-based matching: an image belongs to this
    chapter if its doc_idx is >= this chapter's heading and < the next heading.
    
    Image paths are absolute URLs for web serving: /{book_name}/assets/image.png
    
    Args:
        chapter: Chapter dict with title, heading_doc_index, and content blocks
        image_positions: List of (para_index, rel_id, filename, w_px, h_px) tuples
        next_heading_idx: doc_para_index of next chapter's heading (exclusive upper bound)
        book_name: Book slug for absolute image paths
    """
    lines = [f"# {chapter['title']}", ""]
    
    content = chapter["content"]
    if not content:
        return "\n".join(lines)

    # Chapter range: from heading to next heading (or end of doc)
    ch_start = chapter.get("heading_doc_index", 0)
    ch_end = next_heading_idx if next_heading_idx is not None else float('inf')

    # Collect images that belong to this chapter's range
    chapter_images = []
    if image_positions:
        for item in image_positions:
            para_idx = item[0]
            if para_idx < 0:
                continue  # Skip cover
            filename = item[2]
            w_px = item[3] if len(item) > 3 else 0
            h_px = item[4] if len(item) > 4 else 0
            if ch_start <= para_idx < ch_end:
                chapter_images.append((para_idx, filename, w_px, h_px))
    
    # Sort images by position
    chapter_images.sort(key=lambda x: x[0])

    # Build output: for each content paragraph, insert any images that
    # appear before it (doc_idx <= this paragraph's doc_idx)
    img_cursor = 0
    for item in content:
        style = item["style"]
        text = item["text"]
        para_idx = item.get("para_index", -1)
        
        # Insert images whose doc_idx <= current paragraph's doc_idx
        # Use absolute paths for web serving: /{book_name}/assets/
        assets_path = f"/{book_name}/assets" if book_name else "../assets"
        while img_cursor < len(chapter_images) and chapter_images[img_cursor][0] <= para_idx:
            _, img_filename, w_px, h_px = chapter_images[img_cursor]
            if w_px > 0 and h_px > 0:
                lines.append(f'<img src="{assets_path}/{img_filename}" alt="{img_filename}" width="{w_px}" height="{h_px}" />')
            else:
                lines.append(f"![{img_filename}]({assets_path}/{img_filename})")
            lines.append("")
            img_cursor += 1

        if style == "Spacing":
            # Spacing paragraph - represents blank line from Word
            # Don't add extra blank line since this IS the blank line
            lines.append("")
            continue
        elif "Heading 2" in style:
            lines.append(f"## {text}")
        elif "Heading 3" in style:
            lines.append(f"### {text}")
        elif "List" in style:
            # ingest.py already adds numbering prefix (1), 2), •) with indentation
            # Check if text already has numbering/bullet - don't add another one
            stripped = text.lstrip()
            # Match: bullet (•, -, *), or numbered (1), 2., 10), etc.)
            has_prefix = bool(re.match(r'^[•\-\*]|^\d+[\)\.]\s', stripped))
            if has_prefix:
                lines.append(text)  # Use as-is, already has prefix+indent
            else:
                lines.append(f"- {text}")  # No prefix, add bullet
        else:
            lines.append(text)

        lines.append("")

    # Append any remaining images after the last paragraph
    assets_path = f"/{book_name}/assets" if book_name else "../assets"
    while img_cursor < len(chapter_images):
        _, img_filename, w_px, h_px = chapter_images[img_cursor]
        if w_px > 0 and h_px > 0:
            lines.append(f'<img src="{assets_path}/{img_filename}" alt="{img_filename}" width="{w_px}" height="{h_px}" />')
        else:
            lines.append(f"![{img_filename}]({assets_path}/{img_filename})")
        lines.append("")
        img_cursor += 1

    # Final cleanup: catch any remaining Word formatting artifacts
    result = "\n".join(lines)
    result = _clean_markdown_final(result)
    
    return result