import { defineDetailPage } from "../schema";
import { serviceScene } from "../scenes";

/** Application maintenance — content for /[market]/services/maintenance. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "services",
  slug: "maintenance",
  name: "Application maintenance",
  meta: {
    title: "Application Maintenance & Support Services | Exyconn",
    description:
      "Keep your business applications running smoothly with Exyconn's maintenance services. We provide proactive support, updates, monitoring, and optimization for enterprise and custom apps.",
    keywords:
      "application maintenance, app support, software maintenance, managed services, Exyconn",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Keep your business applications running smoothly",
    tagline: "Reliable. Proactive. Always On.",
    lede: "Ensure your business applications are secure, up-to-date, and high-performing. Exyconn provides comprehensive maintenance services—including monitoring, updates, bug fixes, and optimization—to maximize uptime and business value.",
    action: {
      label: "Get maintenance support",
      href: "/contact",
    },
  },
  intro: {
    title: "Why application maintenance?",
    icon: "screwdriver-wrench",
    term: "Application maintenance",
    definition:
      "ensures your software stays secure, reliable, and aligned with evolving business needs. We handle updates, bug fixes, performance tuning, and enhancements—so you can focus on growth.",
  },
  benefits: {
    title: "Our maintenance services include",
    items: [
      {
        icon: "shield-halved",
        text: "Security updates and vulnerability patching.",
      },
      {
        icon: "bug",
        text: "Bug fixes and issue resolution.",
      },
      {
        icon: "gauge-high",
        text: "Performance monitoring and optimization.",
      },
      {
        icon: "gears",
        text: "Feature enhancements and minor upgrades.",
      },
      {
        icon: "headset",
        text: "24/7 support and incident management.",
      },
    ],
  },
  offerings: {
    title: "Why choose Exyconn for maintenance?",
    items: [
      {
        icon: "clock-rotate-left",
        title: "Proactive monitoring",
        text: "Continuous monitoring to detect and resolve issues before they impact your business.",
      },
      {
        icon: "user-shield",
        title: "Expert support",
        text: "Experienced team for troubleshooting, updates, and compliance.",
      },
      {
        icon: "chart-line",
        title: "Continuous optimization",
        text: "Regular performance reviews and improvements to keep your apps running at their best.",
      },
    ],
  },
  faqs: [
    {
      question: "What types of applications do you maintain?",
      answer:
        "We support enterprise, custom, web, and mobile applications across a wide range of industries and platforms.",
    },
    {
      question: "Do you offer 24/7 support?",
      answer:
        "Yes, we provide round-the-clock monitoring and incident response to ensure your applications are always available.",
    },
    {
      question: "Can you maintain legacy systems?",
      answer:
        "Absolutely. We have experience supporting and modernizing legacy applications as well as new solutions.",
    },
    {
      question: "How do you handle security updates?",
      answer:
        "We proactively monitor for vulnerabilities and apply security patches and updates as soon as they are available.",
    },
    {
      question: "How do I get started with application maintenance?",
      answer:
        "Contact Exyconn for a free consultation. We’ll assess your applications and recommend the best maintenance plan for your needs.",
    },
  ],
  scene: serviceScene("ops", "cog"),
});
