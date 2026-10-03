/** Content of /contact — the addresses, links and promises the page already carried. */
export const contactMeta = {
  title: "Contact Us | Get in Touch with Exyconn",
  description:
    "Contact Exyconn for AI automation, SaaS solutions, and business inquiries. Reach out to our team for support, partnership, or to start your digital transformation journey.",
  keywords: "contact, Exyconn, AI automation, SaaS, business inquiry, support, partnership",
  image:
    "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&w=1200&q=80",
};

export const contactBand = {
  title: "Let's start a conversation",
  lede: "Have a project in mind? Questions about our services? We'd love to hear from you.",
};

export const contactSplit = {
  label: "01 — Write to us",
  title: "Send us a message",
  lede: "Reach out and let's explore how we can help transform your business.",
  formLabel: "Message form",
  /** The three things the page already promised. */
  points: [
    "Quick response time.",
    "Remote-first with global clients — we're just an email or video call away.",
    "Video consultations.",
  ],
  channelsTitle: "Direct channels",
  linksTitle: "Quick links",
};

export interface ContactChannel {
  title: string;
  description: string;
  value: string;
  href: string;
}

/** Where project and service enquiries go. */
export const SERVICES_EMAIL = "services@exyconn.com";

export const contactChannels: readonly ContactChannel[] = [
  {
    title: "HR inquiries",
    description: "For career and HR-related queries",
    value: "hr@exyconn.com",
    href: "mailto:hr@exyconn.com",
  },
  {
    title: "Service inquiries",
    description: "For service and project queries",
    value: SERVICES_EMAIL,
    href: `mailto:${SERVICES_EMAIL}`,
  },
  {
    title: "Legal inquiries",
    description: "For legal and compliance matters",
    value: "View legal page",
    href: "/legal",
  },
];

export const contactQuickLinks = [
  { label: "AI services", href: "/ai" },
  { label: "Careers", href: "/career" },
  { label: "Get a quote", href: "/get-a-quote" },
];
