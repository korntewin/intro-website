# Korntewin — Portfolio (Next.js static export for GitHub Pages)

## Quick start

```bash
# 1) Install deps
npm install

# 2) Set base path (repo name) when deploying to gh-pages
#   For <user>.github.io/<repo>: export NEXT_PUBLIC_BASE_PATH=<repo>
#   For <user>.github.io root: leave empty

# 3) Develop
npm run dev

# 4) Build & export static site
npm run build   # outputs to ./out

# 5) Preview the exported static site
npm run preview
```

## Deploy to GitHub Pages

You can deploy the `out/` folder to the `gh-pages` branch using the Pages UI or an Action like `peaceiris/actions-gh-pages`. Example workflow:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: "./out" }
      - uses: actions/deploy-pages@v4
```

### Notes

- Static export is enabled via `output: 'export'` (see `next.config.ts`).
- `images.unoptimized = true` for GH Pages.
- Set `NEXT_PUBLIC_BASE_PATH` environment variable to your repo name when deploying to a project page. For user/organization pages, leave it empty.
- All content is driven from `lib/data.ts` — edit once, reflected everywhere.
- No server-side rendering (pure static). Works on GH Pages/CDN.

## Customize

- Replace links in `lib/data.ts` with your repos and articles.
- Add images to `/public` and reference via `project.image` or `highlights.image`.
- Tweak colors/spacing via Tailwind.

---

# Usage Tips

- Keep highlights short and visual. The carousel auto-advances every 3.5s.
- Use the Career Timeline for story-telling: key outcomes, scale, and stack badges.
- Add a `/uses` page (tools, editor, dotfiles) if you like — duplicate `about/page.tsx`.
