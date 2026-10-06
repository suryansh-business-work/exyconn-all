/**
 * Every page of exyconn.com that sitemap.xml lists, in its order (unprefixed; home is ""). The
 * AI service pages come from the CMS catalogue (src/lib/cms/ai-services.ts). llms.txt
 * describes the main ones itself and leaves these out of its "More pages".
 */
export const sitePages = (aiServicePaths: readonly string[]): string[] => [
  "",
  "/about-us",
  "/contact",
  "/cookies",
  "/exyconn-services",
  "/get-a-quote",
  "/grievance",
  "/legal",
  "/our-services",
  "/our-vision",
  "/privacy-policy",
  // AI Services
  "/ai-services",
  ...aiServicePaths,
  // Services
  "/services",
  "/services/application-modernization",
  "/services/automation-integration",
  "/services/data-analytics",
  "/services/digital-consulting",
  "/services/digital-marketing",
  "/services/enterprise-application",
  "/services/maintenance",
  "/services/mobile-application-development",
  "/services/software-as-a-service",
  "/services/software-development-outsourcing",
  "/services/whatsapp-chatbot",
  // AI
  "/ai",
  "/ai/agentic",
  "/ai/bot-creation",
  "/ai/custom-model-training",
  "/ai/llms",
  "/ai/mcp-server",
  "/ai/models",
  "/ai/workflows",
  // Career
  "/career",
  "/career/gigs",
  // Case Studies
  "/case-studies",
  // Blog
  "/blog",
  // Order Agents
  "/order-agents",
];
