---
layout: ../../layouts/BlogLayout.astro
title: "sccache: เมื่อ Rust Build ช้า เพราะเรา Compile ของเดิมซ้ำ ๆ 🦀"
description: "ชวนมารู้จัก Compiler Cache ตั้งแต่การใช้งาน Rust ในเครื่อง ไปจนถึง CI"
date: 2026-11-14
coverImage: https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png
coverImageAlt: "Cargo, sccache และ rustc ทำงานร่วมกัน"
---

![Cargo ส่ง Compile Request ผ่าน sccache เพื่อใช้ผลลัพธ์เดิมหรือเรียก rustc](https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png)

เคยไหมครับ แก้ Rust ไปไม่กี่บรรทัด Push ขึ้นไป แล้วนั่งดู CI Compile Dependencies เดิมอีกรอบ 😅 ในเครื่องเราอาจมี `target/` เก็บผลลัพธ์ไว้อยู่แล้ว แต่พอเป็น CI Runner ที่เริ่มใหม่ทุก Job ไฟล์เหล่านั้นอาจหายไปก่อน Build ครั้งถัดไป

ระหว่างทำ Rust Service ที่มี Dependency Graph ค่อนข้างใหญ่ ผมเลยเริ่มกลับมาดูว่า **มีงานส่วนไหนที่เราเอาผลลัพธ์เดิมกลับมาใช้ได้บ้าง** เครื่องมือหนึ่งที่ช่วยได้คือ **sccache** ครับ มันเป็น Compiler Wrapper ที่เก็บผลการ Compile ส่วนที่ Cache ได้ไว้ใช้ซ้ำ ตัวอย่างในบทความนี้เป็นโปรเจกต์สมมติ และค่าที่ใช้มีไว้เพื่ออธิบายแนวคิด ยกเว้นผลเปรียบเทียบ CI ช่วงท้ายบทความ ซึ่งมาจากโปรเจกต์จริงของ LINE MAN Wongnai (LMWN) ครับ

## สรุปสั้น ๆ ก่อน ⚡

- Cargo ใช้ผลลัพธ์ที่มีอยู่ใน `target/` ซ้ำได้ ส่วน sccache มี Cache แยกสำหรับผลการ Compile ที่ Cache ได้
- Cache Hit ช่วยข้ามการเรียก Compiler ครั้งนั้น แต่ Linking, Build Script และ Crate บางชนิดยังต้องทำงาน
- Rust Incremental Compilation กับ Shared Compiler Cache แก้ปัญหาคนละระดับ เลือกให้เหมาะกับ Workflow
- วัดเวลา **ทั้ง Job** รวม Restore และ Upload Cache ด้วย เพราะ Hit Rate สูงไม่ได้รับประกันว่า Build โดยรวมจะเร็วขึ้นครับ

## sccache คืออะไร? 📦

[sccache](https://github.com/mozilla/sccache/blob/v0.19.0/README.md) เป็นตัวกลางระหว่าง Build Tool กับ Compiler ใช้ได้กับ Rust, C/C++ และ Compiler อื่น ๆ ที่ sccache รองรับ โดยเก็บผลลัพธ์ลง Local Disk หรือใช้ Remote Backend ที่รองรับ เพื่อให้หลายเครื่องนำผลลัพธ์กลับมาใช้ร่วมกันได้

**Shared Cache** คือการแชร์ผล Compile ที่เสร็จแล้ว นอกจากนี้ sccache ยังรองรับ **Distributed Compilation** ที่ส่งงานไป Compile บนเครื่องอื่นด้วย สองอย่างนี้เป็นคนละฟีเจอร์กันครับ ตัวอย่างในบทความใช้ Compiler Cache โดยไม่ต้องตั้ง Distributed Compiler Cluster

## กว่าจะเป็น Cache Hit เกิดอะไรขึ้นบ้าง? 🔍

![Compile Request ที่ Cache ได้ใช้ Inputs ค้นหา Cache ถ้า Hit จะคืนผลลัพธ์ ถ้า Miss จะเรียก Compiler](https://korntewin.github.io/intro-website/blog/figures/sccache-flow.png)

เมื่อกำหนด `RUSTC_WRAPPER=sccache` Cargo จะเรียก sccache พร้อม `rustc` และ Arguments สำหรับ Request ที่ Cache ได้ sccache จะดู Inputs เช่น Compiler, Arguments, Source Files และ Environment ที่เกี่ยวข้อง จากนั้นสร้าง Key เพื่อค้นหาใน Storage

ถ้า **Hit** ก็คืน Output ที่เก็บไว้ ถ้า **Miss** ก็เรียก Compiler แล้วอาจเก็บผลลัพธ์ที่สำเร็จและ Cache ได้ ส่วน Request ที่ Cache ไม่ได้จะส่งต่อให้ Compiler ทำงานตามปกติ รายละเอียด Inputs และเงื่อนไขขึ้นกับภาษาและเวอร์ชัน อ่านเพิ่มเติมได้จาก [Architecture Documentation](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Architecture.md) ครับ

sccache ดู Compile Request ทีละรายการ ไม่ได้ตัดสินว่า Pipeline ทั้งชุด “เหมือนเดิม” การเปลี่ยน Compiler, Feature, Target, Profile, Flags, Source หรือ Input ที่เกี่ยวข้องจึงอาจทำให้เกิด Miss ซึ่งเป็นเรื่องดีครับ เพราะผล Compile เดิมไม่ควรถูกนำมาใช้เมื่อเงื่อนไขเปลี่ยนไป

## Cargo, Incremental Compilation และ sccache ต่างกันอย่างไร? 🧩

![Cargo build outputs, Rust incremental compilation และ sccache Reuse ของเดิมคนละระดับ](https://korntewin.github.io/intro-website/blog/figures/sccache-layers.png)

**Cargo Outputs:** Cargo เก็บ Artifacts และ Fingerprints ไว้ใน `target/` ถ้าเห็นว่า Unit ยัง Fresh ก็ข้ามการเรียก `rustc` ได้เลย ดังนั้นการ `cargo build` ซ้ำโดยไม่แก้อะไรอาจไม่มี sccache Hit เพิ่ม เพราะ Cargo ไม่ได้ส่งงานไปให้ Compiler ครับ

**Rust Incremental Compilation:** rustc ใช้ผลบางส่วนของ Crate เดิมซ้ำหลังแก้ Code เหมาะกับ Edit/Build Loop ในเครื่อง โดยเฉพาะ Workspace Crates สำหรับ sccache 0.19.0 การ Compile ที่เปิด Incremental จะ Cache ไม่ได้ แต่ Dependencies ที่ Compile แบบไม่ Incremental ยัง Cache ได้

**sccache:** เก็บผล Compile ที่ Cache ได้แยกจาก `target/` หลัง Clean หรือบน Runner ใหม่ที่เข้าถึง Cache ได้ Cargo อาจส่ง Compile Request มาอีกครั้ง แล้ว sccache คืนผลลัพธ์ที่ตรงกันได้ มันไม่ได้แทนการ Download Dependencies ของ Cargo และไม่ได้ Cache ทุก Crate เสมอไปครับ ดู [Rust Caveats](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Rust.md) เพิ่มเติมได้

สำหรับการแก้ Code ในเครื่อง ปล่อย Incremental ไว้ตาม Default ก็โอเคแล้ว ส่วน CI ที่เน้น Clean Build สามารถใช้ `CARGO_INCREMENTAL=0` เพื่อให้ Workspace Library ที่ Cache ได้ใช้ sccache ได้ ลอง Benchmark ทั้งสองแบบกับงานจริงก่อนเลือกครับ

## เริ่มใช้ในเครื่อง 🛠️

ติดตั้งผ่าน Package Manager หรือดู [วิธีติดตั้งอย่างเป็นทางการ](https://github.com/mozilla/sccache/blob/v0.19.0/README.md#installation) ตัวอย่างบน macOS:

```sh
brew install sccache
sccache --version
```

เปิดใช้ใน Shell ปัจจุบันแล้ว Build โปรเจกต์ Rust:

```sh
export RUSTC_WRAPPER=sccache
export SCCACHE_CACHE_SIZE=2G
cargo build
sccache --show-stats
```

`SCCACHE_CACHE_SIZE` จำกัดขนาด Local Cache ส่วน `SCCACHE_DIR` ใช้เลือก Directory ค่า 2 GB ยกมาเป็นตัวอย่างเท่านั้นครับ ค่าที่ Server ใช้ควรกำหนดก่อนเริ่ม Server หากเปลี่ยนค่าให้หยุดแล้วเริ่ม Server ใหม่ `sccache --zero-stats` รีเซ็ตตัวนับ แต่ไม่ลบ Cache และ `sccache --stop-server` ใช้หยุด Background Server ดู [Local Storage Configuration](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Local.md) เพิ่มเติมได้ครับ

### ดูแลพื้นที่ Build ในเครื่อง 🧹

การเปิด Incremental Compilation ช่วยให้ Edit/Build Loop ลื่นขึ้น แต่เมื่อใช้ไปนาน ๆ `target/` อาจโตจากหลาย Profiles, Dependencies และ Incremental Artifacts ครับ ถ้าใช้ Target Directory ค่าเริ่มต้น ลองดูขนาดจาก Workspace Root ด้วย `du -sh target` ถ้า Disk เริ่มเต็ม ให้ Preview ก่อนแล้วค่อย Clean:

```sh
cargo clean --dry-run
cargo clean
```

ตรวจว่าอยู่ใน Workspace ที่ตั้งใจไว้ก่อนนะครับ เพราะ [`cargo clean`](https://doc.rust-lang.org/cargo/commands/cargo-clean.html) แบบไม่มี Options จะลบ **Target Directory ที่ Cargo กำหนดไว้ทั้งก้อน** รวม Binary และ Incremental State ไม่ได้ลบเฉพาะไฟล์ Incremental เก่า ค่า Workspace หรือ `CARGO_TARGET_DIR` อาจทำให้ Directory นี้อยู่ที่อื่น ไม่ใช่ `./target` และไม่ควรเก็บไฟล์สำคัญที่กู้คืนไม่ได้ไว้ในนั้น Cargo ยังมี Options สำหรับลบแค่บางส่วน เช่น `--release` หรือ `-p package-name` ครับ

Build ครั้งถัดไปต้องสร้าง Output ใหม่และเริ่ม Incremental State ใหม่ จึงอาจใช้เวลามากขึ้น ส่วน Storage ของ sccache ซึ่งปกติอยู่แยกออกไปยังคงอยู่ และ Request ที่ Cache ได้อาจ Hit หลัง Clean ได้ แต่ Incremental Compilation, Linking และงานที่ Cache ไม่ได้ยังต้องทำงานตามปกติ ถ้าตั้ง Directory ของ sccache ไว้ภายใน `target/` เอง Cache นั้นก็จะถูกลบไปด้วย เลือก Clean เมื่ออยากคืนพื้นที่หรือแก้ปัญหา ไม่จำเป็นต้อง Clean ทุกครั้งที่ Build ครับ 🦀

### ทดลอง Cold และ Warm Cache 🧪

ใช้ Directory สำหรับทดลองและ Server Port แยก ตัวอย่างนี้สร้าง Library ใหม่และ Clean **เฉพาะโปรเจกต์ทดลอง** โดยคง Checkout Path และ Compiler Settings ไว้เหมือนเดิม:

```sh
demo_root=$(mktemp -d)
cd "$demo_root"
cargo new --lib cache-demo
cd cache-demo
export SCCACHE_SERVER_PORT=4249
export SCCACHE_DIR="$demo_root/cache"
export SCCACHE_CACHE_SIZE=2G
export RUSTC_WRAPPER=sccache
export CARGO_INCREMENTAL=0
sccache --start-server
sccache --zero-stats
cargo build
sccache --show-stats
cargo clean
sccache --zero-stats
cargo build
sccache --show-stats
sccache --stop-server
```

ถ้าต้องการให้รอบแรก Cold จริง ๆ ให้ใช้ Cache Directory ใหม่และ Port ที่ยังว่าง Build แรกควรเห็น Miss สำหรับ Library ที่ Cache ได้ หลัง Clean `target/` แล้ว Build อีกครั้งควรเห็น Hit ให้ดู Stats ประกอบด้วยครับ ตัวอย่างเล็ก ๆ นี้เอาไว้สังเกตพฤติกรรม ไม่ใช่ Performance Benchmark จริงจัง ถ้า Build ซ้ำโดยไม่ Clean Cargo อาจบอกว่า Fresh และไม่มี Request ใหม่ส่งไปถึง sccache เลย

## นำไปใช้ใน CI 🚀

![sccache ใช้ผล Compile ซ้ำเมื่อ Key ตรงกัน Compile ใหม่เมื่อ Miss ข้าม Cache สำหรับ Request ที่ Cache ไม่ได้ และลบ Local Entry ที่ใช้งานล่าสุดนานที่สุดเมื่อพื้นที่เต็ม](https://korntewin.github.io/intro-website/blog/figures/sccache-ci.png)

Runner อาจเริ่มด้วย Filesystem ว่างทุกครั้ง เราจึงต้องเก็บ Cache Directory ให้รอดไปถึง Job ถัดไป วิธีหนึ่งคือใช้ระบบ Cache ของ CI โดยแยก Cargo Downloads กับ Compiler Results ออกจากกัน เพราะการ Download Crate กับการ Compile เป็นงานคนละแบบ ส่วน Compiler Archive สามารถแยกตาม Architecture และประเภท Job เมื่อ Target หรือ Flags ต่างกัน

### Compile Request แบบไหน Cache ได้?

การเป็น Dependency อย่างเดียวไม่ได้แปลว่า Cache ได้เสมอครับ สำหรับ sccache 0.19.0 Compile Request ของ Rust Library ทั่วไปที่ปิด Incremental จะ Cache ได้ เมื่อ Arguments และ Outputs อยู่ในรูปแบบที่รองรับ ส่วน Request ที่เปิด Incremental และ Crate ที่เรียก System Linker เช่น `bin`, `dylib`, `cdylib` และ `proc-macro` จะผ่านไป Compile ตามปกติ การรัน Build Script, Linking และการรัน Test ก็ยังกินเวลาอยู่ ดู [เงื่อนไข Cache ของ Rust](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Rust.md) เพิ่มเติมครับ

### รู้ได้อย่างไรว่าตัวไหนใช้ซ้ำ ตัวไหนต้อง Compile ใหม่?

สำหรับ Request ที่ Cache ได้ sccache จะขอข้อมูล Dependencies จาก rustc แล้ว Hash ทั้ง Source Files และ Dependency Artifacts ที่ใช้เป็น Input รวมกับข้อมูล Compiler, Arguments และ Environment ที่เกี่ยวข้อง Features, Target และ Optimization Settings จึงมีผลผ่าน Inputs เหล่านี้ด้วย **Key แทน Compile Request หนึ่งรายการ ไม่ใช่แค่ชื่อ Crate กับ Version** ครับ นี่เป็นคำอธิบายแบบย่อจาก [โค้ดสร้าง Key ของ Rust](https://github.com/mozilla/sccache/blob/v0.19.0/src/compiler/rust.rs) และ [เอกสารการ Hash](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Caching.md)

ลองนึกถึง CI Runner ใหม่ที่ Restore Cache มาแล้ว โดย Library A ไม่ได้พึ่ง B ส่วน Library C ใช้ B สมมติว่า Key เดิมมี Entry เก็บไว้ แต่ Key ใหม่ยังไม่มี:

| Compile Request | อะไรเปลี่ยน? | ผลที่เกิดขึ้น |
| --- | --- | --- |
| Library A | Inputs ที่ติดตามทั้งหมดยังเหมือนเดิม | Key เดิมและมี Entry: Hit คืน Outputs ได้เลย |
| Library B | Source เปลี่ยนจนได้ Key ใหม่ | Key ใหม่ยังไม่มี Entry: Miss Compile แล้วเก็บผลลัพธ์ที่สำเร็จ |
| Library C | Source ของตัวเองไม่เปลี่ยน แต่ Artifact ของ B ที่ใช้เป็น Input เปลี่ยน | Key เปลี่ยนด้วย: Miss Compile แล้วเก็บผลลัพธ์ |
| Application Binary | ต้องเรียก System Linker | Cache ไม่ได้ ใน Setup นี้ จึง Compile และ Link ตามปกติ |

ดังนั้นการแก้ `Cargo.lock` ไม่ได้ล้าง sccache ทั้งก้อน Compile Request ที่ไม่ได้รับผลกระทบยัง Hit ได้ ในทางกลับกัน Version ของ Crate เหมือนเดิมก็ไม่ได้รับประกัน Hit ถ้า Compiler, Features หรือ Inputs อื่นต่างไป แม้ Key ไม่เปลี่ยนก็ยัง Miss ได้ถ้า Entry นั้นไม่เคยถูกเก็บ หรือถูกลบเพื่อคืนพื้นที่แล้ว ดู [ขั้นตอน Lookup และ Compile](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Architecture.md) ประกอบได้ครับ

### แล้วคุมพื้นที่ Disk อย่างไร?

**Inputs เปลี่ยน กับการคืนพื้นที่ เป็นคนละกลไกกันครับ** เมื่อ Input เปลี่ยน sccache จะค้นหาด้วย Key ใหม่ ไม่ได้ลบ Entry เก่าทันที ผลลัพธ์เก่ายังมีประโยชน์ได้เมื่อกลับไปใช้ Branch หรือ Inputs ชุดเดิม

สำหรับ **Local Disk Backend** ที่ใช้ในตัวอย่าง `SCCACHE_CACHE_SIZE=2G` กำหนดความจุของ Compiler Cache เมื่อต้องเก็บผลลัพธ์ใหม่แล้วพื้นที่ไม่พอ sccache จะลบ Entry ที่ **ไม่ได้ถูกใช้งานมานานที่สุด หรือ Least Recently Used (LRU)** ก่อน การอ่าน Entry จะอัปเดตความล่าสุดในการใช้งาน ถ้าภายหลังต้องใช้ผลลัพธ์ที่ถูกลบไปแล้ว Request นั้นก็จะ Miss และ Compile ใหม่ ดู [การตั้งค่า Local Cache](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Local.md) และ [โค้ด LRU Storage](https://github.com/mozilla/sccache/blob/v0.19.0/src/lru_disk_cache/mod.rs)

Limit นี้ไม่ได้ล้าง `target/`, Source ที่ Cargo Download มา หรือ Cache Archives เก่าที่ CI Provider เก็บไว้ ส่วน Remote Storage Backend ก็ต้องกำหนดนโยบายพื้นที่และ Retention ของตัวเองครับ

### ตัวอย่าง GitLab CI

ตัวอย่าง **GitLab CI แบบทั่วไป** นี้ติดตั้ง Public Release ที่ Pin Version ผ่าน Cargo การติดตั้งครั้งแรกใช้เวลา จึง Cache ตัว Binary ไว้ด้วย อย่าลืมปรับ Rust Image และ Dependencies ให้เหมาะกับโปรเจกต์ครับ

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

`EXIT` Trap แสดง Stats และหยุด Server ใน Shell เดียวกัน แม้ Test ล้มเหลว โดยรักษา Exit Status เดิมไว้ และทำก่อน Upload Cache ควรทดสอบกับ Runner ของตัวเองด้วย เพราะการหยุด Daemon อาจต่างกันไป Archive Key ใช้เลือก **ชุด Cache** ที่ Restore ส่วน sccache ตรวจ Key ของแต่ละ Entry อีกชั้นหนึ่ง Stable Key จึงช่วยเก็บผลที่ยังใช้ได้ข้าม Dependency Updates ขณะที่ Size Limit ช่วยจำกัดพื้นที่ครับ

Job ที่รันพร้อมกันแล้วเขียน Archive เดียวกันอาจ Upload ทับกัน การแยก Scope หรือจัดการ Writer ช่วยเพิ่มโอกาส Reuse ได้ แต่ sccache ยังตรวจ Key ของแต่ละ Entry อยู่ อย่าลืมวัดเวลา Extract และ Upload ด้วย เพราะ Archive ที่ใหญ่เกินไปอาจใช้เวลามากกว่างาน Compile ที่ประหยัดได้ครับ

### หลังเปลี่ยน Lockfile เวลา Build เปลี่ยนไปอย่างไร? 📊

ตัวเลขชุดนี้มาจากโปรเจกต์จริงของ **LINE MAN Wongnai (LMWN)** ครับ ในการทดลอง CI ของ Rust Prediction Service ครั้งหนึ่ง เราเปรียบเทียบการตั้งค่าเดิมที่ใช้ Archive กับการตั้งค่าใหม่ที่ใช้ sccache หลังเปลี่ยน Lockfile แบบเดียวกัน ฝั่งเดิมเป็น **Cold Archive Cache** ส่วนฝั่งใหม่ Restore **Compiler Cache ที่มีอยู่แล้ว** ทั้งสองรันผ่าน Test Suite ชุดเดียวกันครับ

![Pipeline Wall Time หลังเปลี่ยน Lockfile ของ Rust Prediction Service ที่ LMWN: Archive Cache แบบ Cold ใช้ 10 นาที 00 วินาที ส่วน sccache ที่มี Compiler Cache อยู่แล้วใช้ 6 นาที 28 วินาที ลดลง 35.3%](https://korntewin.github.io/intro-website/blog/figures/sccache-lockfile-benchmark.png)

- **Pipeline Wall Time:** 10 นาที 00 วินาที → 6 นาที 28 วินาที
- **เวลาที่ลดลง:** 3 นาที 32 วินาที หรือ **35.3%** ในการเปรียบเทียบครั้งนี้

นี่เป็นสถานการณ์ที่เราอยากดูพอดีครับ: การเปลี่ยน Lockfile ทำให้ Archive Key แบบเดิม Miss ขณะที่ sccache ยังนำผล Compile ที่ Cache ได้กลับมาใช้ได้ แต่การตั้งค่าใหม่มีการปรับวิธีจัดการ Cache ส่วนอื่นร่วมด้วย ตัวเลขนี้จึงเป็นผลของ **CI Configuration โดยรวม** ไม่ใช่ Benchmark แยกเฉพาะ sccache ตัวเลขมาจากการรันอย่างละหนึ่งครั้งบน Shared Autoscaling Runners รวมเวลาเริ่ม Job, รับส่ง Cache และงานอื่นใน Pipeline จึงไม่ใช่ค่าเฉลี่ยหรือสิ่งที่จะเกิดขึ้นทุกครั้งที่เปลี่ยน Lockfile และถ้า sccache ว่างตั้งแต่แรก รอบแรกก็ยังต้อง Compile ครับ 😅

## Docker Build: cargo-chef เข้ามาช่วยตรงไหน? 🐳

Docker Layer Cache ทำงานคนละระดับกับ sccache ครับ ถ้า Dockerfile ใช้ `COPY . .` แล้วตามด้วย `cargo build` การแก้ Source อาจทำให้ Build Layer เดิมใช้ซ้ำไม่ได้ Container จึงอาจต้อง Compile Dependencies อีกครั้ง [cargo-chef](https://github.com/LukeMathWalker/cargo-chef) ช่วยแยกขั้นเตรียม Dependencies ออกจากขั้น Build Application เพื่อเพิ่มโอกาสใช้ Dependency Layer ซ้ำ

`cargo chef prepare` สร้าง `recipe.json` จาก Manifests และ Lockfile ของโปรเจกต์ จากนั้น `cargo chef cook` ใช้ Recipe สร้างโครงโปรเจกต์และ Build Dependencies ก่อน Copy Source จริงเข้า Builder ถ้า Recipe และ Inputs อื่นของ Docker Layer ไม่เปลี่ยน **และ Builder ยังเข้าถึง Layer เดิมได้** Docker ก็อาจใช้ Layer นั้นซ้ำเมื่อเราแก้ Application Source ครับ

ตัวอย่าง Multi-stage แบบทั่วไปสำหรับ Rust Project ที่มี Binary ชื่อ `app`:

```dockerfile
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release --bin app
```

ตัวอย่างจบที่ Builder Stage ครับ สามารถเพิ่ม Runtime Stage ให้เหมาะกับ Binary และ System Libraries ของตัวเอง ใส่ `target/` และ `.git/` ใน `.dockerignore` เพื่อไม่ให้ Local Build Artifacts ถูก Copy ทับ Output ใน Container ใช้ Rust Version, Working Directory, Build Profile, Target และ Features ที่เกี่ยวข้องให้ตรงกันระหว่าง `cook` กับ Build จริง พร้อม Pin Toolchain และ Image Version เพื่อให้ Build ทำซ้ำได้ ส่วน Workspace Path Dependencies, Build Scripts หรือ Native Libraries อาจต้องตั้งค่าเพิ่มเติมตามโปรเจกต์

**ใช้ cargo-chef กับ sccache ร่วมกันได้ไหม?** ได้ครับ cargo-chef ช่วยให้ Docker ใช้ Dependency **Layer** ซ้ำ ส่วน sccache ช่วยใช้ผล **Compiler** ที่ Cache ได้ซ้ำเมื่อมีการ Compile จริง Dockerfile ด้านบนแสดงเฉพาะ cargo-chef หากต้องการ sccache ต้องติดตั้งและตั้งค่า Wrapper ภายใน Build รวมถึงทำให้ Build เข้าถึง Cache ได้ด้วย สำหรับ CI Builder ที่เริ่มใหม่ทุกครั้ง ต้องจัดเก็บ Layer Cache หรือ Export/Import กลับมาใช้ด้วย เพราะ Builder ใหม่ไม่ได้มี Layer จากรอบก่อนโดยอัตโนมัติ ลองวัดทั้งสองวิธีและต้นทุน Restore/Upload ก่อนเพิ่มความซับซ้อนครับ

## ทำไม Compile แล้วไม่ Hit? 🤔

- **Cargo บอกว่า Fresh อยู่แล้ว:** ไม่มี Compile Request ก็ไม่มี Hit เพิ่ม ลองใช้การทดลอง Clean Build ใน Directory แยกด้านบน
- **เปิด Incremental:** Dependencies ที่ไม่ Incremental อาจ Hit ขณะที่ Workspace Crates ไม่ Hit ลองปิด Incremental เพื่อเปรียบเทียบภายใต้เงื่อนไขเดียวกัน
- **เป็น Request ที่ Cache ไม่ได้:** ใน v0.19.0 Crate ที่เรียก System Linker รวมถึง Binary และ Procedural Macro ไม่ถูก Cache ส่วน Build Scripts, Linking และการรัน Test ก็ยังกินเวลาอยู่ Procedural Macro ที่อ่านไฟล์มีข้อควรระวังเรื่องความถูกต้องเพิ่มเติม ดูใน Rust Documentation ครับ
- **Inputs เปลี่ยน:** Toolchain, Target Architecture, Features, Profile, Flags, Source Path หรือ Environment อาจเปลี่ยน Key ได้ ควรใช้ Checkout Path ที่สม่ำเสมอใน CI และเปรียบเทียบงานที่มีเงื่อนไขเดียวกัน รายละเอียด Path ขึ้นกับเวอร์ชัน
- **Native Code ใช้ Compiler อีกตัว:** Dependency ของ Rust อาจ Compile C/C++ ด้วย ให้กำหนด Compiler Wrapper หรือ CMake Compiler Launcher ที่เหมาะสม เครื่องมือ Coverage อาจมี Rust Wrapper ของตัวเอง จึงควรตรวจการทำงานร่วมกันและ Native Compiler Settings ด้วยครับ
- **Restore/Upload Cache นานเกินไป:** เทียบเวลารวมของ Cold และ Warm ทั้ง Install, Restore/Upload และ Test พร้อมดู Miss, Request ที่ Cache ไม่ได้, Errors และการลบ Entry เก่า

## สิ่งที่ผมอยากฝากไว้ 💡

เริ่มจาก Developer Loop และ CI Job ที่เราใช้อยู่จริง เปิด Wrapper ดูว่า Request ไหน Cache ได้ แล้วเปรียบเทียบ Clean Build ภายใต้สภาพแวดล้อมเดียวกัน Cache จะมีประโยชน์เมื่อช่วยลดการ Compile ซ้ำได้มากกว่าเวลาที่ใช้ในการ Upload/Download ไปที่ Object Storage ครับ

เป้าหมายไม่จำเป็นต้องเป็น Hit Rate 100% แต่คือการได้ Feedback เร็วขึ้น โดยที่ Build ยังถูกต้องและเข้าใจได้ครับ 🦀

## อ่านต่อ / References 📚

**sccache (v0.19.0)**

- [mozilla/sccache](https://github.com/mozilla/sccache): Repository หลัก พร้อม [README และวิธีติดตั้ง](https://github.com/mozilla/sccache/blob/v0.19.0/README.md)
- [Architecture](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Architecture.md) และ [How caching works](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Caching.md): ภาพรวมการทำงานและวิธีคำนวณ Cache Key
- [Rust Caveats](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Rust.md): ข้อจำกัดฝั่ง Rust เช่น Incremental Compilation และ Crate ที่ Cache ไม่ได้
- [Local Storage](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Local.md) และ [Configuration](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Configuration.md): `SCCACHE_DIR`, `SCCACHE_CACHE_SIZE` และค่าอื่น ๆ
- [Distributed sccache](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Distributed.md): Distributed Compilation ที่บทความนี้ไม่ได้ลงรายละเอียด

**Cargo**

- [Build Cache](https://doc.rust-lang.org/cargo/reference/build-cache.html): โครงสร้าง `target/` และหัวข้อ [Shared Cache](https://doc.rust-lang.org/cargo/reference/build-cache.html#shared-cache) ที่แนะนำ sccache
- [Environment Variables](https://doc.rust-lang.org/cargo/reference/environment-variables.html): `RUSTC_WRAPPER`, `CARGO_INCREMENTAL` และ `CARGO_TARGET_DIR`
- [Profiles: incremental](https://doc.rust-lang.org/cargo/reference/profiles.html#incremental): ค่าเริ่มต้นของ Incremental Compilation ในแต่ละ Profile
- [Caching the Cargo home in CI](https://doc.rust-lang.org/cargo/guide/cargo-home.html#caching-the-cargo-home-in-ci): Directory ใน `CARGO_HOME` ที่ควร Cache
- [`cargo clean`](https://doc.rust-lang.org/cargo/commands/cargo-clean.html)

**CI และ Docker**

- [Caching in GitLab CI/CD](https://docs.gitlab.com/ci/caching/)
- [cargo-chef](https://github.com/LukeMathWalker/cargo-chef)
- [Docker build cache](https://docs.docker.com/build/cache/)
