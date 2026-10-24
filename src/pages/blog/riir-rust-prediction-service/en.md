---
layout: ../../../layouts/BlogLayout.astro
title: "From Go to Rust: Making an ML Prediction Service Faster Again, with 5.4× Lower CPU Usage 🦀"
description: "Behind the rewrite of an ML Prediction Service from Go to Rust at LMWN"
date: 2026-10-23
language: en
coverImage: https://korntewin.github.io/intro-website/blog/figures/riir-cover.png
coverImageAlt: "From Go to Rust: rebuilding an ML Prediction Service"
---

![Go to Rust: rebuilding an ML Prediction Service](https://korntewin.github.io/intro-website/blog/figures/riir-cover.png)

If you've read [my previous post about cutting AI server costs by 9× and making the app 4× faster](https://life.lmwn.com/เบื้องหลังการลด-cost-ai-server-ลง-9-เท่า-และทำให้แอปเร็วขึ้น-4-เท่าที่-line-man-wongnai-da855335de5f), you might remember that **ML Prediction Services are CPU-bound workloads that are much harder to optimize than your typical web server**. Between preprocessing, model inference, and data querying, one request can involve a huge amount of work over products and restaurants we think a user might like. We have to think about everything from the CPU scheduler down to what each thread is actually doing.

Back then, we optimized our **Go** service until it used a lot fewer resources, and our Kubernetes cluster finally had some breathing room again. 🎉

That breathing room didn't last very long, though… 😅

As more ML use cases arrived, so did more models, more data, and more traffic. The cluster that had just started to look comfortable was almost full again. And cost wasn't our only constraint: **LINE MAN Wongnai's private cloud was running close to capacity too**. Adding more machines quickly enough to support new workloads wasn't exactly an easy option. 😬

Here's the tricky part: **a request doesn't predict just one item**. It can rank **roughly 500–10,000 items per request**. When a bunch of requests hit during peak traffic, we're suddenly talking about **hundreds of thousands of items predicted per second**. 😵‍💫 That's why every unnecessary data copy, cache miss, and thread fighting for CPU time makes a real difference to system capacity.

So the question became: **How do we handle a growing ML workload when our private cloud has so little capacity left?**

We decided to do **RIIR (Rewrite It In Rust)**. Not a line-by-line translation: we changed the memory layout, concurrency model, preprocessing execution, and code structure. We wanted to stop spending CPU cycles on work that didn't help us serve predictions.

We ported the service from Go to Rust in **about a week, with help from an AI agent**. That only worked because we had already made the architectural decisions: **Apache Arrow** for columnar data, **Kahn's Algorithm** for preprocessing dependencies, and the **Actor Model** for controlled concurrency. We weren't asking the agent to design the system while translating Go syntax. 😅

These numbers come from a **production recommendation-ranking workload at LMWN**, not a general-purpose Rust-versus-Go benchmark. 🔥

## Go vs Rust: Production Results 📊

We compared both services in production using an **A/B test with an even traffic split**, collecting **18 hours of data on October 17–18, 2026**. We looked at P99 latency, CPU, and memory at the pod level.

![Production comparison of P99 latency, CPU and memory for Go and Rust](https://korntewin.github.io/intro-website/blog/figures/production-results.png)

| Metric | Go (median / peak) | Rust (median / peak) | Improvement |
| --- | ---: | ---: | ---: |
| **P99 server latency** | 416 / 829 ms | 146 / 419 ms | **2.4×** |
| **Max pod CPU usage** | 16.9% / 45.2% | 3.0% / 8.6% | **5.4×** |
| **Max pod memory** | 2.68 / 3.56 GB | 1.43 / 1.70 GB | **1.9×** |

The improvement figures are **medians of minute-by-minute Go/Rust ratios**, while the Go and Rust columns show each service's median separately. That's why dividing the displayed medians won't give exactly the reported improvement ratios.

### Production Traffic Over 18 Hours 👀

The aggregate numbers are useful, but I also wanted to see **how CPU, memory, and P99 latency behaved across the full 18 hours of real traffic**.

![Production dashboard comparing Go and Rust CPU, memory and P99 latency over 18 hours](https://korntewin.github.io/intro-website/blog/figures/production-timeseries-dashboard.png)

**Yellow is Go**, **green is Rust**, and the **blue dashed line is the improvement ratio**, read from the right-hand axis. Even as load changes throughout the day, Rust consistently uses much less CPU and memory.

**CPU Usage:** Go moves around quite a bit with traffic, while Rust stays at a much lower CPU level under an even traffic split.

![CPU usage of Go versus Rust and their improvement ratio over 18 hours](https://korntewin.github.io/intro-website/blog/figures/production-cpu-timeseries.png)

**Memory Usage:** This one makes the difference in memory footprint obvious, especially during periods when Go has repeated spikes.

![Memory usage of Go versus Rust and their improvement ratio over 18 hours](https://korntewin.github.io/intro-website/blog/figures/production-memory-timeseries.png)

**P99 Latency:** This is where we can see how tail latency behaves as traffic changes, rather than looking only at a typical request.

![P99 latency of Go versus Rust and their improvement ratio over 18 hours](https://korntewin.github.io/intro-website/blog/figures/production-p99-timeseries.png)

My favorite number here isn't even the P99 improvement. It's the **huge reduction in CPU usage**. For CPU-bound ML inference, CPU cycles spent on thread contention, cache misses, or copying data are CPU cycles we *can't* spend serving predictions for other models.

## Why Not Just Switch Languages?

Switching languages alone wouldn't have fixed the bottlenecks we had in production.

Imagine keeping features in the same HashMaps, copying data every time we split a batch, and letting every ONNX Runtime instance start threads that all compete for the same CPU cores. Rewriting that in Rust wouldn't magically fix things. On the other hand, getting the **memory layout and concurrency control** right can eliminate a lot of CPU work that shouldn't have existed in the first place.

### The Quick Win That Wasn't: Why Quantization Didn't Pay Off ⚖️

We didn't jump straight into a rewrite. We also tried **model quantization** as a quick win to reduce inference cost. But the model for this use case was **already quite small**. The performance gain was modest, while the drop in **model accuracy was too large for us to accept in production**.

For our small model, that accuracy trade-off wasn't worth it. We focused instead on **data movement, preprocessing, and concurrency**, where we could reduce CPU use without changing model accuracy.

### Another Reason for Rust: The Data & ML Ecosystem 🦀

At **LINE MAN Wongnai (LMWN)**, I tend to see two familiar worlds. There's **Applied ML**, where Python is the main tool for experiments, features, and pipelines. And there's **Web / Backend Services**, where Go is a mainstay. With this prediction service, we wanted to move further down into **low-level ML optimization using Rust**, building on the existing native ecosystem around C and C++.

![Applied ML in Python, backend services in Go, and low-level ML optimization with Rust](https://korntewin.github.io/intro-website/blog/figures/lmwn-ml-web-landscape.png)

Moving downward in that diagram means more direct control over **memory layout, SIMD, preprocessing, and inference execution**, while still connecting to our Python workflows and existing services.

Go served us well for networking and backend services. For this data-heavy preprocessing workload, Rust also let us use **[Polars](https://pola.rs/)**, **[nlpO3](https://github.com/PyThaiNLP/nlpo3)** for Thai NLP, and **[Hugging Face Tokenizers](https://github.com/huggingface/tokenizers)** directly. All three have Rust cores.

That gives us direct control over **ownership, lifetimes, and memory layout** on the hot path, without a language-level garbage collector. The available libraries were a practical part of our decision to use Rust. 🦀

**Python integration mattered too.** Go's [cgo](https://pkg.go.dev/cmd/cgo) is mature for calling C APIs, but embedding CPython through it means handling the C API, object lifetimes, references, and the GIL across runtime boundaries. Rust's [PyO3](https://pyo3.rs/) gives us Python-specific abstractions for embedding Python or building Python extensions, with [maturin](https://www.maturin.rs/) for packaging. For this kind of integration, it's easier to work with than wiring up Python bindings through cgo ourselves.

## 1. Apache Arrow + Polars: Making Data Easier for CPUs to Read 📦

Pointer-heavy data structures make the CPU chase memory addresses. When the next address isn't cached, it has to wait for a slower level of the memory hierarchy, sometimes all the way to RAM.

In a row-oriented representation, where each record holds lots of fields in separate HashMaps, processing the same feature over thousands of records can turn into a whole lot of **pointer chasing**.

But ML preprocessing often works **“one feature across many records”** rather than **“every feature for one record.”** That's why we chose **Apache Arrow** as the underlying columnar memory format and **Polars** for DataFrame operations.

![Row-oriented versus columnar memory layout](https://korntewin.github.io/intro-website/blog/figures/columnar-memory.png)

In a columnar layout, values of the same type live together in buffers. Scanning a numeric column has better memory locality than repeatedly dereferencing nested objects, and it gives the compiler or library more opportunities to use **SIMD and vectorized operations** effectively.

String columns still use offset and value buffers, and Polars can store multiple chunks. What matters for our workload is reducing pointer chasing when processing columns.

### Memory Efficiency: Arrow vs Go Swiss Table 💾

Take a record with a single **score: f32** feature. Our Go representation uses **[]map[string]any**, with one map per record. That flexibility has a memory cost.

Go 1.24+ uses [Swiss Table](https://go.dev/blog/swisstable). Under our illustrative 64-bit layout assumptions, each record needs a map header (~48 B), a group of eight slots (8 B of control bytes plus key/value storage, rounded to ~288 B), a slice pointer (8 B), and a boxed f32 (~8 B). That comes to roughly **352 B per record**. With Arrow, the schema is shared and f32 values can sit contiguously at **4 B per record**, plus an optional one-bit-per-value validity bitmap.

![Estimated memory overhead for Go Swiss Tables versus Arrow for 1,000 and 10,000 records](https://korntewin.github.io/intro-website/blog/figures/arrow-swiss-memory.png)

For **1,000 records**, the estimate is roughly **352,000 B in Go vs 4,125 B with Arrow (~85×)**. For **10,000 records**, it's **3,520,000 B vs 41,250 B (~85×)**.

These are **illustrative layout estimates for a Go map per record**, not measured end-to-end savings. A compact Go `[]float32` can store numeric payloads just as efficiently; real memory use also includes allocation and buffer metadata.

### Validity Bitmap: One Bit to Represent Null

Another nice trick in Arrow is the **validity bitmap**. Instead of wrapping every value in a separate object with its own pointer or metadata, Arrow uses **one bit per slot** to say whether it's valid (**1**) or null (**0**). If a whole column has no nulls, it doesn't even need a validity bitmap.

Imagine a column of product lists containing **[10, 20, 30]**, **null**, **[]**, and **[40, 50]**. A null list and an empty list aren't the same thing, even though neither contributes child values at that position. The bitmap is what lets us tell them apart.

### LargeList + Offsets: One Shared Values Buffer

For nested lists, we don't need a separate heap object for every row. Arrow uses an **offsets buffer** to mark the start and end of each list inside a **shared child-values buffer**. For example, offsets might be **[0, 3, 3, 3, 5]** and values might be **[10, 20, 30, 40, 50]**. Row i refers to the range from offsets[i] to offsets[i+1].

![Arrow validity bitmaps and LargeList offsets sharing a single child-values buffer](https://korntewin.github.io/intro-website/blog/figures/arrow-validity-large-list.png)

**LargeList uses 64-bit offsets** instead of the 32-bit offsets used by List, so it can address larger child arrays. The memory-locality win comes from contiguous values and offset-based indexing, not from 64-bit offsets being smaller—they actually take more space!

When an Actor worker gets a mini-batch, we can often pass it **a view or slice of those same underlying buffers**, without constructing another list object for every row. That connects columnar storage, zero-copy, and data parallelism quite nicely.

### Bonus: Zero-Copy Slices Instead of Copying Every Mini-Batch

When sending a large request to workers, we usually need to split its items into mini-batches. If each split creates a brand-new array and copies all the same values, we're burning memory bandwidth and allocations for data that hasn't even changed.

Arrow supports **slicing by sharing the original buffers** and changing metadata such as the offset and length rather than copying the payload. That's a great match for mini-batches sent to workers.

![Arrow zero-copy slicing shares the original underlying buffer](https://korntewin.github.io/intro-website/blog/figures/arrow-zero-copy.png)

**Zero-copy applies to the slices, not necessarily the entire pipeline.** Type casts, feature computation, rechunking, and ONNX input preparation can still allocate buffers.

## 2. Actor Model: Let Each ML Model Own Its Mini-Batches 🧵

Under heavy traffic, it's easy to create more runnable work than the CPU cores can handle. Each request may spawn tasks while ONNX Runtime also maintains its own worker threads.

The result is **oversubscription**: more runnable threads than CPU cores, more context switching, and more contention for caches. Throughput doesn't necessarily increase, but tail latency can get much worse.

For RIIR, we use the **Actor Model** with separate **preprocessing actor pools** and **inference actor pools** for each ML model. We split the items in a request into mini-batches and send those batches to workers.

![Per-model preprocessing and inference actors processing request-level mini-batches](https://korntewin.github.io/intro-website/blog/figures/actor-mini-batches.png)

That lets us tune **worker count, batch size, and ONNX Runtime threads** per model instead of forcing the same settings on the entire service. Different models behave differently. Some spend most of their time in preprocessing; others are limited by memory bandwidth during inference, where adding threads can do more harm than good.

The benefit isn't faster math; it's **clear boundaries for concurrency and ownership**. We can tune each stage without letting incoming requests fight over CPU cores unchecked.

## 3. Kahn's Algorithm: Sort Preprocessing Before Traffic Arrives 🧩

ML preprocessing isn't always a simple loop over features. A bunch of transformations depend on one another. Maybe we need to normalize a feature before computing a derived feature, or create columns A and B before assembling the model input.

Run those functions in the wrong order and you might get incorrect predictions or a missing-column error at runtime. So we model their dependencies as a **directed acyclic graph (DAG)** and use **Kahn's Algorithm for topological sorting** to compile a valid execution order ahead of time.

![Preprocessing dependency DAG and Kahn topological sorting](https://korntewin.github.io/intro-website/blog/figures/kahn-dag.png)

Kahn's Algorithm counts the dependencies entering each node (its **in-degree**), starts with nodes whose in-degree is zero, and removes ready nodes one at a time. Each removal reduces the in-degree of downstream nodes. If nodes remain but none is ready, there's a cycle to fix before the service starts.

In production, this changes our job from **“find the preprocessing order on every request”** to **“validate and compile the order once at startup.”** Incoming requests simply execute the plan we've already prepared.

For this RIIR implementation, we deliberately chose **one-dimensional data parallelism**. We divide the items of each request into mini-batches, and workers process those batches in parallel. **Inside each mini-batch, preprocessing nodes follow their topological order sequentially.** We don't add a second axis of parallelism across DAG nodes, even when some nodes don't depend on each other.

Why? Because the actor workers and ONNX Runtime threads are already using CPU cores. Parallelizing both items *and* DAG nodes could lead to **CPU oversubscription**, extra context switches, and worse P99 latency.

We're not trying to parallelize everything that *can* be parallelized. We parallelize along the **data axis** so the total amount of concurrent work stays under control. 🧵

## 4. Rust 1.98: Algebraic Floating Point Opens Up More SIMD ⚡

LLVM has long supported SIMD auto-vectorization. But the compiler can't always vectorize a floating-point loop if doing so would change the required order of operations. Rust normally preserves the prescribed floating-point semantics, which means some optimizations aren't automatically legal—even when the CPU has the instructions for them.

The reason is that floating-point arithmetic isn't associative the way real-number arithmetic is. **(a + b) + c** may not equal **a + (b + c)** because each operation rounds its result. Reassociating the calculation can therefore change the final bits.

Rust 1.98 introduced methods such as **f32::algebraic_add** and **f64::algebraic_mul**. We can opt into them at specific points to give the compiler more freedom to reassociate expressions and potentially vectorize loops it couldn't otherwise transform.

![Floating-point reassociation enabling additional vectorization opportunities](https://korntewin.github.io/intro-website/blog/figures/algebraic-floats.png)

For example:

~~~rust
// Normal FP operations preserve the prescribed evaluation semantics.
let normal = ((a + b) + c) + d;

// Explicit algebraic operations allow the compiler more freedom.
let algebraic = a.algebraic_add(b)
    .algebraic_add(c)
    .algebraic_add(d);
~~~

Algebraic operations can change rounding behavior and how NaNs, infinities, and signed zeros are handled. We enable them selectively and verify the results against the previous implementation with **parity tests and benchmarks**.

The **2.4× / 5.4× / 1.9×** production gains reflect the full redesign, not algebraic floating-point operations on their own. 🚀

## 5. Memory Allocator: ptmalloc, mimalloc, or jemalloc? 🧠

The memory allocator is another easy thing to overlook. Even with a better DataFrame layout, preprocessing still creates temporary buffers, intermediate columns, and objects along the way.

On Linux with glibc, the default system allocator is **ptmalloc**. It works well in plenty of situations, but workloads that allocate and free memory on many threads may benefit from alternatives such as **mimalloc** and **jemalloc**.

| Allocator | Strengths | Trade-offs to measure |
| --- | --- | --- |
| **ptmalloc** (glibc default) | No additional dependency; works well for general-purpose code | Concurrent allocation, contention, and fragmentation under particular allocation patterns |
| **mimalloc** | Fast allocation paths, thread-local mechanisms, low contention | Results depend on object sizes, allocation patterns, and memory footprint |
| **jemalloc via tikv-jemallocator** | Arenas, thread caches, tuning options, and heap profiling | Build configuration, RSS behavior, and extra operational complexity |

We chose **tikv-jemallocator** as the application's global allocator because our benchmarks against ptmalloc and mimalloc showed meaningful reductions in memory usage, CPU, and latency for this workload.

An interesting bit of allocator history: [jemalloc](https://github.com/jemalloc/jemalloc) was archived and later unarchived in early 2026, with jemalloc 5.3.1 released in April. After several years of accumulated changes, it was quite a comeback. 😂

~~~rust
#[global_allocator]
static GLOBAL_ALLOCATOR: tikv_jemallocator::Jemalloc =
    tikv_jemallocator::Jemalloc;
~~~

To compare allocators fairly, keep the traffic, model, worker count, batch size, binary, and environment the same, then measure throughput, P99, CPU, and RSS.

### How Do We Make Every Application Use the Same Allocator?

In Rust, a **#[global_allocator]** declaration is configured at the binary-application level. In a monorepo with several applications, it's surprisingly easy to forget that configuration when adding a new use case.

That's why we use **Semgrep as a policy check in CI** to require every application layer to configure its global allocator according to the same standard. Performance practices shouldn't rely on someone remembering a line of code every single time.

## 6. Cargo Workspace + Application Layer: More Use Cases, Less Copy-Paste 🏗️

As the prediction service grows to support multiple ML models and new use cases, we don't want to create each new service by copying the last one's code.

So we organized the rewrite as a **Cargo Workspace monorepo**. The **application layer** handles configuration, adapters, and assembling a specific use case; the shared **prediction core** owns the preprocessing DAG, actor pools, ONNX inference, and common data structures.

![Cargo Workspace with use-case applications, a shared prediction core and Semgrep allocator checks](https://korntewin.github.io/intro-website/blog/figures/workspace-semgrep.png)

Each application can compose its own predictor. Perhaps it chains multiple models together, or expects different inputs and outputs. The core doesn't need to know *what* a model is predicting, and business logic stays out of the shared engine.

The payoff isn't just code reuse. We can **benchmark, test, and tune each application** without maintaining several versions of the same prediction engine. There's a lot more to the architecture, but I'll save the rest for another post. 😄


## What Stuck With Me

Looking back, the rewrite was less about swapping Go for Rust and more about rebuilding the path from data to prediction: fewer copies, bounded worker pools, and a preprocessing plan compiled ahead of time.

The production comparison above shows why the work mattered. If we roll these changes out across **all the team's use cases**, we project that cluster CPU requests could fall from **79% to 69% (10 percentage points)**. That's still a **projection**, not a measured post-rollout result.

What surprised me most wasn't just a faster executable. It was how much CPU we could get back by cutting unnecessary data movement, allocations, and thread contention. With private-cloud capacity so tight, those saved cycles give us room for the next ML use case without immediately asking for more machines. That's the part of RIIR I'm happiest about. 🦀

---

**Further reading / References:** [Our previous optimization story](https://life.lmwn.com/เบื้องหลังการลด-cost-ai-server-ลง-9-เท่า-และทำให้แอปเร็วขึ้น-4-เท่าที่-line-man-wongnai-da855335de5f) · [Rust 1.98 Release Notes](https://blog.rust-lang.org/2026/08/20/Rust-1.98.0/) · [Apache Arrow Columnar Format](https://arrow.apache.org/docs/format/Columnar.html) · [Go Swiss Tables](https://go.dev/blog/swisstable) · [Polars](https://pola.rs/) · [tikv/jemallocator](https://github.com/tikv/jemallocator)
