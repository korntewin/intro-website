# Korntewin portfolio

Static portfolio and Thai engineering blog, powered by **Astro + Svelte** and deployed on GitHub Pages.

## Start

```bash
npm install
npm run dev
npm run build
npm run preview
```

Site base path is `/intro-website/`; GitHub Pages deploys `dist/` to `gh-pages` on pushes to `main`.

Routes: `/`, `/about/`, `/career/`, `/projects/`, `/blog/`, `/blog/riir-rust-prediction-service/`.

Long-form content is Markdown under `src/pages/blog/`, with `BlogLayout.astro`. Svelte components live in `src/components/` and hydrate only as needed.

The blog intentionally contains publicly shareable explanations, not internal RFC links, credentials, or production source code.

## Blog images and Medium imports

Article figures are stored as SVG sources in `public/blog/figures/`. Running `npm run dev` or `npm run build` automatically generates public PNG copies via `scripts/render-blog-images.mjs`. Article Markdown uses absolute HTTPS PNG URLs. Since Medium's importer can still reject valid images, the build also generates a one-click [14-image ZIP](https://korntewin.github.io/intro-website/blog/medium-images.zip) for manual upload. Check `docs/medium-import.md` for troubleshooting and the manual fallback.
