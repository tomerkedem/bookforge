// Design System Types
export interface DesignSystem {
  platform: string;
  version: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  components: ComponentSpecs;
  breakpoints: Breakpoints;
  rtl: DirectionalConfig;
  ltr: DirectionalConfig;
  features: Features;
  rules: DesignRules;
}

export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  neutral: NeutralColors;
}

export interface ColorScale {
  main: string;
  light: string;
  lighter: string;
  lightest: string;
}

export interface NeutralColors {
  background: string;
  surface: string;
  surface_alt: string;
  text_primary: string;
  text_secondary: string;
  text_tertiary: string;
  text_muted: string;
  border_subtle: string;
  border_normal: string;
  border_strong: string;
  divider: string;
}

export interface Typography {
  fontFamily: {
    heading: string;
    body: string;
    code: string;
  };
  sizes: {
    h1: TypographySize;
    h2: TypographySize;
    h3: TypographySize;
    body_large: TypographySize;
    body_normal: TypographySize;
    quote: TypographySize;
  };
}

export interface TypographySize {
  size: string;
  line_height: number;
  weight: number;
}

export interface Spacing {
  mobile: SpacingScale;
  tablet: SpacingScale;
  desktop: SpacingScale;
}

export interface SpacingScale {
  padding_x: string;
  padding_y: string;
  gap_section: string;
}

export interface ComponentSpecs {
  book_card: BookCardSpec;
  reading_page: ReadingPageSpec;
  language_toggle: LanguageToggleSpec;
  header: HeaderSpec;
}

export interface BookCardSpec {
  background: string;
  padding: string;
  thumbnail_height: string;
  title_size: string;
  title_weight: number;
  description_size: string;
}

export interface ReadingPageSpec {
  max_width: string;
  paragraph_size: string;
  paragraph_line_height: number;
  heading_size: string;
  blockquote_border: string;
  blockquote_size: string;
}

export interface LanguageToggleSpec {
  border_radius: string;
  padding: string;
  button_padding: string;
}

export interface HeaderSpec {
  position: string;
  height: string;
  background: string;
  backdrop_filter: string;
}

export interface Breakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
}

export interface DirectionalConfig {
  languages: string[];
  direction: 'rtl' | 'ltr';
  text_align: 'right' | 'left';
}

export interface Features {
  reading_progress: Feature;
  share_quote: Feature;
  multi_language: MultiLanguageFeature;
}

export interface Feature {
  description: string;
  display?: string;
  output_format?: string;
}

export interface MultiLanguageFeature extends Feature {
  enabled: boolean;
  languages: string[];
  toggle_location: string;
}

export interface DesignRules {
  color_palette: string;
  max_colors: number;
  forbidden: string[];
  required_fonts: string[];
  accessibility: string;
}

// Content Types
export interface Book {
  titles: Record<string, string>;      // { he: '...', en: '...', fr: '...' }
  subtitles: Record<string, string>;
  descriptions: Record<string, string>;
  chapters: Chapter[];
  total_chapters: number;
  total_sections: number;
  has_images: boolean;
  total_word_count: number;
  languages: string[];
  book_type: string;
  primary_focus: string;
}

export interface Chapter {
  id: number | string;
  file_slug?: string;
  type?: 'intro' | 'content' | 'cover';
  titles: Record<string, string>;      // { he: '...', en: '...', fr: '...' }
  sections: number;
  has_images: boolean;
  word_count: number;
  topics: string[];
}

// Application Types
// Language codes are dynamic strings - validated at runtime against SUPPORTED_LANGUAGES
export type Language = string;
export type LanguageName = string;

export interface LanguageMeta {
  code: string;          // 'he', 'en', 'fr', etc.
  label: string;         // native label, e.g. "עברית", "English", "Français"
  labelEn: string;       // English name
  dir: 'rtl' | 'ltr';
  locale: string;        // BCP 47 locale, e.g. 'he-IL', 'en-US', 'fr-FR'
}

export interface LanguageContext {
  current: Language;
  direction: 'rtl' | 'ltr';
  textAlign: 'right' | 'left';
  label: LanguageName;
}

export interface ReadingProgress {
  bookId: string;
  chapterId: number | string;
  scrollPosition: number;
  lastUpdated: number;
}

export interface BookMetadata {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  dominantColor: string;
  chapters: Chapter[];
}

export interface NavigationItem {
  href: string;
  label_he: string;
  label_en: string;
  ariaLabel: string;
}
