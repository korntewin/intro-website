---
layout: ../../layouts/BlogLayout.astro
title: "จาก Go สู่ Rust: เมื่อ ML Prediction Service ต้องเร็วขึ้นอีกครั้ง"
description: "เบื้องหลังการ Rewrite ML Prediction Service ด้วย Rust ตั้งแต่ Memory Layout, Arrow/Polars, Actor Model, SIMD ไปจนถึง Memory Allocator"
date: 2026-10-23
coverImage: https://korntewin.github.io/intro-website/blog/figures/riir-cover.png
coverImageAlt: "ภาพประกอบจาก Go สู่ Rust สำหรับ ML Prediction Service"
---

![ภาพประกอบจาก Go สู่ Rust สำหรับ ML Prediction Service](https://korntewin.github.io/intro-website/blog/figures/riir-cover.png)

ถ้าใครเคยอ่าน[บทความก่อนของผมเรื่องการลด Cost AI Server ลง 9 เท่า และทำให้แอปเร็วขึ้น 4 เท่า](https://life.lmwn.com/เบื้องหลังการลด-cost-ai-server-ลง-9-เท่า-และทำให้แอปเร็วขึ้น-4-เท่าที่-line-man-wongnai-da855335de5f) น่าจะจำได้ว่า **ML Prediction Service เป็นงาน CPU-bound ที่ Optimize ยากกว่าการปรับ Web Server ทั่วไป** พอมีทั้ง Preprocessing, Model Inference และ Request ที่บรรทุกข้อมูลจำนวนมากเข้ามาพร้อมกัน เราจึงต้องคิดตั้งแต่ CPU Scheduler ไปจนถึงการทำงานของแต่ละ Thread

ตอนนั้นเรา Optimize Service ที่เขียนด้วย **Go** จนใช้ทรัพยากรน้อยลงไปมาก และ Kubernetes Cluster ก็กลับมามีพื้นที่ให้หายใจอีกครั้ง 🎉

แต่ความโล่งนั้นอยู่กับเราไม่นานครับ... 😅

เมื่อมี **ML Use Case เพิ่มขึ้นเรื่อย ๆ** ทั้งจำนวนโมเดล ขนาดข้อมูล และ Traffic ที่ต้องรองรับ Cluster ที่เคยโล่งก็เริ่มกลับมาเกือบเต็มอีกครั้ง แต่ข้อจำกัดสำคัญของเราไม่ได้มีแค่เรื่อง Cost เพราะตอนนี้ **Private Cloud ของ LINE MAN Wongnai เองก็ใกล้เต็มแล้ว** การเพิ่มเครื่องเพื่อรองรับ Workload ใหม่จึงไม่ใช่ทางเลือกที่ทำได้ง่าย ๆ ครับ 😬

ที่ท้าทายกว่านั้นคือ **หนึ่ง Request ไม่ได้ Rank แค่ Item เดียว** แต่ต้องจัดอันดับ **ประมาณ 500–10,000 Items ต่อ Request** เมื่อ Traffic หลาย Request เข้ามาพร้อมกันในช่วง Peak งานที่ต้อง Predict จึงพุ่งไปถึง **ระดับหลายแสน Items ต่อวินาที** 😵‍💫 นี่คือเหตุผลว่าทำไมทุกการ Copy ข้อมูล, Cache Miss และ CPU Thread ที่แย่งกันทำงานจึงมีผลต่อ Capacity ของระบบอย่างมาก

โจทย์รอบนี้จึงเปลี่ยนจาก “จูน Runtime ให้ดีขึ้น” มาเป็น **เราจะทำให้ ML Prediction Service รองรับ Workload ที่เพิ่มขึ้นได้อย่างไร ภายใต้ Capacity ของ Private Cloud ที่เหลืออยู่อย่างจำกัด?**

เราตัดสินใจทำ **RIIR (Rewrite It In Rust)** แต่ไม่ได้แค่แปลโค้ด Go เป็น Rust แบบหนึ่งต่อหนึ่ง เราใช้โอกาสนี้ออกแบบทั้ง **Memory Layout, Concurrency, Preprocessing Execution และ Code Structure** ใหม่ โดยเป้าหมายคือให้แต่ละ CPU Core ทำงานที่มีประโยชน์มากขึ้นครับ

> บทความนี้เป็น Engineering Story ไม่ใช่การบอกว่า Rust เร็วกว่า Go ในทุกกรณี ผลลัพธ์เป็นการวัดของ Production Workload หนึ่งชุด และตัวเลขที่เปิดเผยเป็นภาพรวมเชิงประสิทธิภาพ ไม่ลงรายละเอียดชื่อ Use Case หรือข้อมูลภายในระบบ

## ผลลัพธ์ก่อน: Go vs Rust บน Production 📊

เราเปรียบเทียบ Service ทั้งสองเวอร์ชันใน Production ภายใต้ **Traffic Split เท่ากัน** เก็บข้อมูลต่อเนื่อง **18 ชั่วโมง ในวันที่ 17–18 ตุลาคม 2026** และดูทั้ง P99 Latency, CPU และ Memory ในระดับ Pod

![กราฟเปรียบเทียบ P99 latency, CPU และ Memory ของ Go และ Rust](https://korntewin.github.io/intro-website/blog/figures/production-results.png)

| Metric | Go (median / peak) | Rust (median / peak) | Improvement |
| --- | ---: | ---: | ---: |
| **P99 server latency** | 416 / 829 ms | 146 / 419 ms | **2.4×** |
| **Max pod CPU usage** | 16.9% / 45.2% | 3.0% / 8.6% | **5.4×** |
| **Max pod memory** | 2.68 / 3.56 GB | 1.43 / 1.70 GB | **1.9×** |

หมายเหตุเล็กน้อย: ค่า **Improvement** ในรายงานคำนวณจาก *median ของอัตราส่วน Go/Rust ที่วัดแต่ละนาที* ไม่ใช่นำ median ของสองฝั่งมาหารกันตรง ๆ ส่วนกราฟแสดง median ของแต่ละฝั่งเพื่อให้เห็นขนาดความแตกต่าง อ่านตัวเลขสองแบบนี้แยกกันนะครับ


### ดูกราฟ Production จริงตลอด 18 ชั่วโมง 👀

ตัวเลข Median ด้านบนช่วยให้เห็นขนาดของ Improvement แต่สำหรับสาย Performance Engineering สิ่งที่น่าดูไม่แพ้กันคือ **แนวโน้มของ CPU, Memory และ P99 Latency ภายใต้ Traffic จริงตลอด 18 ชั่วโมง** ครับ

![Production dashboard เปรียบเทียบ CPU, Memory และ P99 Latency ของ Go กับ Rust](https://korntewin.github.io/intro-website/blog/figures/production-timeseries-dashboard.png)

กราฟสีเหลืองคือ **Go**, สีเขียวคือ **Rust** และเส้นประสีน้ำเงินคือ **Improvement Ratio** (อ่านค่าจากแกนขวา) จะเห็นว่าแม้ Load เปลี่ยนตลอดวัน แต่ Rust ยังคงใช้ CPU และ Memory ต่ำกว่าอย่างชัดเจน

**CPU Usage:** จุดที่น่าสนใจคือแม้ Go จะมีการแกว่งตาม Traffic มาก แต่ Rust คุมการใช้ CPU ได้ในระดับต่ำกว่าเมื่อเทียบกับ Traffic Split เดียวกัน

![กราฟ CPU Usage Go เทียบ Rust ตลอด 18 ชั่วโมง พร้อม Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-cpu-timeseries.png)

**Memory Usage:** กราฟนี้ทำให้เห็นความแตกต่างของ Memory Footprint ได้ชัด โดยเฉพาะเมื่อดูช่วงที่ Go มี Spike ต่อเนื่อง

![กราฟ Memory Usage Go เทียบ Rust ตลอด 18 ชั่วโมง พร้อม Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-memory-timeseries.png)

**P99 Latency:** สิ่งที่ต้องดูไม่ใช่แค่ค่าเฉลี่ย แต่รวมถึง Tail Latency ว่าแต่ละ Service ตอบสนองอย่างไรเมื่อ Traffic แกว่ง

![กราฟ P99 Latency Go เทียบ Rust ตลอด 18 ชั่วโมง พร้อม Improvement Ratio](https://korntewin.github.io/intro-website/blog/figures/production-p99-timeseries.png)

*หมายเหตุ: Memory ในกราฟแสดงเป็น GB ฐานสิบ (1 GB = 1,000,000,000 Bytes) ส่วน Improvement Ratio แสดงค่าที่บันทึกไว้จากการวัดโดยตรง จึงอาจไม่ตรงกับการนำค่า Go และ Rust ที่เห็นบนกราฟมาหารกัน*

ตัวเลขที่ผมชอบที่สุดไม่ใช่แค่ P99 ที่ลดลง แต่คือ CPU ที่ลดลงอย่างมาก เพราะสำหรับ ML Inference แบบ CPU-bound ทรัพยากรที่ใช้ไปกับ Thread Contention, Cache Miss หรือ Copy ข้อมูล **คือทรัพยากรที่เอาไป Predict ให้โมเดลอื่นไม่ได้**

### แล้ว Kubernetes Cluster จะโล่งขึ้นแค่ไหน?

จาก Resource Planning เรา **คาดการณ์** ว่าเมื่อ Rollout การปรับปรุงชุดนี้ครบ **ทุก Use Case ที่ทีมดูแล** จะช่วยลดสัดส่วน **CPU Request ของ Kubernetes Cluster จาก 79% เหลือ 69%** หรือประมาณ **10 percentage points** ครับ ตัวเลขนี้เป็นการประเมินภาพรวมของการ Rollout ทั้งทีม ไม่ใช่ผลจาก Use Case เดียวที่ใช้เปรียบเทียบ Go กับ Rust

![กราฟประมาณการ CPU request ของ Kubernetes Cluster ก่อนและหลัง rollout](https://korntewin.github.io/intro-website/blog/figures/cluster-capacity.png)

ตรงนี้ต้องขีดเส้นใต้ว่า **เป็น Projection สำหรับการ Rollout ครบทุก Use Case ของทีม ไม่ใช่ผลหลัง Rollout ที่วัดได้แล้ว** และเมื่อมี Use Case ใหม่เข้ามาอีก Capacity ก็อาจถูกใช้อีกเช่นเดิม เป้าหมายของเราจึงเป็นการเพิ่ม *Efficiency ต่อ Request* และทำให้เพิ่มโมเดลใหม่ได้ง่ายขึ้น ไม่ใช่แค่ทำให้กราฟว่างช่วงหนึ่งเท่านั้น

## ทำไมไม่แค่เปลี่ยนภาษา?

หลายครั้งเวลาเห็น Benchmark ภาษาโปรแกรม เรามักสรุปสั้น ๆ ว่า “Rust เร็วกว่า Go” แต่สำหรับ Production Inference จริง ๆ **ภาษาเป็นเพียงหนึ่งในปัจจัย** ครับ

สมมติเรายังเก็บ Feature เป็น Object หลายชั้น, Copy DataFrame ทุกครั้งที่แบ่ง Batch หรือปล่อยให้ ONNX Runtime ทุกตัวเปิด Thread แข่งกัน แม้เปลี่ยนเป็น Rust ก็อาจไม่ได้ผลอย่างที่หวัง ตรงกันข้าม หากจัด Layout และ Concurrency ให้ดี เราก็สามารถลดงานที่ CPU ไม่จำเป็นต้องทำลงไปได้มาก

แนวคิดหลักของ RIIR รอบนี้เลยมีอยู่สามอย่าง คือ **ให้ Data อยู่ถูกที่, ให้ Thread ทำงานถูกจังหวะ และให้ Dependency ถูกจัดการล่วงหน้า** ซึ่งนำไปสู่ Optimization ต่อไปนี้ครับ


### อีกเหตุผลที่เลือก Rust: Ecosystem ฝั่ง Data & ML 🦀

จริง ๆ แล้ว Go เป็นภาษาที่ดีมากสำหรับ Web Service, Networking และ Cloud Infrastructure ครับ แต่พอเป็นงาน **Data Processing กับ ML Inference** ผมมองว่า Rust มี Ecosystem ของ Library ประสิทธิภาพสูงที่ตอบโจทย์เราได้ตรงกว่า เช่น **[Polars](https://pola.rs/)** ซึ่งมี Core อยู่บน Rust, **[nlpO3](https://github.com/PyThaiNLP/nlpo3)** สำหรับ Thai NLP และ **[Hugging Face Tokenizers](https://github.com/huggingface/tokenizers)** สำหรับ Tokenization

ข้อได้เปรียบคือเราสามารถใช้ Library เหล่านี้ใน Rust ได้โดยตรงและควบคุม **Ownership, Lifetime และ Memory Layout** ได้ละเอียด โดยไม่ต้องมี Garbage Collector ของภาษาเข้ามาทำงานบน Hot Path นี่ไม่ได้แปลว่า Rust เก่งกว่า Go ในทุกด้านนะครับ แต่สำหรับงาน Preprocessing ที่ต้องวิ่งผ่านข้อมูลจำนวนมาก ความพร้อมของ Ecosystem สำคัญไม่แพ้ตัวภาษาเลย

ถ้าใช้ Go แล้วต้องเรียก Library ที่จัดการ Memory แบบ Native ผ่าน C/C++ อยู่บ่อย ๆ เราอาจเจอสิ่งที่เรียกกันติดปากว่า **"Double GC"** หรือมี Memory Management สองชุดซ้อนกัน อย่างไรก็ตาม ถ้าพูดให้ถูกทางเทคนิค Native Library หลายตัวไม่ได้มี GC ตัวที่สอง แต่ใช้ Native Allocator หรือ Reference Counting ของตัวเอง ขณะที่ Go ใช้ Garbage Collector กับ Go Heap ปัญหาจริงจึงอยู่ที่การดูแล **Memory Lifetime คนละฝั่ง, Native Allocations ที่ Go GC ไม่ได้ติดตามโดยตรง และต้นทุนของการข้าม Runtime Boundary** มากกว่าการมี GC สองตัวพร้อมกัน

Rust เองก็ยังต้องจัดการ Memory ที่อยู่ใน Native Library อย่างถูกต้องครับ แต่การไม่มี Tracing GC และการใช้ Ownership ช่วยให้เราออกแบบเส้นทาง Data Processing ให้ Predictable ได้ง่ายขึ้น

## 1. Apache Arrow + Polars: จัด Memory ให้ CPU อ่านง่ายขึ้น 📦

ก่อนอื่นต้องเข้าใจว่า CPU ไม่ได้อ่านข้อมูลจาก RAM ทีละชิ้นแบบไม่มีต้นทุน ทุกครั้งที่ต้องตาม Pointer ไปยัง Memory Location ใหม่ เราเสี่ยงเจอ Cache Miss และต้องรอข้อมูลจาก Memory Hierarchy ชั้นที่ช้ากว่า

ถ้าเก็บข้อมูลแบบ Row-oriented ที่แต่ละ Record ถือ Field หลายชนิดอยู่ใน Object ต่าง ๆ การวนประมวลผล Feature เดียวกันของหลายพัน Records อาจทำให้ CPU ต้อง **Pointer Chasing** ไปมาระหว่าง Address จำนวนมาก

แต่ Preprocessing ของ ML มักทำงาน “ทีละ Feature กับหลาย Records” มากกว่า “ทีละ Record กับทุก Feature” เราจึงเลือกใช้ **Apache Arrow** เป็นพื้นฐาน Columnar Memory Format และใช้ **Polars** ในการจัดการ DataFrame

![ภาพอธิบาย Row-oriented และ Columnar Memory Layout](https://korntewin.github.io/intro-website/blog/figures/columnar-memory.png)

ใน Columnar Layout ค่าประเภทเดียวกันจะถูกจัดเก็บใน Buffer ตาม Column ทำให้การ Scan Column ตัวเลขมี Memory Locality ดีกว่าโครงสร้างที่ต้อง Dereference Object หลายชั้น และเปิดโอกาสให้ Compiler หรือ Library ใช้ **SIMD / Vectorized Operations** ได้มีประสิทธิภาพขึ้น

แน่นอนว่าไม่ใช่ทุก Arrow Column จะเรียง Value เป็น Array ตัวเลขก้อนเดียวเสมอ เช่น String ใช้ Offset Buffer กับ Values Buffer และ Polars ก็อาจมีหลาย Chunk แต่หลักสำคัญคือ **ลดการกระโดดของ Memory Access ที่ไม่จำเป็นสำหรับงานประมวลผลเป็นคอลัมน์**


### Validity Bitmap: เก็บ Null ด้วย 1 Bit ต่อค่า

อีกจุดที่ช่วยลด Memory Overhead คือ **Validity Bitmap** ของ Apache Arrow แทนที่จะห่อแต่ละค่าด้วย Object ที่มี Pointer หรือ Metadata แยกกัน Arrow ใช้ Bit เป็นตัวบอกว่าแต่ละ Slot มีค่าหรือเป็น Null โดย **1 = Valid** และ **0 = Null** ใช้เพียง 1 Bit ต่อ Slot (ยังไม่รวม Padding หรือ Metadata ของ Buffer) และถ้าทั้ง Column ไม่มี Null ก็สามารถ **ไม่ต้องสร้าง Validity Bitmap** เลยได้

ลองนึกถึงคอลัมน์รายการสินค้าที่มีค่าเป็น `[10, 20, 30]`, `null`, `[]` และ `[40, 50]` จะเห็นว่า **Null List กับ Empty List ไม่เหมือนกัน** ถึงแม้ทั้งคู่จะไม่มี Item อยู่ในช่วง Child Values ก็ตาม Validity Bitmap จึงเป็นตัวช่วยบอกความแตกต่างตรงนี้

### LargeList + Offsets: ทำ List ให้แชร์ Buffer เดียวกัน

สำหรับข้อมูลแบบ Nested List เราไม่จำเป็นต้องสร้าง Heap Object แยกสำหรับทุก Row ครับ Arrow ใช้ **Offsets Buffer** เก็บจุดเริ่มและจุดสิ้นสุดของข้อมูลใน **Child Values Buffer เดียวกัน** เช่น `offsets = [0, 3, 3, 3, 5]` และ `values = [10, 20, 30, 40, 50]` โดย Row ที่ `i` จะเข้าถึงข้อมูลช่วง `values[offsets[i]..offsets[i+1]]`

![แผนภาพ Apache Arrow Validity Bitmap และ LargeList Offsets ที่แชร์ Child Values Buffer](https://korntewin.github.io/intro-website/blog/figures/arrow-validity-large-list.png)

สำหรับ `LargeList` จะใช้ **64-bit Offsets** แทน **32-bit Offsets** ของ `List` จึงรองรับ Child Arrays ที่มีจำนวน Elements มากได้ ส่วนสิ่งที่ช่วย Memory Locality จริง ๆ คือ **การเก็บ Values ต่อเนื่องและอ้างอิงด้วย Offsets แทนการกระโดดตาม Pointer ของแต่ละ Row** ไม่ใช่เพราะ 64-bit ประหยัดกว่า 32-bit เพราะจริง ๆ แล้ว Offsets ขนาด 64-bit ใช้พื้นที่มากกว่าด้วยซ้ำ

เมื่อส่ง Mini-batch ไปที่ Actor Worker เราจึงสามารถส่ง **View/Slice ของ Buffer เดิม** ได้ในหลายกรณี โดยไม่ต้องสร้าง List Object ใหม่ทุก Row นี่เป็นจุดเชื่อมสำคัญระหว่าง Columnar Format, Zero-copy และ Data Parallelism ครับ

### Bonus: Zero-copy Slice ไม่ต้อง Copy ทุก Mini-batch

เวลาจะส่งข้อมูลจำนวนมากเข้า Worker เรามักต้องแบ่งเป็น Mini-batch ถ้าทุกครั้งต้องสร้าง Array ใหม่แล้ว Copy ค่าเดิมทั้งหมด ก็เท่ากับจ่ายค่า Memory Bandwidth และ Allocation เพิ่มทั้งที่ข้อมูลไม่เปลี่ยนเลย

Arrow รองรับการ **Slice ที่แชร์ Buffer เดิม** โดยเปลี่ยน Metadata เช่น Offset และ Length แทนการ Copy Payload ซึ่งเข้ากับการส่ง Mini-batch ให้ Worker มากครับ

![แผนภาพ Arrow Zero-copy Slicing ที่แชร์ Underlying Buffer เดียวกัน](https://korntewin.github.io/intro-website/blog/figures/arrow-zero-copy.png)

ข้อควรระวังคือ **Zero-copy ไม่ได้หมายความว่า Pipeline ทั้งเส้นไม่มี Allocation** การ Cast Type, Compute Feature, Rechunk หรือแปลง Input สำหรับ ONNX Runtime บางกรณีก็ยังสร้าง Buffer ใหม่ได้ เราจึงใช้ Zero-copy ในจุดที่รองรับจริง และวัด Allocation ในจุดที่ยังหลีกเลี่ยงไม่ได้

## 2. Actor Model: ให้แต่ละ ML Model จัดการ Mini-batch ของตัวเอง 🧵

ปัญหาคลาสสิกของระบบ CPU-bound คือเมื่อมีงานเข้ามามาก เราอาจเผลอเพิ่ม Concurrency มากกว่าที่ Hardware จะรับไหว เช่น Request หลายตัวต่าง Spawn งานประมวลผลพร้อมกัน และแต่ละโมเดลก็อาจมี Thread Pool ของ ONNX Runtime ของตัวเองอีก

ผลที่ตามมาคือ **Oversubscription**: มี Runnable Threads มากเกิน CPU Core จนเกิด Context Switching และแย่ง Cache กัน สุดท้าย Throughput ไม่เพิ่ม แต่ Tail Latency กลับแย่ลง

ใน RIIR เราใช้ **Actor Model** โดยแยก **Preprocessing Actor Pool** และ **Inference Actor Pool** *สำหรับแต่ละ ML Model* แล้วแบ่ง Items ใน Request เป็น Mini-batch ให้ Worker ประมวลผล

![แผนภาพ Actor Model แยก Preprocessing และ Inference Worker Pools พร้อม Mini-batches](https://korntewin.github.io/intro-website/blog/figures/actor-mini-batches.png)

สิ่งที่ได้คือเราสามารถปรับ **Worker Count, Batch Size และ ONNX Runtime Threads** แยกตามโมเดลได้ ไม่จำเป็นต้องใช้ค่าเดียวกันทั้ง Service เพราะแต่ละโมเดลมีลักษณะต่างกัน เช่น Preprocessing หนักแต่ Inference เบา หรือ Inference ใช้ Memory Bandwidth มากจนเพิ่ม Threads แล้วไม่ได้เร็วขึ้น

Actor Model ไม่ได้ทำให้คำนวณเร็วขึ้นโดยตัวมันเองนะครับ จุดที่ช่วยคือการสร้าง **ขอบเขตของ Concurrency และ Ownership ที่ชัดเจน** ทำให้เรา Tune แต่ละ Stage อย่างเป็นระบบ แทนที่จะปล่อยให้ทุก Request แข่งกันใช้ CPU อย่างอิสระ

และไม่จำเป็นต้องหมายถึง Dynamic Batching ข้าม Request เสมอไป ในที่นี้ Mini-batch คือการแบ่งข้อมูลใน Request ให้ Stage ต่าง ๆ ประมวลผลอย่างมีขนาดเหมาะสม

## 3. Kahn's Algorithm: จัดลำดับ Preprocessing ก่อนรับ Traffic 🧩

Preprocessing ของ ML ไม่ใช่แค่ Loop Transform Feature ธรรมดา เพราะ Function หลายตัวมี Dependency ต่อกัน เช่น ต้อง Normalize ก่อนสร้าง Derived Feature หรือสร้าง Column A/B ก่อนนำไปประกอบเป็น Input ของโมเดล

ถ้าเราเรียก Function ผิดลำดับ อาจได้ผล Predict ผิดหรือเกิด Missing Column ตอน Runtime ดังนั้นเรา Represent Dependency เป็น **Directed Acyclic Graph (DAG)** แล้วใช้ **Kahn's Algorithm สำหรับ Topological Sort** เพื่อ Compile ลำดับการทำงานที่ถูกต้องตั้งแต่ Startup

![แผนภาพ Dependency Graph และ Kahn Topological Sort ของ Preprocessing](https://korntewin.github.io/intro-website/blog/figures/kahn-dag.png)

หลักการของ Kahn's Algorithm เข้าใจง่ายมาก: นับจำนวน Dependency ที่เข้ามาในแต่ละ Node (*in-degree*) แล้วเริ่มจาก Node ที่มี in-degree เป็น 0 จากนั้นค่อยนำ Node ที่พร้อมออกมาประมวลผล ลด in-degree ของ Node ถัดไป และทำซ้ำจนจบ หากยังมี Node เหลือแต่ไม่มีตัวไหนพร้อม แปลว่ามี **Cycle** ที่ต้องแก้ก่อน Service Start

ข้อดีสำหรับ Production Service คือเราเปลี่ยนงานจาก **“ค้นหาลำดับ Preprocessing ทุก Request”** เป็น **“Validate และ Compile ครั้งเดียวตอน Boot”** เมื่อ Request เข้ามาก็ Execute แผนที่เตรียมไว้ได้เลย

สำหรับ RIIR รอบนี้เราเลือกทำ **1D Parallelism หรือ Data Parallelism เพียงมิติเดียว** คือแบ่ง Items ในแต่ละ Request เป็น Mini-batches แล้วให้ Workers ประมวลผลข้อมูลแต่ละ Batch พร้อมกัน แต่ **ภายในแต่ละ Mini-batch เรา Execute Preprocessing Nodes ตามลำดับ Topological Sort** ไม่ได้ Parallel แยกตาม Nodes แม้ว่าบาง Nodes จะไม่มี Dependency ต่อกันก็ตาม

เหตุผลคือเรามีทั้ง Actor Workers และ ONNX Runtime Threads ที่ใช้ CPU อยู่แล้ว ถ้าทำ Parallel ทั้งตาม Items และตาม DAG Nodes เพิ่มอีกชั้น อาจเกิด **CPU Oversubscription** ทำให้ Threads แย่ง CPU กันมากขึ้น เกิด Context Switching และส่งผลเสียต่อ P99 Latency สรุปคือเราไม่ได้พยายาม Parallel ทุกอย่างที่ Parallel ได้ แต่เลือก Parallel เฉพาะ **แกนข้อมูล (Data)** เพื่อคุมจำนวนงานที่วิ่งพร้อมกันให้เหมาะกับ CPU ครับ 🧵

## 4. Rust 1.98: Algebraic Floating Point เปิดทางให้ SIMD เพิ่มเติม ⚡

หลายคนน่าจะเคยเจอว่าทำไม Code บวกเลขง่าย ๆ ถึง Auto-vectorize ไม่ได้ ทั้งที่ CPU มี SIMD Instructions อยู่แล้ว สาเหตุหนึ่งคือ **Floating Point ไม่ได้มี Associativity แบบเลขจริง** เช่น `(a + b) + c` อาจได้ค่าไม่เท่ากับ `a + (b + c)` เพราะมี Rounding ในแต่ละ Operation

Rust 1.98 เพิ่ม Method อย่าง `f32::algebraic_add` และ `f64::algebraic_mul` ที่เราเลือกใช้เป็นจุด ๆ ได้ เพื่อเปิดโอกาสให้ Compiler **Reassociate** หรือเปลี่ยนรูปสมการ และอาจทำให้ Loop Vectorization เกิดขึ้นได้มากขึ้น

![ภาพอธิบายการจัดกลุ่ม Floating Point Operations ใหม่เพื่อเปิดทางให้ Vectorization](https://korntewin.github.io/intro-website/blog/figures/algebraic-floats.png)

ตัวอย่างเชิงแนวคิด:

```rust
// Normal FP operations preserve the prescribed evaluation semantics.
let normal = ((a + b) + c) + d;

// Explicit algebraic operations allow the compiler more freedom.
let algebraic = a.algebraic_add(b)
    .algebraic_add(c)
    .algebraic_add(d);
```

นี่ไม่ได้แปลว่า Update Compiler เป็น Rust 1.98 แล้ว Code ทุกบรรทัดจะเร็วขึ้นทันทีนะครับ เราต้องเลือกใช้ Method เหล่านี้อย่างมีเหตุผล และระวังเรื่อง **Numerical Accuracy, NaN, Infinity, Signed Zero** ตลอดจนความแตกต่างของผลลัพธ์ระหว่าง Compiler/Architecture

โดยเฉพาะ Production ML ที่ผล Predict ต้องมีความสอดคล้องกับเวอร์ชันเดิม เราจึงต้องมี **Parity Tests** และ Benchmark ก่อนเปิด Optimization ในจุดที่เหมาะสม ส่วนตัวเลข 2.4×/5.4×/1.9× ข้างต้นเป็นผลรวมของการออกแบบหลายส่วน **ไม่ใช่ Benchmark แยกเฉพาะ Algebraic Operations**

## 5. Memory Allocator: ptmalloc, mimalloc หรือ jemalloc? 🧠

อีกจุดที่หลายคนมองข้ามคือ **Memory Allocator** ครับ ต่อให้ DataFrame ถูกจัด Layout ดีขึ้น งาน Preprocessing ก็ยังต้องสร้าง Temporary Buffers, Intermediate Columns และ Objects ระหว่างทางอยู่ดี

บน Linux ที่ใช้ glibc ตัว System Allocator ปกติคือ **ptmalloc** ซึ่งใช้งานทั่วไปได้ดี แต่ใน Workload ที่มี Allocation/Free จำนวนมากพร้อมกันหลาย Threads เราอาจต้องพิจารณาทางเลือกอื่น เช่น **mimalloc** และ **jemalloc**

| Allocator | จุดเด่น | Trade-off ที่ควรดู |
| --- | --- | --- |
| **ptmalloc** (glibc default) | ไม่ต้องเพิ่ม Dependency และทำงานได้ดีในงานทั่วไป | Workload ที่ Allocate/Free พร้อมกันอาจเจอ Contention หรือ Fragmentation ตาม Pattern |
| **mimalloc** | ออกแบบเรื่อง Fast Allocation, Thread-local Paths และ Low Contention | ผลลัพธ์ขึ้นอยู่กับขนาด Object, Allocation Pattern และ Memory Footprint |
| **jemalloc ผ่าน tikv-jemallocator** | มี Arena / Thread Cache, ปรับจูนได้ และรองรับ Heap Profiling | ต้องดู Build, Configuration, RSS Behavior และความซับซ้อนด้าน Operations เพิ่มเติม |

เราเลือก **tikv-jemallocator** เป็น Global Allocator ของ Application โดยน่าสนใจว่าฝั่ง [tikv/jemallocator](https://github.com/tikv/jemallocator/commits) กลับมีการ Maintain และ Update อีกครั้งในปี 2026 รวมถึงการอัปเดต jemalloc 5.3.1 ในเดือนเมษายน

```rust
#[global_allocator]
static GLOBAL_ALLOCATOR: tikv_jemallocator::Jemalloc =
    tikv_jemallocator::Jemalloc;
```

แต่ผมอยากย้ำว่า **ไม่มี Allocator ตัวไหนชนะทุก Workload** โดยอัตโนมัติ การเปรียบเทียบที่แฟร์ควรใช้ Traffic, Model, Worker Count, Batch Size, Binary และ Environment เดียวกัน แล้ววัดทั้ง Throughput, P99, CPU และ RSS ไม่ใช่ดูแค่ Benchmark Allocation จิ๋ว ๆ

เราได้ **Benchmark Memory Allocator บน ML Prediction Service จริง** ไม่ได้อิงแค่ Microbenchmark ครับ และพบว่าในช่วง **Peak Load** การใช้ **jemalloc ช่วยลด Memory Usage ได้ประมาณ 100–500 MB** เมื่อเทียบกับ Allocator ทางเลือกที่นำมาทดสอบ ผลต่างขึ้นอยู่กับลักษณะ Workload และระดับ Load ในช่วงนั้น ซึ่งเป็นหนึ่งในเหตุผลเชิงตัวเลขที่เราเลือกใช้ **tikv-jemallocator**

อย่างไรก็ตาม ตัวเลข **Production Improvement จากการย้าย Go มา Rust** ด้านบนเป็นผลรวมจากหลาย Optimization ที่ทำงานร่วมกัน ไม่ใช่ผลจากการเปลี่ยน Allocator เพียงอย่างเดียว

### ทำอย่างไรให้ทุก Application ใช้ Allocator เดียวกัน?

ใน Rust การประกาศ `#[global_allocator]` อยู่ที่ระดับ Binary Application ถ้า Monorepo มีหลาย Application เราอาจพลาดได้ง่ายเมื่อเพิ่ม Use Case ใหม่แล้วลืมระบุ Allocator

เราเลยใช้ **Semgrep** เป็น Policy Check ใน CI เพื่อบังคับให้แต่ละ Application Layer มีการ Configure Global Allocator ตามมาตรฐานเดียวกัน วิธีนี้ช่วยไม่ให้เรื่อง Performance ที่ต้องทำซ้ำกลายเป็นสิ่งที่ขึ้นอยู่กับความจำของคนเขียน Code ครับ

## 6. Workspace + Application Layer: รองรับหลาย Use Case โดยไม่ Copy Core 🏗️

เมื่อ Service ต้องรองรับมากกว่าหนึ่ง ML Model และมี Use Case ใหม่เพิ่มเรื่อย ๆ เราไม่อยากกลับไปสร้าง Service ใหม่โดย Copy Code จากตัวเก่าทุกครั้ง

ดังนั้นโค้ด Rust จึงถูกจัดเป็น **Monorepo แบบ Cargo Workspace** โดยแยก **Application Layer** (Configuration, Adapters, Use Case Composition) ออกจาก **Prediction Core** (Preprocessing DAG, Actor Pools, ONNX Inference, Shared Data Structures)

![แผนภาพ Cargo Workspace ที่แยกหลาย Application ออกจาก Prediction Core และใช้ Semgrep บังคับ Global Allocator](https://korntewin.github.io/intro-website/blog/figures/workspace-semgrep.png)

แต่ละ Application สามารถเลือกประกอบ Predictor ของตัวเองได้ เช่น มีหลายโมเดลที่ต้องทำงานต่อกันหรือมี Input/Output ต่างกัน โดยที่ Core ไม่ต้องรู้ว่าโมเดลกำลังทำนายอะไร และไม่ต้องรับ Business Logic ของแต่ละ Use Case เข้าไปปะปน

ข้อดีไม่ได้มีแค่ Code Reuse แต่ยังช่วยให้เรา **Benchmark, Test และ Tune แต่ละ Application ได้โดยไม่สร้างหลาย Implementation ของ Prediction Engine** ส่วน Details เรื่อง Architecture ยังมีอีกเยอะ แต่ขอเก็บไว้เล่าคราวหน้าครับ 😄

## แล้วมั่นใจได้อย่างไรว่าเร็วขึ้น แต่ Predict ยังถูก?

Optimization สำหรับ ML Prediction Service ต่างจากการทำ API ให้เร็วเฉย ๆ เพราะถ้าตอบเร็วขึ้นแต่ Score เพี้ยน เราก็ไม่ได้แก้ปัญหาจริงครับ

สิ่งที่เราให้ความสำคัญคือ **ผลทำนายต้องมี Numerical Parity ที่ยอมรับได้**, Preprocessing ต้องใช้ลำดับ Dependency ที่ถูกต้อง และ Version ของ Model Artifact ต้องตรงกับสิ่งที่ใช้ทดสอบ ขณะเดียวกัน Performance ก็ควรวัดด้วย **Production-like Traffic หรือ Traffic Split ที่เทียบกันได้** ไม่ใช่ Benchmark บน Laptop แล้วเอาไปสรุปเป็นตัวเลข Production

การดู P99 เพียงอย่างเดียวอาจไม่พอ เพราะเราต้องเห็นว่า Service ใช้ CPU และ Memory เท่าไรเพื่อให้ได้ Latency นั้นด้วย โดยเฉพาะเมื่อเป้าหมายสุดท้ายคือการขยายระบบให้รองรับ ML Use Case ใหม่ได้ด้วยต้นทุนที่เหมาะสม

## Learning Points: สิ่งที่ได้จาก RIIR รอบนี้ 💡

1. **Memory Layout สำคัญไม่แพ้ภาษา** เราจึงเริ่มจากลด Pointer Chasing และการ Copy ที่ไม่จำเป็น ก่อนเพิ่มความซับซ้อนเรื่อง Threads
2. **Concurrency ที่มากกว่าไม่ได้แปลว่าเร็วกว่า** เราใช้ 1D Data Parallelism ผ่าน Actor Pools และ Mini-batches โดยไม่ Parallel DAG Nodes เพิ่ม เพื่อเลี่ยง CPU Oversubscription
3. **Compile สิ่งที่รู้ล่วงหน้าตั้งแต่ Startup** DAG ของ Preprocessing ควรถูกจัดลำดับ Dependency ไว้ก่อนรับ Request แรก
4. **SIMD ต้องเข้าใจ Semantics** Algebraic FP เปิดโอกาสให้ Compiler Optimize ได้มากขึ้น แต่ต้องตรวจผลลัพธ์เชิงตัวเลขทุกครั้ง
5. **Allocator เป็นส่วนหนึ่งของ Performance Design** Benchmark ของ Prediction Service แสดงว่า jemalloc ลด Memory Usage ได้ประมาณ 100–500 MB ช่วง Peak Load และเราใช้ CI Policy เพื่อไม่ให้ Application ไหนลืม Config
6. **Architecture ที่ดีช่วยให้ Optimization คุ้มในระยะยาว** เมื่อ Core ถูกแชร์กัน การปรับปรุงครั้งเดียวก็มีโอกาสส่งผลให้หลาย Use Case

## Conclusions

ถ้ารอบก่อนคือการ **Optimize Go Runtime** รอบนี้ก็คือการ **Re-think ว่า ML Prediction Service ควรจัด Data, CPU Threads และ Model Execution อย่างไรตั้งแต่แรก** ผ่าน Rust, Apache Arrow, Polars, Actor Model และกลไกอื่น ๆ ที่ทำงานร่วมกัน

ผลบน Production ของการเปรียบเทียบครั้งนี้คือ **P99 Latency ดีขึ้น 2.4 เท่า, CPU Usage ลดลง 5.4 เท่า และ Memory ลดลง 1.9 เท่า** ใน Traffic Split เท่ากัน ส่วนเมื่อ Rollout การปรับปรุงให้ครบ **ทุก Use Case ของทีม** เราคาดว่า **Cluster CPU Request จะลดจาก 79% เหลือ 69% (10 percentage points)** ซึ่งยังเป็น Projection ไม่ใช่ผลที่วัดได้หลัง Rollout

สุดท้ายสิ่งที่ผมได้เรียนรู้คือ Performance Engineering ไม่ใช่การหา Library ที่เร็วที่สุดเพียงตัวเดียว แต่เป็นการทำให้ **Data Flow, Memory Layout, Scheduling และ Architecture เข้ากันได้กับธรรมชาติของ Workload** มากที่สุด โดยเฉพาะในวันที่ **Private Cloud มี Capacity เหลืออยู่อย่างจำกัด** และเราไม่สามารถแก้ปัญหาด้วยการเพิ่มเครื่องได้ง่าย ๆ ครับ 🚀

---

**อ่านต่อ / References:** [บทความ Optimization รอบก่อน](https://life.lmwn.com/เบื้องหลังการลด-cost-ai-server-ลง-9-เท่า-และทำให้แอปเร็วขึ้น-4-เท่าที่-line-man-wongnai-da855335de5f) · [Rust 1.98 Release Notes](https://blog.rust-lang.org/2026/08/20/Rust-1.98.0/) · [Apache Arrow Columnar Format](https://arrow.apache.org/docs/format/Columnar.html) · [Medium image formats](https://help.medium.com/hc/en-us/articles/215679797-Using-images) · [Polars](https://pola.rs/) · [tikv/jemallocator](https://github.com/tikv/jemallocator)
