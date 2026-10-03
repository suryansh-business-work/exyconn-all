import { defineDetailPage } from "../schema";
import { serviceScene } from "../scenes";

/** Automation & integration — content for /[market]/services/automation-integration. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "services",
  slug: "automation-integration",
  name: "Automation & integration",
  meta: {
    title: "Automation & Integration Services | Exyconn",
    description:
      "Automate workflows and integrate your business systems with Exyconn. We deliver end-to-end automation and seamless integration for greater efficiency, accuracy, and growth.",
    keywords:
      "automation, integration, workflow automation, system integration, business automation, Exyconn",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Automate workflows and integrate your business systems",
    tagline: "Seamless. Efficient. Connected.",
    lede: "Transform your business with Exyconn’s automation and integration services. We help you automate repetitive tasks, connect your apps and data, and streamline workflows for maximum productivity and growth.",
    action: {
      label: "Start automating",
      href: "/contact",
    },
  },
  intro: {
    title: "What is automation & integration?",
    icon: "plug-circle-check",
    term: "Automation & Integration",
    definition:
      "involves connecting your business systems and automating manual processes. We enable seamless data flow, reduce errors, and free your team to focus on high-value work.",
  },
  benefits: {
    title: "Why choose Exyconn for automation & integration?",
    items: [
      {
        icon: "gears",
        text: "Automate repetitive tasks and business workflows.",
      },
      {
        icon: "plug",
        text: "Integrate apps, databases, APIs, and cloud platforms.",
      },
      {
        icon: "chart-line",
        text: "Boost efficiency, accuracy, and scalability.",
      },
      {
        icon: "shield-halved",
        text: "Secure, compliant, and reliable integrations.",
      },
      {
        icon: "user-check",
        text: "Custom solutions tailored to your business needs.",
      },
    ],
  },
  offerings: {
    title: "Our automation & integration services",
    items: [
      {
        icon: "diagram-project",
        title: "Workflow automation",
        text: "Automate multi-step business processes and approvals.",
      },
      {
        icon: "code-merge",
        title: "System integration",
        text: "Connect CRMs, ERPs, cloud apps, and databases for unified operations.",
      },
      {
        icon: "robot",
        title: "RPA & bots",
        text: "Deploy robotic process automation and bots for repetitive tasks.",
      },
    ],
  },
  faqs: [
    {
      question: "What systems can you integrate?",
      answer: "We integrate CRMs, ERPs, cloud apps, databases, APIs, and custom business systems.",
    },
    {
      question: "Can you automate custom business workflows?",
      answer:
        "Yes, we design and implement automation for a wide range of business processes and approvals.",
    },
    {
      question: "Is automation secure and compliant?",
      answer:
        "Absolutely. We follow best practices for security, privacy, and regulatory compliance.",
    },
    {
      question: "Do you provide support after deployment?",
      answer:
        "Yes, we offer ongoing monitoring, support, and optimization for all automation and integration solutions.",
    },
    {
      question: "How do I get started with automation & integration?",
      answer:
        "Contact Exyconn for a free consultation. We’ll assess your needs and recommend the best automation and integration strategy.",
    },
  ],
  scene: serviceScene("plug", 3),
});
