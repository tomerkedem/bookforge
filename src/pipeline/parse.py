"""
Splits raw paragraphs into chapters based on headings.
Extracts images from Word documents.
Returns a list of chapters with title, content, and images.
"""

import os
import re
import json
from pathlib import Path
from collections import Counter


INTRO_KEYWORDS = ["מבוא", "פתיחה", "הקדמה", "introduction", "preface", "foreword"]
COVER_KEYWORDS = ["שער", "cover", "title"]


# =============================================================================
# Instrumentation: count how many times each regex-cleanup rule actually fires.
# The goal is to confirm which rules are still needed after the ingest.py fix
# that produces cleaner markdown at the source. Rules that never fire across
# several real books are dead code and can be removed.
#
# Usage from build.py:
#     from pipeline.parse import reset_clean_stats, dump_clean_stats
#     reset_clean_stats()
#     ... run pipeline ...
#     dump_clean_stats("clean_markdown_stats.json")
# =============================================================================

_CLEAN_STATS: Counter = Counter()


def reset_clean_stats() -> None:
    """Call at the start of a pipeline run to zero the counters."""
    _CLEAN_STATS.clear()


def dump_clean_stats(path: str = "clean_markdown_stats.json") -> None:
    """Write the accumulated counters to a JSON report."""
    report = {
        "total_substitutions": sum(_CLEAN_STATS.values()),
        "rules_fired": len([v for v in _CLEAN_STATS.values() if v > 0]),
        "by_rule": dict(sorted(_CLEAN_STATS.items(), key=lambda kv: -kv[1])),
    }
    Path(path).write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _counted_sub(rule_id: str, pattern: str, repl, text: str, flags: int = 0) -> str:
    """
    Drop-in replacement for re.sub that also counts how many
    substitutions were made under the given rule_id.
    """
    new_text, count = re.subn(pattern, repl, text, flags=flags)
    if count:
        _CLEAN_STATS[rule_id] += count
    return new_text


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
    Return empty book title and subtitle.

    Book-level metadata (title, subtitle) should be provided via the
    --title CLI argument, not auto-detected from the Word document.
    Auto-detection was unreliable because:
    - Some books use a Word SDT (cover page) element which python-docx
      does not expose as a regular paragraph
    - Some books have no cover page at all and start directly with
      a Heading 1 that is a chapter title, not the book title
    - The previous heuristic (collect paragraphs before first Heading 1)
      grabbed arbitrary content from inside the first chapter when no
      cover existed

    This function is kept as a stub so that call sites in build.py
    and elsewhere continue to work unchanged. The returned values
    are empty, and build.py already falls back to the --title CLI
    argument and to the book slug when title/subtitle are empty.
    """
    return {"title": "", "subtitle": ""}


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
    Normalizes md -> markdown.

    Instrumented: firings of each sub-rule are counted so we can see
    whether this function is still needed after the ingest.py fix.
    Function is currently not called from anywhere in the codebase,
    so the counts will likely stay at zero.
    """
    # Pattern: language``` at start of line, then code, then ``` at end
    pattern = r'^(\w+)```\s*\n([\s\S]*?)```\s*$'

    def replace_block(match):
        lang = match.group(1).lower()
        if lang == 'md':
            lang = 'markdown'
        code = match.group(2).rstrip()
        _CLEAN_STATS["fix_code_blocks_multiline"] += 1
        return f'```{lang}\n{code}\n```'

    result = re.sub(pattern, replace_block, text, flags=re.MULTILINE)

    # Inline pattern: python```code```
    inline_pattern = r'(\w+)```([^`]+)```'

    def replace_inline(match):
        lang = match.group(1).lower()
        if lang == 'md':
            lang = 'markdown'
        code = match.group(2)
        _CLEAN_STATS["fix_code_blocks_inline"] += 1
        return f'```{lang}\n{code}\n```'

    result = re.sub(inline_pattern, replace_inline, result)

    # Normalize existing language tags (case normalization)
    result = _counted_sub("fix_code_lang_Python", r'```Python\b', '```python', result)
    result = _counted_sub("fix_code_lang_Bash", r'```Bash\b', '```bash', result)
    result = _counted_sub("fix_code_lang_Markdown", r'```Markdown\b', '```markdown', result)
    result = _counted_sub(
        "fix_code_lang_MD_case_insensitive",
        r'```MD\b',
        '```markdown',
        result,
        flags=re.IGNORECASE,
    )
    result = _counted_sub("fix_code_lang_md_lower", r'```md\b', '```markdown', result)

    return result



def _clean_markdown_final(text: str) -> str:
    """
    Cleanup of residual markdown artifacts after Word-to-Markdown
    conversion.

    Earlier versions of this function carried 24 rules. Instrumentation
    across real book runs showed that after the ingest.py refactor
    (format-flag based run merging, direct markdown emission in table
    cells, bullet prefix normalization to standard "-"), only 9 of
    those 24 rules ever fired. The other 15 were dead code targeting
    patterns that no longer survive into parse.py.

    What remains here is the minimum needed for residual artifacts
    the ingest step cannot prevent on its own, most of them trailing
    whitespace caused by Word authors who put a space before closing
    a bold run.

    Rules kept (ordered roughly from "most defensive" to "cosmetic"):
      01 space_before_close_eol       - "word **" at end of line
      02 colon_space_before_close     - ": **"   -> ":** "
      03 bold_dot_bold                - "**.**"  -> "."  (rare edge)
      04 bold_dot_eol                 - "**." at end of line
      05 bold_space_bold              - "** **"  -> " "
      06 hebrew_prefix_before_bold    - "ה**X**" -> "**הX**"
      07 bold_inside_quotes           - "\"**X**\"" -> "\"X\""
      08 close_trailing_unbalanced    - odd count of ** at EOL -> close
      09 multiple_spaces              - collapse runs of spaces

    Rules removed and why:
      %1)->1) numbering (no longer appears from ingest)
      "- •" / "- 1)" duplicate bullet prefixes (ingest emits "-" only)
      "1)" -> "**(1)**" conversion (unused)
      " **X" with punctuation after (subsumed by rule 01 in practice)
      4+ asterisks (run-merge in ingest prevents this)
      "**:**", "**: **" (run-merge prevents this)
      "**, **" (run-merge prevents this)
      closing after ". **text" (edge case, did not fire)
      bullet+colon+bold rewrites (multiple variants, did not fire)
      label-at-start rewrite (did not fire)
      standalone ** on a line (did not fire; overlaps rule 08)
      lonely-bold removal (overlaps rule 08)

    Keep this list in sync with the dashboard dump in
    dump_clean_stats(); if a removed rule starts firing again we
    should prefer fixing the root cause in ingest.py rather than
    re-introducing a rule here.
    """
    # Block-level (whole-text) patterns
    # ---------------------------------
    # 01. Trailing " **" at end of line (Word users often add a space
    # before closing a bold run; that space survives ingest and looks
    # like "word **" in the output).
    text = _counted_sub(
        "01_space_before_close_eol",
        r' \*\*$',
        '**',
        text,
        flags=re.MULTILINE,
    )

    # 02. ": **" -> ":** " (move the space outside the bold run so the
    # colon reads as part of the label, not as content). Highest firing
    # rule in practice because authors commonly write "Label: **value**"
    # by highlighting "Label:" without including the trailing space.
    text = _counted_sub("02_colon_space_before_close", r': \*\*', ':** ', text)

    # Per-line processing
    # -------------------
    lines = text.split('\n')
    cleaned_lines = []

    for line in lines:
        # 03. "**.**" -> "." (rare; a bold that contains just a period).
        line = _counted_sub("03_bold_dot_bold", r'\*\*\.\*\*', '.', line)

        # 04. Trailing "**." at end of line (bold that closes with a
        # period but the close marker ended up before the period).
        line = _counted_sub("04_bold_dot_eol", r'\*\*\.$', '.', line)

        # 05. "** **" with whitespace between open/close -> single space.
        line = _counted_sub("05_bold_space_bold", r'\*\*\s+\*\*', ' ', line)

        # 06. Hebrew single-letter prefix sitting just outside a bold
        # run, e.g. "ה**עולם**" -> "**העולם**". Word sometimes breaks
        # runs between a prefix letter and the noun it attaches to.
        line = _counted_sub(
            "06_hebrew_prefix_before_bold",
            r'([הובכלמש])\*\*([^*]+)\*\*',
            r'**\1\2**',
            line,
        )

        # 07. Quoted bold: "**text**" -> "text". When the whole content
        # of a quote was bolded, the visual effect is redundant because
        # the quotes already mark emphasis. Strips the bold.
        line = _counted_sub(
            "07_bold_inside_quotes",
            r'"\*\*([^*"]+)\*\*"',
            r'"\1"',
            line,
        )

        # 08. If a line ends with an unbalanced ** (odd count, trailing
        # open), close it. This is a last-resort safety net; ingest's
        # run merging already prevents most of these.
        final_count = line.count('**')
        if final_count % 2 != 0 and final_count > 0:
            if re.search(r'\*\*[^*]+$', line) and not re.search(r'[^*]\*\*$', line):
                line = line + '**'
                _CLEAN_STATS["08_close_trailing_unbalanced"] += 1

        # 09. Collapse runs of whitespace. Cosmetic.
        line = _counted_sub("09_multiple_spaces", r' {2,}', ' ', line)

        cleaned_lines.append(line)

    return '\n'.join(cleaned_lines)


def _build_markdown_table(rows: list) -> str:
    """
    Build a markdown pipe-table from a list of rows.

    Each row is a list of cell dicts with a `text` field that already
    contains the cell's content rendered as markdown (with inline
    formatting from ingest.py::_runs_to_markdown). The first row is
    treated as the header; a separator line is emitted after it as
    markdown pipe-tables require.

    Edge cases handled:
    - Empty cells are rendered as a single space so the pipe syntax
      stays valid ("| |" is valid, "||" is not).
    - Rows with differing cell counts are padded with empty cells to
      match the widest row, so the table stays rectangular.
    - Newlines inside a cell are replaced with a space. Markdown pipe
      tables do not support multi-line cells; using <br> would work on
      some renderers but break on others, so a space is the safer
      choice. This is a known limitation of the pipe-table format.
    - Pipe characters inside cell text are already escaped by
      ingest.py (see _extract_table_data), so we don't escape again.
    """
    if not rows:
        return ""

    def cell_text(cell):
        # ingest.py now builds the cell's markdown directly, including
        # inline formatting (bold, italic, code, links). Previously we
        # re-rendered from `runs` here, which lost formatting because
        # the cell-level run extractor used to emit plain text only.
        t = cell.get("text", "")
        # Collapse newlines; pipe tables cannot contain real line breaks
        t = t.replace("\n", " ").replace("\r", " ").strip()
        return t if t else " "

    # Find the widest row so we can pad narrower rows
    max_cols = max(len(row) for row in rows)

    normalized_rows = []
    for row in rows:
        cells = [cell_text(c) for c in row]
        # Pad with empty cells if this row is shorter than the widest
        while len(cells) < max_cols:
            cells.append(" ")
        normalized_rows.append(cells)

    lines = []
    # Header row (first row is assumed to be the header)
    header = normalized_rows[0]
    lines.append("| " + " | ".join(header) + " |")
    # Separator
    lines.append("| " + " | ".join(["---"] * max_cols) + " |")
    # Body rows
    for cells in normalized_rows[1:]:
        lines.append("| " + " | ".join(cells) + " |")

    return "\n".join(lines)


def parse(ingested: dict) -> list[dict]:
    blocks = ingested["blocks"]
    chapters = []
    current = None

    for idx, block in enumerate(blocks):
        block_type = block.get("type")
        style = block.get("style", "")
        text = block.get("text", "")
        doc_idx = block.get("doc_index", idx)

        # Tables: build a proper markdown pipe-table from the structured
        # rows that ingest.py extracted. Previously we passed through an
        # empty `text` field (table blocks have no `text`, only `rows`),
        # which silently dropped every table from the output.
        if block_type == "table":
            if current:
                rows = block.get("rows", [])
                table_md = _build_markdown_table(rows)
                current["content"].append({
                    "text": table_md,
                    "style": "Table",
                    "para_index": doc_idx,
                    "indent_level": 0
                })
            continue

        # Image-only paragraphs: ingest.py emits these as minimal blocks
        # with empty text so that downstream layout can still anchor
        # the image at the correct doc_index inside the chapter's
        # content list. to_markdown() recognises style="ImageAnchor"
        # and renders only the image, no paragraph text.
        if block_type == "image":
            if current:
                current["content"].append({
                    "text": "",
                    "style": "ImageAnchor",
                    "para_index": doc_idx,
                    "indent_level": 0,
                })
            continue

        # We only process paragraph/code/heading-like blocks here
        if block_type not in {"paragraph", "heading", "code"}:
            continue

        if "Heading 1" in style:
            if current:
                chapters.append(current)

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
            continue

        if current:
            if "Heading" in style:
                text = _clean_heading(text)

            current["content"].append({
                "text": text,
                "style": style if block_type != "code" else "code",
                "para_index": doc_idx,
                "indent_level": 0
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


def extract_images(
    docx_path: str,
    book_name: str,
    ingested: dict,
    assets_base_dir: str = DEFAULT_ASSETS_DIR,
) -> dict:
    """
    Save images from a Word document and map them to block positions.

    Image positions now come from ingest.py, which enumerates the same
    body elements that produce the blocks. That guarantees the doc_index
    on each image matches the doc_index on the neighboring paragraph
    block. Previously this function computed positions independently
    over doc.paragraphs, which does not include SDT or table elements,
    so the indexing drifted by +1 per SDT and +1 per preceding table
    and images ended up assigned to the wrong chapter (or lost).

    Cover image detection logic:
      - If any image appears in an SDT element (Word's cover-page
        container), that one wins and becomes cover.png.
      - Otherwise, if the first image appears before doc_index 15,
        it is treated as the cover.
      - Otherwise, there is no cover; all images are numbered.

    Returns a dict with:
      - 'files': mapping rel_id -> saved file path
      - 'positions': list of tuples
          (doc_index, run_idx, rel_id, filename, width_px, height_px)
        The first element is doc_index (NOT paragraph index). Downstream
        code in to_markdown() reads this list keyed by doc_index.
      - 'has_cover': True if a cover was detected and saved as cover.png
      - 'book_name': slug used for building asset URLs
    """
    try:
        from docx import Document
    except ImportError:
        raise ImportError("pip install python-docx")

    doc = Document(docx_path)
    assets_dir = Path(assets_base_dir) / book_name / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    # Build rel_id -> {data, ext} map. We still need the docx doc object
    # here because ingest does not ship image bytes across to parse.
    image_data = {}
    for rel_id, rel in doc.part.rels.items():
        if "image" not in rel.reltype:
            continue
        try:
            img_bytes = rel.target_part.blob
            content_type = rel.target_part.content_type
            ext = content_type.split("/")[-1]
            if ext == "jpeg":
                ext = "jpg"
            image_data[rel_id] = {"data": img_bytes, "ext": ext}
        except Exception:
            continue

    # Pull the pre-computed image records from ingest. Each record is a
    # dict with doc_index, run_index, rel_id, width_emu, height_emu,
    # source ("paragraph" or "sdt").
    raw_images = ingested.get("images", []) if isinstance(ingested, dict) else []

    # Sort by document position so the cover (if any) comes first and
    # sequential numbering matches reading order.
    raw_images_sorted = sorted(raw_images, key=lambda x: (x.get("doc_index", 0), x.get("run_index", 0)))

    # Decide which rel_id is the cover image, if any.
    has_cover = False
    cover_rel_id = None

    if raw_images_sorted:
        first = raw_images_sorted[0]
        if first.get("source") == "sdt":
            # SDT-sourced image: treat the last SDT image as the cover.
            # (Some cover pages contain multiple images; the final one
            # is typically the hero image.)
            sdt_imgs = [img for img in raw_images_sorted if img.get("source") == "sdt"]
            if sdt_imgs:
                cover_rel_id = sdt_imgs[-1]["rel_id"]
                has_cover = True
                print("[OK] Cover image found: SDT image (cover page)")
        elif first.get("doc_index", 999) < 15:
            cover_rel_id = first["rel_id"]
            has_cover = True
            print(f"[OK] Cover image found: first image at doc_index {first['doc_index']}")
        else:
            print(f"[WARN] No cover: first image at doc_index {first.get('doc_index')} (too late)")
            print("  All images will be numbered sequentially (no cover.png)")

    print(f"  [DEBUG] rel images found: {len(image_data)}")
    print(f"  [DEBUG] positioned images found: {len(raw_images_sorted)}")
    print(f"  [DEBUG] has_cover: {has_cover}, cover_rel_id: {cover_rel_id}")

    # Save images to disk and build the positions list.
    #
    # Positions tuple shape stays compatible with existing consumers
    # in to_markdown():
    #   (doc_index, run_idx, rel_id, filename, width_px, height_px)
    # The first element is now doc_index rather than the old
    # paragraph index; to_markdown()'s per-chapter filtering uses
    # the same doc_index range, so the meaning is the same.
    image_files = {}
    image_positions = []
    image_counter = 1

    for img in raw_images_sorted:
        rel_id = img.get("rel_id")
        if rel_id not in image_data:
            # Defensive: an embed referencing a missing image part.
            continue

        info = image_data[rel_id]

        if has_cover and rel_id == cover_rel_id:
            filename = "cover.png"
        else:
            filename = f"image-{str(image_counter).zfill(2)}.{info['ext']}"
            image_counter += 1

        img_path = assets_dir / filename
        with open(img_path, "wb") as f:
            f.write(info["data"])

        # Convert EMU (English Metric Units) to pixels for the
        # rendered <img> tag. 914400 EMU per inch, 96 px per inch.
        w_px = round(img.get("width_emu", 0) / 914400 * 96) if img.get("width_emu") else 0
        h_px = round(img.get("height_emu", 0) / 914400 * 96) if img.get("height_emu") else 0

        image_files[rel_id] = str(img_path)
        image_positions.append((
            img.get("doc_index", 0),
            img.get("run_index", 0),
            rel_id,
            filename,
            w_px,
            h_px,
        ))

    print(f"  [DEBUG] saved images: {[p[3] for p in image_positions]}")

    return {
        "files": image_files,
        "positions": image_positions,
        "has_cover": has_cover,
        "book_name": book_name,
    }


def _clean_markdown_preserving_code(text: str) -> str:
    """
    Apply markdown cleanup only outside protected code regions.

    Protected regions:
    1. Standard fenced code blocks: ```...```
    2. Full single-line CodeRenderer component lines
    """
    lines = text.splitlines(keepends=True)
    cleaned_lines = []

    in_fenced_code = False

    for line in lines:
        stripped = line.strip()

        # Preserve fenced code blocks exactly as-is
        if stripped.startswith("```"):
            in_fenced_code = not in_fenced_code
            cleaned_lines.append(line)
            continue

        if in_fenced_code:
            cleaned_lines.append(line)
            continue

        # Preserve full CodeRenderer line exactly as-is
        if stripped.startswith("<CodeRenderer ") and stripped.endswith("/>"):
            cleaned_lines.append(line)
            continue

        cleaned_lines.append(_clean_markdown_final(line))

    return "".join(cleaned_lines)

def _preserve_soft_breaks(text: str) -> str:
    """
    Convert Word soft line breaks to Markdown hard line breaks.

    Word Shift+Enter is represented earlier as '\\n'.
    In Markdown, two spaces + newline preserve a visible line break.
    """
    if "\n" not in text:
        return text
    return text.replace("\n", "  \n")

def _detect_code_block_start(text: str) -> str | None:
    """
    Detect standard fenced code block start only.

    Supported:
    - ```python
    - ```bash
    - ```javascript
    - ```

    Instrumented: we count detections to confirm whether this branch
    is still needed after ingest.py classifies code paragraphs by style.
    """
    if not text:
        return None

    stripped = text.strip()
    if not stripped.startswith("```"):
        return None

    lang = stripped[3:].strip().lower()

    aliases = {
        "py": "python",
        "python": "python",
        "sh": "bash",
        "shell": "bash",
        "bash": "bash",
        "zsh": "bash",
        "js": "javascript",
        "javascript": "javascript",
        "ts": "typescript",
        "typescript": "typescript",
        "md": "markdown",
        "markdown": "markdown",
        "yml": "yaml",
        "yaml": "yaml",
        "ps1": "powershell",
        "powershell": "powershell",
    }

    if not lang:
        _CLEAN_STATS["detect_code_block_start_fired"] += 1
        return "text"

    _CLEAN_STATS["detect_code_block_start_fired"] += 1
    return aliases.get(lang, lang)

def to_markdown(chapter: dict, image_positions: list = None, next_heading_idx: int = None, book_name: str = "") -> str:
    lines = [f"# {chapter['title']}", ""]

    content = chapter["content"]
    if not content:
        return "\n".join(lines)

    ch_start = chapter.get("heading_doc_index", 0)
    ch_end = next_heading_idx if next_heading_idx is not None else float("inf")

    # =========================
    # Build chapter_images
    # =========================
    chapter_images = []
    if image_positions:
        for item in image_positions:
            para_idx = item[0]

            if para_idx < 0:
                continue

            run_idx = item[1]
            filename = item[3]
            w_px = item[4] if len(item) > 4 else 0
            h_px = item[5] if len(item) > 5 else 0

            if ch_start <= para_idx < ch_end:
                chapter_images.append((para_idx, run_idx, filename, w_px, h_px))

    chapter_images.sort(key=lambda x: (x[0], x[1]))

    assets_path = f"/{book_name}/assets"

    # =========================
    # Build images_by_para_run (correct)
    # =========================
    images_by_para_run = {}

    for p_idx, r_idx, filename, w_px, h_px in chapter_images:
        images_by_para_run.setdefault(p_idx, {}).setdefault(r_idx, []).append(
            (filename, w_px, h_px)
        )

    # =========================
    # Main loop
    # =========================
    i = 0

    while i < len(content):
        item = content[i]
        style = item["style"]
        text = item["text"]
        para_idx = item.get("para_index", -1)
        indent_level = item.get("indent_level", 0)

        lang_marker = _detect_code_block_start(text)

        # =========================
        # Spacing
        # =========================
        if style == "Spacing":
            lines.append("")
            i += 1
            continue

        # =========================
        # Code blocks
        # =========================
        elif lang_marker:
            code_lines = []
            j = i + 1
            closing_found = False

            while j < len(content):
                next_text = content[j]["text"]

                if next_text.strip() == "```":
                    closing_found = True
                    j += 1
                    break

                code_lines.append(next_text)
                j += 1

            if closing_found:
                lines.append(f"```{lang_marker}")
                lines.extend(code_lines)
                lines.append("```")
                lines.append("")

                i = j
                continue
            else:
                lines.append(_preserve_soft_breaks(text))
                lines.append("")
                i += 1
                continue

        # =========================
        # Inline code
        # =========================
        # Rely on the style set by ingest.py, which classifies paragraphs
        # as code based on monospace fonts and language detection. The old
        # fallback of "text starts with backtick" misfired on Markdown-
        # about-Markdown content (books that discuss code syntax).
        elif style == "code":
            lines.append(text)
            lines.append("")
            i += 1
            continue

        # =========================
        # Headings
        # =========================
        elif "Heading 2" in style:
            lines.append(f"## {text}")

        elif "Heading 3" in style:
            lines.append(f"### {text}")

        # =========================
        # Lists
        # =========================
        # ingest.py already injects the correct list prefix (bullet char or
        # number) and indentation into the text, based on the numbering data
        # it extracted from the .docx file. We pass the text through as-is.
        # Previously this branch added another "- " prefix, which produced
        # duplicate markers like "- •" or "- 1)" that _clean_markdown_final
        # then had to clean up with regex (rules 02 and 03).
        elif "List" in style:
            lines.append(text)

        # =========================
        # Tables
        # =========================
        elif style == "Table":
            lines.append(text)

        # =========================
        # Image-only anchors
        # =========================
        # These content items come from paragraphs in the source docx
        # that contained only an image (no text). ingest.py emits
        # them so parse.py preserves the positional slot; to_markdown
        # renders only the image here, with no paragraph text.
        elif style == "ImageAnchor":
            para_images = images_by_para_run.get(para_idx, {})
            for r_idx in sorted(para_images.keys()):
                for img_filename, w_px, h_px in para_images[r_idx]:
                    if w_px > 0 and h_px > 0:
                        lines.append(
                            f'<img src="{assets_path}/{img_filename}" alt="{img_filename}" width="{w_px}" height="{h_px}" />'
                        )
                    else:
                        lines.append(f"![{img_filename}]({assets_path}/{img_filename})")
                    lines.append("")

        # =========================
        # Paragraph + images (INLINE)
        # =========================
        else:
            para_images = images_by_para_run.get(para_idx, {})

            # Images BEFORE text (run 0)
            if 0 in para_images:
                for img_filename, w_px, h_px in para_images[0]:
                    if w_px > 0 and h_px > 0:
                        lines.append(
                            f'<img src="{assets_path}/{img_filename}" alt="{img_filename}" width="{w_px}" height="{h_px}" />'
                        )
                    else:
                        lines.append(f"![{img_filename}]({assets_path}/{img_filename})")
                    lines.append("")

            # Text
            lines.append(_preserve_soft_breaks(text))

            # Images AFTER text (run order)
            for r_idx in sorted(para_images.keys()):
                if r_idx == 0:
                    continue

                for img_filename, w_px, h_px in para_images[r_idx]:
                    if w_px > 0 and h_px > 0:
                        lines.append(
                            f'<img src="{assets_path}/{img_filename}" alt="{img_filename}" width="{w_px}" height="{h_px}" />'
                        )
                    else:
                        lines.append(f"![{img_filename}]({assets_path}/{img_filename})")
                    lines.append("")

        lines.append("")
        i += 1

    result = "\n".join(lines)
    result = _clean_markdown_preserving_code(result)

    return result