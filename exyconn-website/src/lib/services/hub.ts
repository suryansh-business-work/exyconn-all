import type { InnerAction } from "../../components/inner/types";
import { catalogServices } from "./catalog";

/** Copy for the services hub (/services). The services themselves live in ./catalog. */
export const hubMeta = {
  title: "Our Services | Exyconn",
  description:
    "Explore all digital, automation, analytics, SaaS, and mobile services offered by Exyconn. Transform your business with our comprehensive solutions.",
  keywords:
    "digital services, automation, SaaS, mobile development, enterprise applications, data analytics, Exyconn",
  image:
    "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&w=1200&q=80",
};

export const hubHero: {
  title: string;
  lede: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Software that builds, modernises and grows",
  lede: "From digital transformation to AI automation, we provide end-to-end services to help your business thrive in the digital era.",
  primary: { label: "Get started", href: "/contact" },
  secondary: { label: "Get a quote", href: "/get-a-quote" },
};

export const hubStats = [
  { value: String(catalogServices().length), label: "Services" },
  { value: "50+", label: "Projects delivered" },
  { value: "100%", label: "Client satisfaction" },
  { value: "24/7", label: "Support available" },
];

export const hubChapters = {
  pillars: {
    label: "Pillars",
    title: "Three ways we move your business",
    lede: "Pick the pillar that matches where you are. Each service page shows what we deliver and how we work.",
    more: "Explore",
  },
  lifecycle: {
    label: "Lifecycle",
    title: "With you across the whole lifecycle",
  },
  explore: {
    label: "Explore",
    title: "AI, platform and the full portfolio",
  },
};

export const hubCta: { title: string; text: string; primary: InnerAction; secondary: InnerAction } =
  {
    title: "Ready to transform your business?",
    text: "Let's discuss how our services can help you achieve your business goals. Schedule a free consultation today.",
    primary: { label: "Schedule consultation", href: "/contact" },
    secondary: { label: "Get a quote", href: "/get-a-quote" },
  };
