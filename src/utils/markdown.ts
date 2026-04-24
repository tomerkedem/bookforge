import { marked } from 'marked';
import hljs from 'highlight.js';

const renderer = new marked.Renderer();

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateLineNumbers(lineCount: number): string {
  return Array.from({ length: lineCount }, (_, i) =>
    `<span>${i + 1}</span>`
  ).join('');
}

// Languages that should render as a terminal/shell block (Stripe docs style).
const TERMINAL_LANGS = new Set([
  'bash', 'sh', 'shell', 'zsh',
  'powershell', 'pwsh',
  'cmd', 'bat',
  'terminal',
]);

// Languages with in-browser execution support (Pyodide).
const RUNNABLE_LANGS = new Set(['python', 'py']);

// Suggested filenames per language, shown in the header.
// Purely aesthetic — gives the block the feel of a real source file.
function defaultFilename(lang: string): string {
  const map: Record<string, string> = {
    python: 'example.py', py: 'example.py',
    javascript: 'example.js', js: 'example.js',
    typescript: 'example.ts', ts: 'example.ts',
    jsx: 'example.jsx', tsx: 'example.tsx',
    json: 'data.json',
    yaml: 'config.yml', yml: 'config.yml',
    html: 'index.html',
    css: 'styles.css',
    sql: 'query.sql',
    go: 'main.go',
    rust: 'main.rs', rs: 'main.rs',
    java: 'Main.java',
    'c++': 'main.cpp', cpp: 'main.cpp',
    c: 'main.c',
    csharp: 'Program.cs', cs: 'Program.cs',
    ruby: 'example.rb', rb: 'example.rb',
    php: 'index.php',
    xml: 'document.xml',
    markdown: 'readme.md', md: 'readme.md',
  };
  return map[lang.toLowerCase()] || `code.${lang}`;
}

// Pretty language label for the badge (capitalized).
function languageLabel(lang: string): string {
  const map: Record<string, string> = {
    py: 'Python', python: 'Python',
    js: 'JavaScript', javascript: 'JavaScript',
    ts: 'TypeScript', typescript: 'TypeScript',
    jsx: 'JSX', tsx: 'TSX',
    json: 'JSON',
    yaml: 'YAML', yml: 'YAML',
    html: 'HTML', css: 'CSS', sql: 'SQL', xml: 'XML',
    go: 'Go',
    rust: 'Rust', rs: 'Rust',
    java: 'Java',
    'c++': 'C++', cpp: 'C++',
    c: 'C',
    csharp: 'C#', cs: 'C#',
    ruby: 'Ruby', rb: 'Ruby',
    php: 'PHP',
    markdown: 'Markdown', md: 'Markdown',
  };
  return map[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

/**
 * Build the Stripe-inspired terminal block for shell languages.
 * Commands render clean (no syntax highlighting) so they stay
 * copy-pastable. The cyan prompt is the only visual chrome.
 */
function renderBashBlock(text: string, lang: string, encodedCode: string): string {
  const isPowerShell = lang === 'powershell' || lang === 'pwsh';
  const isCmd = lang === 'cmd' || lang === 'bat';

  const prompt = isPowerShell ? 'PS&gt;' : isCmd ? '&gt;' : '$';

  const badgeLabel = isPowerShell ? 'PowerShell'
                   : isCmd ? 'Cmd'
                   : lang.charAt(0).toUpperCase() + lang.slice(1);

  const linesHtml = text.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return `<div class="bash-line"><span class="bash-text">&nbsp;</span></div>`;
    }
    const escaped = escapeHtmlAttr(line);
    return `<div class="bash-line"><span class="bash-prompt">${prompt}</span><span class="bash-text">${escaped}</span></div>`;
  }).join('');

  return `
<div class="bash-block" data-lang="${lang}" dir="ltr">
  <div class="bash-header">
    <span class="bash-label">Terminal</span>
    <span class="bash-lang-badge">${badgeLabel}</span>
    <button class="bash-theme-btn" type="button" title="Toggle code theme" data-code-theme-toggle aria-label="Toggle code theme">
      <svg class="bash-theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#cr-sun"/></svg>
      <svg class="bash-theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#cr-moon"/></svg>
    </button>
    <button class="bash-copy-btn btn-copy" type="button" title="Copy" data-code="${encodedCode}">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="bash-copy-label">Copy</span>
      <span class="bash-copied-label">Copied</span>
    </button>
  </div>
  <pre class="bash-body" data-code="${encodedCode}">${linesHtml}</pre>
</div>`;
}

/**
 * Build a CodeRunner block — IDE-styled code viewer with a Run button.
 * Used for Python code that can be executed in-browser via Pyodide.
 * The theme (dark/light) is applied via a global data-code-theme attribute
 * on <html>, so all blocks on the page switch together.
 */
function renderCodeRunner(text: string, lang: string, encodedCode: string, highlightedCode: string): string {
  const lineCount = text.split('\n').length;
  const lineNumbers = generateLineNumbers(lineCount);
  const filename = defaultFilename(lang);
  const label = languageLabel(lang);

  return `
<div class="coderunner" data-lang="${lang}" dir="ltr" data-code="${encodedCode}">
  <div class="cr-header">
    <span class="cr-label">${filename}</span>
    <span class="cr-lang-badge">${label}</span>
    <span class="cr-spacer"></span>
    <button class="cr-btn cr-theme-btn" type="button" title="Toggle code theme" data-code-theme-toggle aria-label="Toggle code theme">
      <svg class="cr-theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#cr-sun"/></svg>
      <svg class="cr-theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#cr-moon"/></svg>
    </button>
    <button class="cr-btn cr-copy-btn" type="button" title="Copy" data-code="${encodedCode}">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="cr-copy-label">Copy</span>
      <span class="cr-copied-label">Copied</span>
    </button>
    <button class="cr-btn cr-edit-btn" type="button" title="Edit code">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
      <span class="cr-edit-label">Edit</span>
      <span class="cr-editing-label">Done</span>
    </button>
    <button class="cr-btn cr-reset-btn" type="button" title="Reset to original">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
      <span>Reset</span>
    </button>
    <button class="cr-btn cr-btn-primary cr-run-btn" type="button" title="Run">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21"></polygon>
      </svg>
      <span class="cr-run-label">Run</span>
      <span class="cr-running-label">Running</span>
    </button>
  </div>
  <div class="cr-body">
    <div class="cr-gutter" aria-hidden="true">${lineNumbers}</div>
    <pre class="cr-code"><code class="hljs language-${lang}">${highlightedCode}</code></pre>
    <textarea class="cr-editor" spellcheck="false" autocorrect="off" autocapitalize="off" aria-label="Editable code"></textarea>
  </div>
  <div class="cr-statusbar">
    <span class="cr-status-item"><span class="cr-dot"></span>${label}</span>
    <span class="cr-status-item">${lineCount} lines</span>
    <span class="cr-status-item">UTF-8</span>
    <span class="cr-status-item cr-status-right cr-run-status">Ready</span>
  </div>
  <div class="cr-output" hidden>
    <div class="cr-output-header">
      <span class="cr-output-label">Output</span>
      <button class="cr-output-clear" type="button">Clear</button>
    </div>
    <pre class="cr-output-text"></pre>
  </div>
</div>`;
}

/**
 * Build a CodeBlock — IDE-styled code viewer WITHOUT a Run button.
 * Used for non-runnable languages (YAML, JSON, JS, TS, SQL, ...).
 * Uses the same theming as CodeRunner so they look like siblings.
 */
function renderCodeBlock(text: string, lang: string, encodedCode: string, highlightedCode: string): string {
  const lineCount = text.split('\n').length;
  const lineNumbers = generateLineNumbers(lineCount);
  const filename = defaultFilename(lang);
  const label = languageLabel(lang);

  return `
<div class="coderunner codeblock" data-lang="${lang}" dir="ltr" data-code="${encodedCode}">
  <div class="cr-header">
    <span class="cr-label">${filename}</span>
    <span class="cr-lang-badge">${label}</span>
    <span class="cr-spacer"></span>
    <button class="cr-btn cr-theme-btn" type="button" title="Toggle code theme" data-code-theme-toggle aria-label="Toggle code theme">
      <svg class="cr-theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#cr-sun"/></svg>
      <svg class="cr-theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#cr-moon"/></svg>
    </button>
    <button class="cr-btn cr-copy-btn" type="button" title="Copy" data-code="${encodedCode}">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="cr-copy-label">Copy</span>
      <span class="cr-copied-label">Copied</span>
    </button>
  </div>
  <div class="cr-body">
    <div class="cr-gutter" aria-hidden="true">${lineNumbers}</div>
    <pre class="cr-code"><code class="hljs language-${lang}">${highlightedCode}</code></pre>
  </div>
  <div class="cr-statusbar">
    <span class="cr-status-item"><span class="cr-dot"></span>${label}</span>
    <span class="cr-status-item">${lineCount} lines</span>
    <span class="cr-status-item">UTF-8</span>
  </div>
</div>`;
}

renderer.code = ({ text, lang }) => {
  const rawLang = (lang || '').toLowerCase();
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const encodedCode = encodeURIComponent(text);

  // Route 1: terminal/shell languages → Stripe-inspired BashBlock.
  if (TERMINAL_LANGS.has(rawLang)) {
    return renderBashBlock(text, rawLang, encodedCode);
  }

  const highlightedCode = hljs.highlight(text, { language }).value;

  // Route 2: Python → CodeRunner (IDE chrome + Run button).
  if (RUNNABLE_LANGS.has(rawLang)) {
    return renderCodeRunner(text, rawLang, encodedCode, highlightedCode);
  }

  // Route 3: everything else → CodeBlock (IDE chrome, no Run).
  return renderCodeBlock(text, language, encodedCode, highlightedCode);
};

marked.use({ renderer });

export { marked };