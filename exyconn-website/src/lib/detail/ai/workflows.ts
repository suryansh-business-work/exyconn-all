import { defineDetailPage } from "../schema";

/** AI workflows — content for /[market]/ai/workflows. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "ai",
  slug: "workflows",
  name: "AI workflows",
  meta: {
    title: "AI Workflows for Modern Business | Exyconn",
    description:
      "Discover how AI-powered workflows can automate, optimize, and scale your business processes. Learn about use cases, benefits, and how Exyconn helps you achieve operational excellence with intelligent automation.",
    keywords:
      "AI workflows, business automation, process optimization, real-time analytics, seamless collaboration, Exyconn",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1587&q=80",
  },
  hero: {
    title: "Automate, optimize and scale with AI workflows",
    tagline: "Automate. Optimize. Scale.",
    lede: "Unlock the power of AI-driven workflows to streamline, automate, and elevate your business processes. From data collection to actionable insights, our solutions help you achieve operational excellence and drive growth.",
    action: {
      label: "Contact us",
      href: "/contact",
    },
  },
  intro: {
    title: "What are AI workflows?",
    icon: "diagram-project",
    term: "AI Workflows",
    definition:
      "are orchestrated sequences of automated tasks, powered by artificial intelligence, that optimize and accelerate business operations. They connect data, people, and systems—enabling seamless automation, intelligent decision-making, and continuous improvement across your organization.",
  },
  benefits: {
    title: "Why do AI workflows matter?",
    items: [
      {
        icon: "bolt",
        text: "Accelerate repetitive and manual processes with automation.",
      },
      {
        icon: "brain",
        text: "Enable smarter, data-driven decisions at every step.",
      },
      {
        icon: "link",
        text: "Integrate seamlessly with your existing tools and platforms.",
      },
      {
        icon: "chart-line",
        text: "Boost productivity, reduce errors, and lower operational costs.",
      },
      {
        icon: "rocket",
        text: "Scale effortlessly as your business grows and evolves.",
      },
    ],
  },
  offerings: {
    title: "How AI workflows transform your business",
    items: [
      {
        icon: "robot",
        title: "End-to-end automation",
        text: "Automate entire processes—from data collection to reporting—minimizing manual intervention and delays.",
      },
      {
        icon: "chart-pie",
        title: "Real-time analytics",
        text: "Gain instant insights and trigger actions based on live data, improving responsiveness and outcomes.",
      },
      {
        icon: "people-arrows",
        title: "Seamless collaboration",
        text: "Connect teams, departments, and systems for unified, efficient workflows and better communication.",
      },
    ],
  },
  architecture: {
    title: "What an AI workflow connects",
    layers: [
      {
        label: "Inputs",
        nodes: ["Data", "People", "Systems"],
      },
      {
        label: "Workflow",
        nodes: ["Collect", "Analyze", "Act", "Report"],
      },
      {
        label: "Integrations",
        nodes: ["Business tools", "CRMs", "ERPs", "Cloud services"],
      },
    ],
  },
  demo: {
    kind: "trace",
    title: "workflow · live",
    caption: "An AI workflow from data collection to reporting, acting on live data on the way.",
    steps: [
      {
        label: "Collect",
        detail: "Data collection, automated",
      },
      {
        label: "Analyze",
        detail: "Instant insights from live data",
      },
      {
        label: "Act",
        detail: "Trigger actions based on live data",
      },
      {
        label: "Report",
        detail: "Reporting without manual intervention",
      },
    ],
  },
  faqs: [
    {
      question: "What is the difference between a workflow and a process?",
      answer:
        "A workflow is a defined sequence of tasks (often automated) to achieve a specific outcome, while a process is a broader set of activities that may include multiple workflows.",
    },
    {
      question: "Can AI workflows integrate with my existing software?",
      answer:
        "Yes, modern AI workflow platforms are designed to integrate with popular business tools, CRMs, ERPs, and cloud services.",
    },
    {
      question: "How do I measure the ROI of AI workflows?",
      answer:
        "Track KPIs such as time saved, error reduction, cost savings, and business outcomes before and after implementation.",
    },
  ],
  logos: {
    label: "Our business tools",
    keys: ["claude", "openai", "gemini"],
  },
  scene: { shapes: ["pipeline"], data: { pipeline: { stations: 4, branchAt: 2 } } },
});
