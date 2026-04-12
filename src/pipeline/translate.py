"""
Translation step: translates Hebrew chapter files to all target languages.

Supported target languages (extensible — add to TARGET_LANGUAGES to support more):
  en  → English
  es  → Spanish

Each chapter-XX.he.md → chapter-XX.{lang}.md for every configured target language.

Supports batch mode: groups all pending chapters into a single prompt
so the Translator agent processes them sequentially without pausing.
"""

from pathlib import Path


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
