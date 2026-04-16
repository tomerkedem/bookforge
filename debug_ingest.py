#!/usr/bin/env python3
"""Debug script to see what ingest.py is extracting."""
import sys
sys.path.insert(0, 'src')
from pipeline.ingest import ingest

INPUT_FILE = r"D:\Books\Practical Python for AI Engineering.docx"

ingested = ingest(INPUT_FILE)
paragraphs = ingested.get('paragraphs', [])

# Find the torch example (should be around paragraph 80-100)
print("Looking for torch code block...")
print()

for idx, para in enumerate(paragraphs[70:120]):
    actual_idx = 70 + idx
    text = para.get('text', '')[:80]
    style = para.get('style', '')

    if 'torch' in text or 'import' in text or text.startswith('`'):
        print(f"[{actual_idx}] Style: {style:20} | Text: {text}")

        # Show full text and format info for code lines
        if para.get('style') == 'code':
            full_text = para.get('text', '')
            print(f"       FULL: {repr(full_text)}")
            print()
