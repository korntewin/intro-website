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

Article figures are stored as SVG sources or original PNG illustrations in `public/blog/figures/`. Running `npm run dev` or `npm run build` automatically generates PNG copies of the SVGs via `scripts/render-blog-images.mjs`; original PNG illustrations are used directly. The sccache CI illustration's generation prompt is saved in `docs/image-prompts/sccache-ci.txt`. Open the [local blog](http://localhost:4321/intro-website/blog/) after running `npm run dev` to see the figures from your checkout. Production HTML uses absolute HTTPS PNG URLs and exposes the complete body as `e-content` for article extractors.

`npm run build` also generates a [plain Medium import view](https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/medium/) from the finished article HTML. Use that URL in Medium's **Import a story**. It contains the same text and all article images using simple image paragraphs, with the original article as its canonical URL. The import view is generated after the production build, so use `npm run preview` to inspect it locally.

The [RIIR image ZIP](https://korntewin.github.io/intro-website/blog/medium-images.zip) remains available for direct uploads if Medium's third-party importer still drops an image. See `docs/medium-import.md` for the verified diagnosis, checks, and import instructions.

The “Why Rust” section includes an editable three-region landscape showing applied ML with Python, Go web services, and the Prediction Service Direction toward Rust/native ML optimization. Its source is `public/blog/figures/lmwn-ml-web-landscape.svg`.

The bilingual [sccache guide](https://korntewin.github.io/intro-website/blog/sccache-rust-build-cache/) also has [Thai](https://korntewin.github.io/intro-website/blog/sccache-rust-build-cache/medium/th/) and [English](https://korntewin.github.io/intro-website/blog/sccache-rust-build-cache/medium/en/) Medium-ready views and an [ordered image pack](https://korntewin.github.io/intro-website/blog/sccache-rust-build-cache/medium-images.zip). Each article gets its own image pack; the original `/blog/medium-images.zip` remains available.
