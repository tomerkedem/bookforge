"""
Reads a Word or PDF file and extracts raw text.
Supports .docx and .pdf formats.
Extracts numbered lists with their numbering preserved.
"""

from pathlib import Path
from docx import Document
from docx.oxml.ns import qn


# XML namespaces for Word document parsing
W_NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'


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


def _format_runs(para) -> str:
    """
    Convert paragraph runs to Markdown-formatted text.
    Preserves bold (**text**), italic (*text*), and bold+italic (***text***).
    Consecutive runs with the same formatting are merged before wrapping.
    """
    if not para.runs:
        return para.text.strip()
    
    # Group consecutive runs by formatting type
    groups = []  # [(formatting_type, text), ...]
    
    for run in para.runs:
        text = run.text
        if not text:
            continue
        
        # Determine formatting type
        is_bold = bool(run.bold)
        is_italic = bool(run.italic)
        if is_bold and is_italic:
            fmt = "bold_italic"
        elif is_bold:
            fmt = "bold"
        elif is_italic:
            fmt = "italic"
        else:
            fmt = "plain"
        
        # Merge with previous group if same formatting
        if groups and groups[-1][0] == fmt:
            groups[-1] = (fmt, groups[-1][1] + text)
        else:
            groups.append((fmt, text))
    
    # Convert groups to markdown
    parts = []
    for fmt, text in groups:
        if fmt == "bold_italic":
            parts.append(f"***{text}***")
        elif fmt == "bold":
            parts.append(f"**{text}**")
        elif fmt == "italic":
            parts.append(f"*{text}*")
        else:
            parts.append(text)
    
    result = "".join(parts).strip()
    
    # Clean up redundant asterisks: **** → nothing, ** ** → space
    result = _clean_markdown_asterisks(result)
    
    return result if result else para.text.strip()


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
    text = re.sub(r'([הבלמכווש])\*\*([^*]+)\*\*', r'**\1\2**', text)
    
    # Fix **text**.**  → **text**.
    text = re.sub(r'\*\*\.\*\*', '.', text)
    
    # Fix **:** → :
    text = re.sub(r'\*\*:\*\*', ':', text)
    
    return text.strip()


def _ingest_docx(path: Path) -> dict:
    doc = Document(path)
    paragraphs = []
    
    # Build numbering tracker: {(numId, ilvl): current_count}
    numbering_counters = {}
    # Cache numbering definitions from document
    numbering_formats = _extract_numbering_formats(doc)

    for doc_idx, para in enumerate(doc.paragraphs):
        if para.text.strip():
            # Check if paragraph has numbering
            num_prefix = _get_paragraph_numbering(para, numbering_counters, numbering_formats)
            text = _format_runs(para)
            
            # Prepend numbering if present
            if num_prefix:
                text = f"{num_prefix} {text}"
            
            paragraphs.append({
                "text": text,
                "style": para.style.name,
                "doc_para_index": doc_idx
            })

    return {
        "file": path.name,
        "format": "docx",
        "paragraphs": paragraphs,
        "total": len(paragraphs)
    }


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
            return "-"  # Convert bullets to markdown list marker
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