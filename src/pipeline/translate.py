"""
Translation step: translates Hebrew chapter files to all target languages.

Supported target languages (extensible — add to TARGET_LANGUAGES to support more):
  en  → English
  es  → Spanish

Each chapter-XX.he.md → chapter-XX.{lang}.md for every configured target language.

Supports batch mode: groups all pending chapters into a single prompt
so the Translator agent processes them sequentially without pausing.

Environment detection:
  - Claude Code: parallel subagents with file access
  - VS Code Copilot: main agent translates directly
"""

import os
from pathlib import Path
from pipeline.languages import get_language_meta


# ── Environment Detection ─────────────────────────────────────────────────────

def detect_environment() -> str:
    """
    Detect if running in Claude Code CLI or VS Code Copilot.
    
    Returns:
        'claude-code' - Full subagent support with file tools
        'vscode-copilot' - Limited, main agent must handle files
        'unknown' - Fallback to main agent mode
    """
    # Claude Code sets specific env vars
    if os.getenv("CLAUDE_CODE") or os.getenv("CLAUDE_SESSION_ID"):
        return "claude-code"
    
    # VS Code Copilot context
    if os.getenv("VSCODE_PID") or os.getenv("VSCODE_IPC_HOOK"):
        return "vscode-copilot"
    
    return "unknown"


def supports_parallel_subagents() -> bool:
    """Check if current environment supports parallel subagents with file access."""
    return detect_environment() == "claude-code"


# ── Configuration ─────────────────────────────────────────────────────────────
# To add a new language: append one entry here.
TARGET_LANGUAGES = [
    {"code": "en", "name": "English",  "native": "English"},
    {"code": "es", "name": "Spanish",  "native": "Español"},
]
# ──────────────────────────────────────────────────────────────────────────────


def get_chapters_to_translate(book_dir: str, target_languages: list[str] = None) -> list[dict]:
    """
    Find Hebrew chapters that need translation for target languages.
    
    Args:
        book_dir: Path to book output directory
        target_languages: List of language codes (e.g. ['en', 'es']) or None for all
    
    Includes intro.he.md and all chapter-XX.he.md files.

    Returns list of {he_path, target_path, number, lang_code, lang_name}.
    """
    book_path = Path(book_dir)
    to_translate = []

    if target_languages:
        langs = [l for l in TARGET_LANGUAGES if l["code"] in target_languages]
    else:
        langs = TARGET_LANGUAGES

    for lang in langs:
        # Include intro.he.md
        intro_file = book_path / "intro.he.md"
        if intro_file.exists():
            target_file = book_path / f"intro.{lang['code']}.md"
            needs_translation = (
                not target_file.exists()
                or target_file.stat().st_mtime < intro_file.stat().st_mtime
            )
            if needs_translation:
                to_translate.append({
                    "number": "intro",
                    "he_path": str(intro_file),
                    "target_path": str(target_file),
                    "lang_code": lang["code"],
                    "lang_name": lang["name"],
                })
        
        # Include all chapter-XX.he.md files
        for he_file in sorted(book_path.glob("chapter-*.he.md")):
            target_file = he_file.with_name(he_file.name.replace(".he.md", f".{lang['code']}.md"))
            num = he_file.name.replace("chapter-", "").replace(".he.md", "")

            needs_translation = (
                not target_file.exists()
                or target_file.stat().st_mtime < he_file.stat().st_mtime
            )

            if needs_translation:
                to_translate.append({
                    "number": num,
                    "he_path": str(he_file),
                    "target_path": str(target_file),
                    "lang_code": lang["code"],
                    "lang_name": lang["name"],
                })

    return to_translate


def build_translation_prompt(he_path: str, target_path: str, lang_name: str) -> str:
    """Build the prompt for the Translator agent (single chapter, single language)."""
    he_content = Path(he_path).read_text(encoding="utf-8")

    return f"""תרגם את הקובץ הבא מעברית ל-{lang_name}.

כללים:
- שמור על אותו מבנה Markdown בדיוק (כותרות, רשימות, טבלאות)
- שמור על כל הפניות לתמונות ללא שינוי (img tags ו-markdown images)
- תרגם בצורה טבעית, לא מילולית
- מונחים טכניים שאינם ניתנים לתרגום: השאר במקור
- אל תוסיף ואל תקצר תוכן

קובץ מקור: {he_path}
קובץ יעד: {target_path}

תוכן לתרגום:

{he_content}

כתוב את התרגום לקובץ {target_path}."""


def build_batch_prompt(chapters: list[dict], target_languages: list[str] = None) -> str:
    """
    Build a single batch prompt for the Translator agent.
    All pending chapters (across all languages) are listed so the agent
    processes them sequentially without pausing between files.
    """
    if not chapters:
        return ""

    file_list = "\n".join(
        f"  {i+1}. [{ch['lang_name']}] {ch['he_path']} → {ch['target_path']}"
        for i, ch in enumerate(chapters)
    )

    # Get unique languages from chapters
    unique_codes = list(dict.fromkeys(ch['lang_code'] for ch in chapters))
    lang_summary = ", ".join(
        f"{get_language_meta(code).label_en} (.{code}.md)"
        for code in unique_codes
        if get_language_meta(code)
    )

    return f"""מצב Batch: תרגם {len(chapters)} פרקים מעברית לשפות היעד ({lang_summary}).

כללים (חלים על כל הקבצים):
- שמור על אותו מבנה Markdown בדיוק (כותרות, רשימות, טבלאות)
- שמור על כל הפניות לתמונות ללא שינוי (img tags ו-markdown images)
- תרגם בצורה טבעית, לא מילולית
- מונחים טכניים שאינם ניתנים לתרגום: השאר במקור
- אל תוסיף ואל תקצר תוכן

רשימת קבצים לתרגום:
{file_list}

הוראות עבודה:
1. קרא כל קובץ .he.md מהרשימה
2. תרגם אותו לשפה המצוינת
3. כתוב את התוצאה לקובץ היעד המקביל
4. עבור מיד לקובץ הבא — אל תחכה לאישור בין קבצים

בסיום כל הקבצים, דווח:
- translated: מספר קבצים שתורגמו
- skipped: מספר קבצים שדולגו (אם יש)
- total_words: אומדן כולל של מילים שתורגמו"""


def partition_chapters(chapters: list[dict], num_groups: int = 3) -> list[list[dict]]:
    """
    Partition chapters into groups for parallel translation.
    
    Args:
        chapters: List of chapter dicts from get_chapters_to_translate()
        num_groups: Number of parallel translators (default: 3)
    
    Returns:
        List of chapter groups, each group for one translator subagent.
    
    Example:
        11 chapters with 3 groups → [[ch1-4], [ch5-8], [ch9-11]]
    """
    if not chapters:
        return []
    
    # Don't create more groups than chapters
    num_groups = min(num_groups, len(chapters))
    
    # Distribute evenly
    groups = [[] for _ in range(num_groups)]
    for i, chapter in enumerate(chapters):
        groups[i % num_groups].append(chapter)
    
    # Remove empty groups (shouldn't happen, but safety)
    return [g for g in groups if g]


def build_group_prompt(chapters: list[dict], group_id: int, total_groups: int) -> str:
    """
    Build a prompt for a single translator handling a subset of chapters.
    
    Args:
        chapters: List of chapters for this translator
        group_id: Which group this is (1-based, for display)
        total_groups: Total number of parallel translators
    
    Returns:
        Prompt string for the translator subagent.
    """
    if not chapters:
        return ""
    
    file_list = "\n".join(
        f"  {i+1}. [{ch['lang_name']}] {ch['he_path']} → {ch['target_path']}"
        for i, ch in enumerate(chapters)
    )
    
    # Get unique languages
    unique_langs = list(dict.fromkeys(ch['lang_name'] for ch in chapters))
    lang_str = ", ".join(unique_langs)
    
    return f"""אתה Translator {group_id} מתוך {total_groups} (מצב מקבילי).

משימתך: תרגם {len(chapters)} פרקים מעברית ל-{lang_str}.

כללים:
- שמור על אותו מבנה Markdown בדיוק (כותרות, רשימות, טבלאות)
- שמור על כל הפניות לתמונות ללא שינוי
- תרגם בצורה טבעית, לא מילולית
- מונחים טכניים שאינם ניתנים לתרגום: השאר במקור

רשימת קבצים שלך:
{file_list}

הוראות:
1. קרא כל קובץ .he.md
2. תרגם לשפה המצוינת
3. כתוב לקובץ היעד
4. עבור מיד לקובץ הבא — אל תחכה לאישור

בסיום דווח:
- translated: מספר קבצים
- total_words: אומדן מילים"""


# ── RTL/Bidi Text Fixes ───────────────────────────────────────────────────────

import re

def fix_rtl_text(content: str) -> str:
    """
    Fix common RTL/bidi issues in Hebrew text with English terms.
    
    Fixes patterns like:
      - "ה AI-" → "ה-AI"
      - "ל API-" → "ל-API"
      - "ב Python-" → "ב-Python"
    
    Also removes characters not found on standard keyboards that indicate AI text:
      - Hebrew diacritics (nikud)
      - Zero-width characters
      - Combining marks
      - Special Unicode spaces
      - Other invisible characters
    
    Hebrew prefix letters: ה, ל, ב, מ, כ, ו, ש, וה, לה, בה, מה, כש, של
    """
    # Remove characters that indicate AI-generated text:
    
    # 1. Hebrew diacritics/nikud (U+0591–U+05C7)
    content = re.sub(r'[\u0591-\u05C7]', '', content)
    
    # 2. Zero-width characters
    content = re.sub(r'[\u200B-\u200F\u2060-\u206F\uFEFF]', '', content)
    
    # 3. General combining marks (U+0300–U+036F)
    content = re.sub(r'[\u0300-\u036F]', '', content)
    
    # 4. Arabic diacritics (U+0610–U+065F)
    content = re.sub(r'[\u0610-\u065F]', '', content)
    
    # 5. Special Unicode spaces (replace with regular space)
    content = re.sub(r'[\u00A0\u2000-\u200A\u202F\u205F\u3000]', ' ', content)
    
    # 6. Directional control characters (except standard RTL/LTR marks in Hebrew text)
    content = re.sub(r'[\u202A-\u202E]', '', content)
    
    # 7. Other invisible/rare characters
    content = re.sub(r'[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E]', '', content)
    
    # Pattern: Hebrew prefix + space + English word + hyphen (wrong order from bidi)
    # Example: "ה AI-רץ" should be "ה-AI רץ"
    prefixes = r'[הלבמכוש]'
    
    # Fix: prefix + space + word + hyphen at word boundary
    # "ה AI-" → "ה-AI "
    content = re.sub(
        rf'({prefixes})\s+([A-Za-z][A-Za-z0-9]*)-(?=\s|[א-ת]|$|[.,;:!?])',
        r'\1-\2 ',
        content
    )
    
    # Also fix compound prefixes: וה, לה, בה, מה, כש, של
    compound_prefixes = r'(?:וה|לה|בה|מה|כש|של)'
    content = re.sub(
        rf'({compound_prefixes})\s+([A-Za-z][A-Za-z0-9]*)-(?=\s|[א-ת]|$|[.,;:!?])',
        r'\1-\2 ',
        content
    )
    
    # Fix Hebrew prefix + space + Hebrew word (wrong spacing from Word)
    # Example: "ב שגיאות" should be "בשגיאות"
    # Only when the Hebrew word is lowercase (not a proper noun or heading)
    content = re.sub(
        rf'(?<![א-ת])({prefixes})\s+([א-ת][א-ת]+)',
        r'\1\2',
        content
    )
    
    # Replace em dash (—) and en dash (–) with regular hyphen (-)
    content = content.replace('—', '-')
    content = content.replace('–', '-')
    
    # Fix inline backticks inside code blocks (from Word formatting)
    # Pattern: lines inside ``` blocks that have `code` format
    # Example: ```python\n`import torch`\n``` → ```python\nimport torch\n```
    content = fix_backticks_in_code_blocks(content)
    
    return content


def fix_backticks_in_code_blocks(content: str) -> str:
    """
    Remove inline backticks from lines inside fenced code blocks.
    Also normalizes language tags to lowercase (Python → python).
    
    Word documents often have inline code formatting that gets preserved
    as backticks even when inside a code block, creating:
        ```python
        `import torch`
        `x = 1`
        ```
    
    This function cleans them to:
        ```python
        import torch
        x = 1
        ```
    """
    # Normalize language tags first (Python → python, etc.)
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
        # Check for code block start/end
        stripped = line.strip()
        if stripped.startswith('```'):
            in_code_block = not in_code_block
            # Also fix malformed closing like ````` → ```
            if stripped.startswith('`````'):
                line = line.replace('`````', '```')
            result.append(line)
            continue
        
        if in_code_block:
            # Remove leading/trailing backticks from code lines
            # Match: `code content` or ` `code content` ` (with spaces)
            cleaned = re.sub(r'^(\s*)`(.+)`\s*$', r'\1\2', line)
            result.append(cleaned)
        else:
            result.append(line)
    
    return '\n'.join(result)


def post_process_hebrew_file(filepath: str) -> bool:
    """
    Apply RTL fixes to a Hebrew markdown file.
    
    Args:
        filepath: Path to the .he.md file
    
    Returns:
        True if changes were made, False otherwise.
    """
    path = Path(filepath)
    if not path.exists() or not path.suffix == '.md':
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
    
    Args:
        filepath: Path to any .md file
    
    Returns:
        True if changes were made, False otherwise.
    """
    path = Path(filepath)
    if not path.exists() or not path.suffix == '.md':
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
    Also fixes dashes (em/en → regular) in ALL markdown files.
    
    Args:
        book_dir: Path to book output directory
    
    Returns:
        Number of files that were fixed.
    """
    book_path = Path(book_dir)
    fixed_count = 0
    
    # Fix RTL issues in Hebrew files
    for he_file in book_path.glob("*.he.md"):
        if post_process_hebrew_file(str(he_file)):
            fixed_count += 1
            print(f"  Fixed RTL issues: {he_file.name}")
    
    # Fix dashes in ALL markdown files (including en, es, etc.)
    for md_file in book_path.glob("*.md"):
        if fix_dashes_in_file(str(md_file)):
            if not md_file.name.endswith('.he.md'):  # Don't double-count Hebrew files
                fixed_count += 1
                print(f"  Fixed dashes: {md_file.name}")
    
    return fixed_count


# ── Update content-structure.json after translations ─────────────────────────

import json

def update_content_structure_titles(book_dir: str, languages: list[str] = None) -> int:
    """
    Update content-structure.json with translated titles from .{lang}.md files.
    
    After translation, each chapter file has its title in the first # heading.
    This function reads those titles and updates content-structure.json.
    
    Args:
        book_dir: Path to book output directory  
        languages: List of language codes to update (default: all from config)
    
    Returns:
        Number of titles updated.
    """
    from .languages import LANGUAGE_CODES, SOURCE_LANGUAGE
    
    if languages is None:
        languages = LANGUAGE_CODES
    
    book_path = Path(book_dir)
    json_path = book_path / "content-structure.json"
    
    if not json_path.exists():
        print(f"  [SKIP] No content-structure.json found")
        return 0
    
    # Load existing structure
    data = json.loads(json_path.read_text(encoding="utf-8"))
    book_data = data.get("book", {})
    chapters = book_data.get("chapters", [])
    
    updated_count = 0
    
    # Update chapter titles
    for chapter in chapters:
        file_slug = chapter.get("file_slug", "")
        
        for lang in languages:
            # Find the corresponding .{lang}.md file
            if file_slug == "intro":
                md_path = book_path / f"intro.{lang}.md"
            else:
                md_path = book_path / f"{file_slug}.{lang}.md"
            
            if not md_path.exists():
                continue
            
            # Extract title from first # heading
            content = md_path.read_text(encoding="utf-8")
            for line in content.split("\n"):
                match = re.match(r"^#\s+(.+)", line)
                if match:
                    new_title = match.group(1).strip()
                    
                    # Update titles dict
                    if "titles" not in chapter:
                        chapter["titles"] = {}
                    
                    old_title = chapter["titles"].get(lang, "")
                    if old_title != new_title:
                        chapter["titles"][lang] = new_title
                        updated_count += 1
                    
                    # Update legacy fields
                    if lang == "he":
                        chapter["title_he"] = new_title
                    elif lang == "en":
                        chapter["title_en"] = new_title
                    
                    break
    
    # Update book-level titles from intro or first chapter
    for lang in languages:
        # Try to find a translated book title (could be in a cover file or use chapter 1)
        # For now, translate the book title if we have an intro with a different title
        pass  # Book title translation would need to be handled separately
    
    # Ensure languages list is in the structure
    book_data["languages"] = list(set(book_data.get("languages", []) + languages))
    
    # Write updated structure
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    
    print(f"  [UPDATE] content-structure.json: {updated_count} titles updated")
    return updated_count


# ── CLI Interface ─────────────────────────────────────────────────────────────

def main():
    """
    CLI for checking translation status and generating batch prompts.
    
    Note: This script does NOT perform translations - it prepares prompts
    for the Translator agent (LLM-based translation).
    
    Usage:
        python -m pipeline.translate ../output/my-book --languages en,es
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Check translation status and prepare batch prompts'
    )
    parser.add_argument('book_dir', help='Path to book output directory')
    parser.add_argument('--languages', '-l', default='en,es',
                       help='Target languages (comma-separated, default: en,es)')
    parser.add_argument('--show-prompt', '-p', action='store_true',
                       help='Show the batch prompt for Translator agent')
    parser.add_argument('--fix-rtl', action='store_true',
                       help='Fix RTL issues in Hebrew files')
    
    args = parser.parse_args()
    
    book_path = Path(args.book_dir)
    if not book_path.exists():
        print(f"Error: Book directory not found: {args.book_dir}")
        return 1
    
    target_langs = [l.strip() for l in args.languages.split(',')]
    
    print(f"\n📚 Translation Status: {book_path.name}")
    print("=" * 50)
    
    # Fix RTL if requested
    if args.fix_rtl:
        print("\n🔧 Fixing RTL issues in Hebrew files...")
        fixed = fix_all_hebrew_files(str(book_path))
        print(f"   Fixed {fixed} files.\n")
    
    # Get chapters needing translation
    chapters = get_chapters_to_translate(str(book_path), target_langs)
    
    if not chapters:
        print(f"\n✅ All chapters are already translated to: {', '.join(target_langs)}")
        return 0
    
    # Group by language
    by_lang = {}
    for ch in chapters:
        lang = ch['lang_name']
        by_lang.setdefault(lang, []).append(ch)
    
    print(f"\n⚠️  {len(chapters)} chapters need translation:")
    for lang, chs in by_lang.items():
        print(f"   • {lang}: {len(chs)} chapters")
        for ch in chs:
            print(f"      - {Path(ch['he_path']).name} → {Path(ch['target_path']).name}")
    
    if args.show_prompt:
        print("\n" + "=" * 50)
        print("📝 Batch prompt for Translator agent:")
        print("=" * 50)
        prompt = build_batch_prompt(chapters, target_langs)
        print(prompt)
    else:
        print("\n" + "-" * 50)
        print("💡 To translate, use one of these methods:")
        print()
        print("   Option 1 - Translator Agent (recommended):")
        print(f"      @translator translate {book_path.name} to {', '.join(target_langs)}")
        print()
        print("   Option 2 - Show batch prompt:")
        print(f"      python -m pipeline.translate {args.book_dir} --languages {args.languages} --show-prompt")
        print()
        print("   Note: This script prepares prompts - actual translation needs an LLM.")
    
    return 0


if __name__ == "__main__":
    exit(main())
