/**
 * The AI capability map (Build / Models / Connect). The /ai page's own copy is in the CMS;
 * this stays because the About page summarises each capability from it (lib/company/about.ts).
 */
export interface Capability {
  title: string;
  text: string;
  href: string;
}

export interface CapabilityGroup {
  id: string;
  label: string;
  title: string;
  cards: readonly Capability[];
}

/** The capability map: Build / Models / Connect. */
export const capabilityGroups: readonly CapabilityGroup[] = [
  {
    id: "build",
    label: "Build",
    title: "Agents and automation",
    cards: [
      {
        title: "Agentic AI",
        text: "Autonomous agents that perceive, decide and act to achieve business goals, around the clock.",
        href: "/ai/agentic",
      },
      {
        title: "Bot creation",
        text: "Conversational and workflow bots for customer support, lead qualification and task automation.",
        href: "/ai/bot-creation",
      },
      {
        title: "AI workflows",
        text: "Automate complex multi-step business processes with intelligent, adaptive workflows.",
        href: "/ai/workflows",
      },
    ],
  },
  {
    id: "models",
    label: "Models",
    title: "Language and custom models",
    cards: [
      {
        title: "LLM solutions",
        text: "Large language models for text generation, analysis, translation and knowledge retrieval.",
        href: "/ai/llms",
      },
      {
        title: "Ready-to-use models",
        text: "Proven models for NLP, vision, analytics and automation — chat, classification, extraction.",
        href: "/ai/models",
      },
      {
        title: "Custom training",
        text: "Train and fine-tune models on your proprietary data for domain-specific accuracy.",
        href: "/ai/custom-model-training",
      },
    ],
  },
  {
    id: "connect",
    label: "Connect",
    title: "Context and infrastructure",
    cards: [
      {
        title: "MCP server",
        text: "Deploy and manage AI pipelines on our Model Context Protocol infrastructure at enterprise scale.",
        href: "/ai/mcp-server",
      },
    ],
  },
];
