---
layout: ../../layouts/BlogLayout.astro
title: "จาก Go สู่ Rust: เมื่อ ML Prediction Service ต้องเร็วขึ้นอีกรอบ พร้อมลดการใช้ CPU ลง 5.4 เท่า 🦀"
description: "เบื้องหลังการ Rewrite ML Prediction Service จาก Go มาเป็น Rust ที่ LMWN"
date: 2026-10-23
coverImage: https://korntewin.github.io/intro-website/blog/figures/riir-cover.png
---

![ภาพประกอบการย้าย ML Prediction Service จาก Go สู่ Rust](https://korntewin.github.io/intro-website/blog/figures/riir-cover.png)

ถ้าใครเคยอ่าน[บทความก่อนของผมเรื่องการลด Cost AI Server ลง 9 เท่า และทำให้แอปเร็วขึ้น 4 เท่า](https://life.lmwn.com/%E0%B9%80%E0%B8%9A%E0%B8%B7%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A5%E0%B8%94-cost-ai-server-%E0%B8%A5%E0%B8%87-9-%E0%B9%80%E0%B8%97%E0%B9%88%E0%B8%B2-%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%97%E0%B8%B3%E0%B9%83%E0%B8%AB%E0%B9%89%E0%B9%81%E0%B8%AD%E0%B8%9B%E0%B9%80%E0%B8%A3%E0%B9%87%E0%B8%A7%E0%B8%82%E0%B8%B6%E0%B9%89%E0%B8%99-4-%E0%B9%80%E0%B8%97%E0%B9%88%E0%B8%B2%E0%B8%97%E0%B8%B5%E0%B9%88-line-man-wongnai-da855335de5f) ก็น่าจะจำได้ว่า **ML Prediction Service เป็นงาน CPU-bound ที่ Optimize ยากกว่า Web Server ทั่วไป** เพราะใน 1 Request ต้องทำทั้ง Preprocessing, Model Inference และ Data Querying กับจำนวนสินค้า/ร้านค้าที่คาดว่า User จะชอบซึ่งมีปริมาณมหาศาล เราเลยต้องคิดตั้งแต่วงจรของ CPU Scheduler ไปจนถึงการทำงานของแต่ละ Thread

ตอนนั้นเรา Optimize Service ที่เขียนด้วย Go จนใช้ทรัพยากรน้อยลงไปมาก ช่วยให้ Kubernetes Cluster กลับมาโล่งและพอมีพื้นที่ให้หายใจหายคอได้อีกครั้ง 🎉

แต่ความโล่งใจนั้นก็อยู่กับเราได้ไม่นานครับ… 😅

รอบนี้เราเลยลองทำ **RIIR (Rewrite It In Rust)** ดูครับ ตัวเลขจาก Production ออกมาน่าสนใจมาก แต่สิ่งที่ผมอยากเล่าจริง ๆ คือ *โหลด CPU ที่หายไปนั้น เราตัดมาจากส่วนไหนของระบบบ้าง* 🦀

## สรุปสั้น ๆ ก่อน ⚡

- **CPU:** Max Pod CPU Usage ลดลง **5.4×** (คำนวณจาก Median ของอัตราส่วน Go/Rust ในแต่ละนาที)
- **P99 Server Latency:** เร็วขึ้น **2.4×** (คำนวณด้วยวิธีเดียวกับด้านบน)
- **Memory:** Max Pod Memory ลดลง **1.9×**
- **สิ่งที่เปลี่ยน:** ปรับ Memory Layout ใหม่, ลดการ Copy ที่ไม่จำเป็น, คุม Concurrency และ Compile ลำดับ Preprocessing ไว้ล่วงหน้าก่อนรับ Traffic

ตัวเลขชุดนี้วัดจาก **Production Recommendation Ranker ของ LMWN** ผ่านการทำ **A/B Testing ที่ Split Traffic เท่ากันเป็นเวลา 18 ชั่วโมง** ทั้งนี้ไม่ได้หมายความว่าแค่เปลี่ยน Go เป็น Rust แล้วทุก Service จะประหยัด CPU ลงได้ 5.4 เท่าเหมือนกันหมดนะครับ 🔥

## โจทย์รอบนี้: ใช้ Capacity ของ Shared Cluster ให้คุ้มค่าที่สุด 😬

ยิ่งมี **ML Use Case เพิ่มเข้ามาเรื่อย ๆ** ทั้งจำนวนโมเดล ปริมาณข้อมูล และ Traffic ก็ยิ่งทำให้ Kubernetes Cluster ต้องการทรัพยากรมากขึ้นครับ และเพราะ Cluster นี้เป็น **Shared Cluster ที่หลายทีมใช้งานร่วมกัน** เราจึงต้องระวังเรื่องการใช้ Resource ในภาพรวมด้วย อีกอย่างโจทย์นี้ไม่ได้มีแค่เรื่อง Cost ครับ เพราะการขยาย **Compute Capacity บน Private Cloud ของ LINE MAN Wongnai** เองก็มีข้อจำกัดอยู่เหมือนกัน เราเลยอยาก Optimize Workload เพื่อใช้ Capacity ที่มีอยู่ให้คุ้มที่สุดก่อน 😅

ความท้าทายกว่านั้นคือ 1 Request ไม่ได้ Predict แค่ Item เดียว แต่ต้อง Predict **ราว 500–10,000 Items ต่อ Request** พอมีหลาย Request วิ่งเข้ามาพร้อมกันในช่วง Peak ปริมาณงานที่ต้อง Predict จึงพุ่งไปถึง **หลักหลายแสน Items ต่อวินาที** 😵‍💫 นี่เลยเป็นเหตุผลว่าทำไมทั้งการ Copy ข้อมูล, Cache Miss รวมถึงการที่ Thread แย่ง CPU กัน ถึงส่งผลต่อ Capacity ของระบบอย่างมาก

โจทย์รอบนี้เลยไม่ใช่แค่การจูน Service เดิมแล้วครับ แต่เป็นการตั้งคำถามว่า **เราจะรองรับ ML Workload ที่โตขึ้นเรื่อย ๆ บน Shared Cluster ที่มีอยู่ให้คุ้มที่สุดได้อย่างไร?**

พอตั้งเป้าว่าจะใช้ทรัพยากรเดิมให้คุ้มขึ้น เราก็ต้องกลับมากางดูว่าในงานของแต่ละ Request มีขั้นตอนไหนที่พอตัดออกเพื่อคืน CPU Capacity ให้ระบบได้บ้างครับ

## ใน 1 Prediction Request ต้องทำอะไรบ้าง? 🔍

**Candidate Items 500–10,000 รายการ → Feature Data → Preprocessing → ONNX Runtime Inference → Ranking Scores**

![ภาพรวม 1 Prediction Request ใน 5 ขั้นตอน ตั้งแต่ Candidate Items จนได้ Ranking Scores พร้อมจุดที่เกิดต้นทุน: Lookup และ Cache Miss ที่ Feature Data, Copy และ Allocation ที่ Preprocessing และ Thread Contention ระหว่าง Preprocessing กับ ONNX Runtime](https://korntewin.github.io/intro-website/blog/figures/prediction-request-pipeline.png)

ใน 1 Request เราต้องจัดการข้อมูลหลายพัน Records ตั้งแต่เตรียม Feature, ทำ Transformation ตามลำดับ Dependency ไปจนถึงส่ง Tensor เข้า Model Inference ยิ่ง Traffic สูงขึ้น งานรอบข้างที่ไม่ใช่ตัวโมเดลก็ยิ่งโตตาม ทั้ง Feature Lookup, Temporary Allocation, การย้ายข้อมูล และ Threads ที่อาจมาแย่ง CPU กันเอง

ลองคิดตัวเลขกลม ๆ ดูครับ ถ้า 1 Item มี **200 Features ชนิด `float32`** เฉพาะค่าตัวเลขล้วน ๆ สำหรับชุดข้อมูล **1,000 Items ก็ใช้ 0.8 MB** และ **10,000 Items ก็ 8 MB** เข้าไปแล้ว โดยยังไม่รวม Map, Null Metadata, Intermediate Columns หรือการเตรียม Input ให้โมเดล แถมของจริงยังมี Feature หลาย Type ปนกันด้วย ตัวเลขนี้เลยยกมาให้พอเห็น Scale คร่าว ๆ เท่านั้นครับ

โจทย์เลยไม่ใช่แค่จะทำยังไงให้ ONNX Model รันเร็วขึ้นครับ แต่คือ **เราต้องอ่านหรือ Copy Data ชุดเดิมซ้ำไปกี่รอบ และมี Thread กี่ตัวที่กำลังแย่ง CPU กันทำงานนี้อยู่?**

## ข้อจำกัดที่บังคับให้ต้องรื้อออกแบบใหม่

ลำพังแค่เปลี่ยนจาก Go เป็น Rust คงไม่พอแก้ Bottleneck ที่เราเจอจริงบน Production ครับ

สมมติว่าเรายังเก็บ Feature ใน HashMap แบบเดิม, Copy Data ใหม่ทุกครั้งที่แบ่ง Batch หรือปล่อยให้ ONNX Runtime แต่ละ Instance เปิด Thread แข่งกัน ต่อให้เปลี่ยนมาใช้ Rust ก็คงไม่เห็นผลอย่างที่หวัง ในทางกลับกัน ถ้าวาง Memory Layout และ Concurrency Control ให้ดี เราก็ตัดงานที่ CPU ไม่จำเป็นต้องทำทิ้งไปได้เยอะเลยครับ

ก่อนลงมือทำ เราเลยตั้งโจทย์และเงื่อนไขในการออกแบบไว้ประมาณนี้ครับ:

- **ต้องรักษา Accuracy ให้อยู่ในเกณฑ์ที่รับได้** ต่อให้ Inference เร็วขึ้นก็ไม่คุ้มหากคุณภาพโมเดลตกลงมาก
- **CPU มี Budget จำกัด** ดังนั้นการอัด Worker Threads เพิ่มไม่ได้แปลว่าระบบจะเร็วขึ้นเสมอไป
- **ลดการย้าย Data ที่ไม่จำเป็น** อะไรที่แชร์ Buffer กันได้ก็แชร์ แต่ต้องยอมรับความจริงว่าไม่ใช่ทุกขั้นตอนใน Pipeline จะทำ Zero-copy ได้
- **Engine เดียวต้องรองรับหลาย Use Cases** เวลาเพิ่มโมเดลใหม่ไม่ควรต้อง Copy โค้ด Prediction Service ไปขึ้นใหม่ทั้งก้อน

ด้วยข้อจำกัดเหล่านี้ การแค่แปลง Syntax จาก Go เป็น Rust เฉย ๆ จึงไม่ตอบโจทย์แน่นอนครับ

## สิ่งที่ลองแล้วไม่คุ้ม: การทำ Quantization เพื่อเป็น Quick Win ⚖️

ก่อนตัดสินใจ Rewrite เราได้ลองวิธีอื่นดูก่อนครับ อีกแนวทางที่ลองทำเป็น Quick Win คือ **Model Quantization** เพื่อหวังลดโหลดฝั่ง Inference แต่เพราะโมเดลใน Use Case นี้ **มีขนาดเล็กมากอยู่แล้ว** ผลที่ได้คือ **Performance ดีขึ้นแค่นิดเดียว** ในขณะที่ **Model Accuracy ตกลงมากเกินกว่าระดับที่ยอมรับได้** Trade-off แบบนี้เลยไม่เหมาะจะเอาขึ้น Production ครับ

สำหรับโมเดลขนาดเล็กของเรา Accuracy ที่ตกลงไปไม่คุ้มกับความเร็วที่ได้กลับมาเลยครับ เราเลยหันมาแก้ที่ **Data Movement, Preprocessing และ Concurrency** แทน ซึ่งช่วยลดโหลด CPU ได้โดยไม่กระทบความแม่นยำของโมเดล

อย่างน้อยการลอง Quantization ก็ช่วยให้เราเห็นชัดตั้งแต่เนิ่น ๆ ว่าจุดที่ควรลงแรงรอบนี้คือ **Data Movement, Preprocessing และ Concurrency** แทนที่จะไปฝืนรีดโมเดลที่เล็กอยู่แล้วครับ

## Bottleneck ที่เราเลือกแก้ 🔧

รอบนี้ไม่ได้มีเทคนิค Optimization แค่ตัวเดียวที่แก้จบทุกปัญหาครับ เราเลยต้องไล่สำรวจตั้งแต่การจัด Memory ไปจนถึงการคุม Threads เพื่อหาว่ามีงานไหนบ้างที่ CPU ไม่จำเป็นต้องทำ

### 1. Memory Layout: จาก Go Map สู่ Arrow และ Polars 📦

ก่อนอื่นต้องเข้าใจว่าทุกครั้งที่ CPU ต้องตาม Pointer ไปอ่านข้อมูลตามจุดต่าง ๆ ใน Memory มันมีต้นทุนแฝงอยู่ครับ ทุกครั้งที่ CPU ต้องวิ่งตาม Pointer ไปยัง Memory Address ใหม่ ถ้าข้อมูลไม่อยู่ใน Cache ก็เสี่ยงเจอ Cache Miss และต้องรอข้อมูลจาก Memory Hierarchy ชั้นที่ช้ากว่า (ตั้งแต่ CPU Cache ลงไปถึง RAM)

หากจัดเก็บข้อมูลแบบ Row-oriented ที่ 1 Record คือ 1 HashMap ซึ่งถือหลาย Field เอาไว้ การวนคำนวณ Feature เดียวกันให้ครบหลายพัน Records มักบังคับให้ CPU ต้องไล่ Pointer Chasing วิ่งไปมาตาม Address ต่าง ๆ เยอะมาก

แต่งาน Preprocessing ของ ML มักทำงานในรูปแบบ “ทีละ Feature ข้ามหลาย ๆ Records” มากกว่า “ทีละ Record กับทุก Feature” เราเลยเลือกใช้ Apache Arrow เป็น Columnar Memory Format พื้นฐาน และใช้ Polars มาช่วยจัดการระดับ DataFrame ครับ

![ภาพเปรียบเทียบการอ่าน Feature เดียว: แบบ Row-oriented ต้องกระโดดไปทีละ Record ส่วนแบบ Columnar อ่าน Feature นั้นได้ใน Sequential Scan รอบเดียว](https://korntewin.github.io/intro-website/blog/figures/columnar-memory.png)

นี่แหละครับคือหัวใจของ **Memory Layout** เราไม่ได้สนแค่ว่าข้อมูลกิน RAM ไปกี่ MB แต่ต้องดูด้วยว่า **ค่าของแต่ละ Feature วางอยู่ตรงไหน และ CPU เข้าไปอ่านมันยังไง** ตัว Arrow จะวางค่าของ Feature เดียวกันเรียงต่อกันไว้ใน Column Buffer ทำให้การ Scan มี **Data Locality** ดีกว่าการ Lookup ผ่าน Map และ Object หลายชั้น แถมยังเปิดโอกาสให้ Compiler หรือ Library ใช้ SIMD / Vectorized Operations ได้ง่ายขึ้นด้วย

แน่นอนว่าไม่ได้แบนราบไปทั้งหมดนะครับ เช่น String Column ก็ยังต้องใช้ Offsets กับ Values Buffer อยู่ หรือตัว Polars เองก็อาจแบ่งเก็บเป็นหลาย Chunk ได้ แต่สำหรับ Workload ของเรา หัวใจสำคัญคือการลด Pointer Chasing เวลาประมวลผลทีละ Column ครับ

#### เทียบ Memory Layout ระหว่าง Go Swiss Table กับ Arrow 💾

ลองคำนวณเทียบเคส **200 Features ชนิด `float32` ต่อ Record** ดูครับ ฝั่ง Go เราเก็บเป็น `[]map[string]any` (Record ละ 1 Map) ซึ่งจะเจอ Overhead ทั้งจาก String Key, Interface `any` และการ Box ค่า `float32` ในขณะที่ Arrow เก็บข้อมูลแบบ Columnar จึงใช้ Metadata ต่อค่าน้อยกว่ามาก

ถ้าอิงตามโครงสร้างของ [Go 1.24.0 Swiss Table](https://github.com/golang/go/tree/go1.24.0/src/internal/runtime/maps) บนระบบ 64-bit โดยจองขนาด Map ไว้ที่ 200 Entries ฝั่ง Go จะใช้พื้นที่ประมาณ **10,368 B ต่อ Record** (Map Storage 9,472 B + Boxed Values 800 B + Headers 96 B) ส่วน Arrow ใช้แค่ประมาณ **825 B** (เนื้อข้อมูล `200 × 4 B` + Validity Bitmap 25 B) เท่ากับว่า **1,000 Records: Go 10.368 MB vs Arrow 0.825 MB** และ **10,000 Records: Go 103.68 MB vs Arrow 8.25 MB** หรือต่างกันประมาณ **12.6×** เลยครับ

![ภาพประมาณการการใช้ Memory ของ 200 float32 Features ต่อ Record: Go Map ใช้ราว 10,368 B ต่อ Record เทียบกับ Arrow Columns ราว 825 B เมื่อนับรวม Validity Bitmap หรือต่างกันประมาณ 12.6 เท่า](https://korntewin.github.io/intro-website/blog/figures/arrow-swiss-memory.png)


### 2. เจาะลึก Arrow Memory Layout: Bitmap, Offsets และ Zero-copy Slice 💾

พอจัดข้อมูลให้อยู่ในรูป Column แล้ว เราก็ลดการสร้าง Object ย่อย ๆ ตาม Record ลงได้เยอะ แถมยังส่งต่อ Mini-batch ด้วยการแชร์ Buffer เดิมได้ง่ายขึ้นด้วยครับ

#### Validity Bitmap: เก็บสถานะ Null ด้วยพื้นที่เพียง 1 Bit ต่อช่อง

อีกกลไกที่ช่วยประหยัด Memory Overhead คือ **Validity Bitmap** ของ Apache Arrow แทนที่จะหุ้มแต่ละค่าด้วย Object แยกที่มี Pointer กับ Metadata ของตัวเอง Arrow จะใช้ Bit มากำกับว่าแต่ละ Slot มีข้อมูลหรือเป็น Null โดย 1 = Valid และ 0 = Null ใช้พื้นที่แค่ 1 Bit ต่อ Slot (ไม่รวม Padding กับ Metadata ของ Buffer) และหากทั้ง Column ไม่มี Null เลย ก็ข้ามการสร้าง Validity Bitmap ไปได้เลยครับ

สมมติเรามี Column เก็บ List สินค้าเป็น `[10, 20, 30]`, `null`, `[]` กับ `[40, 50]` ครับ จะเห็นว่า Null List กับ Empty List นั้นไม่เหมือนกัน แม้ทั้งคู่จะไม่มี Element อยู่ใน Child Values เลยก็ตาม ตัว Validity Bitmap นี่แหละครับที่ช่วยแยกความแตกต่างตรงนี้ให้ชัดเจน

#### LargeList + Offsets: เก็บข้อมูล List ไว้ใน Buffer เดียวกัน

สำหรับข้อมูลแบบ Nested List เราไม่จำเป็นต้องสร้าง Heap Object แยกสำหรับทุก Row เพราะ Arrow ใช้ Offsets Buffer เก็บจุดเริ่มและจุดสิ้นสุดของข้อมูลใน Child Values Buffer เดียวกัน เช่น `offsets = [0, 3, 3, 3, 5]` และ `values = [10, 20, 30, 40, 50]` โดย Row ที่ i จะเข้าถึงข้อมูลช่วง `values[offsets[i]..offsets[i+1]]`

![แผนภาพ Apache Arrow Validity Bitmap และ LargeList Offsets ที่แชร์ Child Values Buffer](https://korntewin.github.io/intro-website/blog/figures/arrow-validity-large-list.png)

ตัว LargeList จะใช้ 64-bit Offsets แทน 32-bit Offsets ของ List ปกติ ทำให้รองรับ Child Arrays ที่มี Element จำนวนมากได้ ส่วนปัจจัยที่ช่วยให้เกิด Memory Locality จริง ๆ คือการวาง Values เรียงต่อกันแล้วอ้างอิงผ่าน Offsets แทนที่จะต้องไล่กระโดดตาม Pointer ของแต่ละ Row ครับ

เวลาส่ง Mini-batch ให้ Actor Worker ในหลายกรณีเราก็ส่งแค่ **View หรือ Slice ของ Buffer เดิม** ไปได้เลย ไม่ต้องมานั่งสร้าง List Object ใหม่ทุก Row ซึ่งจุดนี้แหละครับที่เชื่อม Columnar Format, Zero-copy และ Data Parallelism เข้าด้วยกันอย่างลงตัว

#### Bonus: ใช้ Zero-copy Slice แทนการ Copy ใหม่ทุก Mini-batch

เวลาหั่น Items ออกเป็น Mini-batch ถ้าต้องสร้าง Array ใหม่แล้ว Copy ค่าเดิมซ้ำทุกรอบ ก็จะเปลืองทั้ง Allocation และ Memory Bandwidth ไปโดยใช่เหตุครับ

Arrow รองรับการทำ **Slice แบบแชร์ Buffer เดิม** โดยแก้แค่ Metadata อย่าง Offset และ Length แทนการ Copy ตัว Payload จริง ๆ ซึ่งเหมาะกับการส่ง Mini-batch ให้ Worker มากครับ

![แผนภาพอธิบายการทำ Arrow Zero-copy Slicing ที่อ้างอิง Underlying Buffer ก้อนเดียวกัน](https://korntewin.github.io/intro-website/blog/figures/arrow-zero-copy.png)

**แต่การที่ Slice เป็น Zero-copy ก็ไม่ได้แปลว่าทั้ง Pipeline จะไม่มี Allocation เลยนะครับ** ขั้นตอนอย่างการ Cast Type, คำนวณ Feature, Rechunk หรือเตรียม Input ให้ ONNX Runtime ก็อาจยังต้องสร้าง Buffer ใหม่อยู่ดีครับ

### 3. คุม CPU Concurrency: Actor Model และ Mini-batches 🧵

พอ Traffic พุ่งสูงขึ้น เราอาจเผลอมี Runnable Threads เยอะเกินจำนวน CPU Cores โดยไม่รู้ตัว ทั้งจากงานที่แต่ละ Request แตก Spawn ขึ้นมาเอง และจาก Worker Threads ของ ONNX Runtime

ผลลัพธ์ที่ตามมาคือ **Oversubscription** หรือการที่มี Runnable Threads มากเกินจำนวน CPU Cores จนเกิด Context Switching ถี่ขึ้นและแย่ง Cache กันเอง สุดท้าย Throughput ก็ไม่ขยับ แถม Tail Latency ยังแย่ลงอีกด้วย

ในการ Rewrite รอบนี้ เราเลือกใช้ **Actor Model** ผ่าน [**Kameo**](https://github.com/tqwewe/kameo) ซึ่งเป็น Actor Library ของ Rust โดยแยก **Preprocessing Actor Pool** กับ **Inference Actor Pool** ออกจากกันตามแต่ละ ML Model แล้วค่อยหั่น Items ใน Request เป็น Mini-batch ส่งให้ Worker ประมวลผล

![แผนภาพ Actor Model: แต่ละ Model หั่น Request เดียวกันเป็น Mini-batches แล้วส่งผ่าน Preprocessing และ Inference Worker Pools ของตัวเอง โดยจูน Batch Size, Workers และ ONNX Threads แยกตามรายโมเดล](https://korntewin.github.io/intro-website/blog/figures/actor-mini-batches.png)

ข้อดีที่ได้คือเราจูน **Worker Count, Batch Size และ ONNX Runtime Threads** แยกตามรายโมเดลได้เลย ไม่ต้องฝืนใช้ค่าเดียวทั้ง Service เพราะธรรมชาติของแต่ละโมเดลไม่เหมือนกันครับ บางตัวหนักที่ Preprocessing แต่ Inference เบา ส่วนบางตัวตอน Inference กิน Memory Bandwidth เต็มจนอัด Threads เพิ่มไปก็ไม่ได้ช่วยให้เร็วขึ้น

สิ่งที่ Actor Model ช่วยได้จริง ๆ ไม่ใช่การทำให้คิดเลขเร็วขึ้นโดยตรงครับ แต่คือการตีกรอบ **Concurrency และ Ownership** ให้ชัดเจน เราเลย Tune แต่ละ Stage แยกกันได้โดยไม่ปล่อยให้ทุก Request รุมแย่ง CPU กันเอง

### 4. Compile ลำดับ Preprocessing Dependencies ด้วย Kahn’s Algorithm 🧩

Preprocessing ของ ML ไม่ใช่แค่การวน Loop เพื่อ Transform Feature ไปทีละตัวแบบง่าย ๆ นะครับ เพราะหลาย Function มี Dependency เชื่อมโยงถึงกัน เช่น ต้อง Normalize ให้เสร็จก่อนถึงจะปั้น Derived Feature ได้ หรือต้องสร้าง Column A กับ B ให้ครบก่อนนำไปประกอบเป็น Input ของโมเดล

ถ้าเราเรียก Function ผิดลำดับ อาจได้ผล Predict ผิดหรือเกิด Missing Column ตอน Runtime ดังนั้นเราจึงจำลอง Dependency ของ Function ทั้งหมดให้อยู่ในรูป **Directed Acyclic Graph (DAG)** แล้วใช้ **Kahn’s Algorithm** ทำ Topological Sort เพื่อ Compile ลำดับการทำงานที่ถูกต้องไว้ตั้งแต่แรก

![แผนภาพ Dependency Graph และ Kahn Topological Sort ของ Preprocessing](https://korntewin.github.io/intro-website/blog/figures/kahn-dag.png)

หลักการของ Kahn’s Algorithm คือเริ่มจากการนับจำนวน Dependency ที่ชี้เข้าหาแต่ละ Node (`in-degree`) แล้วหยิบ Node ที่ไม่มี Dependency ค้างอยู่ (`in-degree = 0`) ออกมาจัดลงลำดับ จากนั้นลดค่า `in-degree` ของ Node ถัดไปแล้วทำซ้ำไปเรื่อย ๆ หากยังมี Node เหลือแต่ไม่มีตัวไหนพร้อม แสดงว่ามี Cycle ที่ต้องแก้ก่อน Service Start

ข้อดีสำหรับ Production Service คือเราเปลี่ยนงานจาก “ค้นหาลำดับ Preprocessing ทุก Request” เป็น “**Validate และ Compile ครั้งเดียวตั้งแต่ตอน Startup**” พอมี Request เข้ามาก็รันตาม Execution Plan ที่เตรียมไว้ได้ทันที

ในเวอร์ชัน Rust รอบนี้ เราตั้งใจเลือกทำ **Data Parallelism (1D Parallelism) แค่แกนเดียว** ครับ คือหั่น Items ในแต่ละ Request ออกเป็น Mini-batches แล้วให้ Workers รันประมวลผลพร้อมกัน แต่ภายในแต่ละ Mini-batch เราจะ Execute ตัว Preprocessing Nodes เรียงตามลำดับ Topological Sort ไปทีละขั้น ไม่ได้แยก Parallel ตาม Nodes แม้บาง Nodes จะเป็นอิสระต่อกันก็ตาม

เหตุผลคือเรามีทั้ง Actor Workers และ ONNX Runtime Threads ที่ใช้ CPU อยู่แล้ว ถ้าทำ Parallel ทั้งตาม Items และตาม DAG Nodes เพิ่มอีกชั้น อาจเกิด CPU Oversubscription ทำให้ Threads แย่ง CPU กันมากขึ้น เกิด Context Switching และส่งผลเสียต่อ P99 Latency

เราไม่ได้พยายามจะ Parallel ทุกอย่างที่ทำได้ครับ แต่เลือก Parallel เฉพาะแกนข้อมูล (Data Axis) เพื่อให้คุมปริมาณงานที่วิ่งพร้อมกันได้พอดีกับกำลังของ CPU 🧵

### 5. เปิดทางให้ SIMD ทำงานมากขึ้น: Rust 1.98 Algebraic Floating Point ⚡

จริง ๆ LLVM รองรับการ Auto-vectorize เพื่อใช้งาน SIMD Instructions ของ CPU อยู่แล้ว และ Rust ก็ไม่ได้ห้าม Vectorization นะครับ 😅 แต่บาง Loop โดยเฉพาะการคำนวณ Floating Point จะ Vectorize ตรง ๆ ไม่ได้ หากการแปลงนั้นทำให้ลำดับ Operation เปลี่ยนไปจาก Semantics ที่โค้ดกำหนดไว้

สาเหตุเป็นเพราะ Floating Point ไม่มีคุณสมบัติการเปลี่ยนหมู่ (Associativity) เหมือนจำนวนจริงครับ เช่น `(a + b) + c` อาจได้ผลลัพธ์ไม่เท่ากับ `a + (b + c)` เพราะมีการปัดเศษ (Rounding) เกิดขึ้นในทุก Operation ดังนั้นถ้าอยากให้ผลลัพธ์ตรงกันเป๊ะระดับ Bit (Bitwise Identical) ลำดับการคำนวณก็ต้องคงเดิมเสมอครับ!

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

ส่วนตัวเลข **2.4× / 5.4× / 1.9×** ในบทความนี้เป็นผลจากการออกแบบระบบใหม่หลายส่วนรวมกัน ไม่ใช่ Benchmark ของ Algebraic FP เพียงอย่างเดียวครับ 🚀

### 6. เลือก Memory Allocator: ptmalloc, mimalloc หรือ jemalloc? 🧠

อีกจุดที่หลายคนมักมองข้ามคือ Memory Allocator ครับ ต่อให้เราจัด Layout ของ DataFrame มาดีขึ้นแค่ไหน งาน Preprocessing ก็ยังต้องคอยสร้าง Temporary Buffers, Intermediate Columns และ Objects ระหว่างทางอยู่ดี

บน Linux ที่ใช้ glibc ตัว System Allocator ค่าเริ่มต้นคือ ptmalloc ซึ่งทำงานทั่วไปได้ดีอยู่แล้วครับ แต่พอเจอ Workload ที่ต้อง Allocate และ Free หน่วยความจำถี่ ๆ พร้อมกันหลาย Threads เราก็ควรหันมามองตัวเลือกอื่นอย่าง mimalloc หรือ jemalloc ด้วย

| Allocator | จุดเด่น | Trade-off ที่ต้องวัดผล |
| --- | --- | --- |
| **ptmalloc** (glibc default) | ไม่ต้องเพิ่ม Dependency และใช้งานทั่วไปได้ดี | หากหลาย Thread แย่งกัน Allocate/Free พร้อมกันอาจเจอ Contention หรือ Fragmentation ในบาง Pattern |
| **mimalloc 3.6.1** (Official Rust bindings) | ออกแบบมาเน้น Fast Allocation, Thread-local Paths ลด Contention และ Microsoft ดูแล Rust Bindings เองใน Repo หลัก | ต้องมี C Compiler ตอน Build และผลลัพธ์จริงขึ้นอยู่กับขนาด Object, Allocation Pattern และ Memory Footprint ของงาน |
| **jemalloc (ผ่าน tikv-jemallocator)** | มี Arena / Thread Cache, ปรับจูนได้ละเอียด และรองรับ Heap Profiling | ต้องจัดการเรื่อง Build, Configuration, พฤติกรรมของ RSS รวมถึงความซับซ้อนฝั่ง Operations เพิ่มขึ้น |

ช่วงแรกของการ Deploy เราเคยเลือกใช้ `tikv-jemallocator` เป็น Global Allocator เพราะเทียบ Benchmark กับ `ptmalloc` แล้วช่วยลดทั้ง CPU, Memory และ Latency ลงได้เยอะครับ แต่**ล่าสุดเราเปลี่ยน Global Allocator ของ Application มาใช้ [mimalloc 3.6.1](https://github.com/microsoft/mimalloc/tree/v3.6.1/contrib/rust) แล้วครับ** เหตุผลสำคัญคือตั้งแต่เวอร์ชัน `3.6.0` (และปรับปรุงต่อใน `3.6.1`) ทาง **Microsoft เข้ามาดูแล Official Rust Bindings ใน Repo หลักด้วยตัวเองแล้ว** ทำให้ตัว Binding เสถียรกว่าเดิมมากและไม่ต้องกังวลเรื่องการ Maintain จาก Wrapper ภายนอกเหมือนที่ผ่านมา

ตัว Binding อย่างเป็นทางการใน [`contrib/rust`](https://github.com/microsoft/mimalloc/tree/v3.6.1/contrib/rust) แยกเป็น 2 Crates คือ `mimalloc-sys` (Compile และ Link ตัว C Source ของ `mimalloc` โดยตรง) กับ `mimalloc` (ให้ `MiMalloc` สำหรับตั้งเป็น `#[global_allocator]` พร้อม API อย่าง `Heap` และ `Arena`) ซึ่งใช้งานใน Application ได้ตรง ๆ แบบนี้เลยครับ:

```rust
use mimalloc::MiMalloc;

#[global_allocator]
static GLOBAL_ALLOCATOR: MiMalloc = MiMalloc;
```

ถ้าอยาก Benchmark เทียบ Allocator ให้แฟร์จริง ๆ ต้องคุมตัวแปรทั้ง Traffic, Model, Worker Count, Batch Size, Binary และ Environment ให้เหมือนกันทั้งหมด แล้ววัดเทียบทั้ง Throughput, P99, CPU และ RSS ครับ

เทคนิคทั้งหมดนี้ทำงานเสริมกันครับ และเราไม่ได้ทำ Production A/B Test แยกวัดผลทีละ Optimization ดังนั้นตัวเลขที่เอามาโชว์ในพาร์ตถัดไปจึงเป็นผลลัพธ์ของ **Service ที่รื้อออกแบบใหม่ทั้งชุด** ไม่ใช่ผลงานของเทคนิคใดเทคนิคหนึ่งแยกเดี่ยว ๆ

## เบื้องหลังการ Rewrite: ทำไมต้อง Rust และเราสร้างมันขึ้นมาอย่างไร 🦀

เราไม่ได้จับ Go มาแปลเป็น Rust แบบบรรทัดต่อบรรทัดนะครับ แต่รื้อใหม่หมดทั้ง Memory Layout, Concurrency, Preprocessing Execution และ Code Structure โดยตั้งใจตัดงานที่เปลือง CPU แต่ไม่ได้ช่วยให้งาน Predict เสร็จเร็วขึ้นออกไป

### ทำไม Rust ถึงเหมาะกับ Ecosystem ฝั่ง Data และ ML 🦀

ถ้ามองจากบริบทการทำงานที่ LINE MAN Wongnai (LMWN) หลัก ๆ เราจะอยู่กับสองสายงานครับ คือฝั่ง Applied ML ที่ใช้ Python เป็นอาวุธหลักในการทดลองโมเดล สร้าง Feature และทำ Pipeline กับฝั่ง Web / Backend Services ที่ยืนพื้นด้วย Go ส่วนทิศทางของ Prediction Service รอบนี้คือการลงลึกไปทำ Low-level ML Optimization ด้วย Rust โดยต่อยอดจาก Native Ecosystem ของ C และ C++ ที่มีอยู่แล้ว

![ไดอะแกรมเปรียบเทียบ 3 บริบท: ฝั่ง Applied ML (Python) และ Web Services (Go) ที่ใช้อยู่เดิม กับทิศทางใหม่ของ Prediction Service ที่ลงไปเน้น Low-level ML Optimization ด้วย Rust, C และ C++](https://korntewin.github.io/intro-website/blog/figures/lmwn-ml-web-landscape.png)

การขยับลงมาที่ชั้นล่างในแผนภาพหมายถึงการที่เราเข้าไปคุม Memory Layout, SIMD, Preprocessing และ Inference Execution ได้โดยตรง โดยที่ยังเชื่อมต่อกับ Workflow ฝั่ง Python และ Service เดิมที่มีอยู่ได้เหมือนเดิม

Go ตอบโจทย์งาน Networking และ Backend Service ของเราได้ดีอยู่แล้วครับ แต่พอเป็นงาน Preprocessing ที่ต้องปั่นข้อมูลปริมาณมหาศาล ฝั่ง Rust มี Library พร้อมให้เราเรียกใช้ตรง ๆ อย่าง [Polars](https://pola.rs/), [nlpO3](https://github.com/PyThaiNLP/nlpo3) สำหรับ Thai NLP และ [Hugging Face Tokenizers](https://github.com/huggingface/tokenizers) สำหรับ Tokenization ซึ่งทุกตัวมี Core เขียนด้วย Rust ทั้งหมด

เราจึงคุม **Ownership, Lifetime และ Memory Layout** บน Hot Path ได้อย่างละเอียดโดยไม่มี Garbage Collector มาคอยกวนใจ ทั้งหมดนี้รวมถึงความพร้อมของ Ecosystem คือเหตุผลหลักที่ทำให้เราเลือก Rust สำหรับ Workload นี้ครับ 🦀

อีกเหตุผลคือการเชื่อมกับ Python ครับ แม้ฝั่ง Go จะมี [cgo](https://pkg.go.dev/cmd/cgo) ที่นิ่งและพร้อมมากสำหรับการเรียก C API แต่ถ้าจะ Embed CPython ก็ต้องมานั่งจัดการ CPython C API, Object Lifetime, References และ GIL ข้าม Runtime เองทั้งหมด ต่างจากฝั่ง Rust ที่มี [PyO3](https://pyo3.rs/) ซึ่งออกแบบมาเพื่องาน Python Binding โดยเฉพาะ ทั้งการเรียก Python จาก Rust และการปั้น Python Extension แถมยังมี [maturin](https://www.maturin.rs/) ช่วยเรื่อง Build และ Package ทำให้การเขียนและดูแล Integration แบบนี้ผ่าน PyO3 สะดวกกว่าการต่อ Binding เองบน cgo มากครับ

### พอร์ตเสร็จใน 1 สัปดาห์ด้วย AI Agent (แต่ต้องเคาะ Architecture ให้ชัดก่อน)

เราพอร์ตระบบจาก Go มาเป็น Rust เสร็จภายใน **ประมาณ 1 สัปดาห์ โดยมี AI Agent คอยช่วย** แต่ก่อนจะปล่อยให้ Agent ลงมือเขียนโค้ด เราต้องวาง Architecture ให้ชัดเสียก่อน ทั้ง **Apache Arrow** สำหรับ Columnar Data, **Kahn’s Algorithm** สำหรับ Preprocessing Dependencies และ **Actor Model** สำหรับคุม Concurrency ครับ เพราะงานนี้ไม่ใช่แค่โยนโค้ดให้มันแปลง Syntax แล้วหวังว่า Performance จะดีขึ้นเอง 😅

### แยก Prediction Core เพื่อรองรับหลาย Use Cases 🏗️

เมื่อระบบต้องรองรับมากกว่าหนึ่ง ML Model และมี Use Case ใหม่งอกเข้ามาเรื่อย ๆ เราก็ไม่อยากใช้วิธี Copy Code จากตัวเก่าไปเปิด Service ใหม่ทุกครั้งครับ

ดังนั้นในการ Rewrite รอบนี้ เราเลยจัดโครงสร้างเป็น **Monorepo ด้วย Cargo Workspace** เพื่อแยก **Application Layer** (Configuration, Adapters, Use Case Composition) ออกจาก **Prediction Core** (Preprocessing DAG, Actor Pools, ONNX Inference และ Shared Data Structures) อย่างชัดเจน

![แผนภาพ Cargo Workspace ที่แยกหลาย Application ออกจาก Prediction Core และใช้ Semgrep บังคับ Global Allocator](https://korntewin.github.io/intro-website/blog/figures/workspace-semgrep.png)

ฝั่ง Application สามารถประกอบร่าง Predictor เฉพาะทางของตัวเองได้เลย ไม่ว่าจะต้องรันหลายโมเดลต่อเนื่องกัน หรือรับ-ส่ง Input/Output ต่างกันแค่ไหน ขณะที่ Core กลางก็ไม่จำเป็นต้องรู้ว่าโมเดลกำลัง Predict เรื่องอะไร และปลอดจาก Business Logic ของแต่ละ Use Case ครับ

ข้อดีไม่ใช่แค่เรื่อง Code Reuse อย่างเดียวครับ แต่ยังช่วยให้เรา Benchmark, Test และ Tune แยกตามแต่ละ Application ได้โดยไม่ต้องคอยดูแล Prediction Engine หลายเวอร์ชัน ส่วนรายละเอียดฝั่ง Architecture ยังมีอีกเพียบ แต่ขออนุญาตเก็บไว้เล่าต่อในบทความหน้านะครับ 😄

### ป้องกันไม่ให้ลืมตั้งค่า Allocator เวลาเพิ่ม Application ใหม่

ใน Rust การประกาศ `#[global_allocator]` ต้องทำในระดับ Binary Application พอ Monorepo มีหลาย Application เข้า เราจึงมีโอกาสพลาดลืมระบุ Allocator ได้ง่าย ๆ เวลาเปิด Use Case ใหม่

ทางแก้ของเราคือใช้ Semgrep เป็นตัวตรวจ Policy บน CI เพื่อเช็กว่า Application ใหม่ทุกตัวได้ตั้งค่า Global Allocator ตามมาตรฐานเดียวกันแล้ว วิธีนี้ช่วยป้องกันไม่ให้เรื่อง Performance ที่ต้องทำซ้ำ ๆ กลายเป็นภาระที่ฝากไว้กับความจำของคนเขียนโค้ด

## ผลลัพธ์บน Production: Go vs Rust 📊

เราทดสอบเปรียบเทียบ Service ทั้งสองเวอร์ชันบน Production ด้วย **A/B Testing** ภายใต้ **Traffic Split ที่เท่ากัน** โดยเก็บข้อมูลต่อเนื่อง 18 ชั่วโมง และติดตามค่า P99 Latency, CPU กับ Memory ในระดับ Pod ครับ

![กราฟเปรียบเทียบค่า P99 Latency, CPU และ Memory ระหว่าง Go กับ Rust](https://korntewin.github.io/intro-website/blog/figures/production-results.png)

| Metric | Go (median / peak) | Rust (median / peak) | Improvement |
| --- | ---: | ---: | ---: |
| **P99 server latency** | 416 / 829 ms | 146 / 419 ms | **2.4×** |
| **Max pod CPU usage** | 16.9% / 45.2% | 3.0% / 8.6% | **5.4×** |
| **Max pod memory** | 2.68 / 3.56 GB | 1.43 / 1.70 GB | **1.9×** |

ค่า Improvement ในตารางคำนวณจาก **Median ของอัตราส่วน Go/Rust ในแต่ละนาที** ขณะที่คอลัมน์ Go และ Rust จะแสดงค่า Median ของแต่ละฝั่งแยกกัน ดังนั้นถ้าจับค่า Median ในตารางมาหารกันตรง ๆ ตัวเลขจึงอาจไม่ตรงกับค่า Improvement ที่รายงานนะครับ

### กราฟจาก Production ตลอด 18 ชั่วโมง 👀

นอกจากตัวเลขสรุปในตาราง ผมอยากชวนมาดูด้วยว่า **CPU, Memory และ P99 Latency เปลี่ยนแปลงอย่างไรตลอด 18 ชั่วโมงที่รับ Traffic จริง** ครับ

![Production Dashboard เปรียบเทียบค่า CPU, Memory และ P99 Latency ระหว่าง Go กับ Rust](https://korntewin.github.io/intro-website/blog/figures/production-timeseries-dashboard.png)

เส้นสีเหลืองคือ Go, สีเขียวคือ Rust และเส้นประสีน้ำเงินคือ Improvement Ratio (อ่านค่าจากแกนฝั่งขวา) ครับ จะเห็นได้ว่าต่อให้ Load เปลี่ยนแปลงขึ้นลงตลอดทั้งวัน Rust ก็ยังคงกิน CPU และ Memory ต่ำกว่าอย่างชัดเจน

**CPU Usage:** จุดที่น่าสนใจคือในขณะที่กราฟของ Go แกว่งขึ้นลงตาม Traffic ค่อนข้างมาก ตัว Rust กลับคุมการใช้ CPU ให้อยู่ในระดับต่ำได้นิ่งกว่ามากภายใต้ Traffic Split ที่เท่ากัน

![กราฟเปรียบเทียบ CPU Usage ของ Go กับ Rust ตลอด 18 ชั่วโมง พร้อมเส้น Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-cpu-timeseries.png)

**Memory Usage:** กราฟนี้ทำให้เห็นความแตกต่างของ Memory Footprint ได้ชัด โดยเฉพาะเมื่อดูช่วงที่ Go มี Spike ต่อเนื่อง

![กราฟเปรียบเทียบ Memory Usage ของ Go กับ Rust ตลอด 18 ชั่วโมง พร้อมเส้น Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-memory-timeseries.png)

**P99 Latency:** จุดนี้ทำให้เราเห็นภาพ Tail Latency ช่วงที่ Traffic ขึ้นลงจริง ๆ ไม่ได้มองแค่เวลาตอบสนองเฉลี่ยของ Request ทั่ว ๆ ไป

![กราฟเปรียบเทียบ P99 Latency ของ Go กับ Rust ตลอด 18 ชั่วโมง พร้อมเส้น Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-p99-timeseries.png)

ตัวเลขที่ผมชอบที่สุดไม่ใช่แค่ P99 ที่เร็วขึ้น แต่คือโหลด CPU ที่ลดฮวบลงครับ เพราะในงาน ML Inference แบบ CPU-bound ทรัพยากรที่เสียเปล่าไปกับ Thread Contention, Cache Miss หรือการ Copy ข้อมูล **ก็คือทรัพยากรที่เราเสียโอกาสเอาไป Predict ให้โมเดลอื่นต่อ**

## สิ่งที่ได้เรียนรู้ และสิ่งที่ตัวเลขชุดนี้ยังไม่ได้พิสูจน์ 🧠

พอมองย้อนกลับมา งานรอบนี้ไม่ได้จบแค่การเปลี่ยนภาษาจาก Go เป็น Rust ครับ แต่เป็นการรื้อ Flow ตั้งแต่รับ Data ไปจนถึงตอน Predict ใหม่ทั้งหมด ตั้งแต่การลด Copy ข้อมูล, การคุมจำนวน Actor Workers ไปจนถึงการ Compile ลำดับ Preprocessing ไว้ล่วงหน้าก่อนรับ Request

ผล A/B Test รอบนี้สะท้อนให้เห็นว่า **Service ทั้งชุด** ทำงานดีขึ้นจากเดิมแค่ไหนเมื่อเจอ Traffic จริง แต่ไม่ได้แยกวัดว่า Arrow, Actor Model, Allocator หรือ Algebraic FP แต่ละตัวช่วยไปเท่าไรนะครับ รวมถึงตัวเลข **~12.6× ระหว่าง Go Map กับ Arrow** ก็เป็นเพียงการประเมินสำหรับเคส **200 `float32` Features ต่อ Record** ไม่ใช่ตัวเลขเดียวกับ **1.9× ของ Pod Memory ที่วัดได้จริงบน Production**

อีกบทเรียนที่ได้คือ สำหรับงาน CPU-bound การจับทุกอย่างมา Parallel ไม่ใช่คำตอบเสมอไปครับ เราจึงเลือก Parallel แค่ระดับ Items แต่ยังคง Execute DAG Nodes ตามลำดับในแต่ละ Mini-batch เพื่อไม่ให้เกิด Oversubscription ซ้อนขึ้นมาอีกชั้น ส่วนจุดที่อนุญาตให้ Floating Point Reassociate ก็ต้องทำ Parity Test อยู่ดีครับ

ตัวเลขบน Production ข้างต้นแสดงให้เห็นชัดว่าการรื้อระบบรอบนี้คุ้มค่าแค่ไหน และหาก Rollout ไปจนครบ **ทุก Use Case ของทีม** เราคาดว่า Cluster CPU Request น่าจะลดลงจาก **79% เหลือ 69% (10 percentage points)** แต่ย้ำว่าตัวเลขนี้ยังเป็นแค่ **Projection** นะครับ ยังไม่ใช่ผลที่วัดได้จริงหลัง Rollout ครบแล้ว

![กราฟประมาณการ Cluster CPU Requests ก่อนและหลัง Rollout เวอร์ชัน Rust ครบทุก Use Case ของทีม](https://korntewin.github.io/intro-website/blog/figures/cluster-capacity.png)

พอได้มาไล่แกะ Bottleneck ทีละจุด ผมถึงกับแปลกใจเลยครับว่าจริง ๆ แล้วเราเสีย CPU ไปกับการ Copy Data, Allocation และ Thread Contention เยอะขนาดไหน พอเอา CPU เหล่านั้นกลับมาได้ ก็มี Capacity เหลือให้ ML Use Case ถัดไป และยังช่วยลดการใช้ทรัพยากรบน Shared Cluster ที่หลายทีมใช้งานร่วมกันด้วย นี่แหละครับสิ่งที่ผมชอบที่สุดของ RIIR รอบนี้ 🦀

## Checklist สำหรับ CPU-bound ML Prediction Service ✅

ถ้าต้องกลับมา Optimize CPU-bound Prediction Service แบบนี้อีกรอบ ผมจะไล่เช็กประมาณนี้ครับ:

1. **วัดผลบน Workload จริง** ติดตามทั้ง CPU, Memory และ P99 ต่อ Pod ภายใต้ Traffic ที่เทียบเคียงกันได้ ไม่ใช่ดูแค่ผล Microbenchmark อย่างเดียว
2. **เช็ก Memory Layout ก่อน** ถ้ารูปแบบงานเน้นประมวลผลทีละ Feature ข้ามหลาย Records โครงสร้างแบบ Columnar Buffer มักเหมาะกว่าการเก็บ Map แยกทีละ Record
3. **คอยนับจำนวน Copy และ Allocation** การ Slice อาจทำ Zero-copy ได้ก็จริง แต่ขั้นตอนอย่าง Type Cast หรือเตรียม Input ให้ ONNX ก็ยังมีโอกาสต้อง Allocate ใหม่อยู่
4. **คุมจำนวนงานที่วิ่งพร้อมกัน** จูน Mini-batch, Actor Workers และ ONNX Threads ไปด้วยกัน
5. **Compile ตัว Preprocessing DAG ให้จบก่อนรับ Traffic** เพื่อให้จับ Dependency ที่ผิดหรือ Cycle ได้ตั้งแต่ตอน Start ดีกว่าไปพังกลางอากาศตอน Serve จริง
6. **Benchmark ทั้ง Allocator และ SIMD ด้วยความระมัดระวัง** อย่าลืมวัดค่า RSS ควบคู่กัน และต้องเช็ก Numerical Parity เสมอ
7. **กลับไปวัด Production** แยกให้ชัดว่าตัวเลขไหนวัด End-to-end และตัวเลขไหนเป็น Estimate ของ Data Structure

สุดท้ายแล้ว เราไม่ได้อยากงัด Trick ทุกอย่างของ Rust มาใช้หรอกครับ แค่อยากให้ CPU ใช้เวลาไปกับการ Predict จริง ๆ มากกว่ามาเสียเวลาให้ Overhead ที่ตัดทิ้งได้ 😄

ผลลัพธ์รอบนี้ทำให้เรามั่นใจมากขึ้นครับว่า **สำหรับ ML Prediction Service ตัวใหม่ ๆ ต่อจากนี้ เราจะทยอยเริ่มต้นพัฒนาด้วย Rust ตั้งแต่วันแรกเลย** แทนที่จะขึ้นด้วย Go ก่อนแล้วค่อยมา Rewrite ทีหลัง แต่ไม่ได้หมายความว่าจะย้ายทุก Service มา Rust ทันทีนะครับ เรายังต้องดูความเหมาะสมของแต่ละ Use Case ด้วย 🦀

---

**อ่านต่อ / References:** [บทความ Optimization รอบก่อน](https://life.lmwn.com/เบื้องหลังการลด-cost-ai-server-ลง-9-เท่า-และทำให้แอปเร็วขึ้น-4-เท่าที่-line-man-wongnai-da855335de5f) · [Rust 1.98 Release Notes](https://blog.rust-lang.org/2026/08/20/Rust-1.98.0/) · [Apache Arrow Columnar Format](https://arrow.apache.org/docs/format/Columnar.html) · [Go Swiss Tables](https://go.dev/blog/swisstable) · [Polars](https://pola.rs/) · [microsoft/mimalloc (Rust Bindings)](https://github.com/microsoft/mimalloc/tree/v3.6.1/contrib/rust) · [tikv/jemallocator](https://github.com/tikv/jemallocator)
