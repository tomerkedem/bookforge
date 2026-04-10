import { resolve } from 'node:path';

/** Centralized paths — single source of truth for all file-system locations */
export const PATHS = {
  OUTPUT_DIR: resolve('output'),
  PUBLIC_DIR: resolve('public'),
} as const;

/** Layout dimensions used across components (CSS and JS) */
export const LAYOUT = {
  HEADER_HEIGHT: '64px',
  SIDEBAR_WIDTH: '320px',
} as const;
