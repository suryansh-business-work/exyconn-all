import { aiServiceCategories, aiServices } from "../services/aiServices";

/**
 * "What We Offer" and the AI service catalogue header — the copy of the former home
 * sections OurSolutions and AiServicesOverview. The services themselves come straight from
 * the shared catalogue in lib/services.
 */
export const solutionsHeader = {
  badge: "What We Offer",
  title: "Solutions for",
  accent: "Modern Business",
  lead: "From idea to MVP in one week. We handle the infrastructure, you focus on building value.",
} as const;

export interface Pillar {
  href: string;
  icon: string;
  title: string;
  text: string;
  cta: string;
  flag?: string;
  points: readonly string[];
}

export const pillars: readonly Pillar[] = [
  {
    href: "/ai-services",
    icon: "fa-bolt",
    flag: "FEATURED",
    title: "AI Services",
    text: `${aiServices.length} service areas across agents, automation, vertical AI products and the platform underneath them — delivered on the systems you already run.`,
    points: aiServiceCategories.slice(0, 4).map((category) => category.title),
    cta: "Learn More",
  },
  {
    href: "/ai",
    icon: "fa-microchip",
    title: "AI Platform",
    text: "Deploy production-ready AI agents, workflows, and LLM-powered applications with enterprise security.",
    points: [
      "Agentic AI & Autonomous Agents",
      "Custom LLM Training",
      "AI Workflow Orchestration",
      "MCP Server Infrastructure",
    ],
    cta: "Explore AI Platform",
  },
];

export const quickSolutions: readonly {
  href: string;
  icon: string;
  title: string;
  text: string;
}[] = [
  { href: "/ai/agentic", icon: "fa-robot", title: "Agentic AI", text: "Autonomous agents" },
  {
    href: "/ai/workflows",
    icon: "fa-diagram-project",
    title: "Workflows",
    text: "Process automation",
  },
  {
    href: "/services/digital-consulting",
    icon: "fa-lightbulb",
    title: "Consulting",
    text: "Digital strategy",
  },
  {
    href: "/services/data-analytics",
    icon: "fa-chart-line",
    title: "Analytics",
    text: "Data insights",
  },
];

export const catalogueHeader = {
  badge: "AI Services",
  title: `${aiServices.length} Ways We Put`,
  accent: "AI to Work",
  lead: "Agents that carry out real work, vertical AI products for a single industry, and the platform layer underneath — built on the systems you already run.",
  cta: { label: "Browse all AI services", href: "/ai-services" },
} as const;
