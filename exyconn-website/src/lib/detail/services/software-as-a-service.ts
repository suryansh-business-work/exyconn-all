import { defineDetailPage } from "../schema";
import { serviceScene } from "../scenes";

/** Software as a service (SaaS) — content for /[market]/services/software-as-a-service. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "services",
  slug: "software-as-a-service",
  name: "Software as a service (SaaS)",
  meta: {
    title: "Software as a Service (SaaS) Solutions | Exyconn",
    description:
      "Accelerate your business with Exyconn's SaaS solutions. We design, build, and manage scalable, secure, and innovative cloud software for modern enterprises.",
    keywords:
      "SaaS, software as a service, cloud software, SaaS development, SaaS consulting, Exyconn",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Scalable, secure, cloud-native SaaS solutions",
    tagline: "Scalable. Secure. Cloud-Native.",
    lede: "Transform your business with Exyconn’s SaaS expertise. We help you design, develop, and scale cloud-based software that delivers value, flexibility, and innovation to your users.",
    action: {
      label: "Start your SaaS project",
      href: "/contact",
    },
  },
  intro: {
    title: "What is SaaS?",
    icon: "cloud",
    term: "Software as a Service (SaaS)",
    definition:
      "delivers applications over the internet as a service. Instead of installing and maintaining software, users access it via the cloud—enabling rapid deployment, lower costs, and seamless updates.",
  },
  benefits: {
    title: "Why choose Exyconn for SaaS?",
    items: [
      {
        icon: "cloud-arrow-up",
        text: "Cloud-native architecture for scalability and reliability.",
      },
      {
        icon: "lock",
        text: "Enterprise-grade security and compliance.",
      },
      {
        icon: "gears",
        text: "Custom SaaS development and integration.",
      },
      {
        icon: "rocket",
        text: "Rapid go-to-market and continuous delivery.",
      },
      {
        icon: "chart-line",
        text: "Analytics, automation, and AI built in.",
      },
    ],
  },
  offerings: {
    title: "Our SaaS services",
    items: [
      {
        icon: "lightbulb",
        title: "SaaS consulting",
        text: "Strategy, architecture, and roadmap for SaaS success.",
      },
      {
        icon: "code",
        title: "SaaS development",
        text: "Custom cloud software, integrations, and API platforms.",
      },
      {
        icon: "shield-halved",
        title: "SaaS management",
        text: "Ongoing support, monitoring, and optimization for your SaaS apps.",
      },
    ],
  },
  faqs: [
    {
      question: "What types of SaaS solutions does Exyconn build?",
      answer:
        "We build SaaS for CRM, ERP, analytics, collaboration, automation, and industry-specific needs—customized for your business.",
    },
    {
      question: "How secure are Exyconn's SaaS platforms?",
      answer:
        "Our SaaS solutions follow best practices for security, encryption, and compliance with industry standards.",
    },
    {
      question: "Can you migrate my legacy app to SaaS?",
      answer:
        "Yes, we offer modernization and migration services to move your legacy software to a modern SaaS platform.",
    },
    {
      question: "Do you provide ongoing SaaS support?",
      answer:
        "Absolutely. We offer managed services, monitoring, and continuous improvement for your SaaS applications.",
    },
    {
      question: "How do I get started with SaaS for my business?",
      answer:
        "Contact Exyconn for a free consultation. We’ll discuss your goals and recommend the best SaaS approach for your needs.",
    },
  ],
  scene: serviceScene("cloud", 3),
});
