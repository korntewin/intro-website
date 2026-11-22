---
layout: ../../../layouts/BlogLayout.astro
language: en
title: "Speeding up Rust builds with sccache"
description: "How compiler caching sped up our Rust CI, with examples you can try locally and in GitLab."
date: 2026-11-14
coverImage: https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png
coverImageAlt: "Cargo, sccache, and rustc working together"
---

![Cargo sends compilation requests through sccache](https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png)

I'd push a small change to our Rust service and watch CI compile the same dependencies again. Cargo could reuse `target/` on my laptop. A fresh runner had to start over.

sccache wraps `rustc` and saves eligible compiler outputs outside `target/`. A fresh runner can reuse those outputs if it has access to the cache, either by restoring a local cache directory or by using remote storage. [sccache documentation](https://github.com/mozilla/sccache/blob/v0.19.0/README.md)

## What gets reused?

With `RUSTC_WRAPPER=sccache`, Cargo sends compiler calls through the sccache server. In v0.19.0, typical Rust library builds can be cached with incremental compilation disabled. Incremental builds and crate types that invoke the system linker, including binaries and procedural macros, bypass the cache. Build scripts and tests still run. [Rust cacheability rules](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Rust.md)

![A cache hit restores compiler outputs. On a miss, sccache runs rustc and can save the result.](https://korntewin.github.io/intro-website/blog/figures/sccache-flow.png)

### What changes the cache key?

sccache asks `rustc` for dependency information, then hashes inputs such as the toolchain, compiler flags, source files, compiled dependencies, relevant environment variables, and working directory. Keep the checkout path stable in CI. [Rust key generation](https://github.com/mozilla/sccache/blob/v0.19.0/src/compiler/rust.rs)

![The cache key combines inputs such as source files, flags, and compiled dependencies](https://korntewin.github.io/intro-website/blog/figures/sccache-key.png)

A hit still takes time to hash inputs, look up the key, and restore outputs. A miss runs the compiler and adds a cache write. Slow dependencies offer the biggest savings.

![A cache hit skips compilation while a miss adds lookup and storage overhead](https://korntewin.github.io/intro-website/blog/figures/sccache-hit-miss.png)

Say you edit `core`. It misses because its source changed. `api` can miss too if it sees a different `.rlib` from `core`. Unrelated crates can still hit, even after a `Cargo.lock` change.

![After an edit to core, unrelated libraries can still hit the cache](https://korntewin.github.io/intro-website/blog/figures/sccache-graph.png)

### How big can the cache get?

When a new entry would exceed `SCCACHE_CACHE_SIZE`, sccache evicts the least recently used entries to make room. If a single build fills the cache, it can evict results you'll need on the next run. Remote storage has its own retention settings. [Local cache settings](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Local.md)

![The local cache evicts its least recently used entries first](https://korntewin.github.io/intro-website/blog/figures/sccache-lru.png)

## Try it locally

Cargo uses `target/` to skip compiling crates whose outputs are still fresh, so a second `cargo build` may leave sccache's counters unchanged. Incremental compilation helps `rustc` reuse work between edits. sccache helps when Cargo needs to compile a crate and the inputs still match a cached result.

![Cargo build outputs, incremental compilation, and sccache reuse work at different stages](https://korntewin.github.io/intro-website/blog/figures/sccache-layers.png)

Install sccache with `brew install sccache` on macOS or follow the release instructions. Use a temporary project and an unused server port for the demo. [Installation guide](https://github.com/mozilla/sccache/blob/v0.19.0/README.md#installation)

```sh
(
  set -e
  demo_root=$(mktemp -d)
  cd "$demo_root"
  cargo new --lib cache-demo
  cd cache-demo
  export SCCACHE_SERVER_PORT=4249
  export SCCACHE_DIR="$demo_root/cache"
  export RUSTC_WRAPPER=sccache
  export CARGO_INCREMENTAL=0
  sccache --start-server
  trap 'sccache --stop-server' EXIT
  cargo build
  sccache --show-stats
  cargo clean
  cargo build
  sccache --show-stats
)
```

The first build should record a miss, and the second should add a hit. `cargo clean` clears the demo's build outputs while the cache lives outside `target/`.

## What changed in our CI

After the same lockfile change in our production Rust prediction service, the old setup ran in **10m 00s** with a cold archive cache. The revised setup ran in **6m 28s** with a warm sccache, saving **3m 32s (35.3%)**. Both runs passed the same tests.

![Pipeline wall time after a lockfile change fell from 10m 00s to 6m 28s](https://korntewin.github.io/intro-website/blog/figures/sccache-lockfile-benchmark.png)

The lockfile change invalidated the old archive key. With sccache, we could still reuse compilations whose inputs matched. We changed other cache settings at the same time, so the result reflects the full CI setup. It's one run per setup on shared autoscaling runners, including startup and cache transfers.

### GitLab CI example

Give `.sccache/` a stable archive key so jobs can reuse entries across lockfile changes. Cache Cargo downloads separately and scope the compiler archive to jobs with compatible targets and flags. This example also caches the pinned sccache binary to avoid rebuilding it on every runner. [GitLab cache documentation](https://docs.gitlab.com/ci/caching/)

```yaml
rust-test:
  image: rust:1
  variables:
    CARGO_HOME: "$CI_PROJECT_DIR/.cargo"
    SCCACHE_DIR: "$CI_PROJECT_DIR/.sccache"
    SCCACHE_CACHE_SIZE: "2G"
    CARGO_INCREMENTAL: "0"
  cache:
    - key: "cargo-downloads-$CI_RUNNER_EXECUTABLE_ARCH"
      paths:
        - .cargo/registry/index/
        - .cargo/registry/cache/
        - .cargo/git/db/
    - key: "sccache-tool-0.19.0-$CI_RUNNER_EXECUTABLE_ARCH"
      paths:
        - .cargo/bin/sccache
    - key: "compiler-$CI_RUNNER_EXECUTABLE_ARCH-$CI_JOB_NAME"
      paths:
        - .sccache/
  script:
    - |
      set -e
      mkdir -p "$CARGO_HOME/bin"
      if ! "$CARGO_HOME/bin/sccache" --version 2>/dev/null | grep -q '^sccache 0\.19\.0$'; then
        cargo install sccache --version 0.19.0 --locked --root "$CARGO_HOME"
      fi
      export RUSTC_WRAPPER="$CARGO_HOME/bin/sccache"
      "$RUSTC_WRAPPER" --start-server
      "$RUSTC_WRAPPER" --zero-stats
      trap 'status=$?; "$RUSTC_WRAPPER" --show-stats || true; "$RUSTC_WRAPPER" --stop-server || true; exit "$status"' EXIT
      cargo test --locked
```

Parallel jobs can overwrite each other's archive uploads if they share a key.

If the build runs in Docker, cargo-chef can reuse a dependency layer when the builder still has it. sccache can reuse compiler outputs when Docker needs to rebuild that layer and the build can reach the cache. [cargo-chef](https://github.com/LukeMathWalker/cargo-chef)

When comparing cold and warm runs, I time the whole job, including install, cache restore and upload, and tests. A big archive can cost more time to transfer than it saves in compilation.
