"""
Translation entry point.

Important:
- Translation is optional.
- If no target languages are provided, the book remains in source language only.
- Actual translation helpers live in dedicated modules.
"""

from pathlib import Path

from .translation_env import detect_environment, supports_parallel_subagents
from .translate_jobs import (
    get_chapters_to_translate,
    build_translation_prompt,
    build_batch_prompt,
    partition_chapters,
    build_group_prompt,
)
from .rtl_and_markdown_cleanup import process_book_by_language
from .translation_metadata import (
    update_content_structure_titles,
    build_book_metadata_prompt,
    get_book_metadata_for_translation,
    update_book_metadata,
)


def main():
    """
    CLI for checking translation status and generating batch prompts.

    Note:
    This script does NOT perform translations by itself.
    It prepares prompts and workflow information for the Translator agent.

    Examples:
        python -m pipeline.translate ../output/my-book
        python -m pipeline.translate ../output/my-book --languages en
        python -m pipeline.translate ../output/my-book --languages en,ru --show-prompt
    """
    import argparse

    parser = argparse.ArgumentParser(
        description="Check translation status and prepare translation prompts"
    )
    parser.add_argument("book_dir", help="Path to book output directory")
    parser.add_argument(
        "--languages",
        "-l",
        default="",
        help="Target languages (comma-separated). Leave empty to skip translation.",
    )
    parser.add_argument(
        "--show-prompt",
        "-p",
        action="store_true",
        help="Show the batch prompt for the Translator agent",
    )
    parser.add_argument(
        "--fix-rtl",
        action="store_true",
        help="Run language-aware markdown cleanup before checking translation status",
    )

    args = parser.parse_args()

    book_path = Path(args.book_dir)
    if not book_path.exists():
        print(f"Error: Book directory not found: {args.book_dir}")
        return 1

    # Parse requested target languages.
    # Empty means: do not translate now.
    target_langs = [lang.strip() for lang in args.languages.split(",") if lang.strip()]

    if not target_langs:
        print("\nℹ️ No target languages were requested.")
        print("   Book remains in source language only.")
        return 0

    print(f"\n📚 Translation Status: {book_path.name}")
    print("=" * 50)

    # Optional cleanup before translation checks.
    if args.fix_rtl:
        print("\n🔧 Running language-aware markdown cleanup...")
        fixed = process_book_by_language(str(book_path), target_langs)
        print(f"   Fixed {fixed} files.\n")

    # Find Hebrew chapters that need translation into the requested languages.
    chapters = get_chapters_to_translate(str(book_path), target_langs)

    if not chapters:
        print(f"\n✅ All chapters are already translated to: {', '.join(target_langs)}")
        return 0

    # Group results by language for readable status output.
    by_lang = {}
    for ch in chapters:
        lang = ch["lang_name"]
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
        print(
            f"      python -m pipeline.translate {args.book_dir} --languages {args.languages} --show-prompt"
        )
        print()
        print("   Note: This script prepares prompts. Actual translation needs an LLM.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())