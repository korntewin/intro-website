---
layout: ../../layouts/BlogLayout.astro
title: "จาก Go สู่ Rust: เมื่อ ML Prediction Service ต้องเร็วขึ้นอีก"
description: "เบื้องหลังการ Rewrite ML Prediction Service ด้วย Rust, Arrow, Polars และ Actor Model เมื่อ Kubernetes เริ่มเต็มอีกครั้ง"
date: 2026-10-23
---

ใน[บทความก่อน](https://medium.com/@korntewin-b) ผมเล่าถึงการ Optimize **ML Prediction Service ด้วย Go** จนลดการใช้ทรัพยากรลงได้มาก แต่เรื่องยังไม่จบครับ 😅

เมื่อมี ML Use Case ใหม่ ๆ เพิ่มเข้ามา Kubernetes Cluster ที่เคยโล่งก็เริ่มกลับมาเกือบเต็มอีกครั้ง โจทย์รอบนี้เลยไม่ใช่แค่ปรับค่า Runtime แต่เป็นการ **RIIR (Rewrite in Rust)** ทั้ง Prediction Service โดยยังต้องรองรับหลายโมเดลและหลาย Use Case เหมือนเดิม

## ผลลัพธ์: Go vs Rust บน Production

เราแบ่ง Traffic ให้ทั้งสอง Service เท่า ๆ กัน แล้ววัดผลกับ **Mart Item Keyword Search** ในวันที่ 17–18 ตุลาคม 2026 เป็นเวลา 18 ชั่วโมง

| Metric | Go (median) | Rust (median) | Improvement* |
| --- | ---: | ---: | ---: |
| P99 Server Latency | 416 ms | 146 ms | **2.4×** |
| Max Pod CPU Usage | 16.9% | 3.0% | **5.4×** |
| Max Pod Memory | 2.68 GB | 1.43 GB | **1.9×** |

*Improvement คำนวณจาก median ของอัตราส่วน Go/Rust ในแต่ละนาที ไม่ใช่การหารตัวเลข median ของสองฝั่งโดยตรง*

หาก Rollout ครบตามแผน เรา**คาดการณ์**ว่าจะคืน CPU Request ของคลัสเตอร์ได้ประมาณ **6.3 percentage points** จาก 77.7% เหลือ 71.4% สำหรับ Mart KW Search เท่านั้น ตัวเลขนี้ยังเป็น Projection ไม่ใช่ทรัพยากรที่คืนได้แล้วจริง ๆ

แล้วเราเปลี่ยนอะไรไปบ้าง?

## 1. จัดข้อมูลใหม่ด้วย Apache Arrow และ Polars

เดิม Feature จำนวนมากถูกเก็บเป็นโครงสร้างแบบ Row-oriented ที่ต้องไล่ Pointer ไปมา (Pointer Chasing) ส่งผลเสียต่อ CPU Cache โดยเฉพาะเมื่อหนึ่ง Request มี Items จำนวนมาก

เราเลือกใช้ **Apache Arrow** เป็น Memory Layout แบบ Columnar และใช้ **Polars** จัดการ DataFrame ทำให้ข้อมูลประเภทเดียวกันอยู่ติดกันใน Memory เข้าถึงได้ต่อเนื่องมากขึ้น และเปิดโอกาสให้ CPU ทำงานแบบ Vectorized ได้ดีขึ้น

อีกข้อดีคือการ Slice ข้อมูลจาก Arrow สามารถแชร์ Buffer เดิมได้แบบ **Zero-copy** ในกรณีที่ Operation รองรับ จึงไม่จำเป็นต้อง Copy ข้อมูลใหม่ทุกครั้งที่ส่ง Mini-batch ไปยัง Worker (แต่การแปลงข้อมูลหรือคำนวณบาง Operation ก็ยังต้อง Allocate ได้ตามปกติ)

## 2. Actor Model: แยก Preprocessing กับ Inference

แทนที่จะให้ทุก Request แย่ง Thread กัน เราจัด **Actor Pool แยกตาม ML Model** และแยกงานเป็น **Preprocessing** กับ **Inference** โดยให้ Worker ของแต่ละ Stage ประมวลผลเป็น Mini-batch

แต่ละโมเดลปรับ Worker Count, Batch Size และจำนวน ONNX Runtime Threads ได้อิสระ ช่วยคุม Concurrency ไม่ให้ CPU ทำงานเกินกำลัง และลด Thread Contention ในช่วง Traffic สูง

สำหรับ Use Case ที่ประกอบด้วยหลายโมเดล เช่น Item Tower, User Tower และ Base Model ชั้น Application เป็นผู้กำหนดว่าผลลัพธ์ของแต่ละโมเดลจะไหลไปหากันอย่างไร ส่วน Prediction Core ไม่จำเป็นต้องรู้ Business Logic

## 3. Preprocessing DAG ด้วย Kahn's Algorithm

Preprocessing มี Dependency เช่น ต้อง Normalize ก่อน แล้วจึงสร้าง Derived Feature ถ้ารันผิดลำดับ ผล Predict ก็ผิดได้

ตอนเริ่ม Service เราจึง Compile Dependency Graph ด้วย **Kahn's Algorithm (Topological Sort)** เพื่อหาลำดับการทำงานที่ถูกต้อง และตรวจจับ Cycle ตั้งแต่ Startup ไม่ต้องมาจัด Dependency ใหม่ทุก Request

แนวคิดคือ **ทำงานที่คำนวณได้ล่วงหน้าให้เสร็จตั้งแต่ Boot** แล้วให้ Request Path ทำงานให้น้อยที่สุด

## 4. Rust 1.98 และ Algebraic Floating Point

งานด้าน Numeric ไม่ได้เร็วขึ้นเพียงเพราะเปลี่ยนภาษา เราต้องช่วย Compiler ด้วย โดยใน Rust 1.98 มีความสามารถด้าน **Algebraic Floating-point Operations** ที่เปิดทางให้ Compiler ทำ Transformation เช่น Reassociation ภายใต้เงื่อนไขที่เหมาะสม จึงอาจช่วยเรื่อง SIMD/Vectorization เพิ่มเติม

ข้อแลกเปลี่ยนคือ ลำดับการคำนวณ Floating Point อาจเปลี่ยนและทำให้ผลลัพธ์ต่างไปเล็กน้อย เราจึงต้องตรวจ **Numerical Parity** เทียบกับ Go และ Benchmark จริง ไม่ใช่เปิด Optimization แล้วสรุปว่าเร็วขึ้นเสมอ

## 5. Memory Allocator: ptmalloc, mimalloc หรือ jemalloc?

เมื่อ Data Processing มีการ Allocate/Free Buffer ตลอดเวลา ตัว Allocator ก็เริ่มมีผลต่อ Performance เราจึงพิจารณา 3 ทางเลือก

| Allocator | จุดเด่น | ข้อควรระวัง |
| --- | --- | --- |
| **ptmalloc** (glibc default) | ติดมากับ Linux/glibc ไม่ต้องเพิ่ม Dependency | บาง Workload ที่ Allocate พร้อมกันหลาย Thread อาจเกิด Contention/Fragmentation |
| **mimalloc** | ออกแบบเพื่อ Allocation ที่รวดเร็วและลด Contention; รองรับหลายแพลตฟอร์ม | Performance ขึ้นอยู่กับ Allocation Pattern |
| **tikv-jemallocator** (jemalloc) | Arena/tcache, ปรับแต่ง Memory Behavior และเปิด Profiling ได้ | เพิ่ม Complexity ด้าน Build/Config/Monitoring |

สุดท้ายเราเลือก **tikv-jemalloc** โดยโครงการที่เกี่ยวข้องกลับมามีความเคลื่อนไหวด้าน Maintenance อีกครั้งในปี 2026 อย่างไรก็ตาม **ยังไม่มีตัวเลข Benchmark แยกเฉพาะ Allocator ในบทความนี้** จึงไม่ควรตีความว่ามันเร็วกว่า mimalloc หรือ ptmalloc ทุกกรณี

เราใช้ **Semgrep** ตรวจใน CI เพื่อบังคับให้งานทุก Application Crate ประกาศ Global Allocator ตามมาตรฐานเดียวกัน ไม่ให้มี Use Case ใหม่ลืม Config นี้ไป

## 6. Rust Workspace ที่เพิ่ม Use Case ได้โดยไม่ Rewrite Core

โค้ดใหม่เป็น **Monorepo แบบ Cargo Workspace** แยกชั้น Application (Food KW Search, Mart KW Search และ Use Case ใหม่ในอนาคต) ออกจาก **Prediction Core** ซึ่งดูแล Actor Pool, DAG, Preprocessing และ Inference

เพิ่ม Use Case ใหม่ได้โดยประกอบ Predictor และ Adapter ของตัวเอง ไม่ต้อง Copy Pipeline หรือแก้ Core Logic ไปทุกที่

## สรุป

รอบก่อนเรา Optimize Go Runtime เพื่อแก้ปัญหา Scale แต่รอบนี้เราออกแบบ **Memory Layout, Concurrency, Data Flow และ Code Structure ใหม่ด้วย Rust** เพื่อให้รองรับการเติบโตของ ML Use Case ในระยะยาว

ผลที่เห็นบน Production คือ **P99 ดีขึ้น 2.4×, CPU ลดลง 5.4× และ Memory ลดลง 1.9×** ภายใต้ Traffic Split เท่ากัน แต่สิ่งที่สำคัญไม่แพ้ Performance คือเราได้ Prediction Platform ที่นำกลับไปใช้กับโมเดลใหม่ได้ง่ายขึ้นครับ 🚀

> หมายเหตุ: ตัวเลขเป็นผลวัดของ Mart Item KW Search ในช่วงเวลาทดสอบดังกล่าว ไม่ใช่ข้อสรุปว่า Rust เร็วกว่า Go ในทุก Workload และรายละเอียดภายในระบบที่ไม่จำเป็นต่อการอธิบายได้ถูกละไว้จากบทความสาธารณะ
