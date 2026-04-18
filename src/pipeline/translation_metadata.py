from pathlib import Path
import json
import re

from .translation_config import resolve_target_languages
from pipeline.languages import get_language_meta, LANGUAGE_CODES, SOURCE_LANGUAGE


def update_content_structure_titles(book_dir: str, languages: list[str] = None) -> int:
    """
    Update content-structure.json with translated chapter titles from .{lang}.md files.

    After translation, each chapter file has its title in the first # heading.
    This function reads those titles and updates chapter["titles"][lang].

    Args:
        book_dir: Path to book output directory
        languages:
            - None  -> all supported languages
            - list  -> only requested languages

    Returns:
        Number of titles updated.
    """
    if languages is None:
        languages = LANGUAGE_CODES

    book_path = Path(book_dir)
    json_path = book_path / "content-structure.json"

    if not json_path.exists():
        print("  [SKIP] No content-structure.json found")
        return 0

    data = json.loads(json_path.read_text(encoding="utf-8"))
    book_data = data.get("book", {})
    chapters = book_data.get("chapters", [])

    updated_count = 0

    for chapter in chapters:
        file_slug = chapter.get("file_slug", "")

        for lang in languages:
            if file_slug == "intro":
                md_path = book_path / f"intro.{lang}.md"
            else:
                md_path = book_path / f"{file_slug}.{lang}.md"

            if not md_path.exists():
                continue

            content = md_path.read_text(encoding="utf-8")
            for line in content.split("\n"):
                match = re.match(r"^#\s+(.+)", line)
                if match:
                    new_title = match.group(1).strip()

                    if "titles" not in chapter:
                        chapter["titles"] = {}

                    old_title = chapter["titles"].get(lang, "")
                    if old_title != new_title:
                        chapter["titles"][lang] = new_title
                        updated_count += 1

                    break

    # Keep list of available languages on the book object
    book_data["languages"] = list(set(book_data.get("languages", []) + languages))

    json_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"  [UPDATE] content-structure.json: {updated_count} titles updated")
    return updated_count


def build_book_metadata_prompt(book_dir: str, target_languages: list[str] = None) -> str:
    """
    Build a prompt for translating book metadata (title, subtitle, description).

    Args:
        book_dir: Path to book output directory
        target_languages:
            - None  -> all supported target languages except source
            - []    -> no target languages
            - list  -> only requested languages

    Returns:
        Prompt string for the agent to translate book metadata.
    """
    book_path = Path(book_dir)
    json_path = book_path / "content-structure.json"

    if not json_path.exists():
        return ""

    data = json.loads(json_path.read_text(encoding="utf-8"))
    book_data = data.get("book", {})

    # Source metadata is Hebrew at this stage
    he_title = book_data.get("titles", {}).get(SOURCE_LANGUAGE, "")
    he_subtitle = book_data.get("subtitles", {}).get(SOURCE_LANGUAGE, "")

    credits = book_data.get("credits", {}) or {}

    def _credit_source_text(field_value):
        if isinstance(field_value, dict):
            return field_value.get(SOURCE_LANGUAGE, "") or next(iter(field_value.values()), "")
        if isinstance(field_value, str):
            return field_value
        return ""

    credits_lines = []
    for field in ("lecturer", "editor", "author"):
        src_value = _credit_source_text(credits.get(field))
        if src_value:
            credits_lines.append(f"  - {field}: {src_value}")
    credits_summary = "\n".join(credits_lines) if credits_lines else "  (אין credits)"

    chapters = book_data.get("chapters", [])
    chapter_titles_he = [
        ch.get("titles", {}).get(SOURCE_LANGUAGE, "")
        for ch in chapters[:10]
    ]
    chapter_summary = "\n".join(f"  - {t}" for t in chapter_titles_he if t)

    resolved_langs = resolve_target_languages(target_languages)
    target_languages = [lang["code"] for lang in resolved_langs]

    if not target_languages:
        return ""

    lang_names = ", ".join(
        get_language_meta(code).label_en if get_language_meta(code) else code
        for code in target_languages
    )

    # Build dynamic examples, not hardcoded en/es
    example_langs = [SOURCE_LANGUAGE] + target_languages
    example_langs = list(dict.fromkeys(example_langs))
    example_map = ", ".join(f'"{lang}": "..."' for lang in example_langs)

    return f"""תרגם את מטא-דאטה של הספר לשפות: {lang_names}

        כותרת הספר בעברית: {he_title}
        כותרת משנה בעברית: {he_subtitle}

        כותרות פרקים לדוגמה (להבנת תוכן הספר):
        {chapter_summary}

        Credits (שמות אישיים לתעתיק):
        {credits_summary}

        משימות:

        1. תרגם את כותרת הספר לכל שפת יעד:
        - שמור על מונחים מקצועיים כמו AI, ML, LLM, RAG באנגלית
        - תרגם את שאר המילים בצורה טבעית

        2. תרגם את כותרת המשנה לכל שפת יעד

        3. כתוב תיאור קצר (~25 מילים) לכל שפה שמסביר במה עוסק הספר
        - התיאור יוצג בכרטיס הספר בספריה
        - כלול את הנושאים העיקריים
        - כתוב בסגנון מזמין לקריאה

        4. תעתק את שדות ה-credits (lecturer, editor, author) לכל שפת יעד:
        - אלה שמות אישיים, לא מתרגמים אותם
        - לאנגלית ולשפות לטיניות: תעתיק פונטי באותיות לטיניות (למשל: "ערן סלע" -> "Eran Sela")
        - לשפות עם כתב אחר: השתמש בתעתיק המקובל באותה שפה
        - שמור על פורמט זהה: שם פרטי + שם משפחה

        נתיב לעדכון: {json_path}

        לאחר התרגום, עדכן את content-structure.json כך:
        - titles: אובייקט שבו כל מפתח הוא קוד שפה וכל ערך הוא הכותרת המתורגמת
        - subtitles: אובייקט שבו כל מפתח הוא קוד שפה וכל ערך הוא כותרת המשנה המתורגמת
        - descriptions: אובייקט שבו כל מפתח הוא קוד שפה וכל ערך הוא התיאור המתורגם
        - credits.lecturer / credits.editor / credits.author: אובייקט שבו כל מפתח הוא קוד שפה וכל ערך הוא השם המתועתק (רק אם השדה קיים במקור)

        דוגמה למבנה הרצוי:
        titles = {{ {example_map} }}
        subtitles = {{ {example_map} }}
        descriptions = {{ {example_map} }}
        credits.lecturer = {{ {example_map} }}

        עדכן רק את המבנים הבאים:
        - titles
        - subtitles
        - descriptions
        - credits.lecturer, credits.editor, credits.author (כל מה שקיים במקור)

        שמור את credits.type כמו שהוא (אל תשנה אותו).
        כאשר בכל אחד מהשדות הנ"ל:
        - המפתח הוא קוד השפה
        - הערך הוא הטקסט המתורגם או המתועתק
        """


def get_book_metadata_for_translation(book_dir: str) -> dict:
    """
    Get current book metadata that needs translation.

    Returns:
        Dict with source title/subtitle and chapter titles for context.
    """
    book_path = Path(book_dir)
    json_path = book_path / "content-structure.json"

    if not json_path.exists():
        return {}

    data = json.loads(json_path.read_text(encoding="utf-8"))
    book_data = data.get("book", {})

    return {
        "title_he": book_data.get("titles", {}).get(SOURCE_LANGUAGE, ""),
        "subtitle_he": book_data.get("subtitles", {}).get(SOURCE_LANGUAGE, ""),
        "chapter_titles": [
            ch.get("titles", {}).get(SOURCE_LANGUAGE, "")
            for ch in book_data.get("chapters", [])
        ],
        "json_path": str(json_path),
    }


def update_book_metadata(
    book_dir: str,
    titles: dict[str, str],
    subtitles: dict[str, str],
    descriptions: dict[str, str],
) -> bool:
    """
    Update book-level metadata in content-structure.json.

    Uses language-based dictionaries:
    - titles
    - subtitles
    - descriptions

    Each key is a language code and each value is the translated text.
    """
    book_path = Path(book_dir)
    json_path = book_path / "content-structure.json"

    if not json_path.exists():
        return False

    data = json.loads(json_path.read_text(encoding="utf-8"))
    book_data = data.get("book", {})

    if titles:
        book_data["titles"] = {**book_data.get("titles", {}), **titles}

    if subtitles:
        book_data["subtitles"] = {**book_data.get("subtitles", {}), **subtitles}

    if descriptions:
        book_data["descriptions"] = {**book_data.get("descriptions", {}), **descriptions}

    data["book"] = book_data
    json_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("  [UPDATE] Book metadata updated in content-structure.json")
    return True