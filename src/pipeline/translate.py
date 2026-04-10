"""
Translation step: invokes the Translator subagent to translate
Hebrew chapter files to English.

Supports batch mode: groups all pending chapters into a single prompt
so the Translator agent processes them sequentially without pausing.

Each chapter-XX.he.md → chapter-XX.en.md via the Translator agent,
which translates inline (not via external API) while preserving
all Markdown structure and image references.
"""

from pathlib import Path


def get_chapters_to_translate(book_dir: str) -> list[dict]:
    """
    Find Hebrew chapters that need translation.
    Returns list of {he_path, en_path, number} for chapters
    where the English file is missing or older than Hebrew.
    """
    book_path = Path(book_dir)
    to_translate = []

    for he_file in sorted(book_path.glob("chapter-*.he.md")):
        en_file = he_file.with_name(he_file.name.replace(".he.md", ".en.md"))
        num = he_file.name.replace("chapter-", "").replace(".he.md", "")

        needs_translation = False
        if not en_file.exists():
            needs_translation = True
        elif en_file.stat().st_mtime < he_file.stat().st_mtime:
            needs_translation = True

        if needs_translation:
            to_translate.append({
                "number": num,
                "he_path": str(he_file),
                "en_path": str(en_file),
            })

    return to_translate


def build_translation_prompt(he_path: str, en_path: str) -> str:
    """Build the prompt for the Translator agent (single chapter)."""
    he_content = Path(he_path).read_text(encoding="utf-8")

    return f"""תרגם את הקובץ הבא מעברית לאנגלית.

כללים:
- שמור על אותו מבנה Markdown בדיוק (כותרות, רשימות, טבלאות)
- שמור על כל הפניות לתמונות ללא שינוי (img tags ו-markdown images)
- תרגם בצורה טבעית, לא מילולית
- מונחים טכניים שאינם ניתנים לתרגום: השאר במקור
- אל תוסיף ואל תקצר תוכן

קובץ מקור: {he_path}
קובץ יעד: {en_path}

תוכן לתרגום:

{he_content}

כתוב את התרגום לקובץ {en_path}."""


def build_batch_prompt(chapters: list[dict]) -> str:
    """
    Build a single batch prompt for the Translator agent.
    All pending chapters are listed so the agent processes them
    sequentially without pausing between files.
    """
    if not chapters:
        return ""

    file_list = "\n".join(
        f"  {i+1}. {ch['he_path']} → {ch['en_path']}"
        for i, ch in enumerate(chapters)
    )

    return f"""מצב Batch: תרגם {len(chapters)} פרקים מעברית לאנגלית.

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
2. תרגם אותו לאנגלית
3. כתוב את התוצאה לקובץ .en.md המקביל
4. עבור מיד לקובץ הבא — אל תחכה לאישור בין קבצים

בסיום כל הקבצים, דווח:
- translated: מספר קבצים שתורגמו
- skipped: מספר קבצים שדולגו (אם יש)
- total_words: אומדן כולל של מילים שתורגמו"""
