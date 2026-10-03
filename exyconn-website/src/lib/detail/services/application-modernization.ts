import { defineDetailPage } from "../schema";
import { serviceScene } from "../scenes";

/** Application modernization — content for /[market]/services/application-modernization. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "services",
  slug: "application-modernization",
  name: "Application modernization",
  meta: {
    title: "Application Modernization Services | Exyconn",
    description:
      "Upgrade your legacy systems for performance, security, and innovation. Exyconn's application modernization services help you transform, migrate, and optimize business-critical applications.",
    keywords:
      "application modernization, legacy system upgrade, app migration, modernization consulting, Exyconn",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Modernize legacy applications and reduce technical debt",
    tagline: "Upgrade. Secure. Transform.",
    lede: "Modernize your legacy applications for better performance, security, and scalability. Exyconn helps you migrate, refactor, and optimize business-critical systems—unlocking innovation and reducing technical debt.",
    action: {
      label: "Start your modernization",
      href: "/contact",
    },
  },
  intro: {
    title: "What is application modernization?",
    icon: "arrows-rotate",
    term: "Application modernization",
    definition:
      "is the process of updating legacy software to modern architectures, platforms, and technologies. This improves performance, security, maintainability, and enables integration with new digital solutions.",
  },
  benefits: {
    title: "Why modernize your applications?",
    items: [
      {
        icon: "gauge-high",
        text: "Boost performance and reliability for business-critical apps.",
      },
      {
        icon: "shield-halved",
        text: "Enhance security and compliance to reduce risk.",
      },
      {
        icon: "cloud-arrow-up",
        text: "Enable cloud migration and integration with modern platforms.",
      },
      {
        icon: "gears",
        text: "Reduce technical debt and maintenance costs.",
      },
      {
        icon: "lightbulb",
        text: "Unlock innovation and support digital transformation.",
      },
    ],
  },
  offerings: {
    title: "Our application modernization services",
    items: [
      {
        icon: "database",
        title: "Legacy assessment",
        text: "Evaluate your current systems and define a modernization roadmap.",
      },
      {
        icon: "code-compare",
        title: "Migration & refactoring",
        text: "Migrate apps to cloud, refactor code, and adopt modern architectures.",
      },
      {
        icon: "shield-halved",
        title: "Security & optimization",
        text: "Enhance security, performance, and maintainability for long-term value.",
      },
    ],
  },
  faqs: [
    {
      question: "What types of legacy systems can Exyconn modernize?",
      answer:
        "We modernize a wide range of legacy applications, including mainframe, desktop, web, and custom business systems.",
    },
    {
      question: "Can you migrate my apps to the cloud?",
      answer:
        "Yes, we specialize in cloud migration, refactoring, and re-platforming to AWS, Azure, Google Cloud, and private clouds.",
    },
    {
      question: "How do you ensure security during modernization?",
      answer:
        "We follow best practices for secure migration, data protection, and compliance throughout the modernization process.",
    },
    {
      question: "Will there be downtime during migration?",
      answer:
        "We plan migrations to minimize downtime and disruption, using phased and parallel approaches where possible.",
    },
    {
      question: "How do I get started with application modernization?",
      answer:
        "Contact Exyconn for a free consultation. We’ll assess your legacy systems and recommend the best modernization strategy.",
    },
  ],
  scene: serviceScene("modernize", "rotate"),
});
