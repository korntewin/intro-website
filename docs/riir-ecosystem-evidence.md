# Evidence for the RIIR ML/web landscape

## What the figures represent

`public/blog/figures/lmwn-ml-web-landscape.svg` is a conceptual map of the author's stated LMWN context: applied ML with Python in the upper left, web/backend services mainly in Go on the right, and increasing native ML optimization work with Rust, C and C++ in the lower left. Region sizes do not encode counts or market share. Languages can serve more than one region, and adding a native layer complements existing Python workflows and web services.

`public/blog/figures/riir-ecosystem-counts.svg` is an exact-value table of selected GitHub topic queries. It supplies a limited, dated ecosystem indicator, not evidence of LMWN's internal language distribution or a performance benchmark.

Both editable SVGs pass through the existing `scripts/render-blog-images.mjs` pipeline. The article references the resulting absolute HTTPS PNG URLs, and the ordered Medium ZIP includes both figures.

## GitHub snapshot

Source: [GitHub REST API, Search repositories](https://docs.github.com/en/rest/search/search#search-repositories).

Collection window: **23 October 2026, 12:38:48–12:40:01 Asia/Bangkok** (05:38:48–05:40:01 UTC). The timestamps retained for individual queries are the API response timestamps.

The published [snapshot JSON](../public/blog/data/riir-ecosystem-2026-10-23.json) records each exact query, `total_count`, `incomplete_results`, timestamp, API URL, public search URL, and one example repository from the response. This is a response excerpt, not a full listing of matching repositories.

| Language filter | `topic:machine-learning` | `topic:web-development` |
| --- | ---: | ---: |
| Python | 88,929 | 1,495 |
| Rust | 1,224 | 104 |
| Go | 739 | 110 |
| C | 920 | 57 |
| C++ | 2,640 | 67 |

Every query uses the same filters:

```text
topic:{topic} language:{language} archived:false fork:false is:public
```

Each request used `per_page=1`; the reported number is the response's **`total_count`**, not the number of items on the page. All ten responses returned **`incomplete_results: false`**. The API's 1,000-result retrieval limit is not used as the total count.

To repeat a query, open the corresponding `api_url` or `search_url` in the JSON. Search results can change, so a future count should be saved as a new dated snapshot rather than silently replacing this historical figure.

### Interpretation limits

- [Repository administrators choose their topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics). Untagged projects are absent, and the two topics can overlap. The count can include educational projects and infrastructure alongside application libraries.
- [Language filters classify repository code](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories#search-by-language). A project with a Python-facing API may appear under its native implementation language. `Jupyter Notebook` is a separate language and is not included here.
- These are five selected languages, not an exhaustive language ranking. The two topics cover different, incomplete populations, so neither a domain's market share nor the relative sizes of all ML and web development can be derived from the table.
- Repositories are not equivalent to production applications, packages, users, contributors, or maintained libraries. `archived:false` does not establish recent activity or quality.
- Neither topic distinguishes applied ML from native ML optimization. The lower-left region is supported by implementation examples below.
- No private LMWN repositories were queried. The company context comes from the author's description.
- `incomplete_results: false` means GitHub did not mark that search incomplete; it does not remove indexing and tagging limitations.

## Developer surveys

The survey results describe respondents' work, and must not be plotted on the same scale as repository counts or interpreted as shares of all software projects.

| Primary source | Figure used in the article | Population and date |
| --- | --- | --- |
| [PSF / JetBrains Python Developers Survey 2024](https://lp.jetbrains.com/python-developers-survey-2024/) and the publisher's [chart explanation](https://blog.jetbrains.com/pycharm/2025/08/the-state-of-python-2025/) | 41% use Python for machine learning | Overall result, including main and secondary Python users; responses collected October–November 2024. The methodology reports more than 25,000 cleaned responses overall, but no exact denominator is claimed here for this individual question. |
| [PSF / JetBrains Python Developers Survey 2024, Python Packaging section](https://lp.jetbrains.com/python-developers-survey-2024/) | 17% build Python binary modules; within that builder group, C++ 54%, C 45%, Rust 33%, Go 10% | The language question is conditional on building binary modules and allows multiple languages. It is not restricted to ML extensions. No exact question-specific sample size is claimed. |
| [Go Developer Survey 2025](https://go.dev/blog/survey2025), [original chart SVG](https://go.dev/blog/survey2025/build.svg) | 73% build API/RPC services; 46% build websites/web services returning HTML | This question has n = 2,502 and allows multiple selections. Survey fieldwork was September 2025; the report was published 21 January 2026. The whole cleaned survey has 5,379 responses, which is not this question's denominator. |

The Python main-language-only breakdown has a different ML value (42%); the article intentionally uses the overall 41% result. Percentages from different surveys must not be added or treated as a controlled cross-language comparison. They are labeled by survey year rather than claimed to be the latest available measurements.

For Python binary modules, the official survey's 2024 C++ value is 54%; 55% belongs to 2023. The accompanying blog's image description says 55%, so the official results table is used for this metric. The 33% Rust and 10% Go figures describe respondents to the binary-module language question, not all Python developers or shares of projects.

## Native-layer implementation examples

| Project | Primary source | Supported claim |
| --- | --- | --- |
| Polars | [User guide](https://docs.pola.rs/) | Rust core with a Python interface. |
| Hugging Face Tokenizers | [Official documentation](https://huggingface.co/docs/tokenizers/en/index) | Rust implementation for tokenization used by Transformers. |
| PyO3 / maturin | [PyO3](https://pyo3.rs/), [maturin](https://www.maturin.rs/) | Rust/Python interoperability and packaging support, preserving the article's existing rationale. |
| NumPy | [C internals](https://numpy.org/doc/stable/dev/internals.code-explanations.html) | C array implementation with memory and stride handling. |
| PyTorch | [C++ frontend](https://docs.pytorch.org/cppdocs/frontend.html) | C++ tensor computation and Python interoperability. Its documentation explains that Python already delegates computationally expensive operations to C++. |

These examples demonstrate established layers and interfaces. They do not prove that rewriting an arbitrary Python or Go application in Rust will improve performance. The article's production measurements remain the evidence for the author's particular workload.
