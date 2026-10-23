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

โจทย์รอบนี้จึงเปลี่ยนจาก “จูน Service ที่มีอยู่แล้วให้ดีขึ้น” มาเป็น เราจะ Revamp ML Prediction Service (ด้วยพลัง AI 😂) ให้รองรับ Workload ที่เพิ่มขึ้นได้อย่างไร ภายใต้ Capacity ของ Private Cloud ที่เหลืออยู่อย่างจำกัด?

เราตัดสินใจทำ **RIIR (Rewrite It In Rust)** แต่ไม่ได้แค่แปลงโค้ด Go เป็น Rust แบบหนึ่งต่อหนึ่ง เราใช้โอกาสนี้ Re-Architect ใหม่ทั้งหมด รวมไปถึง Memory Layout, Concurrency, Preprocessing Execution และ Code Structure ใหม่ โดยเป้าหมายคือให้แต่ละ CPU Core ทำงานที่มีประโยชน์มากขึ้นครับ

อีกเรื่องที่น่าสนใจคือ เราใช้เวลา**ประมาณ 1 สัปดาห์ในการ Port จาก Go มา Rust โดยมี AI Agent ช่วย** แต่สิ่งที่ทำให้ Agent ช่วยได้จริงไม่ใช่แค่การแปลง Syntax ครับ เราต้องกำหนด Software Engineering Practice ให้ชัดเจนก่อน ว่าให้ใช้ Data Structure, Algorithm และ Concurrency Model แบบไหน (เพื่อไม่ให้พลาดซ้ำรอยเดิม 😅)

บทความนี้เป็น Engineering Story ไม่ใช่การบอกว่า Rust เร็วกว่า Go ในทุกกรณี ผลลัพธ์ที่ได้เป็นการวัด Performance บน Production Workload ของ Use Case Recommendation Ranker ใน LMWN เท่านั้นครับ 🔥

## ผลลัพธ์ Go vs Rust บน Production 📊

เราเปรียบเทียบ Service ทั้งสองเวอร์ชันใน Production ด้วย **A/B Testing** ภายใต้ **Traffic Split เท่ากัน** เก็บข้อมูลต่อเนื่อง 18 ชั่วโมง ในวันที่ 17–18 ตุลาคม 2026 และดูทั้ง P99 Latency, CPU และ Memory ในระดับ Pod

![กราฟเปรียบเทียบ P99 latency, CPU และ Memory ของ Go และ Rust](https://korntewin.github.io/intro-website/blog/figures/production-results.png)

| Metric | Go (median / peak) | Rust (median / peak) | Improvement |
| --- | ---: | ---: | ---: |
| **P99 server latency** | 416 / 829 ms | 146 / 419 ms | **2.4×** |
| **Max pod CPU usage** | 16.9% / 45.2% | 3.0% / 8.6% | **5.4×** |
| **Max pod memory** | 2.68 / 3.56 GB | 1.43 / 1.70 GB | **1.9×** |

หมายเหตุเล็กน้อย: ค่า Improvement ในรายงานคำนวณจาก median ของอัตราส่วน Go/Rust ที่วัดแต่ละนาที ไม่ใช่นำ median ของสองฝั่งมาหารกันตรง ๆ ส่วนกราฟแสดง median ของแต่ละฝั่งเพื่อให้เห็นขนาดความแตกต่าง อ่านตัวเลขสองแบบนี้แยกกันนะครับ

### ดูกราฟ Production จริงตลอด 18 ชั่วโมง 👀

ตัวเลข Median ด้านบนช่วยให้เห็นขนาดของ Improvement แต่สำหรับสาย Performance Engineering สิ่งที่น่าดูไม่แพ้กันคือ แนวโน้มของ CPU, Memory และ P99 Latency ภายใต้ Traffic จริงตลอด 18 ชั่วโมง ครับ

![Production dashboard เปรียบเทียบ CPU, Memory และ P99 Latency ของ Go กับ Rust](https://korntewin.github.io/intro-website/blog/figures/production-timeseries-dashboard.png)

กราฟสีเหลืองคือ Go, สีเขียวคือ Rust และเส้นประสีน้ำเงินคือ Improvement Ratio (อ่านค่าจากแกนขวา) จะเห็นว่าแม้ Load เปลี่ยนตลอดวัน แต่ Rust ยังคงใช้ CPU และ Memory ต่ำกว่าอย่างชัดเจน

**CPU Usage:** จุดที่น่าสนใจคือแม้ Go จะมีการแกว่งตาม Traffic มาก แต่ Rust คุมการใช้ CPU ได้ในระดับต่ำกว่าเมื่อเทียบกับ Traffic Split เดียวกัน

![กราฟ CPU Usage Go เทียบ Rust ตลอด 18 ชั่วโมง พร้อม Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-cpu-timeseries.png)

**Memory Usage:** กราฟนี้ทำให้เห็นความแตกต่างของ Memory Footprint ได้ชัด โดยเฉพาะเมื่อดูช่วงที่ Go มี Spike ต่อเนื่อง

![กราฟ Memory Usage Go เทียบ Rust ตลอด 18 ชั่วโมง พร้อม Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-memory-timeseries.png)

**P99 Latency:** สิ่งที่ต้องดูไม่ใช่แค่ค่าเฉลี่ย แต่รวมถึง Tail Latency ว่าแต่ละ Service ตอบสนองอย่างไรเมื่อ Traffic แกว่ง

![กราฟ P99 Latency Go เทียบ Rust ตลอด 18 ชั่วโมง พร้อม Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-p99-timeseries.png)

ตัวเลขที่ผมชอบที่สุดไม่ใช่แค่ P99 ที่ลดลง แต่คือ CPU ที่ลดลงอย่างมาก เพราะสำหรับ ML Inference แบบ CPU-bound ทรัพยากรที่ใช้ไปกับ Thread Contention, Cache Miss หรือ Copy ข้อมูล **คือทรัพยากรที่เอาไป Predict ให้โมเดลอื่นไม่ได้**

## ทำไมไม่เปลี่ยนแค่ภาษา?

หลายครั้งเวลาเห็น Benchmark ภาษาโปรแกรม เรามักสรุปสั้น ๆ ว่า “Rust เร็วกว่า Go” แต่สำหรับ Production Inference จริง ๆ **ภาษาเป็นเพียงหนึ่งในปัจจัย** ครับ

สมมติเรายังเก็บ Feature เป็น HashMap แบบเดิม, Copy Data ทุกครั้งที่แบ่ง Batch หรือปล่อยให้ ONNX Runtime ทุกตัวเปิด Thread แข่งกัน แม้เปลี่ยนเป็น Rust ก็อาจไม่ได้ผลอย่างที่หวัง ตรงกันข้าม หากจัด Memory Layout และ Concurrency Control ให้ดี เราก็สามารถลดงานที่ CPU ไม่จำเป็นต้องทำลงไปได้มากแล้วครับ

### Quick Win ที่ลองแล้ว: ทำไม Quantization ถึงไม่คุ้มในเคสนี้? ⚖️

เราไม่ได้กระโดดไป Rewrite อย่างเดียวครับ อีกแนวทางที่เราลองเป็น Quick Win คือ **Model Quantization** เพื่อลดต้นทุนของ Inference แต่โมเดลที่ใช้ใน Use Case นี้ **มีขนาดเล็กอยู่แล้ว** ผลที่วัดได้คือ **Performance ดีขึ้นเพียงเล็กน้อย** ขณะที่ **Model Accuracy ลดลงมากเกินกว่าที่เรายอมรับได้** จึงไม่ใช่ Trade-off ที่เหมาะกับการนำขึ้น Production

ไม่ได้แปลว่า Quantization ไม่มีประโยชน์นะครับ สำหรับโมเดลที่ใหญ่กว่านี้หรือ Hardware/Kernel ที่รองรับได้ดี ผลลัพธ์อาจต่างกันมาก แต่ใน Workload ของเรา การลด Precision ของโมเดลไม่ได้ช่วยลดต้นทุนของ Pipeline ทั้งเส้นได้มากพอ เราจึงหันมาให้ความสำคัญกับ Data Movement, Preprocessing และ Concurrency ซึ่งเป็นจุดที่ Optimize ได้โดยไม่ต้องแลก Model Accuracy

### อีกเหตุผลที่เลือก Rust: Ecosystem ฝั่ง Data & ML 🦀

ถ้ามองจากบริบทการทำงานของผมที่ LINE MAN Wongnai (LMWN) เรามีฐานอยู่ในสองพื้นที่ครับ: ฝั่ง Applied ML ที่ใช้ Python เป็นหลักในการทดลองโมเดล สร้าง Feature และพัฒนา Pipeline กับฝั่ง Web / Backend Services ที่ใช้ Go เป็นหลัก ส่วนทิศทางของ Prediction Service รอบนี้คือการลงไปทำ Low-level ML Optimization ด้วย Rust โดยต่อยอดจาก Native Ecosystem ที่มี C และ C++ อยู่แล้ว

![แผนภาพสามพื้นที่: Applied ML ใช้ Python และ Web Services ใช้ Go เป็นสถานะปัจจุบัน ส่วน Prediction Service Direction ชี้ลงไปสู่ Low-level ML Optimization ด้วย Rust, C และ C++](https://korntewin.github.io/intro-website/blog/figures/lmwn-ml-web-landscape.png)

การขยับลงมาด้านล่างหมายถึงการเพิ่มความสามารถในการจัดการ Memory Layout, SIMD, Preprocessing และ Inference Execution ด้วยตัวเอง โดยยังเชื่อมกับ Workflow ฝั่ง Python และ Service ที่มีอยู่

จริง ๆ แล้ว Go เป็นภาษาที่ดีมากสำหรับ Web Service, Networking และ Cloud Infrastructure ครับ แต่พอเป็นงาน Data Processing กับ ML Inference ผมมองว่า Rust มี Ecosystem ของ Library ที่ตอบโจทย์เรามากกว่า เช่น [Polars](https://pola.rs/) , [nlpO3](https://github.com/PyThaiNLP/nlpo3) สำหรับ Thai NLP และ [Hugging Face Tokenizers](https://github.com/huggingface/tokenizers) สำหรับ Tokenization ซึ่งทั้งหมดมี Core Engine อยู่บน Rust

ข้อได้เปรียบคือเราสามารถใช้ Library เหล่านี้ใน Rust ได้โดยตรงและควบคุม **Ownership, Lifetime และ Memory Layout** ได้ละเอียด โดยไม่ต้องมี Garbage Collector ของภาษาเข้ามาทำงานบน Hot Path นี่ไม่ได้แปลว่า Rust เก่งกว่า Go ในทุกด้านนะครับ แต่สำหรับงาน Preprocessing ที่ต้องวิ่งผ่านข้อมูลจำนวนมาก ความพร้อมของ Ecosystem สำคัญไม่แพ้ตัวภาษาเลย 🦀

อีกเหตุผลสำคัญคือ การเชื่อมกับ Python Ecosystem ครับ ฝั่ง Go มี [cgo](https://pkg.go.dev/cmd/cgo) ที่เป็นเครื่องมือ Mature สำหรับเรียก C API แต่ ไม่ได้ออกแบบมาเป็น Python Binding โดยตรง หากต้องเรียก Python ภายใน Process เดียวกัน ก็ต้องเชื่อมผ่าน CPython C API และดูแล Pointer, Object Lifetime และ GIL ข้าม Runtime เพิ่มขึ้น ขณะที่ฝั่ง Rust มี [PyO3](https://pyo3.rs/) ซึ่งเป็น Python Binding ที่พัฒนามาสำหรับงานนี้โดยเฉพาะ ทั้งการเรียก Python จาก Rust และการสร้าง Python Extension ด้วย Rust พร้อม [maturin](https://www.maturin.rs/) สำหรับ Build และ Package ดังนั้น cgo และ PyO3 ต่างก็ Mature ในขอบเขตของตัวเอง แต่สำหรับ Python Integration ผมมองว่า Rust มี Abstraction และ Tooling ที่ตอบโจทย์กว่า

## 1. Apache Arrow + Polars: จัด Memory ให้ CPU อ่านง่ายขึ้น 📦

ก่อนอื่นต้องเข้าใจว่า CPU ไม่ได้อ่านข้อมูลจาก RAM ทีละชิ้นแบบไม่มีต้นทุน ทุกครั้งที่ต้องตาม Pointer ไปยัง Memory Location ใหม่ เราเสี่ยงเจอ Cache Miss และต้องรอข้อมูลจาก Memory Hierarchy ชั้นที่ช้ากว่า (จาก CPU Cache -> RAM)

ถ้าเก็บข้อมูลแบบ Row-oriented ที่แต่ละ Record ถือ Field หลายชนิดอยู่ใน HashMap ต่าง ๆ การวนประมวลผล Feature เดียวกันของหลายพัน Records อาจทำให้ CPU ต้อง Pointer Chasing ไปมาระหว่าง Address จำนวนมาก

แต่ Preprocessing ของ ML มักทำงาน “ทีละ Feature กับหลาย Records” มากกว่า “ทีละ Record กับทุก Feature” เราจึงเลือกใช้ Apache Arrow เป็นพื้นฐาน Columnar Memory Format และใช้ Polars ในการจัดการ DataFrame

![ภาพอธิบาย Row-oriented และ Columnar Memory Layout](https://korntewin.github.io/intro-website/blog/figures/columnar-memory.png)

ใน Columnar Layout ค่าประเภทเดียวกันจะถูกจัดเก็บใน Buffer ตาม Column ทำให้การ Scan Column ตัวเลขมี Memory Locality ดีกว่าโครงสร้างที่ต้อง Dereference Object หลายชั้น และเปิดโอกาสให้ Compiler หรือ Library ใช้ SIMD / Vectorized Operations ได้มีประสิทธิภาพขึ้น

แน่นอนว่าไม่ใช่ทุก Arrow Column จะเรียง Value เป็น Array ตัวเลขก้อนเดียวเสมอ เช่น String ใช้ Offset Buffer กับ Values Buffer และ Polars ก็อาจมีหลาย Chunk แต่หลักสำคัญคือ ลดการกระโดดของ Memory Access ที่ไม่จำเป็นสำหรับงานประมวลผลเป็นคอลัมน์

### Memory Efficiency: Arrow vs Go Swiss Table 💾

เพื่อเปรียบเทียบให้เห็นภาพ สมมติ 1 Record มี Feature `score: f32` เพียงค่าเดียว และปัจจุบัน Go Service จะเก็บข้อมูลเป็น `[]map[string]any` (หนึ่ง Map ต่อ Record) เพื่อความยืดหยุ่นในการเก็บข้อมูลได้หลากหลายประเภทตามแต่ Feature ที่เราจะใช้ของโมเดล

Go 1.24+ ใช้ [Swiss Table](https://go.dev/blog/swisstable) ซึ่งมี Map Header ~48 B และ Group ขนาด 8 Slots (Control 8 B + Key/Value 8 × (16 B string + 16 B any) = 264 B ปัดเป็น ~288 B ตาม Allocator) รวม Slice Pointer 8 B และค่า f32 ที่ถูก Box อีก ~8 B จึงประเมินเป็น **~352 B ต่อ Record** ส่วน Arrow แชร์ Schema และเก็บ f32 แบบ Contiguous เพียง **4 B ต่อ Record** (+ Validity Bitmap 1 Bit ต่อ Record หากต้องแทน Null)

![แผนภาพประมาณการหน่วยความจำ Go Swiss Table เทียบ Apache Arrow สำหรับ 1,000 และ 10,000 Records พร้อม Memory Breakdown และอัตราส่วน 85 เท่า](https://korntewin.github.io/intro-website/blog/figures/arrow-swiss-memory.png)

สำหรับ 1,000 Records: Go ประมาณ 352,000 B เทียบกับ Arrow 4,125 B (~85×)

10,000 Records: Go ประมาณ 3,520,000 B เทียบกับ Arrow 41,250 B (~85×)

จะเห็นได้ว่าการเก็บข้อมูลในรูปแบบ Columnar ด้วย Polars สามารถประหยัดพื้นที่ได้มากกว่า **85x**!

### Validity Bitmap: เก็บ Null ด้วย 1 Bit ต่อค่า

อีกจุดที่ช่วยลด Memory Overhead คือ **Validity Bitmap** ของ Apache Arrow แทนที่จะห่อแต่ละค่าด้วย Object ที่มี Pointer หรือ Metadata แยกกัน Arrow ใช้ Bit เป็นตัวบอกว่าแต่ละ Slot มีค่าหรือเป็น Null โดย 1 = Valid และ 0 = Null ใช้เพียง 1 Bit ต่อ Slot (ยังไม่รวม Padding หรือ Metadata ของ Buffer) และถ้าทั้ง Column ไม่มี Null ก็สามารถ ไม่ต้องสร้าง Validity Bitmap เลยได้

ลองนึกถึงคอลัมน์รายการสินค้าที่มีค่าเป็น [10, 20, 30], null, [] และ [40, 50] จะเห็นว่า Null List กับ Empty List ไม่เหมือนกัน ถึงแม้ทั้งคู่จะไม่มี Item อยู่ในช่วง Child Values ก็ตาม Validity Bitmap จึงเป็นตัวช่วยบอกความแตกต่างตรงนี้

### LargeList + Offsets: ทำ List ให้แชร์ Buffer เดียวกัน

สำหรับข้อมูลแบบ Nested List เราไม่จำเป็นต้องสร้าง Heap Object แยกสำหรับทุก Row เพราะ Arrow ใช้ Offsets Buffer เก็บจุดเริ่มและจุดสิ้นสุดของข้อมูลใน Child Values Buffer เดียวกัน เช่น `offsets = [0, 3, 3, 3, 5]` และ `values = [10, 20, 30, 40, 50]` โดย Row ที่ i จะเข้าถึงข้อมูลช่วง `values[offsets[i]..offsets[i+1]]`

![แผนภาพ Apache Arrow Validity Bitmap และ LargeList Offsets ที่แชร์ Child Values Buffer](https://korntewin.github.io/intro-website/blog/figures/arrow-validity-large-list.png)

สำหรับ LargeList จะใช้ 64-bit Offsets แทน 32-bit Offsets ของ List จึงรองรับ Child Arrays ที่มีจำนวน Elements มากได้ ส่วนสิ่งที่ช่วย Memory Locality จริง ๆ คือ การเก็บ Values ต่อเนื่องและอ้างอิงด้วย Offsets แทนการกระโดดตาม Pointer ของแต่ละ Row

เมื่อส่ง Mini-batch ไปที่ Actor Worker เราจึงสามารถส่ง **View/Slice ของ Buffer เดิม** ได้ในหลายกรณี โดยไม่ต้องสร้าง List Object ใหม่ทุก Row นี่เป็นจุดเชื่อมสำคัญระหว่าง Columnar Format, Zero-copy และ Data Parallelism ครับ

### Bonus: Zero-copy Slice ไม่ต้อง Copy ทุก Mini-batch

เวลาจะส่งข้อมูลจำนวนมากเข้า Worker เรามักต้องแบ่งเป็น Mini-batch ถ้าทุกครั้งต้องสร้าง Array ใหม่แล้ว Copy ค่าเดิมทั้งหมด ก็เท่ากับต้องเสีย Memory Bandwidth ไปกับการ Allocation เพิ่มทั้งที่ข้อมูลใช้ข้อมูลเดิม!

Arrow รองรับการ **Slice ที่แชร์ Buffer เดิม** โดยเปลี่ยน Metadata เช่น Offset และ Length แทนการ Copy Payload ซึ่งเหมาะกับการส่ง Mini-batch ให้ Worker มากครับ

![แผนภาพ Arrow Zero-copy Slicing ที่แชร์ Underlying Buffer เดียวกัน](https://korntewin.github.io/intro-website/blog/figures/arrow-zero-copy.png)

ข้อควรระวังคือ Zero-copy ไม่ได้หมายความว่า Pipeline ทั้งเส้นไม่มี Allocation การ Cast Type, Compute Feature, Rechunk หรือแปลง Input สำหรับ ONNX Runtime บางกรณีก็ยังสร้าง Buffer ใหม่ได้ เราจึงใช้ Zero-copy ในจุดที่รองรับจริง และวัด Allocation ในจุดที่ยังหลีกเลี่ยงไม่ได้

## 2. Actor Model: ให้แต่ละ ML Model จัดการ Mini-batch ของตัวเอง 🧵

ปัญหาคลาสสิกของระบบ CPU-bound คือเมื่อมี Request เข้ามามาก เราอาจเผลอเพิ่ม Concurrency/Parallel มากกว่าที่ Hardware จะรับไหว เช่น Request หลายตัวต่าง Spawn งานประมวลผลพร้อมกัน และแต่ละโมเดลก็อาจมี Thread Pool ของ ONNX Runtime ของตัวเองอีก

ผลที่ตามมาคือ **Oversubscription**: มี Runnable Threads มากเกิน CPU Core จนเกิด Context Switching และแย่ง Cache กัน สุดท้าย Throughput ไม่เพิ่ม แต่ Tail Latency กลับแย่ลง

ใน RIIR เราใช้ **Actor Model** โดยแยก **Preprocessing Actor Pool** และ **Inference Actor Pool** สำหรับแต่ละ ML Model แล้วแบ่ง Items ใน Request เป็น Mini-batch ให้ Worker ประมวลผล

![แผนภาพ Actor Model แยก Preprocessing และ Inference Worker Pools พร้อม Mini-batches](https://korntewin.github.io/intro-website/blog/figures/actor-mini-batches.png)

สิ่งที่ได้คือเราสามารถปรับ **Worker Count, Batch Size และ ONNX Runtime Threads** แยกตามโมเดลได้ ไม่จำเป็นต้องใช้ค่าเดียวกันทั้ง Service เพราะแต่ละโมเดลมีลักษณะต่างกัน เช่น Preprocessing หนักแต่ Inference เบา หรือ Inference ใช้ Memory Bandwidth มากจนเพิ่ม Threads แล้วไม่ได้เร็วขึ้น

Actor Model ไม่ได้ทำให้คำนวณเร็วขึ้นโดยตัวมันเองนะครับ จุดที่ช่วยคือการสร้าง ขอบเขตของ Concurrency และ Ownership ที่ชัดเจน ทำให้เรา Tune แต่ละ Stage อย่างเป็นระบบ แทนที่จะปล่อยให้ทุก Request แข่งกันใช้ CPU มากจนเกินไป

## 3. Kahn’s Algorithm: จัดลำดับ Preprocessing ก่อนรับ Traffic 🧩

Preprocessing ของ ML ไม่ใช่แค่ Loop Transform Feature ธรรมดา เพราะ Function หลายตัวมี Dependency ต่อกัน เช่น ต้อง Normalize ก่อนสร้าง Derived Feature หรือสร้าง Column A/B ก่อนนำไปประกอบเป็น Input ของโมเดล

ถ้าเราเรียก Function ผิดลำดับ อาจได้ผล Predict ผิดหรือเกิด Missing Column ตอน Runtime ดังนั้นเราสร้างลำดับการประมวลผลของ Function หลาย ๆ ตัวเป็น **Directed Acyclic Graph (DAG)** แล้วใช้ **Kahn’s Algorithm** สำหรับ Topological Sort เพื่อ Compile ลำดับการทำงานที่ถูกต้องตั้งแต่แรก

![แผนภาพ Dependency Graph และ Kahn Topological Sort ของ Preprocessing](https://korntewin.github.io/intro-website/blog/figures/kahn-dag.png)

หลักการของ Kahn’s Algorithm เข้าใจง่ายมาก: นับจำนวน Dependency ที่เข้ามาในแต่ละ Node (in-degree) แล้วเริ่มจาก Node ที่มี in-degree เป็น 0 จากนั้นค่อยนำ Node ที่พร้อมออกมาประมวลผล ลด in-degree ของ Node ถัดไป และทำซ้ำจนจบ หากยังมี Node เหลือแต่ไม่มีตัวไหนพร้อม แปลว่ามี Cycle ที่ต้องแก้ก่อน Service Start

ข้อดีสำหรับ Production Service คือเราเปลี่ยนงานจาก “ค้นหาลำดับ Preprocessing ทุก Request” เป็น “**Validate และ Compile ครั้งเดียวตั้งแต่ตอน Startup**” เมื่อ Request เข้ามาก็ Execute แผนที่เตรียมไว้ได้เลย

สำหรับ RIIR รอบนี้เราเลือกทำ **1D Parallelism หรือ Data Parallelism เพียงมิติเดียว** คือแบ่ง Items ในแต่ละ Request เป็น Mini-batches แล้วให้ Workers ประมวลผลข้อมูลแต่ละ Mini-Batch พร้อมกัน แต่ ภายในแต่ละ Mini-batch เรา Execute Preprocessing Nodes ตามลำดับ Topological Sort ไม่ได้ Parallel แยกตาม Nodes แม้ว่าบาง Nodes จะไม่มี Dependency ต่อกันก็ตาม

เหตุผลคือเรามีทั้ง Actor Workers และ ONNX Runtime Threads ที่ใช้ CPU อยู่แล้ว ถ้าทำ Parallel ทั้งตาม Items และตาม DAG Nodes เพิ่มอีกชั้น อาจเกิด CPU Oversubscription ทำให้ Threads แย่ง CPU กันมากขึ้น เกิด Context Switching และส่งผลเสียต่อ P99 Latency

เราไม่ได้พยายาม Parallel ทุกอย่างที่ Parallel ได้ แต่เลือก Parallel เฉพาะ แกนข้อมูล (Data) เพื่อคุมจำนวนงานที่วิ่งพร้อมกันให้เหมาะกับ CPU ครับ 🧵

## 4. Rust 1.98: Algebraic Floating Point เปิดทางให้ SIMD เพิ่มเติม ⚡

โดยปกติแล้วถึงแม้ LLVM จะมีความสามารถในการ Auto-vectorize เพื่อใช้งาน SIMD Instructions ของ CPU อยู่แล้ว แต่ Rust เนื่องด้วยความเลื่องชื่อในด้านความถูกต้องปลอดภัย 😅 Rust จะไม่ยอมให้มีการ Vectorization (ทำได้แต่ต้องเขียน code ในลักษณะที่ไม่ค่อยตรงไปตรงมา)

สาเหตุเนื่องมาจากว่า Floating Point ไม่ได้มี Associativity แบบเลขจริง เช่น (a + b) + c อาจได้ค่าไม่เท่ากับ a + (b + c) เพราะมี Rounding ในแต่ละ Operation ดังนั้นเพื่อให้ได้ค่าเดิมเสมอ bitwise identical จะต้องให้ลำดับการประมวลผลเหมือนเดิมเสมอ!

Rust 1.98 เพิ่ม Method อย่าง `**f32::algebraic_add**` และ `**f64::algebraic_mul**` ที่เราเลือกใช้เป็นจุด ๆ ได้ เพื่อเปิดโอกาสให้ Compiler Reassociate หรือเปลี่ยนรูปสมการ และอาจทำให้ Loop Vectorization เกิดขึ้นได้มากขึ้น

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

นี่ไม่ได้แปลว่า Update Compiler เป็น Rust 1.98 แล้ว Code ทุกบรรทัดจะเร็วขึ้นทันทีนะครับ เราต้องเลือกใช้ Method เหล่านี้อย่างมีเหตุผล และระวังเรื่อง Numerical Accuracy, NaN, Infinity, Signed Zero ตลอดจนความแตกต่างของผลลัพธ์ระหว่าง Compiler/Architecture

โดยเฉพาะ Production ML ที่ผล Predict ต้องมีความสอดคล้องกับเวอร์ชันเดิม เราจึงต้องมี **Parity Tests** และ Benchmark ก่อนเปิด Optimization ในจุดที่เหมาะสม ส่วนตัวเลข 2.4×/5.4×/1.9× ข้างต้นเป็นผลรวมของการออกแบบหลายส่วน ไม่ใช่ Benchmark แยกเฉพาะ Algebraic Operations 🚀

## 5. Memory Allocator: ptmalloc, mimalloc หรือ jemalloc? 🧠

อีกจุดที่หลายคนมองข้ามคือ Memory Allocator ครับ ต่อให้ DataFrame ถูกจัด Layout ดีขึ้น งาน Preprocessing ก็ยังต้องสร้าง Temporary Buffers, Intermediate Columns และ Objects ระหว่างทางอยู่ดี

บน Linux ที่ใช้ glibc ตัว System Allocator ปกติคือ ptmalloc ซึ่งใช้งานทั่วไปได้ดี แต่ใน Workload ที่มี Allocation/Free จำนวนมากพร้อมกันหลาย Threads เราอาจต้องพิจารณาทางเลือกอื่น เช่น mimalloc และ jemalloc

| Allocator | จุดเด่น | Trade-off ที่ควรดู |
| --- | --- | --- |
| **ptmalloc** (glibc default) | ไม่ต้องเพิ่ม Dependency และทำงานได้ดีในงานทั่วไป | Workload ที่ Allocate/Free พร้อมกันอาจเจอ Contention หรือ Fragmentation ตาม Pattern |
| **mimalloc** | ออกแบบเรื่อง Fast Allocation, Thread-local Paths และ Low Contention | ผลลัพธ์ขึ้นอยู่กับขนาด Object, Allocation Pattern และ Memory Footprint |
| **jemalloc ผ่าน tikv-jemallocator** | มี Arena / Thread Cache, ปรับจูนได้ และรองรับ Heap Profiling | ต้องดู Build, Configuration, RSS Behavior และความซับซ้อนด้าน Operations เพิ่มเติม |

เราเลือก **tikv-jemallocator** เป็น Global Allocator ของ Application เพราะลอง Benchmark เทียบกับ ptmalloc และ mimalloc แล้วพบว่าสามารถลดได้ทั้ง Memory / CPU / latency ค่อนข้างเยอะเลยทีเดียว

ถึงแม้ว่า [jemallocator](https://github.com/tikv/jemallocator/commits) ที่ maintain โดย Meta จะเคยถูก Archive ไปแล้ว แต่ทาง Meta ได้กลับมา Unarchive อีกครั้งในช่วงต้นปี 2026 รวมถึงการอัปเดต jemalloc 5.3.1 ในเดือนเมษายน! ซึ่งการอัปเดตในครั้งนี้เป็นการอัดอั้น Improvement และ Optimization จาก Commit ที่ดองไว้กว่า 4 ปีเต็ม 😂

```rust
#[global_allocator]
static GLOBAL_ALLOCATOR: tikv_jemallocator::Jemalloc =
    tikv_jemallocator::Jemalloc;
```

แต่ผมอยากย้ำว่า ไม่มี Allocator ตัวไหนชนะทุก Workload โดยอัตโนมัติ การเปรียบเทียบที่แฟร์ควรใช้ Traffic, Model, Worker Count, Batch Size, Binary และ Environment เดียวกัน แล้ววัดทั้ง Throughput, P99, CPU และ RSS ครับ

### ทำอย่างไรให้ทุก Application ใช้ Allocator เดียวกัน?

ใน Rust การประกาศ #[global_allocator] อยู่ที่ระดับ Binary Application ถ้า Monorepo มีหลาย Application เราอาจพลาดได้ง่ายเมื่อเพิ่ม Use Case ใหม่แล้วลืมระบุ Allocator

เราเลยใช้ Semgrep เป็น Policy Check ใน CI เพื่อบังคับให้แต่ละ Application Layer มีการ Configure Global Allocator ตามมาตรฐานเดียวกัน วิธีนี้ช่วยไม่ให้เรื่อง Performance ที่ต้องทำซ้ำกลายเป็นสิ่งที่ขึ้นอยู่กับความจำของคนเขียน Code

## 6. Workspace + Application Layer: รองรับหลาย Use Case โดยไม่ Copy Core 🏗️

เมื่อ Service ต้องรองรับมากกว่าหนึ่ง ML Model และมี Use Case ใหม่เพิ่มเรื่อย ๆ เราไม่อยากกลับไปสร้าง Service ใหม่โดย Copy Code จากตัวเก่าทุกครั้ง

ดังนั้นในการ Revamp รอบนี้เลยทำให้เป็น **Monorepo แบบ Cargo Workspace** โดยแยก **Application Layer** (Configuration, Adapters, Use Case Composition) ออกจาก **Prediction Core** (Preprocessing DAG, Actor Pools, ONNX Inference, Shared Data Structures)

![แผนภาพ Cargo Workspace ที่แยกหลาย Application ออกจาก Prediction Core และใช้ Semgrep บังคับ Global Allocator](https://korntewin.github.io/intro-website/blog/figures/workspace-semgrep.png)

แต่ละ Application สามารถเลือกประกอบ Predictor ของตัวเองได้ เช่น มีหลายโมเดลที่ต้องทำงานต่อกันหรือมี Input/Output ต่างกัน โดยที่ Core ไม่ต้องรู้ว่าโมเดลกำลังทำนายอะไร และไม่ต้องรับ Business Logic ของแต่ละ Use Case เข้าไปปะปน

ข้อดีไม่ได้มีแค่ Code Reuse แต่ยังช่วยให้เรา Benchmark, Test และ Tune แต่ละ Application ได้โดยไม่สร้างหลาย Implementation ของ Prediction Engine ส่วน Details เรื่อง Architecture ยังมีอีกเยอะ แต่ขอเก็บไว้เล่าคราวหน้าครับ 😄

## Learning Points: สิ่งที่ได้จาก RIIR รอบนี้ 💡

1. Memory Layout สำคัญไม่แพ้ภาษา เราจึงเริ่มจากลด Pointer Chasing และการ Copy ที่ไม่จำเป็น ก่อนเพิ่มความซับซ้อนเรื่อง Threads

2. Concurrency ที่มากกว่าไม่ได้แปลว่าเร็วกว่า เราใช้ 1D Data Parallelism ผ่าน Actor Pools และ Mini-batches โดยไม่ Parallel DAG Nodes เพิ่ม เพื่อเลี่ยง CPU Oversubscription

3. Compile สิ่งที่รู้ล่วงหน้าตั้งแต่ Startup DAG ของ Preprocessing ควรถูกจัดลำดับ Dependency ไว้ก่อนรับ Request แรก

4. SIMD ต้องเข้าใจ Semantics Algebraic FP เปิดโอกาสให้ Compiler Optimize ได้มากขึ้น แต่ต้องตรวจผลลัพธ์เชิงตัวเลขทุกครั้ง

5. Allocator เป็นส่วนหนึ่งของ Performance Design Benchmark ของ Prediction Service แสดงว่า jemalloc ลด Memory Usage ได้ประมาณ 100–500 MB ช่วง Peak Load และเราใช้ CI Policy เพื่อไม่ให้ Application ไหนลืม Config

6. Architecture ที่ดีช่วยให้ Optimization คุ้มในระยะยาว เมื่อ Core ถูกแชร์กัน การปรับปรุงครั้งเดียวก็มีโอกาสส่งผลให้หลาย Use Case

7. AI Agent เร่ง Implementation แต่ไม่ได้แทนการออกแบบระบบ การ Port ใช้เวลาประมาณ 1 สัปดาห์ โดยเรากำหนด Apache Arrow, Kahn’s Algorithm และ Actor Model เป็นโจทย์ที่ชัดเจนก่อนให้ Agent ช่วยลงมือ

8. Quick Win ต้องคุ้มทั้งความเร็วและความแม่นยำ Quantization ให้ Performance Gain น้อยในโมเดลขนาดเล็กของเรา แต่ Accuracy ลดลงเกินรับได้ จึงไม่ใช่ทางเลือกสำหรับ Production

## Conclusions

ถ้ารอบก่อนคือการ Optimize Go Runtime รอบนี้ก็คือการ Re-think ว่า ML Prediction Service ควรจัด Data, CPU Threads และ Model Execution อย่างไรตั้งแต่แรก ผ่าน Rust, Apache Arrow, Polars, Actor Model และกลไกอื่น ๆ ที่ทำงานร่วมกัน

ผลบน Production ของการเปรียบเทียบครั้งนี้คือ **P99 Latency ดีขึ้น 2.4 เท่า, CPU Usage ลดลง 5.4 เท่า และ Memory ลดลง 1.9 เท่า** ใน Traffic Split เท่ากัน ส่วนเมื่อ Rollout การปรับปรุงให้ครบ ทุก Use Case ของทีม เราคาดว่า Cluster CPU Request จะลดจาก 79% เหลือ 69% (10 percentage points) ซึ่งยังเป็น Projection ไม่ใช่ผลที่วัดได้หลัง Rollout

สุดท้ายสิ่งที่ผมได้เรียนรู้คือ Performance Engineering ไม่ใช่การหา Library ที่เร็วที่สุดเพียงตัวเดียว แต่เป็นการทำให้ Data Flow, Memory Layout, Scheduling และ Architecture เข้ากันได้กับธรรมชาติของ Workload มากที่สุด โดยเฉพาะในวันที่ Private Cloud มี Capacity เหลืออยู่อย่างจำกัด และเราไม่สามารถแก้ปัญหาด้วยการเพิ่มเครื่องได้ง่าย ๆ ครับ 🚀

---

**อ่านต่อ / References:** [บทความ Optimization รอบก่อน](https://life.lmwn.com/เบื้องหลังการลด-cost-ai-server-ลง-9-เท่า-และทำให้แอปเร็วขึ้น-4-เท่าที่-line-man-wongnai-da855335de5f) · [Rust 1.98 Release Notes](https://blog.rust-lang.org/2026/08/20/Rust-1.98.0/) · [Apache Arrow Columnar Format](https://arrow.apache.org/docs/format/Columnar.html) · [Go Swiss Tables](https://go.dev/blog/swisstable) · [Medium image formats](https://help.medium.com/hc/en-us/articles/215679797-Using-images) · [Polars](https://pola.rs/) · [tikv/jemallocator](https://github.com/tikv/jemallocator)
