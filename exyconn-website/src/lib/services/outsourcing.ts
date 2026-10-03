import type { FaqItem, InnerAction } from "../../components/inner/types";

/** Content of /services/software-development-outsourcing — the copy the page already carried. */
export const outsourcingMeta = {
  title: "Software Development Outsourcing | Exyconn",
  description:
    "Outsource software development to Exyconn — reduce costs, access top talent, and accelerate delivery with flexible engagement models. Enterprise-grade quality guaranteed.",
  keywords:
    "software development outsourcing, outsource software development, IT outsourcing, offshore development, software engineering outsourcing, Exyconn",
  image:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
};

export const outsourcingHero: {
  title: string;
  lede: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Senior engineers, without the hiring cycle",
  lede: "Stay at the forefront of technology while de-risking software development and optimising costs. Exyconn builds world-class software — reliably, scalably and cost-effectively.",
  primary: { label: "Talk to our experts", href: "/contact" },
  secondary: { label: "Explore services", href: "#services" },
};

export const outsourcingStats = [
  { value: "50+", label: "Projects delivered" },
  { value: "98%", label: "Client satisfaction" },
  { value: "40%", label: "Average cost savings" },
];

export const outsourcingIntro = {
  label: "Definition",
  title: "What software development outsourcing is",
  text: "Software development outsourcing is the practice of delegating software engineering tasks — from full-cycle product development to team augmentation — to an external partner. It gives businesses specialised talent, a faster time-to-market and room to focus on core competencies while reducing operational costs.",
};

export interface TitledText {
  title: string;
  text: string;
}

export const outsourcingServices: readonly TitledText[] = [
  {
    title: "Cutting-edge app development",
    text: "Launch innovative solutions powered by AI, cloud and intelligent automation with our emerging-tech expertise.",
  },
  {
    title: "Legacy modernization",
    text: "Rewrite, rearchitect, rehost or reengineer your legacy systems with a team deep in modernization.",
  },
  {
    title: "Large-scale app management",
    text: "Outsource development, change management and operations for your existing software stack.",
  },
  {
    title: "Digital transformation",
    text: "Enhance digital experiences and optimise costs by adopting cloud, Agile, DevOps and microservices.",
  },
  {
    title: "Delivery model optimization",
    text: "Onshore, offshore and hybrid models that balance cost, efficiency and speed-to-market.",
  },
  {
    title: "Dedicated development teams",
    text: "A fully managed team of developers, QA and DevOps engineers integrated into your workflow.",
  },
];

export const outsourcingBenefits: readonly TitledText[] = [
  {
    title: "Access to top talent",
    text: "Top-tier professionals bridge any expertise gap. No talent searches on your side — skilled engineers are ready to go.",
  },
  {
    title: "Flexible engagement models",
    text: "From autonomous squads and application ownership to team augmentation — we adapt and scale on demand.",
  },
  {
    title: "Global presence",
    text: "Clients across multiple geographies, served from location-optimised delivery centres.",
  },
  {
    title: "Measurable success",
    text: "Key metrics turn progress and outcomes into objective, quantitative data — full visibility.",
  },
  {
    title: "Efficient knowledge management",
    text: "Thorough documentation, knowledge transfer and internal wikis keep every stage transparent.",
  },
  {
    title: "Holistic approach",
    text: "Cross-functional teams combine technology, industry expertise and human-centred design.",
  },
];

/** The "why choose" and "expertise" claims, as one list of short points. */
export const outsourcingAssurances: readonly TitledText[] = [
  {
    title: "Enterprise-grade security",
    text: "Best practices for data security, encryption and compliance throughout the SDLC.",
  },
  {
    title: "Faster time-to-market",
    text: "Dedicated teams and agile processes for rapid, iterative delivery on predictable timelines.",
  },
  {
    title: "Cost optimization",
    text: "Lower operational overhead with flexible engagement models and location-optimised delivery.",
  },
  {
    title: "Proven track record",
    text: "Clients across diverse industries — from ambitious startups to Fortune-level enterprises.",
  },
  {
    title: "Advanced teams",
    text: "Engineers with advanced degrees and industry certifications for reliable delivery.",
  },
];

/** Also shown on the services hub: the lifecycle stages we work across. */
export const lifecycleSteps: readonly TitledText[] = [
  {
    title: "Ideation",
    text: "Validate and enhance product ideas with our domain and technology expertise.",
  },
  {
    title: "Development & launch",
    text: "Optimise development costs with stable, predictable delivery via shared ownership.",
  },
  {
    title: "Growth & maturity",
    text: "Supercharge growth and operational efficiency with delivery ownership transfer.",
  },
  {
    title: "End of life",
    text: "Optimise costs and enable demand throttling with portfolio ownership transfer.",
  },
];

export const outsourcingChapters = {
  services: { label: "What we offer", title: "From ideation to deployment and beyond" },
  benefits: { label: "Why Exyconn", title: "What outsourcing to us changes" },
  lifecycle: { label: "End to end", title: "We work across the whole lifecycle" },
  faq: { label: "FAQ", title: "Outsourcing questions, answered" },
};

export const outsourcingFaqs: readonly FaqItem[] = [
  {
    question: "What is software development outsourcing?",
    answer:
      "Software development outsourcing is the practice of hiring an external company to handle some or all of your software engineering needs — from full product development to team augmentation and application management.",
  },
  {
    question: "Why should I consider outsourcing software development?",
    answer:
      "Outsourcing gives you access to specialized talent, reduces development costs, accelerates time-to-market, and lets you focus on core business activities. It also provides flexibility to scale teams up or down as needed.",
  },
  {
    question: "What engagement models does Exyconn offer?",
    answer:
      "We offer multiple models: dedicated development teams, project-based development, team augmentation, and managed services. We tailor the approach based on your project requirements and goals.",
  },
  {
    question: "How do you handle communication across different time zones?",
    answer:
      "We use asynchronous communication tools, overlapping working hours, and regular standups to ensure seamless collaboration. Our project managers act as a bridge between your team and ours.",
  },
  {
    question: "Can I scale my development team as needed?",
    answer:
      "Absolutely. One of the key advantages of outsourcing with Exyconn is the ability to quickly scale your team up or down based on project demands without the overhead of traditional hiring.",
  },
  {
    question: "How do you ensure code quality and project transparency?",
    answer:
      "We follow agile methodologies, conduct regular code reviews, maintain CI/CD pipelines, and provide clients with full access to project metrics, repositories, and progress dashboards.",
  },
];

export const outsourcingCta: {
  label: string;
  title: string;
  text: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  label: "Bespoke, value-driven product",
  title: "Beat the competition with your own team",
  text: "Let Exyconn handle the engineering so you can focus on what matters most — growing your business.",
  primary: { label: "Get in touch with our experts", href: "/contact" },
  secondary: { label: "Get a quote", href: "/get-a-quote" },
};
