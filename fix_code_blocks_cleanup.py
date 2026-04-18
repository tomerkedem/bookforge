#!/usr/bin/env python3
"""
Final cleanup: remove duplicate/orphaned closing fences.
Each opening fence should have exactly ONE closing fence.
"""

import re
from pathlib import Path

def cleanup_orphaned_fences(content):
    """Remove orphaned closing fences."""
    lines = content.split('\n')
    result = []
    i = 0
    in_code_block = False
    fence_closed = False

    while i < len(lines):
        line = lines[i]

        # Opening fence
        if re.match(r'^```(python|bash|plaintext|javascript|typescript|json|html|css|sql|yaml|xml)', line):
            result.append(line)
            in_code_block = True
            fence_closed = False
            i += 1
            continue

        # Closing fence
        if line.strip() == '```':
            if in_code_block and not fence_closed:
                # This is the valid closing fence
                result.append(line)
                in_code_block = False
                fence_closed = True
                i += 1
                continue
            else:
                # Orphaned closing fence - skip it
                print(f"  Skipping orphaned fence at line {i+1}")
                i += 1
                continue

        # Regular line
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

        content = cleanup_orphaned_fences(content)

        if content != original:
            md_file.write_text(content, encoding='utf-8')
            print(f"[OK] Cleaned: {md_file.name}")
            fixed_count += 1
        else:
            print(f"[NO] Already clean: {md_file.name}")

    print(f"\n[DONE] Cleaned {fixed_count} files")
