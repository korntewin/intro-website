import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://korntewin.github.io',
  base: '/intro-website',
  output: 'static',
  integrations: [svelte()],
});
