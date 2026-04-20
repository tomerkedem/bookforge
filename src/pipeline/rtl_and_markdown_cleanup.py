"""
Post-processing for Hebrew markdown files.

This module used to carry a larger cleanup pipeline (zero-width
character removal, Hebrew-prefix normalization, bidi-hyphen fixes).
Those rules were removed because:
  - The zero-width and directional-marker scrubs never fired on
    BookForge output once ingest.py was stabilized.
  - The Hebrew-prefix rules ("ה AI-" -> "ה-AI" and "ה עולם" ->
    "העולם") were based on heuristics that assumed a single Hebrew
    prefix letter followed by a space is always an error, which
    is not true in general prose and can damage intentional
    spacing in the source.

What remains is intentionally minimal and safe:
  1. Strip Hebrew nikud (diacritics). The platform does not render
     vowel points; leaving them in makes the text look inconsistent
     when the source material mixes pointed and unpointed quotations.
  2. Replace em (—) and en (–) dashes with a regular hyphen (-).
     Word auto-converts space-hyphen-space into an en-dash and
     then an em-dash for longer runs; normalizing to ASCII hyphen
     matches the plain-speech style the author prefers.
  3. Replace special Unicode spaces (NBSP, thin space, figure space,
     etc.) with an ordinary ASCII space. These non-standard spaces
     come from Word copy-paste and produce inconsistent line
     breaking in the browser.
  4. Normalize fenced-code language tags to lowercase canonical
     names (```Python -> ```python, ```MD -> ```markdown).

If a new pattern starts appearing in the output, the preferred
fix is in ingest.py (at the source), not here.
"""

from pathlib import Path
import re

RTL_LANGS = {"he", "ar", "fa"}


# ─── Unicode character classes we touch ────────────────────────────
# Hebrew nikud/cantillation marks. Covers U+0591..U+05C7.
_NIKUD = re.compile(r"[\u0591-\u05C7]")

# Special-purpose spaces that display as "space-ish" but are not
# U+0020. Covers NBSP, various fixed-width spaces, narrow-no-break,
# medium mathematical space, and ideographic space.
_SPECIAL_SPACES = re.compile(r"[\u00A0\u2000-\u200A\u202F\u205F\u3000]")


def fix_rtl_text(content: str) -> str:
    """
    Apply the small set of normalizations we still consider safe
    for Hebrew content.

    Order matters: nikud removal runs first so that later whitespace
    handling does not trip on combining marks.
    """
    # 1. Hebrew nikud / cantillation: the platform renders plain
    #    Hebrew letters; leaving diacritics in makes pointed
    #    quotations look visually inconsistent with body text.
    content = _NIKUD.sub("", content)

    # 2. Non-ASCII spaces -> ordinary space. These sneak in from
    #    Word and break word-wrap behavior in the browser.
    content = _SPECIAL_SPACES.sub(" ", content)

    # 3. Em / en dashes -> ASCII hyphen. Word auto-converts
    #    " - " into an en- or em-dash; the author prefers the
    #    unformatted hyphen for a plain-speech voice.
    content = content.replace("\u2014", "-")   # em dash
    content = content.replace("\u2013", "-")   # en dash

    # 4. Code block language tag normalization.
    content = _normalize_code_lang_tags(content)

    return content


def _normalize_code_lang_tags(content: str) -> str:
    """
    Lowercase well-known fenced-code language tags. We do not touch
    the body of the code block; only the opening fence.
    """
    content = re.sub(r"```Python\b", "```python", content)
    content = re.sub(r"```Javascript\b", "```javascript", content)
    content = re.sub(r"```Bash\b", "```bash", content)
    content = re.sub(r"```Markdown\b", "```markdown", content)
    content = re.sub(r"```MD\b", "```markdown", content, flags=re.IGNORECASE)
    content = re.sub(r"```md\b", "```markdown", content)
    return content


# ─── File-level entry points ────────────────────────────────────────

def post_process_hebrew_file(filepath: str) -> bool:
    """
    Apply the Hebrew cleanup to a single .md file. Returns True if
    the file was actually rewritten.
    """
    path = Path(filepath)
    if not path.exists() or path.suffix != ".md":
        return False

    original = path.read_text(encoding="utf-8")
    fixed = fix_rtl_text(original)

    if fixed != original:
        path.write_text(fixed, encoding="utf-8")
        return True

    return False


def fix_dashes_in_file(filepath: str) -> bool:
    """
    Normalize em/en dashes in any markdown file, regardless of
    language. Returns True if the file was rewritten.

    This is separate from post_process_hebrew_file because dash
    normalization is language-neutral: we want the plain-hyphen
    style everywhere, not only in Hebrew.
    """
    path = Path(filepath)
    if not path.exists() or path.suffix != ".md":
        return False

    original = path.read_text(encoding="utf-8")
    fixed = original.replace("\u2014", "-").replace("\u2013", "-")

    if fixed != original:
        path.write_text(fixed, encoding="utf-8")
        return True

    return False


def process_file_by_language(filepath: str, lang: str) -> bool:
    """
    Entry point used by build.py. For RTL languages we run the full
    cleanup; for other languages we only normalize dashes, because
    nikud and Hebrew-specific spacing don't apply to them.
    """
    path = Path(filepath)
    if not path.exists() or path.suffix != ".md":
        return False

    original = path.read_text(encoding="utf-8")
    fixed = original

    if lang in RTL_LANGS:
        fixed = fix_rtl_text(fixed)
    else:
        fixed = fixed.replace("\u2014", "-").replace("\u2013", "-")

    if fixed != original:
        path.write_text(fixed, encoding="utf-8")
        return True

    return False


def process_book_by_language(book_dir: str, languages: list[str]) -> int:
    """
    Apply the language-aware post-processing to every markdown file
    in a book directory. Returns the number of files that were
    actually modified.
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


# ─── Backward-compatible shims ──────────────────────────────────────
# Old callers may still import these. They behave the same as before
# but call through the reduced cleanup. Remove after confirming
# nothing outside build.py uses them.

def fix_all_hebrew_files(book_dir: str) -> int:
    """
    Legacy wrapper. New code should call process_book_by_language.
    """
    book_path = Path(book_dir)
    fixed_count = 0

    for he_file in book_path.glob("*.he.md"):
        if post_process_hebrew_file(str(he_file)):
            fixed_count += 1
            print(f"  Fixed RTL issues: {he_file.name}")

    for md_file in book_path.glob("*.md"):
        if md_file.name.endswith(".he.md"):
            continue
        if fix_dashes_in_file(str(md_file)):
            fixed_count += 1
            print(f"  Fixed dashes: {md_file.name}")

    return fixed_count


# Kept as a public name; no longer used internally. If external code
# references fix_backticks_in_code_blocks, it now calls through to
# the language-tag normalizer (which is all that was actually useful
# from the old implementation for normal prose output).
def fix_backticks_in_code_blocks(content: str) -> str:
    return _normalize_code_lang_tags(content)