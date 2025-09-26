const repoBasePath = process.env.NEXT_PUBLIC_BASE_PATH
  ? `/${process.env.NEXT_PUBLIC_BASE_PATH}`
  : "";

const withBasePath = (path: `/${string}`) => `${repoBasePath}${path}`;

export const data = {
  tags: [
    "Rust",
    "Python",
    "TypeScript",
    "LLMs",
    "Graph RAG",
    "Databricks",
    "Kafka",
    "Delta Lake",
    "Kubernetes",
    "Next.js",
  ],
  quickLinks: [
    { label: "GitHub", href: "https://github.com/korntewin" },
    { label: "Medium", href: "https://korntewin-b.medium.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/korntewin" },
  ],
  highlights: [
    {
      title: "Crypto Trading Bot — Rust",
      description:
        "Automated trading on Binance; low-latency Rust stack, risk controls.",
      href: "https://medium.com/thinking-machines-thailand/crypto-trading-bots-with-rust-db754daf474e",
      image: withBasePath("/highlights/rust-trading.svg"),
    },
    {
      title: "Python vs Rust ML inference comparison",
      description:
        "Automated trading on Binance; low-latency Rust stack, risk controls.",
      href: "https://github.com/korntewin/python-vs-rust-DL-inference",
      image: withBasePath("/highlights/kafka-delta.svg"),
    },
    {
      title: "Real-time Object Detection — Rust + WASM",
      description: "YOLO in the browser with WebAssembly & pure Rust pipeline.",
      href: "https://github.com/korntewin/yolo-wasm",
      image: withBasePath("/highlights/rust-wasm.svg"),
    },
    {
      title: "Kafka → Delta Lake (Liquid Clustering)",
      description:
        "Real-time PySpark streaming into Delta, optimized for analytics.",
      href: "https://medium.com/@korntewin-b/delta-table-liquid-clustering-for-real-time-event-streaming-b6f48d111aa6",
      image: withBasePath("/highlights/kafka-delta.svg"),
    },
  ],
  expertise: [
    "Backend & APIs (Rust/Actix/Axum, Python/FastAPI)",
    "Frontend (Next.js, React, TailwindCSS, Zustand)",
    "LLM Applications (LangChain/LangGraph, RAG, Agentic patterns)",
    "Data/ML Platforms (Databricks, PySpark, Kafka, Delta Lake)",
    "Cloud & DevOps (AWS/GCP/Azure, Kubernetes, Terraform, GitHub Actions)",
  ],
  certifications: [
    {
      "cert": "AWS Certified Solutions Architect – Professional",
      "href": "https://www.credly.com/badges/039ba124-fcf5-4fbf-b4b5-de7817f1d675/linked_in_profile",
    },
    {
      "cert": "GCP Professional Cloud Architect",
      "href": "https://google.accredible.com/0bc42dee-895c-4e69-a924-8640cdfe01fd",
    },
    {
      "cert": "GCP Professional Data Engineer",
      "href": "https://google.accredible.com/0bc42dee-895c-4e69-a924-8640cdfe01fd",
    },
    {
      "cert": "Certified Kubernetes Application Developer (CKAD)",
      "href": "https://www.credly.com/badges/7a9f3c8e-e867-4263-ba8a-533554a78ba0/linked_in?t=t03hsy",
    },
  ],
  projects: [
    {
      title: "Python vs Rust ML inference comparison",
      description:
        "Benchmarking Python (PyTorch) vs Rust (Candle) for ML inference.",
      tags: ["Rust", "PyTorch", "Candle"],
      links: [{ label: "Github Repo", href: "https://github.com/korntewin/python-vs-rust-DL-inference" }],
    },
    {
      title: "Kafka → Delta Streaming",
      description:
        "High-throughput streaming into Delta Lake with Liquid Clustering.",
      tags: ["Kafka", "PySpark", "Delta Lake"],
      links: [{ label: "Medium Blog", href: "https://medium.com/@korntewin-b/delta-table-liquid-clustering-for-real-time-event-streaming-b6f48d111aa6" }],
    },
    {
      title: "Rust Crypto Trading Bot",
      description:
        "Event-driven Rust bot with risk management and exchange adapters.",
      tags: ["Rust", "Binance API"],
      links: [{ label: "Medium Blog", href: "https://medium.com/thinking-machines-thailand/crypto-trading-bots-with-rust-db754daf474e" }],
    },
    {
      title: "Real-time Object Detection (Rust + WASM)",
      description:
        "YOLO pipeline compiled to WASM for on-device inference in browser.",
      tags: ["Rust", "WASM", "YOLO"],
      links: [{ label: "Demo", href: "https://yolo-yew.crypto-bot-gcp.trade/" }],
    },
    {
      title: "Full Stack Real-time Chatbot powered by LLMs",
      description:
        "Chatbot leveraging LLMs for dynamic conversations and context awareness.",
      tags: ["Python", "Next.js", "SQLAlchemy", "Alembic"],
      links: [{ label: "Github Repo", href: "https://github.com/korntewin/fullstack-realtime-chatbot" }],
    },
  ],
  timeline: [
    {
      role: "Software Engineer (ML)",
      company: "Zilo (UK)",
      period: "2025 — Present",
      points: [
        "Shipped LLM coding platform to production (Railway + AWS).",
        "Built Graph RAG & agentic workflows (Neo4j, Agno, Azure AI Search).",
        "Scaled long-running tasks with RabbitMQ; CI/CD via GitHub Actions & ArgoCD.",
      ],
      stack: ["TypeScript", "Python", "Java", "Neo4j", "MongoDB", "Qdrant"],
    },
    {
      role: "Software Engineer (Big Data & ML)",
      company: "Siam Commercial Bank",
      period: "2024 — 2025",
      points: [
        "Lead in deployment for Analytic Decision Engine model to serve downstream SCB system",
        "Deployed analytics engine for loan decisions to process TB of bank data (AKS, Databricks, Cosmos DB).",
        "Maintained terabyte-scale Databricks pipelines; set up CI/CD with Jenkins & ArgoCD.",
        "Refactored feature store with hexagonal architecture & style guides.",
      ],
      stack: ["AKS", "Databricks", "FastAPI", "MongoDB", "MySQL"],
    },
    {
      role: "Software Engineer (LLMs/ML)",
      company: "Thinking Machines",
      period: "2022 — 2024",
      points: [
        "Lead in deployment and development for client project - Document AI platform",
        "Delivered NLP systems across hybrid on-prem/AWS.",
        "Built full-stack chatbot on Azure; infra with Terraform/Helm/FluxCD.",
        "Deployed production ML (TF-IDF + GBMs + RAG) with automated testing.",
      ],
      stack: ["AWS", "Azure", "Terraform", "Helm", "FluxCD", "Python"],
    },
    {
      role: "Software Engineer (Big Data & ML)",
      company: "KASIKORN (KBank)",
      period: "2021 — 2022",
      points: [
        "Lead in deployment and development for Bank Statement Analyzer engine to serve downstream KBANK system",
        "Monthly PySpark batch over multi-TB bank statements (20M+ accounts).",
        "Online model via REST on Livy/Cloudera for real-time predictions.",
      ],
      stack: ["PySpark", "Cloudera", "Hadoop"],
    },
  ],
} as const;
