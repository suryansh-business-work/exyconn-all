/**
 * What is NOT one company's data.
 *
 * Everything else is tenant data and is filtered by organization — the default, so a model
 * added later is private to its company unless somebody deliberately lists it here.
 *
 * Three kinds live here: the platform's own records (organizations, the audit of platform
 * actions), the install's shared infrastructure (SMTP, ImageKit, GitHub, Slack, AI prices —
 * one set of credentials for the whole server), and Exyconn's own public presence
 * (exyconn.com's content and the public status page), which belongs to no customer.
 */
export const PLATFORM_MODELS: ReadonlySet<string> = new Set([
  // The tenancy itself.
  'Organization',
  // Shared infrastructure, configured once for the install (Tech portal).
  'EmailConfig',
  'ImageConfig',
  'GithubConfig',
  'SlackConfig',
  'OpenAiConfig',
  'PexelsConfig',
  // The social networks' OAuth apps, registered once for the install, and the short-lived
  // state of a connection in progress (looked up by the provider's callback, before any scope).
  'SocialAppConfig',
  'SocialOAuthState',
  'TrackerBuildSettings',
  // NOTE: the support mailbox (InboundMailConfig) is deliberately NOT here — a company reads
  // its own mailbox into its own tickets, so each configures one in Tech.
  'AiModelPrice',
  // Exyconn's own site and public status page — not a customer's data.
  'BlogPost',
  'CaseStudy',
  'Gig',
  'Job',
  'JobCompany',
  'NavLink',
  'WebsiteSubmission',
  'Tool',
  'ToolCategory',
  'StatusMonitor',
  'StatusDaily',
  'StatusIncident',
  'StatusMaintenance',
  'StatusSubscriber',
  'ProblemReport',
  // Client error reports: tagged with the organization, read by the platform's own Tech desk.
  'AppLogEvent',
  'AppLogGroup',
  // The translation catalogue is shared: a phrase translated once serves every company.
  'Translation',
  // Sign-in artefacts, looked up before an organization is known.
  'PasswordResetToken',
]);

/**
 * Unique fields that stay unique across the whole platform rather than per organization.
 *
 * Only sign-in identity: a person signs in with an email address alone, so two companies
 * cannot both own one. Every other unique field (an invoice number, a product SKU) becomes
 * unique WITHIN a company — see scopeUniqueIndexes in tenant-plugin.ts.
 */
export const PLATFORM_UNIQUE_PATHS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['User', new Set(['email'])],
]);
