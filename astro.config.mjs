import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import rehypeBlogHtml from './scripts/rehype-blog-html.mjs';

const site = 'https://korntewin.github.io';
const base = '/intro-website';

const blogHtml = {
  name: 'blog-html',
  hooks: {
    'astro:config:setup': ({ command, updateConfig }) => {
      updateConfig({
        markdown: {
          rehypePlugins: [[rehypeBlogHtml, { site, base, localFigures: command === 'dev' }]],
        },
      });
    },
  },
};

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [svelte(), blogHtml],
});
