import type { InnerAction } from "../../components/inner/types";

/** Content of /our-vision — the copy the page already carried, regrouped per the blueprint. */
export const visionMeta = {
  title: "Our Vision | Exyconn",
  description:
    "Discover Exyconn's vision for responsible AI automation. Learn how we empower organizations with ethical, human-centric, and sustainable AI solutions for a smarter, more connected future.",
  keywords:
    "Exyconn vision, responsible AI, ethical automation, human-centric AI, sustainable technology, business innovation",
  image:
    "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&w=1200&q=80",
};

export const visionHero: {
  title: string;
  lede: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Empowering progress through innovation",
  lede: "We envision a future where AI empowers every organization to achieve their full potential—driving efficiency, creativity, and growth while respecting human values.",
  primary: { label: "Join our journey", href: "/contact" },
  secondary: { label: "About us", href: "/about-us" },
};

export const visionChapters = {
  statement: {
    label: "Building tomorrow, today",
    title: "AI that serves people and the businesses they run",
  },
  horizons: {
    label: "What we're working toward",
    title: "Three horizons",
    lede: "Ambitious goals that drive our everyday decisions.",
  },
  principles: {
    label: "Vision pillars",
    title: "The principles that guide our path forward",
  },
  ahead: { label: "Looking ahead", title: "Responsible innovation, every step" },
};

export const visionStatement = [
  "We're constantly exploring new ways to make AI more accessible, secure, and beneficial for everyone.",
  "Our vision is a future where businesses thrive, people are empowered, and technology serves humanity.",
];

/** The page's goals, laid out as now → next → later; each lights its arc of the sunrise. */
export const visionHorizons = [
  {
    when: "Now",
    title: "Accelerate innovation",
    text: "Help businesses adopt AI faster and more effectively.",
  },
  {
    when: "Next",
    title: "Global reach",
    text: "Make AI accessible to organizations of all sizes worldwide.",
  },
  {
    when: "Later",
    title: "Positive impact",
    text: "Create technology that benefits businesses and society.",
  },
];

export const visionPillars = [
  {
    title: "AI-first innovation",
    text: "We believe AI should be accessible, ethical, and a force for good—driving efficiency, creativity, and growth while respecting privacy and human values.",
  },
  {
    title: "Human-centric design",
    text: "We design AI solutions that enhance—not replace—human capabilities. Our tools are intuitive, transparent, and built to support your team's unique workflows.",
  },
  {
    title: "Sustainable impact",
    text: "We deliver automation that drives business results while supporting long-term sustainability and positive societal impact.",
  },
  {
    title: "Trust & transparency",
    text: "We build trust through transparency, security, and ethical AI practices in everything we create.",
  },
];

export const visionAhead = {
  text: "As technology evolves, so does our commitment to responsible innovation. Join us on this journey to build a smarter, more connected, and more human world.",
  points: [
    "Continuous learning — we foster a culture of innovation and knowledge sharing.",
    "Accessible, secure and beneficial AI for everyone.",
    "Technology that serves humanity.",
  ],
};

export const visionCta: {
  title: string;
  text: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Ready to shape the future together?",
  text: "Connect with our team to discover how Exyconn can help your business lead with AI innovation.",
  primary: { label: "Contact us", href: "/contact" },
  secondary: { label: "Join our team", href: "/career" },
};
