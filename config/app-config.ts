/**
 * Application-wide configuration settings
 */

export const AppConfig = {
  showcases: {
    autoRotateIntervalMs: 6000, // Auto-rotate interval in milliseconds
    progressUpdateIntervalMs: 30, // Progress bar update interval in milliseconds
  },
  // Add other app-wide configuration sections as needed

  highlightedProjects: [
    {
      id: "fullstack-chatbot",
      image: "./chatbot-fullstack-logo.webp",
      title: "Fullstack Realtime Chatbot",
      summary:
        "A comprehensive chatbot application with real-time messaging capabilities. Built with a modern tech stack including Next.js, React, Python backend, and advanced AI integrations.",
      technologies: [
        "Next.js",
        "TypeScript",
        "Python",
        "SSE",
        "Typhoon API",
        "Hugging Face",
        "AutoTokenizer",
        "NextAuth",
        "Alembic",
        "LLMs",
        "Typhoon",
      ],
      link: "https://github.com/korntewin/fullstack-realtime-chatbot",
    },
    {
      id: "yolo-wasm",
      image: "./yolo-wasm-logo.png",
      title: "YOLO WASM Object Detection",
      summary:
        "A demo project for YOLO (You Only Look Once) object detection implemented with Rust and WebAssembly (WASM). The application runs purely on the client-side.",
      technologies: [
        "Rust",
        "WebAssembly",
        "JavaScript",
        "HTML",
        "CSS",
        "React",
        "YOLOv8",
        "Candle ML Framework",
        "react-webcam",
      ],
      link: "https://github.com/korntewin/yolo-wasm",
    },
    {
      id: "hybrid-search-vector-db-thai",
      image: "./vector-db-article-logo.webp",
      title:
        "Full-Text, Vector, and Hybrid Search for Thai",
      summary:
        "This article details Full-Text, Vector, and Hybrid search in vector databases, stressing Thai tokenization's vital role for Full-Text/Hybrid methods (using Inverted Indexes, BM25).",
      technologies: [
        "Vector Database",
        "Full-Text Search",
        "Vector Search",
        "Hybrid Search",
        "Azure AI Search",
        "Tokenization",
        "BM25",
        "Inverted Index",
        "HNSW",
        "LLMs",
        "RAGs",
      ],
      link: "https://medium.com/@korntewin-b/how-full-text-vector-hybrid-search-works-in-vector-database-4411f56c3f88",
    },
    {
      id: "crypto-bot-rust-architecture",
      image: "./crypto-rust-logo.webp",
      title: "Crypto Trading Bots with Rust",
      summary:
        "This article outlines a high-performance, cost-efficient crypto trading bot built with Rust. It details a Hexagonal Software Architecture for flexibility and a GCP-based system designed for low cost and security, using private networks.",
      technologies: [
        "Rust",
        "GCP (Google Cloud Platform)",
        "Hexagonal Architecture",
        "Terraform",
        "Docker",
        "Diesel",
        "Dioxus",
        "Actix-web",
        "Cloudflare Tunnel",
        "GCP IAP",
      ],
      link: "https://medium.com/thinking-machines-thailand/crypto-trading-bots-with-rust-db754daf474e",
    },
    {
      id: "thai-nlp-poc-gcp-streamlit",
      image: "./thainlp-logo.webp",
      title: "Thai NLP Project: Streamlit Webapp & GCP (POC)",
      summary:
        "This article describes a Thai NLP Proof-of-Concept project, highlighting challenges like poor PDF text quality (addressed using Google Translate) and pragmatic model selection.",
      technologies: [
        "NLP",
        "Thai Language Processing",
        "GCP (Google Cloud Platform)",
        "Cloud Run",
        "Streamlit",
        "Python",
        "Docker",
        "Google Translate",
        "Cloudflare Tunnel",
        "Machine Learning",
      ],
      link: "https://medium.com/thinking-machines-thailand/thai-nlp-project-on-streamlit-webapp-gcp-509180faf6cd",
    },
    {
      id: "hexagonal-architecture",
      image: "./hexagonal-logo.webp",
      title: "Software Architecture: Hexagonal",
      summary:
        "An overview of Hexagonal Architecture, also known as Ports & Adapters. It aims to enhance codebase maintainability and scalability by decoupling core logic from infrastructure, improving testability and flexibility.",
      technologies: ["Rust", "SQL", "Hexagonal Architecture", "Software Architecture"],
      link: "https://medium.com/thinking-machines-thailand/software-architecture-hexagonal-97ed7fd68a85",
    },
  ],
};
