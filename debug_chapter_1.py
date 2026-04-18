#!/usr/bin/env python
"""Debug script to inspect Chapter 1 structure from Word document."""

import sys
from pathlib import Path
from src.pipeline.ingest import ingest

# Read the document
book_path = Path(r"D:\Books\Practical Python for AI Engineering.docx")
doc_data = ingest(book_path)

paragraphs = doc_data.get("paragraphs", [])

# Find Chapter 1
chapter_1_start = None
chapter_1_end = None

for idx, para in enumerate(paragraphs):
    style = para.get("style", "")
    text = para.get("text", "")

    # Look for Chapter 1 heading
    if "Heading 1" in style and ("פרק 1" in text or "Chapter 1" in text):
        chapter_1_start = idx

    # Find next heading to determine chapter end
    if chapter_1_start is not None and chapter_1_start != idx and "Heading 1" in style:
        chapter_1_end = idx
        break

if chapter_1_end is None:
    chapter_1_end = len(paragraphs)

print(f"Chapter 1: paragraphs {chapter_1_start} to {chapter_1_end}")
print(f"Total: {chapter_1_end - chapter_1_start} paragraphs\n")

# Show all paragraphs in Chapter 1
if chapter_1_start is not None:
    for idx in range(chapter_1_start, min(chapter_1_start + 150, chapter_1_end)):
        para = paragraphs[idx]
        style = para.get("style", "")
        text = para.get("text", "")[:100]  # First 100 chars

        # Highlight code-related paragraphs
        if "```" in para.get("text", "") or "code" in style.lower():
            print(f">>> [{idx}] {style:20} | {text}")
        else:
            print(f"    [{idx}] {style:20} | {text}")
