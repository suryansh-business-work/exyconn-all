import { defineDetailPage } from "../schema";

/** Large language models — content for /[market]/ai/llms. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "ai",
  slug: "llms",
  name: "Large language models",
  meta: {
    title: "Large Language Models (LLMs) | AI Text | Exyconn",
    description:
      "Unlock the power of Large Language Models (LLMs) for your business. Exyconn delivers advanced AI text generation, summarization, chat, and automation solutions using state-of-the-art LLMs.",
    keywords:
      "LLM, Large Language Model, AI text, GPT, Claude, Gemini, text generation, summarization, Exyconn",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Large language models, securely and at scale",
    tagline: "AI Text Intelligence for Business",
    lede: "Transform your business with advanced Large Language Models. Exyconn helps you leverage LLMs for chatbots, content generation, summarization, automation, and more—securely and at scale.",
    action: {
      label: "Explore LLM solutions",
      href: "/contact",
    },
  },
  intro: {
    title: "What are large language models?",
    icon: "brain",
    term: "Large Language Models (LLMs)",
    definition:
      "are advanced AI models trained on massive text datasets. They can understand, generate, summarize, and interact in natural language—powering chatbots, content automation, search, and more.",
  },
  benefits: {
    title: "Why use LLMs for your business?",
    items: [
      {
        icon: "comments",
        text: "Enable natural, human-like chatbots and virtual assistants.",
      },
      {
        icon: "file-lines",
        text: "Automate content creation, summarization, and translation.",
      },
      {
        icon: "magnifying-glass",
        text: "Enhance search, knowledge management, and Q&A systems.",
      },
      {
        icon: "bolt",
        text: "Accelerate document processing and business automation.",
      },
      {
        icon: "lock",
        text: "Deploy securely—on cloud, private, or on-premises infrastructure.",
      },
    ],
  },
  offerings: {
    title: "LLM use cases",
    items: [
      {
        icon: "robot",
        title: "Conversational AI",
        text: "Build advanced chatbots, virtual agents, and support assistants.",
      },
      {
        icon: "file-pen",
        title: "Content automation",
        text: "Generate, summarize, and translate text for marketing, support, and more.",
      },
      {
        icon: "database",
        title: "Knowledge & search",
        text: "Power semantic search, document Q&A, and knowledge management.",
      },
    ],
  },
  tabs: {
    title: "Major large language models (llms)",
    items: [
      {
        label: "OpenAI (ChatGPT)",
        summary: "Popular, versatile, and widely adopted",
        text: "OpenAI's ChatGPT is a leading LLM known for its conversational abilities, content generation, summarization, and code assistance. It powers a wide range of business and consumer applications, offering robust APIs and continuous improvements.",
        points: [
          "Excellent at natural language understanding and generation",
          "Supports plugins, fine-tuning, and API integration",
          "Used for chatbots, automation, search, and more",
        ],
        logo: "openai",
      },
      {
        label: "Gemini",
        summary: "Google's advanced multimodal LLM",
        text: "Gemini is Google's next-generation LLM, designed for text, image, and code tasks. It integrates deeply with Google Cloud and Workspace, enabling advanced AI features for enterprise and productivity solutions.",
        points: [
          "Handles text, images, and code in a unified model",
          "Integrates with Google products and APIs",
          "Ideal for business automation and productivity",
        ],
        logo: "gemini",
      },
      {
        label: "Claude",
        summary: "Anthropic's safe and ethical LLM",
        text: "Claude by Anthropic focuses on safety, transparency, and ethical AI. It is used for enterprise chat, summarization, and automation, with a strong emphasis on responsible AI deployment.",
        points: [
          "Prioritizes safety and transparency",
          "Great for enterprise chat and document workflows",
          "Flexible deployment and compliance options",
        ],
        logo: "claude",
      },
    ],
  },
  architecture: {
    title: "Where LLMs sit in your business",
    layers: [
      {
        label: "Use cases",
        nodes: ["Chatbots", "Content", "Search & Q&A"],
      },
      {
        label: "Models",
        nodes: ["OpenAI GPT", "Google Gemini", "Anthropic Claude", "Open-source"],
      },
      {
        label: "Adaptation",
        nodes: ["Fine-tuning", "Prompt engineering"],
      },
      {
        label: "Deployment",
        nodes: ["Cloud", "Private cloud", "On-premises"],
      },
    ],
  },
  demo: {
    kind: "chat",
    title: "llm · assistant",
    caption: "Someone asks which LLMs Exyconn supports and the assistant answers.",
    messages: [
      {
        from: "user",
        text: "What LLMs does Exyconn support?",
      },
      {
        from: "agent",
        text: "We support leading LLMs including OpenAI GPT, Google Gemini, Anthropic Claude, and can deploy open-source models as needed.",
      },
    ],
  },
  faqs: [
    {
      question: "What LLMs does Exyconn support?",
      answer:
        "We support leading LLMs including OpenAI GPT, Google Gemini, Anthropic Claude, and can deploy open-source models as needed.",
    },
    {
      question: "Can LLMs be fine-tuned for my business?",
      answer:
        "Yes, we offer custom fine-tuning and prompt engineering to adapt LLMs for your industry, data, and workflows.",
    },
    {
      question: "Is my data secure when using LLMs?",
      answer:
        "We offer secure deployment options, including private cloud and on-premises, to keep your data safe and compliant.",
    },
    {
      question: "What are common LLM use cases?",
      answer:
        "LLMs are used for chatbots, content generation, summarization, translation, semantic search, document Q&A, and more.",
    },
    {
      question: "How do I get started with LLMs for my business?",
      answer:
        "Contact Exyconn for a free consultation. We’ll assess your needs and recommend the best LLM solution for your goals.",
    },
  ],
  logos: {
    label: "Our business tools",
    keys: ["claude", "openai", "gemini"],
  },
  scene: { shapes: ["tokenStream"] },
});
