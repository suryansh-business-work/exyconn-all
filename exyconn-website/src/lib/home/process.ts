/**
 * "How We Work" — rendered by HowWeWork.astro (about-us) and by the home stage. Each step's
 * classes are written out in full so Tailwind can find them.
 */
export const processCopy = {
  badgeIcon: "fa-route",
  badge: "Our Process",
  title: "From Idea to",
  accent: "MVP in Weeks",
  lead: "Our battle-tested methodology delivers production-ready solutions faster than traditional approaches.",
  cta: { href: "/contact", icon: "fa-calendar-check", label: "Start Your Project" },
} as const;

export interface ProcessStep {
  icon: string;
  title: string;
  text: string;
  when: string;
  /** Card hover border, icon tile, number chip and connector chevron. */
  border: string;
  tile: string;
  chip: string;
  connector: string;
}

export const processSteps: readonly ProcessStep[] = [
  {
    icon: "fa-lightbulb",
    title: "Discovery",
    text: "Deep-dive into your business goals, challenges, and data landscape to define the optimal AI strategy.",
    when: "Week 1-2",
    border: "hover:border-cyan-muted",
    tile: "bg-cyan-deep shadow-cyan/20",
    chip: "bg-cyan-soft text-cyan-fg-strong",
    connector: "text-cyan-bright",
  },
  {
    icon: "fa-pen-ruler",
    title: "Design",
    text: "Architect your AI solution with scalable infrastructure, selecting the right models and workflows.",
    when: "Week 2-3",
    border: "hover:border-indigo-muted",
    tile: "bg-indigo shadow-indigo/20",
    chip: "bg-indigo-soft text-indigo-fg-strong",
    connector: "text-indigo-bright",
  },
  {
    icon: "fa-rocket",
    title: "Build & Deploy",
    text: "Rapid development using pre-built AI components, followed by staged deployment to production.",
    when: "Week 3-6",
    border: "hover:border-emerald-muted",
    tile: "bg-emerald-deep shadow-emerald/20",
    chip: "bg-emerald-soft text-emerald-fg-strong",
    connector: "text-emerald-bright",
  },
  {
    icon: "fa-chart-line",
    title: "Optimize & Scale",
    text: "Continuous monitoring, optimization, and scaling support to maximize ROI and performance.",
    when: "Ongoing",
    border: "hover:border-orange-muted",
    tile: "bg-orange-deep shadow-orange/20",
    chip: "bg-orange-soft text-orange-fg-strong",
    connector: "text-orange-bright",
  },
];
