import { defineDetailPage } from "../schema";
import { GLYPHS } from "../glyphs";

/** AI bot creation — content for /[market]/ai/bot-creation. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "ai",
  slug: "bot-creation",
  name: "AI bot creation",
  meta: {
    title: "AI Bot Creation | Conversational Bots | Exyconn",
    description:
      "Build custom AI bots for chat, support, automation, and business workflows with Exyconn. Deploy conversational, task, and workflow bots tailored to your needs.",
    keywords: "AI bot creation, chatbots, workflow bots, conversational AI, automation, Exyconn",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Custom AI bots that engage and automate",
    tagline: "Conversational. Automated. Effective.",
    lede: "Accelerate your business with custom AI bots for chat, support, and workflow automation. Exyconn designs and deploys bots that engage users, automate tasks, and streamline operations across channels.",
    action: {
      label: "Start your bot project",
      href: "/contact",
    },
  },
  intro: {
    title: "What is AI bot creation?",
    icon: "robot",
    term: "AI Bot Creation",
    definition:
      "is the process of designing, building, and deploying intelligent bots that can converse, automate tasks, and handle workflows across chat, web, and business platforms. These bots use AI to understand, respond, and act on user input or business triggers.",
  },
  benefits: {
    title: "Why invest in AI bots?",
    items: [
      {
        icon: "comments",
        text: "24/7 conversational support for customers and employees.",
      },
      {
        icon: "bolt",
        text: "Automates repetitive tasks and business workflows.",
      },
      {
        icon: "layer-group",
        text: "Integrates with your apps, CRMs, and APIs.",
      },
      {
        icon: "chart-line",
        text: "Improves efficiency and reduces operational costs.",
      },
      {
        icon: "user-check",
        text: "Delivers consistent, accurate responses every time.",
      },
    ],
  },
  offerings: {
    title: "Types of bots we build",
    items: [
      {
        icon: "comments",
        title: "Conversational bots",
        text: "Engage users in natural language via chat, web, or messaging apps.",
      },
      {
        icon: "diagram-project",
        title: "Workflow bots",
        text: "Automate multi-step business processes and approvals.",
      },
      {
        icon: "headset",
        title: "Support bots",
        text: "Provide instant answers, ticketing, and escalation for support teams.",
      },
    ],
  },
  architecture: {
    title: "How an Exyconn bot is put together",
    layers: [
      {
        label: "Channels",
        nodes: ["Web", "Chat apps", "Mobile apps"],
      },
      {
        label: "Bots",
        nodes: ["Conversational", "Workflow", "Support"],
      },
      {
        label: "Understanding",
        nodes: ["NLP", "AI models"],
      },
      {
        label: "Your systems",
        nodes: ["CRMs", "ERPs", "Custom APIs"],
      },
    ],
  },
  demo: {
    kind: "chat",
    title: "bot · web chat",
    caption:
      "A visitor asks the bot which platforms it can be deployed on and gets an instant answer.",
    messages: [
      {
        from: "user",
        text: "What platforms can Exyconn deploy bots on?",
      },
      {
        from: "agent",
        text: "We build bots for web, chat (WhatsApp, Slack, Teams), mobile apps, and integrate with CRMs, ERPs, and custom APIs.",
      },
    ],
  },
  faqs: [
    {
      question: "What platforms can Exyconn deploy bots on?",
      answer:
        "We build bots for web, chat (WhatsApp, Slack, Teams), mobile apps, and integrate with CRMs, ERPs, and custom APIs.",
    },
    {
      question: "Can bots handle complex workflows?",
      answer:
        "Yes, our bots can automate multi-step workflows, approvals, and integrate with your business logic.",
    },
    {
      question: "How do bots understand user input?",
      answer:
        "We use advanced NLP and AI models to interpret, classify, and respond to user queries in natural language.",
    },
    {
      question: "Are bots secure and compliant?",
      answer:
        "Yes, we follow best practices for data privacy, security, and compliance in all bot deployments.",
    },
    {
      question: "How do I get started with AI bot creation?",
      answer:
        "Contact Exyconn for a free consultation. We’ll assess your needs, use cases, and recommend the best bot solution for your business.",
    },
  ],
  logos: {
    label: "Our business tools",
    keys: ["claude", "openai", "gemini"],
  },
  scene: { shapes: ["glyph"], data: { glyph: { paths: GLYPHS.chatBubbles } } },
});
