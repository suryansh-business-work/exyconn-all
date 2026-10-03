import { defineDetailPage } from "../schema";

/** Custom model training — content for /[market]/ai/custom-model-training. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "ai",
  slug: "custom-model-training",
  name: "Custom model training",
  meta: {
    title: "Custom AI Model Training | Exyconn",
    description:
      "Unlock the power of AI tailored to your business. Exyconn offers custom model training services—fine-tune LLMs, vision, and predictive models on your data for maximum impact.",
    keywords: "custom AI model training, fine-tuning, LLM, machine learning, business AI, Exyconn",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "AI models trained on your own data",
    tagline: "Tailored Intelligence. Real Results.",
    lede: "Empower your business with AI models trained on your unique data. Exyconn helps you fine-tune large language models, vision models, and predictive systems for your specific industry, workflow, and goals.",
    action: {
      label: "Request a consultation",
      href: "/contact",
    },
  },
  intro: {
    title: "What is custom model training?",
    icon: "brain",
    term: "Custom model training",
    definition:
      "is the process of adapting and fine-tuning AI models—such as LLMs, vision, or predictive models—on your proprietary data. This delivers higher accuracy, relevance, and business value compared to generic, off-the-shelf models.",
  },
  benefits: {
    title: "Why choose custom model training?",
    items: [
      {
        icon: "database",
        text: "Leverages your unique business data for better results.",
      },
      {
        icon: "bullseye",
        text: "Improves accuracy and relevance for your use case.",
      },
      {
        icon: "lock",
        text: "Keeps sensitive data secure and models private.",
      },
      {
        icon: "chart-line",
        text: "Drives measurable ROI with tailored AI solutions.",
      },
      {
        icon: "gears",
        text: "Supports a wide range of tasks: NLP, vision, prediction, and more.",
      },
    ],
  },
  offerings: {
    title: "How custom model training works",
    items: [
      {
        icon: "upload",
        title: "Data preparation",
        text: "We help you collect, clean, and structure your business data for training.",
      },
      {
        icon: "brain",
        title: "Model fine-tuning",
        text: "Our experts fine-tune state-of-the-art models (LLMs, vision, etc.) on your data.",
      },
      {
        icon: "rocket",
        title: "Deployment & support",
        text: "Deploy your custom model securely—on cloud or on-premises—with ongoing support.",
      },
    ],
  },
  architecture: {
    title: "From your data to a deployed model",
    layers: [
      {
        label: "Your data",
        nodes: ["Collect", "Clean", "Structure"],
      },
      {
        label: "Fine-tuning",
        nodes: ["LLMs", "Vision", "Time-series"],
      },
      {
        label: "Training on",
        nodes: ["On-premises", "Private cloud", "Secure cloud"],
      },
      {
        label: "Deployment",
        nodes: ["Cloud", "On-premises", "Ongoing support"],
      },
    ],
  },
  demo: {
    kind: "trace",
    title: "training plan",
    caption:
      "A custom training plan: the data needed, the models tuned, where training runs and how long it takes.",
    steps: [
      {
        label: "Data",
        detail: "A few thousand quality examples",
      },
      {
        label: "Models",
        detail: "LLMs, computer vision models, time-series predictors",
      },
      {
        label: "Training",
        detail: "On-premises, private cloud or secure cloud",
      },
      {
        label: "Timeline",
        detail: "A few weeks to a few months",
      },
    ],
  },
  faqs: [
    {
      question: "What types of models can Exyconn fine-tune?",
      answer:
        "We can fine-tune large language models (LLMs), computer vision models, time-series predictors, and more—tailored to your business needs.",
    },
    {
      question: "Do I need a lot of data for custom training?",
      answer:
        "More data helps, but we can often achieve strong results with a few thousand quality examples. We’ll advise on data requirements for your use case.",
    },
    {
      question: "Is my data secure during training?",
      answer:
        "Yes, your data remains private and secure. We offer on-premises, private cloud, and secure cloud training options.",
    },
    {
      question: "How long does custom model training take?",
      answer:
        "Typical projects take from a few weeks to a few months, depending on data size, complexity, and deployment needs.",
    },
    {
      question: "How do I get started with custom model training?",
      answer:
        "Contact Exyconn for a free consultation. We’ll assess your needs, data, and goals, then propose a tailored AI training plan.",
    },
  ],
  logos: {
    label: "Our business tools",
    keys: ["claude", "openai", "gemini"],
  },
  scene: { shapes: ["converge"] },
});
