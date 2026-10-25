# Publishing the bilingual RIIR article on Medium

## Choose a language

The website has a TH / EN switch on both the blog listing and each article page. Thai retains the original article URL; English has its own.

| Language | Article to read | Clean Medium import |
| --- | --- | --- |
| **Thai (TH)** | https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/ | https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/medium/th/ |
| **English (EN)** | https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/en/ | https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/medium/en/ |

Use the appropriate language-specific URL in Medium's **Stories > Import a story**.

Each export page contains only that language's article and preserves its own canonical article URL. The import page is marked with robots noindex,follow and has no language switch, website navigation, styles from the site, or client scripts.

The original https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/medium/ remains a **Thai import alias** for compatibility. For a fresh Medium import, use one of the explicit language URLs to avoid a previous URL's cache.

The editable source files are:
- Thai: src/pages/blog/riir-rust-prediction-service.md
- English: src/pages/blog/riir-rust-prediction-service/en.md

The English version is a full translation of the Thai engineering story in the same conversational style. Both use the same diagrams, screenshots and benchmark figures in the same order.

## How the importer works

The build reads each rendered article and creates the clean export HTML through scripts/build-medium-import.mjs. It preserves the selected article's title, date, summary, paragraphs, links, code, figures, captions and comparison values.

The rendered content uses a complete h-entry / e-content body. The plain export replaces figure wrappers with image paragraphs, for example:

~~~html
<p><img src="https://korntewin.github.io/intro-website/blog/figures/riir-cover.png"
        alt="Article cover" width="1800" height="763"></p>
<p><em>Article cover</em></p>
~~~

Image URLs are absolute HTTPS PNGs with explicit dimensions. The **16 images used by both articles** are rasterized from existing SVGs. Both languages reference the same figures in the same order, including the cluster-capacity projection at the end. The Medium image ZIP contains all 16 images in article reading order.

If Medium misses images, the [PNG image pack](https://korntewin.github.io/intro-website/blog/medium-images.zip) lets you upload them individually to the correct positions in the draft.

## Verification

Run npm run build. It:
1. Runs npm test.
2. Rasterizes figures, checks the Thai and English articles use the same image references, and creates their shared image ZIP.
3. Builds both Astro article pages.
4. Generates the TH and EN import URLs plus the original Thai alias.
5. Runs npm run check:blog-html to verify language tags, article metadata, both canonicals, image order, full content, captions, code whitespace and matching import content.

The PR validation workflow checks that the two article URLs and both import pages are generated.

Passing these tests proves that our HTML is complete; it **does not guarantee Medium's private importer will preserve everything**. After deployment, try a fresh Medium import for each language and check the figures, tables, and code snippets.

References:
- https://microformats.org/wiki/h-entry
- https://docs.embed.ly/reference/extract
- https://help.medium.com/hc/en-us/articles/214550207-Importing-a-post-to-Medium
- https://help.medium.com/hc/en-us/articles/360033931713-Trouble-importing-content-using-the-import-tool
- https://help.medium.com/hc/en-us/articles/215679797-Using-images
