import { defineDetailPage } from "../schema";

/** The systems MCP Server connects to — one port on the stage's hub each. */
const CONNECTIONS = ["APIs", "Databases", "CRMs", "ERPs", "Cloud services", "Third-party tools"];
/** MCP server — content for /[market]/ai/mcp-server. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "ai",
  slug: "mcp-server",
  name: "MCP server",
  meta: {
    title: "MCP Server | Model Context Protocol | Exyconn",
    description:
      "Explore Exyconn's MCP Server: a Model Context Protocol platform for orchestrating AI agents, managing multi-channel workflows, and automating business processes with context-aware intelligence.",
    keywords:
      "MCP server, Model Context Protocol, AI orchestration, workflow automation, context-aware AI, Exyconn",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Context-aware orchestration for AI agents",
    tagline: "Context. Orchestrate. Automate.",
    lede: "Leverage Exyconn's MCP Server to orchestrate AI agents and automate business processes using Model Context Protocol. Achieve seamless, context-aware automation across channels and systems.",
    action: {
      label: "Request a demo",
      href: "/contact",
    },
  },
  intro: {
    title: "What is MCP server?",
    icon: "server",
    term: "MCP Server",
    definition:
      "(Model Context Protocol Server) is a platform that manages and orchestrates AI agents and business workflows using context-aware protocols. It enables dynamic, multi-step automation by maintaining context across models, channels, and user interactions.",
  },
  benefits: {
    title: "Why use Model Context Protocol?",
    items: [
      {
        icon: "network-wired",
        text: "Maintains context across multi-step, multi-agent workflows.",
      },
      {
        icon: "robot",
        text: "Orchestrates AI agents and models for complex business logic.",
      },
      {
        icon: "plug",
        text: "Integrates with APIs, databases, and third-party systems.",
      },
      {
        icon: "chart-line",
        text: "Enables real-time monitoring and optimization of process flows.",
      },
      {
        icon: "shield-halved",
        text: "Ensures secure, auditable, and compliant automation.",
      },
    ],
  },
  offerings: {
    title: "How MCP server helps your business",
    items: [
      {
        icon: "diagram-project",
        title: "Context-aware orchestration",
        text: "Keeps track of user, process, and data context across all steps and agents.",
      },
      {
        icon: "bolt",
        title: "AI agent management",
        text: "Deploy, coordinate, and monitor multiple AI models and agents in real time.",
      },
      {
        icon: "plug-circle-check",
        title: "Seamless integration",
        text: "Connects with your existing tools, APIs, and cloud services for unified automation.",
      },
    ],
  },
  architecture: {
    title: "Model Context Protocol, layer by layer",
    layers: [
      {
        label: "Context",
        nodes: ["User", "Process", "Data"],
      },
      {
        label: "Orchestration",
        nodes: ["MCP Server"],
      },
      {
        label: "Agents & models",
        nodes: ["AI agents", "AI models"],
      },
      {
        label: "Connections",
        nodes: CONNECTIONS,
      },
    ],
  },
  demo: {
    kind: "trace",
    title: "mcp-server · run",
    caption:
      "One MCP Server run: context kept, agents coordinated, systems connected and every step logged.",
    steps: [
      {
        label: "Keep context",
        detail: "User, process and data context across all steps and agents",
      },
      {
        label: "Coordinate",
        detail: "Multiple AI agents and models, passing context and data between them",
      },
      {
        label: "Connect",
        detail: "CRMs, ERPs, databases and cloud services",
      },
      {
        label: "Audit",
        detail: "Access controls and audit logs",
      },
    ],
  },
  faqs: [
    {
      question: "What is the Model Context Protocol (MCP)?",
      answer:
        "MCP is a protocol for managing and maintaining context across AI models, agents, and workflows, enabling seamless automation and intelligent orchestration.",
    },
    {
      question: "How does MCP Server orchestrate AI agents?",
      answer:
        "MCP Server coordinates multiple AI agents and models, passing context and data between them to automate complex business processes.",
    },
    {
      question: "Can MCP Server integrate with my existing systems?",
      answer:
        "Yes, MCP Server provides APIs and connectors for integration with CRMs, ERPs, databases, and cloud services.",
    },
    {
      question: "Is MCP Server secure and compliant?",
      answer:
        "Yes, it includes robust security, access controls, and audit logs to help meet compliance requirements.",
    },
    {
      question: "How do I get started with MCP Server?",
      answer:
        "Begin by mapping your business processes, identifying integration points, and working with Exyconn to design and deploy your MCP Server solution.",
    },
  ],
  logos: {
    label: "Our business tools",
    keys: ["claude", "openai", "gemini"],
  },
  scene: { shapes: ["hubSpokes"], data: { hubSpokes: { ports: CONNECTIONS.length } } },
});
