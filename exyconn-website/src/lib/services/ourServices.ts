import type { InnerAction } from "../../components/inner/types";

/** Content of /our-services — the copy the page already carried, as data. */
export const ourServicesMeta = {
  title: "AI & SaaS Services | Enterprise Solutions | Exyconn",
  description:
    "Transform your enterprise with Exyconn's AI automation, agentic AI, and SaaS solutions. From strategy to deployment—we deliver production-ready intelligent systems.",
  keywords:
    "AI services, enterprise AI, SaaS solutions, AI automation, agentic AI, business transformation, Exyconn",
  image:
    "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&w=1200&q=80",
};

export const ourServicesHero: {
  title: string;
  lede: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Services that transform business",
  lede: "From AI strategy to SaaS deployment, we provide end-to-end services that turn intelligent automation into competitive advantage.",
  primary: { label: "Schedule consultation", href: "/contact" },
  secondary: { label: "View case studies", href: "/case-studies" },
};

export interface OurPillar {
  title: string;
  text: string;
  items: readonly string[];
  link: InnerAction;
}

export const ourPillars: readonly OurPillar[] = [
  {
    title: "AI platform services",
    text: "Deploy production-ready AI systems that automate, analyze and accelerate.",
    items: [
      "Agentic AI & autonomous agents",
      "Custom LLM training & fine-tuning",
      "AI workflow automation",
      "Intelligent bot development",
      "MCP server architecture",
    ],
    link: { label: "Explore the AI platform", href: "/ai" },
  },
  {
    title: "SaaS development",
    text: "Build and scale cloud-native software with enterprise security.",
    items: [
      "Custom SaaS platform development",
      "Cloud architecture & migration",
      "API & integration services",
      "Multi-tenant architecture",
      "DevOps & CI/CD pipelines",
    ],
    link: { label: "Explore SaaS development", href: "/services/software-as-a-service" },
  },
  {
    title: "Enterprise consulting",
    text: "Strategic guidance to maximize your AI and digital investments.",
    items: [
      "AI strategy & roadmapping",
      "Digital transformation planning",
      "Data analytics & BI",
      "Process optimization",
      "Change management",
    ],
    link: { label: "Explore digital consulting", href: "/services/digital-consulting" },
  },
];

export interface PortfolioGroup {
  title: string;
  services: readonly { title: string; text: string; href: string }[];
}

export const portfolioGroups: readonly PortfolioGroup[] = [
  {
    title: "Artificial intelligence",
    services: [
      {
        title: "Agentic AI",
        text: "Autonomous agents for business automation and decision-making.",
        href: "/ai/agentic",
      },
      {
        title: "Bot creation",
        text: "Conversational and workflow bots for support and engagement.",
        href: "/ai/bot-creation",
      },
      {
        title: "AI workflows",
        text: "Automate complex business processes with AI-driven workflows.",
        href: "/ai/workflows",
      },
      {
        title: "LLM solutions",
        text: "Large language models for advanced text and data solutions.",
        href: "/ai/llms",
      },
      {
        title: "Custom AI training",
        text: "Tailored AI models trained on your unique business data.",
        href: "/ai/custom-model-training",
      },
    ],
  },
  {
    title: "Software, data & support",
    services: [
      {
        title: "SaaS development",
        text: "Custom cloud software with scalability and security built in.",
        href: "/services/software-as-a-service",
      },
      {
        title: "Data analytics",
        text: "Transform data into actionable insights with AI-powered analytics.",
        href: "/services/data-analytics",
      },
      {
        title: "Integration services",
        text: "Connect your systems with seamless API and data integration.",
        href: "/services/automation-integration",
      },
      {
        title: "Managed support",
        text: "Round-the-clock monitoring, maintenance and optimization.",
        href: "/services/maintenance",
      },
    ],
  },
];

export const ourServicesChapters = {
  pillars: {
    label: "Pillars",
    title: "Three interconnected pillars",
    lede: "Three pillars that power your digital transformation journey.",
  },
  portfolio: {
    label: "Portfolio",
    title: "The complete service portfolio",
    lede: "Specialised services across AI, SaaS and enterprise technology.",
  },
  explore: { label: "Explore", title: "More ways to see what we do" },
};

export const ourServicesCta: {
  title: string;
  text: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Ready to transform your business?",
  text: "Let's discuss how AI and SaaS can accelerate your growth and give you a competitive edge.",
  primary: { label: "Get a quote", href: "/get-a-quote" },
  secondary: { label: "Contact us", href: "/contact" },
};
