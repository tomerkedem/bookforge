"""
Tests for markdown asterisk cleanup functions.
Ensures Word formatting artifacts are properly cleaned.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from pipeline.ingest import _clean_markdown_asterisks, _to_roman, _to_hebrew_letter
from pipeline.parse import _clean_markdown_final, _clean_heading


class TestCleanMarkdownAsterisks:
    """Tests for ingest.py _clean_markdown_asterisks function."""
    
    def test_four_asterisks_become_two(self):
        assert _clean_markdown_asterisks("****text****") == "**text**"
    
    def test_adjacent_bold_merged(self):
        result = _clean_markdown_asterisks("**word1****word2**")
        assert "****" not in result
    
    def test_spaced_markers_become_space(self):
        assert _clean_markdown_asterisks("** **") == ""
    
    def test_hebrew_prefix_moved_inside(self):
        result = _clean_markdown_asterisks("ה**טקסט**")
        assert result == "**הטקסט**"
    
    def test_colon_pattern_fixed(self):
        result = _clean_markdown_asterisks("**:**")
        assert result == ":"


class TestCleanMarkdownFinal:
    """Tests for parse.py _clean_markdown_final function."""
    
    def test_colon_pattern(self):
        assert _clean_markdown_final("**:**") == ":"
        result = _clean_markdown_final("text**:")
        assert "**:" not in result
    
    def test_trailing_period(self):
        result = _clean_markdown_final("text**.")
        assert result.endswith(".")
        assert "**" not in result
    
    def test_comma_between_bold(self):
        result = _clean_markdown_final("**a**, **b**")
        assert "**, **" not in result
    
    def test_fragmented_bold_merged(self):
        result = _clean_markdown_final("**first** **second**")
        # Should merge into single bold or clean up
        assert "** **" not in result
    
    def test_hebrew_prefix_fixed(self):
        result = _clean_markdown_final("ה**טקסט**")
        assert result == "**הטקסט**"
    
    def test_quotes_cleaned(self):
        result = _clean_markdown_final('"**text**"')
        assert result == '"text"'
    
    def test_four_plus_asterisks(self):
        result = _clean_markdown_final("text****more")
        assert "****" not in result
    
    def test_label_pattern(self):
        # Pattern: שלב א**: should become **שלב א:**
        result = _clean_markdown_final(" שלב א**:")
        assert "**:" not in result
    
    def test_multiple_spaces_cleaned(self):
        result = _clean_markdown_final("text  with   spaces")
        assert "  " not in result
    
    def test_unbalanced_opening_bold_gets_closed(self):
        # Line ending with **label but no closing
        result = _clean_markdown_final("text. **label")
        # Should add closing **
        assert result.endswith("**")
        assert "**label**" in result
    
    def test_bullet_with_misplaced_bold(self):
        # Pattern: - תת-בעיה 1:** text** → - **תת-בעיה 1: text**
        result = _clean_markdown_final("- תת-בעיה 1:** האלגוריתם**")
        assert ":**" not in result
        assert result.startswith("- **")
    
    def test_standalone_asterisks_removed(self):
        result = _clean_markdown_final("line1\n**\nline2")
        # Empty ** line should be removed
        lines = result.split('\n')
        assert not any(line.strip() == '**' for line in lines)
    
    def test_intentional_bold_preserved(self):
        # Valid bold should NOT be broken
        result = _clean_markdown_final("This is **bold text** in a sentence.")
        assert "**bold text**" in result
    
    def test_multiple_valid_bolds_preserved(self):
        result = _clean_markdown_final("**First** and **second** bold.")
        assert "**First**" in result
        assert "**second**" in result


class TestCleanHeading:
    """Tests for parse.py _clean_heading function."""
    
    def test_removes_all_asterisks(self):
        result = _clean_heading("**פרק 1**: מבוא")
        assert "*" not in result
        assert "פרק 1: מבוא" in result
    
    def test_removes_triple_asterisks(self):
        result = _clean_heading("***bold italic***")
        assert "*" not in result
    
    def test_cleans_multiple_spaces(self):
        result = _clean_heading("word1  word2   word3")
        assert "  " not in result


class TestNumberingHelpers:
    """Tests for numbering conversion helpers in ingest.py."""
    
    def test_roman_numeral_1(self):
        assert _to_roman(1) == "I"
    
    def test_roman_numeral_4(self):
        assert _to_roman(4) == "IV"
    
    def test_roman_numeral_9(self):
        assert _to_roman(9) == "IX"
    
    def test_roman_numeral_10(self):
        assert _to_roman(10) == "X"
    
    def test_roman_numeral_50(self):
        assert _to_roman(50) == "L"
    
    def test_roman_numeral_complex(self):
        assert _to_roman(1999) == "MCMXCIX"
    
    def test_hebrew_letter_1(self):
        assert _to_hebrew_letter(1) == "א"
    
    def test_hebrew_letter_2(self):
        assert _to_hebrew_letter(2) == "ב"
    
    def test_hebrew_letter_10(self):
        assert _to_hebrew_letter(10) == "י"
    
    def test_hebrew_letter_11(self):
        assert _to_hebrew_letter(11) == "יא"
    
    def test_hebrew_letter_20(self):
        assert _to_hebrew_letter(20) == "כ"
    
    def test_hebrew_letter_100(self):
        assert _to_hebrew_letter(100) == "ק"


# Run tests with pytest
if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
