#!/usr/bin/env python3
"""
Fix code blocks by detecting Hebrew text inside them and closing before Hebrew.
"""

import re
from pathlib import Path

def has_hebrew(text):
    """Check if text contains Hebrew characters."""
    return bool(re.search(r'[\u0590-\u05FF]', text))

def fix_code_blocks_hebrew(content):
    """Find code blocks and close them before any Hebrew text appears."""
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]
        result.append(line)

        # Check if this is an opening code fence
        if re.match(r'^```(python|bash|plaintext|javascript|typescript|json|html|css|sql|yaml|xml)', line):
            i += 1

            # Collect lines until we hit Hebrew text OR closing fence
            while i < len(lines):
                line = lines[i]

                # Already has closing fence - good
                if line.strip() == '```':
                    result.append(line)
                    i += 1
                    break

                # Found Hebrew text - close fence BEFORE it
                if has_hebrew(line) and line.strip() != '':
                    # Close the code block
                    result.append('```')
                    # Don't increment i - let main loop handle this line
                    break

                # Add line to code block
                result.append(line)
                i += 1

        else:
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

        content = fix_code_blocks_hebrew(content)

        if content != original:
            md_file.write_text(content, encoding='utf-8')
            print(f"[OK] Fixed: {md_file.name}")
            fixed_count += 1
        else:
            print(f"[NO] No changes: {md_file.name}")

    print(f"\n[DONE] Fixed {fixed_count} files")
