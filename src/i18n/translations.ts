/**
 * Central translation registry.
 *
 * HOW TO ADD A NEW LANGUAGE:
 *   1. Add it to SUPPORTED_LANGUAGES in src/utils/language.ts
 *   2. Add its translations here - any missing key falls back to English.
 *
 * HOW TO ADD A NEW STRING:
 *   1. Add a key here with at least an `en` value.
 *   2. Use data-i18n="key" in .astro, or t('key', lang) in .ts scripts.
 *
 * INTERPOLATION: use {{param}} in strings, pass { param: value } to t().
 */

export type Translations = Record<string, Record<string, string>>;

export const translations: Translations = {

  // ── FAB / Reading Controls ──────────────────────────────────────────────────
  'fab.reading':           { he: 'הגדרות קריאה',   en: 'Reading controls', es: 'Controles de lectura' },
  'fab.theme':             { he: 'ערכת צבע',     en: 'Theme',            es: 'Tema' },
  'fab.typography':        { he: 'גופן',          en: 'Typography',       es: 'Tipografía' },
  'fab.focus':             { he: 'מיקוד',         en: 'Focus',            es: 'Enfoque' },
  'fab.navigation':        { he: 'ניווט',         en: 'Navigation',       es: 'Navegación' },
  'fab.highlights':        { he: 'הדגשות',        en: 'Highlights',       es: 'Resaltados' },
  'fab.readAloud':         { he: 'הקראה',          en: 'Read aloud',       es: 'Leer en voz alta' },
  'fab.readAloudPause':    { he: 'השהה הקראה',     en: 'Pause reading',    es: 'Pausar lectura' },
  'chapter.scrollToTop':   { he: 'גלול למעלה',    en: 'Scroll to top',    es: 'Desplazar arriba' },

  // ── Display Settings Panel ──────────────────────────────────────────────────
  'display.settings':      { he: 'הגדרות תצוגה',  en: 'Display Settings', es: 'Configuración de pantalla' },
  'display.textSize':      { he: 'גודל טקסט',     en: 'Text Size',        es: 'Tamaño de texto' },
  'display.lineHeight':    { he: 'גובה שורה',      en: 'Line Height',      es: 'Interlineado' },
  'display.width':         { he: 'רוחב',           en: 'Width',            es: 'Ancho' },
  'display.widthNarrow':   { he: 'צר',             en: 'Narrow',           es: 'Estrecho' },
  'display.widthMedium':   { he: 'בינוני',         en: 'Medium',           es: 'Medio' },
  'display.widthWide':     { he: 'רחב',            en: 'Wide',             es: 'Amplio' },
  'display.font':          { he: 'גופן',           en: 'Font',             es: 'Fuente' },
  'display.fontModern':    { he: 'מודרני',          en: 'Modern',           es: 'Moderno' },
  'display.fontClean':     { he: 'נקי',             en: 'Clean',            es: 'Limpio' },
  'display.reset':         { he: 'איפוס',          en: 'Reset defaults',   es: 'Restablecer' },

  // ── Focus Mode ──────────────────────────────────────────────────────────────
  'focus.mode':            { he: 'מצב מרוכז',     en: 'Focus Mode',       es: 'Modo enfoque' },
  'focus.toExit':          { he: 'ליציאה',         en: 'to exit',          es: 'para salir' },

  // ── Navigation ──────────────────────────────────────────────────────────────
  'nav.chapterNavLabel':   { he: 'ניווט פרקים',    en: 'Chapter navigation', es: 'Navegación de capítulos' },
  'nav.chapterOf':         { he: 'פרק {{n}} מתוך {{total}}', en: 'Chapter {{n}} of {{total}}', es: 'Capítulo {{n}} de {{total}}' },
  'chapter.label':         { he: 'פרק',            en: 'Chapter',          es: 'Capítulo' },

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  'sidebar.openNavigation': { he: 'פתח ניווט',      en: 'Open navigation',  es: 'Abrir navegación' },
  'sidebar.chapters':      { he: 'פרקים',          en: 'Chapters',         es: 'Capítulos' },
  'sidebar.inChapter':     { he: 'בפרק זה',        en: 'In This Chapter',  es: 'En Este Capítulo' },
  'sidebar.toc':           { he: 'תוכן העניינים',  en: 'Table of Contents', es: 'Tabla de Contenidos' },
  'sidebar.tableOfContents': { he: 'תוכן העניינים',  en: 'Table of Contents', es: 'Tabla de Contenidos' },
  'sidebar.completed':     { he: 'הושלמו',          en: 'completed',        es: 'completados' },
  'sidebar.outline':       { he: 'מתוכן הפרק',     en: 'Chapter Outline',  es: 'Esquema del Capítulo' },
  'sidebar.noSections':    { he: 'לא נמצאו סעיפים', en: 'No sections found', es: 'No se encontraron secciones' },
  'sidebar.noSectionsFound': { he: 'לא נמצאו סעיפים', en: 'No sections found', es: 'No se encontraron secciones' },
  'sidebar.collapse':      { he: 'הסתר תפריט',       en: 'Collapse navigation', es: 'Ocultar navegación' },
  'sidebar.expand':        { he: 'הצג תפריט',        en: 'Show navigation',     es: 'Mostrar navegación' },

  // ── Reading status ──────────────────────────────────────────────────────────
  'reading.total':         { he: '{{n}} דקות קריאה', en: '{{n}} min read',   es: '{{n}} min de lectura' },
  'reading.remaining':     { he: '{{n}} דקות נותרו', en: '{{n}} min left',   es: '{{n}} min restantes' },
  'reading.completed':     { he: 'הקריאה הושלמה',   en: 'Completed',        es: 'Completado' },

  // ── Home page ───────────────────────────────────────────────────────────────
  'home.title':            { he: 'ספרים',          en: 'Books',            es: 'Libros' },
  'home.subtitle':         { he: 'התחקות של ידע מעמיק ויישום מעשי', en: 'Explorations of deep knowledge and practical application', es: 'Exploraciones de conocimiento profundo y aplicación práctica' },
  'home.bookAvailable':    { he: 'ספר זמין',       en: 'book available',   es: 'libro disponible' },
  'home.booksAvailable':   { he: 'ספרים זמינים',   en: 'books available',  es: 'libros disponibles' },
  'home.all':              { he: 'הכל',            en: 'All',              es: 'Todos' },
  'home.continueReading':  { he: 'המשך קריאה',     en: 'Continue Reading', es: 'Continuar leyendo' },
  'home.chapter':          { he: 'פרק',            en: 'Chapter',          es: 'Capítulo' },
  'home.chapterShort':     { he: 'פרק',            en: 'Ch.',              es: 'Cap.' },
  'home.continueShort':    { he: 'המשך',           en: 'Continue',         es: 'Continuar' },
  'home.noBooks':          { he: 'אין ספרים זמינים כרגע', en: 'No books available yet', es: 'No hay libros disponibles aún' },
  'home.noBooksHint':      { he: 'הוסף ספרים לתיקיית output/ כדי להתחיל', en: 'Add books to the output/ folder to get started', es: 'Agrega libros a la carpeta output/ para comenzar' },

  // ── Library (books) section ─────────────────────────────────────────────────
  'library.title':         { he: 'ספריה',           en: 'Library',          es: 'Biblioteca' },
  'library.subtitle':      { he: 'תוכן מקורי — ספרים מלאים', en: 'Original content — full books', es: 'Contenido original — libros completos' },
  'library.category.foundations': { he: 'יסודות',   en: 'Foundations',      es: 'Fundamentos' },
  'library.category.ai-systems':  { he: 'מערכות AI', en: 'AI Systems',      es: 'Sistemas de IA' },
  'library.category.ai-engineering': { he: 'הנדסת מערכות AI', en: 'AI Systems Engineering', es: 'Ingeniería de Sistemas de IA' },

  // Difficulty level — keys mirror BookLevel in src/types/index.ts.
  // Resolved by discoverBook() from book-manifest.json → _catalog.json
  // (book entry) → parent course. UI calls t('library.level.' + book.level).
  'library.level.foundations':   { he: 'יסודות',  en: 'Foundations',  es: 'Fundamentos' },
  'library.level.intermediate':  { he: 'ביניים',  en: 'Intermediate', es: 'Intermedio' },
  'library.level.advanced':      { he: 'מתקדם',   en: 'Advanced',     es: 'Avanzado' },

  // Book Overview — hero card CTAs and meta.
  'book.startLearning':    { he: 'התחל ללמוד',     en: 'Start learning',    es: 'Empezar a aprender' },
  'book.continueLearning': { he: 'המשך לימוד',     en: 'Continue learning', es: 'Continuar aprendiendo' },
  'book.minutesRead':      { he: '{{n}} דקות קריאה', en: '{{n}} min read',  es: '{{n}} min de lectura' },
  'book.availableIn':      { he: 'זמין ב',          en: 'Available in',     es: 'Disponible en' },
  'book.bookmark':         { he: 'סמן ספר',         en: 'Bookmark book',    es: 'Marcar libro' },
  'book.removeBookmark':   { he: 'הסר סימן',        en: 'Remove bookmark',  es: 'Quitar marcador' },

  // Book Overview — progress and summary sections.
  'bookOverview.bookSummary':       { he: 'תקציר',                            en: 'Summary',                                es: 'Resumen' },
  'bookOverview.readMore':          { he: 'קרא עוד',                          en: 'Read more',                              es: 'Leer más' },
  'bookOverview.showLess':          { he: 'הצג פחות',                         en: 'Show less',                              es: 'Mostrar menos' },
  'bookOverview.notStarted':        { he: 'טרם התחלת',                        en: 'Not started yet',                        es: 'Aún no empezado' },
  'bookOverview.chaptersCompleted': { he: '{{n}} מתוך {{total}} פרקים הושלמו', en: '{{n}} of {{total}} chapters completed', es: '{{n}} de {{total}} capítulos completados' },
  'bookOverview.currentChapter':    { he: 'הפרק הנוכחי',                       en: 'Current chapter',                        es: 'Capítulo actual' },
  'bookOverview.showAllChapters':   { he: 'הצג את כל הפרקים',                  en: 'Show all chapters',                       es: 'Mostrar todos los capítulos' },
  'bookOverview.showFewerChapters': { he: 'הצג פחות פרקים',                    en: 'Show fewer chapters',                     es: 'Mostrar menos capítulos' },
  'bookOverview.locked':            { he: 'פרק נעול',                           en: 'Chapter locked',                          es: 'Capítulo bloqueado' },
  'bookOverview.whatYouWillLearn':  { he: 'מה תלמדו',                            en: 'What you will learn',                     es: 'Lo que aprenderás' },
  'bookOverview.listenSummary':     { he: 'האזן לסיכום',                         en: 'Listen to summary',                       es: 'Escuchar resumen' },

  // ── Courses (learning) section ──────────────────────────────────────────────
  'courses.title':         { he: 'למידה מקורסים',    en: 'Learning from Courses', es: 'Aprendizaje de cursos' },
  'courses.subtitle':      { he: 'סיכומי שיעורים בתהליך', en: 'Lecture summaries in progress', es: 'Resúmenes de clases en curso' },
  'courses.inProgress':    { he: 'בתהליך',          en: 'In progress',      es: 'En curso' },
  'courses.available':     { he: '{{n}} מתוך {{total}} זמינים', en: '{{n}} of {{total}} available', es: '{{n}} de {{total}} disponibles' },
  'courses.continueLearning': { he: 'המשך למידה',   en: 'Continue Learning', es: 'Continuar aprendizaje' },
  'courses.startLearning': { he: 'התחל למידה',      en: 'Start Learning',   es: 'Comenzar aprendizaje' },
  'courses.lessonBadge':   { he: 'סיכום שיעור',     en: 'Lecture Summary',  es: 'Resumen de clase' },
  'courses.lessonNumber':  { he: 'שיעור {{n}}',     en: 'Lesson {{n}}',     es: 'Clase {{n}}' },
  'courses.lessons':       { he: 'שיעורים',         en: 'Lessons',          es: 'Clases' },
  'courses.lecturer':      { he: 'מרצה',            en: 'Lecturer',         es: 'Profesor' },
  'courses.summaryBy':     { he: 'סיכומים',          en: 'Summaries by',     es: 'Resúmenes por' },
  'courses.notAvailableYet': { he: 'טרם זמין',      en: 'Not available yet', es: 'Aún no disponible' },
  'courses.viewAllLessons': { he: 'לכל השיעורים',    en: 'View all lessons',  es: 'Ver todas las clases' },

  // ── Unified "all content" section — books + lessons grouped by category ────
  'all.title':             { he: 'כל הספרים',        en: 'All Content',       es: 'Todo el contenido' },
  'all.subtitle':          { he: 'ספרים וסיכומי שיעורים, ממוינים לפי קטגוריה', en: 'Books and lecture summaries, grouped by category', es: 'Libros y resúmenes, agrupados por categoría' },

  // ── Search ──────────────────────────────────────────────────────────────────
  'search.placeholderChapter': { he: 'חפש בפרק...', en: 'Search chapter...', es: 'Buscar en el capítulo...' },
  'search.placeholderBook': { he: 'חפש בספר...', en: 'Search book...', es: 'Buscar en el libro...' },
  'search.modeChapter':    { he: 'חיפוש בפרק',      en: 'Search chapter',    es: 'Buscar en capítulo' },
  'search.modeBook':       { he: 'חיפוש בספר',      en: 'Search book',       es: 'Buscar en libro' },
  'search.noResults':      { he: 'אין תוצאות',       en: 'No results',        es: 'Sin resultados' },
  'search.results':        { he: '{{n}} / {{total}}',    en: '{{n}} / {{total}}',  es: '{{n}} / {{total}}' },
  'search.chapterLabel':   { he: 'פרק {{n}}',        en: 'Chapter {{n}}',     es: 'Capítulo {{n}}' },
  'search.ariaPrev':       { he: 'תוצאה קודמת',      en: 'Previous result',   es: 'Resultado anterior' },
  'search.ariaNext':       { he: 'תוצאה הבאה',       en: 'Next result',       es: 'Resultado siguiente' },
  'search.ariaClose':      { he: 'סגור חיפוש',       en: 'Close search',      es: 'Cerrar búsqueda' },

  // ── ARIA Labels (accessibility) ─────────────────────────────────────────────
  'aria.highlights':       { he: 'ההדגשות שלי',     en: 'My highlights',     es: 'Mis resaltados' },
  'aria.bookmarks':        { he: 'סימניות',          en: 'Bookmarks',         es: 'Marcadores' },
  'aria.stats':            { he: 'סטטיסטיקות קריאה', en: 'Reading stats',     es: 'Estadísticas de lectura' },
  'aria.tts':              { he: 'האזן לפרק',        en: 'Listen to chapter', es: 'Escuchar capítulo' },

  // ── Book page ───────────────────────────────────────────────────────────────
  'book.chapterOne':       { he: 'פרק אחד',       en: '1 chapter',        es: '1 capítulo' },
  'book.chapters':         { he: '{{n}} פרקים',   en: '{{n}} chapters',   es: '{{n}} capítulos' },
  'book.words':            { he: '{{n}} מילים',   en: '{{n}} words',      es: '{{n}} palabras' },
  'book.sectionOne':       { he: 'סעיף אחד',      en: '1 section',        es: '1 sección' },
  'book.sections':         { he: '{{n}} סעיפים',  en: '{{n}} sections',   es: '{{n}} secciones' },
  'book.lecturer':         { he: 'מרצה',         en: 'Lecturer',         es: 'Instructor' },
  'book.editedBy':         { he: 'סיכום ועריכה', en: 'Summarized and edited by', es: 'Resumido y editado por' },
  'book.by':               { he: 'מאת:',          en: 'By:',              es: 'Por:' },

  // ── Header ─────────────────────────────────────────────────────────────────
  'header.skipToContent':  { he: 'דלג לתוכן',       en: 'Skip to content',  es: 'Saltar al contenido' },
  'header.searchPlaceholder': {
    he: 'חפש ספרים, קורסים, סדרות, מאמרים...',
    en: 'Search books, courses, series, articles...',
    es: 'Busca libros, cursos, series, artículos...',
  },
  'header.searchAriaLabel': {
    he: 'חיפוש במרחב הידע',
    en: 'Search the knowledge space',
    es: 'Buscar en el espacio de conocimiento',
  },
  'header.languageTooltip': {
    he: 'החלף שפה',
    en: 'Change language',
    es: 'Cambiar idioma',
  },
  'language.changeCurrent': {
    he: 'החלף שפה. כעת: {{lang}}',
    en: 'Change language. Current: {{lang}}',
    es: 'Cambiar idioma. Actual: {{lang}}',
  },
  'language.onlyOne': {
    he: 'רק שפה אחת זמינה: {{lang}}',
    en: 'Only one language available: {{lang}}',
    es: 'Solo un idioma disponible: {{lang}}',
  },
  'language.chooseDialog': {
    he: 'בחר שפה',
    en: 'Choose language',
    es: 'Elegir idioma',
  },
  'language.availableList': {
    he: 'שפות זמינות',
    en: 'Available languages',
    es: 'Idiomas disponibles',
  },
  // ── Breadcrumbs ─────────────────────────────────────────────────────────────
  'breadcrumb.books':      { he: 'ספרים',          en: 'Books',            es: 'Libros' },

  // ── Text-to-Speech ──────────────────────────────────────────────────────────
  'tts.label':             { he: 'האזן לפרק',      en: 'Listen to chapter', es: 'Escuchar capítulo' },
  'tts.play':              { he: 'נגן',             en: 'Play',             es: 'Reproducir' },
  'tts.pause':             { he: 'השהה',            en: 'Pause',            es: 'Pausar' },
  'tts.stop':              { he: 'עצור',            en: 'Stop',             es: 'Detener' },
  'tts.speed':             { he: 'מהירות',          en: 'Speed',            es: 'Velocidad' },
  'tts.voice':             { he: 'קול',             en: 'Voice',            es: 'Voz' },
  'tts.notSupported':      { he: 'הדפדפן שלך לא תומך בקריאה בקול', en: "Your browser doesn't support text-to-speech", es: 'Tu navegador no soporta lectura en voz alta' },
  'tts.clickToRead':       { he: 'לחץ לקריאה מכאן', en: 'Click to read from here', es: 'Clic para leer desde aquí' },
  'tts.resume':            { he: 'המשך מהמיקום האחרון', en: 'Resume from last position', es: 'Reanudar desde la última posición' },
  'tts.panelTitle':        { he: 'הקראה',           en: 'Read aloud',       es: 'Lectura en voz alta' },
  'tts.slow':              { he: 'איטי',             en: 'Slow',             es: 'Lento' },
  'tts.normal':            { he: 'רגיל',             en: 'Normal',           es: 'Normal' },
  'tts.fast':              { he: 'מהיר',             en: 'Fast',             es: 'Rápido' },
  'tts.fromSelection':     { he: 'התחל מהטקסט שנבחר', en: 'Start from selected text', es: 'Empezar desde la selección' },
  'tts.fromTop':           { he: 'התחל מההתחלה',    en: 'Start from top',   es: 'Empezar desde arriba' },
  'tts.preview':           { he: 'האזן לדוגמה',     en: 'Preview voice',    es: 'Vista previa' },
  'tts.progress':          { he: 'התקדמות הקראה',   en: 'Reading progress', es: 'Progreso de lectura' },
  'tts.close':             { he: 'סגור',             en: 'Close',            es: 'Cerrar' },
  'tts.noVoices':          { he: 'לא נמצאו קולות',   en: 'No voices found',  es: 'No se encontraron voces' },
  'tts.miniPlayer':        { he: 'נגן הקראה',        en: 'Read-aloud player', es: 'Reproductor de lectura' },
  'tts.previous':          { he: 'משפט קודם',        en: 'Previous sentence', es: 'Oración anterior' },
  'tts.next':              { he: 'משפט הבא',         en: 'Next sentence',    es: 'Siguiente oración' },
  'tts.expand':            { he: 'פתח הגדרות',       en: 'Open settings',    es: 'Abrir ajustes' },
  'tts.rateCycle':         { he: 'שנה מהירות',       en: 'Change speed',     es: 'Cambiar velocidad' },
  'tts.seek':              { he: 'קפוץ לנקודה',      en: 'Seek',             es: 'Buscar' },
  'tts.listenToDescription': { he: 'האזן לתיאור',    en: 'Listen to description', es: 'Escuchar descripción' },

  // ── Bookmarks ───────────────────────────────────────────────────────────────
  'bookmarks.title':       { he: 'סימניות',        en: 'Bookmarks',        es: 'Marcadores' },
  'bookmarks.empty':       { he: 'אין סימניות עדיין', en: 'No bookmarks yet', es: 'Aún no hay marcadores' },
  'bookmarks.emptyHint':   { he: 'לחץ לחיצה כפולה על פסקה (או לחיצה ארוכה במובייל) כדי להוסיף סימנייה', en: 'Double-click a paragraph (or long-press on mobile) to bookmark it', es: 'Doble clic en un párrafo (o pulsación larga en móvil) para marcar' },
  'bookmarks.close':       { he: 'סגור',           en: 'Close',            es: 'Cerrar' },
  'bookmarks.add':         { he: '🔖 הוסף סימנייה', en: '🔖 Add bookmark',  es: '🔖 Añadir marcador' },
  'bookmarks.remove':      { he: 'הסר סימנייה',    en: 'Remove bookmark',  es: 'Quitar marcador' },
  'bookmarks.saved':       { he: 'סימנייה נשמרה',  en: 'Bookmark saved',   es: 'Marcador guardado' },
  'bookmarks.addPrompt':   { he: 'להוסיף סימנייה כאן?', en: 'Add a bookmark here?', es: '¿Añadir marcador aquí?' },
  'bookmarks.removePrompt':{ he: 'להסיר את הסימנייה?', en: 'Remove this bookmark?', es: '¿Quitar este marcador?' },
  'bookmarks.cancel':      { he: 'ביטול',          en: 'Cancel',           es: 'Cancelar' },
  'bookmarks.chapter':     { he: 'פרק {{n}}',      en: 'Chapter {{n}}',    es: 'Capítulo {{n}}' },
  'bookmarks.chapterLabel': { he: 'פרק {{n}}',     en: 'Chapter {{n}}',    es: 'Capítulo {{n}}' },
  'bookmarks.chapterUnknown': { he: 'פרק לא מזוהה', en: 'Unknown chapter', es: 'Capítulo desconocido' },
  'bookmarks.approximate': { he: 'ניווט למיקום הקרוב ביותר', en: 'Jumped to the closest location', es: 'Saltó al lugar más cercano' },
  'bookmarks.step1':       { he: 'לחץ לחיצה ימנית על פסקה', en: 'Right-click any paragraph', es: 'Clic derecho en cualquier párrafo' },
  'bookmarks.step2':       { he: 'בחר "הוסף סימנייה"', en: 'Choose "Add bookmark"', es: 'Elige "Añadir marcador"' },
  'bookmarks.step3':       { he: 'לחץ על הסימנייה לקפיצה אליה', en: 'Click bookmark to jump there', es: 'Clic en el marcador para saltar' },

  // ── Bookmark "add" dialog (premium variant) ─────────────────────────────────
  'reading.bookmarkDialog.title':       { he: 'הוסף סימניה?',                                              en: 'Add bookmark?',                                                  es: '¿Añadir marcador?' },
  'reading.bookmarkDialog.description': { he: 'שמור את המיקום הנוכחי כדי לחזור אליו במהירות בהמשך', en: 'Save your current position so you can return to it quickly later.', es: 'Guarda tu posición actual para volver rápidamente más tarde.' },
  'reading.bookmarkDialog.confirm':     { he: 'הוסף סימניה',                                               en: 'Add bookmark',                                                   es: 'Añadir marcador' },
  'reading.bookmarkDialog.cancel':      { he: 'ביטול',                                                     en: 'Cancel',                                                         es: 'Cancelar' },

  // ── Onboarding Tour ─────────────────────────────────────────────────────────
  'onboarding.next':       { he: 'הבא ←',          en: 'Next →',           es: 'Siguiente →' },
  'onboarding.skip':       { he: 'דלג',            en: 'Skip',             es: 'Omitir' },
  'onboarding.done':       { he: 'סיום! 🎉',       en: 'Done! 🎉',         es: '¡Listo! 🎉' },
  'onboarding.of':         { he: 'מתוך',           en: 'of',               es: 'de' },
  'onboarding.step1.title': { he: 'ברוכים הבאים! 👋', en: 'Welcome! 👋',   es: '¡Bienvenido! 👋' },
  'onboarding.step1.body': { he: 'זוהי פלטפורמת הקריאה של Yuval. נסייר יחד בתכונות העיקריות.', en: "This is Yuval's reading platform. Let's take a quick tour of the key features.", es: 'Esta es la plataforma de lectura Yuval. Hagamos un recorrido rápido por las funciones principales.' },
  'onboarding.step2.title': { he: 'תוכן עניינים 📋', en: 'Table of Contents 📋', es: 'Tabla de Contenidos 📋' },
  'onboarding.step2.body': { he: 'ניווט מהיר בין פרקים. לחץ על כל פרק לניווט מיידי.', en: 'Navigate between chapters instantly. Click any chapter to jump there.', es: 'Navega entre capítulos al instante. Haz clic en cualquier capítulo para ir allí.' },
  'onboarding.step3.title': { he: 'בקרי תצוגה ⚙️', en: 'Display Controls ⚙️', es: 'Controles de Pantalla ⚙️' },
  'onboarding.step3.body': { he: 'שנה גודל טקסט, גופן, רוחב, וערכת צבע. הכל נשמר אוטומטית.', en: 'Change font size, typeface, width, and color theme. All saved automatically.', es: 'Cambia el tamaño de fuente, tipografía, ancho y tema de color. Todo se guarda automáticamente.' },
  'onboarding.step4.title': { he: 'סמן טקסט 💡',  en: 'Highlight Text 💡', es: 'Resaltar Texto 💡' },
  'onboarding.step4.body': { he: 'בחר כל טקסט בדף כדי להדגיש אותו. 4 צבעים לארגון: תובנות, שאלות, פעולות, ציטוטים.', en: 'Select any text on the page to highlight it. 4 colors to organize: insights, questions, actions, quotes.', es: 'Selecciona cualquier texto para resaltarlo. 4 colores para organizar: ideas, preguntas, acciones, citas.' },
  'onboarding.step5.title': { he: 'יעד קריאה יומי 🎯', en: 'Daily Reading Goal 🎯', es: 'Meta de Lectura Diaria 🎯' },
  'onboarding.step5.body': { he: 'הגדר יעד יומי ועקב אחרי הרצף שלך. לחץ על הכפתור להגדרה.', en: 'Set a daily reading goal and track your streak. Click the button to configure.', es: 'Establece una meta diaria y sigue tu racha. Haz clic en el botón para configurar.' },
  'onboard.skip':          { he: 'דלג',            en: 'Skip',             es: 'Omitir' },
  'onboard.next':          { he: 'הבא ←',          en: 'Next →',           es: 'Siguiente →' },
  'onboard.done':          { he: 'סיום! 🎉',       en: 'Done! 🎉',         es: '¡Listo! 🎉' },
  'onboard.welcome.title': { he: 'ברוכים הבאים! 👋', en: 'Welcome! 👋',   es: '¡Bienvenido! 👋' },
  'onboard.welcome.body':  { he: 'זוהי פלטפורמת הקריאה של Yuval. נסייר יחד בתכונות העיקריות.', en: "This is Yuval's reading platform. Let's take a quick tour of the key features.", es: 'Esta es la plataforma de lectura Yuval. Hagamos un recorrido rápido por las funciones principales.' },
  'onboard.toc.title':     { he: 'תוכן עניינים 📋', en: 'Table of Contents 📋', es: 'Tabla de Contenidos 📋' },
  'onboard.toc.body':      { he: 'ניווט מהיר בין פרקים. לחץ על כל פרק לניווט מיידי.', en: 'Navigate between chapters instantly. Click any chapter to jump there.', es: 'Navega entre capítulos al instante. Haz clic en cualquier capítulo para ir allí.' },
  'onboard.display.title': { he: 'בקרי תצוגה ⚙️', en: 'Display Controls ⚙️', es: 'Controles de Pantalla ⚙️' },
  'onboard.display.body':  { he: 'שנה גודל טקסט, גופן, רוחב, וערכת צבע. הכל נשמר אוטומטית.', en: 'Change font size, typeface, width, and color theme. All saved automatically.', es: 'Cambia el tamaño de fuente, tipografía, ancho y tema de color. Todo se guarda automáticamente.' },
  'onboard.highlight.title': { he: 'סמן טקסט 💡', en: 'Highlight Text 💡', es: 'Resaltar Texto 💡' },
  'onboard.highlight.body': { he: 'בחר כל טקסט בדף כדי להדגיש אותו. 4 צבעים לארגון: תובנות, שאלות, פעולות, ציטוטים.', en: 'Select any text on the page to highlight it. 4 colors to organize: insights, questions, actions, quotes.', es: 'Selecciona cualquier texto para resaltarlo. 4 colores para organizar: ideas, preguntas, acciones, citas.' },
  'onboard.goal.title':    { he: 'יעד קריאה יומי 🎯', en: 'Daily Reading Goal 🎯', es: 'Meta de lectura diaria 🎯' },
  'onboard.goal.body':     { he: 'הגדר יעד יומי ועקב אחרי הרצף שלך. לחץ על הכפתור להגדרה.', en: 'Set a daily reading goal and track your streak. Click the button to configure.', es: 'Establece una meta diaria y sigue tu racha. Haz clic en el botón para configurar.' },

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────────
  'kbd.title':             { he: '⌨️ קיצורי מקלדת', en: '⌨️ Keyboard Shortcuts', es: '⌨️ Atajos de Teclado' },
  'kbd.chapterNav':        { he: 'פרק קודם / הבא',  en: 'Prev / next chapter', es: 'Cap. anterior / siguiente' },
  'kbd.focus':             { he: 'מצב מיקוד',       en: 'Focus / immersive mode', es: 'Modo enfoque' },
  'kbd.zen':               { he: 'מצב Zen',         en: 'Zen reading mode', es: 'Modo Zen' },
  'kbd.search':            { he: 'חיפוש',           en: 'Search',           es: 'Búsqueda' },
  'kbd.highlights':        { he: 'פאנל הדגשות',     en: 'Highlights panel', es: 'Panel de resaltados' },
  'kbd.bookmarks':         { he: 'סימניות',         en: 'Bookmarks',        es: 'Marcadores' },
  'kbd.stats':             { he: 'סטטיסטיקות קריאה', en: 'Reading stats',   es: 'Estadísticas de lectura' },
  'kbd.replay':            { he: 'חזרה על הדגשות',  en: 'Highlight replay', es: 'Repetición de resaltados' },
  'kbd.shortcuts':         { he: 'קיצורי מקלדת',   en: 'Keyboard shortcuts', es: 'Atajos de teclado' },
  'kbd.exit':              { he: 'סגור / יציאה ממצב', en: 'Close / exit mode', es: 'Cerrar / salir del modo' },

  // ── Highlights Panel ────────────────────────────────────────────────────────
  'highlights.title':      { he: 'ההדגשות שלי',    en: 'My Highlights',    es: 'Mis resaltados' },
  'highlights.empty':      { he: 'אין הדגשות עדיין', en: 'No highlights yet', es: 'Aún no hay resaltados' },
  'highlights.emptyHint':  { he: 'סמן טקסט בזמן קריאה כדי לשמור תובנות', en: 'Select text while reading to save insights', es: 'Selecciona texto mientras lees para guardar ideas' },
  'highlights.close':      { he: 'סגור',           en: 'Close',            es: 'Cerrar' },
  'highlights.chapter':    { he: 'פרק {{n}}',      en: 'Chapter {{n}}',    es: 'Capítulo {{n}}' },
  'highlights.chapterLabel': { he: 'פרק {{n}}',    en: 'Chapter {{n}}',    es: 'Capítulo {{n}}' },
  'highlights.exportMarkdown': { he: 'Markdown',   en: 'Markdown',         es: 'Markdown' },
  'highlights.exportPdf':  { he: 'PDF',            en: 'PDF',              es: 'PDF' },
  'highlights.addNote':    { he: 'הוסף הערה...',   en: 'Add a note...',    es: 'Añadir nota...' },
  'highlights.notePlaceholder': { he: 'כתוב הערה על ההדגשה הזו...', en: 'Write a note about this highlight...', es: 'Escribe una nota sobre este resaltado...' },
  'highlights.color.yellow': { he: 'תובנה',        en: 'Insight',          es: 'Idea' },
  'highlights.color.blue': { he: 'שאלה',           en: 'Question',         es: 'Pregunta' },
  'highlights.color.green': { he: 'פעולה',         en: 'Action',           es: 'Acción' },
  'highlights.color.pink': { he: 'ציטוט',          en: 'Quote',            es: 'Cita' },

  // ── Highlight (singular — in-content highlight UI: toolbar, hover popup,
  //    inline note editor, quote-card share, mobile color picker, replay) ──
  'highlight.title':            { he: 'הדגשה',                  en: 'Highlight',                    es: 'Resaltado' },
  'highlight.empty':            { he: 'אין הדגשות עדיין',        en: 'No highlights yet',            es: 'Aún no hay resaltados' },
  'highlight.count':            { he: '{{n}} הדגשות',           en: '{{n}} highlights',             es: '{{n}} resaltados' },
  'highlight.toolbar':          { he: 'סרגל הדגשה',              en: 'Highlight toolbar',            es: 'Barra de resaltado' },
  'highlight.chapter':          { he: 'פרק {{n}}',              en: 'Chapter {{n}}',                es: 'Capítulo {{n}}' },
  'highlight.note.add':         { he: 'הוסף הערה',               en: 'Add note',                     es: 'Añadir nota' },
  'highlight.note.placeholder': { he: 'כתוב הערה...',            en: 'Write a note...',              es: 'Escribe una nota...' },
  'highlight.note.hint':        { he: 'Enter לשמירה, Esc לביטול', en: 'Enter to save, Esc to cancel', es: 'Enter para guardar, Esc para cancelar' },
  'highlight.quoteCard':        { he: 'כרטיס ציטוט',             en: 'Quote card',                   es: 'Tarjeta de cita' },
  'highlight.remove':           { he: 'הסר הדגשה',               en: 'Remove highlight',             es: 'Quitar resaltado' },
  'highlight.download':         { he: 'הורדה',                  en: 'Download',                     es: 'Descargar' },
  'highlight.shareImage':       { he: 'שתף כתמונה',              en: 'Share as image',               es: 'Compartir como imagen' },
  'highlight.yellow':           { he: 'תובנה',                  en: 'Insight',                      es: 'Idea' },
  'highlight.blue':             { he: 'שאלה',                   en: 'Question',                     es: 'Pregunta' },
  'highlight.green':            { he: 'פעולה',                  en: 'Action',                       es: 'Acción' },
  'highlight.pink':             { he: 'ציטוט',                  en: 'Quote',                        es: 'Cita' },
  'highlight.mobile.title':     { he: 'בחר צבע',                 en: 'Pick a color',                 es: 'Elige un color' },

  // ── Common (shared atoms used by multiple features) ─────────────────────────
  'common.close':               { he: 'סגור',                   en: 'Close',                        es: 'Cerrar' },
  'common.copy':                { he: 'העתק',                   en: 'Copy',                         es: 'Copiar' },
  'common.copied':              { he: 'הועתק',                  en: 'Copied',                       es: 'Copiado' },
  'common.cancel':              { he: 'ביטול',                  en: 'Cancel',                       es: 'Cancelar' },
  'common.generating':          { he: 'מייצר...',                en: 'Generating...',                es: 'Generando...' },

  // ── Keyboard navigation (toast feedback + shortcuts panel) ─────────────────
  'keyboard.chapterNav':        { he: 'פרק {{n}}',                en: 'Chapter {{n}}',                es: 'Capítulo {{n}}' },
  'keyboard.focusOn':           { he: 'מצב מיקוד פעיל',           en: 'Focus mode on',                es: 'Modo enfoque activado' },
  'keyboard.focusOff':          { he: 'מצב מיקוד כבוי',           en: 'Focus mode off',               es: 'Modo enfoque desactivado' },
  'keyboard.zenOn':             { he: 'מצב Zen פעיל',            en: 'Zen mode on',                  es: 'Modo Zen activado' },
  'keyboard.zenOff':            { he: 'מצב Zen כבוי',            en: 'Zen mode off',                 es: 'Modo Zen desactivado' },
  'keyboard.highlights':        { he: 'פאנל הדגשות',              en: 'Highlights panel',             es: 'Panel de resaltados' },
  'keyboard.stats':             { he: 'סטטיסטיקות קריאה',         en: 'Reading stats',                es: 'Estadísticas de lectura' },
  'keyboard.bookmarks':         { he: 'סימניות',                  en: 'Bookmarks',                    es: 'Marcadores' },
  'keyboard.normalMode':        { he: 'חזרה למצב רגיל',           en: 'Back to normal mode',          es: 'Volver al modo normal' },
  'keyboard.shortcutsTitle':    { he: '⌨️ קיצורי מקלדת',          en: '⌨️ Keyboard shortcuts',        es: '⌨️ Atajos de teclado' },
  'keyboard.shortcut.nav':      { he: 'פרק קודם / הבא',           en: 'Prev / next chapter',          es: 'Cap. anterior / siguiente' },
  'keyboard.shortcut.focus':    { he: 'מצב מיקוד',                en: 'Focus mode',                   es: 'Modo enfoque' },
  'keyboard.shortcut.zen':      { he: 'מצב Zen',                  en: 'Zen mode',                     es: 'Modo Zen' },
  'keyboard.shortcut.search':   { he: 'חיפוש',                    en: 'Search',                       es: 'Búsqueda' },
  'keyboard.shortcut.highlights': { he: 'פאנל הדגשות',            en: 'Highlights panel',             es: 'Panel de resaltados' },
  'keyboard.shortcut.bookmarks':{ he: 'סימניות',                  en: 'Bookmarks',                    es: 'Marcadores' },
  'keyboard.shortcut.stats':    { he: 'סטטיסטיקות קריאה',         en: 'Reading stats',                es: 'Estadísticas de lectura' },
  'keyboard.shortcut.replay':   { he: 'חזרה על הדגשות',           en: 'Highlight replay',             es: 'Repetición de resaltados' },
  'keyboard.shortcut.help':     { he: 'עזרה',                     en: 'Help',                         es: 'Ayuda' },
  'keyboard.shortcut.escape':   { he: 'סגור / יציאה',             en: 'Close / exit',                 es: 'Cerrar / salir' },

  // ── Reading hints (onboarding strip + keyboard hint bar) ───────────────────
  'hints.onboardTitle':         { he: 'בחר טקסט כדי להדגיש',      en: 'Select text to highlight',     es: 'Selecciona texto para resaltar' },
  'hints.onboardSub':           { he: '4 צבעים לארגון תובנות',     en: '4 colors to organize ideas',   es: '4 colores para organizar ideas' },
  'hints.chapters':             { he: 'פרקים',                    en: 'chapters',                     es: 'capítulos' },
  'hints.focus':                { he: 'מיקוד',                    en: 'focus',                        es: 'enfoque' },
  'hints.highlight':            { he: 'בחר טקסט להדגשה',          en: 'select text to highlight',     es: 'selecciona texto para resaltar' },

  // ── Reading Goals ───────────────────────────────────────────────────────────
  'goal.title':            { he: 'יעד קריאה יומי', en: 'Daily Reading Goal', es: 'Meta de lectura diaria' },
  'goal.streak':           { he: '🔥 {{n}} ימים',  en: '🔥 {{n}} days',    es: '🔥 {{n}} días' },
  'goal.reached':          { he: '✅ השגת את היעד היום!', en: '✅ Goal reached today!', es: '✅ ¡Meta alcanzada hoy!' },
  'goal.minutesLeft':      { he: '{{n}} דקות נותרו', en: '{{n}} min left',  es: '{{n}} min restantes' },
  'goal.save':             { he: 'שמור',            en: 'Save',             es: 'Guardar' },
  'goal.cancel':           { he: 'ביטול',           en: 'Cancel',           es: 'Cancelar' },

  // ── Reading Stats ───────────────────────────────────────────────────────────
  'stats.title':           { he: 'סטטיסטיקות קריאה', en: 'Reading Stats',  es: 'Estadísticas' },
  'stats.of':              { he: 'מתוך',            en: 'of',              es: 'de' },
  'stats.chapters':        { he: 'פרקים שהושלמו',   en: 'Chapters completed', es: 'Capítulos completados' },
  'stats.words':           { he: 'מילים נקראו',     en: 'Words read',      es: 'Palabras leídas' },
  'stats.chaptersRead':    { he: 'פרקים שהושלמו',  en: 'Chapters completed', es: 'Capítulos leídos' },
  'stats.wordsRead':       { he: 'מילים נקראו',     en: 'Words read',       es: 'Palabras leídas' },
  'stats.highlights':      { he: 'הדגשות שמורות',  en: 'Saved highlights', es: 'Resaltados guardados' },
  'stats.streak':          { he: 'רצף קריאה',       en: 'Reading streak',   es: 'Racha de lectura' },
  'stats.streakDays':      { he: '{{n}} ימים',      en: '{{n}} days',       es: '{{n}} días' },
  'stats.close':           { he: 'סגור',            en: 'Close',            es: 'Cerrar' },

  // ── Chapter / Book Completion ───────────────────────────────────────────────
  'completion.chapterComplete': { he: 'פרק {{n}} הושלם ✓', en: 'Chapter {{n}} complete ✓', es: 'Capítulo {{n}} completado ✓' },
  'completion.highlightsTitle': { he: 'ההדגשות שלך בפרק זה', en: 'Your highlights from this chapter', es: 'Tus resaltados de este capítulo' },
  'completion.noHighlights': { he: 'לא סימנת שום דבר בפרק זה', en: "You didn't highlight anything in this chapter", es: 'No resaltaste nada en este capítulo' },
  'completion.next':       { he: 'לפרק הבא',      en: 'Next chapter',     es: 'Siguiente capítulo' },
  'completion.title':      { he: '🎉 סיימת את הספר!', en: '🎉 You finished the book!', es: '🎉 ¡Terminaste el libro!' },
  'completion.subtitle':   { he: 'קוראים כמוך הופכים סופרים למורים.', en: 'Readers like you turn authors into teachers.', es: 'Lectores como tú convierten a los autores en maestros.' },
  'completion.chapters':   { he: 'פרקים',         en: 'chapters',         es: 'capítulos' },
  'completion.words':      { he: 'מילים',         en: 'words',            es: 'palabras' },
  'completion.highlights': { he: 'הדגשות',        en: 'highlights',       es: 'resaltados' },
  'completion.streak':     { he: 'ימי רצף',        en: 'day streak',       es: 'días de racha' },
  'completion.share':      { he: 'שתף הישג',      en: 'Share achievement', es: 'Compartir logro' },
  'completion.library':    { he: 'חזרה לספרייה',   en: 'Back to library',   es: 'Volver a la biblioteca' },

  // ── General / Shared ────────────────────────────────────────────────────────
  'general.close':         { he: 'סגור',            en: 'Close',            es: 'Cerrar' },
  'general.of':            { he: 'מתוך',            en: 'of',               es: 'de' },
  'general.retry':         { he: 'נסה שוב',         en: 'Try again',        es: 'Reintentar' },
  'general.back':          { he: 'חזרה',            en: 'Back',             es: 'Volver' },
  'general.home':          { he: 'חזרה לדף הבית',   en: 'Back to Home',     es: 'Volver al inicio' },

  // ── Error pages ─────────────────────────────────────────────────────────────
  'error.404.title':       { he: 'הדף לא נמצא',     en: 'Page not found',   es: 'Página no encontrada' },
  'error.404.code':        { he: '404',             en: '404',              es: '404' },
  'error.404.body':        { he: 'הדף שחיפשת לא קיים או הועבר למקום אחר. אולי הגעת לקישור ישן?', en: "The page you're looking for doesn't exist or has been moved. Perhaps you followed an old link?", es: 'La página que buscas no existe o ha sido movida. ¿Quizás seguiste un enlace antiguo?' },
  'error.404.suggest':     { he: 'נסה לחזור לספרייה ולבחור ספר', en: 'Try returning to the library and picking a book', es: 'Prueba a volver a la biblioteca y elegir un libro' },

  'error.500.title':       { he: 'משהו השתבש',      en: 'Something went wrong', es: 'Algo salió mal' },
  'error.500.body':        { he: 'נתקלנו בשגיאה בלתי צפויה. נסה לרענן את הדף.', en: 'We hit an unexpected error. Try refreshing the page.', es: 'Encontramos un error inesperado. Intenta recargar la página.' },

  'error.offline.title':   { he: 'אין חיבור לאינטרנט', en: "You're offline",  es: 'Estás sin conexión' },
  'error.offline.body':    { he: 'בדוק את החיבור שלך ונסה שוב.', en: 'Check your connection and try again.', es: 'Revisa tu conexión e inténtalo de nuevo.' },

  'error.bookNotFound.title': { he: 'הספר לא נמצא', en: 'Book not found',   es: 'Libro no encontrado' },
  'error.bookNotFound.body': { he: 'הספר שביקשת לא זמין בשפה זו או שהוסר.', en: 'The book you requested is not available in this language or has been removed.', es: 'El libro que solicitaste no está disponible en este idioma o ha sido eliminado.' },

  'error.chapterNotFound.title': { he: 'הפרק לא נמצא', en: 'Chapter not found', es: 'Capítulo no encontrado' },
  'error.chapterNotFound.body': { he: 'הפרק הזה לא קיים בספר. אולי נמחק או שהקישור שגוי.', en: "This chapter doesn't exist in the book. It may have been removed, or the link is wrong.", es: 'Este capítulo no existe en el libro. Puede haber sido eliminado o el enlace es incorrecto.' },

  // ── Empty states ────────────────────────────────────────────────────────────
  'empty.bookmarks.title': { he: 'עוד אין סימניות', en: 'No bookmarks yet', es: 'Aún no hay marcadores' },
  'empty.bookmarks.body':  { he: 'סימן מקומות חשובים בספר כדי לחזור אליהם בקלות.', en: 'Mark meaningful places in the book so you can return to them easily.', es: 'Marca lugares importantes del libro para volver a ellos fácilmente.' },
  'empty.bookmarks.cta':   { he: 'לחיצה כפולה על פסקה להוספת סימנייה', en: 'Double-click a paragraph to bookmark it', es: 'Doble clic en un párrafo para marcarlo' },

  'empty.highlights.title': { he: 'עדיין אין הדגשות', en: 'No highlights yet', es: 'Aún no hay resaltados' },
  'empty.highlights.body': { he: 'הדגש טקסט בזמן קריאה כדי לשמור תובנות, שאלות, ציטוטים ופעולות.', en: 'Highlight text as you read to save insights, questions, quotes and actions.', es: 'Resalta texto mientras lees para guardar ideas, preguntas, citas y acciones.' },
  'empty.highlights.cta':  { he: 'בחר טקסט בדף ובחר צבע', en: 'Select text on the page and pick a color', es: 'Selecciona texto en la página y elige un color' },

  'empty.search.title':    { he: 'אין תוצאות',       en: 'No results',       es: 'Sin resultados' },
  'empty.search.body':     { he: 'לא מצאנו התאמות ל"{{q}}". נסה מילות חיפוש אחרות.', en: 'We couldn\'t find matches for "{{q}}". Try different keywords.', es: 'No encontramos coincidencias para "{{q}}". Prueba otras palabras.' },
  'empty.search.cta':      { he: 'חפש בספר כולו',    en: 'Search the whole book', es: 'Buscar en todo el libro' },

  'empty.library.title':   { he: 'הספרייה ריקה',     en: 'Library is empty', es: 'La biblioteca está vacía' },
  'empty.library.body':    { he: 'עוד לא נוספו ספרים. הוסף קובצי MD לתיקיית output/ כדי להתחיל.', en: 'No books added yet. Drop MD files into the output/ folder to get started.', es: 'Aún no se han añadido libros. Coloca archivos MD en la carpeta output/ para empezar.' },

  // ── Left Sidebar (reading-tools activity bar) ──────────────────────────────
  'leftSidebar.dailyGoal':  { he: 'יעד יומי',           en: 'Daily goal',           es: 'Meta diaria' },
  'leftSidebar.tts':        { he: 'הקראה',              en: 'Listen',               es: 'Escuchar' },
  'leftSidebar.statistics': { he: 'סטטיסטיקות קריאה',   en: 'Reading statistics',   es: 'Estadísticas de lectura' },
  'leftSidebar.bookmarks':  { he: 'סימניות',            en: 'Bookmarks',            es: 'Marcadores' },
  'leftSidebar.highlights': { he: 'ההדגשות שלי',        en: 'My highlights',        es: 'Mis resaltados' },
  'leftSidebar.collapse':   { he: 'הסתר סרגל כלים',     en: 'Collapse tools',       es: 'Ocultar herramientas' },
  'leftSidebar.expand':     { he: 'הצג סרגל כלים',      en: 'Show tools',           es: 'Mostrar herramientas' },

  // ── Reading Left Dock (premium vertical floating dock) ────────────────────
  'reading.leftDock.progress':   { he: 'התקדמות',   en: 'Progress',   es: 'Progreso' },
  'reading.leftDock.collapse':   { he: 'כווץ',      en: 'Collapse',   es: 'Contraer' },
  'reading.restorePanels':       { he: 'החזר תפריטים', en: 'Restore panels', es: 'Restaurar paneles' },

  // ── Reading Tools (six-action toolbar in the left dock) ───────────────────
  'readingTools.dailyGoal':     { he: 'יעד יומי',           en: 'Daily goal',         es: 'Objetivo diario' },
  'readingTools.audioReading':  { he: 'הקראה בקול רם',     en: 'Read aloud',         es: 'Lectura en voz alta' },
  'readingTools.readingStats':  { he: 'סטטיסטיקות קריאה',  en: 'Reading statistics', es: 'Estadísticas de lectura' },
  'readingTools.bookmarks':     { he: 'סימניות',            en: 'Bookmarks',          es: 'Marcadores' },
  'readingTools.highlights':    { he: 'ההדגשות שלי',        en: 'My highlights',      es: 'Mis resaltados' },
  'readingTools.search':        { he: 'חיפוש בפרק',         en: 'Search in chapter',  es: 'Buscar en el capítulo' },
  'readingTools.progress':      { he: 'התקדמות קריאה',      en: 'Reading progress',   es: 'Progreso de lectura' },

  // ── Image Lightbox ──────────────────────────────────────────────────────────
  'lightbox.close':        { he: 'סגור',              en: 'Close',            es: 'Cerrar' },
  'lightbox.prev':         { he: 'תמונה קודמת',       en: 'Previous image',   es: 'Imagen anterior' },
  'lightbox.next':         { he: 'תמונה הבאה',        en: 'Next image',       es: 'Imagen siguiente' },
  'lightbox.zoomHint':     { he: 'לחץ על תמונה להגדלה', en: 'Click any image to enlarge', es: 'Haz clic en una imagen para ampliar' },

  // ── Resume-from-here banner ────────────────────────────────────────────────
  'resume.welcomeBack':         { he: 'ברוך שובך!',  en: 'Welcome back!',   es: '¡Bienvenido de vuelta!' },
  'resume.dismiss':             { he: 'סגור',         en: 'Dismiss',         es: 'Cerrar' },
  'resume.bannerBody':          { he: "עצרת {{timeAgo}} בסעיף '{{section}}', {{position}}", en: "You stopped {{timeAgo}} in '{{section}}', {{position}}", es: "Te detuviste {{timeAgo}} en '{{section}}', {{position}}" },
  'resume.bannerBodyNoSection': { he: 'עצרת {{timeAgo}}, {{position}}',                     en: 'You stopped {{timeAgo}}, {{position}}',                     es: 'Te detuviste {{timeAgo}}, {{position}}' },
  'resume.position.start':      { he: 'בהתחלה',       en: 'near the start',  es: 'cerca del inicio' },
  'resume.position.middle':     { he: 'בערך באמצע',   en: 'about midway',    es: 'aproximadamente a la mitad' },
  'resume.position.end':        { he: 'כמעט בסוף',    en: 'near the end',    es: 'cerca del final' },

  // ── Time-ago humanization ──────────────────────────────────────────────────
  // Hebrew uses dual forms (שעתיים / יומיים / שבועיים) for n=2 — separate
  // *Dual keys carry the dual form. en/es mirror their plural form for those
  // keys so the lookup in sidebar-time-ago.ts stays uniform across languages.
  'timeAgo.justNow':       { he: 'לפני רגע',         en: 'just now',           es: 'hace un momento' },
  'timeAgo.minutes':       { he: 'לפני {{n}} דקות',  en: '{{n}} minutes ago',  es: 'hace {{n}} minutos' },
  'timeAgo.hour':          { he: 'לפני שעה',         en: 'an hour ago',        es: 'hace una hora' },
  'timeAgo.hoursDual':     { he: 'לפני שעתיים',      en: '2 hours ago',        es: 'hace 2 horas' },
  'timeAgo.hours':         { he: 'לפני {{n}} שעות',  en: '{{n}} hours ago',    es: 'hace {{n}} horas' },
  'timeAgo.yesterday':     { he: 'אתמול',            en: 'yesterday',          es: 'ayer' },
  'timeAgo.daysDual':      { he: 'לפני יומיים',      en: '2 days ago',         es: 'hace 2 días' },
  'timeAgo.days':          { he: 'לפני {{n}} ימים',  en: '{{n}} days ago',     es: 'hace {{n}} días' },
  'timeAgo.week':          { he: 'לפני שבוע',        en: 'a week ago',         es: 'hace una semana' },
  'timeAgo.weeksDual':     { he: 'לפני שבועיים',     en: '2 weeks ago',        es: 'hace 2 semanas' },
  'timeAgo.weeks':         { he: 'לפני {{n}} שבועות', en: '{{n}} weeks ago',   es: 'hace {{n}} semanas' },
  'timeAgo.moreThanMonth': { he: 'לפני יותר מחודש',  en: 'more than a month ago', es: 'hace más de un mes' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Living Library (future /library screen) ────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // Namespace map (Open/Closed: add new sub-namespaces here without touching
  // existing `library.title`, `library.subtitle`, `library.category.*`,
  // `library.level.*` keys above):
  //   library.galaxy.*           main screen chrome
  //   library.itemType.*         display label per LibraryItemType
  //   library.status.*           display label per LibraryItemStatus
  //   library.sourceKind.*       display label per LibrarySourceKind
  //   library.filter.*           filter chips and toggles
  //   library.sort.*             sort options
  //   library.continueReading.*  resume card
  //   library.stats.*            stats panel
  //   library.recommendation.*   recommendation strip
  //   library.action.*           AI assistant toolbar actions
  //   library.search.*           search affordances
  //   library.empty.*            empty states
  //   library.processing.*       processing / failed / archived helper text
  //   library.a11y.*             aria labels
  //   library.mobile.*           mobile-only UI
  //
  // SOLID: keys mirror machine values from src/types/library.ts so any
  // LibraryItem can be displayed via `t('library.itemType.' + item.type, lang)`
  // (Liskov: every type renders through the same key pattern).
  // ───────────────────────────────────────────────────────────────────────────

  // ── library.galaxy.* — main screen chrome ──────────────────────────────────
  'library.galaxy.title':           { he: 'מרחב הידע',                                                        en: 'Knowledge Space',                                                              es: 'Espacio de conocimiento' },
  // Hero subtitle: short, AI-only, Yuval-led. BookForge (the internal
  // pipeline) is intentionally NOT mentioned here — it surfaces only in
  // technical/explainer surfaces, never in the user-facing hero.
  'library.galaxy.subtitle':        { he: 'כל הידע שלך במרחב אחד חי ומתפתח.',                                  en: 'All your knowledge in one living, evolving space.',                                                     es: 'Todo tu conocimiento en un espacio vivo y en evolución.' },
  'library.galaxy.welcome':         { he: 'ברוך הבא ל Yuval',                                                  en: 'Welcome to Yuval',                                                             es: 'Bienvenido a Yuval' },
  'library.galaxy.searchPlaceholder': { he: 'חפש ספרים, קורסים, סדרות, מאמרים ונושאים',                       en: 'Search books, courses, series, articles and topics',                            es: 'Busca libros, cursos, series, artículos y temas' },
  'library.galaxy.primaryCta':      { he: 'חקור את המרחב',                                                     en: 'Explore the space',                                                             es: 'Explora el espacio' },
  'library.galaxy.secondaryCta':    { he: 'איך Yuval מסדרת ידע',                                              en: 'How Yuval organizes knowledge',                                                 es: 'Cómo Yuval organiza el conocimiento' },
  'library.galaxy.loading':         { he: 'טוען את הספרייה שלך',                                              en: 'Loading your library',                                                          es: 'Cargando tu biblioteca' },
  'library.galaxy.error':           { he: 'לא הצלחנו לטעון את הספרייה. נסה שוב בעוד רגע',                     en: "We couldn't load your library. Try again in a moment",                          es: 'No pudimos cargar tu biblioteca. Inténtalo de nuevo en un momento' },
  'library.galaxy.explainerTitle':  { he: 'איך זה עובד',                                                       en: 'How it works',                                                                  es: 'Cómo funciona' },
  'library.galaxy.explainerBody':   { he: 'תכנים שעוברים עיבוד אוטומטי ב-BookForge מתחברים למרחב ידע אחד שניתן לחפש, לקשר ולנווט בו.', en: 'Content automatically processed by BookForge connects into one searchable, navigable knowledge space.', es: 'Los contenidos procesados automáticamente por BookForge se conectan en un único espacio de conocimiento navegable y buscable.' },

  // ── library.galaxy.* — orbit interactions (click-to-center, pagination) ──
  'library.galaxy.openItem':        { he: 'פתח את הספר',      en: 'Open',                es: 'Abrir' },
  'library.galaxy.closeItem':       { he: 'סגור',             en: 'Close',               es: 'Cerrar' },

  // ── Reading-entry overlay (in-card image overlay on the centered card) ──
  'library.readingEntry.title':     { he: 'כניסה לקריאה',          en: 'Enter reading',                  es: 'Entrar a la lectura' },
  'library.readingEntry.subtitle':  { he: 'לחץ כדי לפתוח את מרחב הספר', en: 'Click to open the book space',   es: 'Haz clic para abrir el espacio del libro' },
  'library.readingEntry.ariaLabel': { he: 'כניסה לקריאה',          en: 'Enter reading',                  es: 'Entrar a la lectura' },
  // Chapter-aware aria-label used by the image-based CTA panel below the
  // focused card. Renders as "המשך קריאה בפרק 21" / "Continue reading at
  // chapter 21" once the hydration script knows which chapter is current.
  'library.readingEntry.continueChapterAria': { he: 'המשך קריאה בפרק {{n}}', en: 'Continue reading at chapter {{n}}', es: 'Continuar leyendo en el capítulo {{n}}' },
  // Dynamic label swap for the existing pill when stored reading
  // progress for the focused book points at a specific chapter.
  // Falls back to `library.readingEntry.title` ("כניסה לקריאה")
  // when no progress is available — see hydration in index.astro.
  'library.readingEntry.continueChapter': { he: 'המשך · פרק {{n}}',     en: 'Continue · Chapter {{n}}',       es: 'Continuar · Capítulo {{n}}' },
  // Two-line CTA: a constant primary label + a separate "Chapter N"
  // subtitle. Used by the redesigned premium glass action panel below
  // the focused card.
  'library.readingEntry.continueReadingShort': { he: 'המשך קריאה', en: 'Continue reading', es: 'Continuar leyendo' },
  // SSR default for books that have NEVER been opened (no localStorage
  // progress entries). The hydrator in index.astro flips this to
  // `continueReadingShort` (or the chapter-aware "המשך · פרק N") the
  // moment any chapter has progress > 0.
  'library.readingEntry.startReadingShort':    { he: 'התחל קריאה', en: 'Start reading',   es: 'Empezar a leer' },
  'library.readingEntry.chapterN':              { he: 'פרק {{n}}', en: 'Chapter {{n}}',    es: 'Capítulo {{n}}' },

  // ── library.centerCard.* — quiet secondary link + metadata row that
  //    sit BELOW the existing reading-entry pill on the focused card.
  //    The primary glowing pill itself is unchanged.
  'library.centerCard.bookSummaryLink': { he: 'מה יש בספר?',          en: 'What is in this book?',          es: '¿Qué hay en este libro?' },
  // Secondary glass pill that sits inside the reading-entry panel
  // below the "המשך קריאה / פרק X" title row. Opens the book summary
  // page ({item.href}), not the reader.
  'library.centerCard.bookSummaryPill': { he: 'תקציר הספר',          en: 'Book summary',                   es: 'Resumen del libro' },
  'library.centerCard.bookSummaryPillAria': { he: 'פתח את תקציר הספר', en: 'Open the book summary',          es: 'Abrir el resumen del libro' },
  'library.centerCard.metaMinutes':     { he: '{{n}} דק׳ קריאה',     en: '{{n}} min read',                 es: '{{n}} min de lectura' },
  'library.centerCard.metaProgress':    { he: '{{n}}% הושלם',         en: '{{n}}% completed',               es: '{{n}}% completado' },
  // Section label that sits above the three glass meta capsules in the
  // redesigned action area below the focused card.
  'library.centerCard.metaSectionLabel': { he: 'מה כולל השיעור?', en: "What's in this lesson?", es: '¿Qué incluye esta lección?' },
  'library.galaxy.nextBooks':       { he: 'ספרים הבאים',      en: 'Next books',          es: 'Siguientes libros' },
  'library.galaxy.prevBooks':       { he: 'ספרים קודמים',     en: 'Previous books',      es: 'Libros anteriores' },
  'library.galaxy.nextLessons':     { he: 'שיעורים הבאים',    en: 'Next lessons',        es: 'Siguientes lecciones' },
  'library.galaxy.prevLessons':     { he: 'שיעורים קודמים',   en: 'Previous lessons',    es: 'Lecciones anteriores' },
  'library.galaxy.rotateNext':      { he: 'סובב את המערכת קדימה', en: 'Rotate orbit forward',  es: 'Girar órbita hacia adelante' },
  'library.galaxy.rotatePrev':      { he: 'סובב את המערכת אחורה', en: 'Rotate orbit backward', es: 'Girar órbita hacia atrás' },

  // ── library.galaxy.* — orbit BookCard inner labels (count + progress) ─────
  'library.galaxy.chaptersCount':   { he: '{{n}} פרקים',        en: '{{n}} chapters',      es: '{{n}} capítulos' },
  'library.galaxy.progressLabel':   { he: 'התקדמות',            en: 'Progress',            es: 'Progreso' },

  // ── admin.* — Knowledge Control Center (/admin) ─────────────────────────
  // Internal control surface for the project owner. Strings here drive
  // every visible text node: header, sections, buttons, drawer fields,
  // delete modal, and runtime toast messages. Runtime toasts are exposed
  // to the page script via a JSON data-attribute on the wrapper, so the
  // same translation table feeds both SSR and client pieces — no parallel
  // string source.
  'admin.eyebrow':                       { he: 'Yuval · פנים',                                      en: 'Yuval · Internal',                                      es: 'Yuval · Interno' },
  'admin.title':                         { he: 'מרכז בקרת הידע',                                    en: 'Knowledge Control Center',                              es: 'Centro de control del conocimiento' },
  'admin.subtitle':                      { he: 'ניהול תוכן, מצב קריאה ומטא-דאטה של הידע.',           en: 'Manage content, reader state and knowledge metadata.', es: 'Administra contenido, estado del lector y metadatos del conocimiento.' },

  'admin.section.libraryContent':        { he: 'תוכן הספרייה',          en: 'Library Content',         es: 'Contenido de la biblioteca' },
  'admin.section.globalSettings':        { he: 'הגדרות כלליות',         en: 'Global Settings',         es: 'Configuración global' },
  'admin.section.bookCount':             { he: '{{n}} ספרים',           en: '{{n}} books',             es: '{{n}} libros' },

  'admin.action.editMetadata':           { he: 'עריכת מטא-דאטה',                          en: 'Edit metadata',                         es: 'Editar metadatos' },
  'admin.action.editAriaLabel':          { he: 'עריכת מטא-דאטה עבור {{title}}',            en: 'Edit metadata for {{title}}',           es: 'Editar metadatos de {{title}}' },
  'admin.action.editTitle':              { he: 'עריכת מטא-דאטה',                          en: 'Edit metadata',                         es: 'Editar metadatos' },
  'admin.action.cleanData':              { he: 'ניקוי נתונים',                            en: 'Clean data',                            es: 'Limpiar datos' },
  'admin.action.cleanDataTitle':         { he: 'ניקוי נתוני קריאה מקומיים לספר זה',       en: 'Clean local reader data for this book', es: 'Limpiar datos locales del lector para este libro' },
  'admin.action.delete':                 { he: 'מחיקה',                                   en: 'Delete',                                es: 'Eliminar' },
  'admin.action.deleteAriaLabel':        { he: 'מחיקת {{title}}',                         en: 'Delete {{title}}',                      es: 'Eliminar {{title}}' },
  'admin.action.deleteTitle':            { he: 'מחיקת ספר',                               en: 'Delete book',                           es: 'Eliminar libro' },

  'admin.stat.loading':                  { he: '…',                  en: '…',                       es: '…' },
  'admin.stat.noData':                   { he: 'אין נתונים',         en: 'No data',                 es: 'Sin datos' },
  'admin.stat.itemsOne':                 { he: 'פריט אחד',           en: '1 item',                  es: '1 elemento' },
  'admin.stat.itemsMany':                { he: '{{n}} פריטים',       en: '{{n}} items',             es: '{{n}} elementos' },

  'admin.global.title':                  { he: 'העדפות קריאה',                                                                en: 'Reader preferences',                                                       es: 'Preferencias del lector' },
  'admin.global.description':            { he: 'שפה, ערכת נושא, טיפוגרפיה, קול ומהירות TTS, מצב היכרות.',                       en: 'Language, theme, typography, TTS voice & speed, onboarding state.',          es: 'Idioma, tema, tipografía, voz y velocidad de TTS, estado de presentación.' },
  'admin.global.cleanButton':            { he: 'ניקוי הגדרות כלליות',                                                          en: 'Clean global settings',                                                      es: 'Limpiar configuración global' },
  'admin.global.exportTitle':            { he: 'ייצוא מטא עריכתית',                                                            en: 'Export editorial metadata',                                                  es: 'Exportar metadatos editoriales' },
  'admin.global.exportDescription':      { he: 'הורדה של כל הרשומות מה-localStorage כקובץ _editorial.json שניתן להוסיף ל-output/.', en: 'Download all localStorage records as an _editorial.json file ready for output/.', es: 'Descarga todos los registros de localStorage como _editorial.json listo para output/.' },
  'admin.global.exportButton':           { he: 'ייצא _editorial.json',                                                          en: 'Export _editorial.json',                                                     es: 'Exportar _editorial.json' },
  'admin.toast.editorialExported':       { he: 'ייוצא: {{items}} פריטים, {{series}} סדרות',                                    en: 'Exported {{items}} items, {{series}} series',                                es: 'Exportado: {{items}} elementos, {{series}} series' },
  'admin.global.importTitle':            { he: 'ייבוא מטא עריכתית',                                                            en: 'Import editorial metadata',                                                  es: 'Importar metadatos editoriales' },
  'admin.global.importDescription':      { he: 'טעינה של קובץ _editorial.json שיחליף את כל הנתונים הנוכחיים ב-localStorage.',  en: 'Load an _editorial.json file. Replaces every record currently in localStorage.', es: 'Carga un archivo _editorial.json. Reemplaza todos los registros actuales en localStorage.' },
  'admin.global.importButton':           { he: 'ייבא _editorial.json',                                                          en: 'Import _editorial.json',                                                     es: 'Importar _editorial.json' },
  'admin.global.importConfirm':          { he: 'פעולה זו תחליף את כל המטא העריכתית הנוכחית ב-{{items}} פריטים ו-{{series}} סדרות מהקובץ. להמשיך?', en: 'This will replace all current editorial metadata with {{items}} items and {{series}} series from the file. Continue?', es: 'Esto reemplazará todos los metadatos editoriales actuales con {{items}} elementos y {{series}} series del archivo. ¿Continuar?' },
  'admin.toast.editorialImported':       { he: 'יובאו: {{items}} פריטים, {{series}} סדרות',                                    en: 'Imported {{items}} items, {{series}} series',                                es: 'Importado: {{items}} elementos, {{series}} series' },
  'admin.toast.editorialImportInvalid':  { he: 'קובץ לא תקין: {{reason}}',                                                     en: 'Invalid file: {{reason}}',                                                   es: 'Archivo no válido: {{reason}}' },
  'admin.global.catalogNoticeTitle':     { he: 'אופן הפרסום של הספרייה',                                                       en: 'How library publishing works',                                              es: 'Cómo se publica la biblioteca' },
  'admin.global.catalogNoticeDescription':{ he: 'שינויים ב-Admin חיים בזיכרון בלבד עד שמייצאים אותם. רענון או סגירה של הלשונית מאפסים אותם. כדי לפרסם — ייצא catalog.json, החלף את src/data/library/catalog.json ועשה build.', en: 'Admin changes live in memory only until you export them. A refresh or closing the tab discards them. To publish: Export catalog.json, replace src/data/library/catalog.json, and build.', es: 'Los cambios del Admin viven solo en memoria hasta exportarlos. Una recarga o cerrar la pestaña los descarta. Para publicar: exporta catalog.json, reemplaza src/data/library/catalog.json y construye.' },
  'admin.global.exportCatalogTitle':     { he: 'ייצוא קטלוג ספרייה',                                                          en: 'Export library catalog',                                                    es: 'Exportar catálogo de biblioteca' },
  'admin.global.exportCatalogDescription':{ he: 'הורדה של קטלוג מאוחד שמשלב את catalog.json הקיים עם טיוטות ה-Admin.',         en: 'Download a unified catalog that merges the existing catalog.json with current Admin drafts.', es: 'Descarga un catálogo unificado que fusiona el catalog.json existente con los borradores del Admin.' },
  'admin.global.exportCatalogButton':    { he: 'ייצא catalog.json',                                                            en: 'Export catalog.json',                                                       es: 'Exportar catalog.json' },
  'admin.global.importCatalogTitle':     { he: 'ייבוא קטלוג ספרייה',                                                          en: 'Import library catalog',                                                    es: 'Importar catálogo de biblioteca' },
  'admin.global.importCatalogDescription':{ he: 'טעינה של catalog.json לטיוטות Admin. החלפה מלאה. לא משנה את הקובץ ב-src/data.', en: 'Load a catalog.json into the Admin drafts. Replace-mode. Does not touch the file in src/data.', es: 'Carga un catalog.json en los borradores del Admin. Modo reemplazo. No toca el archivo en src/data.' },
  'admin.global.importCatalogButton':    { he: 'ייבא catalog.json',                                                            en: 'Import catalog.json',                                                       es: 'Importar catalog.json' },
  'admin.global.catalogImportConfirm':   { he: 'פעולה זו תחליף את כל הטיוטות ב-{{count}} פריטים מהקובץ. להמשיך?',              en: 'This will replace all current drafts with {{count}} items from the file. Continue?', es: 'Esto reemplazará todos los borradores actuales con {{count}} elementos del archivo. ¿Continuar?' },
  'admin.toast.catalogExported':         { he: 'יוצא: {{count}} פריטים ב-catalog.json',                                       en: 'Exported {{count}} items to catalog.json',                                  es: 'Exportado: {{count}} elementos a catalog.json' },
  'admin.toast.catalogImported':         { he: 'יובאו: {{count}} פריטים מ-catalog.json',                                      en: 'Imported {{count}} items from catalog.json',                                es: 'Importado: {{count}} elementos de catalog.json' },
  'admin.toast.catalogImportInvalid':    { he: 'קובץ catalog.json לא תקין: {{reason}}',                                       en: 'Invalid catalog.json: {{reason}}',                                          es: 'catalog.json no válido: {{reason}}' },

  'admin.drawer.eyebrow':                { he: 'עריכת מטא-דאטה',     en: 'Edit metadata',           es: 'Editar metadatos' },
  'admin.drawer.close':                  { he: 'סגירת עורך',         en: 'Close editor',            es: 'Cerrar editor' },

  'admin.field.displayTitle':            { he: 'כותרת לתצוגה',                                                  en: 'Display title',                                                       es: 'Título mostrado' },
  'admin.field.displayTitleHint':        { he: 'כיצד פריט זה יופיע במרחב הידע.',                                  en: 'How this item will appear in the Knowledge Universe.',                es: 'Cómo aparecerá este elemento en el Espacio de conocimiento.' },
  'admin.field.contentType':             { he: 'סוג תוכן',                                                       en: 'Content type',                                                        es: 'Tipo de contenido' },
  'admin.field.category':                { he: 'קטגוריה',                                                        en: 'Category',                                                            es: 'Categoría' },
  'admin.field.categoryPlaceholder':     { he: 'לדוגמה: הנדסת AI',                                              en: 'e.g. AI Engineering',                                                 es: 'p. ej. Ingeniería de IA' },
  'admin.field.seriesName':              { he: 'שם הסדרה',                                                       en: 'Series name',                                                         es: 'Nombre de la serie' },
  'admin.field.seriesPlaceholder':       { he: 'לדוגמה: AI Developer Path',                                      en: 'e.g. AI Developer Path',                                              es: 'p. ej. AI Developer Path' },
  'admin.field.visibleInUniverse':       { he: 'גלוי במרחב הידע',                                                en: 'Visible in universe',                                                 es: 'Visible en el Espacio' },
  'admin.field.visibleInUniverseHint':   { he: 'כיבוי מסתיר פריט זה ממרחב הידע.',                                en: 'Off hides this item from the Knowledge Universe.',                    es: 'Apagado oculta este elemento del Espacio de conocimiento.' },
  'admin.field.visibleInUniverseAria':   { he: 'החלפת גלויות במרחב הידע',                                        en: 'Toggle visibility in universe',                                       es: 'Alternar visibilidad en el Espacio' },
  'admin.field.visualMode':              { he: 'מצב תצוגה',                                                      en: 'Visual mode',                                                         es: 'Modo visual' },

  'admin.option.book':                   { he: 'ספר',         en: 'Book',     es: 'Libro' },
  'admin.option.course':                 { he: 'קורס',        en: 'Course',   es: 'Curso' },
  'admin.option.article':                { he: 'מאמר',        en: 'Article',  es: 'Artículo' },
  'admin.option.card':                   { he: 'כרטיסייה',    en: 'Card',     es: 'Tarjeta' },
  'admin.option.hidden':                 { he: 'מוסתר',       en: 'Hidden',   es: 'Oculto' },

  'admin.button.cancel':                 { he: 'ביטול',                  en: 'Cancel',                  es: 'Cancelar' },
  'admin.button.save':                   { he: 'שמירת מטא-דאטה',         en: 'Save metadata',           es: 'Guardar metadatos' },

  // Generic confirm-modal headers — kept as `admin.modal.title` for
  // backward compat; book-specific copy lives below in
  // `admin.modal.headingBook` / `bodyBook` / `warningBook` and the
  // series-specific copy lives next to it.
  'admin.modal.title':                   { he: 'אישור מחיקה',                                                                            en: 'Confirm delete',                                                       es: 'Confirmar eliminación' },
  'admin.modal.warning':                 { he: 'פעולה זו אינה ניתנת לביטול.',                                                            en: 'This action cannot be undone.',                                        es: 'Esta acción no se puede deshacer.' },
  'admin.modal.cancel':                  { he: 'ביטול',                                                                                  en: 'Cancel',                                                               es: 'Cancelar' },
  'admin.modal.confirm':                 { he: 'מחק לצמיתות',                                                                            en: 'Delete permanently',                                                   es: 'Eliminar permanentemente' },
  'admin.modal.deleting':                { he: 'מוחק…',                                                                                 en: 'Deleting…',                                                            es: 'Eliminando…' },

  'admin.modal.headingBook':             { he: 'מחיקת ספר',                                                                              en: 'Delete book',                                                          es: 'Eliminar libro' },
  'admin.modal.bodyBook':                { he: 'האם אתה בטוח שברצונך למחוק את הספר {{title}}?',                                          en: 'Are you sure you want to delete the book {{title}}?',                  es: '¿Estás seguro de que quieres eliminar el libro {{title}}?' },
  'admin.modal.warningBook':             { he: 'פעולה זו תמחק את כל הקבצים בכל השפות ולא ניתנת לביטול.',                                  en: 'This action will delete all files in all languages and cannot be undone.', es: 'Esta acción eliminará todos los archivos en todos los idiomas y no se puede deshacer.' },

  'admin.modal.headingSeries':           { he: 'מחיקת סדרה',                                                                             en: 'Delete series',                                                        es: 'Eliminar serie' },
  'admin.modal.bodySeries':              { he: 'האם אתה בטוח שברצונך למחוק את הסדרה {{title}}?',                                         en: 'Are you sure you want to delete the series {{title}}?',                es: '¿Estás seguro de que quieres eliminar la serie {{title}}?' },
  'admin.modal.warningSeries':           { he: 'הספרים בסדרה לא יימחקו, אבל יאבדו את השיוך לסדרה. הפעולה אינה ניתנת לביטול.',              en: 'Books in the series will be detached from it but not deleted. This action cannot be undone.', es: 'Los libros de la serie quedarán desvinculados pero no se eliminarán. Esta acción no se puede deshacer.' },

  'admin.toast.cleanedBook':             { he: 'נוקו {{n}} פריטים עבור "{{slug}}"',                  en: 'Cleaned {{n}} items for "{{slug}}"',                                  es: 'Se limpiaron {{n}} elementos para "{{slug}}"' },
  'admin.toast.noBookData':              { he: 'לא נמצאו נתונים עבור "{{slug}}"',                    en: 'No data found for "{{slug}}"',                                        es: 'No se encontraron datos para "{{slug}}"' },
  'admin.toast.cleanedGlobal':           { he: 'נוקו {{n}} הגדרות כלליות',                            en: 'Cleaned {{n}} global settings',                                       es: 'Se limpiaron {{n}} configuraciones globales' },
  'admin.toast.noGlobalData':            { he: 'לא נמצאו הגדרות כלליות',                              en: 'No global settings found',                                            es: 'No se encontraron configuraciones globales' },
  'admin.toast.bookDeleted':             { he: 'הספר "{{slug}}" נמחק בהצלחה',                         en: 'Book "{{slug}}" deleted successfully',                                es: 'El libro "{{slug}}" se eliminó correctamente' },
  'admin.toast.deleteError':             { he: 'שגיאה: {{msg}}',                                      en: 'Error: {{msg}}',                                                      es: 'Error: {{msg}}' },
  'admin.toast.deleteFailed':            { he: 'לא ניתן למחוק',                                       en: 'Could not delete',                                                    es: 'No se pudo eliminar' },
  'admin.toast.networkError':            { he: 'שגיאת רשת: {{msg}}',                                  en: 'Network error: {{msg}}',                                              es: 'Error de red: {{msg}}' },
  'admin.toast.metadataSaved':           { he: 'המטא-דאטה נשמרה עבור "{{title}}"',                    en: 'Metadata saved for "{{title}}"',                                      es: 'Metadatos guardados para "{{title}}"' },

  // ── admin.column.* — Knowledge Catalog table column headers ────────────
  // Used by the wide table layout that replaces the previous card list.
  // Column titles are short so the header bar fits on a typical desktop
  // viewport even with all 9 columns visible.
  'admin.column.item':                   { he: 'שם ספר',         en: 'Book name',    es: 'Nombre del libro' },
  'admin.column.type':                   { he: 'סוג',            en: 'Type',         es: 'Tipo' },
  'admin.column.series':                 { he: 'סדרה',           en: 'Series',       es: 'Serie' },
  'admin.column.category':               { he: 'קטגוריה',        en: 'Category',     es: 'Categoría' },
  'admin.column.visibility':             { he: 'גלויות',          en: 'Visibility',   es: 'Visibilidad' },
  'admin.column.progress':               { he: 'נתוני קריאה',     en: 'Reader data',  es: 'Datos del lector' },
  'admin.column.chapters':               { he: 'פרקים',          en: 'Chapters',     es: 'Capítulos' },
  'admin.column.actions':                { he: 'פעולות',         en: 'Actions',      es: 'Acciones' },

  'admin.cell.empty':                    { he: '—',              en: '—',            es: '—' },
  'admin.cell.visible':                  { he: 'גלוי',           en: 'Visible',      es: 'Visible' },
  'admin.cell.hidden':                   { he: 'מוסתר',          en: 'Hidden',       es: 'Oculto' },
  'admin.cell.noSeries':                 { he: 'ללא סדרה',       en: 'No series',    es: 'Sin serie' },
  'admin.cell.noCategory':               { he: 'ללא קטגוריה',    en: 'No category',  es: 'Sin categoría' },

  // ── admin.cover.* — cover-image upload UI in both tables ───────────
  // The thumbnail column reuses these strings for the books table
  // (kind=book) and the series table (kind=series). The script
  // composes the file picker / fetch call dynamically; copy is shared
  // because the user-facing semantics are identical.
  'admin.column.cover':                  { he: 'כריכה',                          en: 'Cover',                              es: 'Portada' },
  'admin.cover.upload':                  { he: 'העלה כריכה',                     en: 'Upload cover',                       es: 'Subir portada' },
  'admin.cover.replace':                 { he: 'החלף כריכה',                     en: 'Replace cover',                      es: 'Reemplazar portada' },
  'admin.cover.uploading':               { he: 'מעלה...',                        en: 'Uploading...',                       es: 'Subiendo...' },
  'admin.cover.uploadAria':              { he: 'העלה תמונת כריכה עבור {{title}}', en: 'Upload cover image for {{title}}',   es: 'Subir imagen de portada para {{title}}' },
  'admin.cover.placeholder':             { he: 'אין כריכה',                      en: 'No cover',                           es: 'Sin portada' },
  'admin.toast.coverUploaded':           { he: 'כריכה הועלתה עבור "{{title}}"',   en: 'Cover uploaded for "{{title}}"',     es: 'Portada subida para "{{title}}"' },
  'admin.toast.coverUploadFailed':       { he: 'העלאת הכריכה נכשלה: {{msg}}',     en: 'Cover upload failed: {{msg}}',       es: 'Error al subir la portada: {{msg}}' },
  'admin.toast.coverInvalidType':        { he: 'סוג קובץ לא נתמך. השתמש ב-PNG, JPG או WEBP.', en: 'Unsupported file type. Use PNG, JPG, or WEBP.', es: 'Tipo de archivo no admitido. Usa PNG, JPG o WEBP.' },
  'admin.toast.coverTooLarge':           { he: 'הקובץ גדול מדי (מקס׳ 5MB)',       en: 'File too large (max 5MB)',           es: 'Archivo demasiado grande (máx. 5MB)' },

  // ── admin.series.* — Series Management on /admin ───────────────────────
  // A series is detected when ≥1 content items share the same non-empty
  // seriesName. The admin section lets the project owner edit the
  // editorial properties of each detected series (display title, color,
  // order, visibility, visual mode). Admin-only — the Knowledge Universe
  // rendering does not consume these new fields yet.
  'admin.series.section':                  { he: 'ניהול סדרות',                                                                            en: 'Series Management',                                                                  es: 'Gestión de series' },
  'admin.series.empty':                    { he: 'עדיין לא הוגדרו סדרות.',                                                                en: 'No series defined yet.',                                                             es: 'Aún no hay series definidas.' },
  'admin.series.count':                    { he: '{{n}} סדרות',                                                                            en: '{{n}} series',                                                                       es: '{{n}} series' },
  'admin.series.itemsLabel':               { he: '{{n}} פריטים',                                                                           en: '{{n}} items',                                                                        es: '{{n}} elementos' },
  'admin.series.availableLabel':           { he: '{{n}} זמינים',                                                                           en: '{{n}} available',                                                                    es: '{{n}} disponibles' },
  'admin.series.editAriaLabel':            { he: 'עריכת סדרה {{name}}',                                                                    en: 'Edit series {{name}}',                                                               es: 'Editar serie {{name}}' },
  'admin.series.editTitle':                { he: 'עריכת סדרה',                                                                             en: 'Edit series',                                                                        es: 'Editar serie' },
  'admin.series.tagCapsule':               { he: 'קפסולה',                                                                                en: 'Capsule',                                                                            es: 'Cápsula' },

  'admin.series.drawer.eyebrow':           { he: 'עריכת סדרה',                                                                             en: 'Edit series',                                                                        es: 'Editar serie' },
  'admin.series.drawer.close':             { he: 'סגירת עורך',                                                                            en: 'Close editor',                                                                       es: 'Cerrar editor' },

  'admin.series.field.displayTitle':       { he: 'כותרת לתצוגה',                                                                          en: 'Display title',                                                                      es: 'Título mostrado' },
  'admin.series.field.displayTitleHint':   { he: 'כיצד הסדרה תופיע במרחב הידע.',                                                          en: 'How this series appears in the Knowledge Universe.',                                 es: 'Cómo aparecerá esta serie en el Espacio de conocimiento.' },
  'admin.series.field.color':              { he: 'צבע',                                                                                   en: 'Color',                                                                              es: 'Color' },
  'admin.series.field.colorHint':          { he: 'אופציונלי. השאר ריק לצבע ברירת המחדל (זהב).',                                          en: 'Optional. Leave empty for the default gold.',                                        es: 'Opcional. Déjalo vacío para usar el dorado por defecto.' },
  'admin.series.field.colorClear':         { he: 'איפוס',                                                                                 en: 'Reset',                                                                              es: 'Restablecer' },
  'admin.series.field.order':              { he: 'סדר תצוגה',                                                                             en: 'Order',                                                                              es: 'Orden' },
  'admin.series.field.orderHint':          { he: 'ערכים נמוכים מופיעים תחילה. השאר ריק לסדר אלפביתי.',                                    en: 'Lower values appear first. Leave empty for alphabetical order.',                     es: 'Los valores más bajos aparecen primero. Déjalo vacío para orden alfabético.' },
  'admin.series.field.visibleInUniverse':  { he: 'גלויה במרחב הידע',                                                                      en: 'Visible in universe',                                                                es: 'Visible en el Espacio' },
  'admin.series.field.visibleHint':        { he: 'כיבוי מסתיר את הסדרה ממרחב הידע.',                                                       en: 'Off hides this series from the Knowledge Universe.',                                 es: 'Apagado oculta esta serie del Espacio de conocimiento.' },
  'admin.series.field.visibleAria':        { he: 'החלפת גלויות סדרה',                                                                     en: 'Toggle series visibility',                                                           es: 'Alternar visibilidad de la serie' },
  'admin.series.field.visualMode':         { he: 'מצב תצוגה',                                                                             en: 'Visual mode',                                                                        es: 'Modo visual' },
  'admin.series.option.capsule':           { he: 'קפסולה',                                                                                en: 'Capsule',                                                                            es: 'Cápsula' },
  'admin.series.option.card':              { he: 'כרטיס',                                                                                 en: 'Card',                                                                               es: 'Tarjeta' },
  'admin.series.option.orbitNode':         { he: 'תחנת מסלול',                                                                            en: 'Orbit node',                                                                         es: 'Nodo de órbita' },
  'admin.series.button.save':              { he: 'שמירת סדרה',                                                                            en: 'Save series',                                                                        es: 'Guardar serie' },
  'admin.series.toast.saved':              { he: 'הסדרה "{{name}}" נשמרה',                                                                en: 'Series "{{name}}" saved',                                                            es: 'Serie "{{name}}" guardada' },

  // ── Series create / delete (admin Series Management) ────────────────
  // Header CTA opens the series drawer in "create" mode (empty fields,
  // editable name). Per-row delete uses the shared confirmation modal —
  // strings live next to the book modal copy above so the two flows
  // stay aligned.
  'admin.series.action.new':               { he: 'סדרה חדשה',                                                                              en: 'New series',                                                                         es: 'Nueva serie' },
  'admin.series.action.delete':            { he: 'מחיקה',                                                                                  en: 'Delete',                                                                             es: 'Eliminar' },
  'admin.series.action.deleteAriaLabel':   { he: 'מחיקת סדרה {{name}}',                                                                    en: 'Delete series {{name}}',                                                             es: 'Eliminar serie {{name}}' },
  'admin.series.action.deleteTitle':       { he: 'מחיקת סדרה',                                                                             en: 'Delete series',                                                                      es: 'Eliminar serie' },
  'admin.series.drawer.eyebrowNew':        { he: 'יצירת סדרה',                                                                             en: 'Create series',                                                                      es: 'Crear serie' },
  'admin.series.field.name':               { he: 'מזהה הסדרה',                                                                             en: 'Series identifier',                                                                  es: 'Identificador de la serie' },
  'admin.series.field.nameHint':           { he: 'מחרוזת ייחודית; משמשת לקיבוץ ספרים תחת אותה סדרה.',                                       en: 'Unique string; used to group books under the same series.',                          es: 'Cadena única; se usa para agrupar libros bajo la misma serie.' },
  'admin.series.toast.deleted':            { he: 'הסדרה "{{name}}" נמחקה',                                                                en: 'Series "{{name}}" deleted',                                                          es: 'Serie "{{name}}" eliminada' },
  'admin.series.toast.created':            { he: 'הסדרה "{{name}}" נוצרה',                                                                en: 'Series "{{name}}" created',                                                          es: 'Serie "{{name}}" creada' },
  'admin.series.toast.renamed':            { he: 'הסדרה שונתה ל-"{{name}}"',                                                              en: 'Series renamed to "{{name}}"',                                                       es: 'Serie renombrada a "{{name}}"' },
  'admin.series.toast.alreadyExists':      { he: 'סדרה בשם "{{name}}" כבר קיימת',                                                          en: 'A series named "{{name}}" already exists',                                           es: 'Ya existe una serie llamada "{{name}}"' },
  'admin.series.toast.nameRequired':       { he: 'נדרש מזהה לסדרה',                                                                       en: 'A series identifier is required',                                                    es: 'Se requiere un identificador de serie' },

  // Section header — subtitle below "ניהול סדרות".
  'admin.series.subtitle':                 { he: 'סדרות מייצגות מסלולי לימוד, קורסים או אוספי ספרים במרחב הידע.',                            en: 'Series represent learning paths, courses or book collections in the Knowledge Space.', es: 'Las series representan rutas de aprendizaje, cursos o colecciones de libros en el Espacio de conocimiento.' },

  // Rich card — labels and badges that appear directly on each series card.
  'admin.series.card.itemsOf':             { he: '{{actual}} מתוך {{planned}} פריטים',                                                    en: '{{actual}} of {{planned}} items',                                                    es: '{{actual}} de {{planned}} elementos' },
  'admin.series.card.itemsOnly':           { he: '{{n}} פריטים',                                                                          en: '{{n}} items',                                                                        es: '{{n}} elementos' },
  'admin.series.card.actualLabel':         { he: 'פריטים משויכים בפועל: {{n}}',                                                            en: 'Actually linked items: {{n}}',                                                       es: 'Elementos vinculados realmente: {{n}}' },
  'admin.series.card.assetFolderLabel':    { he: 'תיקיית נכסים',                                                                          en: 'Asset folder',                                                                       es: 'Carpeta de recursos' },
  'admin.series.card.assetFolderEmpty':    { he: 'לא הוגדרה',                                                                              en: 'Not set',                                                                            es: 'No definida' },
  'admin.series.card.editButton':          { he: 'עריכת סדרה',                                                                             en: 'Edit series',                                                                        es: 'Editar serie' },
  'admin.series.card.noDescription':       { he: 'אין תיאור לסדרה זו.',                                                                    en: 'No description for this series.',                                                    es: 'Sin descripción para esta serie.' },
  'admin.series.card.progressAria':        { he: 'התקדמות {{actual}} מתוך {{planned}}',                                                    en: 'Progress {{actual}} of {{planned}}',                                                 es: 'Progreso {{actual}} de {{planned}}' },

  // Status badge — three publication states. Hebrew uses the
  // feminine form because "סדרה" is grammatically feminine.
  'admin.series.status.active':            { he: 'פעילה',                                                                                 en: 'Active',                                                                             es: 'Activa' },
  'admin.series.status.draft':             { he: 'טיוטה',                                                                                 en: 'Draft',                                                                              es: 'Borrador' },
  'admin.series.status.hidden':            { he: 'מוסתרת',                                                                                en: 'Hidden',                                                                             es: 'Oculta' },

  // Visibility badge — derived from `isVisibleInUniverse`.
  'admin.series.badge.visible':            { he: 'מוצגת במרחב',                                                                            en: 'Shown in universe',                                                                  es: 'Visible en el Espacio' },
  'admin.series.badge.hiddenFromUniverse': { he: 'מוסתרת מהמרחב',                                                                          en: 'Hidden from universe',                                                               es: 'Oculta del Espacio' },

  // Drawer — additional fields for the rich edit form.
  // Series identifier — editable in BOTH create mode and edit mode.
  // Renaming an existing series migrates its metadata record AND
  // retags every book whose seriesName matches any whitespace
  // variant of the old name; both writes are local (no API call),
  // and the row re-renders in place.
  'admin.series.field.slug':               { he: 'מזהה הסדרה',                                                                             en: 'Series identifier',                                                                  es: 'Identificador de la serie' },
  'admin.series.field.slugHint':           { he: 'המחרוזת הפנימית שמקשרת ספרים לסדרה. שינוי הערך כאן יעדכן את כל הספרים בסדרה אוטומטית.',     en: 'Internal string that links books to this series. Editing it here renames the series and retags every attached book.', es: 'Cadena interna que vincula los libros con esta serie. Editarla aquí renombra la serie y reetiqueta cada libro vinculado.' },
  'admin.series.field.shortDescription':   { he: 'תיאור קצר',                                                                             en: 'Short description',                                                                  es: 'Descripción breve' },
  'admin.series.field.shortDescriptionHint':{ he: 'משפט אחד שמופיע על כרטיס הסדרה.',                                                       en: 'One-line tagline shown on the series card.',                                         es: 'Lema de una línea que aparece en la tarjeta de la serie.' },
  'admin.series.field.fullDescription':    { he: 'תיאור מלא',                                                                             en: 'Full description',                                                                   es: 'Descripción completa' },
  'admin.series.field.fullDescriptionHint':{ he: 'פסקה ארוכה לתצוגת הסדרה במלואה.',                                                         en: 'Long-form paragraph for the focused series view.',                                   es: 'Párrafo extenso para la vista detallada de la serie.' },
  'admin.series.field.plannedBooksCount':  { he: 'מספר ספרים מתוכנן',                                                                     en: 'Planned books count',                                                                es: 'Cantidad planeada de libros' },
  'admin.series.field.plannedBooksCountHint':{ he: 'יעד עתידי. מניע את סרגל ההתקדמות. השאר ריק כשאין יעד.',                                en: 'Editorial target. Drives the progress bar. Leave empty when no target.',             es: 'Objetivo editorial. Impulsa la barra de progreso. Déjalo vacío si no hay objetivo.' },
  'admin.series.field.assetFolder':        { he: 'תיקיית נכסים',                                                                          en: 'Asset folder',                                                                       es: 'Carpeta de recursos' },
  'admin.series.field.assetFolderHint':    { he: 'שם התיקייה תחת src/assets/knowledge-cards/ שמכילה את front.png.',                       en: 'Folder name under src/assets/knowledge-cards/ that holds front.png.',                es: 'Nombre de la carpeta bajo src/assets/knowledge-cards/ que contiene front.png.' },
  'admin.series.field.status':             { he: 'מצב',                                                                                   en: 'Status',                                                                             es: 'Estado' },
  'admin.series.field.statusHint':         { he: '"פעיל" = פורסם. "טיוטה" = בעבודה. "מוסתר" = לא לציבור.',                                en: '"Active" = published. "Draft" = in progress. "Hidden" = not public.',                es: '"Activa" = publicada. "Borrador" = en progreso. "Oculta" = no pública.' },
  'admin.series.field.actualReadOnly':     { he: 'פריטים משויכים בפועל: {{n}}',                                                            en: 'Actually linked items: {{n}}',                                                       es: 'Elementos vinculados realmente: {{n}}' },
  'admin.series.field.actualReadOnlyHint': { he: 'מחושב אוטומטית מהפריטים ששייכת אליהם — לא ניתן לעריכה.',                                en: 'Auto-computed from linked items — not editable.',                                    es: 'Calculado automáticamente a partir de los elementos vinculados — no editable.' },

  // Table — column headers used by the Series Management table.
  'admin.series.column.name':              { he: 'שם סדרה',                                                                               en: 'Series',                                                                             es: 'Serie' },
  'admin.series.column.description':       { he: 'תיאור',                                                                                 en: 'Description',                                                                        es: 'Descripción' },
  'admin.series.column.status':            { he: 'סטטוס',                                                                                 en: 'Status',                                                                             es: 'Estado' },
  'admin.series.column.universe':          { he: 'מרחב ידע',                                                                              en: 'Universe',                                                                           es: 'Espacio' },
  'admin.series.column.actualItems':       { he: 'פריטים בפועל',                                                                          en: 'Actual items',                                                                       es: 'Elementos reales' },
  'admin.series.column.plannedItems':      { he: 'פריטים מתוכננים',                                                                       en: 'Planned items',                                                                      es: 'Elementos planeados' },
  'admin.series.column.progress':          { he: 'התקדמות',                                                                               en: 'Progress',                                                                           es: 'Progreso' },
  'admin.series.column.assetFolder':       { he: 'תיקיית נכסים',                                                                          en: 'Asset folder',                                                                       es: 'Carpeta de recursos' },
  'admin.series.column.order':             { he: 'סדר תצוגה',                                                                             en: 'Order',                                                                              es: 'Orden' },
  'admin.series.column.actions':           { he: 'פעולות',                                                                                en: 'Actions',                                                                            es: 'Acciones' },

  // Table cell placeholders — shown inline when an editable field
  // has not been filled in yet. Distinct phrasings keep each column
  // self-explanatory at a glance.
  'admin.series.cell.notSet':              { he: 'לא הוגדר',                                                                              en: 'Not set',                                                                            es: 'No definido' },
  'admin.series.cell.noFolder':            { he: 'ללא תיקייה',                                                                            en: 'No folder',                                                                          es: 'Sin carpeta' },
  'admin.series.cell.dash':                { he: '-',                                                                                     en: '-',                                                                                  es: '-' },

  // ── library.series.* — series capsule on the orbit ───────────────────────
  // Labels are intentionally short so they fit inside the orbit-card
  // footprint (190–210px wide). The number is rendered separately and
  // bolded in DOM, so these keys carry only the trailing noun phrase.
  'library.series.itemsLabel':      { he: 'פריטים בסדרה',     en: 'items in series',     es: 'elementos en la serie' },
  'library.series.availableLabel':  { he: 'זמינים במערכת',    en: 'available in system', es: 'disponibles en el sistema' },
  // Labels for the "Other Knowledge" capsule shown when the universe
  // enters series-mode (an active series is expanded into a carousel).
  'library.series.otherKnowledge':  { he: 'ידע אחר',          en: 'Other Knowledge',     es: 'Otro conocimiento' },
  'library.series.itemsShort':      { he: 'פריטים',           en: 'items',               es: 'elementos' },

  // ── library.series.actions.* — focused-capsule action panel ──────────────
  // Two CTA buttons shown next to a click-focused series capsule on the
  // orbit. They are the only entry-points to the series children fan and
  // the series details drawer; both UIs live on /library and never leave
  // the page (no /series route yet).
  'library.series.actions.showItems':       { he: 'הצג ספרי הסדרה',          en: 'Show series items',          es: 'Mostrar elementos de la serie' },
  'library.series.actions.hideItems':       { he: 'הסתר ספרי הסדרה',         en: 'Hide series items',          es: 'Ocultar elementos de la serie' },
  'library.series.actions.details':         { he: 'פרטי הסדרה',              en: 'Series details',             es: 'Detalles de la serie' },

  // ── library.series.details.* — drawer that opens on the same page ────────
  'library.series.details.title':           { he: 'פרטי הסדרה',              en: 'Series details',             es: 'Detalles de la serie' },
  'library.series.details.close':           { he: 'סגור את חלונית הפרטים',   en: 'Close details panel',        es: 'Cerrar panel de detalles' },
  'library.series.details.shortDescription':{ he: 'תיאור קצר',               en: 'Short description',          es: 'Descripción breve' },
  'library.series.details.fullDescription': { he: 'תיאור מלא',               en: 'Full description',           es: 'Descripción completa' },
  'library.series.details.assignedItems':   { he: 'פריטים משויכים',          en: 'Assigned items',             es: 'Elementos asignados' },
  'library.series.details.plannedItems':    { he: 'פריטים מתוכננים',         en: 'Planned items',              es: 'Elementos planeados' },
  'library.series.details.status':          { he: 'סטטוס',                    en: 'Status',                     es: 'Estado' },
  'library.series.details.assetFolder':     { he: 'תיקיית נכסים',            en: 'Asset folder',               es: 'Carpeta de recursos' },
  'library.series.details.visibleInUniverse':{ he: 'מוצגת ביקום הידע',       en: 'Visible in universe',        es: 'Visible en el universo' },
  'library.series.details.visibleYes':      { he: 'כן',                       en: 'Yes',                        es: 'Sí' },
  'library.series.details.visibleNo':       { he: 'לא',                       en: 'No',                         es: 'No' },
  'library.series.details.noDescription':   { he: 'אין תיאור לסדרה הזו עדיין.', en: 'No description for this series yet.', es: 'Aún no hay descripción para esta serie.' },
  'library.series.details.noAssignedItems': { he: 'עדיין לא שויכו פריטים לסדרה הזו.', en: 'No items have been assigned to this series yet.', es: 'Todavía no se han asignado elementos a esta serie.' },

  // ── library.series.children.* — local fan around focused capsule ─────────
  'library.series.children.empty':          { he: 'הסדרה הזו עדיין ריקה.',    en: 'This series is still empty.', es: 'Esta serie aún está vacía.' },
  'library.series.children.show':           { he: 'הצג ספרי הסדרה',           en: 'Show series items',           es: 'Mostrar elementos de la serie' },
  'library.series.children.hide':           { he: 'הסתר ספרי הסדרה',          en: 'Hide series items',           es: 'Ocultar elementos de la serie' },
  'library.series.children.region':         { he: 'פריטי הסדרה הממוקדת',      en: 'Items of the focused series', es: 'Elementos de la serie en foco' },
  'library.series.children.placeholderType':{ he: 'פריט בסדרה',               en: 'Series item',                 es: 'Elemento de la serie' },

  // ── library.mobileGalaxy.* — mobile-only horizontal carousel ──────────────
  'library.mobileGalaxy.title':     { he: 'תכני AI זמינים',                                            en: 'Available AI content',                                       es: 'Contenido de IA disponible' },
  'library.mobileGalaxy.subtitle':  { he: 'החלק ימינה או שמאלה כדי לעבור בין הספרים וסיכומי השיעור', en: 'Swipe to explore books and lesson summaries',                es: 'Desliza para explorar libros y resúmenes de clase' },

  // ── library.itemType.* — display label per LibraryItemType ─────────────────
  'library.itemType.book':            { he: 'ספר',              en: 'Book',             es: 'Libro' },
  'library.itemType.course':          { he: 'קורס',             en: 'Course',           es: 'Curso' },
  'library.itemType.course_lesson':   { he: 'שיעור בקורס',      en: 'Course lesson',    es: 'Clase del curso' },
  'library.itemType.article':         { he: 'מאמר',             en: 'Article',          es: 'Artículo' },
  'library.itemType.series':          { he: 'סדרה',             en: 'Series',           es: 'Serie' },
  'library.itemType.lesson_summary':  { he: 'סיכום שיעור',      en: 'Lesson summary',   es: 'Resumen de clase' },
  'library.itemType.slides':          { he: 'מצגת',             en: 'Slides',           es: 'Diapositivas' },
  'library.itemType.lab':             { he: 'מעבדה',            en: 'Lab',              es: 'Laboratorio' },
  'library.itemType.transcript':      { he: 'תמלול',            en: 'Transcript',       es: 'Transcripción' },
  'library.itemType.document':        { he: 'מסמך',             en: 'Document',         es: 'Documento' },

  // ── library.status.* — display label per LibraryItemStatus ─────────────────
  'library.status.new':           { he: 'חדש',         en: 'New',         es: 'Nuevo' },
  'library.status.processing':    { he: 'בעיבוד',      en: 'Processing',  es: 'Procesando' },
  'library.status.ready':         { he: 'מוכן',        en: 'Ready',       es: 'Listo' },
  'library.status.failed':        { he: 'נכשל',        en: 'Failed',      es: 'Falló' },
  'library.status.archived':      { he: 'בארכיון',     en: 'Archived',    es: 'Archivado' },

  // ── library.processing.* — short helper text per non-ready status ──────────
  'library.processing.processingText': { he: 'הפריט הזה עדיין בעיבוד. נציג אותו ברגע שיהיה מוכן',          en: 'This item is still being processed. We will show it as soon as it is ready', es: 'Este elemento aún se está procesando. Lo mostraremos en cuanto esté listo' },
  'library.processing.failedText':     { he: 'העיבוד נכשל. אפשר לנסות שוב או למחוק את הפריט',              en: 'Processing failed. You can retry or remove this item',                       es: 'El procesamiento falló. Puedes reintentarlo o eliminar este elemento' },
  'library.processing.archivedText':   { he: 'הפריט בארכיון. הוא לא מופיע בתוצאות חיפוש רגילות',           en: 'This item is archived. It will not appear in regular search results',        es: 'Este elemento está archivado. No aparecerá en los resultados de búsqueda normales' },
  'library.processing.retry':          { he: 'נסה שוב',                                                    en: 'Retry',                                                                       es: 'Reintentar' },

  // ── library.sourceKind.* — display label per LibrarySourceKind ─────────────
  'library.sourceKind.pipeline':   { he: 'מהפייפליין',     en: 'From pipeline',   es: 'Del pipeline' },
  'library.sourceKind.manual':     { he: 'ידני',           en: 'Manual',          es: 'Manual' },
  'library.sourceKind.generated':  { he: 'נוצר ע"י AI',     en: 'AI generated',    es: 'Generado por IA' },
  'library.sourceKind.external':   { he: 'חיצוני',          en: 'External',        es: 'Externo' },

  // ── library.filter.* — filter chips and toggles ────────────────────────────
  'library.filter.all':              { he: 'הכל',                  en: 'All items',          es: 'Todos los elementos' },
  'library.filter.books':            { he: 'ספרים',                en: 'Books',              es: 'Libros' },
  'library.filter.courses':          { he: 'קורסים',               en: 'Courses',            es: 'Cursos' },
  'library.filter.series':           { he: 'סדרות',                en: 'Series',             es: 'Series' },
  'library.filter.articles':         { he: 'מאמרים',               en: 'Articles',           es: 'Artículos' },
  'library.filter.lessonSummaries':  { he: 'סיכומי שיעורים',       en: 'Lesson summaries',   es: 'Resúmenes de clases' },
  'library.filter.ready':            { he: 'מוכנים',               en: 'Ready',              es: 'Listos' },
  'library.filter.new':              { he: 'חדשים',                en: 'New',                es: 'Nuevos' },
  'library.filter.processing':       { he: 'בעיבוד',               en: 'Processing',         es: 'En proceso' },
  'library.filter.archived':         { he: 'בארכיון',              en: 'Archived',           es: 'Archivados' },
  'library.filter.failed':           { he: 'נכשלו',                en: 'Failed',             es: 'Fallidos' },
  'library.filter.includeArchived':  { he: 'כלול פריטים בארכיון',  en: 'Include archived',   es: 'Incluir archivados' },
  'library.filter.includeFailed':    { he: 'כלול פריטים שנכשלו',   en: 'Include failed',     es: 'Incluir fallidos' },
  'library.filter.clear':            { he: 'נקה סינון',            en: 'Clear filters',      es: 'Limpiar filtros' },

  // ── library.sort.* — sort options (mirror LibrarySortKey) ──────────────────
  'library.sort.recent':       { he: 'עודכן לאחרונה',     en: 'Recently updated',   es: 'Actualizado recientemente' },
  'library.sort.created':      { he: 'נוצר לאחרונה',      en: 'Recently created',   es: 'Creado recientemente' },
  'library.sort.title':        { he: 'לפי כותרת',          en: 'Title',              es: 'Título' },
  'library.sort.readingTime':  { he: 'לפי זמן קריאה',      en: 'Reading time',       es: 'Tiempo de lectura' },
  'library.sort.type':         { he: 'לפי סוג',            en: 'Type',               es: 'Tipo' },
  'library.sort.status':       { he: 'לפי סטטוס',          en: 'Status',             es: 'Estado' },

  // ── library.continueReading.* — resume card ────────────────────────────────
  'library.continueReading.title':         { he: 'המשך למידה',                 en: 'Continue Learning',            es: 'Continuar aprendiendo' },
  'library.continueReading.cta':           { he: 'המשך קריאה',                 en: 'Continue reading',             es: 'Continuar leyendo' },
  'library.continueReading.lastOpened':    { he: 'נפתח לאחרונה {{when}}',       en: 'Last opened {{when}}',         es: 'Abierto por última vez {{when}}' },
  'library.continueReading.noActive':      { he: 'אין פריט פעיל כרגע',          en: 'Nothing in progress right now', es: 'Nada en progreso ahora mismo' },
  'library.continueReading.startLearning': { he: 'התחל ללמוד',                  en: 'Start learning',               es: 'Empezar a aprender' },
  // Used when no real per-user "last opened" state is wired. The card is
  // presented as a recommended entry point, not a memory of the reader's
  // session.
  'library.continueReading.recommendedStart':     { he: 'מומלץ להתחיל מכאן',                 en: 'Recommended starting point',                  es: 'Punto de inicio recomendado' },
  'library.continueReading.recommendedStartText': { he: 'פריט פתיחה מומלץ מתוך מרחב הידע',     en: 'A suggested first item from the knowledge space', es: 'Un primer elemento sugerido del espacio de conocimiento' },
  'library.continueReading.startReading':         { he: 'התחל לקרוא',                          en: 'Start reading',                                es: 'Empezar a leer' },
  'library.continueReading.lessonsAvailable':     { he: '{{available}} מתוך {{total}} סיכומי שיעור זמינים', en: '{{available}} of {{total}} lesson summaries available', es: '{{available}} de {{total}} resúmenes de clase disponibles' },

  // ── library.stats.* — stats panel (interpolated counts) ────────────────────
  'library.stats.title':            { he: 'סטטיסטיקות הספרייה',     en: 'Library stats',                  es: 'Estadísticas de la biblioteca' },
  'library.stats.totalItems':       { he: '{{n}} פריטים בסך הכל',    en: '{{n}} items in total',           es: '{{n}} elementos en total' },
  'library.stats.readableItems':    { he: '{{n}} פריטי תוכן זמינים', en: '{{n}} available content items',  es: '{{n}} elementos de contenido disponibles' },
  'library.stats.booksCount':       { he: '{{n}} ספרי AI',            en: '{{n}} AI books',                 es: '{{n}} libros de IA' },
  'library.stats.coursesCount':     { he: '{{n}} קורסי AI',           en: '{{n}} AI courses',               es: '{{n}} cursos de IA' },
  'library.stats.lessonsCount':     { he: '{{n}} סיכומי שיעור',       en: '{{n}} lesson summaries',         es: '{{n}} resúmenes de clase' },
  'library.stats.seriesCount':      { he: '{{n}} סדרות',             en: '{{n}} series',                   es: '{{n}} series' },
  'library.stats.articlesCount':    { he: '{{n}} מאמרים',            en: '{{n}} articles',                 es: '{{n}} artículos' },
  'library.stats.lessonsAvailable': { he: '{{available}} מתוך {{total}} סיכומי שיעור זמינים', en: '{{available}} of {{total}} lesson summaries available', es: '{{available}} de {{total}} resúmenes de clase disponibles' },
  'library.stats.courseProgressTitle': { he: 'סיכומי קורס מהנדס AI', en: 'AI Engineer Course Summaries', es: 'Resúmenes del curso de Ingeniero de IA' },
  'library.stats.readingMinutes':   { he: '{{n}} דקות קריאה',        en: '{{n}} reading minutes',          es: '{{n}} minutos de lectura' },
  'library.stats.words':            { he: '{{n}} מילים',              en: '{{n}} words',                    es: '{{n}} palabras' },
  'library.stats.updatedRecently':  { he: 'עודכן לאחרונה {{when}}',   en: 'Updated {{when}}',               es: 'Actualizado {{when}}' },

  // ── library.stats.* — new keys for the rewritten LibraryStatsPanel ─────────
  'library.stats.yourLibrary':          { he: 'הספריה שלך',     en: 'Your Library',         es: 'Tu biblioteca' },
  'library.stats.itemsInLibrary':       { he: 'פריטים בספרייה',  en: 'Items in library',     es: 'Elementos en la biblioteca' },
  'library.stats.label.books':          { he: 'ספרים',          en: 'Books',                es: 'Libros' },
  'library.stats.label.courses':        { he: 'קורסים',         en: 'Courses',              es: 'Cursos' },
  'library.stats.label.lessons':        { he: 'שיעורים',        en: 'Lessons',              es: 'Lecciones' },
  'library.stats.label.series':         { he: 'סדרות',          en: 'Series',               es: 'Series' },
  'library.stats.label.articles':       { he: 'מאמרים',         en: 'Articles',             es: 'Artículos' },
  'library.stats.courseSummariesTitle': { he: 'סיכומי קורס {{courseName}}', en: 'Course summaries: {{courseName}}', es: 'Resúmenes del curso: {{courseName}}' },
  'library.stats.viewAll':              { he: 'צפה בכל הפריטים', en: 'View all items',       es: 'Ver todos los elementos' },

  // ── library.core.* — Knowledge Core widget (live library core) ─────────────
  'library.core.title':    { he: 'מרחב הידע שלך',       en: 'Your Knowledge Space',    es: 'Tu espacio de conocimiento' },
  'library.core.subtitle': { he: 'פריטים מחוברים',      en: 'Connected items',         es: 'Elementos conectados' },
  'library.core.all':      { he: 'כל הפריטים',          en: 'All items',               es: 'Todos los elementos' },
  'library.core.cta':      { he: 'כניסה למרחב הספרייה', en: 'Enter the library space', es: 'Entrar al espacio de la biblioteca' },

  // ── library.atlas.* — Knowledge Atlas overlay (alternative all-items view) ──
  'library.atlas.eyebrow':           { he: 'אטלס הידע',              en: 'Knowledge Atlas',            es: 'Atlas del conocimiento' },
  'library.atlas.searchPlaceholder': { he: 'חיפוש במרחב הידע',       en: 'Search the knowledge space',  es: 'Buscar en el espacio de conocimiento' },
  'library.atlas.searchLabel':       { he: 'חיפוש פריטים',           en: 'Search items',               es: 'Buscar elementos' },
  'library.atlas.filterAll':         { he: 'הכל',                    en: 'All',                        es: 'Todo' },
  'library.atlas.filterLabel':       { he: 'סינון לפי סוג',          en: 'Filter by type',             es: 'Filtrar por tipo' },
  'library.atlas.count':             { he: '{{n}} פריטים',           en: '{{n}} items',                es: '{{n}} elementos' },
  'library.atlas.empty':             { he: 'לא נמצאו פריטים תואמים',  en: 'No matching items found',     es: 'No se encontraron elementos' },

  // ── library.recommendation.* — recommendation strip ────────────────────────
  'library.recommendation.forYou':            { he: 'מומלץ עבורך',                       en: 'Recommended for you',                 es: 'Recomendado para ti' },
  'library.recommendation.basedOnYourLibrary':{ he: 'על בסיס הספרייה שלך',               en: 'Based on your library',                es: 'Basado en tu biblioteca' },
  'library.recommendation.becauseRelatedTo':  { he: 'כי זה קשור ל"{{title}}"',           en: 'Because it is related to "{{title}}"',  es: 'Porque está relacionado con "{{title}}"' },
  'library.recommendation.more':              { he: 'עוד המלצות',                         en: 'More recommendations',                  es: 'Más recomendaciones' },
  'library.recommendation.none':              { he: 'עדיין אין המלצות. ככל שמרחב הידע יתרחב, המלצות יופיעו כאן.', en: 'No recommendations yet. As the knowledge space grows, recommendations will appear here.', es: 'Aún no hay recomendaciones. A medida que el espacio de conocimiento crezca, aparecerán aquí.' },

  // ── library.action.* — AI assistant toolbar ────────────────────────────────
  'library.action.aiAssistant':       { he: 'עוזר AI',                       en: 'AI assistant',                  es: 'Asistente IA' },
  'library.action.bookmarks':         { he: 'סימניות',                        en: 'Bookmarks',                     es: 'Marcadores' },
  'library.action.history':           { he: 'היסטוריה',                       en: 'History',                       es: 'Historial' },
  'library.action.openAssistant':     { he: 'פתח עוזר AI',                    en: 'Open AI assistant',             es: 'Abrir asistente IA' },
  'library.action.closeAssistant':    { he: 'סגור עוזר AI',                   en: 'Close AI assistant',            es: 'Cerrar asistente IA' },
  'library.action.askAboutItem':      { he: 'שאל על הפריט הזה',              en: 'Ask about this item',           es: 'Preguntar sobre este elemento' },
  'library.action.summarizeArticle':  { he: 'סכם את המאמר הזה',              en: 'Summarize this article',        es: 'Resumir este artículo' },
  'library.action.findRelated':       { he: 'מצא פריטים קשורים',             en: 'Find related items',            es: 'Encontrar elementos relacionados' },
  'library.action.whatNext':          { he: 'מה כדאי לי לקרוא עכשיו',         en: 'What should I read next',       es: 'Qué debería leer a continuación' },

  // ── library.search.* — search affordances ──────────────────────────────────
  'library.search.placeholder':   { he: 'חפש בספרייה',                en: 'Search the library',         es: 'Buscar en la biblioteca' },
  'library.search.results':       { he: 'תוצאות חיפוש',               en: 'Search results',             es: 'Resultados de búsqueda' },
  'library.search.resultsFor':    { he: 'תוצאות עבור "{{q}}"',         en: 'Results for "{{q}}"',        es: 'Resultados para "{{q}}"' },
  'library.search.noResults':     { he: 'לא נמצאו תוצאות',             en: 'No results',                  es: 'Sin resultados' },
  'library.search.tryAnother':    { he: 'נסה חיפוש אחר',               en: 'Try another search',          es: 'Prueba otra búsqueda' },
  'library.search.clear':         { he: 'נקה חיפוש',                   en: 'Clear search',                es: 'Limpiar búsqueda' },

  // ── library.coreSearch.* — mobile Core Search Mode ─────────────────────────
  // Tap-the-core search affordance: a small luminous trigger anchored at
  // the visual centre of the galaxy expands into a glass input. Typing
  // pulls matching orbit cards inward and fades non-matches outward.
  'library.coreSearch.hint':           { he: 'הקש על הליבה כדי לחפש',      en: 'Tap the Core to search',      es: 'Toca el núcleo para buscar' },
  'library.coreSearch.placeholder':    { he: 'חפש במרחב הידע',              en: 'Search the knowledge space',  es: 'Buscar en el espacio de conocimiento' },
  'library.coreSearch.openAria':       { he: 'פתח חיפוש דרך הליבה',         en: 'Open core search',            es: 'Abrir búsqueda del núcleo' },
  'library.coreSearch.closeAria':      { he: 'סגור חיפוש',                  en: 'Close search',                es: 'Cerrar búsqueda' },
  'library.coreSearch.clearAria':      { he: 'נקה טקסט חיפוש',              en: 'Clear search text',           es: 'Limpiar texto de búsqueda' },
  'library.coreSearch.noMatches':      { he: 'אין פריטים תואמים',           en: 'No matching items',           es: 'No hay elementos coincidentes' },

  // ── library.empty.* — empty states per content kind ────────────────────────
  'library.empty.items':       { he: 'עדיין אין פריטים. תכנים שעוברים עיבוד ב-BookForge יופיעו כאן ברגע שיהיו מוכנים.', en: 'No items yet. Content processed by BookForge will appear here once it is ready.',                  es: 'Aún no hay elementos. Los contenidos procesados por BookForge aparecerán aquí en cuanto estén listos.' },
  'library.empty.articles':    { he: 'עדיין אין מאמרים',                                              en: 'No articles yet',                                                              es: 'Aún no hay artículos' },
  'library.empty.series':      { he: 'עדיין אין סדרות',                                               en: 'No series yet',                                                                es: 'Aún no hay series' },
  'library.empty.processing':  { he: 'אין כרגע פריטים בעיבוד',                                       en: 'No items currently processing',                                                es: 'No hay elementos en proceso ahora' },
  'library.empty.failed':      { he: 'אין פריטים שנכשלו',                                            en: 'No failed items',                                                              es: 'No hay elementos fallidos' },

  // ── library.a11y.* — aria labels (no visible text) ─────────────────────────
  'library.a11y.mainRegion':            { he: 'אזור הספרייה הראשי',          en: 'Library main region',           es: 'Región principal de la biblioteca' },
  'library.a11y.searchInput':           { he: 'שדה חיפוש בספרייה',           en: 'Library search input',          es: 'Campo de búsqueda de la biblioteca' },
  'library.a11y.openFilters':           { he: 'פתח מסננים',                   en: 'Open filters',                  es: 'Abrir filtros' },
  'library.a11y.closeFilters':          { he: 'סגור מסננים',                  en: 'Close filters',                 es: 'Cerrar filtros' },
  'library.a11y.openAssistant':         { he: 'פתח את עוזר ה-AI',             en: 'Open AI assistant',             es: 'Abrir asistente IA' },
  'library.a11y.closeAssistant':        { he: 'סגור את עוזר ה-AI',            en: 'Close AI assistant',            es: 'Cerrar asistente IA' },
  'library.a11y.carouselNext':          { he: 'הבא בקרוסלה',                  en: 'Next in carousel',              es: 'Siguiente en el carrusel' },
  'library.a11y.carouselPrev':          { he: 'הקודם בקרוסלה',                en: 'Previous in carousel',          es: 'Anterior en el carrusel' },
  'library.a11y.selectItem':            { he: 'בחר פריט',                     en: 'Select item',                   es: 'Seleccionar elemento' },
  'library.a11y.openItem':              { he: 'פתח פריט',                     en: 'Open item',                     es: 'Abrir elemento' },
  'library.a11y.bookmarkItem':          { he: 'סמן פריט בסימנייה',            en: 'Bookmark item',                 es: 'Marcar elemento' },
  'library.a11y.recommendationCarousel':{ he: 'קרוסלת המלצות',                en: 'Recommendation carousel',       es: 'Carrusel de recomendaciones' },
  'library.a11y.continueReadingCard':   { he: 'כרטיס המשך קריאה',             en: 'Continue reading card',         es: 'Tarjeta de continuar leyendo' },
  'library.a11y.libraryStatsPanel':     { he: 'פאנל סטטיסטיקות הספרייה',      en: 'Library stats panel',           es: 'Panel de estadísticas de la biblioteca' },

  // ── library.mobile.* — mobile-only UI ──────────────────────────────────────
  'library.mobile.openMenu':          { he: 'פתח תפריט ספרייה',         en: 'Open library menu',         es: 'Abrir menú de biblioteca' },
  'library.mobile.closeMenu':         { he: 'סגור תפריט ספרייה',        en: 'Close library menu',        es: 'Cerrar menú de biblioteca' },
  'library.mobile.openQuickActions':  { he: 'פתח פעולות מהירות',        en: 'Open quick actions',        es: 'Abrir acciones rápidas' },
  'library.mobile.closeQuickActions': { he: 'סגור פעולות מהירות',       en: 'Close quick actions',       es: 'Cerrar acciones rápidas' },
  'library.mobile.swipeToBrowse':     { he: 'החלק כדי לעיין',             en: 'Swipe to browse',           es: 'Desliza para explorar' },
  'library.mobile.showFilters':       { he: 'הצג מסננים',                  en: 'Show filters',              es: 'Mostrar filtros' },
  'library.mobile.hideFilters':       { he: 'הסתר מסננים',                 en: 'Hide filters',              es: 'Ocultar filtros' },
};