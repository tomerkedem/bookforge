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
    `<span class="line-num">${i + 1}</span>`
  ).join('');
}

renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlightedCode = hljs.highlight(text, { language }).value;

  const isPython = ['python', 'py'].includes((lang || '').toLowerCase());
  const lineCount = text.split('\n').length;

  const encodedCode = encodeURIComponent(text);
  const lineNumbers = generateLineNumbers(lineCount);

  // ⚠️ NO UI TEXT HERE
  // UI should be injected by frontend layer

  if (isPython) {
    return `
<div class="code-runner-wrapper" data-code="${encodedCode}" data-lang="${language}" dir="ltr">
  <div class="runner-header">
    <div class="header-left">
      <div class="window-controls">
        <span class="control red"></span>
        <span class="control yellow"></span>
        <span class="control green"></span>
      </div>
      <span class="file-name" data-i18n="file.python"></span>
    </div>
    <div class="header-right">
      <span class="language-tag">${language}</span>
    </div>
  </div>

  <div class="toolbar">
    <div class="toolbar-left">
      <button class="tool-btn btn-run" data-lang="${language}" data-i18n="run">
      </button>
    </div>
    <div class="toolbar-right">
      <button class="tool-btn btn-copy" data-code="${encodedCode}" data-i18n="copy">
      </button>
    </div>
  </div>

  <div class="editor-container">
    <div class="line-numbers" aria-hidden="true">${lineNumbers}</div>
    <pre class="code-display">
      <code class="hljs language-${language}">${highlightedCode}</code>
    </pre>
  </div>

  <div class="status-bar">
    <div class="status-left">
      <span class="status-item run-status"></span>
    </div>
    <div class="status-right">
      <span class="status-item" data-lines="${lineCount}"></span>
    </div>
  </div>

  <div class="output-panel" hidden>
    <div class="output-header">
      <span data-i18n="output"></span>
      <button class="btn-clear-output" data-i18n="clear"></button>
    </div>
    <div class="output-content">
      <pre class="output-text"></pre>
    </div>
  </div>
</div>`;
  }

  return `
<div class="code-block-wrapper" data-lang="${language}" dir="ltr">
  <div class="block-header">
    <div class="header-left">
      <div class="window-controls">
        <span class="control red"></span>
        <span class="control yellow"></span>
        <span class="control green"></span>
      </div>
      <span class="language-tag">${language}</span>
    </div>
    <div class="header-right">
      <button class="btn-copy" data-code="${encodedCode}" data-i18n="copy"></button>
    </div>
  </div>

  <div class="code-content">
    <div class="line-numbers" aria-hidden="true">${lineNumbers}</div>
    <pre>
      <code class="hljs language-${language}">${highlightedCode}</code>
    </pre>
  </div>
</div>`;
};

marked.use({ renderer });

export { marked };