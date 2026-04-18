"""
Translation configuration helpers.

Important:
- This module does NOT decide which languages must be translated.
- It only resolves requested target languages.
- Source language comes from pipeline.languages.
"""

from pipeline.languages import (
    SOURCE_LANGUAGE,
    get_target_languages,
    get_language_meta,
    validate_language_codes,
)


def resolve_target_languages(target_languages: list[str] | None = None) -> list[dict]:
    """
    Resolve requested target languages into metadata dicts.

    Rules:
    - None  -> all supported target languages except source
    - []    -> no translation
    - list  -> only requested valid languages

    Returns:
        list of dicts like:
        [
            {"code": "en", "name": "English", "native": "English"},
            {"code": "ru", "name": "Russian", "native": "Русский"},
        ]
    """
    if target_languages is None:
        codes = get_target_languages(SOURCE_LANGUAGE)
    else:
        codes = validate_language_codes(target_languages)

    resolved = []
    for code in codes:
        meta = get_language_meta(code)
        if not meta:
            continue

        resolved.append({
            "code": meta.code,
            "name": meta.label_en,
            "native": meta.label,
        })

    return resolved