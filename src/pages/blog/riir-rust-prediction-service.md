---
layout: ../../layouts/BlogLayout.astro
title: "จาก Go สู่ Rust: เมื่อ ML Prediction Service ต้องเร็วขึ้นอีกครั้ง และใช้ CPU น้อยลง 5.4 เท่า 🦀"
description: "เบื้องหลัง Rewrite ML Prediction Service จาก Go สู่ Rust ที่ LMWN"
date: 2026-10-23
coverImage: https://korntewin.github.io/intro-website/blog/figures/riir-cover.png
coverImageAlt: "ภาพประกอบจาก Go สู่ Rust สำหรับ ML Prediction Service"
---

![ภาพประกอบจาก Go สู่ Rust สำหรับ ML Prediction Service](https://korntewin.github.io/intro-website/blog/figures/riir-cover.png)

ถ้าใครเคยอ่าน[บทความก่อนของผมเรื่องการลด Cost AI Server ลง 9 เท่า และทำให้แอปเร็วขึ้น 4 เท่า](https://life.lmwn.com/%E0%B9%80%E0%B8%9A%E0%B8%B7%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A5%E0%B8%94-cost-ai-server-%E0%B8%A5%E0%B8%87-9-%E0%B9%80%E0%B8%97%E0%B9%88%E0%B8%B2-%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%97%E0%B8%B3%E0%B9%83%E0%B8%AB%E0%B9%89%E0%B9%81%E0%B8%AD%E0%B8%9B%E0%B9%80%E0%B8%A3%E0%B9%87%E0%B8%A7%E0%B8%82%E0%B8%B6%E0%B9%89%E0%B8%99-4-%E0%B9%80%E0%B8%97%E0%B9%88%E0%B8%B2%E0%B8%97%E0%B8%B5%E0%B9%88-line-man-wongnai-da855335de5f) น่าจะจำได้ว่า **ML Prediction Service เป็นงาน CPU-bound ที่ Optimize ยากกว่าการปรับ Web Server ทั่วไป** พอมีทั้ง Preprocessing, Model Inference, และ Data Querying ที่ 1 Request ต้องประมวลผลมหาศาลตามจำนวนสินค้า/ร้านค้าที่คาดว่า User จะชอบ เราจึงต้องคิดตั้งแต่ CPU Scheduler ไปจนถึงการทำงานของแต่ละ Thread

ตอนนั้นเรา Optimize Service ที่เขียนด้วย Go จนใช้ทรัพยากรน้อยลงไปมาก และ Kubernetes Cluster ก็กลับมามีพื้นที่ให้หายใจอีกครั้ง 🎉

แต่ความโล่งนั้นอยู่กับเราไม่นานครับ… 😅

เมื่อมี **ML Use Case เพิ่มขึ้นเรื่อย ๆ** ทั้งจำนวนโมเดล ขนาดข้อมูล และ Traffic ที่ต้องรองรับ Cluster ที่เคยโล่งก็เริ่มกลับมาเกือบเต็มอีกครั้ง แต่ข้อจำกัดสำคัญของเราไม่ได้มีแค่เรื่อง Cost เพราะตอนนี้ **Private Cloud ของ LINE MAN Wongnai เองก็ใกล้เต็มแล้ว** การเพิ่มเครื่องเพื่อรองรับ Workload ใหม่ในเวลาที่จำกัดจึงไม่ใช่ทางเลือกที่ทำได้ง่าย ๆ ครับ 😬

ที่ท้าทายกว่านั้นคือ หนึ่ง Request ไม่ได้ Predict แค่ Item เดียว แต่ต้องจัดอันดับ **ประมาณ 500–10,000 Items ต่อ Request** เมื่อ Traffic หลาย Request เข้ามาพร้อมกันในช่วง Peak งานที่ต้อง Predict จึงพุ่งไปถึง **ระดับหลายแสน Items ต่อวินาที** 😵‍💫 นี่คือเหตุผลว่าทำไมทุกการ Copy ข้อมูล, Cache Miss และ CPU Thread ที่แย่งกันทำงานจึงมีผลต่อ Capacity ของระบบอย่างมาก

โจทย์รอบนี้เลยไม่ใช่แค่การจูน Service เดิมแล้วครับ แต่คือ **เราจะรองรับ ML Workload ที่โตขึ้นได้อย่างไร ในเมื่อ Private Cloud เหลือ Capacity ให้ใช้อีกไม่มาก?**

เราเลยทำ **RIIR (Rewrite It In Rust)** แต่ไม่ได้แปลง Go เป็น Rust แบบบรรทัดต่อบรรทัด เรารื้อทั้ง Memory Layout, Concurrency, Preprocessing Execution และ Code Structure ใหม่ โดยตั้งใจลดงานที่กิน CPU แต่ไม่ได้ช่วยให้เรา Predict ได้มากขึ้นครับ

เรา Port จาก Go มา Rust ได้ใน **ประมาณ 1 สัปดาห์ โดยมี AI Agent ช่วย** แต่ก่อนให้ Agent ลงมือ เราต้องกำหนด Architecture ให้ชัดก่อน ทั้ง **Apache Arrow** สำหรับ Columnar Data, **Kahn’s Algorithm** สำหรับ Preprocessing Dependencies และ **Actor Model** สำหรับคุม Concurrency ไม่ใช่แค่สั่งให้แปลง Syntax แล้วหวังว่า Performance จะดีขึ้นเอง 😅

ตัวเลขในบทความนี้เป็นผลวัดจาก **Production Workload ของ Recommendation Ranker ที่ LMWN** ไม่ใช่ Benchmark ที่ใช้ฟันธงว่า Rust เร็วกว่า Go ในทุกงานครับ 🔥

## ผลลัพธ์ Go vs Rust บน Production 📊

เราเปรียบเทียบ Service ทั้งสองเวอร์ชันใน Production ด้วย **A/B Testing** ภายใต้ **Traffic Split เท่ากัน** เก็บข้อมูลต่อเนื่อง 18 ชั่วโมง ในวันที่ 17–18 ตุลาคม 2026 และดูทั้ง P99 Latency, CPU และ Memory ในระดับ Pod

![กราฟเปรียบเทียบ P99 latency, CPU และ Memory ของ Go และ Rust](https://korntewin.github.io/intro-website/blog/figures/production-results.png)

| Metric | Go (median / peak) | Rust (median / peak) | Improvement |
| --- | ---: | ---: | ---: |
| **P99 server latency** | 416 / 829 ms | 146 / 419 ms | **2.4×** |
| **Max pod CPU usage** | 16.9% / 45.2% | 3.0% / 8.6% | **5.4×** |
| **Max pod memory** | 2.68 / 3.56 GB | 1.43 / 1.70 GB | **1.9×** |

ค่า Improvement ใช้ **Median ของอัตราส่วน Go/Rust ในแต่ละนาที** ส่วนคอลัมน์ Go และ Rust แสดง Median ของแต่ละฝั่งแยกกัน ดังนั้นเอา Median ในตารางมาหารกันตรง ๆ จึงอาจไม่ตรงกับค่า Improvement ที่รายงานครับ

### กราฟจาก Production ตลอด 18 ชั่วโมง 👀

นอกจากตัวเลข Median ผมอยากดูด้วยว่า **CPU, Memory และ P99 Latency เปลี่ยนไปอย่างไรระหว่าง 18 ชั่วโมงที่มี Traffic จริง** ครับ

![Production dashboard เปรียบเทียบ CPU, Memory และ P99 Latency ของ Go กับ Rust](https://korntewin.github.io/intro-website/blog/figures/production-timeseries-dashboard.png)

กราฟสีเหลืองคือ Go, สีเขียวคือ Rust และเส้นประสีน้ำเงินคือ Improvement Ratio (อ่านค่าจากแกนขวา) จะเห็นว่าแม้ Load เปลี่ยนตลอดวัน แต่ Rust ยังคงใช้ CPU และ Memory ต่ำกว่าอย่างชัดเจน

**CPU Usage:** จุดที่น่าสนใจคือแม้ Go จะมีการแกว่งตาม Traffic มาก แต่ Rust คุมการใช้ CPU ได้ในระดับต่ำกว่าเมื่อเทียบกับ Traffic Split เดียวกัน

![กราฟ CPU Usage Go เทียบ Rust ตลอด 18 ชั่วโมง พร้อม Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-cpu-timeseries.png)

**Memory Usage:** กราฟนี้ทำให้เห็นความแตกต่างของ Memory Footprint ได้ชัด โดยเฉพาะเมื่อดูช่วงที่ Go มี Spike ต่อเนื่อง

![กราฟ Memory Usage Go เทียบ Rust ตลอด 18 ชั่วโมง พร้อม Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-memory-timeseries.png)

**P99 Latency:** กราฟนี้ช่วยให้เห็น Tail Latency ตอน Traffic เปลี่ยน ไม่ใช่แค่เวลาตอบสนองของ Request ทั่วไป

![กราฟ P99 Latency Go เทียบ Rust ตลอด 18 ชั่วโมง พร้อม Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-p99-timeseries.png)

ตัวเลขที่ผมชอบที่สุดไม่ใช่แค่ P99 ที่ลดลง แต่คือ CPU ที่ลดลงอย่างมาก เพราะสำหรับ ML Inference แบบ CPU-bound ทรัพยากรที่ใช้ไปกับ Thread Contention, Cache Miss หรือ Copy ข้อมูล **คือทรัพยากรที่เอาไป Predict ให้โมเดลอื่นไม่ได้**

## ทำไมไม่เปลี่ยนแค่ภาษา?

แค่เปลี่ยนภาษาอย่างเดียวคงแก้ Bottleneck ที่เราเจอใน Production ไม่ได้ครับ

สมมติเรายังเก็บ Feature เป็น HashMap แบบเดิม, Copy Data ทุกครั้งที่แบ่ง Batch หรือปล่อยให้ ONNX Runtime ทุกตัวเปิด Thread แข่งกัน แม้เปลี่ยนเป็น Rust ก็อาจไม่ได้ผลอย่างที่หวัง ตรงกันข้าม หากจัด Memory Layout และ Concurrency Control ให้ดี เราก็สามารถลดงานที่ CPU ไม่จำเป็นต้องทำลงไปได้มากแล้วครับ

### Quick Win ที่ลองแล้ว: ทำไม Quantization ถึงไม่คุ้มในเคสนี้? ⚖️

เราไม่ได้กระโดดไป Rewrite อย่างเดียวครับ อีกแนวทางที่เราลองเป็น Quick Win คือ **Model Quantization** เพื่อลดต้นทุนของ Inference แต่โมเดลที่ใช้ใน Use Case นี้ **มีขนาดเล็กอยู่แล้ว** ผลที่วัดได้คือ **Performance ดีขึ้นเพียงเล็กน้อย** ขณะที่ **Model Accuracy ลดลงมากเกินกว่าที่เรายอมรับได้** จึงไม่ใช่ Trade-off ที่เหมาะกับการนำขึ้น Production

สำหรับโมเดลขนาดเล็กของเรา Accuracy ที่เสียไปไม่คุ้มกับ Performance ที่ได้ เราเลยหันมาแก้ **Data Movement, Preprocessing และ Concurrency** ซึ่งช่วยลดการใช้ CPU ได้โดยไม่ต้องลดความแม่นยำของโมเดล

### อีกเหตุผลที่เลือก Rust: Ecosystem ฝั่ง Data & ML 🦀

ถ้ามองจากบริบทการทำงานของผมที่ LINE MAN Wongnai (LMWN) เรามีฐานอยู่ในสองพื้นที่ครับ: ฝั่ง Applied ML ที่ใช้ Python เป็นหลักในการทดลองโมเดล สร้าง Feature และพัฒนา Pipeline กับฝั่ง Web / Backend Services ที่ใช้ Go เป็นหลัก ส่วนทิศทางของ Prediction Service รอบนี้คือการลงไปทำ Low-level ML Optimization ด้วย Rust โดยต่อยอดจาก Native Ecosystem ที่มี C และ C++ อยู่แล้ว

![แผนภาพสามพื้นที่: Applied ML ใช้ Python และ Web Services ใช้ Go เป็นสถานะปัจจุบัน ส่วน Prediction Service Direction ชี้ลงไปสู่ Low-level ML Optimization ด้วย Rust, C และ C++](https://korntewin.github.io/intro-website/blog/figures/lmwn-ml-web-landscape.png)

การขยับลงมาด้านล่างหมายถึงการเพิ่มความสามารถในการจัดการ Memory Layout, SIMD, Preprocessing และ Inference Execution ด้วยตัวเอง โดยยังเชื่อมกับ Workflow ฝั่ง Python และ Service ที่มีอยู่

Go ตอบโจทย์งาน Networking และ Backend Service ของเราอยู่แล้วครับ แต่พอเป็น Preprocessing ที่ต้องจัดการข้อมูลจำนวนมาก Rust มี Library ที่เราใช้ได้ตรง ๆ เช่น [Polars](https://pola.rs/), [nlpO3](https://github.com/PyThaiNLP/nlpo3) สำหรับ Thai NLP และ [Hugging Face Tokenizers](https://github.com/huggingface/tokenizers) สำหรับ Tokenization ซึ่งทั้งหมดมี Core อยู่บน Rust

เราจึงควบคุม **Ownership, Lifetime และ Memory Layout** บน Hot Path ได้ละเอียด โดยไม่มี Garbage Collector ของภาษาเข้ามาเกี่ยวข้อง สำหรับ Workload นี้ Ecosystem เป็นเหตุผลสำคัญที่เราเลือก Rust ครับ 🦀

อีกเหตุผลคือการเชื่อมกับ Python ครับ ฝั่ง Go มี [cgo](https://pkg.go.dev/cmd/cgo) ที่ Mature สำหรับเรียก C API แต่ถ้าจะ Embed CPython ก็ต้องจัดการ CPython C API, Object Lifetime, References และ GIL ข้าม Runtime เอง ส่วน Rust มี [PyO3](https://pyo3.rs/) ที่ออกแบบมาเพื่อ Python Binding โดยตรง ทั้งการเรียก Python จาก Rust และการทำ Python Extension พร้อม [maturin](https://www.maturin.rs/) สำหรับ Build และ Package งานแบบนี้จึงเขียนและดูแลผ่าน PyO3 ได้สะดวกกว่าการต่อ Binding ผ่าน cgo เองครับ

## 1. Apache Arrow + Polars: จัด Memory ให้ CPU อ่านง่ายขึ้น 📦

ก่อนอื่นต้องเข้าใจว่า CPU ไม่ได้อ่านข้อมูลจาก RAM ทีละชิ้นแบบไม่มีต้นทุน ทุกครั้งที่ต้องตาม Pointer ไปยัง Memory Location ใหม่ เราเสี่ยงเจอ Cache Miss และต้องรอข้อมูลจาก Memory Hierarchy ชั้นที่ช้ากว่า (จาก CPU Cache -> RAM)

ถ้าเก็บข้อมูลแบบ Row-oriented ที่แต่ละ Record ถือ Field หลายชนิดอยู่ใน HashMap ต่าง ๆ การวนประมวลผล Feature เดียวกันของหลายพัน Records อาจทำให้ CPU ต้อง Pointer Chasing ไปมาระหว่าง Address จำนวนมาก

แต่ Preprocessing ของ ML มักทำงาน “ทีละ Feature กับหลาย Records” มากกว่า “ทีละ Record กับทุก Feature” เราจึงเลือกใช้ Apache Arrow เป็นพื้นฐาน Columnar Memory Format และใช้ Polars ในการจัดการ DataFrame

![ภาพอธิบาย Row-oriented และ Columnar Memory Layout](https://korntewin.github.io/intro-website/blog/figures/columnar-memory.png)

ใน Columnar Layout ค่าประเภทเดียวกันจะถูกจัดเก็บใน Buffer ตาม Column ทำให้การ Scan Column ตัวเลขมี Memory Locality ดีกว่าโครงสร้างที่ต้อง Dereference Object หลายชั้น และเปิดโอกาสให้ Compiler หรือ Library ใช้ SIMD / Vectorized Operations ได้มีประสิทธิภาพขึ้น

String Column ยังใช้ Offsets และ Values Buffers ส่วน Polars ก็อาจเก็บหลาย Chunk ได้ แต่สำหรับ Workload ของเรา จุดสำคัญคือการลด Pointer Chasing ตอนประมวลผลทีละ Column

### Memory Efficiency: Arrow vs Go Swiss Table 💾

เพื่อเปรียบเทียบให้เห็นภาพ สมมติ 1 Record มี Feature `score: f32` เพียงค่าเดียว และปัจจุบัน Go Service จะเก็บข้อมูลเป็น `[]map[string]any` (หนึ่ง Map ต่อ Record) เพื่อความยืดหยุ่นในการเก็บข้อมูลได้หลากหลายประเภทตามแต่ Feature ที่เราจะใช้ของโมเดล

Go 1.24+ ใช้ [Swiss Table](https://go.dev/blog/swisstable) ซึ่งมี Map Header ~48 B และ Group ขนาด 8 Slots (Control 8 B + Key/Value 8 × (16 B string + 16 B any) = 264 B ปัดเป็น ~288 B ตาม Allocator) รวม Slice Pointer 8 B และค่า f32 ที่ถูก Box อีก ~8 B จึงประเมินเป็น **~352 B ต่อ Record** ส่วน Arrow แชร์ Schema และเก็บ f32 แบบ Contiguous เพียง **4 B ต่อ Record** (+ Validity Bitmap 1 Bit ต่อ Record หากต้องแทน Null)

![แผนภาพประมาณการหน่วยความจำ Go Swiss Table เทียบ Apache Arrow สำหรับ 1,000 และ 10,000 Records พร้อม Memory Breakdown และอัตราส่วน 85 เท่า](https://korntewin.github.io/intro-website/blog/figures/arrow-swiss-memory.png)

สำหรับ 1,000 Records: Go ประมาณ 352,000 B เทียบกับ Arrow 4,125 B (~85×)

10,000 Records: Go ประมาณ 3,520,000 B เทียบกับ Arrow 41,250 B (~85×)

ตัวเลข **~85×** นี้เป็นการประมาณ Memory Layout ของเคสที่ Go ใช้ Map แยกต่อ Record ไม่ใช่ผล Benchmark ว่า Arrow จะประหยัด Memory ได้เท่านี้ทุกงานนะครับ ถ้า Go ใช้ `[]float32` ก็เก็บตัวเลขแบบ Compact ได้เช่นกัน และ Memory จริงยังมี Allocation กับ Metadata อื่น ๆ ด้วย

### Validity Bitmap: เก็บ Null ด้วย 1 Bit ต่อค่า

อีกจุดที่ช่วยลด Memory Overhead คือ **Validity Bitmap** ของ Apache Arrow แทนที่จะห่อแต่ละค่าด้วย Object ที่มี Pointer หรือ Metadata แยกกัน Arrow ใช้ Bit เป็นตัวบอกว่าแต่ละ Slot มีค่าหรือเป็น Null โดย 1 = Valid และ 0 = Null ใช้เพียง 1 Bit ต่อ Slot (ยังไม่รวม Padding หรือ Metadata ของ Buffer) และถ้าทั้ง Column ไม่มี Null ก็สามารถ ไม่ต้องสร้าง Validity Bitmap เลยได้

ลองนึกถึงคอลัมน์รายการสินค้าที่มีค่าเป็น [10, 20, 30], null, [] และ [40, 50] จะเห็นว่า Null List กับ Empty List ไม่เหมือนกัน ถึงแม้ทั้งคู่จะไม่มี Item อยู่ในช่วง Child Values ก็ตาม Validity Bitmap จึงเป็นตัวช่วยบอกความแตกต่างตรงนี้

### LargeList + Offsets: ทำ List ให้แชร์ Buffer เดียวกัน

สำหรับข้อมูลแบบ Nested List เราไม่จำเป็นต้องสร้าง Heap Object แยกสำหรับทุก Row เพราะ Arrow ใช้ Offsets Buffer เก็บจุดเริ่มและจุดสิ้นสุดของข้อมูลใน Child Values Buffer เดียวกัน เช่น `offsets = [0, 3, 3, 3, 5]` และ `values = [10, 20, 30, 40, 50]` โดย Row ที่ i จะเข้าถึงข้อมูลช่วง `values[offsets[i]..offsets[i+1]]`

![แผนภาพ Apache Arrow Validity Bitmap และ LargeList Offsets ที่แชร์ Child Values Buffer](https://korntewin.github.io/intro-website/blog/figures/arrow-validity-large-list.png)

สำหรับ LargeList จะใช้ 64-bit Offsets แทน 32-bit Offsets ของ List จึงรองรับ Child Arrays ที่มีจำนวน Elements มากได้ ส่วนสิ่งที่ช่วย Memory Locality จริง ๆ คือ การเก็บ Values ต่อเนื่องและอ้างอิงด้วย Offsets แทนการกระโดดตาม Pointer ของแต่ละ Row

เมื่อส่ง Mini-batch ไปที่ Actor Worker เราจึงสามารถส่ง **View/Slice ของ Buffer เดิม** ได้ในหลายกรณี โดยไม่ต้องสร้าง List Object ใหม่ทุก Row นี่เป็นจุดเชื่อมสำคัญระหว่าง Columnar Format, Zero-copy และ Data Parallelism ครับ

### Bonus: Zero-copy Slice ไม่ต้อง Copy ทุก Mini-batch

เวลาแบ่ง Items เป็น Mini-batch ถ้าต้องสร้าง Array ใหม่แล้ว Copy ค่าเดิมทุกครั้ง ก็เปลืองทั้ง Allocation และ Memory Bandwidth โดยไม่จำเป็นครับ

Arrow รองรับการ **Slice ที่แชร์ Buffer เดิม** โดยเปลี่ยน Metadata เช่น Offset และ Length แทนการ Copy Payload ซึ่งเหมาะกับการส่ง Mini-batch ให้ Worker มากครับ

![แผนภาพ Arrow Zero-copy Slicing ที่แชร์ Underlying Buffer เดียวกัน](https://korntewin.github.io/intro-website/blog/figures/arrow-zero-copy.png)

**Zero-copy ใช้ได้กับการ Slice ไม่ได้แปลว่า Pipeline ทั้งเส้นไม่มี Allocation** การ Cast Type, Compute Feature, Rechunk หรือเตรียม Input ให้ ONNX Runtime อาจยังต้องสร้าง Buffer ใหม่ครับ

## 2. Actor Model: ให้แต่ละ ML Model จัดการ Mini-batch ของตัวเอง 🧵

พอ Traffic สูง เราอาจมี Runnable Threads มากกว่าจำนวน CPU Cores โดยไม่รู้ตัว ทั้งงานที่แต่ละ Request Spawn ขึ้นมา และ Worker Threads ของ ONNX Runtime เอง

ผลที่ตามมาคือ **Oversubscription**: มี Runnable Threads มากเกิน CPU Core จนเกิด Context Switching และแย่ง Cache กัน สุดท้าย Throughput ไม่เพิ่ม แต่ Tail Latency กลับแย่ลง

ใน RIIR เราใช้ **Actor Model** โดยแยก **Preprocessing Actor Pool** และ **Inference Actor Pool** สำหรับแต่ละ ML Model แล้วแบ่ง Items ใน Request เป็น Mini-batch ให้ Worker ประมวลผล

![แผนภาพ Actor Model แยก Preprocessing และ Inference Worker Pools พร้อม Mini-batches](https://korntewin.github.io/intro-website/blog/figures/actor-mini-batches.png)

สิ่งที่ได้คือเราสามารถปรับ **Worker Count, Batch Size และ ONNX Runtime Threads** แยกตามโมเดลได้ ไม่จำเป็นต้องใช้ค่าเดียวกันทั้ง Service เพราะแต่ละโมเดลมีลักษณะต่างกัน เช่น Preprocessing หนักแต่ Inference เบา หรือ Inference ใช้ Memory Bandwidth มากจนเพิ่ม Threads แล้วไม่ได้เร็วขึ้น

จุดที่ Actor Model ช่วยไม่ใช่ทำให้คำนวณเร็วขึ้นตรง ๆ แต่คือการกำหนด **ขอบเขต Concurrency และ Ownership** ให้ชัด เราจึง Tune แต่ละ Stage ได้โดยไม่ปล่อยให้ทุก Request แย่ง CPU กันเองครับ

## 3. Kahn’s Algorithm: จัดลำดับ Preprocessing ก่อนรับ Traffic 🧩

Preprocessing ของ ML ไม่ใช่แค่ Loop Transform Feature ธรรมดา เพราะ Function หลายตัวมี Dependency ต่อกัน เช่น ต้อง Normalize ก่อนสร้าง Derived Feature หรือสร้าง Column A/B ก่อนนำไปประกอบเป็น Input ของโมเดล

ถ้าเราเรียก Function ผิดลำดับ อาจได้ผล Predict ผิดหรือเกิด Missing Column ตอน Runtime ดังนั้นเราสร้างลำดับการประมวลผลของ Function หลาย ๆ ตัวเป็น **Directed Acyclic Graph (DAG)** แล้วใช้ **Kahn’s Algorithm** สำหรับ Topological Sort เพื่อ Compile ลำดับการทำงานที่ถูกต้องตั้งแต่แรก

![แผนภาพ Dependency Graph และ Kahn Topological Sort ของ Preprocessing](https://korntewin.github.io/intro-website/blog/figures/kahn-dag.png)

Kahn’s Algorithm เริ่มจากนับจำนวน Dependency ที่เข้ามาในแต่ละ Node (in-degree) แล้วเลือก Node ที่มี in-degree เป็น 0 มาประมวลผล จากนั้นลด in-degree ของ Node ถัดไปและทำซ้ำ หากยังมี Node เหลือแต่ไม่มีตัวไหนพร้อม แสดงว่ามี Cycle ที่ต้องแก้ก่อน Service Start

ข้อดีสำหรับ Production Service คือเราเปลี่ยนงานจาก “ค้นหาลำดับ Preprocessing ทุก Request” เป็น “**Validate และ Compile ครั้งเดียวตั้งแต่ตอน Startup**” เมื่อ Request เข้ามาก็ Execute แผนที่เตรียมไว้ได้เลย

สำหรับ RIIR รอบนี้เราเลือกทำ **1D Parallelism หรือ Data Parallelism เพียงมิติเดียว** คือแบ่ง Items ในแต่ละ Request เป็น Mini-batches แล้วให้ Workers ประมวลผลข้อมูลแต่ละ Mini-Batch พร้อมกัน แต่ ภายในแต่ละ Mini-batch เรา Execute Preprocessing Nodes ตามลำดับ Topological Sort ไม่ได้ Parallel แยกตาม Nodes แม้ว่าบาง Nodes จะไม่มี Dependency ต่อกันก็ตาม

เหตุผลคือเรามีทั้ง Actor Workers และ ONNX Runtime Threads ที่ใช้ CPU อยู่แล้ว ถ้าทำ Parallel ทั้งตาม Items และตาม DAG Nodes เพิ่มอีกชั้น อาจเกิด CPU Oversubscription ทำให้ Threads แย่ง CPU กันมากขึ้น เกิด Context Switching และส่งผลเสียต่อ P99 Latency

เราไม่ได้พยายาม Parallel ทุกอย่างที่ Parallel ได้ แต่เลือก Parallel เฉพาะ แกนข้อมูล (Data) เพื่อคุมจำนวนงานที่วิ่งพร้อมกันให้เหมาะกับ CPU ครับ 🧵

## 4. Rust 1.98: Algebraic Floating Point เปิดทางให้ SIMD เพิ่มเติม ⚡

จริง ๆ LLVM รองรับการ Auto-vectorize เพื่อใช้งาน SIMD Instructions ของ CPU อยู่แล้ว และ Rust ก็ไม่ได้ห้าม Vectorization นะครับ 😅 แต่บาง Loop โดยเฉพาะการคำนวณ Floating Point จะ Vectorize ตรง ๆ ไม่ได้ หากการแปลงนั้นทำให้ลำดับ Operation เปลี่ยนไปจาก Semantics ที่โค้ดกำหนดไว้

สาเหตุเนื่องมาจากว่า Floating Point ไม่ได้มี Associativity แบบเลขจริง เช่น (a + b) + c อาจได้ค่าไม่เท่ากับ a + (b + c) เพราะมี Rounding ในแต่ละ Operation ดังนั้นเพื่อให้ได้ค่าเดิมเสมอ bitwise identical จะต้องให้ลำดับการประมวลผลเหมือนเดิมเสมอ!

Rust 1.98 เพิ่ม Method อย่าง `f32::algebraic_add` และ `f64::algebraic_mul` ที่เราเลือกใช้เป็นจุด ๆ ได้ เพื่อเปิดโอกาสให้ Compiler Reassociate หรือเปลี่ยนรูปสมการ และอาจทำให้ Loop Vectorization เกิดขึ้นได้มากขึ้น

![ภาพอธิบายการจัดกลุ่ม Floating Point Operations ใหม่เพื่อเปิดทางให้ Vectorization](https://korntewin.github.io/intro-website/blog/figures/algebraic-floats.png)

ตัวอย่าง:

```rust
// Normal FP operations preserve the prescribed evaluation semantics.
let normal = ((a + b) + c) + d;

// Explicit algebraic operations allow the compiler more freedom.
let algebraic = a.algebraic_add(b)
    .algebraic_add(c)
    .algebraic_add(d);
```

Algebraic Operations อาจทำให้ผลลัพธ์ต่างไปจากเดิม ทั้งเรื่อง Rounding, NaN, Infinity และ Signed Zero เราจึงเลือกเปิดใช้เป็นจุด ๆ พร้อมทำ **Parity Tests และ Benchmark** เทียบกับ Implementation เดิมก่อนครับ

ส่วนตัวเลข **2.4× / 5.4× / 1.9×** ด้านบนเป็นผลจากการออกแบบระบบใหม่หลายส่วนรวมกัน ไม่ใช่ Benchmark ของ Algebraic FP เพียงอย่างเดียวครับ 🚀

## 5. Memory Allocator: ptmalloc, mimalloc หรือ jemalloc? 🧠

อีกจุดที่หลายคนมองข้ามคือ Memory Allocator ครับ ต่อให้ DataFrame ถูกจัด Layout ดีขึ้น งาน Preprocessing ก็ยังต้องสร้าง Temporary Buffers, Intermediate Columns และ Objects ระหว่างทางอยู่ดี

บน Linux ที่ใช้ glibc ตัว System Allocator ปกติคือ ptmalloc ซึ่งใช้งานทั่วไปได้ดี แต่ใน Workload ที่มี Allocation/Free จำนวนมากพร้อมกันหลาย Threads เราอาจต้องพิจารณาทางเลือกอื่น เช่น mimalloc และ jemalloc

| Allocator | จุดเด่น | Trade-off ที่ควรดู |
| --- | --- | --- |
| **ptmalloc** (glibc default) | ไม่ต้องเพิ่ม Dependency และทำงานได้ดีในงานทั่วไป | Workload ที่ Allocate/Free พร้อมกันอาจเจอ Contention หรือ Fragmentation ตาม Pattern |
| **mimalloc** | ออกแบบเรื่อง Fast Allocation, Thread-local Paths และ Low Contention | ผลลัพธ์ขึ้นอยู่กับขนาด Object, Allocation Pattern และ Memory Footprint |
| **jemalloc ผ่าน tikv-jemallocator** | มี Arena / Thread Cache, ปรับจูนได้ และรองรับ Heap Profiling | ต้องดู Build, Configuration, RSS Behavior และความซับซ้อนด้าน Operations เพิ่มเติม |

เราเลือก **tikv-jemallocator** เป็น Global Allocator ของ Application เพราะลอง Benchmark เทียบกับ ptmalloc และ mimalloc แล้วพบว่าสามารถลดได้ทั้ง Memory / CPU / latency ค่อนข้างเยอะเลยทีเดียว

ที่น่าสนใจคือโปรเจกต์ต้นทางอย่าง [jemalloc](https://github.com/jemalloc/jemalloc) เคยถูก Archive ก่อนกลับมา Unarchive อีกครั้งในช่วงต้นปี 2026 รวมถึงมี jemalloc 5.3.1 ออกมาในเดือนเมษายนด้วย หลังจากสะสม Improvement และ Optimization มาหลายปี เรียกว่าเป็นการกลับมาที่น่าติดตามเลยครับ 😂

```rust
#[global_allocator]
static GLOBAL_ALLOCATOR: tikv_jemallocator::Jemalloc =
    tikv_jemallocator::Jemalloc;
```

ถ้าจะเทียบ Allocator ให้แฟร์ ต้องใช้ Traffic, Model, Worker Count, Batch Size, Binary และ Environment เดียวกัน แล้ววัดทั้ง Throughput, P99, CPU และ RSS ครับ

### ทำอย่างไรให้ทุก Application ใช้ Allocator เดียวกัน?

ใน Rust การประกาศ #[global_allocator] อยู่ที่ระดับ Binary Application ถ้า Monorepo มีหลาย Application เราอาจพลาดได้ง่ายเมื่อเพิ่ม Use Case ใหม่แล้วลืมระบุ Allocator

เราเลยใช้ Semgrep เป็น Policy Check ใน CI เพื่อบังคับให้แต่ละ Application Layer มีการ Configure Global Allocator ตามมาตรฐานเดียวกัน วิธีนี้ช่วยไม่ให้เรื่อง Performance ที่ต้องทำซ้ำกลายเป็นสิ่งที่ขึ้นอยู่กับความจำของคนเขียน Code

## 6. Workspace + Application Layer: รองรับหลาย Use Case โดยไม่ Copy Core 🏗️

เมื่อ Service ต้องรองรับมากกว่าหนึ่ง ML Model และมี Use Case ใหม่เพิ่มเรื่อย ๆ เราไม่อยากกลับไปสร้าง Service ใหม่โดย Copy Code จากตัวเก่าทุกครั้ง

ดังนั้นในการ Revamp รอบนี้เลยทำให้เป็น **Monorepo แบบ Cargo Workspace** โดยแยก **Application Layer** (Configuration, Adapters, Use Case Composition) ออกจาก **Prediction Core** (Preprocessing DAG, Actor Pools, ONNX Inference, Shared Data Structures)

![แผนภาพ Cargo Workspace ที่แยกหลาย Application ออกจาก Prediction Core และใช้ Semgrep บังคับ Global Allocator](https://korntewin.github.io/intro-website/blog/figures/workspace-semgrep.png)

แต่ละ Application สามารถเลือกประกอบ Predictor ของตัวเองได้ เช่น มีหลายโมเดลที่ต้องทำงานต่อกันหรือมี Input/Output ต่างกัน โดยที่ Core ไม่ต้องรู้ว่าโมเดลกำลังทำนายอะไร และไม่ต้องรับ Business Logic ของแต่ละ Use Case เข้าไปปะปน

ข้อดีไม่ได้มีแค่ Code Reuse แต่ยังช่วยให้เรา Benchmark, Test และ Tune แต่ละ Application ได้โดยไม่สร้างหลาย Implementation ของ Prediction Engine ส่วน Details เรื่อง Architecture ยังมีอีกเยอะ แต่ขอเก็บไว้เล่าคราวหน้าครับ 😄


## ทิ้งท้าย

ย้อนกลับมาดูแล้ว รอบนี้ไม่ได้จบที่การเปลี่ยน Go เป็น Rust แต่เป็นการจัดทางเดินของ Data ไปจนถึง Prediction ใหม่ ตั้งแต่ลดการ Copy ข้อมูล คุมจำนวน Actor Workers ไปจนถึง Compile ลำดับ Preprocessing ไว้ก่อนรับ Request

ผลบน Production ด้านบนทำให้เห็นว่าการรื้อระบบครั้งนี้คุ้มแค่ไหน และถ้า Rollout ครบ **ทุก Use Case ของทีม** เราคาดว่า Cluster CPU Request จะลดจาก **79% เหลือ 69% (10 percentage points)** แต่ตัวเลขนี้ยังเป็น **Projection** ไม่ใช่ผลที่วัดได้หลัง Rollout นะครับ

พอลองไล่ดู Bottleneck ทีละจุด ผมแปลกใจว่าเรามี CPU เสียไปกับการ Copy Data, Allocation และ Thread Contention มากแค่ไหน พอเอา CPU เหล่านั้นกลับมาได้ ก็มี Capacity เหลือให้ ML Use Case ถัดไปโดยไม่ต้องรีบหาเครื่องเพิ่มใน Private Cloud ที่แทบจะเต็มอยู่แล้ว นี่แหละครับสิ่งที่ผมชอบที่สุดของ RIIR รอบนี้ 🦀

---

**อ่านต่อ / References:** [บทความ Optimization รอบก่อน](https://life.lmwn.com/เบื้องหลังการลด-cost-ai-server-ลง-9-เท่า-และทำให้แอปเร็วขึ้น-4-เท่าที่-line-man-wongnai-da855335de5f) · [Rust 1.98 Release Notes](https://blog.rust-lang.org/2026/08/20/Rust-1.98.0/) · [Apache Arrow Columnar Format](https://arrow.apache.org/docs/format/Columnar.html) · [Go Swiss Tables](https://go.dev/blog/swisstable) · [Medium image formats](https://help.medium.com/hc/en-us/articles/215679797-Using-images) · [Polars](https://pola.rs/) · [tikv/jemallocator](https://github.com/tikv/jemallocator)
