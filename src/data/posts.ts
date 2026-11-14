// Single source of truth for blog posts. Keep newest first:
// the home page and the blog index both treat posts[0] as the latest.
export interface Post {
  number: string;
  category: string;
  date: string;
  language: string;
  title: string;
  description: string;
  href: string;
  hrefEn: string;
  cover: string;
  coverAlt: string;
  coverLabel: string;
  tags: string[];
}

export const posts: Post[] = [
  {
    number: '002',
    category: 'RUST / BUILD TOOLS',
    date: '14 NOV 2026',
    language: 'TH / EN',
    title: 'sccache: เมื่อ Rust Build ช้า เพราะเรา Compile ของเดิมซ้ำ ๆ 🦀',
    description: 'A practical guide to compiler caching, from local Rust builds to CI, with the trade-offs behind each cache hit.',
    href: '/blog/sccache-rust-build-cache/',
    hrefEn: '/blog/sccache-rust-build-cache/en/',
    cover: '/blog/figures/sccache-cover.svg',
    coverAlt: 'Rust compilation requests passing through a shared compiler cache',
    coverLabel: 'RUST → SCCACHE',
    tags: ['Rust', 'sccache', 'CI'],
  },
  {
    number: '001',
    category: 'RUST / PRODUCTION ML',
    date: '23 OCT 2026',
    language: 'TH / EN',
    title: 'จาก Go สู่ Rust: เมื่อ ML Prediction Service ต้องเร็วขึ้นอีกครั้ง และใช้ CPU น้อยลง 5.4 เท่า 🦀',
    description: 'The story behind rewriting a production ML prediction service in Rust: from CPU and memory constraints to Arrow, actor-based execution, and measurable results.',
    href: '/blog/riir-rust-prediction-service/',
    hrefEn: '/blog/riir-rust-prediction-service/en/',
    cover: '/blog/figures/riir-cover.svg',
    coverAlt: 'Illustration of migrating an ML prediction service from Go to Rust',
    coverLabel: 'RIIR → RUST',
    tags: ['Rust', 'ML inference', 'Performance'],
  },
];
