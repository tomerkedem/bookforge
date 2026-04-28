/**
 * Build-time extractor for sidebar section previews.
 *
 * Splits a chapter's raw markdown into per-section chunks (one per
 * `## ` h2 or `### ` h3 heading, fences-aware so headings inside code
 * blocks are ignored), and returns the preview to render in the sidebar
 * for each section.
 *
 * Two preview shapes:
 *   - `code`  → first triple-backtick fence in the section, capped at
 *               5 lines, syntax-highlighted via highlight.js (the same
 *               highlighter the body uses, so any installed language
 *               grammar Just Works). Unknown / mermaid / no-language
 *               fences fall through to escaped plain text.
 *   - `text`  → first sentence of the first prose paragraph, with
 *               markdown formatting stripped, capped at 80 chars + …
 *               Used when the section has no fenced code.
 *
 * Section ids returned in `extractSectionPreviews` are `section-${idx}`,
 * matching the fallback ids `extractSectionsFromDoc` assigns when an
 * h2/h3 element has no explicit `id` attribute (which is the case for
 * everything `marked` emits in this project — the renderer doesn't
 * generate heading slugs). Keep these two id schemes in lockstep or
 * the sidebar's preview lookup will silently miss.
 */

import hljs from 'highlight.js';

export type SectionPreview =
  | { type: 'code'; language: string; html: string }
  | { type: 'text'; sentence: string };

const MAX_LINES = 5;
const MAX_TEXT_LEN = 80;

interface SectionChunk {
  body: string;
}

/** Split markdown by `##` / `###` headings, fences-aware. The text
 *  before the first heading is discarded — the sidebar only renders
 *  rows for h2/h3, so a leading `# Title` + intro paragraph isn't a
 *  "section" in the sidebar's vocabulary.
 *
 *  CRLF is normalized to LF up-front so every downstream regex / split
 *  on `\n` works consistently and the highlighted code preview never
 *  carries trailing `\r` characters into the JSON payload. Books are
 *  authored on Windows so this is the canonical input shape today. */
function splitIntoSections(md: string): SectionChunk[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const sections: SectionChunk[] = [];
  let buffer: string[] = [];
  let started = false;
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;

    const isHeading = !inFence && /^(##|###)\s+/.test(line);
    if (isHeading) {
      if (started) sections.push({ body: buffer.join('\n') });
      buffer = [];
      started = true;
      continue;
    }
    if (started) buffer.push(line);
  }
  if (started) sections.push({ body: buffer.join('\n') });
  return sections;
}

/** Extract a preview from a single section body (text below an h2/h3,
 *  up to but not including the next heading). Exported so it can be
 *  unit-tested directly without going through the full splitter.
 *
 *  Normalizes CRLF here too because callers can reach this function
 *  directly (tests do; future internal callers might). Cheap, safe,
 *  idempotent. */
export function extractPreview(rawBody: string): SectionPreview {
  const body = rawBody.replace(/\r\n/g, '\n');
  const codeMatch = /```([^\n`]*)\n([\s\S]*?)\n```/m.exec(body);
  if (codeMatch) {
    const language = (codeMatch[1] || 'plain').trim().toLowerCase() || 'plain';
    const rawLines = codeMatch[2].split('\n').slice(0, MAX_LINES);
    const code = rawLines.join('\n');
    return { type: 'code', language, html: highlightCode(code, language) };
  }

  const sentence = extractFirstSentence(body);
  return { type: 'text', sentence };
}

/** Run highlight.js if it knows the language; otherwise return
 *  HTML-escaped plain text so the layout doesn't break on unknown
 *  fences (mermaid, plain, custom DSLs, etc.). `ignoreIllegals` keeps
 *  partial / mid-block snippets from throwing — we're often slicing in
 *  the middle of a function definition. */
function highlightCode(code: string, language: string): string {
  if (hljs.getLanguage(language)) {
    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
  }
  return escapeHtml(code);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** First sentence of the first prose paragraph, with markdown
 *  formatting stripped. Inline-code backticks are stripped (`foo` →
 *  foo) so previews don't render literal backticks; bold/italic
 *  markers are removed; image syntax is dropped entirely; link syntax
 *  is reduced to its label. RTL/LTR control chars are stripped so they
 *  don't poison the text-direction we set on the preview pane.
 *
 *  Sentence boundary uses ASCII `.`/`!`/`?`. Hebrew sentences end the
 *  same way in this codebase's content, so a single regex covers both
 *  languages. */
function extractFirstSentence(body: string): string {
  const stripped = body
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~]+/g, '')
    .replace(/`+/g, '')
    .trim();

  if (!stripped) return '';

  const firstPara = stripped.split(/\n\s*\n/)[0] || '';
  const sentenceMatch = /[^.!?]+[.!?]?/.exec(firstPara);
  const raw = (sentenceMatch ? sentenceMatch[0] : firstPara).trim();
  if (raw.length <= MAX_TEXT_LEN) return raw;
  return raw.slice(0, MAX_TEXT_LEN - 1).trimEnd() + '…';
}

/** Public API: returns one preview per h2/h3 section in source order. */
export function extractSectionPreviews(markdown: string): SectionPreview[] {
  return splitIntoSections(markdown).map((c) => extractPreview(c.body));
}
