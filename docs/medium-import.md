# Publishing the RIIR article on Medium

## Static HTML structure

The article uses a build-time Rehype transform and an Astro layout, not browser JavaScript, to generate:

```html
<article aria-labelledby="post-title" itemscope itemtype="https://schema.org/BlogPosting">
  <h1 id="post-title">Article title</h1>
  <p><time datetime="2026-10-23">2026-10-23</time></p>
  <p>Article introduction</p>
  <figure>
    <img src="https://korntewin.github.io/intro-website/blog/figures/riir-cover.png"
         alt="Article cover" loading="eager" width="1800" height="763">
    <figcaption>Article cover</figcaption>
  </figure>
  <!-- All remaining paragraphs and figures are in this same article. -->
</article>
```

Image dimensions are read from the generated PNG headers; the dimensions above illustrate the HTML shape. The real page contains 14 figures, each with an absolute HTTPS PNG source, width, height, alt text and a caption. There are no image-only paragraph wrappers, lazy source placeholders, or JavaScript-dependent article content. Navigation, the theme switch and the reading-progress component remain outside the article.

The existing PNG URLs were already absolute before this change. Relative URLs or lazy loading were therefore not established as the cause of the reported import failure. The additional semantic markup makes the page easier to extract, but we cannot confirm Medium's internal parser rules or guarantee a successful import.

## Tables

The two Markdown comparison tables remain editable in the source. The build emits their six data rows as labeled paragraphs with line breaks and preserves all values and inline formatting. This keeps the comparisons readable without requiring the destination editor to retain HTML tables. Charts remain unchanged.

## Canonical URL and metadata

The page includes an absolute canonical link, Open Graph article metadata, and an ISO publication date inside the article. The title and all figures are direct children of the same article container.

## Re-import after deployment

1. Merge and deploy the HTML fix before trying the importer again.
2. Open https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/ and use **View Page Source**, not just the live DOM, to check for `<article>`, `<figure>`, and `loading="eager"`.
3. Use Medium **Stories > Import a story** with that same article URL and review the new draft.
4. Check that all 14 figures, comparison paragraphs, Thai text and code blocks are present. Check the canonical link in the draft settings.

Do not assume that retrying an older image-less draft re-fetches the updated HTML. A fresh import is the appropriate test of the newly deployed source.

## Fallback if Medium still rejects an image

Medium documents that its import tool uses a third-party service and can fail to interpret a page. Copying the rendered article into a draft may help, but it does not guarantee that images will upload.

The build still provides [all 14 PNGs in one ZIP](https://korntewin.github.io/intro-website/blog/medium-images.zip), numbered in reading order. Upload missing PNGs directly through Medium's image control, one at a time. For a manually created draft, set the canonical link to the original article URL before publication.

## Regression checks

- `npm test`: checks project-subpath URL resolution, raster-format validation, static figures, eager loading, dimensions, captions, comparison data preservation and unrelated-page isolation.
- `npm run build`: runs those tests, rasterizes PNGs, creates the ZIP, builds Astro, then checks the actual generated HTML with Parse5.
- `npm run check:blog-html`: reruns the generated-HTML checks without rebuilding.

The HTML check verifies one article and title, direct figure children, canonical metadata, eager absolute PNG URLs, PNG file signatures and dimensions, all source images, all table-row values, and the absence of tables or hydrated components inside the article. Both existing GitHub Actions workflows call `npm run build`, so both run these checks without changing the workflow YAML.

References:
- https://help.medium.com/hc/en-us/articles/214550207-Importing-a-post-to-Medium
- https://help.medium.com/hc/en-us/articles/360033931713-Trouble-importing-content-using-the-import-tool
- https://help.medium.com/hc/en-us/articles/215679797-Using-images
