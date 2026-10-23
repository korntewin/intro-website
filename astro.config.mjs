import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import rehypeBlogHtml from './scripts/rehype-blog-html.mjs';

const site = 'https://korntewin.github.io';
const base = '/intro-website';

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [svelte()],
  markdown: {
    rehypePlugins: [[rehypeBlogHtml, { site, base }]],
  },
});
