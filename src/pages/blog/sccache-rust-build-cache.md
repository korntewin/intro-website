---
layout: ../../layouts/BlogLayout.astro
title: "sccache: เมื่อ Rust Build ช้า เพราะเรา Compile ของเดิมซ้ำ ๆ 🦀"
description: "ชวนมารู้จัก Compiler Cache ตั้งแต่การใช้งาน Rust ในเครื่อง ไปจนถึง CI"
date: 2026-11-14
coverImage: https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png
coverImageAlt: "Cargo, sccache และ rustc ทำงานร่วมกัน"
---

![Cargo ส่ง Compile Request ผ่าน sccache เพื่อใช้ผลลัพธ์เดิมหรือเรียก rustc](https://korntewin.github.io/intro-website/blog/figures/sccache-cover.png)

เคยเจออาการนี้ไหมครับ แก้โค้ด Rust ไปแค่ไม่กี่บรรทัด พอ Push ขึ้นไปปุ๊บ ก็ต้องมานั่งรอ CI Compile Dependencies ชุดเดิมซ้ำอีกรอบ 😅 ในเครื่องเรายังมีโฟลเดอร์ `target/` ช่วยจำผล Build ไว้ให้ แต่พออยู่บน CI Runner ที่เปิดเครื่องใหม่สะอาดทุก Job ไฟล์พวกนั้นก็หายเกลี้ยงตั้งแต่ก่อนเริ่ม Build รอบใหม่

ตอนที่ผมทำ Rust Service ที่มี Dependency Graph ใหญ่พอสมควร เลยเริ่มไล่เช็กดูว่า **พอมีขั้นตอนไหนที่เราหยิบผลลัพธ์เก่ากลับมาใช้ต่อได้บ้าง** และตัวช่วยที่ตอบโจทย์มากก็คือ **sccache** ครับ ตัวนี้เป็น Compiler Wrapper ที่เก็บผล Compile ที่ Cache ได้ไว้ใช้ซ้ำ สำหรับตัวอย่างโค้ดและตัวเลขในบทความนี้จะเป็นโปรเจกต์สมมติที่ตั้งค่าไว้เพื่ออธิบายคอนเซปต์นะครับ ยกเว้นผลวัดเวลาบน CI ช่วงท้ายที่เก็บมาจากโปรเจกต์จริงครับ

## สรุปสั้น ๆ ก่อน ⚡

- Cargo เอาของเดิมใน `target/` กลับมาใช้ต่อได้อยู่แล้ว ส่วน sccache จะเป็นชั้น Cache แยกสำหรับเก็บผล Compile ที่ Cache ได้ไว้ให้
- เวลา Cache Hit เราจะข้ามขั้นตอนเรียก Compiler รอบนั้นไปได้เลย แต่พวก Linking, Build Script และ Crate บางประเภทก็ยังต้องรันอยู่ดี
- sccache สร้าง Key จาก Inputs ของการ Compile แต่ละครั้ง ถ้าเราแก้ Crate ไหน ตัวมันกับ Crate ที่เรียกใช้ต่อจากมันก็จะ Miss ส่วน Local Cache จะใช้ LRU Eviction คอยคุมขนาดไม่ให้เกิน Limit
- Rust Incremental Compilation กับ Shared Compiler Cache ช่วยแก้คนละโจทย์กัน ต้องเลือกเปิดใช้ให้ตรงกับ Workflow
- เวลาวัดผลให้ดูเวลา **ทั้ง Job** รวมถึงช่วง Restore กับ Upload Cache ด้วยนะครับ เพราะต่อให้ Hit Rate สูง ก็ไม่ได้การันตีว่า Job โดยรวมจะเร็วขึ้นครับ

## sccache คืออะไร? 📦

[sccache](https://github.com/mozilla/sccache/blob/v0.19.0/README.md) เป็นเครื่องมือทำ Compiler Cache ที่เริ่มต้นพัฒนาโดย **Mozilla** องค์กรผู้ให้กำเนิดภาษา Rust นี่แหละครับ ตัวมันทำหน้าที่คั่นกลางระหว่าง Build Tool กับ Compiler ใช้ได้กับทั้ง Rust, C/C++ และอีกหลาย Compiler โดยสามารถเก็บผล Compile ลง Local Disk หรือส่งขึ้น Remote Backend เพื่อให้เครื่องอื่น ๆ หยิบไปใช้ต่อร่วมกันได้

ตรงนี้แยกเป็น 2 ฟีเจอร์นะครับ **Shared Cache** คือการแชร์ผล Compile ที่ทำเสร็จแล้วระหว่างเครื่อง ส่วน **Distributed Compilation** คือการกระจายงานไป Compile บนเครื่องอื่น สำหรับตัวอย่างในบทความนี้เราจะใช้แค่ Compiler Cache อย่างเดียว ไม่ต้องตั้ง Distributed Compiler Cluster ให้วุ่นวายครับ

## เจาะลึก: sccache ทำงานอย่างไร? 🔍

จริง ๆ แล้ว sccache ไม่ได้ทำให้ตัว rustc ทำงานเร็วขึ้นนะครับ แต่มันช่วยประหยัดเวลาด้วยการ **ข้ามการเรียก rustc ไปเลย** สำหรับ Crate ที่เคย Compile ด้วยเงื่อนไขเดียวกันเป๊ะ ๆ มาก่อน พาร์ตนี้จะพาไปดู 2 คำถามหลักครับ คือ sccache ดูจากอะไรว่างาน Compile สองรอบนี้ “เหมือนกันเป๊ะ” แล้วจริง ๆ กับมันจัดการอย่างไรไม่ให้ไฟล์ Cache บวมจนล้น Disk (รายละเอียดนี้อิงการรองรับ Rust ใน sccache 0.19.0 ซึ่งอาจเปลี่ยนไปตามเวอร์ชันนะครับ)

เวลาเราตั้ง `RUSTC_WRAPPER=sccache` ตัว Cargo จะไปเรียก `sccache rustc …` แทนสำหรับทุก Crate ที่ Cargo ดูแล้วว่าต้อง Build เจ้าตัวคำสั่งนี้เป็นแค่ Thin Client เบา ๆ โดยค่าเริ่มต้นมันจะโยน Request ไปให้ **sccache Server** ที่รันอยู่เบื้องหลัง (ถ้ายังไม่ได้เปิดไว้ มันก็สตาร์ตให้เอง) ตัว Server จะเป็นคนถือ Connection กับ Storage รวมถึงคอยนับ Stats ให้ เพราะแบบนี้พวกคำสั่ง `--show-stats`, `--zero-stats` และ `--stop-server` เลยต้องคุยกับ Server และพวก Config อย่างขนาด Cache ก็จะถูกอ่านตอน Server เริ่มทำงานครับ

![Compile Request ที่ Cache ได้จะนำ Inputs ไปค้นหาใน Cache ถ้า Hit จะคืนผลลัพธ์เดิม ถ้า Miss จะส่งไปเรียก Compiler](https://korntewin.github.io/intro-website/blog/figures/sccache-flow.png)

พอมี Request เข้ามา ตัว Server จะเช็กก่อนว่าเคสนี้ Cache ได้ไหม ถ้าได้ sccache ก็จะคำนวณ Key จาก Inputs แล้วเอาไปค้นใน Storage ถ้า **Hit** ก็ดึง Output เดิมมาคืนให้เลย แต่ถ้า **Miss** ก็ปล่อยให้ Compiler ทำงานไป แล้วพอ Compile ผ่านและเข้าเกณฑ์ ค่อยเก็บผลลัพธ์ลง Cache ส่วน Request ไหนที่ Cache ไม่ได้ ก็แค่ส่งต่อไปให้ Compiler รันตามปกติ อ่านเพิ่มได้ใน [Architecture Documentation](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Architecture.md) ครับ

จุดสำคัญคือ sccache เช็กแยกทีละ Compile Request ไม่ได้เหมารวมว่า Pipeline ทั้งเส้น “เหมือนเดิม” ดังนั้นพอเปลี่ยน Compiler, Feature, Target, Profile, Flags, Source หรือ Input ที่เกี่ยวข้องก็ย่อมเกิด Miss ซึ่งถือว่าถูกต้องแล้วครับ เพราะถ้าเงื่อนไขเปลี่ยน เราก็ไม่ควรหยิบของเก่ามาใช้ผิด ๆ

### Compile Request แบบไหน Cache ได้? ✅

การเป็น Dependency อย่างเดียวไม่ได้แปลว่า Cache ได้เสมอนะครับ สำหรับ sccache 0.19.0 ตัว Compile Request ของ Rust Library ทั่วไปที่ปิด Incremental จะ Cache ได้เมื่อ Arguments กับ Outputs อยู่ในรูปแบบที่รองรับ ส่วน Request ที่เปิด Incremental รวมถึง Crate ที่ต้องเรียก System Linker อย่าง `bin`, `dylib`, `cdylib` และ `proc-macro` จะข้าม Cache ไป Compile ตามปกติ แถมการรัน Build Script, Linking และการรัน Test ก็ยังกินเวลาอยู่ดี ดูเพิ่มใน [เงื่อนไข Cache ของ Rust](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Rust.md) ได้ครับ

### อะไรบ้างที่อยู่ใน Cache Key? 🔑

![Compiler, Arguments, Source Files, Dependencies, Environment และ Working Directory ถูก Hash รวมเป็น Cache Key ถ้า Inputs เหมือนเดิมจะ Hit ถ้ามี Input เปลี่ยนจะ Miss](https://korntewin.github.io/intro-website/blog/figures/sccache-key.png)

Key ต้องเปลี่ยนทุกครั้งที่ Output มีสิทธิ์เปลี่ยนได้ **พูดง่าย ๆ คือ Key หนึ่งตัวแทน Compile Request หนึ่งครั้ง ไม่ใช่แค่ชื่อ Crate กับ Version** ครับ ก่อนจะ Hash ตัว sccache จะไปขอข้อมูล Dependencies จาก rustc (`--emit dep-info`) เพื่อดูว่า Crate นี้เปิดอ่านไฟล์ไหนบ้าง ทั้ง Modules, ไฟล์ที่ดึงมาด้วย `include_str!` และ Environment Variables ที่อ่านผ่าน `env!` จากนั้นค่อยเอา Inputs ทั้งหมดด้านล่างมา Hash ด้วย blake3:

- **Compiler:** เวอร์ชันของ rustc และ Libraries ใน Sysroot พออัปเดต Toolchain เมื่อไหร่ก็ได้ Key ใหม่ทันที
- **Arguments:** ชื่อ Crate, Edition, ค่า `--cfg` อย่าง Features ที่เปิดใช้, Optimization Level, Target และ Codegen Flags ส่วนตำแหน่ง Output อย่าง `--out-dir` กับ Search Path จาก `-L` จะไม่ถูกนำมาคิด
- **Source Files:** เนื้อหาของทุกไฟล์ในรายการ dep-info
- **Dependencies:** เนื้อหาของทุก Crate ที่ส่งผ่าน `--extern` (`.rlib` หรือ `.rmeta`) ที่ Crate นี้ต้องใช้ตอน Compile
- **Environment:** ตัวแปร `CARGO_*` ยกเว้นบางตัว เช่น `CARGO_BUILD_JOBS` กับ `CARGO_MAKEFLAGS` รวมถึงค่าของตัวแปรที่อ่านผ่าน `env!`
- **Working Directory:** Directory ที่ rustc รันอยู่ นี่เป็นอีกเหตุผลว่าทำไม Checkout Path บน CI ถึงควรตั้งให้คงที่เหมือนเดิมทุกครั้ง

ตัว Cache จะไม่เคยเขียนทับ Entry เดิมครับ เวลา Input เปลี่ยน sccache แค่เอา Key ใหม่ไปค้น ซึ่งอาจจะยังไม่มี Entry เก็บไว้ แต่ก็ไม่ได้ตามไปลบของเก่าทิ้งทันที ของเดิมเลยยังช่วยได้เผื่อจังหวะที่เราสลับกลับไป Branch หรือ Inputs ชุดเดิมครับ รายการด้านบนนี้สรุปแบบย่อมาจาก [โค้ดสร้าง Key ของ Rust](https://github.com/mozilla/sccache/blob/v0.19.0/src/compiler/rust.rs) อ่านคู่กับ [เอกสารการ Hash](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Caching.md) เพิ่มได้เลยครับ

### Hit หรือ Miss เวลาหายไปไหน? ⏱️

![Timeline ของหนึ่ง Crate: Miss ต้อง Hash ค้นหา Compile และเก็บผล Hit ต้อง Hash ค้นหา และ Restore ส่วน Request ที่ Cache ไม่ได้จะเรียก rustc โดยตรง](https://korntewin.github.io/intro-website/blog/figures/sccache-hit-miss.png)

เวลา Miss งานจะ **เยอะกว่า** การเรียก rustc ตรง ๆ นิดหน่อยครับ เพราะ sccache ต้องสะกิด rustc หนึ่งรอบเพื่อขอ dep-info, อ่านแล้ว Hash ทุก Input, สั่ง Compile จริง ก่อนจะบีบอัดแล้วเก็บลง Cache ส่วนฝั่ง Hit ก็ต้อง Hash กับค้นหาเหมือนกัน แต่ข้ามช่วง Compile จริงไปได้ทั้งหมด เวลาที่ประหยัดได้ต่อ 1 Hit ก็เลยประมาณเวลา Compile ของ Crate นั้นลบด้วยเวลา Restore นี่จึงเป็นเหตุผลว่าทำไม Dependencies ก้อนใหญ่ ๆ ที่ Compile นานถึงได้ประโยชน์จาก Cache มากที่สุดครับ

ข้างในแต่ละ Entry จะเป็น Archive ก้อนเล็ก ๆ ที่รวม Output ที่ Compile เสร็จแล้วอย่าง `.rlib` และ `.rmeta` ซึ่งบีบอัดด้วย zstd แนบมากับ stdout และ stderr ของ rustc ด้วย พอ Hit ปุ๊บ sccache ก็จะแตกไฟล์ไปวางในจุดที่ Cargo รอรับ แล้วพ่นข้อความเดิมของ Compiler ออกมาซ้ำ พวก Warning จาก Workspace Crate ที่ดึงมาจาก Cache เลยยังโชว์ให้เห็นเหมือนเดิม ส่วน Request ที่ Cache ไม่ได้ก็จะส่งตรงไปที่ rustc โดยไม่บันทึกอะไรลง Cache เลยครับ

### ทำไมแก้ Crate เดียวไม่ต้อง Build ใหม่ทั้งหมด? 🕸️

![Crate Graph หลังแก้ core บน Runner ใหม่: core และ api ที่พึ่งพามัน Miss ส่วน Crate ที่ไม่ถูกแก้ Hit และ Proc-macro กับ Binary ต้อง Compile ทุกครั้ง](https://korntewin.github.io/intro-website/blog/figures/sccache-graph.png)

ลองนึกภาพตามนะครับว่าเราได้ CI Runner เครื่องใหม่ที่ `target/` ยังว่างเปล่า แต่ sccache ยังมีข้อมูลอุ่น ๆ อยู่ แล้ว Commit รอบนี้เราแก้แค่ Workspace Crate ชื่อ `core` ตัวเดียว พอ Cargo ไม่มี Output เก่าติดเครื่องอยู่ มันก็จะส่ง Compile Request ของทุก Crate เข้ามา แล้วแต่ละ Request ก็จะถูกเช็กแยกกันแบบนี้ครับ:

- Third-party Crates กับ Workspace Libraries ตัวอื่นที่ไม่ได้แก้มี Inputs เหมือนเดิมเป๊ะ: **Hit**
- `core` มี Source File เปลี่ยนไป: **Miss**
- `api` ไม่ได้ถูกแก้โค้ดก็จริง แต่ต้อง Compile คู่กับ `.rlib` ตัวใหม่ของ `core` และตัวไฟล์ Dependency นั้นก็นับเป็นส่วนหนึ่งของ Key ของ `api` ด้วย มันเลย **Miss** ตามไปด้วย แรงกระเพื่อมเลยไหลต่อมายัง Crate ปลายน้ำ
- Procedural Macro `macros` และ Binary `app` ต้องเรียก Linker เลยต้อง **Compile ใหม่ทุกครั้ง**

ในทางกลับกัน Hit ก็ส่งต่อเป็นลูกโซ่ได้เหมือนกันครับ เพราะการ Hit จะคืน Output ที่ตรงกันเป๊ะทุก Byte Crate ตัวถัดไปเลยเห็นไฟล์ Dependency เหมือนเดิมเป๊ะและ Hit ตามกันไปได้ งาน Compile ที่เหลือก็เลยจะตกอยู่แค่ “ส่วนที่แก้ + ทุกตัวที่เรียกใช้มันต่อ + ส่วนที่ Cache ไม่ได้” นี่จึงเป็นเหตุผลว่าทำไมการแก้ Crate ต้นน้ำที่อยู่ฐาน Graph, การอัปเดต Dependency ที่ใช้กันทั่วบ้าน หรือการเปลี่ยน Toolchain กับ Flags ถึงเจ็บตัวหนักกว่าการแก้ Crate ปลายทางมากครับ

เห็นไหมครับว่าการแก้ `Cargo.lock` ไม่ได้ล้าง sccache ทั้งก้อน Compile Request ส่วนที่ไม่ได้โดนหางเลขก็ยัง Hit ต่อได้ แต่กลับกัน ต่อให้ Crate Version เดิมเป๊ะก็ไม่ได้การันตีว่าจะ Hit เสมอไปถ้า Compiler, Features หรือ Inputs อื่นเปลี่ยน หรือแม้แต่ Key เดิมก็ยัง Miss ได้ถ้า Entry นั้นยังไม่เคยถูกเก็บ หรือโดน Evict ทิ้งไปแล้ว

### sccache คุมขนาด Cache อย่างไร? 🧹

![Entries ใน Local Cache เรียงตามการใช้งานล่าสุด Hit จะย้าย Entry ไปฝั่งที่ใช้ล่าสุด และการเก็บ Entry ใหม่ที่เกิน Size Limit จะลบ Entry ที่ไม่ได้ใช้นานที่สุด](https://korntewin.github.io/intro-website/blog/figures/sccache-lru.png)

**การเปลี่ยน Inputs กับการเคลียร์พื้นที่ (Eviction) เป็นคนละกลไกกันครับ** การได้ Key ใหม่ไม่ได้ไปลบทิ้งอะไรเลย ระบบจะไล่ลบคืนพื้นที่ก็ต่อเมื่อ Cache เต็มเท่านั้น สำหรับ Local Disk Cache แต่ละ Entry ก็คือไฟล์หนึ่งไฟล์อยู่ใน `SCCACHE_DIR` โดยตัว Server จะคอยนับขนาดรวมเทียบกับเพดาน `SCCACHE_CACHE_SIZE` (ค่าเริ่มต้น 10 GB ส่วนตัวอย่างในบทความนี้ใช้ 2 GB) แล้วเรียงลำดับตามเวลาที่ถูกหยิบใช้ล่าสุด เรียกว่า **Least Recently Used (LRU)** Eviction ครับ:

1. พอเกิด Hit ตัว Entry นั้นจะถูกเลื่อนขึ้นมาเป็นตัวที่เพิ่งใช้ล่าสุด โดย sccache จะอัปเดต Modification Time ของไฟล์ไว้ด้วย ลำดับเลยยังจำได้อยู่แม้ Server จะ Restart
2. ก่อนจะบันทึก Entry ใหม่ Server จะเช็กก่อนว่าขนาดรวมยังอยู่ใต้ Limit ไหม
3. ถ้าพื้นที่ไม่พอ Server จะไล่ลบ Entry ที่ไม่ได้ถูกหยิบใช้นานที่สุดออกไปจนกว่าจะพอ แล้วค่อยเก็บ Entry ใหม่ ส่วน Entry ไหนที่ใหญ่เกิน Limit ทั้งก้อนตั้งแต่แรกก็จะไม่ถูกเก็บเลย และถ้าวันหลังต้องใช้ผลที่โดนลบไปแล้ว Request นั้นก็จะ Miss แล้ว Compile ใหม่ครับ

ตรงนี้เราไม่ต้องไปตั้ง Cleanup Job แยกเลยครับ เพราะ Entry ไหนที่ Build หยิบใช้บ่อย ๆ ก็จะยังอยู่รอดต่อไป ส่วนพวกของเก่าจาก Toolchain, Flags หรือ Dependency Versions เดิมก็จะค่อย ๆ โดนเบียดหลุดออกไปเอง จุดที่ต้องระวังอย่างเดียวคือตั้ง Limit **เล็กเกินไป** ครับ เพราะถ้า Clean Build หนึ่งรอบสร้าง Entries เยอะกว่าขนาด Cache ที่ตั้งไว้ Entries แรก ๆ จะโดนลบทิ้งตั้งแต่ก่อนที่ Build ถัดไปจะได้หยิบมาใช้ ทำให้ Hit แทบไม่เหลือเลยครับ แนะนำให้เผื่อขนาดไว้อย่างน้อย 1 Full Build ต่อ 1 Configuration ที่อยากเลี้ยง Cache ไว้ (Profile, Target และ Toolchain) แล้วเทียบขนาดกับยอดสูงสุดใน `sccache --show-stats` ดูครับ รายละเอียดเพิ่มดูได้ใน [การตั้งค่า Local Cache](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Local.md) กับ [โค้ด LRU Storage](https://github.com/mozilla/sccache/blob/v0.19.0/src/lru_disk_cache/mod.rs)

ย้ำอีกทีว่า Limit นี้ใช้กับ Local Disk Cache เท่านั้นนะครับ ไม่ได้ไปล้าง `target/`, ซอร์สที่ Cargo โหลดมา หรือ Cache Archives เก่าบน CI Provider ถ้าเปลี่ยนไปใช้ Remote Storage ก็ต้องไปตั้ง Policy คุมขนาดกับ Retention ฝั่ง Backend เองด้วย เช่น ตั้ง Redis `maxmemory` คู่กับ `allkeys-lru` หรือ `SCCACHE_REDIS_EXPIRATION`, ใส่ Lifecycle Rules บน Object Storage Bucket หรือปรับ Cache Retention บน CI Platform แต่สำหรับตัวอย่าง CI ด้านล่าง ตัว Archive ก็คือสำเนาของ `SCCACHE_DIR` ในเครื่องนั่นแหละครับ `SCCACHE_CACHE_SIZE` เลยช่วยคุมขนาดก้อนไฟล์ที่แต่ละ Job ต้อง Restore และ Upload ไปในตัวด้วย

## Cargo, Incremental Compilation และ sccache ต่างกันอย่างไร? 🧩

![Cargo build outputs, Rust incremental compilation และ sccache Reuse ของเดิมคนละระดับ](https://korntewin.github.io/intro-website/blog/figures/sccache-layers.png)

**Cargo Outputs:** Cargo จะเก็บ Artifacts กับ Fingerprints ไว้ใน `target/` ถ้าเห็นว่า Unit ไหนยังไม่เปลี่ยน (Fresh) มันจะข้ามการเรียก `rustc` ไปเลย เพราะฉะนั้นถ้าเราสั่ง `cargo build` ซ้ำติดกันโดยไม่แก้โค้ด จึงอาจไม่เห็น sccache Hit เพิ่มขึ้น เพราะ Cargo ตัดจบตั้งแต่ก่อนถึง Compiler แล้วครับ

**Rust Incremental Compilation:** rustc จะหยิบผลลัพธ์บางส่วนของ Crate เดิมกลับมาใช้ซ้ำเวลาเราแก้โค้ด เหมาะกับ Edit/Build Loop ในเครื่อง โดยเฉพาะตัว Workspace Crates เอง แต่ใน sccache 0.19.0 การ Compile ที่เปิด Incremental จะ Cache ไม่ได้นะครับ ส่วน Dependencies ที่ Compile แบบไม่ Incremental ยัง Cache ได้ตามปกติ

**sccache:** จะแยกเก็บผล Compile ที่ Cache ได้ไว้นอก `target/` เวลาเราสั่ง Clean หรือเปิด CI Runner เครื่องใหม่ที่ต่อกับ Cache นี้ได้ พอ Cargo ส่ง Compile Request เข้ามา sccache ก็จะหยิบผลลัพธ์ที่ตรงกันมาคืนให้ได้ทันที แต่ตัวมันไม่ได้ทำหน้าที่แทนการ Download Dependencies ของ Cargo และไม่ได้แปลว่าจะ Cache ได้ทุก Crate นะครับ รายละเอียดดูเพิ่มใน [Rust Caveats](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Rust.md) ได้เลย

ตอนพัฒนาในเครื่อง แนะนำให้เปิด Incremental ตามค่า Default ไว้เหมือนเดิมจะสะดวกกว่าครับ ส่วนบน CI ที่เน้น Clean Build เราสามารถตั้ง `CARGO_INCREMENTAL=0` เพื่อให้ sccache เข้ามาช่วย Cache ตัว Workspace Library ที่เข้าเงื่อนไขด้วยได้ ลอง Benchmark เทียบทั้งสองแบบกับโปรเจกต์จริงดูก่อนตัดสินใจครับ

## เริ่มใช้ในเครื่อง 🛠️

ติดตั้งผ่าน Package Manager ได้เลย หรือจะดู [วิธีติดตั้งอย่างเป็นทางการ](https://github.com/mozilla/sccache/blob/v0.19.0/README.md#installation) ก็ได้ครับ ตัวอย่างบน macOS:

```sh
brew install sccache
sccache --version
```

ลองเปิดใช้งานใน Shell ปัจจุบัน แล้ว Build โปรเจกต์ Rust ดูครับ:

```sh
export RUSTC_WRAPPER=sccache
export SCCACHE_CACHE_SIZE=2G
cargo build
sccache --show-stats
```

`SCCACHE_CACHE_SIZE` เอาไว้คุมขนาด Local Cache ส่วน `SCCACHE_DIR` ใช้กำหนดโฟลเดอร์เก็บ Cache (ค่า 2 GB ยกมาเป็นตัวอย่างเฉย ๆ นะครับ) พวกค่า Config ของ Server ต้องตั้งให้เรียบร้อยก่อนเริ่มรัน Server ถ้าไปแก้ทีหลังต้องสั่ง Stop แล้ว Start ใหม่ ส่วน `sccache --zero-stats` ใช้รีเซ็ตตัวเลข Stats โดยไม่ลบ Cache และ `sccache --stop-server` ใช้หยุด Background Server ดูเพิ่มเติมได้ที่ [Local Storage Configuration](https://github.com/mozilla/sccache/blob/v0.19.0/docs/Local.md) ครับ

### ดูแลพื้นที่ Build ในเครื่อง 🧹

การเปิด Incremental Compilation ช่วยให้ Edit/Build Loop ลื่นขึ้นก็จริง แต่พอใช้ไปนาน ๆ `target/` มักจะโตขึ้นเรื่อย ๆ จากหลาย Profiles, Dependencies และ Incremental Artifacts ครับ ถ้าใช้ Target Directory ตามค่า Default ลองเช็กขนาดจาก Workspace Root ด้วย `du -sh target` ดูก่อนครับ ถ้า Disk เริ่มแน่น ให้สั่ง Preview ดูล่วงหน้าก่อนค่อย Clean จริง:

```sh
cargo clean --dry-run
cargo clean
```

ตรวจให้ชัวร์ก่อนรันว่าเราอยู่ใน Workspace ที่ตั้งใจไว้จริง ๆ นะครับ เพราะ [`cargo clean`](https://doc.rust-lang.org/cargo/commands/cargo-clean.html) แบบไม่ใส่ Options จะกวาดล้าง **Target Directory ทั้งโฟลเดอร์** ทั้ง Binary และ Incremental State ไม่ได้ลบแค่ไฟล์ Incremental เก่า ๆ อีกอย่างค่า Workspace หรือ `CARGO_TARGET_DIR` อาจชี้ไปโฟลเดอร์อื่นที่ไม่ใช่ `./target` ด้วย อย่าเผลอเก็บไฟล์สำคัญไว้ในนั้นนะครับ หรือถ้าอยากลบแค่บางส่วน Cargo ก็มี Options อย่าง `--release` หรือ `-p package-name` ให้เลือกใช้ครับ

แน่นอนว่าพอ Clean แล้ว Build รอบถัดไปต้องสร้าง Output กับ Incremental State ใหม่หมด เลยอาจจะช้าลงหน่อย ส่วนข้อมูลใน sccache ที่ปกติเก็บแยกไว้ที่อื่นจะยังอยู่ครบ และ Request ที่ Cache ได้ก็อาจ Hit ทันทีหลัง Clean ยกเว้นส่วน Incremental Compilation, Linking กับงานที่ Cache ไม่ได้ยังต้องรันใหม่ตามเดิม (แต่ถ้าใครตั้ง `SCCACHE_DIR` ไว้ข้างใน `target/` Cache ก็หายไปด้วยนะครับ) ค่อย Clean เฉพาะตอนอยากเคลียร์พื้นที่หรือตอนไล่แก้ปัญหาก็พอ ไม่ต้อง Clean ทุกรอบที่ Build ครับ 🦀

### ทดลอง Cold และ Warm Cache 🧪

รอบนี้ให้แยกโฟลเดอร์ทดลองกับ Server Port ออกมาต่างหากครับ ตัวอย่างด้านล่างจะสร้าง Library ใหม่แล้ว Clean **เฉพาะโปรเจกต์ทดลอง** โดยคง Checkout Path กับ Compiler Settings ไว้เหมือนเดิม:

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

ถ้าอยากให้รอบแรกเริ่มจาก Cold Cache จริง ๆ ให้ใช้ Cache Directory ที่สร้างใหม่กับ Port ที่ยังว่างครับ Build รอบแรกควรเห็น Miss สำหรับ Library ที่ Cache ได้ จากนั้นพอสั่ง Clean `target/` แล้ว Build ซ้ำ รอบสองควรจะเห็น Hit ลองดู Stats เทียบกันดูครับ ตัวอย่างนี้เอาไว้สังเกตการทำงานเฉย ๆ ไม่ใช่ Performance Benchmark จริงจัง ถ้าเราสั่ง Build ซ้ำสองรอบโดยไม่ Clean ตัว Cargo ก็จะบอกว่า Fresh และไม่ส่ง Request ใหม่มาถึง sccache เลยครับ

## นำไปใช้ใน CI 🚀

ปกติ CI Runner มักเริ่มงานด้วย Filesystem เปล่า ๆ ทุกครั้ง เราเลยต้องหาวิธีเก็บ Cache Directory ไว้ส่งต่อให้ Job ถัดไป วิธีหนึ่งที่ใช้ได้คือฝากกับระบบ Cache ของ CI โดยแยกส่วน Cargo Downloads ออกจาก Compiler Results เพราะงานโหลด Crate กับงาน Compile มีจังหวะเปลี่ยนไม่เหมือนกัน ส่วนฝั่ง Compiler Archive ก็แยกคีย์ตาม Architecture กับประเภท Job ได้เลยหากใช้ Target หรือ Flags ต่างกัน

### ตัวอย่าง GitLab CI

ตัวอย่าง **GitLab CI แบบพื้นฐาน** ด้านล่างจะติดตั้ง Release ที่ Pin Version ไว้ผ่าน Cargo ครับ เพราะตอน Compile ติดตั้งรอบแรกใช้เวลาพอสมควร เราเลย Cache ตัว Binary เก็บไว้ด้วย อย่าลืมปรับ Rust Image กับ Dependencies ให้เข้ากับโปรเจกต์จริงนะครับ

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

ตัว `EXIT` Trap มีหน้าที่โชว์ Stats แล้วสั่งปิด Server ใน Shell เดียวกันต่อให้ Test พัง โดยยังรักษา Exit Status เดิมไว้ และทำงานก่อนจังหวะ Upload Cache แนะนำให้ลองเทสต์บน Runner ที่ใช้จริงด้วยนะครับ เพราะแต่ละที่อาจปิด Daemon ต่างกัน ส่วน Archive Key มีหน้าที่เลือก **ก้อน Cache** ที่จะดึงมา Restore แล้ว sccache ค่อยไปเช็ก Key ราย Entry อีกชั้น การใช้ Stable Key จึงช่วยให้เก็บของที่ใช้ต่อได้แม้เพิ่งอัปเดต Dependency โดยมี Size Limit คอยคุมไม่ให้บวมเกินครับ

ถ้ามีหลาย Job รันพร้อมกันแล้วเขียนทับ Archive เดียวกัน อาจเกิดการ Upload ทับกันได้ครับ การแยก Scope หรือคุมสิทธิ์การเขียนจะช่วยเพิ่มโอกาส Reuse ได้มากขึ้น (ซึ่งไม่ว่าจะจัดการแบบไหน sccache ก็ยังเช็ก Key ราย Entry เหมือนเดิม) และอย่าลืมวัดเวลาตอน Extract กับ Upload ด้วยนะครับ เพราะถ้า Archive ใหญ่เกินไป บางทีอาจเสียเวลานานกว่างาน Compile ที่ประหยัดได้เสียอีก

### หลังเปลี่ยน Lockfile เวลา Build เปลี่ยนไปอย่างไร? 📊

ตัวเลขชุดนี้มาจากการทดลองบน CI ของ **Rust Prediction Service** จริงตัวหนึ่งครับ รอบนั้นเราจับเอา Setup เก่าที่ใช้ Archive มาเทียบกับ Setup ใหม่ที่ใช้ sccache หลังแก้ Lockfile ชุดเดียวกัน โดยฝั่งเดิมเป็น **Cold Archive Cache** ส่วนฝั่งใหม่ Restore **Compiler Cache ที่มีอยู่แล้ว** และทั้งสองรอบรันผ่าน Test Suite ชุดเดียวกันครับ

![Pipeline Wall Time หลังเปลี่ยน Lockfile ของ Rust Prediction Service จริง: Archive Cache แบบ Cold ใช้ 10 นาที 00 วินาที ส่วน sccache ที่มี Compiler Cache อยู่แล้วใช้ 6 นาที 28 วินาที ลดลง 35.3%](https://korntewin.github.io/intro-website/blog/figures/sccache-lockfile-benchmark.png)

- **Pipeline Wall Time:** 10 นาที 00 วินาที → 6 นาที 28 วินาที
- **เวลาที่ลดลง:** 3 นาที 32 วินาที หรือ **35.3%** ในการเปรียบเทียบครั้งนี้

เคสนี้ตรงกับสถานการณ์ที่เราอยากดูพอดีครับ พอแก้ Lockfile ปุ๊บ Archive Key แบบเดิมก็ Miss ทันที แต่ฝั่ง sccache ยังหยิบผล Compile เดิมที่ Cache ไว้กลับมาใช้ต่อได้ อย่างไรก็ตาม Setup ใหม่เรามีการปรับเรื่อง Cache ส่วนอื่นร่วมด้วย ตัวเลขนี้จึงสะท้อนผลของ **CI Configuration ทั้งชุด** ไม่ใช่ Benchmark ของ sccache เพียว ๆ และเป็นการวัดจากการรันอย่างละ 1 รอบบน Shared Autoscaling Runners ที่รวมเวลาบูต Job รับส่ง Cache และ Step อื่นใน Pipeline แล้ว จึงไม่ใช่ค่าเฉลี่ยหรือการันตีว่าจะเร็วขึ้นเท่านี้ทุกครั้งที่แก้ Lockfile แถมถ้า sccache ยังโล่งตั้งแต่เริ่ม รอบแรกก็ยังต้อง Compile ใหม่หมดอยู่ดีครับ 😅

## Docker Build: cargo-chef เข้ามาช่วยตรงไหน? 🐳

Docker Layer Cache ทำงานคนละระดับกับ sccache ครับ ถ้า Dockerfile ใช้ `COPY . .` แล้วตามด้วย `cargo build` การแก้ Source อาจทำให้ Build Layer เดิมใช้ซ้ำไม่ได้ Container จึงอาจต้อง Compile Dependencies อีกครั้ง [cargo-chef](https://github.com/LukeMathWalker/cargo-chef) ช่วยแยกขั้นเตรียม Dependencies ออกจากขั้น Build Application เพื่อเพิ่มโอกาสใช้ Dependency Layer ซ้ำ

`cargo chef prepare` สร้าง `recipe.json` จาก Manifests และ Lockfile ของโปรเจกต์ จากนั้น `cargo chef cook` ใช้ Recipe สร้างโครงโปรเจกต์และ Build Dependencies ก่อน Copy Source จริงเข้า Builder ถ้า Recipe และ Inputs อื่นของ Docker Layer ไม่เปลี่ยน **และ Builder ยังเข้าถึง Layer เดิมได้** Docker ก็อาจใช้ Layer นั้นซ้ำเมื่อเราแก้ Application Source ครับ

ตัวอย่าง Multi-stage แบบพื้นฐานสำหรับ Rust Project ที่มี Binary ชื่อ `app`:

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

ตัวอย่างด้านบนจะจบที่ Builder Stage นะครับ ของจริงก็ต่อ Runtime Stage ให้เข้ากับ Binary และ System Libraries ของโปรเจกต์ได้เลย อย่าลืมใส่ `target/` กับ `.git/` ลงใน `.dockerignore` ด้วย เดี๋ยว Local Build Artifacts จากเครื่องเราจะถูก Copy ไปทับของใน Container และคุม Rust Version, Working Directory, Build Profile, Target รวมถึง Features ระหว่างขั้น `cook` กับ Build จริงให้ตรงกัน พร้อม Pin Toolchain กับ Image Version เพื่อให้ Build ออกมาคงที่เหมือนกันทุกครั้ง ส่วนพวก Workspace Path Dependencies, Build Scripts หรือ Native Libraries อาจต้องปรับแต่งเพิ่มตามโปรเจกต์ครับ

**แล้วใช้ cargo-chef คู่กับ sccache ได้ไหม?** ได้เลยครับ cargo-chef ช่วยให้ Docker เอา Dependency **Layer** กลับมาใช้ซ้ำ ส่วน sccache จะช่วยประหยัดเวลาตอนที่ต้อง Compile จริง Dockerfile ด้านบนใส่แค่ cargo-chef ให้ดูเป็นตัวอย่าง ถ้าอยากพ่วง sccache ด้วยก็ต้องติดตั้งและตั้งค่า Wrapper ใน Build พร้อมเปิดทางให้ Build มองเห็น Cache ด้วย อีกอย่างคือถ้า CI Builder เริ่มใหม่ทุกครั้ง เราต้องเซฟ Docker Layer Cache หรือ Export/Import กลับมาใช้ด้วยนะครับ เพราะเครื่องใหม่ไม่ได้มี Layer รอบก่อนติดมาให้อัตโนมัติ ลองวัดเวลาทั้งสองวิธีรวมเวลา Restore/Upload ดูก่อนที่จะเพิ่มความซับซ้อนให้ Build ครับ

## ทำไม Compile แล้วไม่ Hit? 🤔

- **Cargo บอกว่า Fresh อยู่แล้ว:** ถ้าไม่มี Compile Request ส่งมา ก็ไม่มี Hit เพิ่มครับ ลองเอาสคริปต์ทดสอบ Clean Build ในโฟลเดอร์แยกด้านบนไปรันดูได้
- **เปิด Incremental อยู่:** Dependencies ที่ปิด Incremental อาจ Hit แต่ตัว Workspace Crates เองจะไม่ Hit ลองปิด Incremental เทียบดูภายใต้เงื่อนไขเดียวกันครับ
- **เป็น Request ที่ Cache ไม่ได้:** ใน v0.19.0 พวก Crate ที่ต้องเรียก System Linker รวมถึง Binary กับ Procedural Macro จะไม่ถูก Cache ส่วน Build Scripts, Linking และการรัน Test ก็ยังกินเวลาเท่าเดิม ยิ่งถ้าเป็น Procedural Macro ที่อ่านไฟล์จากดิสก์ ยังมีข้อควรระวังเรื่องความถูกต้องเพิ่มอีก ลองดูรายละเอียดใน Rust Documentation ครับ
- **Inputs เปลี่ยน:** Toolchain, Target Architecture, Features, Profile, Flags, Source Path หรือ Environment แค่จุดเดียวเปลี่ยน Key ก็เปลี่ยนแล้ว ใน CI ควรคุม Checkout Path ให้คงที่เหมือนเดิมทุกครั้ง แล้วเทียบเฉพาะงานที่เงื่อนไขตรงกันครับ (การจัดการ Path ต่างกันตามเวอร์ชัน)
- **Native Code ใช้ Compiler อีกตัว:** บาง Dependency ของ Rust มีการ Compile C/C++ ด้วย เราต้องตั้ง Compiler Wrapper หรือ CMake Compiler Launcher ให้ครอบคลุมฝั่งนั้นด้วยครับ รวมถึงเครื่องมือ Coverage ที่มักมี Rust Wrapper ของตัวเอง ก็ต้องเช็กให้แน่ใจว่าไม่ตีกันและตั้ง Native Compiler ไว้ครบด้วย
- **เสียเวลากับ Restore/Upload Cache นานไป:** ลองจับเวลารวมทั้งรอบ Cold และรอบ Warm ทั้ง Install, Restore/Upload ไปจนถึง Test พร้อมไล่เช็กยอด Miss, Request ที่ Cache ไม่ได้, Errors และจำนวนการ Evict Entry เก่าครับ

## สิ่งที่ผมอยากฝากไว้ 💡

แนะนำให้เริ่มดูจาก Developer Loop กับ CI Job ที่ทีมใช้อยู่จริงครับ ลองเปิด Wrapper เช็กก่อนว่า Request ส่วนไหน Cache ได้บ้าง แล้วค่อยเทียบเวลา Clean Build บนสภาพแวดล้อมเดียวกัน เพราะ Cache จะช่วยได้จริงก็ต่อเมื่อเวลา Compile ที่ลดลง มันชนะเวลาที่ใช้ Upload/Download ระหว่างเครื่องกับ Object Storage ครับ

สุดท้ายแล้ว เป้าหมายไม่ได้อยู่ที่การไล่ปั้น Hit Rate ให้ถึง 100% ครับ แต่อยู่ที่การได้ Feedback เร็วขึ้น โดยที่ Build ยังทำงานถูกต้องและไล่ตรวจสอบได้ง่ายเหมือนเดิม 🦀

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
