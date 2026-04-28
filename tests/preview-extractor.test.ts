import { describe, it, expect } from 'vitest';
import {
  extractPreview,
  extractSectionPreviews,
  type SectionPreview,
} from '../src/utils/sidebar/preview-extractor';

function asCode(p: SectionPreview): { language: string; html: string } {
  if (p.type !== 'code') throw new Error(`expected code preview, got ${p.type}`);
  return p;
}

function asText(p: SectionPreview): string {
  if (p.type !== 'text') throw new Error(`expected text preview, got ${p.type}`);
  return p.sentence;
}

describe('extractPreview — code path', () => {
  it('extracts python code with hljs highlighting', () => {
    const body = 'Some intro.\n\n```python\ndef hello():\n    print("hi")\n```';
    const c = asCode(extractPreview(body));
    expect(c.language).toBe('python');
    // hljs marks `def` / `print` / strings — the exact class names are
    // brittle to assert literally, but at least one hljs span must
    // exist for a non-trivial python snippet.
    expect(c.html).toMatch(/hljs-/);
  });

  it('caps code at 5 lines', () => {
    const body = '```js\n1\n2\n3\n4\n5\n6\n7\n```';
    const c = asCode(extractPreview(body));
    // hljs preserves newlines, so line count = newlines + 1.
    expect(c.html.split('\n')).toHaveLength(5);
  });

  it('treats fence with no language as plain', () => {
    const c = asCode(extractPreview('```\nplain code\n```'));
    expect(c.language).toBe('plain');
    expect(c.html).toBe('plain code'); // escaped, no spans
  });

  it('treats mermaid as code (not text fallback)', () => {
    const c = asCode(extractPreview('```mermaid\ngraph TD\n  A --> B\n```'));
    expect(c.language).toBe('mermaid');
    // hljs has no mermaid grammar — content is escaped plain text.
    expect(c.html).toContain('graph TD');
  });

  it('uses the FIRST code block when several exist', () => {
    const body = '```python\nfirst = 1\n```\n\nMid prose.\n\n```js\nconst x = 2;\n```';
    const c = asCode(extractPreview(body));
    expect(c.language).toBe('python');
  });

  it('escapes HTML inside unknown-language code', () => {
    const c = asCode(extractPreview('```\n<script>alert(1)</script>\n```'));
    expect(c.html).not.toContain('<script>');
    expect(c.html).toContain('&lt;script&gt;');
  });
});

describe('extractPreview — text fallback', () => {
  it('returns first sentence when no code block', () => {
    expect(asText(extractPreview('This is the intro. More follows.')))
      .toBe('This is the intro.');
  });

  it('returns empty for empty body', () => {
    expect(extractPreview('')).toEqual({ type: 'text', sentence: '' });
  });

  it('returns empty for whitespace-only body', () => {
    expect(extractPreview('\n\n   \n')).toEqual({ type: 'text', sentence: '' });
  });

  it('truncates long sentences to 80 chars with ellipsis', () => {
    const long = 'a'.repeat(120);
    const s = asText(extractPreview(long));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith('…')).toBe(true);
  });

  it('treats single-backtick inline code as text, not code', () => {
    expect(asText(extractPreview('Use `npm install` to install. Then run.')))
      .toBe('Use npm install to install.');
  });

  it('strips bold and italic markers', () => {
    expect(asText(extractPreview('**Bold** and *italic* text.')))
      .toBe('Bold and italic text.');
  });

  it('reduces link syntax to its label', () => {
    expect(asText(extractPreview('Read [the docs](https://example.com) carefully.')))
      .toBe('Read the docs carefully.');
  });

  it('drops image syntax entirely', () => {
    expect(asText(extractPreview('![alt](img.png) Caption follows.')))
      .toBe('Caption follows.');
  });

  it('handles Hebrew prose', () => {
    expect(asText(extractPreview('זהו תוכן ראשוני. אחר כך משהו אחר.')))
      .toBe('זהו תוכן ראשוני.');
  });

  it('strips RTL/LTR control marks', () => {
    expect(asText(extractPreview('‏Hebrew‎ text.')))
      .toBe('Hebrew text.');
  });

  it('takes only the first paragraph', () => {
    expect(asText(extractPreview('First para.\n\nSecond para.')))
      .toBe('First para.');
  });
});

describe('extractSectionPreviews', () => {
  it('returns one preview per h2/h3 in source order', () => {
    const md = [
      '# Title',
      '',
      'Intro before any section.',
      '',
      '## First',
      '',
      'Some intro text.',
      '',
      '```python',
      'print("hi")',
      '```',
      '',
      '## Second',
      '',
      'Just text here.',
      '',
      '### Sub',
      '',
      'Sub text content.',
    ].join('\n');

    const previews = extractSectionPreviews(md);
    expect(previews).toHaveLength(3);
    expect(previews[0].type).toBe('code');
    expect(previews[1].type).toBe('text');
    expect(previews[2].type).toBe('text');
    expect(asText(previews[1])).toBe('Just text here.');
    expect(asText(previews[2])).toBe('Sub text content.');
  });

  it('returns empty array when no h2/h3 headings', () => {
    expect(extractSectionPreviews('Just a paragraph, no headings.')).toEqual([]);
  });

  it('does not split on heading-like lines inside fenced code', () => {
    const md = [
      '## Real one',
      '',
      '```md',
      '## not a heading',
      '### also not',
      '```',
      '',
      '## Real two',
      '',
      'Body of two.',
    ].join('\n');

    const previews = extractSectionPreviews(md);
    expect(previews).toHaveLength(2);
  });

  it('discards content before the first heading', () => {
    const md = '# Title\n\nIntro.\n\n## Section\n\nSection body.';
    const previews = extractSectionPreviews(md);
    expect(previews).toHaveLength(1);
    expect(asText(previews[0])).toBe('Section body.');
  });
});
