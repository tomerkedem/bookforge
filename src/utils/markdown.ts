import { marked } from 'marked';
import hljs from 'highlight.js';

// Custom renderer handles all code highlighting - no plugin needed

const renderer = new marked.Renderer();

// Custom code block renderer - uses CodeRunner structure for Python
renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlightedCode = hljs.highlight(text, { language }).value;
  const isPython = ['python', 'py'].includes((lang || '').toLowerCase());
  const lineCount = text.split('\n').length;
  const uniqueId = Math.random().toString(36).substring(2, 9);
  
  // Escape text for HTML attributes
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  
  // Generate line numbers HTML
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => 
    `<span class="line-num">${i + 1}</span>`
  ).join('');
  
  if (isPython) {
    // CodeRunner structure for Python - interactive execution
    return `
<div class="code-runner-wrapper" data-id="${uniqueId}" data-code="${encodeURIComponent(text)}" dir="ltr">
  <div class="runner-header">
    <div class="header-left">
      <div class="window-controls">
        <span class="control red"></span>
        <span class="control yellow"></span>
        <span class="control green"></span>
      </div>
      <span class="file-name">Python</span>
    </div>
    <div class="header-right">
      <span class="language-tag">${language}</span>
    </div>
  </div>
  <div class="toolbar">
    <div class="toolbar-left">
      <button class="tool-btn btn-run" data-language="${language}" title="הרץ קוד (Ctrl+Enter)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>הרץ</span>
      </button>
    </div>
    <div class="toolbar-right">
      <button class="tool-btn icon-only btn-copy" title="העתק קוד">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  </div>
  <div class="editor-container">
    <div class="line-numbers" aria-hidden="true">${lineNumbers}</div>
    <div class="code-area">
      <pre class="code-display"><code class="hljs language-${language}">${highlightedCode}</code></pre>
    </div>
  </div>
  <div class="status-bar">
    <div class="status-left"><span class="status-item run-status"></span></div>
    <div class="status-right">
      <span class="status-item">שורות: ${lineCount}</span>
    </div>
  </div>
  <div class="output-panel" hidden>
    <div class="output-header">
      <span>פלט</span>
      <button class="btn-clear-output" title="נקה פלט">✕</button>
    </div>
    <div class="output-content"><pre class="output-text"></pre></div>
  </div>
</div>`;
  } else {
    // CodeBlock structure for other languages - static display
    return `
<div class="code-block-wrapper" dir="ltr">
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
      <button class="btn-copy" title="העתק קוד" data-code="${encodeURIComponent(text)}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  </div>
  <div class="code-content">
    <div class="line-numbers" aria-hidden="true">${lineNumbers}</div>
    <pre><code class="hljs language-${language}">${highlightedCode}</code></pre>
  </div>
</div>`;
  }
};

marked.use({ renderer });

export { marked };
