# Korntewin portfolio

Static portfolio and Thai engineering blog, powered by **Astro + Svelte** and deployed on GitHub Pages.

## Start

```bash
npm ci
npm run dev
npm run build
npm run preview
```

Site base path is `/intro-website/`; GitHub Pages deploys `dist/` to `gh-pages` on pushes to `main`.

Routes: `/`, `/about/`, `/career/`, `/projects/`, `/blog/`, `/blog/riir-rust-prediction-service/`.

Long-form content is Markdown under `src/pages/blog/`, with `BlogLayout.astro`. Svelte components live in `src/components/` and hydrate only as needed.

The blog intentionally contains publicly shareable explanations, not internal RFC links, credentials, or production source code.
