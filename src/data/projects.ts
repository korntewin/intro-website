// Single source of truth for projects. Keep newest first:
// the home page treats projects[0] as the latest and marks it NEW.
export interface Project {
  id: string;
  kind: string;
  title: string;
  description: string;
  href: string;
  image: string;
  tags: string[];
  /** Optional home-page card copy. Projects with this set can appear in the home grid. */
  feature?: {
    label: string;
    kicker: string;
    title: string;
    blurb: string;
    tags: string[];
    tone: 'rust' | 'data';
  };
}

export const projects: Project[] = [
  { id: '01', kind: 'INFERENCE / BENCHMARKS', title: 'Python vs Rust ML inference', description: 'Exploring inference performance and language trade-offs for deep learning workloads.', href: 'https://github.com/korntewin/python-vs-rust-DL-inference', image: '/visuals/benchmark.svg', tags: ['Rust', 'Python', 'ML inference'],
    feature: { label: 'INFERENCE', kicker: 'RUST × MACHINE LEARNING', title: 'Finding the fast path.', blurb: 'Exploring the engineering trade-offs of Python and Rust in deep-learning inference.', tags: ['RUST', 'INFERENCE', 'PERFORMANCE'], tone: 'rust' } },
  { id: '02', kind: 'RUST / AUTOMATION', title: 'Rust crypto trading bot', description: 'An engineering write-up about building trading bots with Rust.', href: 'https://medium.com/thinking-machines-thailand/crypto-trading-bots-with-rust-db754daf474e', image: '/visuals/rust-core.svg', tags: ['Rust', 'Systems', 'Automation'] },
  { id: '03', kind: 'RUST / WEBASSEMBLY', title: 'Real-time object detection', description: 'An experiment bringing real-time object detection to Rust and WebAssembly.', href: 'https://github.com/korntewin/yolo-wasm', image: '/visuals/benchmark.svg', tags: ['Rust', 'WASM', 'Computer vision'] },
  { id: '04', kind: 'DATA / STREAMING', title: 'Kafka → Delta Lake', description: 'A look at real-time event streaming and Delta table liquid clustering.', href: 'https://medium.com/@korntewin-b/delta-table-liquid-clustering-for-real-time-event-streaming-b6f48d111aa6', image: '/visuals/data-stream.svg', tags: ['Kafka', 'Delta Lake', 'Streaming'],
    feature: { label: 'DATA SYSTEMS', kicker: 'STREAMS × LAKEHOUSE', title: 'Data in motion.', blurb: 'Thinking about real-time event streaming, Delta tables, and systems that keep up.', tags: ['KAFKA', 'DELTA LAKE', 'STREAMING'], tone: 'data' } },
];
