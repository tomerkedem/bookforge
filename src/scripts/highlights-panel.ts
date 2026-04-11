/**
 * Highlights Panel — shows all highlights for the current book
 * grouped by chapter, with jump-to and Markdown export.
 */

type LangKey = 'he' | 'en' | 'es';

function getLang(): LangKey {
  return (new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en') as LangKey;
}

// ── i18n ─────────────────────────────────────────────────────────────────────

const i18n: Record<LangKey, {
  title: string;
  empty: string;
  emptyHint: string;
  exportMd: string;
  close: string;
  chapterLabel: (n: number) => string;
  colorLabels: Record<string, string>;
  addNote: string;
  notePlaceholder: string;
  dir: 'rtl' | 'ltr';
}> = {
  he: {
    title: 'ההדגשות שלי',
    empty: 'אין הדגשות עדיין',
    emptyHint: 'סמן טקסט בזמן קריאה כדי לשמור תובנות',
    exportMd: 'ייצוא Markdown',
    close: 'סגור',
    chapterLabel: (n) => `פרק ${n}`,
    colorLabels: { yellow: 'תובנה', blue: 'שאלה', green: 'פעולה', pink: 'ציטוט' },
    addNote: 'הוסף הערה...',
    notePlaceholder: 'כתוב הערה על ההדגשה הזו...',
    dir: 'rtl',
  },
  es: {
    title: 'Mis resaltados',
    empty: 'Aún no hay resaltados',
    emptyHint: 'Selecciona texto mientras lees para guardar ideas',
    exportMd: 'Exportar Markdown',
    close: 'Cerrar',
    chapterLabel: (n) => `Capítulo ${n}`,
    colorLabels: { yellow: 'Insight', blue: 'Pregunta', green: 'Acción', pink: 'Cita' },
    addNote: 'Añadir nota...',
    notePlaceholder: 'Escribe una nota sobre este resaltado...',
    dir: 'ltr',
  },
  en: {
    title: 'My Highlights',
    empty: 'No highlights yet',
    emptyHint: 'Select text while reading to save insights',
    exportMd: 'Export Markdown',
    close: 'Close',
    chapterLabel: (n) => `Chapter ${n}`,
    colorLabels: { yellow: 'Insight', blue: 'Question', green: 'Action', pink: 'Quote' },
    addNote: 'Add a note...',
    notePlaceholder: 'Write a note about this highlight...',
    dir: 'ltr',
  },
};

function tr() { return i18n[getLang()]; }

// ── Types ─────────────────────────────────────────────────────────────────────

interface HighlightData {
  id: string;
  text: string;
  color: string;
  timestamp: number;
  note?: string;
}

interface ChapterHighlights {
  chapterId: number;
  highlights: HighlightData[];
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const COLOR_EMOJI: Record<string, string> = {
  yellow: '💡', blue: '❓', green: '✅', pink: '💬',
};
const COLOR_BG: Record<string, string> = {
  yellow: '#fef9c3', blue: '#dbeafe', green: '#dcfce7', pink: '#fce7f3',
};
const COLOR_DARK_BG: Record<string, string> = {
  yellow: 'rgba(234,179,8,0.18)', blue: 'rgba(59,130,246,0.18)',
  green: 'rgba(34,197,94,0.18)',  pink: 'rgba(236,72,153,0.18)',
};
const COLOR_TEXT: Record<string, string> = {
  yellow: '#713f12', blue: '#1e3a8a', green: '#14532d', pink: '#831843',
};
const COLOR_DARK_TEXT: Record<string, string> = {
  yellow: '#fde68a', blue: '#93c5fd', green: '#86efac', pink: '#f9a8d4',
};

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

function getAllHighlights(): ChapterHighlights[] {
  const book = getCurrentBook();
  if (!book) return [];
  const lang = getLang();
  const prefix = `yuval_hl_${book}_ch`;
  const result: ChapterHighlights[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    // key format: yuval_hl_{book}_ch{chapterId}_{lang}
    const rest = key.slice(prefix.length); // e.g. "3_en"
    const [chStr, hlLang] = rest.split('_');
    if (hlLang !== lang) continue;
    const chapterId = parseInt(chStr, 10);
    if (isNaN(chapterId)) continue;

    try {
      const list: HighlightData[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (list.length) result.push({ chapterId, highlights: list });
    } catch { /* skip */ }
  }

  return result.sort((a, b) => a.chapterId - b.chapterId);
}

function saveNote(chapterId: number, hlId: string, note: string): void {
  const book = getCurrentBook();
  const lang = getLang();
  const key = `yuval_hl_${book}_ch${chapterId}_${lang}`;
  try {
    const list: HighlightData[] = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = list.findIndex(h => h.id === hlId);
    if (idx !== -1) {
      if (note.trim()) {
        list[idx].note = note.trim();
      } else {
        delete list[idx].note;
      }
      localStorage.setItem(key, JSON.stringify(list));
    }
  } catch { /* skip */ }
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('hl-panel-styles')) return;
  const s = document.createElement('style');
  s.id = 'hl-panel-styles';
  s.textContent = `
    /* ── Trigger button in FAB ── */
    #hl-panel-fab-btn {
      position: fixed;
      bottom: 154px;
      right: 20px;
      z-index: 9980;
      width: 44px; height: 44px;
      border-radius: 50%;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      color: var(--yuval-text-secondary, #555);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      transition: transform 0.2s, box-shadow 0.2s, background 0.15s;
    }
    #hl-panel-fab-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 16px rgba(0,0,0,0.14);
      background: var(--yuval-bg-secondary, #f3f4f6);
    }
    #hl-panel-fab-btn .hl-fab-badge {
      position: absolute;
      top: -4px; right: -4px;
      background: #6366f1;
      color: #fff;
      font-size: 10px; font-weight: 700;
      border-radius: 100px;
      padding: 1px 5px;
      min-width: 18px;
      text-align: center;
      line-height: 16px;
    }
    :is(.dark) #hl-panel-fab-btn {
      background: #2a2a2a;
      border-color: rgba(255,255,255,0.1);
    }

    /* ── Overlay ── */
    #hl-panel-overlay {
      position: fixed; inset: 0; z-index: 9995;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 0.25s ease;
      pointer-events: none;
    }
    #hl-panel-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    /* ── Drawer ── */
    #hl-panel {
      position: fixed;
      top: 0; bottom: 0; right: 0;
      width: min(400px, 90vw);
      z-index: 9996;
      background: var(--yuval-surface, #fff);
      border-left: 1px solid var(--yuval-border, #e5e7eb);
      box-shadow: -8px 0 40px rgba(0,0,0,0.12);
      display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #hl-panel.open { transform: translateX(0); }
    :is(.dark) #hl-panel {
      background: #1e1e1e;
      border-color: rgba(255,255,255,0.08);
      box-shadow: -8px 0 40px rgba(0,0,0,0.4);
    }

    /* RTL: panel slides from left */
    [dir="rtl"] #hl-panel {
      right: auto; left: 0;
      border-left: none;
      border-right: 1px solid var(--yuval-border, #e5e7eb);
      transform: translateX(-100%);
    }
    [dir="rtl"] #hl-panel.open { transform: translateX(0); }
    [dir="rtl"] #hl-panel-fab-btn { right: auto; left: 20px; }

    /* ── Panel header ── */
    #hl-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px;
      border-bottom: 1px solid var(--yuval-border, #e5e7eb);
      flex-shrink: 0;
    }
    :is(.dark) #hl-panel-header { border-color: rgba(255,255,255,0.08); }

    #hl-panel-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--yuval-text, #111);
    }
    :is(.dark) #hl-panel-title { color: #eee; }

    .hl-panel-header-actions {
      display: flex; gap: 8px; align-items: center;
    }

    #hl-export-btn {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px;
      background: var(--yuval-bg-secondary, #f3f4f6);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 8px;
      font-size: 12px; font-weight: 600;
      color: var(--yuval-text-secondary, #555);
      cursor: pointer;
      transition: background 0.12s;
    }
    #hl-export-btn:hover { background: var(--yuval-border, #e5e7eb); }
    :is(.dark) #hl-export-btn {
      background: rgba(255,255,255,0.07);
      border-color: rgba(255,255,255,0.1);
      color: #bbb;
    }

    #hl-panel-close {
      width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      background: none; border: none; border-radius: 8px;
      font-size: 16px; color: var(--yuval-text-muted, #9ca3af);
      cursor: pointer;
      transition: background 0.12s;
    }
    #hl-panel-close:hover { background: var(--yuval-bg-secondary, #f3f4f6); }

    /* ── Panel body ── */
    #hl-panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    /* ── Empty state ── */
    .hl-panel-empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px;
      height: 100%;
      text-align: center;
      padding: 32px;
    }
    .hl-panel-empty-icon { font-size: 36px; opacity: 0.4; }
    .hl-panel-empty-text {
      font-size: 14px; font-weight: 600;
      color: var(--yuval-text-secondary, #555);
    }
    .hl-panel-empty-hint {
      font-size: 12px;
      color: var(--yuval-text-muted, #9ca3af);
      line-height: 1.5;
    }

    /* ── Chapter group ── */
    .hl-chapter-group { margin-bottom: 20px; }
    .hl-chapter-label {
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--yuval-text-muted, #9ca3af);
      margin-bottom: 8px;
      padding: 0 2px;
    }

    /* ── Highlight item ── */
    .hl-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: filter 0.15s, transform 0.15s;
      text-decoration: none;
    }
    .hl-item:hover { filter: brightness(0.96); transform: translateX(2px); }
    [dir="rtl"] .hl-item:hover { transform: translateX(-2px); }

    .hl-item-emoji { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
    .hl-item-body { flex: 1; min-width: 0; }
    .hl-item-text {
      font-size: 13px; line-height: 1.6;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      word-break: break-word;
    }
    .hl-item-meta {
      font-size: 11px;
      margin-top: 4px;
      opacity: 0.6;
    }

    /* ── Note area ── */
    .hl-item-note-area {
      margin-top: 7px;
      padding-top: 7px;
      border-top: 1px dashed rgba(0,0,0,0.12);
    }
    :is(.dark) .hl-item-note-area { border-top-color: rgba(255,255,255,0.1); }

    .hl-note-text {
      display: block;
      font-size: 12px;
      line-height: 1.5;
      color: inherit;
      opacity: 0.8;
      cursor: text;
      padding: 2px 4px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .hl-note-text:hover { background: rgba(0,0,0,0.05); }
    :is(.dark) .hl-note-text:hover { background: rgba(255,255,255,0.07); }

    .hl-note-empty {
      display: block;
      font-size: 11.5px;
      color: inherit;
      opacity: 0.38;
      cursor: text;
      padding: 2px 4px;
      border-radius: 4px;
      font-style: italic;
    }
    .hl-note-empty:hover { opacity: 0.55; background: rgba(0,0,0,0.04); }
    :is(.dark) .hl-note-empty:hover { background: rgba(255,255,255,0.06); }

    .hl-note-textarea {
      width: 100%;
      min-height: 56px;
      font-size: 12px;
      line-height: 1.5;
      padding: 5px 6px;
      border-radius: 6px;
      border: 1px solid rgba(0,0,0,0.18);
      background: rgba(255,255,255,0.5);
      color: inherit;
      resize: vertical;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
    }
    :is(.dark) .hl-note-textarea {
      border-color: rgba(255,255,255,0.15);
      background: rgba(0,0,0,0.25);
      color: #e0e0e0;
    }
    .hl-note-textarea:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99,102,241,0.18);
    }
    .hl-note-hint {
      font-size: 10px;
      opacity: 0.45;
      margin-top: 3px;
      display: block;
    }
  `;
  document.head.appendChild(s);
}

// ── Build panel DOM ───────────────────────────────────────────────────────────

function buildPanel(): void {
  if (document.getElementById('hl-panel')) return;

  // FAB button
  const fabBtn = document.createElement('button');
  fabBtn.id = 'hl-panel-fab-btn';
  fabBtn.type = 'button';
  fabBtn.setAttribute('aria-label', 'My Highlights');
  fabBtn.innerHTML = `<span>💡</span><span class="hl-fab-badge" id="hl-fab-badge" style="display:none"></span>`;
  document.body.appendChild(fabBtn);

  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'hl-panel-overlay';
  document.body.appendChild(overlay);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'hl-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  document.body.appendChild(panel);

  fabBtn.addEventListener('click', openPanel);
  overlay.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });
}

// ── Render content ────────────────────────────────────────────────────────────

function openNoteEditor(
  noteArea: HTMLElement,
  chapterId: number,
  hl: HighlightData,
  textColor: string,
): void {
  if (noteArea.querySelector('.hl-note-textarea')) return; // already open

  const labels = tr();
  const current = hl.note || '';

  noteArea.innerHTML = `
    <textarea class="hl-note-textarea" placeholder="${labels.notePlaceholder}"
      style="color:${textColor}">${current}</textarea>
    <span class="hl-note-hint" style="color:${textColor}">
      ${labels.dir === 'rtl' ? 'Ctrl+Enter לשמירה' : 'Ctrl+Enter to save'}
    </span>
  `;

  const ta = noteArea.querySelector<HTMLTextAreaElement>('.hl-note-textarea')!;
  ta.focus();
  ta.selectionStart = ta.selectionEnd = ta.value.length;

  const commit = () => {
    const newNote = ta.value;
    saveNote(chapterId, hl.id, newNote);
    hl.note = newNote.trim() || undefined;

    const noteHtml = hl.note
      ? `<span class="hl-note-text">${hl.note.replace(/</g, '&lt;')}</span>`
      : `<span class="hl-note-empty">${labels.addNote}</span>`;
    noteArea.innerHTML = noteHtml;

    // Re-attach click handler
    noteArea.addEventListener('click', (e) => {
      e.stopPropagation();
      openNoteEditor(noteArea, chapterId, hl, textColor);
    }, { once: true });
  };

  ta.addEventListener('blur', commit);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      ta.removeEventListener('blur', commit);
      commit();
    }
    if (e.key === 'Escape') {
      ta.removeEventListener('blur', commit);
      const noteHtml = hl.note
        ? `<span class="hl-note-text">${hl.note.replace(/</g, '&lt;')}</span>`
        : `<span class="hl-note-empty">${labels.addNote}</span>`;
      noteArea.innerHTML = noteHtml;
      noteArea.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openNoteEditor(noteArea, chapterId, hl, textColor);
      }, { once: true });
    }
  });
}

function renderPanel(): void {
  const panel = document.getElementById('hl-panel');
  if (!panel) return;

  const labels = tr();
  const isDark = document.documentElement.classList.contains('dark');
  const allChapters = getAllHighlights();
  const totalCount = allChapters.reduce((s, c) => s + c.highlights.length, 0);

  panel.setAttribute('dir', labels.dir);
  panel.innerHTML = `
    <div id="hl-panel-header">
      <span id="hl-panel-title">${labels.title}</span>
      <div class="hl-panel-header-actions">
        ${totalCount > 0 ? `<button id="hl-export-btn" type="button">⬇ ${labels.exportMd}</button>` : ''}
        <button id="hl-panel-close" type="button" aria-label="${labels.close}">✕</button>
      </div>
    </div>
    <div id="hl-panel-body"></div>
  `;

  document.getElementById('hl-panel-close')?.addEventListener('click', closePanel);
  document.getElementById('hl-export-btn')?.addEventListener('click', exportMarkdown);

  const body = document.getElementById('hl-panel-body')!;

  if (!allChapters.length) {
    body.innerHTML = `
      <div class="hl-panel-empty">
        <span class="hl-panel-empty-icon">✍️</span>
        <span class="hl-panel-empty-text">${labels.empty}</span>
        <span class="hl-panel-empty-hint">${labels.emptyHint}</span>
      </div>
    `;
    return;
  }

  allChapters.forEach(({ chapterId, highlights }) => {
    const group = document.createElement('div');
    group.className = 'hl-chapter-group';

    const chLabel = document.createElement('div');
    chLabel.className = 'hl-chapter-label';
    chLabel.textContent = labels.chapterLabel(chapterId);
    group.appendChild(chLabel);

    highlights.forEach(hl => {
      const bg   = isDark ? COLOR_DARK_BG[hl.color] : COLOR_BG[hl.color];
      const text = isDark ? COLOR_DARK_TEXT[hl.color] : COLOR_TEXT[hl.color];
      const emoji = COLOR_EMOJI[hl.color];
      const colorLabel = labels.colorLabels[hl.color] || '';

      const item = document.createElement('div');
      item.className = 'hl-item';
      item.style.background = bg;
      item.setAttribute('data-hl-panel-id', hl.id);
      item.setAttribute('data-hl-chapter', String(chapterId));

      const noteHtml = hl.note
        ? `<span class="hl-note-text">${hl.note.replace(/</g, '&lt;')}</span>`
        : `<span class="hl-note-empty">${labels.addNote}</span>`;

      item.innerHTML = `
        <span class="hl-item-emoji" style="cursor:pointer" title="Go to highlight">${emoji}</span>
        <div class="hl-item-body">
          <div class="hl-item-text" style="color:${text};cursor:pointer">${hl.text}</div>
          <div class="hl-item-meta" style="color:${text}">${colorLabel}</div>
          <div class="hl-item-note-area">
            ${noteHtml}
          </div>
        </div>
      `;

      // Click on text/emoji → jump to highlight
      item.querySelector('.hl-item-emoji')!.addEventListener('click', () => jumpToHighlight(chapterId, hl));
      (item.querySelector('.hl-item-text') as HTMLElement).addEventListener('click', () => jumpToHighlight(chapterId, hl));

      // Click on note area → open inline editor
      const noteArea = item.querySelector('.hl-item-note-area') as HTMLElement;
      noteArea.addEventListener('click', (e) => {
        e.stopPropagation();
        openNoteEditor(noteArea, chapterId, hl, text);
      });

      group.appendChild(item);
    });

    body.appendChild(group);
  });
}

// ── Jump to highlight ─────────────────────────────────────────────────────────

async function jumpToHighlight(chapterId: number, hl: HighlightData): Promise<void> {
  const container = document.getElementById('chapter-container');
  const currentChapter = parseInt(container?.dataset.chapterId || '0', 10);
  const book = getCurrentBook();
  const lang = getLang();
  const url = lang === 'he'
    ? `/read/${book}/${chapterId}?lang=he`
    : `/read/${book}/${chapterId}`;

  closePanel();

  const navigate = async () => {
    // Find the mark element in the DOM
    const mark = Array.from(document.querySelectorAll<HTMLElement>('[data-hl-id]'))
      .find(el => el.dataset.hlId === hl.id);

    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash highlight
      mark.style.outline = '3px solid #6366f1';
      mark.style.outlineOffset = '2px';
      setTimeout(() => { mark.style.outline = ''; mark.style.outlineOffset = ''; }, 1800);
    } else {
      // Find by text content
      const allMarks = document.querySelectorAll<HTMLElement>('.yuval-hl');
      const match = Array.from(allMarks).find(m => m.textContent === hl.text);
      if (match) {
        match.scrollIntoView({ behavior: 'smooth', block: 'center' });
        match.style.outline = '3px solid #6366f1';
        setTimeout(() => { match.style.outline = ''; }, 1800);
      }
    }
  };

  if (currentChapter === chapterId) {
    await navigate();
    return;
  }

  // Navigate to different chapter
  const loadFn = (window as any).yuvalLoadChapter as ((url: string) => Promise<void>) | undefined;
  if (loadFn) {
    await loadFn(url);
    setTimeout(navigate, 500);
  } else {
    window.location.href = url;
  }
}

// ── Export Markdown ───────────────────────────────────────────────────────────

function exportMarkdown(): void {
  const labels = tr();
  const allChapters = getAllHighlights();
  const book = getCurrentBook();

  let md = `# ${labels.title} — ${book}\n\n`;
  md += `*${new Date().toLocaleDateString()}*\n\n`;

  allChapters.forEach(({ chapterId, highlights }) => {
    md += `## ${labels.chapterLabel(chapterId)}\n\n`;
    highlights.forEach(hl => {
      const emoji = COLOR_EMOJI[hl.color];
      const colorLabel = labels.colorLabels[hl.color];
      md += `${emoji} **${colorLabel}**\n> ${hl.text}\n`;
      if (hl.note) md += `\n*${hl.note}*\n`;
      md += '\n';
    });
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `highlights-${book}-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Open / Close ──────────────────────────────────────────────────────────────

function openPanel(): void {
  renderPanel();
  document.getElementById('hl-panel-overlay')?.classList.add('open');
  document.getElementById('hl-panel')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel(): void {
  document.getElementById('hl-panel-overlay')?.classList.remove('open');
  document.getElementById('hl-panel')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Export ────────────────────────────────────────────────────────────────────

function updateBadge(): void {
  const badge = document.getElementById('hl-fab-badge');
  if (!badge) return;
  const total = getAllHighlights().reduce((s, c) => s + c.highlights.length, 0);
  badge.textContent = String(total);
  badge.style.display = total > 0 ? '' : 'none';
}

export function initHighlightsPanel(): void {
  injectStyles();
  buildPanel();

  // Update badge immediately on load
  updateBadge();

  // Re-update after chapter navigation
  window.addEventListener('chapter-content-swapped', updateBadge);
}
