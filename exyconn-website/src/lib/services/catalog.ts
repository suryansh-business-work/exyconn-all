/**
 * The services catalogue behind the services hub (/services) and the pages that overlap it
 * (/our-services, /exyconn-services). One description per service, grouped into the three
 * pillars of the blueprint — Build, Modernise, Grow — so every surface routes the same way.
 *
 * Copy is the content these pages already carried; only the grouping is new.
 */
export interface CatalogService {
  title: string;
  /** One-line outcome for the card. */
  summary: string;
  href: string;
  tags: readonly string[];
}

export interface ServicePillar {
  id: "build" | "modernise" | "grow";
  label: string;
  title: string;
  text: string;
  services: readonly CatalogService[];
}

export const servicePillars: readonly ServicePillar[] = [
  {
    id: "build",
    label: "Build",
    title: "Build what is next",
    text: "Powerful applications for web and mobile, built by a team that owns the outcome.",
    services: [
      {
        title: "Software development outsourcing",
        summary: "Access top talent and accelerate delivery with flexible engagement models.",
        href: "/services/software-development-outsourcing",
        tags: ["Dedicated teams", "Augmentation", "Delivery"],
      },
      {
        title: "Mobile application development",
        summary: "High-performance, user-friendly mobile apps for iOS and Android.",
        href: "/services/mobile-application-development",
        tags: ["iOS", "Android", "Cross-platform"],
      },
      {
        title: "Enterprise application",
        summary: "Build, scale and optimise robust enterprise applications.",
        href: "/services/enterprise-application",
        tags: ["Secure", "High-performance", "Large-scale"],
      },
      {
        title: "Software as a service",
        summary: "Scalable, secure and innovative SaaS, designed, built and managed.",
        href: "/services/software-as-a-service",
        tags: ["Cloud", "Multi-tenant", "Managed"],
      },
    ],
  },
  {
    id: "modernise",
    label: "Modernise",
    title: "Modernise what runs",
    text: "Upgrade legacy systems, connect what is siloed and keep it all running smoothly.",
    services: [
      {
        title: "Application modernization",
        summary: "Upgrade legacy systems for performance, security and innovation.",
        href: "/services/application-modernization",
        tags: ["Migration", "Legacy", "Performance"],
      },
      {
        title: "Automation & integration",
        summary: "Automate workflows and integrate your business systems for efficiency.",
        href: "/services/automation-integration",
        tags: ["Workflows", "APIs", "Integration"],
      },
      {
        title: "Maintenance & support",
        summary: "Keep your applications running smoothly with proactive support.",
        href: "/services/maintenance",
        tags: ["Monitoring", "Updates", "Support"],
      },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    title: "Grow what works",
    text: "Unlock insights, sharpen the strategy and turn traffic into revenue.",
    services: [
      {
        title: "Data analytics",
        summary: "Turn your data into actionable insights for smarter decisions.",
        href: "/services/data-analytics",
        tags: ["BI", "Visualisation", "Insights"],
      },
      {
        title: "Digital consulting",
        summary: "Accelerate your digital transformation with strategy and technology consulting.",
        href: "/services/digital-consulting",
        tags: ["Strategy", "AI", "Transformation"],
      },
      {
        title: "Digital marketing",
        summary: "Grow brand, traffic and revenue with full-funnel marketing services.",
        href: "/services/digital-marketing",
        tags: ["SEO", "Paid media", "CRO"],
      },
    ],
  },
];

/** Every catalogue service, in pillar order. */
export const catalogServices = (pillars: readonly ServicePillar[] = servicePillars) =>
  pillars.flatMap((pillar) => pillar.services);

/** Mono card index, e.g. "B/02" — the pillar's initial and the service's place in it. */
export const serviceIndex = (pillar: Pick<ServicePillar, "label">, position: number): string =>
  `${pillar.label.charAt(0).toUpperCase()}/${String(position + 1).padStart(2, "0")}`;

/** "1 service", "4 services". */
export const countLabel = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`;

export interface HubLink {
  href: string;
  title: string;
  text: string;
  more: string;
}

/**
 * The hubs that overlap (user decision 2: every URL stays, they cross-link instead). Each
 * page shows the others with `otherHubs(currentHref)`.
 */
export const hubLinks: readonly HubLink[] = [
  {
    href: "/services",
    title: "Services hub",
    text: "Every service by pillar — build, modernise and grow.",
    more: "Browse services",
  },
  {
    href: "/our-services",
    title: "Our service pillars",
    text: "AI platform services, SaaS development and enterprise consulting.",
    more: "See the pillars",
  },
  {
    href: "/exyconn-services",
    title: "Infrastructure platform",
    text: "Email, payments, logs, themes, translations and more — all in one place.",
    more: "See the platform",
  },
  {
    href: "/ai",
    title: "AI platform",
    text: "Agents, models, workflows and MCP infrastructure, production-ready.",
    more: "Explore AI",
  },
  {
    href: "/ai-services",
    title: "AI services catalogue",
    text: "Every AI product and build service we offer, by capability area.",
    more: "Open the catalogue",
  },
];

export const otherHubs = (currentHref: string, links: readonly HubLink[] = hubLinks) =>
  links.filter((link) => link.href !== currentHref);

/** The pillars as card groups for the hub: cards carry their mono index and tags. */
export const pillarGroups = (pillars: readonly ServicePillar[] = servicePillars) =>
  pillars.map((pillar) => ({
    id: pillar.id,
    label: pillar.label,
    title: pillar.title,
    text: pillar.text,
    cards: pillar.services.map((service, position) => ({
      href: service.href,
      title: service.title,
      text: service.summary,
      tags: service.tags,
      index: serviceIndex(pillar, position),
    })),
  }));
