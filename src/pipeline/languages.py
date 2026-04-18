"""
Centralized language configuration for the BookForge pipeline.
This mirrors src/utils/language.ts - keep them in sync.

To add a new language: add one entry to SUPPORTED_LANGUAGES - nothing else changes.
"""

from dataclasses import dataclass
from typing import List, Set


@dataclass
class LanguageMeta:
    """Language metadata matching TypeScript LanguageMeta interface."""
    code: str       # 'he', 'en', 'fr', etc.
    label: str      # native label, e.g. "עברית", "English", "Français"
    label_en: str   # English name
    dir: str        # 'rtl' or 'ltr'
    locale: str     # BCP 47 locale, e.g. 'he-IL', 'en-US', 'fr-FR'


# Master list of supported languages
# To add a new language: append one entry here — nothing else in the codebase needs to change
SUPPORTED_LANGUAGES: List[LanguageMeta] = [
    LanguageMeta(code='he', label='עברית',   label_en='Hebrew',  dir='rtl', locale='he-IL'),
    LanguageMeta(code='en', label='English', label_en='English', dir='ltr', locale='en-US'),
    LanguageMeta(code='es', label='Español', label_en='Spanish', dir='ltr', locale='es-ES'),
    # Add new languages here:
    # LanguageMeta(code='fr', label='Français', label_en='French',  dir='ltr', locale='fr-FR'),
    # LanguageMeta(code='de', label='Deutsch',  label_en='German',  dir='ltr', locale='de-DE'),
    # LanguageMeta(code='ar', label='العربية',  label_en='Arabic',  dir='rtl', locale='ar-SA'),
]

# Derived constants
LANGUAGE_CODES: List[str] = [lang.code for lang in SUPPORTED_LANGUAGES]
RTL_LANGUAGES: Set[str] = {lang.code for lang in SUPPORTED_LANGUAGES if lang.dir == 'rtl'}
LTR_LANGUAGES: Set[str] = {lang.code for lang in SUPPORTED_LANGUAGES if lang.dir == 'ltr'}

# Default language for fallbacks

SOURCE_LANGUAGE = 'he'  # Books are written in Hebrew, translated to others
DEFAULT_LANGUAGE = SOURCE_LANGUAGE

def get_language_meta(code: str) -> LanguageMeta | None:
    """Get metadata for a language code."""
    for lang in SUPPORTED_LANGUAGES:
        if lang.code == code:
            return lang
    return None


def is_rtl(code: str) -> bool:
    """Check if a language is RTL."""
    return code in RTL_LANGUAGES


def get_target_languages(source: str = SOURCE_LANGUAGE) -> List[str]:
    """Get all target languages (all except source)."""
    return [code for code in LANGUAGE_CODES if code != source]


def validate_language_codes(codes: List[str]) -> List[str]:
    """Validate and filter language codes, returning only supported ones."""
    valid = []
    for code in codes:
        if code in LANGUAGE_CODES:
            valid.append(code)
        else:
            print(f"⚠️ Unknown language code '{code}' - skipping")
    return valid


def parse_languages_arg(arg: str) -> List[str]:
    """Parse comma-separated language codes from CLI argument."""
    codes = [c.strip().lower() for c in arg.split(',') if c.strip()]
    return validate_language_codes(codes)
