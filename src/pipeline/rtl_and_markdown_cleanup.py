from pathlib import Path
import re
RTL_LANGS = {"he", "ar", "fa"}

def fix_rtl_text(content: str) -> str:
    """
    Fix common RTL/bidi issues in Hebrew text with English terms.

    Fixes patterns like:
      - "ה AI-" -> "ה-AI"
      - "ל API-" -> "ל-API"
      - "ב Python-" -> "ב-Python"

    Also removes characters not found on standard keyboards that indicate AI text:
      - Hebrew diacritics (nikud)
      - Zero-width characters
      - Combining marks
      - Special Unicode spaces
      - Other invisible characters

    Hebrew prefix letters: ה, ל, ב, מ, כ, ו, ש, וה, לה, בה, מה, כש, של
    """
    # 1. Hebrew diacritics/nikud
    content = re.sub(r'[\u0591-\u05C7]', '', content)

    # 2. Zero-width characters
    content = re.sub(r'[\u200B-\u200F\u2060-\u206F\uFEFF]', '', content)

    # 3. General combining marks
    content = re.sub(r'[\u0300-\u036F]', '', content)

    # 4. Arabic diacritics
    content = re.sub(r'[\u0610-\u065F]', '', content)

    # 5. Special Unicode spaces
    content = re.sub(r'[\u00A0\u2000-\u200A\u202F\u205F\u3000]', ' ', content)

    # 6. Directional control characters
    content = re.sub(r'[\u202A-\u202E]', '', content)

    # 7. Other invisible/rare characters
    content = re.sub(r'[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E]', '', content)

    prefixes = r'[הלבמכוש]'

    # Fix Hebrew prefix + English term + misplaced hyphen
    content = re.sub(
        rf'({prefixes})\s+([A-Za-z][A-Za-z0-9]*)-(?=\s|[א-ת]|$|[.,;:!?])',
        r'\1-\2 ',
        content
    )

    compound_prefixes = r'(?:וה|לה|בה|מה|כש|של)'
    content = re.sub(
        rf'({compound_prefixes})\s+([A-Za-z][A-Za-z0-9]*)-(?=\s|[א-ת]|$|[.,;:!?])',
        r'\1-\2 ',
        content
    )

    # Fix Hebrew prefix + Hebrew word with wrong spacing
    content = re.sub(
        rf'(?<![א-ת])({prefixes})\s+([א-ת][א-ת]+)',
        r'\1\2',
        content
    )

    # Replace long dashes with regular hyphen
    content = content.replace('—', '-')
    content = content.replace('–', '-')

    # Fix inline backticks inside code blocks
    content = fix_backticks_in_code_blocks(content)

    return content


def fix_backticks_in_code_blocks(content: str) -> str:
    """
    Remove inline backticks from lines inside fenced code blocks.
    Also normalizes language tags to lowercase.
    """
    content = re.sub(r'```Python\b', '```python', content)
    content = re.sub(r'```Javascript\b', '```javascript', content)
    content = re.sub(r'```Bash\b', '```bash', content)
    content = re.sub(r'```Markdown\b', '```markdown', content)
    content = re.sub(r'```MD\b', '```markdown', content, flags=re.IGNORECASE)
    content = re.sub(r'```md\b', '```markdown', content)

    lines = content.split('\n')
    result = []
    in_code_block = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith('```'):
            in_code_block = not in_code_block
            if stripped.startswith('`````'):
                line = line.replace('`````', '```')
            result.append(line)
            continue

        if in_code_block:
            cleaned = re.sub(r'^(\s*)`(.+)`\s*$', r'\1\2', line)
            result.append(cleaned)
        else:
            result.append(line)

    return '\n'.join(result)


def post_process_hebrew_file(filepath: str) -> bool:
    """
    Apply RTL fixes to a Hebrew markdown file.

    Returns:
        True if changes were made, False otherwise.
    """
    path = Path(filepath)
    if not path.exists() or path.suffix != '.md':
        return False

    original = path.read_text(encoding='utf-8')
    fixed = fix_rtl_text(original)

    if fixed != original:
        path.write_text(fixed, encoding='utf-8')
        return True

    return False


def fix_dashes_in_file(filepath: str) -> bool:
    """
    Replace em dash and en dash with regular hyphen in any markdown file.

    Returns:
        True if changes were made, False otherwise.
    """
    path = Path(filepath)
    if not path.exists() or path.suffix != '.md':
        return False

    original = path.read_text(encoding='utf-8')
    fixed = original.replace('—', '-').replace('–', '-')

    if fixed != original:
        path.write_text(fixed, encoding='utf-8')
        return True

    return False


def fix_all_hebrew_files(book_dir: str) -> int:
    """
    Fix RTL issues in all Hebrew files in a book directory.
    Also fixes dashes in all markdown files.

    Returns:
        Number of files that were fixed.
    """
    book_path = Path(book_dir)
    fixed_count = 0

    for he_file in book_path.glob("*.he.md"):
        if post_process_hebrew_file(str(he_file)):
            fixed_count += 1
            print(f"  Fixed RTL issues: {he_file.name}")

    for md_file in book_path.glob("*.md"):
        if fix_dashes_in_file(str(md_file)):
            if not md_file.name.endswith('.he.md'):
                fixed_count += 1
                print(f"  Fixed dashes: {md_file.name}")

    return fixed_count

def process_file_by_language(filepath: str, lang: str) -> bool:
    """
    Apply post-processing based on language.

    Rules:
    - RTL languages: apply full RTL + markdown cleanup
    - Other languages: apply only generic markdown cleanup

    Returns:
        True if file was modified
    """
    path = Path(filepath)
    if not path.exists() or path.suffix != ".md":
        return False

    original = path.read_text(encoding="utf-8")
    fixed = original

    if lang in RTL_LANGS:
        fixed = fix_rtl_text(fixed)

    fixed = fixed.replace("—", "-").replace("–", "-")

    if fixed != original:
        path.write_text(fixed, encoding="utf-8")
        return True

    return False

def process_book_by_language(book_dir: str, languages: list[str]) -> int:
    """
    Apply language-aware post-processing to all markdown files.

    Args:
        book_dir: Path to book directory
        languages: list like ["he", "en", "es"]

    Returns:
        Number of modified files
    """
    book_path = Path(book_dir)
    fixed_count = 0

    for lang in languages:
        pattern = f"*.{lang}.md"

        for md_file in book_path.glob(pattern):
            if process_file_by_language(str(md_file), lang):
                fixed_count += 1
                print(f"  Fixed ({lang}): {md_file.name}")

    return fixed_count