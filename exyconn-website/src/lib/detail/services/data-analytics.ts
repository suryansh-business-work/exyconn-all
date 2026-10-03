import { defineDetailPage } from "../schema";
import { serviceScene } from "../scenes";

/** Data analytics — content for /[market]/services/data-analytics. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "services",
  slug: "data-analytics",
  name: "Data analytics",
  meta: {
    title: "Data Analytics & Business Insights Services | Exyconn",
    description:
      "Transform your data into actionable insights with Exyconn's data analytics services. We help you collect, analyze, visualize, and leverage data for smarter business decisions.",
    keywords:
      "data analytics, business intelligence, data visualization, analytics consulting, Exyconn",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Transform your data into actionable insights",
    tagline: "Unlock Insights. Drive Decisions.",
    lede: "Leverage the power of your data with Exyconn’s analytics services. We help you collect, analyze, and visualize data to uncover trends, optimize operations, and make smarter business decisions.",
    action: {
      label: "Start your analytics journey",
      href: "/contact",
    },
  },
  intro: {
    title: "What is data analytics?",
    icon: "chart-bar",
    term: "Data analytics",
    definition:
      "is the process of examining raw data to find trends, patterns, and actionable insights. We turn your business data into a strategic asset—fueling growth, efficiency, and innovation.",
  },
  benefits: {
    title: "Why choose Exyconn for data analytics?",
    items: [
      {
        icon: "database",
        text: "Expertise in data collection, cleaning, and integration.",
      },
      {
        icon: "chart-line",
        text: "Advanced analytics and predictive modeling.",
      },
      {
        icon: "eye",
        text: "Interactive dashboards and data visualization.",
      },
      {
        icon: "gears",
        text: "Seamless integration with your business systems.",
      },
      {
        icon: "user-check",
        text: "Actionable insights for better decision-making.",
      },
    ],
  },
  offerings: {
    title: "Our data analytics services",
    items: [
      {
        icon: "magnifying-glass-chart",
        title: "Business intelligence",
        text: "Dashboards, KPIs, and reporting for real-time business insights.",
      },
      {
        icon: "chart-pie",
        title: "Advanced analytics",
        text: "Predictive analytics, machine learning, and data mining.",
      },
      {
        icon: "diagram-project",
        title: "Data integration",
        text: "Connect and unify data from multiple sources for a complete view.",
      },
    ],
  },
  faqs: [
    {
      question: "What analytics platforms do you support?",
      answer:
        "We work with Power BI, Tableau, Looker, Google Data Studio, and custom analytics stacks.",
    },
    {
      question: "Can you integrate data from multiple sources?",
      answer:
        "Yes, we specialize in data integration from CRMs, ERPs, cloud apps, databases, and more.",
    },
    {
      question: "Do you provide predictive analytics and AI?",
      answer:
        "Absolutely. We offer advanced analytics, machine learning, and AI-driven insights tailored to your business.",
    },
    {
      question: "How do you ensure data security and privacy?",
      answer:
        "We follow best practices for data governance, privacy, and compliance throughout every analytics project.",
    },
    {
      question: "How do I get started with data analytics?",
      answer:
        "Contact Exyconn for a free consultation. We’ll assess your data and recommend the best analytics strategy for your needs.",
    },
  ],
  logos: {
    label: "Analytics tools",
    keys: ["adobeAnalytics"],
  },
  scene: serviceScene("chart", 3),
});
