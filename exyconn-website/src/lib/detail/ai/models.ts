import { defineDetailPage } from "../schema";

/** Ready-to-use AI models — content for /[market]/ai/models. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "ai",
  slug: "models",
  name: "Ready-to-use AI models",
  meta: {
    title: "Ready-to-Use AI Models | NLP, Vision, and More | Exyconn",
    description:
      "Explore Exyconn's library of ready-to-use AI models for NLP, vision, analytics, and automation. Deploy proven models instantly for chat, classification, extraction, and more.",
    keywords:
      "AI models, ready-to-use AI, NLP models, vision models, analytics, automation, Exyconn",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Production-ready AI models, no training required",
    tagline: "Deploy Proven AI Instantly",
    lede: "Accelerate your projects with Exyconn’s library of pre-trained, production-ready AI models. From NLP and vision to analytics and automation, our models are ready to power your business use cases—no training required.",
    action: {
      label: "See all models",
      href: "/contact",
    },
  },
  intro: {
    title: "What are ready-to-use AI models?",
    icon: "cubes",
    term: "Ready-to-use AI models",
    definition:
      "are pre-trained, production-grade models for common business tasks—such as text classification, sentiment analysis, document extraction, image recognition, and more. Instantly deploy these models via API or integrate them into your workflows.",
  },
  benefits: {
    title: "Why use pre-built AI models?",
    items: [
      {
        icon: "rocket",
        text: "Instant deployment—no training or data science required.",
      },
      {
        icon: "gears",
        text: "Covers a wide range of business use cases: NLP, vision, analytics, and more.",
      },
      {
        icon: "plug",
        text: "Easy API integration with your apps, CRMs, and workflows.",
      },
      {
        icon: "shield-halved",
        text: "Enterprise-grade security, reliability, and support.",
      },
      {
        icon: "chart-line",
        text: "Scalable for projects of any size—pay as you grow.",
      },
    ],
  },
  offerings: {
    title: "Popular model categories",
    items: [
      {
        icon: "language",
        title: "NLP & text",
        text: "Text classification, sentiment analysis, entity extraction, summarization, translation, and more.",
      },
      {
        icon: "image",
        title: "Vision & image",
        text: "Image classification, object detection, OCR, face recognition, and visual search.",
      },
      {
        icon: "chart-bar",
        title: "Analytics & automation",
        text: "Forecasting, anomaly detection, document processing, and workflow automation.",
      },
    ],
  },
  architecture: {
    title: "Ready-to-use models in your stack",
    layers: [
      {
        label: "Models",
        nodes: ["NLP & text", "Vision & image", "Analytics"],
      },
      {
        label: "Access",
        nodes: ["Secure API"],
      },
      {
        label: "Your systems",
        nodes: ["Apps", "CRMs", "Workflows"],
      },
    ],
  },
  demo: {
    kind: "trace",
    title: "models · workflow",
    caption: "Ready-to-use models chained in one workflow and reached over a secure API.",
    steps: [
      {
        label: "Extract",
        detail: "Document extraction and OCR",
      },
      {
        label: "Classify",
        detail: "Text classification and sentiment analysis",
      },
      {
        label: "Chain",
        detail: "Models combined in an automated workflow",
      },
      {
        label: "Deploy",
        detail: "Via secure API, with integration guides",
      },
    ],
  },
  faqs: [
    {
      question: "What types of ready-to-use models does Exyconn offer?",
      answer:
        "We offer models for NLP (text classification, sentiment, extraction), vision (image classification, OCR), analytics, and more. Contact us for the full catalog.",
    },
    {
      question: "How do I integrate these models into my app?",
      answer:
        "All models are available via secure API. We provide integration guides and support for your stack.",
    },
    {
      question: "Can I combine multiple models in a workflow?",
      answer:
        "Yes, you can chain models together or use them as part of automated workflows and business processes.",
    },
    {
      question: "Are these models secure and compliant?",
      answer:
        "Yes, all models are deployed with enterprise security, privacy, and compliance in mind.",
    },
    {
      question: "How do I get started with ready-to-use models?",
      answer:
        "Contact Exyconn for a free consultation. We’ll help you select and deploy the best models for your needs.",
    },
  ],
  logos: {
    label: "Our business tools",
    keys: ["claude", "openai", "gemini"],
  },
  scene: { shapes: ["layers"] },
});
