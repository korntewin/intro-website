---
layout: ../../layouts/BlogLayout.astro
title: "sccache: เมื่อ Rust Build ช้า เพราะเรา Compile ของเดิมซ้ำ ๆ 🦀"
description: "ลองใช้ sccache กับ Rust ทั้งในเครื่องและบน GitLab CI พร้อมตัวเลขจากงานจริง"
date: 2026-11-14
coverImage: https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png
coverImageAlt: "Cargo, sccache และ rustc ทำงานร่วมกัน"
---

![Cargo ส่งงาน Compile ผ่าน sccache](https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png)

ตอนทำ Rust Service ผมแก้โค้ดไปไม่กี่บรรทัด แต่พอ Push ทีไร CI ก็ Compile Dependencies ชุดเดิมทุกที ในเครื่อง Cargo ยังใช้ไฟล์เดิมใน `target/` ได้ ส่วน CI Runner ที่เริ่มจากเครื่องเปล่าต้อง Build ใหม่ครับ

sccache ครอบ `rustc` แล้วเก็บผล Compile ที่รองรับไว้นอก `target/` พอเปลี่ยน Runner ก็ยังใช้ผลเดิมได้ ถ้า Restore โฟลเดอร์ Cache กลับมาหรือเข้าถึง Remote Storage เดิมได้ [เอกสาร sccache](https://github.com/mozilla/sccache/blob/v0.19.0/README.md)

## อะไรใช้ซ้ำได้บ้าง?

เมื่อกำหนด `RUSTC_WRAPPER=sccache` Cargo จะส่งคำสั่ง Compile ผ่าน sccache Server ใน v0.19.0 งาน Compile Rust Library ทั่วไปที่ปิด Incremental สามารถ Cache ได้ ส่วนงานที่เปิด Incremental หรือ Crate ที่ต้องเรียก System Linker เช่น Binary กับ Procedural Macro จะ Compile ตามปกติ Build Script กับ Test ก็ยังต้องรันครับ [เงื่อนไขการ Cache ของ Rust](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Rust.md)

![ถ้า Cache Hit จะคืนผล Compile เดิม ส่วน Cache Miss ต้องเรียก rustc](https://korntewin.github.io/intro-website/blog/figures/sccache-flow.png)

### อะไรทำให้ Cache Key เปลี่ยน?

sccache ขอข้อมูล Dependencies จาก `rustc` แล้ว Hash ข้อมูลอย่าง Toolchain, Flags, Source Files, ผล Compile ของ Dependencies, Environment Variables ที่เกี่ยวข้อง และ Working Directory ถ้าอยากใช้ Cache ข้าม CI Job ก็ควรให้ Checkout Path คงที่ครับ [วิธีสร้าง Cache Key ฝั่ง Rust](https://github.com/mozilla/sccache/blob/v0.19.0/src/compiler/rust.rs)

![Cache Key รวมข้อมูลอย่าง Source Files, Flags และผล Compile ของ Dependencies](https://korntewin.github.io/intro-website/blog/figures/sccache-key.png)

แม้จะ Hit ก็ยังต้อง Hash, ค้นหา และ Restore ผลเดิม ถ้า Miss ก็ต้อง Compile แล้วเขียนผลลง Cache เพิ่มด้วย ยิ่ง Dependency ใช้เวลา Compile นาน ก็ยิ่งมีโอกาสประหยัดเวลาได้มากครับ

![Cache Hit ข้ามการ Compile ส่วน Cache Miss มีเวลาเพิ่มจากการค้นหาและเก็บผล](https://korntewin.github.io/intro-website/blog/figures/sccache-hit-miss.png)

สมมติเราแก้ `core` ตัว `core` จะ Miss เพราะ Source เปลี่ยน ส่วน `api` ก็อาจ Miss ตามถ้าไฟล์ `.rlib` ของ `core` เปลี่ยนไป Crate อื่นที่ Inputs ยังเหมือนเดิมก็ยัง Hit ได้ แม้ `Cargo.lock` จะเปลี่ยนครับ

![หลังแก้ core แล้ว Library ที่ไม่เกี่ยวข้องยังใช้ Cache เดิมได้](https://korntewin.github.io/intro-website/blog/figures/sccache-graph.png)

### Cache โตได้แค่ไหน?

ถ้าเก็บ Entry ใหม่แล้วจะเกิน `SCCACHE_CACHE_SIZE` ระบบจะลบ Entry ที่ไม่ได้ใช้นานที่สุดก่อน ถ้า Build รอบเดียวใช้พื้นที่เกิน Limit บาง Entry อาจถูกลบก่อนจะได้ใช้รอบถัดไป ส่วน Remote Storage ใช้กฎเก็บข้อมูลของ Backend นั้นครับ [การตั้งค่า Local Cache](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Local.md)

![Local Cache ลบ Entry ที่ไม่ได้ใช้นานที่สุดก่อน](https://korntewin.github.io/intro-website/blog/figures/sccache-lru.png)

## ลองในเครื่อง

Cargo ใช้ `target/` ข้ามการ Compile ของ Crate ที่ผล Build ยังใช้ได้ ถ้าสั่ง `cargo build` ซ้ำแล้วตัวเลขใน sccache ไม่ขยับ อาจเป็นเพราะ Cargo ยังไม่ต้องเรียก Compiler ส่วน Incremental Compilation ช่วยให้ `rustc` ใช้งานบางส่วนจากรอบก่อนตอนแก้โค้ดไปทีละนิด sccache จะเข้ามาช่วยเมื่อ Cargo ต้อง Build ใหม่และ Inputs ยังตรงกับที่ Cache ไว้ครับ

![Cargo, Incremental Compilation และ sccache ใช้ผลจากรอบก่อนคนละขั้น](https://korntewin.github.io/intro-website/blog/figures/sccache-layers.png)

บน macOS ติดตั้งด้วย `brew install sccache` ได้เลย ตัวอย่างนี้ใช้โปรเจกต์ชั่วคราวกับ Server Port ที่ยังว่าง [วิธีติดตั้ง sccache](https://github.com/mozilla/sccache/blob/v0.19.0/README.md#installation)

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

Build รอบแรกควรเห็น Miss แล้วรอบสองจะมี Hit เพิ่ม เพราะ `cargo clean` ล้างผล Build ของโปรเจกต์ทดลอง แต่ Cache อยู่แยกจาก `target/` ครับ

## ผลบน CI ของเรา

หลังแก้ Lockfile แบบเดียวกันใน Rust Prediction Service ที่ใช้งานจริง CI ชุดเดิมที่เริ่มจาก Cold Archive Cache ใช้ **10 นาที** ส่วนชุดใหม่ที่ Restore sccache จากรอบก่อนใช้ **6 นาที 28 วินาที** ลดลง **3 นาที 32 วินาที (35.3%)** ทั้งสองรอบผ่าน Test Suite ชุดเดียวกันครับ

![หลังแก้ Lockfile เวลา Pipeline ลดจาก 10 นาทีเหลือ 6 นาที 28 วินาที](https://korntewin.github.io/intro-website/blog/figures/sccache-lockfile-benchmark.png)

พอ Lockfile เปลี่ยน Archive Key เดิมก็ Miss ส่วน sccache ยังใช้ผล Compile ที่ Inputs ตรงกันได้ รอบนั้นเราปรับ Cache ส่วนอื่นด้วย ตัวเลขจึงเป็นผลของ CI ทั้งชุด โดยวัดอย่างละหนึ่งรอบบน Shared Autoscaling Runners และรวมเวลาเริ่ม Job กับเวลารับส่ง Cache แล้วครับ

### ตัวอย่าง GitLab CI

ใช้ Key ของ `.sccache/` ที่คงเดิมแม้ Lockfile เปลี่ยน แยก Cache ของ Cargo Downloads ออกมา และให้ Job ที่ใช้ Target กับ Flags ที่เข้ากันแชร์ Compiler Cache ได้ ตัวอย่างนี้เก็บ Binary ของ sccache เวอร์ชันที่ระบุไว้ด้วย จะได้ไม่ต้อง Compile ตัวเครื่องมือใหม่ทุกครั้ง [เอกสาร Cache ของ GitLab](https://docs.gitlab.com/ci/caching/)

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

ถ้า Job หลายตัวรันพร้อมกันและใช้ Key เดียวกัน Archive ที่ Upload ทีหลังอาจทับของ Job อื่นได้ครับ

ถ้า Build ใน Docker ตัว cargo-chef ช่วยให้ใช้ Dependency Layer เดิมได้เมื่อ Builder ยังเข้าถึง Layer นั้น ส่วน sccache ช่วยตอนที่ต้อง Build Layer ใหม่และยังเข้าถึง Compiler Cache ได้ [cargo-chef](https://github.com/LukeMathWalker/cargo-chef)

เวลาเทียบ Cold กับ Warm Cache ผมดูเวลาทั้ง Job ตั้งแต่ติดตั้งเครื่องมือ, Restore และ Upload Cache ไปจนถึงรัน Test เพราะบางครั้งการรับส่ง Archive ใหญ่ ๆ ใช้เวลามากกว่าที่ประหยัดได้จากการ Compile ครับ
