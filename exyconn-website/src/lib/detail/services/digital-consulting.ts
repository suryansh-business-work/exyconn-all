import { defineDetailPage } from "../schema";
import { serviceScene } from "../scenes";

/** Digital consulting — content for /[market]/services/digital-consulting. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "services",
  slug: "digital-consulting",
  name: "Digital consulting",
  meta: {
    title: "Digital Consulting & AI Strategy Services | Exyconn",
    description:
      "Accelerate your digital transformation with Exyconn's digital consulting services. We help you strategize, implement, and optimize AI, automation, and technology for business growth.",
    keywords:
      "digital consulting, digital transformation, AI strategy, business consulting, technology consulting, Exyconn",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Digital consulting that delivers measurable results",
    tagline: "Transform. Innovate. Grow.",
    lede: "Unlock business value with Exyconn’s digital consulting. We guide your organization through strategy, AI adoption, process automation, and technology transformation—delivering measurable results at every step.",
    action: {
      label: "Start your digital journey",
      href: "/contact",
    },
  },
  intro: {
    title: "What is digital consulting?",
    icon: "lightbulb",
    term: "Digital consulting",
    definition:
      "helps organizations leverage technology, data, and AI to solve business challenges, improve efficiency, and drive innovation. Our experts partner with you to design and implement strategies for digital transformation and sustainable growth.",
  },
  benefits: {
    title: "Why choose Exyconn for digital consulting?",
    items: [
      {
        icon: "chart-line",
        text: "Proven strategies for digital transformation and growth.",
      },
      {
        icon: "brain",
        text: "Expertise in AI, automation, and emerging technologies.",
      },
      {
        icon: "users",
        text: "Collaborative, client-centric approach.",
      },
      {
        icon: "gears",
        text: "End-to-end support from strategy to implementation.",
      },
      {
        icon: "shield-halved",
        text: "Focus on security, compliance, and measurable ROI.",
      },
    ],
  },
  offerings: {
    title: "Our digital consulting services",
    items: [
      {
        icon: "compass-drafting",
        title: "Strategy & roadmap",
        text: "Digital strategy, technology roadmap, and change management for your business goals.",
      },
      {
        icon: "robot",
        title: "AI & automation",
        text: "AI adoption, process automation, and workflow optimization for efficiency and innovation.",
      },
      {
        icon: "cloud-arrow-up",
        title: "Implementation & support",
        text: "Technology selection, integration, deployment, and ongoing support for digital solutions.",
      },
    ],
  },
  faqs: [
    {
      question: "What industries does Exyconn serve?",
      answer:
        "We work with clients across finance, healthcare, retail, manufacturing, logistics, and more—adapting digital strategies to each sector.",
    },
    {
      question: "How does Exyconn approach digital transformation?",
      answer:
        "We start with a deep assessment of your business, then co-create a strategy and roadmap, followed by implementation and continuous optimization.",
    },
    {
      question: "Can you help with AI and automation adoption?",
      answer:
        "Yes, we specialize in AI, automation, and process optimization—helping you select, implement, and scale the right solutions.",
    },
    {
      question: "Is digital consulting only for large enterprises?",
      answer:
        "No, we support organizations of all sizes, from startups to global enterprises, tailoring our approach to your needs and resources.",
    },
    {
      question: "How do I get started with digital consulting?",
      answer:
        "Contact Exyconn for a free consultation. We’ll discuss your goals and recommend the best path for your digital journey.",
    },
  ],
  logos: {
    label: "Our digital consulting tools",
    keys: ["claude", "openai", "gemini"],
  },
  scene: serviceScene("roadmap", "bulb"),
});
