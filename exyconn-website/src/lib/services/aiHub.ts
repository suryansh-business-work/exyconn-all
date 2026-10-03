import type { InnerAction } from "../../components/inner/types";
import { aiServiceCategories, servicesInCategory } from "./aiServices";

/** Content of the AI hub (/ai) — the copy the page already carried, grouped per the blueprint. */
export const aiHubMeta = {
  title: "AI Platform | Agentic AI, LLMs & Automation | Exyconn",
  description:
    "Deploy production-ready AI solutions with Exyconn's AI Platform. Agentic AI agents, custom LLM training, workflow automation, and MCP server infrastructure for enterprise scale.",
  keywords:
    "AI platform, agentic AI, LLM training, AI automation, workflow AI, MCP server, enterprise AI, Exyconn",
  image:
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
};

export const aiHubHero: {
  title: string;
  lede: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "AI that works from day one",
  lede: "Deploy autonomous agents, train custom models and orchestrate intelligent workflows — production-ready and enterprise-secure.",
  primary: { label: "Deploy your first agent", href: "/contact" },
  secondary: { label: "Order pre-built agents", href: "/order-agents" },
};

export const aiHubStats = [
  { value: "10x", label: "Faster deployment" },
  { value: "95%", label: "Accuracy rate" },
  { value: "50+", label: "Pre-built agents" },
  { value: "50+", label: "Integrations" },
];

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

/** Platform promises the page already made. */
export const aiHubPromises = [
  { title: "10x faster", text: "Pre-built components mean you ship in weeks, not months." },
  {
    title: "Enterprise secure",
    text: "SOC 2 compliant with end-to-end encryption and audit logs.",
  },
  { title: "Infinite scale", text: "Auto-scaling infrastructure handles any workload seamlessly." },
  {
    title: "50+ integrations",
    text: "Connect with your existing tools and data sources instantly.",
  },
];

const TRUST_CATEGORY = "trust-security";

/** The governance band: the trust & security services from the AI catalogue. */
export const governance = {
  category: aiServiceCategories.find((category) => category.slug === TRUST_CATEGORY),
  services: servicesInCategory(TRUST_CATEGORY),
};

/** The featured route out of the hub: agents that are ready to order. */
export const featuredAgents = {
  href: "/order-agents",
  title: "Order pre-built agents",
  text: "Pick from 50+ pre-built agents and have one working in your stack within days.",
  more: "Order agents",
};

export const aiHubChapters = {
  capabilities: {
    label: "Capability map",
    title: "Build, model, connect",
    lede: "Everything you need to build, deploy and scale intelligent AI systems.",
    more: "Learn more",
  },
  governance: {
    label: "Governance",
    title: "Built different, deployed safely",
    servicesTitle: "Keeping AI defensible",
    more: "See trust & security services",
  },
  explore: { label: "Explore", title: "Agents ready to order, and the full catalogue" },
};

export const aiHubCta: {
  title: string;
  text: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Ready to deploy AI?",
  text: "Get your first AI agent running in production within days — not months.",
  primary: { label: "Get a quote", href: "/get-a-quote" },
  secondary: { label: "Talk to an expert", href: "/contact" },
};
