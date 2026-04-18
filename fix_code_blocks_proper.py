#!/usr/bin/env python3
"""
Proper code block fixing:
1. Find opening ```lang
2. Find where code ACTUALLY ends (by detecting language patterns)
3. Close immediately after code
"""

import re
from pathlib import Path

def is_likely_code(line):
    """Check if line looks like actual code."""
    stripped = line.strip()
    if not stripped:
        return False
    if stripped.startswith('#'):
        return True
    if re.search(r'[=()[\]{}]|import |def |class |for |if |while ', stripped):
        return True
    return False

def fix_code_blocks_proper(content):
    """Fix code block boundaries intelligently."""
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]
        result.append(line)

        # Check if this is an opening code fence
        if re.match(r'^```(python|bash|plaintext|javascript|typescript|json|html|css|sql|yaml|xml)', line):
            i += 1

            # Collect code lines until we hit non-code
            code_lines = []
            while i < len(lines):
                line = lines[i]

                # Already closed fence?
                if line.strip() == '```':
                    # Good, it's already closed properly
                    result.extend(code_lines)
                    result.append('```')
                    i += 1
                    break

                # Check if this looks like code
                if is_likely_code(line):
                    code_lines.append(line)
                    i += 1

                # Blank lines might be inside code
                elif line.strip() == '':
                    # Look ahead - is next line code?
                    j = i + 1
                    found_code = False
                    blank_count = 1
                    while j < len(lines) and blank_count < 5:
                        if lines[j].strip() == '```':
                            found_code = True
                            break
                        if is_likely_code(lines[j]):
                            found_code = True
                            break
                        if lines[j].strip() != '':
                            break
                        j += 1
                        blank_count += 1

                    if found_code:
                        code_lines.append(line)
                        i += 1
                    else:
                        # End of code block
                        # Strip trailing blank lines
                        while code_lines and code_lines[-1].strip() == '':
                            code_lines.pop()

                        result.extend(code_lines)
                        result.append('```')
                        # Don't increment i, let main loop handle this blank line
                        break

                else:
                    # Non-code content - end of block
                    # Strip trailing blank lines from code_lines
                    while code_lines and code_lines[-1].strip() == '':
                        code_lines.pop()

                    result.extend(code_lines)
                    result.append('```')
                    # Don't increment i, let main loop process this line
                    break

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

        content = fix_code_blocks_proper(content)

        if content != original:
            md_file.write_text(content, encoding='utf-8')
            print(f"[OK] Fixed: {md_file.name}")
            fixed_count += 1
        else:
            print(f"[NO] No changes: {md_file.name}")

    print(f"\n[DONE] Fixed {fixed_count} files")
