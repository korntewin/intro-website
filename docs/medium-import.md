# Import this Astro article to Medium

Medium's import tool processes the published HTML through a third-party service and may miss images, particularly when the source uses site-relative paths or SVG assets. This article uses absolute HTTPS PNG image URLs instead.

## Workflow

1. Run `npm install` followed by `npm run build`. The build creates PNG copies of every editable SVG in `public/blog/figures/`.
2. Merge and deploy the GitHub Pages site. Check that `https://korntewin.github.io/intro-website/blog/figures/production-timeseries-dashboard.png` and `https://korntewin.github.io/intro-website/blog/figures/arrow-validity-large-list.png` load publicly as PNG.
3. Use Medium **Stories > Import a story**, with the live article URL: https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/
4. Preview the imported draft and verify that all 14 article images were transferred. The import service is best effort and Medium may omit images despite the PNG URLs.
5. If Medium drops an image, save that public PNG and upload it manually in the Medium editor. Medium's editor supports JPEG, PNG and GIF, up to 25 MB each.
6. Check the canonical URL and formatting before publishing. Medium normally adds the source canonical link on automatic import.

## Why not SVG?

SVG works well on GitHub Pages, but Medium's official image upload formats do not include SVG. Absolute PNG URLs avoid relative-path resolution problems and are easier for Medium's importer to fetch. SVGs remain the single editable source in the repository, while PNG copies are generated for publishing.

References:
- https://help.medium.com/hc/en-us/articles/214550207-Importing-a-post-to-Medium
- https://help.medium.com/hc/en-us/articles/360033931713-Trouble-importing-content-using-the-import-tool
- https://help.medium.com/hc/en-us/articles/215679797-Using-images
