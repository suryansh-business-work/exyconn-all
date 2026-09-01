/**
 * The AI service catalogue.
 *
 * Single source of truth for the home page section, the /ai-services listing
 * and each service's detail page, so a service is described once and every
 * surface (including its meta tags) stays in step.
 *
 * Site content that changes often — blog, tools, careers — comes from the
 * portal DB; the service catalogue is a stable positioning statement and lives
 * with the code, matching how /services and /our-services already work.
 */
export interface AiService {
  /** URL segment under /ai-services. */
  slug: string;
  title: string;
  /** One line for cards; keep under ~120 chars. */
  summary: string;
  /** Two or three sentences for the detail page. */
  description: string;
  /** What the engagement actually delivers. */
  outcomes: string[];
  /** Font Awesome icon class, matching the rest of the site. */
  icon: string;
  /** Tailwind gradient stops. */
  color: string;
  categorySlug: string;
}

export interface AiServiceCategory {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

export const aiServiceCategories: AiServiceCategory[] = [
  {
    slug: 'agents-automation',
    title: 'Agents & Automation',
    description: 'Agents that carry out real work across your tools, not chatbots that only answer questions.',
    icon: 'fa-robot',
  },
  {
    slug: 'revenue-growth',
    title: 'Revenue & Growth',
    description: 'AI on the commercial front line — pipeline, campaigns, support and checkout.',
    icon: 'fa-chart-line',
  },
  {
    slug: 'vertical-platforms',
    title: 'Industry Platforms',
    description: 'Vertical AI software shaped around how one industry actually operates.',
    icon: 'fa-layer-group',
  },
  {
    slug: 'business-operations',
    title: 'Business Operations',
    description: 'The back office — hiring, finance and compliance — with the manual passes removed.',
    icon: 'fa-briefcase',
  },
  {
    slug: 'platform-infrastructure',
    title: 'Platform & Infrastructure',
    description: 'The layer your AI features are built on: retrieval, data, APIs and observability.',
    icon: 'fa-server',
  },
  {
    slug: 'trust-security',
    title: 'Trust & Security',
    description: 'Keeping AI systems defensible — controlled, monitored and safe to put in front of customers.',
    icon: 'fa-shield-halved',
  },
];

export const aiServices: AiService[] = [
  // ── Agents & Automation ──────────────────────────────────────────────────
  {
    slug: 'ai-agents-for-smbs',
    title: 'AI Agents for SMBs',
    summary: 'Production AI agents sized and priced for small and mid-sized businesses.',
    description:
      'Most AI agent projects are scoped for enterprises with a team to run them. We build agents a small business can actually operate: connected to the tools you already use, with clear limits on what they may do on their own. You get a working agent handling a real task, not a pilot that stalls after the demo.',
    outcomes: [
      'An agent live on one high-volume task within weeks',
      'Connected to your existing CRM, inbox and spreadsheets',
      'Explicit approval steps wherever money or customers are involved',
      'Handover documentation so your team can adjust it without us',
    ],
    icon: 'fa-robot',
    color: 'from-blue-500 to-cyan-500',
    categorySlug: 'agents-automation',
  },
  {
    slug: 'ai-workflow-automation',
    title: 'AI Workflow Automation',
    summary: 'End-to-end processes automated across the systems that already run your business.',
    description:
      'Rule-based automation breaks on anything unstructured — an email that phrases things differently, an invoice in a new layout. We combine deterministic steps with AI for the judgement calls, so a whole workflow completes instead of stopping at the first exception.',
    outcomes: [
      'A mapped process with the manual handoffs identified',
      'Automation across systems, not inside a single tool',
      'Exceptions routed to a person instead of failing silently',
      'Run history you can audit when something looks wrong',
    ],
    icon: 'fa-diagram-project',
    color: 'from-indigo-500 to-blue-500',
    categorySlug: 'agents-automation',
  },
  {
    slug: 'ai-voice-agents',
    title: 'AI Voice Agents',
    summary: 'Voice agents that book, qualify and answer on live calls.',
    description:
      'Voice agents that hold a real conversation, handle interruptions and pass to a human the moment they should. We tune them on your actual call recordings, so they use your language and know the questions your customers really ask.',
    outcomes: [
      'Inbound calls answered around the clock',
      'Outbound qualification and appointment booking',
      'Clean handover to a human with the context attached',
      'Transcripts and outcomes written back to your CRM',
    ],
    icon: 'fa-phone-volume',
    color: 'from-violet-500 to-purple-500',
    categorySlug: 'agents-automation',
  },
  {
    slug: 'ai-whatsapp-automation',
    title: 'AI WhatsApp Automation',
    summary: 'Sales and support on WhatsApp, automated on the official Business API.',
    description:
      'For a large share of customers WhatsApp is the primary channel. We build automations on the official Business API — template approval, opt-in handling and all — that answer questions, take orders and chase payments without putting your number at risk.',
    outcomes: [
      'Official Business API setup with approved templates',
      'Automated replies, order updates and payment reminders',
      'Escalation to a human agent inside the same thread',
      'Conversations logged against the customer record',
    ],
    icon: 'fa-comment-dots',
    color: 'from-green-500 to-emerald-500',
    categorySlug: 'agents-automation',
  },
  {
    slug: 'ai-document-processing',
    title: 'AI Document Processing',
    summary: 'Invoices, contracts and forms turned into structured data you can trust.',
    description:
      'Extraction from documents that vary in layout, quality and language — scanned invoices, signed contracts, handwritten forms. Every field carries a confidence score, and anything below your threshold goes to a reviewer rather than quietly entering your system wrong.',
    outcomes: [
      'Structured output from PDFs, scans and photos',
      'Confidence scores with a human review queue',
      'Validation against your existing records',
      'Straight into your ERP or accounting system',
    ],
    icon: 'fa-file-invoice',
    color: 'from-amber-500 to-orange-500',
    categorySlug: 'agents-automation',
  },
  {
    slug: 'ai-personal-assistant',
    title: 'AI Personal Assistant',
    summary: 'An assistant across inbox, calendar and notes that knows your business context.',
    description:
      'A private assistant for you or your leadership team: drafting replies in your voice, preparing you for meetings, keeping track of commitments made in conversation. It works from your own data and stays inside your own tenancy.',
    outcomes: [
      'Inbox triage with drafts ready in your tone',
      'Meeting briefs assembled from prior threads and notes',
      'Commitments and follow-ups tracked automatically',
      'Runs in your tenancy, not a shared third-party account',
    ],
    icon: 'fa-user-astronaut',
    color: 'from-sky-500 to-blue-500',
    categorySlug: 'agents-automation',
  },

  // ── Revenue & Growth ─────────────────────────────────────────────────────
  {
    slug: 'ai-sales-automation',
    title: 'AI Sales Automation',
    summary: 'Research, outreach and follow-up handled so reps spend their time in conversations.',
    description:
      'Selling time disappears into research, data entry and follow-up. We automate the surrounding work: prospect research, personalised first touches, CRM hygiene and follow-up sequences that stop the moment a human replies.',
    outcomes: [
      'Prospect research and enrichment before the first touch',
      'Personalised outreach that reads as written by a person',
      'Follow-up that halts on any genuine reply',
      'CRM records updated without rep data entry',
    ],
    icon: 'fa-bullseye',
    color: 'from-rose-500 to-pink-500',
    categorySlug: 'revenue-growth',
  },
  {
    slug: 'ai-customer-support',
    title: 'AI Customer Support',
    summary: 'Deflect the repetitive tickets and hand the rest over with full context.',
    description:
      'Support AI grounded in your documentation and past resolutions, so it answers from what is true for your product rather than what sounds plausible. It escalates early on anything ambiguous, because a wrong confident answer costs more than a transfer.',
    outcomes: [
      'Answers grounded in your docs and resolved tickets',
      'Measured deflection rate, not a vanity number',
      'Escalation with the full conversation attached',
      'Gaps in your documentation surfaced from real questions',
    ],
    icon: 'fa-headset',
    color: 'from-teal-500 to-cyan-500',
    categorySlug: 'revenue-growth',
  },
  {
    slug: 'ai-marketing-automation',
    title: 'AI Marketing Automation',
    summary: 'Campaign production and personalisation at a volume a small team cannot reach manually.',
    description:
      'Content production, audience segmentation and campaign variants generated and tested continuously. Brand voice is defined once and applied everywhere, so scale does not turn into a wall of generic copy.',
    outcomes: [
      'Campaign content produced against a defined brand voice',
      'Segmentation driven by behaviour, not static lists',
      'Variant testing running continuously',
      'Performance reported against pipeline, not opens',
    ],
    icon: 'fa-bullhorn',
    color: 'from-fuchsia-500 to-purple-500',
    categorySlug: 'revenue-growth',
  },
  {
    slug: 'ai-ecommerce-automation',
    title: 'AI E-commerce Automation',
    summary: 'Catalogue, merchandising and post-purchase messaging automated across your storefront.',
    description:
      'Product data enrichment, description generation, search relevance and post-purchase messaging for stores with catalogues too large to maintain by hand. Built on your existing platform rather than a replatform.',
    outcomes: [
      'Product copy and attributes generated at catalogue scale',
      'Search and recommendations tuned on real behaviour',
      'Automated post-purchase and win-back messaging',
      'Works on your current platform',
    ],
    icon: 'fa-cart-shopping',
    color: 'from-orange-500 to-red-500',
    categorySlug: 'revenue-growth',
  },
  {
    slug: 'agentic-commerce',
    title: 'Agentic Commerce',
    summary: 'Make your catalogue and checkout usable by AI agents that buy on a customer’s behalf.',
    description:
      'Buying is beginning to happen through assistants rather than storefronts. We prepare your catalogue, pricing and checkout to be readable and transactable by agents, with the authentication and spend controls that make automated purchasing safe on both sides.',
    outcomes: [
      'Machine-readable catalogue and pricing',
      'Agent-safe checkout with scoped authorisation',
      'Spend limits and verification on automated purchases',
      'Positioned for assistant-driven buying as it grows',
    ],
    icon: 'fa-robot',
    color: 'from-cyan-500 to-blue-500',
    categorySlug: 'revenue-growth',
  },

  // ── Industry Platforms ───────────────────────────────────────────────────
  {
    slug: 'vertical-ai-saas',
    title: 'Vertical AI SaaS',
    summary: 'A complete AI SaaS product built for one industry — from idea to launch.',
    description:
      'We build and ship vertical AI products end to end: the domain model, the application, the AI layer and the commercial scaffolding around it. For founders and operators who know an industry deeply and need a product built the way that industry actually works.',
    outcomes: [
      'Product and domain model defined with your expertise',
      'Multi-tenant application with billing and onboarding',
      'AI features grounded in industry-specific data',
      'Launched, then iterated on real usage',
    ],
    icon: 'fa-layer-group',
    color: 'from-indigo-500 to-violet-500',
    categorySlug: 'vertical-platforms',
  },
  {
    slug: 'ai-healthcare-software',
    title: 'AI Healthcare Software',
    summary: 'Clinical and administrative AI built to the handling rules healthcare requires.',
    description:
      'Documentation, triage support and administrative automation for healthcare providers, built around patient data handling obligations from the start. Clinical judgement stays with clinicians; the software removes the paperwork surrounding it.',
    outcomes: [
      'Consultation documentation drafted automatically',
      'Administrative and billing workflows automated',
      'Patient data handling designed to your jurisdiction',
      'Clinician review retained on anything clinical',
    ],
    icon: 'fa-heart-pulse',
    color: 'from-red-500 to-rose-500',
    categorySlug: 'vertical-platforms',
  },
  {
    slug: 'ai-real-estate-software',
    title: 'AI Real Estate Software',
    summary: 'Listing, lead and document workflows automated for property businesses.',
    description:
      'Listing content generation, lead qualification and the document-heavy parts of a property transaction. Built for brokerages and property platforms where speed of response decides who wins the client.',
    outcomes: [
      'Listing copy and marketing assets generated per property',
      'Enquiries qualified and routed within minutes',
      'Transaction paperwork extracted and checked',
      'Integrated with your CRM and portals',
    ],
    icon: 'fa-building',
    color: 'from-amber-500 to-yellow-500',
    categorySlug: 'vertical-platforms',
  },
  {
    slug: 'ai-education-edtech',
    title: 'AI Education / EdTech',
    summary: 'Adaptive learning, assessment and teaching tools for education providers.',
    description:
      'Content generation, adaptive practice and assessment support for institutions and EdTech products. Designed so teaching staff keep oversight of what learners are shown and how their work is judged.',
    outcomes: [
      'Course material and practice generated to a syllabus',
      'Difficulty adapted to individual learner progress',
      'Assessment support with educator review',
      'Progress analytics for teaching teams',
    ],
    icon: 'fa-graduation-cap',
    color: 'from-blue-500 to-indigo-500',
    categorySlug: 'vertical-platforms',
  },
  {
    slug: 'ai-logistics-supply-chain',
    title: 'AI Logistics & Supply Chain',
    summary: 'Forecasting, routing and exception handling across your supply chain.',
    description:
      'Demand forecasting, route and load optimisation, and automated handling of the exceptions that consume a logistics team’s day. Built to work with the mixed data quality real supply chains actually have.',
    outcomes: [
      'Demand forecasts at SKU and location level',
      'Route and load planning optimised against real constraints',
      'Delays and exceptions flagged before they escalate',
      'Documentation and customs paperwork automated',
    ],
    icon: 'fa-truck-fast',
    color: 'from-emerald-500 to-teal-500',
    categorySlug: 'vertical-platforms',
  },
  {
    slug: 'ai-saas-for-local-businesses',
    title: 'AI SaaS for Local Businesses',
    summary: 'Bookings, reviews and customer messaging automated for businesses with a physical presence.',
    description:
      'Clinics, salons, restaurants and trades need AI that fits a working day, not an IT department. We build simple, reliable automation for bookings, reminders, reviews and repeat custom — set up once and left to run.',
    outcomes: [
      'Bookings and reminders handled automatically',
      'Review requests timed to the visit',
      'Missed-call and after-hours enquiry follow-up',
      'Set up for you, with nothing to administer',
    ],
    icon: 'fa-store',
    color: 'from-lime-500 to-green-500',
    categorySlug: 'vertical-platforms',
  },

  // ── Business Operations ──────────────────────────────────────────────────
  {
    slug: 'ai-hr-recruitment',
    title: 'AI HR & Recruitment',
    summary: 'Screening, scheduling and onboarding automated with bias controls built in.',
    description:
      'Sourcing, screening and interview scheduling automated, plus onboarding that runs itself. Screening criteria are explicit and auditable, because hiring decisions have to be explainable to candidates and regulators alike.',
    outcomes: [
      'Applications screened against stated, auditable criteria',
      'Interview scheduling coordinated automatically',
      'Onboarding tasks generated per role',
      'Decision records kept for audit',
    ],
    icon: 'fa-users',
    color: 'from-purple-500 to-indigo-500',
    categorySlug: 'business-operations',
  },
  {
    slug: 'ai-recruitment-marketplace',
    title: 'AI Recruitment Marketplace',
    summary: 'Two-sided hiring platforms with matching that improves as they are used.',
    description:
      'For businesses building a hiring marketplace rather than hiring into one. We build the matching engine, the supply and demand mechanics, and the trust features a two-sided market needs before it can grow.',
    outcomes: [
      'Matching engine tuned on placement outcomes',
      'Two-sided onboarding and verification',
      'Reputation and trust mechanics',
      'Marketplace analytics on liquidity and fill rate',
    ],
    icon: 'fa-handshake',
    color: 'from-pink-500 to-rose-500',
    categorySlug: 'business-operations',
  },
  {
    slug: 'ai-finance-accounting',
    title: 'AI Finance & Accounting',
    summary: 'Reconciliation, payables and reporting automated with the audit trail intact.',
    description:
      'Invoice capture, reconciliation, expense checking and reporting automated for finance teams. Every automated step leaves a record, because finance automation is only useful if it survives an audit.',
    outcomes: [
      'Invoice and receipt capture into your ledger',
      'Reconciliation with exceptions flagged for review',
      'Expense policy checks applied consistently',
      'A complete audit trail on every automated action',
    ],
    icon: 'fa-calculator',
    color: 'from-teal-500 to-emerald-500',
    categorySlug: 'business-operations',
  },
  {
    slug: 'ai-compliance-automation',
    title: 'AI Compliance Automation',
    summary: 'Evidence collection and control monitoring kept current instead of rebuilt each audit.',
    description:
      'Continuous evidence collection, policy mapping and control monitoring so an audit is a report rather than a project. Built for teams carrying obligations like SOC 2, ISO 27001 or sector-specific regimes.',
    outcomes: [
      'Evidence collected continuously, not before the audit',
      'Controls mapped across overlapping frameworks',
      'Drift and gaps flagged as they appear',
      'Audit reports produced from live data',
    ],
    icon: 'fa-clipboard-check',
    color: 'from-slate-500 to-gray-600',
    categorySlug: 'business-operations',
  },

  // ── Platform & Infrastructure ────────────────────────────────────────────
  {
    slug: 'ai-rag-platform',
    title: 'AI RAG Platform',
    summary: 'Retrieval that grounds answers in your own content, with citations.',
    description:
      'Retrieval-augmented generation done properly: ingestion and chunking suited to your documents, retrieval you can evaluate, and citations on every answer. Most disappointing AI features fail at retrieval, not at the model.',
    outcomes: [
      'Ingestion pipeline for your document formats',
      'Retrieval quality measured against a real question set',
      'Citations back to the source passage',
      'Permissions respected so answers never leak content',
    ],
    icon: 'fa-magnifying-glass-chart',
    color: 'from-blue-500 to-sky-500',
    categorySlug: 'platform-infrastructure',
  },
  {
    slug: 'ai-knowledge-management',
    title: 'AI Knowledge Management',
    summary: 'Scattered institutional knowledge made searchable and kept current.',
    description:
      'Knowledge spread across wikis, drives, tickets and chat threads, unified into something answerable. Includes the harder half: spotting what has gone stale or contradicts itself, so the corpus does not rot.',
    outcomes: [
      'One answerable surface across your systems',
      'Stale and conflicting content surfaced',
      'Access controls respected in every answer',
      'Usage data showing what people cannot find',
    ],
    icon: 'fa-book-open',
    color: 'from-violet-500 to-fuchsia-500',
    categorySlug: 'platform-infrastructure',
  },
  {
    slug: 'ai-data-analytics',
    title: 'AI Data & Analytics',
    summary: 'Pipelines and analysis that make your data usable for AI in the first place.',
    description:
      'AI features are only as good as the data behind them. We build the pipelines, modelling and quality checks that make data trustworthy, then the analysis layer that lets people ask questions of it directly.',
    outcomes: [
      'Pipelines with quality checks and monitoring',
      'A modelled layer analysts and AI can both use',
      'Natural-language querying over governed data',
      'Metrics defined once, consistent everywhere',
    ],
    icon: 'fa-chart-column',
    color: 'from-cyan-500 to-teal-500',
    categorySlug: 'platform-infrastructure',
  },
  {
    slug: 'ai-api-infrastructure',
    title: 'AI API / Infrastructure',
    summary: 'The serving layer behind your AI features — routing, caching and cost control.',
    description:
      'Gateways, model routing, caching, rate limiting and failover, so AI features stay fast and affordable under real traffic. Model choice becomes a configuration decision rather than a rewrite.',
    outcomes: [
      'A gateway with routing and automatic failover',
      'Caching and batching to cut inference spend',
      'Per-tenant rate limits and quotas',
      'Model swaps without touching product code',
    ],
    icon: 'fa-server',
    color: 'from-indigo-500 to-blue-600',
    categorySlug: 'platform-infrastructure',
  },
  {
    slug: 'ai-observability',
    title: 'AI Observability',
    summary: 'See what your AI actually did, what it cost and where quality is slipping.',
    description:
      'Tracing, evaluation and cost attribution for AI systems. Conventional monitoring says a request succeeded; it cannot say the answer was wrong. This is the tooling that catches quality regressions before customers report them.',
    outcomes: [
      'Full traces of prompts, retrievals and tool calls',
      'Automated evaluation against a regression set',
      'Cost attributed by feature, tenant and model',
      'Alerts on quality drift, not just errors',
    ],
    icon: 'fa-gauge-high',
    color: 'from-amber-500 to-orange-600',
    categorySlug: 'platform-infrastructure',
  },
  {
    slug: 'ai-developer-tools',
    title: 'AI Developer Tools',
    summary: 'Internal tooling that makes your own engineers measurably faster.',
    description:
      'Code assistants grounded in your codebase, review automation and internal developer platforms. Tuned to your conventions, so suggestions match how your team writes code rather than a generic average.',
    outcomes: [
      'Assistance grounded in your codebase and conventions',
      'Automated review for the repetitive classes of comment',
      'Internal tooling and scaffolding for your stack',
      'Adoption measured on cycle time, not licence count',
    ],
    icon: 'fa-code',
    color: 'from-slate-600 to-gray-700',
    categorySlug: 'platform-infrastructure',
  },

  // ── Trust & Security ─────────────────────────────────────────────────────
  {
    slug: 'ai-cybersecurity',
    title: 'AI Cybersecurity',
    summary: 'Detection and response strengthened with AI — including securing your AI itself.',
    description:
      'Two halves: using AI to improve detection, triage and response, and securing the AI systems you are deploying against prompt injection, data exfiltration and model abuse. The second half is routinely skipped.',
    outcomes: [
      'Alert triage and enrichment automated',
      'Anomaly detection tuned to your environment',
      'AI systems tested against prompt injection and abuse',
      'Response runbooks with automated first steps',
    ],
    icon: 'fa-shield-halved',
    color: 'from-red-500 to-orange-600',
    categorySlug: 'trust-security',
  },
  {
    slug: 'ai-governance-guardrails',
    title: 'AI Governance & Guardrails',
    summary: 'Policy, controls and evidence that keep AI defensible as regulation tightens.',
    description:
      'The controls that make AI safe to put in front of customers and regulators: input and output guardrails, approval boundaries, model inventories and decision records. Built to the emerging obligations rather than after them.',
    outcomes: [
      'Guardrails on inputs, outputs and tool use',
      'Approval boundaries for consequential actions',
      'A model and use-case inventory with owners',
      'Decision records that stand up to scrutiny',
    ],
    icon: 'fa-scale-balanced',
    color: 'from-blue-600 to-indigo-600',
    categorySlug: 'trust-security',
  },
];

/** Services belonging to a category, in catalogue order. */
export const servicesInCategory = (categorySlug: string): AiService[] =>
  aiServices.filter((service) => service.categorySlug === categorySlug);

export const findAiService = (slug: string): AiService | undefined =>
  aiServices.find((service) => service.slug === slug);

export const findAiServiceCategory = (slug: string): AiServiceCategory | undefined =>
  aiServiceCategories.find((category) => category.slug === slug);
