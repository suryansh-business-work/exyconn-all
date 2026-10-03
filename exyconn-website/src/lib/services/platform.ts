import type { InnerAction } from "../../components/inner/types";

/**
 * The Exyconn infrastructure platform (/exyconn-services): every service it runs, by
 * category. Counts on the page are derived from this list, so the copy cannot drift.
 */
export type PlatformStatus = "live" | "dev" | "soon";

export interface PlatformService {
  id: string;
  name: string;
  description: string;
  status: PlatformStatus;
  category: string;
  features: readonly string[];
}

export const platformCategories = [
  "Global",
  "Communications",
  "Developer Tools",
  "Storage & Files",
  "Monitoring & Analytics",
  "Content & Media",
  "Infrastructure",
] as const;

export const platformServices: readonly PlatformService[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Overview of API analytics, usage statistics, and system health metrics.",
    status: "live",
    category: "Global",
    features: ["API Analytics", "Usage Stats", "Health Metrics"],
  },
  {
    id: "api-key",
    name: "API Key",
    description: "Manage API keys for external service authentication and access control.",
    status: "live",
    category: "Global",
    features: ["Key Generation", "Access Control", "Rate Limiting"],
  },
  {
    id: "timezone-settings",
    name: "Timezone",
    description: "Configure timezone preferences with multi-timezone select and time conversion.",
    status: "live",
    category: "Global",
    features: ["Multi-timezone", "Time Conversion", "date-fns Integration"],
  },
  {
    id: "email",
    name: "Email",
    description:
      "Send transactional and marketing emails with template support and delivery tracking.",
    status: "live",
    category: "Communications",
    features: ["Templates", "History", "Settings", "Delivery Tracking"],
  },
  {
    id: "phone",
    name: "Phone",
    description: "Voice calling capabilities with call tracking and recording features.",
    status: "live",
    category: "Communications",
    features: ["Voice Calls", "Call Recording", "Call Tracking"],
  },
  {
    id: "sms",
    name: "SMS",
    description: "Send and receive SMS messages with delivery reports and templates.",
    status: "live",
    category: "Communications",
    features: ["Delivery Reports", "Templates", "Two-way SMS"],
  },
  {
    id: "chat",
    name: "Chat",
    description: "Real-time chat and instant messaging for web and mobile applications.",
    status: "live",
    category: "Communications",
    features: ["Real-time", "WebSocket", "Message History"],
  },
  {
    id: "web-video",
    name: "Web Video",
    description: "Video conferencing and streaming capabilities for web applications.",
    status: "live",
    category: "Communications",
    features: ["WebRTC", "Recording", "Screen Share"],
  },
  {
    id: "web-audio",
    name: "Web Audio",
    description: "Audio streaming and voice communication for web applications.",
    status: "live",
    category: "Communications",
    features: ["Voice Chat", "Audio Streaming", "WebRTC"],
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Push notifications and in-app notification management.",
    status: "live",
    category: "Communications",
    features: ["Push Notifications", "FCM", "In-app Alerts"],
  },
  {
    id: "logs",
    name: "Logs",
    description: "Centralized logging service for application debugging and monitoring.",
    status: "live",
    category: "Developer Tools",
    features: ["Search Logs", "Test Logs", "Log Retention"],
  },
  {
    id: "ai",
    name: "AI",
    description: "AI-powered services including text generation, analysis, and custom prompts.",
    status: "live",
    category: "Developer Tools",
    features: ["GPT Integration", "Custom Prompts", "Model Selection"],
  },
  {
    id: "environment-keys",
    name: "Environment Keys",
    description: "Secure storage and management of environment variables and secrets.",
    status: "live",
    category: "Developer Tools",
    features: ["Encryption", "Version Control", "Team Access"],
  },
  {
    id: "global-search",
    name: "Global Search",
    description: "Unified search across all services and resources.",
    status: "live",
    category: "Developer Tools",
    features: ["Elasticsearch", "Fuzzy Search", "Filters"],
  },
  {
    id: "system-info",
    name: "System Info",
    description: "Server runtime information, OS details, Docker, Nginx, SSL, and terminal access.",
    status: "live",
    category: "Developer Tools",
    features: ["Docker Info", "Nginx Status", "SSL Check", "Terminal"],
  },
  {
    id: "dynamic-form",
    name: "Dynamic Form",
    description: "Generate dynamic forms from schema definitions with validation.",
    status: "live",
    category: "Developer Tools",
    features: ["Schema-based", "Validation", "Custom Fields"],
  },
  {
    id: "add-api-to-mcp",
    name: "Add API to MCP",
    description: "Register and manage APIs in the Model Context Protocol server.",
    status: "live",
    category: "Developer Tools",
    features: ["API Registration", "MCP Integration", "Auto Schema"],
  },
  {
    id: "imagekit",
    name: "ImageKit",
    description: "Image optimization, transformation, and CDN delivery service.",
    status: "live",
    category: "Storage & Files",
    features: ["Image Optimization", "CDN", "Transformations"],
  },
  {
    id: "site-status",
    name: "Site Status",
    description: "Monitor website uptime and performance with alerts.",
    status: "live",
    category: "Monitoring & Analytics",
    features: ["Uptime Monitoring", "Alerts", "Response Time"],
  },
  {
    id: "repo-monitoring",
    name: "Repo Monitoring",
    description: "GitHub repository monitoring for commits, PRs, and issues.",
    status: "live",
    category: "Monitoring & Analytics",
    features: ["GitHub Integration", "PR Tracking", "Issue Alerts"],
  },
  {
    id: "click-tracking",
    name: "Click Tracking",
    description: "Track user clicks with custom addresses like 'login.button.click'.",
    status: "live",
    category: "Monitoring & Analytics",
    features: ["Custom Events", "Heatmaps", "Analytics Dashboard"],
  },
  {
    id: "translations",
    name: "Translations",
    description: "Internationalization and localization management for multi-language support.",
    status: "live",
    category: "Content & Media",
    features: ["i18n", "Locales Management", "Auto Translation"],
  },
  {
    id: "themes",
    name: "Themes",
    description: "Theme management and component styling for consistent UI/UX.",
    status: "live",
    category: "Content & Media",
    features: ["Theme Builder", "Component Tokens", "Dark Mode"],
  },
  {
    id: "deployments",
    name: "Deployments",
    description: "Deploy and manage applications across multiple environments.",
    status: "live",
    category: "Infrastructure",
    features: ["Multi-env", "CI/CD", "Rollback"],
  },
  {
    id: "queue",
    name: "Queue",
    description: "Message queue and background job processing service.",
    status: "live",
    category: "Infrastructure",
    features: ["Job Queue", "Retry Logic", "Priority Queues"],
  },
  {
    id: "dynamic-crud",
    name: "Dynamic CRUD",
    description: "Auto-generate CRUD operations for database models.",
    status: "live",
    category: "Infrastructure",
    features: ["Auto API", "Schema Sync", "Validation"],
  },
  {
    id: "payments",
    name: "Payments",
    description: "Payment processing with refunds, subscriptions, and transaction tracking.",
    status: "live",
    category: "Infrastructure",
    features: ["Stripe", "Subscriptions", "Refunds", "Invoices"],
  },
  {
    id: "events",
    name: "Events",
    description: "Event-driven architecture with webhook support for real-time actions.",
    status: "live",
    category: "Infrastructure",
    features: ["PubSub", "Webhooks", "Event History"],
  },
  {
    id: "in-memory-database",
    name: "In-memory Database",
    description: "Redis-like in-memory data store for caching and sessions.",
    status: "live",
    category: "Infrastructure",
    features: ["Redis-compatible", "Sessions", "Cache"],
  },
  {
    id: "cron-jobs",
    name: "Cron Jobs",
    description: "Schedule recurring tasks with webhook support for real-time actions.",
    status: "live",
    category: "Infrastructure",
    features: ["Scheduler", "Webhook Triggers", "Job History"],
  },
];

export const STATUS_LABELS: Readonly<Record<PlatformStatus, string>> = {
  live: "Live",
  dev: "In development",
  soon: "Coming soon",
};

/** URL-safe id for a category heading, e.g. "Storage & Files" → "storage-files". */
export const categorySlug = (category: string): string =>
  category.toLowerCase().replaceAll("&", " ").trim().replaceAll(/\s+/g, "-");

export interface PlatformGroup {
  category: string;
  slug: string;
  services: readonly PlatformService[];
}

/** Services grouped in category order; empty categories are dropped. */
export const groupPlatformServices = (
  services: readonly PlatformService[],
  order: readonly string[]
): PlatformGroup[] =>
  order
    .map((category) => ({
      category,
      slug: categorySlug(category),
      services: services.filter((service) => service.category === category),
    }))
    .filter((group) => group.services.length > 0);

/** The hero's proof: one stat per status that has services, plus the category count. */
export const platformStats = (
  services: readonly PlatformService[],
  groups: readonly PlatformGroup[]
): { value: string; label: string }[] => {
  const statuses = Object.keys(STATUS_LABELS) as PlatformStatus[];
  const byStatus = statuses
    .map((status) => ({
      value: String(services.filter((service) => service.status === status).length),
      label: STATUS_LABELS[status],
    }))
    .filter((stat) => stat.value !== "0");
  return [...byStatus, { value: String(groups.length), label: "Categories" }];
};

export const platformMeta = {
  title: "Exyconn Infrastructure Platform | Services",
  description:
    "Explore Exyconn's comprehensive infrastructure platform. Email, SMS, payments, logs, themes, translations, and 25+ services ready to power your application.",
  keywords:
    "infrastructure platform, API services, email service, payment processing, logging, themes, translations, Exyconn",
  image:
    "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&w=1200&q=80",
};

export const platformHero: {
  title: string;
  lede: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "One platform behind your application",
  lede: "Complete infrastructure powering your applications. Email, payments, logs, themes, translations and more — all in one place.",
  primary: { label: "Contact sales", href: "/contact" },
  secondary: { label: "AI services", href: "/ai-services" },
};

export const platformIntegration = [
  { title: "REST API", text: "Comprehensive REST endpoints for all services." },
  { title: "SDKs", text: "JavaScript, Python, and more coming soon." },
  { title: "MCP ready", text: "AI agent compatible via Model Context Protocol." },
];

export const directoryCopy = {
  filterLabel: "Filter platform services",
  sheetLabel: "Categories",
  chipsLabel: "Category",
  allLabel: "All",
  searchLabel: "Search",
  searchPlaceholder: "Search services or features",
  countTemplate: "{shown} of {total} services",
  empty: "No service matches that search. Clear the filters to see all of them.",
  serviceOne: "service",
  serviceMany: "services",
};

export const platformChapters = {
  directory: {
    label: "Directory",
    title: "Every service, by category",
    lede: "All services at a glance, with their status and key features.",
  },
  integration: {
    label: "Integration",
    title: "Easy to integrate",
    lede: "All services are accessible via REST API with comprehensive documentation and SDKs.",
  },
  explore: { label: "Explore", title: "Services, pillars and AI" },
};

export const platformCta: {
  title: string;
  text: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Ready to get started?",
  text: "Access the complete infrastructure stack and launch your product faster.",
  primary: { label: "Get started", href: "/contact" },
  secondary: { label: "Explore AI services", href: "/ai-services" },
};
