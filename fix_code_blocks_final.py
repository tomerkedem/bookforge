#!/usr/bin/env python3
"""
Final cleanup of code blocks:
1. Remove extra blank lines inside code blocks
2. Ensure proper closing fences
"""

import re
from pathlib import Path

def clean_code_blocks(content):
    """Remove trailing blank lines from inside code blocks."""
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if this is an opening code fence
        if re.match(r'^```(python|bash|plaintext|javascript|typescript|json|html|css|sql|yaml|xml)', line):
            result.append(line)
            i += 1

            # Collect code block lines
            code_lines = []
            while i < len(lines):
                line = lines[i]

                if line.strip() == '```':
                    # Found closing fence - strip trailing blank lines from code_lines
                    while code_lines and code_lines[-1].strip() == '':
                        code_lines.pop()

                    result.extend(code_lines)
                    result.append('```')
                    i += 1
                    break

                code_lines.append(line)
                i += 1

        else:
            result.append(line)
            i += 1

    return '\n'.join(result)


if __name__ == '__main__':
    output_dir = Path('output/practical-python-for-ai-engineering')

    if not output_dir.exists():
        print(f"[ERROR] Directory not found: {output_dir}")
        exit(1)

    fixed_count = 0
    for md_file in sorted(output_dir.glob('*.he.md')):
        content = md_file.read_text(encoding='utf-8')
        original = content

        content = clean_code_blocks(content)

        if content != original:
            md_file.write_text(content, encoding='utf-8')
            print(f"[OK] Cleaned: {md_file.name}")
            fixed_count += 1
        else:
            print(f"[NO] No changes: {md_file.name}")

    print(f"\n[DONE] Cleaned {fixed_count} files")
