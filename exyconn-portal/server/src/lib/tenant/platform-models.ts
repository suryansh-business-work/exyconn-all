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
  // The registrar and DNS credentials behind Tech > Security > Cloudflare, and the record of
  // every nameserver change made there — exyconn.com's own DNS, not any company's.
  'GodaddyConfig',
  'CloudflareConfig',
  'NameserverChange',
  'SonarConfig',
  // Exyconn's own payment gateway accounts, which clients pay invoices through (client hub).
  'StripeConfig',
  'RazorpayConfig',
  'PaypalConfig',
  'PayoneerConfig',
  // The social networks' OAuth apps, registered once for the install, and the short-lived
  // state of a connection in progress (looked up by the provider's callback, before any scope).
  'SocialAppConfig',
  'SocialOAuthState',
  // "Continue with Google" on the portal sign-in: the install's OAuth client, and the state and
  // one-time ticket of a sign-in in progress (both read before anyone, or any company, is known).
  'GoogleSignInConfig',
  'GoogleSignInState',
  'GoogleSignInTicket',
  // The Google client the operator's CRM Gmail connects through (Tech > Environment Variables >
  // Gmail), the mailboxes connected with it (CRM > Connect Gmail), and a connection in
  // progress. The messages they sync (CrmEmailMessage) are CRM data and stay company-scoped.
  'GmailConfig',
  'GmailAccount',
  'GmailOAuthState',
  // The same for Microsoft (Outlook / Microsoft 365): the Entra app, the operator CRM's
  // connected mailboxes and a connection in progress.
  'MicrosoftMailConfig',
  'MicrosoftMailAccount',
  'MicrosoftOAuthState',
  'TrackerBuildSettings',
  // The AI calling bot demo (demos.exyconn.com/calling-bot-demo): its settings and its calls
  // belong to the install, and its voice server reads and writes them with no company in scope.
  'CallingBotConfig',
  // How the email verifier reaches mail servers (a SOCKS5 proxy): one for the install.
  'EmailVerifierConfig',
  // The Google Maps Platform keys behind the CRM lead generator and maps: one for the install.
  'GoogleMapsConfig',
  // The Firecrawl account behind the CRM website scraper: one for the install.
  'FirecrawlConfig',
  'CallingBotCall',
  'CallingBotScenario',
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
  // The website captcha's spent questions — exyconn.com's own, not a company's.
  'WebsiteCaptchaUse',
  // Share links to the exyconn.com GCC cost calculator's estimates, made by anonymous visitors.
  'GccShare',
  'Tool',
  'ToolCategory',
  // The website CMS: every site, page, fragment, design system, image and newsletter.
  'CmsSite',
  'CmsDesignSystem',
  'CmsPage',
  'CmsPageRevision',
  'CmsFragment',
  'CmsAsset',
  'NewsletterIssue',
  'NewsletterSubscriber',
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
  // The Meeting Assistant Chrome extension: Exyconn ships one build for every company (each
  // picks its channel), and a Google Meet connection in progress is read by the OAuth callback
  // before any company is known.
  'MaExtensionRelease',
  'MaGoogleOAuthState',
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
  // A client hub contact signs in by address alone, so an address names one contact.
  ['ClientContact', new Set(['email'])],
  // A booking link (status.exyconn.com/book/<slug>) names no company, so a slug names one type.
  ['MeetingType', new Set(['slug'])],
]);
