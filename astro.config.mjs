// @ts-check
import { defineConfig } from 'astro/config';
import remarkPandocBreaks from './plugins/remark-pandoc-breaks.mjs';
import rehypeCvEntries from './plugins/rehype-cv-entries.mjs';

// https://astro.build/config
export default defineConfig({
  // Custom domain served from the root of GitHub Pages, so no `base` is set.
  site: 'https://maharremayar.com',
  output: 'static',

  // Quarto published cv.qmd as /cv.html. Keeping the "file" format builds
  // dist/cv.html, so the existing URL keeps working after the migration.
  build: { format: 'file' },

  markdown: {
    // Content must stay exactly as written: no typographic substitutions
    // (e.g. straight apostrophes turned into curly ones).
    smartypants: false,
    remarkPlugins: [remarkPandocBreaks],
    rehypePlugins: [rehypeCvEntries],
  },
});
