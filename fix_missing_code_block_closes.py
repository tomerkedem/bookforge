#!/usr/bin/env python3
"""
Fix missing closing backticks in code blocks.
Each opening ```lang must have a matching closing ```.
"""

import re
from pathlib import Path

def fix_code_blocks(content):
    """
    Find code blocks with opening fence but no closing fence.
    Add closing fence before the next heading or paragraph.
    """
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]
        result.append(line)

        # Check if this is an opening code fence
        if re.match(r'^```(python|bash|plaintext|javascript|typescript|json|html|css|sql|yaml|xml)', line):
            in_code_block = True
            fence_found = False

            # Look for closing fence
            j = i + 1
            while j < len(lines):
                next_line = lines[j]

                # Check if this is a closing fence (exactly ```)
                if next_line.strip() == '```':
                    fence_found = True
                    break

                # Stop if we hit a heading (##) or another opening fence
                if next_line.startswith('##') or re.match(r'^```', next_line):
                    break

                j += 1

            # If no closing fence found, add code lines and then close
            if not fence_found:
                i += 1
                # Add all lines until heading/EOF/next fence
                while i < len(lines):
                    line = lines[i]

                    # Stop at heading or another fence
                    if line.startswith('##') or re.match(r'^```', line):
                        # Go back one line so main loop processes it
                        i -= 1
                        break

                    # Skip empty lines at end of block
                    if line.strip() == '':
                        # Check if next non-empty is heading
                        check_idx = i + 1
                        found_content = False
                        while check_idx < len(lines):
                            check_line = lines[check_idx]
                            if check_line.strip():
                                if check_line.startswith('##') or re.match(r'^```', check_line):
                                    # This was trailing whitespace
                                    break
                                found_content = True
                                break
                            check_idx += 1

                        if not found_content:
                            # Trailing whitespace in code block
                            result.append(line)
                            i += 1
                            continue

                    result.append(line)
                    i += 1

                # Add closing fence
                result.append('```')

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

        content = fix_code_blocks(content)

        if content != original:
            md_file.write_text(content, encoding='utf-8')
            print(f"[OK] Fixed: {md_file.name}")
            fixed_count += 1
        else:
            print(f"[NO] No changes: {md_file.name}")

    print(f"\n[DONE] Fixed {fixed_count} files")
