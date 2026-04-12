"""
Reads a Word or PDF file and extracts raw text.
Supports .docx and .pdf formats.
Extracts numbered lists, tables, hyperlinks, footnotes, code, and rich formatting.
"""

from pathlib import Path

try:
    from docx import Document
    from docx.oxml.ns import qn
except ImportError:
    raise ImportError(
        "\n\n" + "="*60 + "\n"
        "חסרה חבילת python-docx!\n"
        "התקן באמצעות: pip install python-docx\n"
        + "="*60 + "\n"
    )


# XML namespaces for Word document parsing
W_NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R_NS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
A_NS = '{http://schemas.openxmlformats.org/drawingml/2006/main}'

# Monospace fonts that indicate code
MONOSPACE_FONTS = {
    'courier', 'courier new', 'consolas', 'monaco', 'menlo',
    'lucida console', 'dejavu sans mono', 'source code pro',
    'fira code', 'jetbrains mono', 'inconsolata', 'roboto mono'
}

# Language detection patterns for code blocks
import re

LANGUAGE_PATTERNS = {
    'python': [
        r'\bdef\s+\w+\s*\(',           # def function_name(
        r'\bclass\s+\w+[:\(]',          # class ClassName: or class ClassName(
        r'\bimport\s+\w+',              # import module
        r'\bfrom\s+\w+\s+import',       # from module import
        r'\bprint\s*\(',                # print(
        r'\bif\s+__name__\s*==',        # if __name__ ==
        r'\bself\.',                    # self.
        r'\bfor\s+\w+\s+in\s+',         # for x in
        r'\blen\s*\(',                  # len(
        r'\brange\s*\(',                # range(
        r'\breturn\s+',                 # return
        r'^\s*#\s*[^\!]',               # Python comment (not shebang)
    ],
    'bash': [
        r'^#!/bin/(ba)?sh',             # shebang
        r'\$\{?\w+\}?',                 # $VAR or ${VAR}
        r'\becho\s+',                   # echo
        r'\bcd\s+',                     # cd
        r'\bls\b',                      # ls
        r'\bmkdir\s+',                  # mkdir
        r'\brm\s+',                     # rm
        r'\bcp\s+',                     # cp
        r'\bmv\s+',                     # mv
        r'\bcat\s+',                    # cat
        r'\bgrep\s+',                   # grep
        r'\bawk\s+',                    # awk
        r'\bsed\s+',                    # sed
        r'\bcurl\s+',                   # curl
        r'\bwget\s+',                   # wget
        r'\bsudo\s+',                   # sudo
        r'\bapt(-get)?\s+',             # apt/apt-get
        r'\bnpm\s+',                    # npm
        r'\bpip\s+',                    # pip
        r'\bgit\s+',                    # git
        r'\bdocker\s+',                 # docker
        r'^\s*\|\s*',                   # pipe at start
        r'\s+\|\s+',                    # pipe
        r'\s+&&\s+',                    # && operator
    ],
    'javascript': [
        r'\bconst\s+\w+\s*=',           # const x =
        r'\blet\s+\w+\s*=',             # let x =
        r'\bvar\s+\w+\s*=',             # var x =
        r'\bfunction\s+\w+\s*\(',       # function name(
        r'=>\s*[{\(]?',                 # arrow function
        r'\bconsole\.(log|error|warn)', # console.log
        r'\brequire\s*\(',              # require(
        r'\bexport\s+(default\s+)?',    # export
        r'\basync\s+function',          # async function
        r'\bawait\s+',                  # await
        r'\.then\s*\(',                 # Promise .then(
        r'\.forEach\s*\(',              # .forEach(
        r'\.map\s*\(',                  # .map(
    ],
    'typescript': [
        r':\s*(string|number|boolean|void|any)\b',  # type annotations
        r'\binterface\s+\w+',           # interface
        r'\btype\s+\w+\s*=',            # type alias
        r'<\w+>',                       # generics
        r'\bas\s+\w+',                  # type assertion
    ],
    'json': [
        r'^\s*\{[\s\n]*"',              # starts with {"
        r'^\s*\[[\s\n]*[\{\[]',         # starts with [ or [{
    ],
    'sql': [
        r'\bSELECT\b',                  # SELECT
        r'\bFROM\b',                    # FROM
        r'\bWHERE\b',                   # WHERE
        r'\bINSERT\s+INTO\b',           # INSERT INTO
        r'\bUPDATE\b',                  # UPDATE
        r'\bDELETE\s+FROM\b',           # DELETE FROM
        r'\bCREATE\s+TABLE\b',          # CREATE TABLE
    ],
    'html': [
        r'<(!DOCTYPE|html|head|body|div|span|p|a|img)',  # HTML tags
        r'</\w+>',                      # closing tags
    ],
    'css': [
        r'\{\s*[\w-]+\s*:',             # { property:
        r'\.[a-zA-Z][\w-]*\s*\{',       # .class {
        r'#[a-zA-Z][\w-]*\s*\{',        # #id {
    ],
}


def _detect_code_language(text: str) -> str:
    """
    Detect the programming language of a code block based on content patterns.
    Returns the detected language or empty string if unknown.
    """
    if not text or not text.strip():
        return ''
    
    scores = {}
    
    for lang, patterns in LANGUAGE_PATTERNS.items():
        score = 0
        for pattern in patterns:
            try:
                matches = re.findall(pattern, text, re.MULTILINE | re.IGNORECASE)
                score += len(matches)
            except:
                pass
        if score > 0:
            scores[lang] = score
    
    if not scores:
        return ''
    
    # TypeScript should override JavaScript if both match
    if 'typescript' in scores and 'javascript' in scores:
        if scores['typescript'] >= 2:  # Need strong TS signals
            return 'typescript'
        return 'javascript'
    
    # Return language with highest score
    best_lang = max(scores, key=scores.get)
    
    # Require minimum score for confidence
    if scores[best_lang] >= 1:
        return best_lang
    
    return ''


def ingest(file_path: str) -> dict:
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if path.suffix == ".docx":
        return _ingest_docx(path)
    elif path.suffix == ".pdf":
        return _ingest_pdf(path)
    else:
        raise ValueError(f"Unsupported format: {path.suffix}")


def _format_runs(para, hyperlinks: dict = None) -> str:
    """
    Convert paragraph runs to Markdown-formatted text.
    Preserves bold (**text**), italic (*text*), and bold+italic (***text***).
    Preserves underline, superscript, subscript, code (monospace), and hyperlinks.
    Preserves soft line breaks (Shift+Enter) as newlines.
    Consecutive runs with the same formatting are merged before wrapping.
    
    Args:
        para: Word paragraph object
        hyperlinks: Dict mapping relationship IDs to URLs
    """
    if not para.runs:
        return para.text.strip()
    
    # Get hyperlink info from paragraph XML
    para_hyperlinks = _extract_paragraph_hyperlinks(para, hyperlinks or {})
    
    # Group consecutive runs by formatting type
    groups = []  # [(formatting_type, text, url), ...]
    
    for run in para.runs:
        # Check for line breaks within the run (soft returns / Shift+Enter)
        # In Word XML these are <w:br/> elements
        run_xml = run._element
        text_parts = []
        
        for child in run_xml:
            tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if tag == 't':  # Text element
                text_parts.append(child.text or '')
            elif tag == 'br':  # Line break element
                text_parts.append('\n')
            elif tag == 'tab':  # Tab element
                text_parts.append('\t')
        
        text = ''.join(text_parts) if text_parts else run.text or ''
        
        if not text:
            continue
        
        # Check if this run is part of a hyperlink
        url = None
        for hl_start, hl_end, hl_url in para_hyperlinks:
            # Find run position in paragraph
            run_start = para.text.find(text)
            if run_start >= hl_start and run_start < hl_end:
                url = hl_url
                break
        
        # Determine formatting type
        fmt = _get_run_format(run)
        
        # Merge with previous group if same formatting and URL
        if groups and groups[-1][0] == fmt and groups[-1][2] == url:
            groups[-1] = (fmt, groups[-1][1] + text, url)
        else:
            groups.append((fmt, text, url))
    
    # Convert groups to markdown
    parts = []
    for fmt, text, url in groups:
        formatted = _apply_format(fmt, text)
        
        # Wrap in hyperlink if URL present
        if url:
            formatted = f"[{formatted}]({url})"
        
        parts.append(formatted)
    
    result = "".join(parts).strip()
    
    # Clean up redundant asterisks
    result = _clean_markdown_asterisks(result)
    
    return result if result else para.text.strip()


# Default font size threshold (in half-points, Word standard is 24 = 12pt)
DEFAULT_FONT_SIZE = 24  # 12pt
SMALL_FONT_THRESHOLD = 18  # 9pt - smaller text


def _get_run_format(run) -> str:
    """
    Determine the formatting type of a run.
    Returns a format string: plain, bold, italic, bold_italic, code, 
    underline, superscript, subscript, large, small, or combinations.
    """
    formats = []
    
    # Check for monospace font (code)
    try:
        font_name = run.font.name
        if font_name and font_name.lower() in MONOSPACE_FONTS:
            return "code"  # Code takes precedence
    except:
        pass
    
    # Check standard formatting
    is_bold = bool(run.bold)
    is_italic = bool(run.italic)
    is_underline = bool(run.underline)
    
    # Check font size for small text only
    font_size = None
    try:
        if run.font.size:  # Size in EMUs, need to convert
            font_size = run.font.size.pt * 2  # Convert to half-points
        else:
            # Try to get from XML directly
            rPr = run._element.find(f'{W_NS}rPr')
            if rPr is not None:
                sz = rPr.find(f'{W_NS}sz')
                if sz is not None:
                    font_size = int(sz.get(f'{W_NS}val', DEFAULT_FONT_SIZE))
    except:
        pass
    
    is_small = font_size and font_size <= SMALL_FONT_THRESHOLD
    
    # Check superscript/subscript via XML
    is_superscript = False
    is_subscript = False
    try:
        rPr = run._element.find(f'{W_NS}rPr')
        if rPr is not None:
            vert_align = rPr.find(f'{W_NS}vertAlign')
            if vert_align is not None:
                val = vert_align.get(f'{W_NS}val')
                if val == 'superscript':
                    is_superscript = True
                elif val == 'subscript':
                    is_subscript = True
    except:
        pass
    
    # Return appropriate format
    if is_superscript:
        return "superscript"
    if is_subscript:
        return "subscript"
    if is_bold and is_italic:
        return "bold_italic"
    if is_bold:
        return "bold"
    if is_italic:
        return "italic"
    if is_underline:
        return "underline"
    if is_small:
        return "small"
    
    return "plain"


def _apply_format(fmt: str, text: str) -> str:
    """Apply markdown formatting to text based on format type."""
    if fmt == "bold_italic":
        return f"***{text}***"
    elif fmt == "bold":
        return f"**{text}**"
    elif fmt == "italic":
        return f"*{text}*"
    elif fmt == "code":
        # Use backticks for code blocks with language detection
        if '\n' in text or len(text) > 60:
            # Multi-line or long code - use fenced code block
            lang = _detect_code_language(text)
            return f"```{lang}\n{text}\n```"
        return f"`{text}`"
    elif fmt == "underline":
        return f"<u>{text}</u>"
    elif fmt == "superscript":
        return f"<sup>{text}</sup>"
    elif fmt == "subscript":
        return f"<sub>{text}</sub>"
    elif fmt == "small":
        return f"<small>{text}</small>"
    else:
        return text


def _extract_paragraph_hyperlinks(para, doc_hyperlinks: dict) -> list:
    """
    Extract hyperlinks from a paragraph.
    Returns list of (start_pos, end_pos, url) tuples.
    """
    hyperlinks = []
    
    try:
        # Find hyperlink elements in paragraph XML
        for hl in para._element.findall(f'.//{W_NS}hyperlink'):
            # Get relationship ID
            r_id = hl.get(f'{R_NS}id')
            if r_id and r_id in doc_hyperlinks:
                url = doc_hyperlinks[r_id]
                # Get text content
                text = ''.join(t.text or '' for t in hl.findall(f'.//{W_NS}t'))
                if text:
                    start = para.text.find(text)
                    if start >= 0:
                        hyperlinks.append((start, start + len(text), url))
    except:
        pass
    
    return hyperlinks


def _clean_markdown_asterisks(text: str) -> str:
    """
    Clean up malformed markdown asterisks from Word formatting artifacts.
    This is the FIRST cleanup pass - parse.py has a final cleanup for any remaining issues.
    
    Patterns fixed:
    - **** (4+ asterisks) → **
    - **text****more** → **text more**
    - ** ** (space between markers) → space
    - Orphaned ** at start/end
    - Hebrew prefix letters: ה**text** → **הtext**
    """
    import re
    
    # Remove 4+ consecutive asterisks → **
    text = re.sub(r'\*{4,}', '**', text)
    
    # Fix patterns like **text****more** (adjacent bold without space)
    text = re.sub(r'\*\*([^*]+)\*\*\*\*([^*]+)\*\*', r'**\1 \2**', text)
    
    # Fix space between bold markers: ** ** → just space
    text = re.sub(r'\*\*\s+\*\*', ' ', text)
    
    # Clean leading/trailing orphaned **
    text = re.sub(r'^\*\*\s*\*\*', '', text)
    text = re.sub(r'\*\*\s*\*\*$', '', text)
    
    # Fix Hebrew prefix letters before bold: ה**text** → **הtext**
    # Hebrew prefix letters (אותיות השימוש): ה, ו, ב, כ, ל, מ, ש
    text = re.sub(r'([הובכלמש])\*\*([^*]+)\*\*', r'**\1\2**', text)
    
    # Fix **text**.**  → **text**.
    text = re.sub(r'\*\*\.\*\*', '.', text)
    
    # Fix **:** → :
    text = re.sub(r'\*\*:\*\*', ':', text)
    
    return text.strip()


def _get_paragraph_spacing(para) -> bool:
    """
    Check if paragraph has significant spacing before it.
    Returns True if there's explicit space-before in Word paragraph properties.
    
    Word stores spacing in twips (1/20 of a point, 1440 twips = 1 inch).
    We consider spacing > 240 twips (12pt, roughly one line) as significant.
    """
    try:
        p_pr = para._element.find(f'{W_NS}pPr')
        if p_pr is None:
            return False
        
        spacing = p_pr.find(f'{W_NS}spacing')
        if spacing is None:
            return False
        
        # Check space before (w:before attribute)
        before = spacing.get(f'{W_NS}before')
        if before:
            try:
                # 240 twips = 12pt = roughly one line height
                if int(before) > 240:
                    return True
            except ValueError:
                pass
        
        # Check line spacing (w:line with w:lineRule="exact" or "atLeast")
        line = spacing.get(f'{W_NS}line')
        line_rule = spacing.get(f'{W_NS}lineRule')
        if line and line_rule in ('exact', 'atLeast'):
            try:
                # Large line spacing indicates intentional spacing
                if int(line) > 480:  # > 24pt
                    return True
            except ValueError:
                pass
        
        return False
    except Exception:
        return False


def _get_paragraph_alignment(para) -> str:
    """
    Get paragraph alignment from Word properties.
    Returns: 'left', 'right', 'center', 'justify', or None for default.
    
    Word stores alignment in <w:jc w:val="..."/> inside <w:pPr>.
    Values: left, right, center, both (justify), start, end
    """
    try:
        p_pr = para._element.find(f'{W_NS}pPr')
        if p_pr is None:
            return None
        
        jc = p_pr.find(f'{W_NS}jc')
        if jc is None:
            return None
        
        val = jc.get(f'{W_NS}val')
        
        # Map Word alignment values to CSS
        alignment_map = {
            'left': 'left',
            'right': 'right',
            'center': 'center',
            'both': 'justify',
            'start': 'left',   # LTR start = left
            'end': 'right',    # LTR end = right
        }
        
        return alignment_map.get(val)
    except Exception:
        return None


def _apply_alignment_wrapper(text: str, alignment: str) -> str:
    """
    Wrap text with alignment HTML if needed.
    For left-aligned text in RTL context, adds dir="ltr" div.
    """
    if not alignment:
        return text
    
    # Left alignment in Hebrew doc - wrap with LTR container
    if alignment == 'left':
        return f'<div dir="ltr" style="text-align: left">\n\n{text}\n\n</div>'
    
    # Center alignment
    if alignment == 'center':
        return f'<div style="text-align: center">\n\n{text}\n\n</div>'
    
    # Justify - usually default, no wrapper needed
    if alignment == 'justify':
        return text
    
    # Right is default for Hebrew, no wrapper needed
    return text


def _ingest_docx(path: Path) -> dict:
    doc = Document(path)
    paragraphs = []
    
    # Build numbering tracker: {(numId, ilvl): current_count}
    numbering_counters = {}
    # Cache numbering definitions from document
    numbering_formats = _extract_numbering_formats(doc)
    
    # Extract hyperlinks from document relationships
    doc_hyperlinks = _extract_document_hyperlinks(doc)
    
    # Extract footnotes
    footnotes = _extract_footnotes(doc)
    
    # Track consecutive empty paragraphs
    empty_count = 0
    
    # Track paragraph index including tables
    doc_idx = 0

    # Process document body elements in order (paragraphs and tables)
    body = doc._element.body
    for element in body:
        tag = element.tag.split('}')[-1] if '}' in element.tag else element.tag
        
        if tag == 'p':  # Paragraph
            para = None
            # Find matching paragraph object
            for p in doc.paragraphs:
                if p._element is element:
                    para = p
                    break
            
            if para is None:
                doc_idx += 1
                continue
            
            text_content = para.text.strip()
            
            if not text_content:
                # Empty paragraph - track for spacing
                empty_count += 1
                doc_idx += 1
                continue
            
            # Get paragraph spacing from Word properties
            spacing_before = _get_paragraph_spacing(para)
            
            # Add blank lines for spacing (empty paragraphs or explicit spacing)
            if empty_count > 0 or spacing_before:
                blank_lines = max(empty_count, 1 if spacing_before else 0)
                if blank_lines > 0 and paragraphs:
                    paragraphs.append({
                        "text": "",
                        "style": "Spacing",
                        "doc_para_index": doc_idx,
                        "blank_lines": blank_lines
                    })
            
            empty_count = 0
            
            # Check if paragraph has numbering
            num_info = _get_paragraph_numbering_info(para, numbering_counters, numbering_formats)
            text = _format_runs(para, doc_hyperlinks)
            
            # Handle footnote references in text
            text = _process_footnote_refs(para, text, footnotes)
            
            # Add numbering with proper indentation for nested lists
            if num_info:
                num_prefix, indent_level = num_info
                indent = "  " * indent_level  # 2 spaces per level
                text = f"{indent}{num_prefix} {text}"
            
            # Get and apply alignment (for left-aligned English in Hebrew docs)
            alignment = _get_paragraph_alignment(para)
            if alignment and alignment != 'right':  # Not default RTL alignment
                text = _apply_alignment_wrapper(text, alignment)
            
            paragraphs.append({
                "text": text,
                "style": para.style.name,
                "doc_para_index": doc_idx,
                "alignment": alignment
            })
            
            doc_idx += 1
            
        elif tag == 'tbl':  # Table
            # Add spacing before table
            if paragraphs:
                paragraphs.append({
                    "text": "",
                    "style": "Spacing",
                    "doc_para_index": doc_idx,
                    "blank_lines": 1
                })
            
            # Extract table as markdown
            table_md = _table_to_markdown(element, doc_hyperlinks)
            if table_md:
                paragraphs.append({
                    "text": table_md,
                    "style": "Table",
                    "doc_para_index": doc_idx
                })
            
            # Add spacing after table
            paragraphs.append({
                "text": "",
                "style": "Spacing",
                "doc_para_index": doc_idx,
                "blank_lines": 1
            })
            
            doc_idx += 1
            empty_count = 0

    return {
        "file": path.name,
        "format": "docx",
        "paragraphs": paragraphs,
        "total": len(paragraphs),
        "footnotes": footnotes
    }


def _extract_document_hyperlinks(doc) -> dict:
    """
    Extract all hyperlinks from document relationships.
    Returns dict: {rId: url}
    """
    hyperlinks = {}
    try:
        for rel in doc.part.rels.values():
            if "hyperlink" in rel.reltype:
                hyperlinks[rel.rId] = rel._target
    except:
        pass
    return hyperlinks


def _extract_footnotes(doc) -> dict:
    """
    Extract footnotes from document.
    Returns dict: {footnote_id: footnote_text}
    """
    footnotes = {}
    try:
        # Access footnotes part
        footnotes_part = doc.part.footnotes_part
        if footnotes_part:
            footnotes_xml = footnotes_part._element
            for fn in footnotes_xml.findall(f'.//{W_NS}footnote'):
                fn_id = fn.get(f'{W_NS}id')
                if fn_id and fn_id not in ('0', '-1'):  # Skip separator footnotes
                    # Get text content
                    text = ''.join(
                        t.text or '' 
                        for t in fn.findall(f'.//{W_NS}t')
                    ).strip()
                    if text:
                        footnotes[fn_id] = text
    except:
        pass
    return footnotes


def _process_footnote_refs(para, text: str, footnotes: dict) -> str:
    """
    Replace footnote references with markdown footnote syntax.
    """
    try:
        for fn_ref in para._element.findall(f'.//{W_NS}footnoteReference'):
            fn_id = fn_ref.get(f'{W_NS}id')
            if fn_id and fn_id in footnotes:
                # Add footnote reference using markdown syntax
                text = text + f"[^{fn_id}]"
    except:
        pass
    return text


def _table_to_markdown(tbl_element, hyperlinks: dict) -> str:
    """
    Convert Word table element to markdown table.
    """
    rows = []
    
    try:
        for tr in tbl_element.findall(f'.//{W_NS}tr'):
            cells = []
            for tc in tr.findall(f'.//{W_NS}tc'):
                # Get cell text
                cell_text = ' '.join(
                    t.text or ''
                    for t in tc.findall(f'.//{W_NS}t')
                ).strip()
                # Escape pipe characters in cell content
                cell_text = cell_text.replace('|', '\\|')
                cells.append(cell_text)
            
            if cells:
                rows.append(cells)
        
        if not rows:
            return ""
        
        # Build markdown table
        lines = []
        
        # Header row
        lines.append("| " + " | ".join(rows[0]) + " |")
        
        # Separator row
        lines.append("| " + " | ".join(["---"] * len(rows[0])) + " |")
        
        # Data rows
        for row in rows[1:]:
            # Pad row if needed
            while len(row) < len(rows[0]):
                row.append("")
            lines.append("| " + " | ".join(row) + " |")
        
        return "\n".join(lines)
        
    except:
        return ""


def _get_paragraph_numbering_info(para, counters: dict, formats: dict) -> tuple:
    """
    Get the numbering prefix and indent level for a paragraph.
    Returns (prefix, indent_level) tuple or None if no numbering.
    """
    result = _get_paragraph_numbering(para, counters, formats)
    if not result:
        return None
    
    # Get indent level from ilvl
    try:
        p_pr = para._element.find(f'{W_NS}pPr')
        if p_pr is not None:
            num_pr = p_pr.find(f'{W_NS}numPr')
            if num_pr is not None:
                ilvl_elem = num_pr.find(f'{W_NS}ilvl')
                if ilvl_elem is not None:
                    ilvl = int(ilvl_elem.get(f'{W_NS}val', '0'))
                    return (result, ilvl)
    except:
        pass
    
    return (result, 0)


def _extract_numbering_formats(doc) -> dict:
    """
    Extract numbering format definitions from document.
    Returns dict: {(numId, ilvl): {'numFmt': 'decimal'|'bullet'|'lowerLetter'|etc, 'lvlText': '%1.'}}
    """
    formats = {}
    
    try:
        # Access the numbering part of the document
        numbering_part = doc.part.numbering_part
        if numbering_part is None:
            return formats
        
        numbering_xml = numbering_part._element
        
        # Build abstractNum definitions: {abstractNumId: {ilvl: format_info}}
        abstract_nums = {}
        for abstract_num in numbering_xml.findall(f'{W_NS}abstractNum'):
            abstract_id = abstract_num.get(f'{W_NS}abstractNumId')
            if abstract_id:
                abstract_nums[abstract_id] = {}
                for lvl in abstract_num.findall(f'{W_NS}lvl'):
                    ilvl = lvl.get(f'{W_NS}ilvl', '0')
                    
                    # Get number format (decimal, bullet, lowerLetter, etc.)
                    num_fmt_elem = lvl.find(f'{W_NS}numFmt')
                    num_fmt = num_fmt_elem.get(f'{W_NS}val', 'decimal') if num_fmt_elem is not None else 'decimal'
                    
                    # Get level text pattern (e.g., "%1.", "%1)", "(%1)")
                    lvl_text_elem = lvl.find(f'{W_NS}lvlText')
                    lvl_text = lvl_text_elem.get(f'{W_NS}val', '%1.') if lvl_text_elem is not None else '%1.'
                    
                    # Get start value
                    start_elem = lvl.find(f'{W_NS}start')
                    start = int(start_elem.get(f'{W_NS}val', '1')) if start_elem is not None else 1
                    
                    abstract_nums[abstract_id][ilvl] = {
                        'numFmt': num_fmt,
                        'lvlText': lvl_text,
                        'start': start
                    }
        
        # Map numId to abstractNumId
        for num in numbering_xml.findall(f'{W_NS}num'):
            num_id = num.get(f'{W_NS}numId')
            abstract_ref = num.find(f'{W_NS}abstractNumId')
            if num_id and abstract_ref is not None:
                abstract_id = abstract_ref.get(f'{W_NS}val')
                if abstract_id in abstract_nums:
                    for ilvl, fmt_info in abstract_nums[abstract_id].items():
                        formats[(num_id, ilvl)] = fmt_info
    
    except Exception:
        # If numbering extraction fails, return empty - paragraphs will still be extracted
        pass
    
    return formats


def _get_paragraph_numbering(para, counters: dict, formats: dict) -> str:
    """
    Get the numbering prefix for a paragraph if it has one.
    Updates counters in place.
    Returns the formatted number string (e.g., "1.", "א.", "a)") or empty string.
    """
    try:
        # Find numPr in paragraph properties
        p_pr = para._element.find(f'{W_NS}pPr')
        if p_pr is None:
            return ""
        
        num_pr = p_pr.find(f'{W_NS}numPr')
        if num_pr is None:
            return ""
        
        # Get numId and ilvl
        num_id_elem = num_pr.find(f'{W_NS}numId')
        ilvl_elem = num_pr.find(f'{W_NS}ilvl')
        
        if num_id_elem is None:
            return ""
        
        num_id = num_id_elem.get(f'{W_NS}val')
        ilvl = ilvl_elem.get(f'{W_NS}val', '0') if ilvl_elem is not None else '0'
        
        if num_id == '0':  # numId 0 means no numbering
            return ""
        
        key = (num_id, ilvl)
        
        # Get format info
        fmt_info = formats.get(key, {'numFmt': 'decimal', 'lvlText': '%1.', 'start': 1})
        
        # Initialize or increment counter
        if key not in counters:
            counters[key] = fmt_info.get('start', 1)
        else:
            counters[key] += 1
        
        current_num = counters[key]
        
        # Format the number based on numFmt
        num_fmt = fmt_info['numFmt']
        lvl_text = fmt_info['lvlText']
        
        if num_fmt == 'bullet':
            # Return the actual bullet character from lvlText
            return _get_bullet_char(lvl_text)
        elif num_fmt == 'decimal':
            formatted = str(current_num)
        elif num_fmt == 'lowerLetter':
            formatted = chr(ord('a') + (current_num - 1) % 26)
        elif num_fmt == 'upperLetter':
            formatted = chr(ord('A') + (current_num - 1) % 26)
        elif num_fmt == 'lowerRoman':
            formatted = _to_roman(current_num).lower()
        elif num_fmt == 'upperRoman':
            formatted = _to_roman(current_num)
        elif num_fmt == 'hebrew1':  # Hebrew letters (א, ב, ג...)
            formatted = _to_hebrew_letter(current_num)
        elif num_fmt == 'hebrew2':  # Hebrew numerals
            formatted = _to_hebrew_letter(current_num)
        else:
            formatted = str(current_num)
        
        # Apply level text pattern (e.g., "%1." → "1.", "(%1)" → "(1)")
        result = lvl_text.replace('%1', formatted)
        
        return result
    
    except Exception:
        return ""


def _get_bullet_char(lvl_text: str) -> str:
    """
    Extract and normalize bullet character from Word's lvlText.
    Word uses special font characters that need to be mapped to Unicode.
    
    Common Word bullet characters:
    - Symbol font: char 183 (·), 167 (§), 216 (Ø)
    - Wingdings: various special characters
    - Unicode: •, ○, ■, □, ◆, ◇, ►, ➢, ➤, ✓, ✗
    """
    if not lvl_text:
        return "•"  # Default bullet
    
    # Map Word's special bullet characters to Unicode
    bullet_map = {
        # Symbol font bullets
        '\uf0b7': '•',  # Bullet (Symbol font)
        '\uf0a7': '§',  # Section (Symbol font)
        '\uf076': '◆',  # Diamond (Wingdings)
        '\uf0d8': '►',  # Triangle (Wingdings)
        '\uf0fc': '✓',  # Checkmark (Wingdings)
        '\uf06f': '○',  # Circle (Wingdings)
        '\uf06e': '■',  # Square (Wingdings)
        '\uf0a8': '➢',  # Arrow (Wingdings)
        # Common Unicode bullets
        '•': '•',
        '○': '○',
        '●': '●',
        '■': '■',
        '□': '□',
        '◆': '◆',
        '◇': '◇',
        '►': '►',
        '▶': '▶',
        '➢': '➢',
        '➤': '➤',
        '→': '→',
        '✓': '✓',
        '✗': '✗',
        '★': '★',
        '☆': '☆',
        '-': '-',
        '–': '–',  # En dash
        '—': '—',  # Em dash
    }
    
    # Check if lvlText is in our map
    if lvl_text in bullet_map:
        return bullet_map[lvl_text]
    
    # Check each character (lvlText might have multiple chars)
    for char in lvl_text:
        if char in bullet_map:
            return bullet_map[char]
        # Check for private use area (Word symbol fonts)
        if '\uf000' <= char <= '\uf0ff':
            # Try to map common Wingdings/Symbol chars
            code = ord(char)
            if code == 0xf0b7:  # Bullet
                return '•'
            elif code == 0xf06f:  # Circle
                return '○'
            elif code == 0xf06e:  # Square
                return '■'
            elif code == 0xf076:  # Diamond
                return '◆'
            elif code == 0xf0d8:  # Triangle
                return '►'
            elif code == 0xf0fc:  # Checkmark
                return '✓'
            else:
                return '•'  # Default for unknown symbol font chars
    
    # If it contains actual printable bullet-like character, use it
    if len(lvl_text) == 1 and ord(lvl_text) > 127:
        return lvl_text
    
    # Default to standard bullet
    return '•'


def _to_roman(num: int) -> str:
    """Convert integer to Roman numeral."""
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
    roman = ''
    for i, v in enumerate(val):
        while num >= v:
            roman += syms[i]
            num -= v
    return roman


def _to_hebrew_letter(num: int) -> str:
    """Convert integer to Hebrew letter (א=1, ב=2, ... י=10, כ=20...)."""
    if num <= 0:
        return str(num)
    
    # Hebrew letters for 1-9, 10-90, 100-400
    ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט']
    tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ']
    hundreds = ['', 'ק', 'ר', 'ש', 'ת']
    
    if num < 10:
        return ones[num]
    elif num < 100:
        return tens[num // 10] + ones[num % 10]
    elif num < 500:
        return hundreds[num // 100] + tens[(num % 100) // 10] + ones[num % 10]
    else:
        return str(num)  # Fallback for large numbers


def _ingest_pdf(path: Path) -> dict:
    try:
        from pypdf import PdfReader
    except ImportError:
        raise ImportError("pip install pypdf")

    reader = PdfReader(path)
    paragraphs = []

    for page in reader.pages:
        text = page.extract_text()
        if text:
            for line in text.split("\n"):
                if line.strip():
                    paragraphs.append({
                        "text": line.strip(),
                        "style": "Normal"
                    })

    return {
        "file": path.name,
        "format": "pdf",
        "paragraphs": paragraphs,
        "total": len(paragraphs)
    }