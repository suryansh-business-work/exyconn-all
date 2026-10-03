/** The industries the home page lists, with the section's own header and closing prompt. */
export const industriesHeader = {
  badge: "Industry Solutions",
  title: "AI + SaaS for",
  accent: "Every Industry",
  lead: "We deliver tailored AI and software solutions across diverse sectors, helping businesses transform their operations and stay ahead of the competition.",
} as const;

export const industries: readonly { icon: string; title: string; text: string }[] = [
  {
    icon: "fa-hospital",
    title: "Healthcare",
    text: "HIPAA-compliant AI solutions for patient care, diagnostics, and medical workflows.",
  },
  {
    icon: "fa-landmark",
    title: "Finance & Banking",
    text: "Secure fintech solutions with fraud detection, risk analysis, and compliance automation.",
  },
  {
    icon: "fa-shopping-cart",
    title: "Retail & E-commerce",
    text: "Personalized shopping experiences, inventory management, and customer analytics.",
  },
  {
    icon: "fa-industry",
    title: "Manufacturing",
    text: "Smart factory solutions with predictive maintenance and quality control.",
  },
  {
    icon: "fa-graduation-cap",
    title: "Education",
    text: "AI-powered learning platforms, student analytics, and automated assessments.",
  },
  {
    icon: "fa-truck",
    title: "Logistics",
    text: "Supply chain optimization, route planning, and real-time tracking systems.",
  },
  {
    icon: "fa-bolt",
    title: "Energy & Utilities",
    text: "Smart grid management, consumption forecasting, and sustainability analytics.",
  },
  {
    icon: "fa-shield-halved",
    title: "Insurance",
    text: "Claims automation, risk assessment, and fraud detection with AI.",
  },
];

export const industriesCta = {
  text: "Don't see your industry? We create custom solutions for any sector.",
  label: "Discuss Your Industry Needs",
  href: "/contact",
  icon: "fa-message",
} as const;
