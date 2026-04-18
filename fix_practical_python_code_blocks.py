#!/usr/bin/env python3
"""
Fix code blocks for practical-python-for-ai-engineering book.
Removes backtick wrapping around each line within code blocks.
"""

import re
from pathlib import Path

def fix_code_blocks_in_file(file_path):
    """Fix code blocks that have backticks wrapping each line."""
    content = file_path.read_text(encoding='utf-8')
    original = content

    # First pass: fix code blocks where each line is wrapped in backticks
    pattern = r'(```(?:python|bash|plaintext|javascript|typescript|sql|json|html|css|markdown|yaml|xml)\n)((?:\s*`[^`]*`\s*\n?)+?)(```+)'

    def replace_block(match):
        opening = match.group(1)  # ```python\n
        lines_section = match.group(2)  # all the `code` lines
        closing = '```'  # Always use exactly 3 backticks

        # Remove backticks from each line
        fixed_lines = re.sub(r'\s*`([^`]*)`\s*', r'\1\n', lines_section.strip())

        return f"{opening}{fixed_lines}\n{closing}"

    content = re.sub(pattern, replace_block, content)

    # Second pass: remove any remaining extra backticks at end of code blocks
    content = re.sub(r'```\n+`+\n', '```\n\n', content)
    content = re.sub(r'`+\n\n', '\n\n', content)

    if content != original:
        file_path.write_text(content, encoding='utf-8')
        return True
    return False

if __name__ == '__main__':
    output_dir = Path('output/practical-python-for-ai-engineering')

    if not output_dir.exists():
        print(f"[ERROR] Directory not found: {output_dir}")
        exit(1)

    fixed_count = 0
    for md_file in sorted(output_dir.glob('*.he.md')):
        if fix_code_blocks_in_file(md_file):
            print(f"[OK] Fixed: {md_file.name}")
            fixed_count += 1
        else:
            print(f"[NO] No changes: {md_file.name}")

    print(f"\n[DONE] Fixed {fixed_count} files")
