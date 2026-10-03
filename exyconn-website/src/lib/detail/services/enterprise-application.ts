import { defineDetailPage } from "../schema";
import { serviceScene } from "../scenes";

/** Enterprise applications — content for /[market]/services/enterprise-application. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "services",
  slug: "enterprise-application",
  name: "Enterprise applications",
  meta: {
    title: "Enterprise Application Services | Exyconn",
    description:
      "Build, scale, and optimize robust enterprise applications with Exyconn. We deliver secure, high-performance solutions tailored for complex business needs and large-scale operations.",
    keywords:
      "enterprise application, business software, enterprise solutions, scalable apps, provider services, Exyconn",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Robust, secure, scalable enterprise applications",
    tagline: "Robust. Scalable. Enterprise-Grade.",
    lede: "Empower your organization with robust, secure, and scalable enterprise applications. Exyconn designs, develops, and manages mission-critical solutions for large-scale business operations and complex workflows.",
    action: {
      label: "Start your enterprise project",
      href: "/contact",
    },
  },
  intro: {
    title: "What are enterprise applications?",
    icon: "building",
    term: "Enterprise applications",
    definition:
      "are large-scale software systems designed to support complex business processes, integrate with multiple systems, and deliver high performance, security, and reliability for organizations of any size.",
  },
  benefits: {
    title: "Why choose Exyconn for enterprise applications?",
    items: [
      {
        icon: "layer-group",
        text: "Robust architecture for mission-critical operations.",
      },
      {
        icon: "shield-halved",
        text: "Enterprise-grade security, compliance, and governance.",
      },
      {
        icon: "gears",
        text: "Custom integrations with ERPs, CRMs, and business platforms.",
      },
      {
        icon: "chart-line",
        text: "Scalable solutions for growing business needs.",
      },
      {
        icon: "users",
        text: "End-to-end support from consulting to managed services.",
      },
    ],
  },
  offerings: {
    title: "Our enterprise application services",
    items: [
      {
        icon: "diagram-project",
        title: "Custom development",
        text: "Design and build tailored enterprise applications for your unique business processes.",
      },
      {
        icon: "plug",
        title: "Integration & modernization",
        text: "Integrate with existing systems and modernize legacy applications for better performance.",
      },
      {
        icon: "shield-halved",
        title: "Management & support",
        text: "Ongoing maintenance, monitoring, and optimization for enterprise-grade reliability.",
      },
    ],
  },
  faqs: [
    {
      question: "What types of enterprise applications does Exyconn build?",
      answer:
        "We build ERP, CRM, HRM, supply chain, analytics, and custom business applications tailored to your needs.",
    },
    {
      question: "Can you integrate with our existing systems?",
      answer:
        "Yes, we specialize in seamless integration with ERPs, CRMs, databases, and cloud platforms.",
    },
    {
      question: "How do you ensure security and compliance?",
      answer:
        "Our solutions follow best practices for security, data privacy, and industry compliance standards.",
    },
    {
      question: "Do you provide ongoing support and management?",
      answer:
        "Absolutely. We offer managed services, monitoring, and continuous optimization for all enterprise applications.",
    },
    {
      question: "How do I get started with enterprise application services?",
      answer:
        "Contact Exyconn for a free consultation. We’ll assess your requirements and recommend the best solution for your enterprise.",
    },
  ],
  scene: serviceScene("city", "building"),
});
