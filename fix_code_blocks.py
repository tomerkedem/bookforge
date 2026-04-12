#!/usr/bin/env python3
"""
Fix code blocks in markdown files that lost their ``` markers.
"""

import re
from pathlib import Path

def fix_chapter_01_he():
    file_path = Path('output/ai-python-dev/chapter-01.he.md')
    content = file_path.read_text(encoding='utf-8')
    
    # Fix: text_to_json.py example
    # The code block has extra blank lines between each line
    
    # Find the start and end markers
    start_marker = "הקוד:\n\n# !/usr/bin/env python3"
    end_marker = "**למה זו דוגמה "
    
    if start_marker in content:
        # Find the section
        start_idx = content.find(start_marker)
        end_idx = content.find(end_marker, start_idx)
        
        old_section = content[start_idx:end_idx]
        
        # Create the fixed version
        fixed_code = '''הקוד:

```python
#!/usr/bin/env python3
"""
text_to_json.py
A simple script that computes basic text statistics and returns JSON.
"""

import json
from typing import Dict

def clean_text(text: str) -> str:
    """removes extra spaces and unnecessary line breaks."""
    return " ".join(text.strip().split())

def text_stats(text: str) -> Dict[str, int]:
    """returns a dictionary with word and character counts."""
    cleaned = clean_text(text)
    return {
        "word_count": len(cleaned.split()),
        "char_count": len(cleaned)
    }

def to_json(data: Dict) -> str:
    """converts a dictionary to JSON with UTF-8 (Hebrew) support."""
    return json.dumps(data, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    sample_text = "  זהו טקסט קצר   עם   רווחים מיותרים.  "
    stats = text_stats(sample_text)
    result = to_json(stats)
    print(result)
```

הפלט:

```json
{
  "word_count": 6,
  "char_count": 31
}
```

'''
        content = content[:start_idx] + fixed_code + content[end_idx:]
        file_path.write_text(content, encoding='utf-8')
        print('Fixed text_to_json.py code block')
    else:
        print('Could not find the code block marker')
        # Print around where it might be
        idx = content.find("הקוד:")
        if idx > 0:
            print(f"Found 'הקוד:' at position {idx}")
            print(repr(content[idx:idx+100]))

if __name__ == '__main__':
    fix_chapter_01_he()
