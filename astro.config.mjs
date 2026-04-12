import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import { cpSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

/** Copy output/{book}/assets/ → public/{book}/assets/ before build */
function copyBookAssets() {
  return {
    name: 'copy-book-assets',
    hooks: {
      'astro:config:setup'() {
        const outputDir = resolve('output');
        if (!existsSync(outputDir)) return;
        for (const book of readdirSync(outputDir)) {
          const src = resolve(outputDir, book, 'assets');
          if (existsSync(src)) {
            const dest = resolve('public', book, 'assets');
            cpSync(src, dest, { recursive: true });
          }
        }
      },
    },
  };
}

export default defineConfig({
  integrations: [tailwind(), copyBookAssets()],
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
