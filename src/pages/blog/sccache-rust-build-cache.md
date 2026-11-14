---
layout: ../../layouts/BlogLayout.astro
title: "sccache: เมื่อ Rust Build ช้า เพราะเรา Compile ของเดิมซ้ำ ๆ 🦀"
description: "ชวนเข้าใจ Compiler Cache ตั้งแต่การใช้งาน Rust ในเครื่อง ไปจนถึง CI"
date: 2026-11-14
coverImage: https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png
coverImageAlt: "Cargo, sccache และ rustc ทำงานร่วมกัน"
---

![Cargo ส่งคำขอ Compile ผ่าน sccache เพื่อใช้ผลลัพธ์เดิมหรือเรียก rustc](https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png)

เคยไหมครับ แก้ Rust ไปไม่กี่บรรทัด Push ขึ้นไป แล้วนั่งดู CI Compile Dependencies เดิมอีกรอบ 😅 ในเครื่องเราอาจมี `target/` เก็บผลลัพธ์ไว้อยู่แล้ว แต่พอเป็น CI Runner ที่เริ่มใหม่ทุก Job ไฟล์เหล่านั้นอาจหายไปก่อน Build ครั้งถัดไป

ระหว่างทำ Rust Service ที่มี Dependency Graph ค่อนข้างใหญ่ ผมเลยเริ่มกลับมาดูว่า **มีงานส่วนไหนที่เราเอาผลลัพธ์เดิมกลับมาใช้ได้บ้าง** เครื่องมือหนึ่งที่ช่วยได้คือ **sccache** ครับ มันเป็น Compiler Wrapper ที่เก็บผลการ Compile ซึ่งเข้าเงื่อนไขไว้ใช้ซ้ำได้ ตัวอย่างในบทความนี้เป็นโปรเจกต์สมมติ และค่าที่ใช้มีไว้เพื่ออธิบายแนวคิดครับ

## สรุปสั้น ๆ ก่อน ⚡

- Cargo ใช้ผลลัพธ์ที่มีอยู่ใน `target/` ซ้ำได้ ส่วน sccache มี Cache แยกสำหรับผลการ Compile ที่เข้าเงื่อนไข
- Cache Hit ช่วยข้ามการเรียก Compiler ครั้งนั้น แต่ Linking, Build Script และ Crate บางชนิดยังต้องทำงาน
- Rust Incremental Compilation กับ Shared Compiler Cache แก้ปัญหาคนละระดับ เลือกให้เหมาะกับ Workflow
- วัดเวลา **ทั้ง Job** รวม Restore และ Upload Cache ด้วย เพราะ Hit Rate สูงไม่ได้รับประกันว่า Build โดยรวมจะเร็วขึ้นครับ

## sccache คืออะไร? 📦

[sccache](https://github.com/mozilla/sccache/blob/v0.19.0/README.md) ทำหน้าที่อยู่ระหว่าง Build Tool กับ Compiler รองรับ Rust, C/C++ และ Compiler กลุ่มอื่นตามที่โปรเจกต์ระบุ โดยเก็บผลลัพธ์ลง Local Disk หรือใช้ Remote Backend ที่รองรับ เพื่อให้หลายเครื่องนำผลลัพธ์กลับมาใช้ร่วมกันได้

**Shared Cache** คือการแชร์ผล Compile ที่เสร็จแล้ว ส่วน sccache ยังรองรับ **Distributed Compilation** ที่ส่งงานไป Compile บนเครื่องอื่นด้วย ทั้งสองเป็นความสามารถแยกกันครับ ตัวอย่างในบทความใช้ Compiler Cache โดยไม่ต้องตั้ง Distributed Compiler Cluster

## กว่าจะเป็น Cache Hit เกิดอะไรขึ้นบ้าง? 🔍

![คำขอ Compile ที่เข้าเงื่อนไขใช้ Inputs ค้นหา Cache ถ้า Hit จะคืนผลลัพธ์ ถ้า Miss จะเรียก Compiler](https://korntewin.github.io/intro-website/blog/figures/sccache-flow.png)

เมื่อกำหนด `RUSTC_WRAPPER=sccache` Cargo จะเรียก sccache พร้อม `rustc` และ Arguments สำหรับคำขอที่เข้าเงื่อนไข sccache จะพิจารณา Inputs เช่น Compiler, Arguments, Source Files และ Environment ที่เกี่ยวข้อง จากนั้นสร้าง Key เพื่อค้นหาใน Storage

ถ้า **Hit** ก็คืน Output ที่เก็บไว้ ถ้า **Miss** ก็เรียก Compiler แล้วอาจเก็บผลลัพธ์ที่สำเร็จและเข้าเงื่อนไข ส่วนคำขอที่ Cache ไม่ได้จะส่งต่อให้ Compiler ทำงานตามปกติ รายละเอียด Inputs และเงื่อนไขขึ้นกับภาษาและเวอร์ชัน อ่านเพิ่มเติมได้จาก [Architecture Documentation](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Architecture.md) ครับ

sccache พิจารณาคำขอ Compile ทีละรายการ ไม่ได้ตัดสินว่า Pipeline ทั้งชุด “เหมือนเดิม” การเปลี่ยน Compiler, Feature, Target, Profile, Flags, Source หรือ Input ที่เกี่ยวข้องจึงอาจทำให้เกิด Miss ซึ่งเป็นเรื่องดีครับ เพราะผล Compile เดิมไม่ควรถูกนำมาใช้เมื่อเงื่อนไขเปลี่ยนไป

## Cargo, Incremental Compilation และ sccache ต่างกันอย่างไร? 🧩

![Cargo build outputs, Rust incremental compilation และ sccache ใช้ผลงานเดิมซ้ำคนละระดับ](https://korntewin.github.io/intro-website/blog/figures/sccache-layers.png)

**Cargo Outputs:** Cargo เก็บ Artifacts และ Fingerprints ไว้ใน `target/` ถ้าเห็นว่า Unit ยัง Fresh ก็ข้ามการเรียก `rustc` ได้เลย ดังนั้นการ `cargo build` ซ้ำโดยไม่แก้อะไรอาจไม่มี sccache Hit เพิ่ม เพราะ Cargo ไม่ได้ส่งงานไปให้ Compiler ครับ

**Rust Incremental Compilation:** rustc ใช้ผลบางส่วนของ Crate เดิมซ้ำหลังแก้ Code เหมาะกับ Edit/Build Loop ในเครื่อง โดยเฉพาะ Workspace Crates สำหรับ sccache 0.19.0 การ Compile ที่เปิด Incremental ไม่เข้าเงื่อนไข Cache แต่ Dependencies ที่ Compile แบบไม่ Incremental ยัง Cache ได้

**sccache:** เก็บผล Compile ที่เข้าเงื่อนไขแยกจาก `target/` หลัง Clean หรือบน Runner ใหม่ที่เข้าถึง Cache ได้ Cargo อาจส่งคำขอ Compile มาอีกครั้ง แล้ว sccache คืนผลลัพธ์ที่ตรงกันได้ มันไม่ได้แทนการ Download Dependencies ของ Cargo และไม่ได้ Cache ทุก Crate เสมอไปครับ ดู [Rust Caveats](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Rust.md) เพิ่มเติมได้

สำหรับการแก้ Code ในเครื่อง การเปิด Incremental ไว้เป็น Default ที่สมเหตุสมผล ส่วน CI ที่เน้น Clean Build สามารถใช้ `CARGO_INCREMENTAL=0` เพื่อให้ Workspace Library ที่เข้าเงื่อนไขใช้ sccache ได้ ลอง Benchmark ทั้งสองแบบกับงานจริงก่อนเลือกครับ

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

`SCCACHE_CACHE_SIZE` จำกัดขนาด Local Cache ส่วน `SCCACHE_DIR` ใช้เลือก Directory ค่า 2 GB ในตัวอย่างเป็นเพียงค่าประกอบครับ ค่าที่ Server ใช้ควรกำหนดก่อนเริ่ม Server หากเปลี่ยนค่าให้หยุดแล้วเริ่ม Server ใหม่ `sccache --zero-stats` รีเซ็ตตัวนับ แต่ไม่ลบ Cache และ `sccache --stop-server` ใช้หยุด Background Server ดู [Local Storage Configuration](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Local.md) เพิ่มเติมได้ครับ

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

ถ้าต้องการให้รอบแรก Cold จริง ๆ ให้ใช้ Cache Directory ใหม่และ Port ที่ยังว่าง Build แรกควรเห็น Miss สำหรับ Library ที่เข้าเงื่อนไข หลัง Clean `target/` แล้ว Build อีกครั้งควรเห็น Hit ให้ดู Stats ประกอบด้วยครับ ตัวอย่างเล็ก ๆ นี้เอาไว้สังเกตพฤติกรรม ไม่ใช่ Performance Benchmark ที่มีนัยสำคัญ ถ้า Build ซ้ำโดยไม่ Clean Cargo อาจบอกว่า Fresh และไม่มีคำขอใหม่ส่งไปถึง sccache เลย

## นำไปใช้ใน CI 🚀

![CI restore cache, build ผ่าน sccache, แสดงสถิติ และบันทึก cache สำหรับ job ถัดไป](https://korntewin.github.io/intro-website/blog/figures/sccache-ci.png)

Runner อาจเริ่มด้วย Filesystem ว่างทุกครั้ง เราจึงต้องเก็บ Cache Directory ให้รอดไปถึง Job ถัดไป วิธีหนึ่งคือใช้ระบบ Cache ของ CI โดยแยก Cargo Downloads กับ Compiler Results ออกจากกัน เพราะการ Download Crate กับการ Compile เป็นงานคนละแบบ ส่วน Compiler Archive สามารถแยกตาม Architecture และประเภท Job เมื่อ Target หรือ Flags ต่างกัน

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

## ทำไม Compile แล้วไม่ Hit? 🤔

- **Cargo บอกว่า Fresh อยู่แล้ว:** ไม่มีคำขอ Compiler ก็ไม่มี Hit เพิ่ม ลองใช้การทดลอง Clean Build ใน Directory แยกด้านบน
- **เปิด Incremental:** Dependencies ที่ไม่ Incremental อาจ Hit ขณะที่ Workspace Crates ไม่ Hit ลองปิด Incremental เพื่อเปรียบเทียบภายใต้เงื่อนไขเดียวกัน
- **คำขอ Cache ไม่ได้:** ใน v0.19.0 Crate ที่เรียก System Linker รวมถึง Binary และ Procedural Macro ไม่ถูก Cache ส่วน Build Scripts, Linking และการรัน Test ยังใช้เวลาได้ Procedural Macro ที่อ่านไฟล์มีข้อควรระวังเรื่องความถูกต้องเพิ่มเติม ดูใน Rust Documentation ครับ
- **Inputs เปลี่ยน:** Toolchain, Target Architecture, Features, Profile, Flags, Source Path หรือ Environment อาจเปลี่ยน Key ได้ ควรใช้ Checkout Path ที่สม่ำเสมอใน CI และเปรียบเทียบงานที่มีเงื่อนไขเดียวกัน รายละเอียด Path ขึ้นกับเวอร์ชัน
- **Native Code ใช้ Compiler อีกตัว:** Dependency ของ Rust อาจ Compile C/C++ ด้วย ให้กำหนด Compiler Wrapper หรือ CMake Compiler Launcher ที่เหมาะสม เครื่องมือ Coverage อาจมี Rust Wrapper ของตัวเอง จึงควรตรวจการทำงานร่วมกันและ Native Compiler Settings ด้วยครับ
- **เวลาโอน Cache มากเกินไป:** เทียบเวลารวมของ Cold และ Warm ทั้ง Install, Restore/Upload และ Test พร้อมดู Miss, คำขอที่ Cache ไม่ได้, Errors และการลบ Entry เก่า

## สิ่งที่ผมอยากฝากไว้ 💡

เริ่มจาก Developer Loop และ CI Job ที่เราใช้อยู่จริง เปิด Wrapper ดูว่าคำขอไหนเข้าเงื่อนไข แล้วเปรียบเทียบ Clean Build ภายใต้สภาพแวดล้อมเดียวกัน Cache จะมีประโยชน์เมื่อช่วยลดงานซ้ำได้มากกว่าเวลาที่ใช้ดูแลและย้ายมันไปมาครับ

เป้าหมายไม่จำเป็นต้องเป็น Hit Rate 100% แต่คือการได้ Feedback เร็วขึ้น โดยที่ Build ยังถูกต้องและเข้าใจได้ครับ 🦀
