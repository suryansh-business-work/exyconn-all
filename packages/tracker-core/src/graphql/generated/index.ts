import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  JSON: { input: any; output: any; }
};

export type ActivityInput = {
  /** The user to remind; required with remindAt. */
  assigneeId: InputMaybe<Scalars['String']['input']>;
  attachments: InputMaybe<Array<FileAttachmentInput>>;
  done: Scalars['Boolean']['input'];
  dueDate: InputMaybe<Scalars['DateTime']['input']>;
  durationSeconds: InputMaybe<Scalars['Int']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  relatedId: InputMaybe<Scalars['String']['input']>;
  relatedName: InputMaybe<Scalars['String']['input']>;
  relatedType: ActivitySubject;
  /** Set to email the assignee at this time (must be in the future); null removes the reminder. */
  remindAt: InputMaybe<Scalars['DateTime']['input']>;
  subject: Scalars['String']['input'];
  type: ActivityType;
};

export type ActivitySubject =
  | 'COMPANY'
  | 'CONTACT'
  | 'DEAL';

export type ActivityType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'NOTE'
  | 'TASK';

/** The documents the shared assist button can draft. */
export type AiDraftKind =
  | 'EMAIL_REPLY'
  | 'JOB_DESCRIPTION'
  | 'MEETING_NOTES'
  | 'RELEASE_NOTE';

/** A job is always created QUEUED — only running it moves the status on. */
export type AiJobInput = {
  model: Scalars['String']['input'];
  name: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
};

export type AiJobStatus =
  | 'FAILED'
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED';

export type AiModelPriceInput = {
  active: Scalars['Boolean']['input'];
  inputPer1kUsd: Scalars['Float']['input'];
  model: Scalars['String']['input'];
  outputPer1kUsd: Scalars['Float']['input'];
};

export type AiSpendLimitInput = {
  enabled: Scalars['Boolean']['input'];
  monthlyUsdCap: Scalars['Float']['input'];
  perUserDailyUsdCap: Scalars['Float']['input'];
};

export type AnnouncementAudience =
  | 'ALL'
  | 'DEPARTMENT'
  | 'EMPLOYEES';

export type AnnouncementCategory =
  | 'EVENT'
  /** IT: planned maintenance window. */
  | 'MAINTENANCE'
  | 'NOTICE'
  /** IT: a service is down right now. */
  | 'OUTAGE'
  | 'POLICY'
  /** IT: a security warning staff must act on. */
  | 'SECURITY_ALERT'
  | 'UPDATE';

export type AnnouncementInput = {
  audience: AnnouncementAudience;
  body: Scalars['String']['input'];
  category: AnnouncementCategory;
  /** Required when audience is DEPARTMENT. */
  department: InputMaybe<Scalars['String']['input']>;
  /** Required when audience is EMPLOYEES. */
  employeeIds: InputMaybe<Array<Scalars['String']['input']>>;
  expiresAt: InputMaybe<Scalars['DateTime']['input']>;
  pinned: Scalars['Boolean']['input'];
  publishedAt: Scalars['DateTime']['input'];
  title: Scalars['String']['input'];
};

export type AppLogBatchInput = {
  app: Scalars['String']['input'];
  appVersion: InputMaybe<Scalars['String']['input']>;
  deviceId: InputMaybe<Scalars['String']['input']>;
  deviceModel: InputMaybe<Scalars['String']['input']>;
  entries: Array<AppLogEntryInput>;
  osVersion: InputMaybe<Scalars['String']['input']>;
  platform: InputMaybe<Scalars['String']['input']>;
  sessionId: InputMaybe<Scalars['String']['input']>;
  source: AppLogSource;
  user: InputMaybe<AppLogUserInput>;
};

export type AppLogBreadcrumbInput = {
  at: Scalars['DateTime']['input'];
  level: AppLogLevel;
  message: Scalars['String']['input'];
};

export type AppLogEntryInput = {
  breadcrumbs: InputMaybe<Array<AppLogBreadcrumbInput>>;
  componentStack: InputMaybe<Scalars['String']['input']>;
  /** JSON text. */
  context: InputMaybe<Scalars['String']['input']>;
  count: InputMaybe<Scalars['Int']['input']>;
  errorName: InputMaybe<Scalars['String']['input']>;
  level: AppLogLevel;
  message: Scalars['String']['input'];
  occurredAt: Scalars['DateTime']['input'];
  route: InputMaybe<Scalars['String']['input']>;
  stack: InputMaybe<Scalars['String']['input']>;
};

export type AppLogLevel =
  | 'DEBUG'
  | 'ERROR'
  | 'INFO'
  | 'WARN';

export type AppLogSource =
  | 'DESKTOP'
  | 'MOBILE'
  | 'PORTAL'
  | 'SERVER';

export type AppLogStatus =
  | 'IGNORED'
  | 'OPEN'
  | 'RESOLVED';

/** The last signed-in user the client knew of — used only when the request carries no session. */
export type AppLogUserInput = {
  email: Scalars['String']['input'];
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type ApplicantInput = {
  companySlug: InputMaybe<Scalars['String']['input']>;
  coverLetter: Scalars['String']['input'];
  email: Scalars['String']['input'];
  jobCode: Scalars['String']['input'];
  jobTitle: Scalars['String']['input'];
  name: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  rating: Scalars['Int']['input'];
  resumeUrl: Scalars['String']['input'];
  source: ApplicantSource;
};

export type ApplicantSource =
  | 'MANUAL'
  | 'REFERRAL'
  | 'WEBSITE';

export type ApplicantStage =
  | 'HIRED'
  | 'INTERVIEW'
  | 'NEW'
  | 'OFFER'
  | 'REJECTED'
  | 'SCREENING';

/** Employee-facing leave application — the server sets employeeId and PENDING status. */
export type ApplyLeaveInput = {
  fromDate: Scalars['DateTime']['input'];
  reason: Scalars['String']['input'];
  toDate: Scalars['DateTime']['input'];
  type: Scalars['String']['input'];
};

export type ApprovalDecision =
  | 'APPROVED'
  | 'REJECTED';

export type ApprovalDelegationInput = {
  fromDate: Scalars['DateTime']['input'];
  note: InputMaybe<Scalars['String']['input']>;
  /** Inclusive — a delegation until Friday covers Friday. */
  toDate: Scalars['DateTime']['input'];
  toEmployeeId: Scalars['String']['input'];
};

export type AssetCategory =
  | 'DESKTOP'
  | 'LAPTOP'
  | 'MONITOR'
  | 'NETWORK'
  | 'OTHER'
  | 'PERIPHERAL'
  | 'PHONE'
  | 'PRINTER'
  | 'SOFTWARE_LICENCE'
  | 'TABLET';

/** Antivirus / EDR coverage of a device. */
export type AssetEdrStatus =
  | 'NOT_APPLICABLE'
  | 'OUTDATED'
  | 'PROTECTED'
  | 'UNPROTECTED';

export type AssetInput = {
  assetTag: Scalars['String']['input'];
  assignedToId: InputMaybe<Scalars['String']['input']>;
  assignedToName: InputMaybe<Scalars['String']['input']>;
  category: AssetCategory;
  edrCheckedAt: InputMaybe<Scalars['DateTime']['input']>;
  edrStatus: InputMaybe<AssetEdrStatus>;
  installedSoftware: InputMaybe<Array<Scalars['String']['input']>>;
  location: InputMaybe<Scalars['String']['input']>;
  manufacturer: InputMaybe<Scalars['String']['input']>;
  modelName: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  purchaseCost: InputMaybe<Scalars['Float']['input']>;
  purchaseDate: InputMaybe<Scalars['DateTime']['input']>;
  serialNumber: InputMaybe<Scalars['String']['input']>;
  status: AssetStatus;
  warrantyExpiry: InputMaybe<Scalars['DateTime']['input']>;
};

export type AssetStatus =
  | 'ASSIGNED'
  | 'IN_REPAIR'
  | 'IN_STOCK'
  | 'LOST'
  | 'RETIRED';

/** How a tracker mark-in was placed when no location could be read. */
export type AttendanceLocationFallback =
  /** Without any location. */
  | 'NONE'
  /** At the address on the employee's record. */
  | 'PROFILE_ADDRESS';

export type AttendanceStatus =
  | 'ABSENT'
  | 'HALF_DAY'
  | 'PRESENT'
  | 'WFH';

/** Where a matching company's addresses come from. */
export type AudienceCompanyEmailSource =
  | 'BOTH'
  | 'COMPANY_EMAILS'
  | 'LINKED_CONTACTS';

export type AudienceConditionInput = {
  field: Scalars['String']['input'];
  operator: AudienceRuleOperator;
  value: InputMaybe<Scalars['String']['input']>;
};

/** How many of a record's addresses are used. */
export type AudienceEmailSelection =
  | 'ALL'
  | 'PRIMARY'
  | 'SELECTED_TYPES';

/** Why an address will not be sent to. UNSUBSCRIBED, SPAM_COMPLAINT, BOUNCED and BLOCKED are never overridden. */
export type AudienceExclusionReason =
  | 'BLOCKED'
  | 'BOUNCED'
  | 'CATEGORY_OPT_OUT'
  | 'EMAIL_STATUS_FILTER'
  | 'INVALID_EMAIL'
  | 'LEFT_COMPANY'
  | 'MANUALLY_EXCLUDED'
  | 'SPAM_COMPLAINT'
  | 'UNSUBSCRIBED';

export type AudienceFilterEntity =
  | 'COMPANY'
  | 'CONTACT'
  | 'EMAIL';

export type AudienceFilterKind =
  | 'EMAIL_STATUS'
  | 'ENUM'
  | 'LAST_CONTACTED'
  | 'TAGS'
  | 'TEXT';

export type AudienceListInput = {
  allActiveClients: InputMaybe<Scalars['Boolean']['input']>;
  clientIds: InputMaybe<Array<Scalars['String']['input']>>;
  companyEmailSource: AudienceCompanyEmailSource;
  companyIds: InputMaybe<Array<Scalars['String']['input']>>;
  conditions: InputMaybe<Array<AudienceConditionInput>>;
  contactIds: InputMaybe<Array<Scalars['String']['input']>>;
  description: InputMaybe<Scalars['String']['input']>;
  emailSelection: AudienceEmailSelection;
  emailTypes: InputMaybe<Array<Scalars['String']['input']>>;
  excludedEmails: InputMaybe<Array<Scalars['String']['input']>>;
  name: Scalars['String']['input'];
  recipientSource: AudienceRecipientSource;
  ruleCombinator: AudienceRuleCombinator;
  updateMode: AudienceUpdateMode;
};

/** Which CRM registers the rules pick from. SELECTED_ONLY uses only the records named under Data sources. */
export type AudienceRecipientSource =
  | 'BOTH'
  | 'COMPANIES'
  | 'CONTACTS'
  | 'SELECTED_ONLY';

export type AudienceRecordKind =
  | 'CLIENT'
  | 'COMPANY'
  | 'CONTACT';

/** How a record got into the audience. */
export type AudienceRecordVia =
  | 'LINKED_CONTACT'
  | 'RULES'
  | 'SELECTED';

export type AudienceRuleCombinator =
  | 'AND'
  | 'OR';

export type AudienceRuleOperator =
  | 'CONTAINS'
  | 'EQUALS'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY'
  | 'NEVER'
  | 'NOT_EQUALS'
  | 'OLDER_THAN_DAYS'
  | 'WITHIN_DAYS';

/** Whether membership is frozen at save (addresses, or records) or follows the CRM. */
export type AudienceUpdateMode =
  | 'DYNAMIC'
  | 'FIXED_RECORDS'
  | 'FIXED_SNAPSHOT';

export type AuditAction =
  | 'ACCESS'
  | 'CREATE'
  | 'DELETE'
  | 'IMPORT'
  | 'LOGIN'
  | 'PASSWORD_RESET'
  | 'PERMISSION'
  | 'ROLE_CHANGE'
  | 'SETTINGS'
  | 'UPDATE';

/** Who is auditing whom. */
export type AuditKind =
  | 'EXTERNAL'
  | 'INTERNAL'
  | 'SUPPLIER';

export type AuditStatus =
  | 'CLOSED'
  | 'IN_PROGRESS'
  | 'PLANNED'
  | 'REPORTED';

/** ISO 20022 cash account type: CURRENT (CACC, checking) or SAVINGS (SVGS). */
export type BankAccountType =
  | 'CURRENT'
  | 'SAVINGS';

export type BenefitInput = {
  coverage: Scalars['String']['input'];
  documentUrl: InputMaybe<Scalars['String']['input']>;
  employeeId: Scalars['String']['input'];
  kind: BenefitKind;
  name: Scalars['String']['input'];
  provider: Scalars['String']['input'];
  reference: Scalars['String']['input'];
  validFrom: InputMaybe<Scalars['DateTime']['input']>;
  validTo: InputMaybe<Scalars['DateTime']['input']>;
};

export type BenefitKind =
  | 'GRATUITY'
  | 'INSURANCE'
  | 'OTHER'
  | 'PF'
  | 'WELLNESS';

export type BillingKeyConfigInput = {
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  /** Required when adding. Leave empty when editing to keep the stored key. */
  key: Scalars['String']['input'];
  label: Scalars['String']['input'];
  provider: BillingProvider;
};

/** A provider whose real bill a billing key can read. */
export type BillingProvider =
  | 'OPENAI';

export type BlogAuthorInput = {
  initials: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  role: InputMaybe<Scalars['String']['input']>;
};

export type BlogPostInput = {
  author: BlogAuthorInput;
  content: InputMaybe<Scalars['String']['input']>;
  contentCss: InputMaybe<Scalars['String']['input']>;
  coverImage: InputMaybe<Scalars['String']['input']>;
  featured: InputMaybe<Scalars['Boolean']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  publishedAt: InputMaybe<Scalars['DateTime']['input']>;
  readTime: InputMaybe<Scalars['String']['input']>;
  seo: InputMaybe<ItemSeoInput>;
  siteId: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  summary: InputMaybe<Scalars['String']['input']>;
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type BookMeetingInput = {
  email: Scalars['String']['input'];
  /** Others to invite (at most 10); each gets the confirmation. */
  guests: InputMaybe<Array<Scalars['String']['input']>>;
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  startAt: Scalars['DateTime']['input'];
  /** The booker's IANA time zone, for their confirmation email. */
  timezone: InputMaybe<Scalars['String']['input']>;
};

export type BrandingInput = {
  accentColor: InputMaybe<Scalars['String']['input']>;
  address: InputMaybe<Scalars['String']['input']>;
  addressLine: InputMaybe<Scalars['String']['input']>;
  ambitionboxUrl: InputMaybe<Scalars['String']['input']>;
  appIconDarkUrl: InputMaybe<Scalars['String']['input']>;
  appIconUrl: InputMaybe<Scalars['String']['input']>;
  backgroundColor: InputMaybe<Scalars['String']['input']>;
  bankDetails: InputMaybe<Scalars['String']['input']>;
  businessName: InputMaybe<Scalars['String']['input']>;
  clutchUrl: InputMaybe<Scalars['String']['input']>;
  contactPhone: InputMaybe<Scalars['String']['input']>;
  copyrightText: InputMaybe<Scalars['String']['input']>;
  crunchbaseUrl: InputMaybe<Scalars['String']['input']>;
  defaultTaxPercent: InputMaybe<Scalars['Float']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  emailLogoDarkUrl: InputMaybe<Scalars['String']['input']>;
  emailLogoUrl: InputMaybe<Scalars['String']['input']>;
  facebookUrl: InputMaybe<Scalars['String']['input']>;
  faviconDarkUrl: InputMaybe<Scalars['String']['input']>;
  faviconUrl: InputMaybe<Scalars['String']['input']>;
  githubUrl: InputMaybe<Scalars['String']['input']>;
  gstin: InputMaybe<Scalars['String']['input']>;
  heroPosterDarkUrl: InputMaybe<Scalars['String']['input']>;
  heroPosterUrl: InputMaybe<Scalars['String']['input']>;
  heroVideoDarkUrl: InputMaybe<Scalars['String']['input']>;
  heroVideoUrl: InputMaybe<Scalars['String']['input']>;
  hrEmail: InputMaybe<Scalars['String']['input']>;
  instagramUrl: InputMaybe<Scalars['String']['input']>;
  invoicePrefix: InputMaybe<Scalars['String']['input']>;
  legalName: InputMaybe<Scalars['String']['input']>;
  linkedinUrl: InputMaybe<Scalars['String']['input']>;
  loginPages: InputMaybe<Array<LoginPageInput>>;
  logoDarkUrl: InputMaybe<Scalars['String']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  ogImageDarkUrl: InputMaybe<Scalars['String']['input']>;
  ogImageUrl: InputMaybe<Scalars['String']['input']>;
  primaryColor: InputMaybe<Scalars['String']['input']>;
  secondaryColor: InputMaybe<Scalars['String']['input']>;
  slogan: InputMaybe<Scalars['String']['input']>;
  stateCode: InputMaybe<Scalars['String']['input']>;
  supportEmail: InputMaybe<Scalars['String']['input']>;
  textColor: InputMaybe<Scalars['String']['input']>;
  twitterUrl: InputMaybe<Scalars['String']['input']>;
  websiteUrl: InputMaybe<Scalars['String']['input']>;
  youtubeUrl: InputMaybe<Scalars['String']['input']>;
};

export type BudgetInput = {
  amount: Scalars['Float']['input'];
  costCenterId: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  month: Scalars['String']['input'];
  note: InputMaybe<Scalars['String']['input']>;
};

export type BugInput = {
  /** Empty or null leaves the bug unassigned. */
  assigneeId: InputMaybe<Scalars['String']['input']>;
  attachments: InputMaybe<Array<FileAttachmentInput>>;
  description: Scalars['String']['input'];
  dueDate: InputMaybe<Scalars['DateTime']['input']>;
  privateLink: InputMaybe<Scalars['String']['input']>;
  projectId: InputMaybe<Scalars['String']['input']>;
  publicLink: InputMaybe<Scalars['String']['input']>;
  severity: BugSeverity;
  status: BugStatus;
  stepsToReproduce: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type BugSeverity =
  | 'CRITICAL'
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

export type BugStatus =
  | 'CLOSED'
  | 'IN_PROGRESS'
  | 'OPEN'
  | 'RESOLVED';

export type CallingBotCallStatus =
  | 'ENDED'
  | 'FAILED'
  | 'LIVE'
  | 'RINGING'
  | 'STARTING';

export type CallingBotChannel =
  | 'BROWSER'
  | 'PHONE';

export type CallingBotConfigInput = {
  greeting: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  languageCode: Scalars['String']['input'];
  maxCallSeconds: Scalars['Int']['input'];
  /** Write-only. Leave empty when editing to keep the stored key. */
  openAiApiKey: Scalars['String']['input'];
  openAiModel: Scalars['String']['input'];
  phoneProvider: CallingBotPhoneProvider;
  /** Write-only. Leave empty when editing to keep the stored key. */
  sarvamApiKey: Scalars['String']['input'];
  systemPrompt: Scalars['String']['input'];
  ttsModel: Scalars['String']['input'];
  ttsSpeaker: Scalars['String']['input'];
  twilioAccountSid: Scalars['String']['input'];
  /** Write-only. Leave empty when editing to keep the stored token. */
  twilioAuthToken: Scalars['String']['input'];
  twilioNumber: Scalars['String']['input'];
  vobizAuthId: Scalars['String']['input'];
  /** Write-only. Leave empty when editing to keep the stored token. */
  vobizAuthToken: Scalars['String']['input'];
  vobizNumber: Scalars['String']['input'];
};

/** An account the Tech screen can test on its own. */
export type CallingBotKey =
  | 'OPENAI'
  | 'SARVAM'
  | 'TWILIO'
  | 'VOBIZ';

/** What the form holds when a Test button is pressed; a blank key means the saved one. */
export type CallingBotKeyTestInput = {
  /** The config being edited, whose saved keys stand in for blank ones. */
  configId: InputMaybe<Scalars['ID']['input']>;
  key: CallingBotKey;
  languageCode: InputMaybe<Scalars['String']['input']>;
  openAiApiKey: InputMaybe<Scalars['String']['input']>;
  openAiModel: InputMaybe<Scalars['String']['input']>;
  sarvamApiKey: InputMaybe<Scalars['String']['input']>;
  ttsModel: InputMaybe<Scalars['String']['input']>;
  ttsSpeaker: InputMaybe<Scalars['String']['input']>;
  twilioAccountSid: InputMaybe<Scalars['String']['input']>;
  twilioAuthToken: InputMaybe<Scalars['String']['input']>;
  vobizAuthId: InputMaybe<Scalars['String']['input']>;
  vobizAuthToken: InputMaybe<Scalars['String']['input']>;
};

/** Which telephony account places calls to real phones; NONE offers browser calls only. */
export type CallingBotPhoneProvider =
  | 'NONE'
  | 'TWILIO'
  | 'VOBIZ';

export type CallingBotScenarioInput = {
  description: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  greeting: Scalars['String']['input'];
  /** Empty keeps the active config's language. */
  languageCode: Scalars['String']['input'];
  order: Scalars['Int']['input'];
  systemPrompt: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

/** A stored calling bot key that Tech staff can reveal, one at a time. */
export type CallingBotSecret =
  | 'OPENAI_API_KEY'
  | 'SARVAM_API_KEY'
  | 'TWILIO_AUTH_TOKEN'
  | 'VOBIZ_AUTH_TOKEN';

export type CallingBotTurnRole =
  | 'BOT'
  | 'CALLER';

export type CampaignChannel =
  | 'DISPLAY'
  | 'EMAIL'
  | 'SEARCH'
  | 'SOCIAL';

/** A draft as the Email Studio saves it. Only the name is needed for a first save. */
export type CampaignDraftInput = {
  blocks: InputMaybe<Scalars['JSON']['input']>;
  budget: InputMaybe<Scalars['Float']['input']>;
  /** The ISO 4217 currency the budget is set in. A new draft without one takes the company's. */
  budgetCurrency: InputMaybe<Scalars['String']['input']>;
  campaignType: InputMaybe<CampaignType>;
  channel: InputMaybe<CampaignChannel>;
  editorMode: InputMaybe<EditorMode>;
  endDate: InputMaybe<Scalars['DateTime']['input']>;
  mjml: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  preferenceCategoryId: InputMaybe<Scalars['String']['input']>;
  preheader: InputMaybe<Scalars['String']['input']>;
  replyTo: InputMaybe<Scalars['String']['input']>;
  /** The audience chosen in the Audience step. */
  scheduledAudienceListId: InputMaybe<Scalars['String']['input']>;
  senderEmail: InputMaybe<Scalars['String']['input']>;
  senderName: InputMaybe<Scalars['String']['input']>;
  startDate: InputMaybe<Scalars['DateTime']['input']>;
  status: InputMaybe<CampaignStatus>;
  subject: InputMaybe<Scalars['String']['input']>;
  trackClicks: InputMaybe<Scalars['Boolean']['input']>;
  trackOpens: InputMaybe<Scalars['Boolean']['input']>;
};

export type CampaignInput = {
  body: InputMaybe<Scalars['String']['input']>;
  budget: Scalars['Float']['input'];
  /** The ISO 4217 currency the budget is set in. */
  budgetCurrency: Scalars['String']['input'];
  channel: CampaignChannel;
  endDate: Scalars['DateTime']['input'];
  name: Scalars['String']['input'];
  scheduledAt: InputMaybe<Scalars['DateTime']['input']>;
  scheduledAudienceListId: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['DateTime']['input'];
  status: CampaignStatus;
  subject: InputMaybe<Scalars['String']['input']>;
  templateKey: InputMaybe<Scalars['String']['input']>;
};

export type CampaignPreviewInput = {
  campaignName: Scalars['String']['input'];
  mjml: Scalars['String']['input'];
  preheader: Scalars['String']['input'];
  recordId: InputMaybe<Scalars['String']['input']>;
  recordKind: InputMaybe<PreviewRecordKind>;
  senderName: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

/** Where the email delivery stands, separate from the campaign's marketing status. */
export type CampaignSendState =
  | 'CANCELLED'
  | 'DRAFT'
  | 'FAILED'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT';

export type CampaignSendStatus =
  | 'FAILED'
  | 'QUEUED'
  | 'SENT'
  | 'SKIPPED';

export type CampaignStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'PAUSED'
  | 'PLANNED';

export type CampaignTemplateInput = {
  blocks: InputMaybe<Scalars['JSON']['input']>;
  category: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  editorMode: EditorMode;
  mjml: Scalars['String']['input'];
  name: Scalars['String']['input'];
  note: InputMaybe<Scalars['String']['input']>;
};

export type CampaignType =
  | 'ANNOUNCEMENT'
  | 'EVENT'
  | 'FOLLOW_UP'
  | 'NEWSLETTER'
  | 'OTHER'
  | 'PROMOTIONAL';

export type CannedReplyInput = {
  body: Scalars['String']['input'];
  category: SupportCategory;
  isActive: Scalars['Boolean']['input'];
  title: Scalars['String']['input'];
};

export type CaseStudyInput = {
  author: InputMaybe<Scalars['String']['input']>;
  category: InputMaybe<Scalars['String']['input']>;
  content: InputMaybe<Scalars['String']['input']>;
  contentCss: InputMaybe<Scalars['String']['input']>;
  coverImage: InputMaybe<Scalars['String']['input']>;
  excerpt: InputMaybe<Scalars['String']['input']>;
  featured: InputMaybe<Scalars['Boolean']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  pdfUrl: InputMaybe<Scalars['String']['input']>;
  publishedAt: InputMaybe<Scalars['DateTime']['input']>;
  seo: InputMaybe<ItemSeoInput>;
  siteId: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type CheckSeverity =
  | 'ERROR'
  | 'INFO'
  | 'WARNING';

export type ClientCommunicationInput = {
  details: InputMaybe<Scalars['String']['input']>;
  /** Email the client's hub contacts about this entry. Sent at most once per entry. */
  notify: InputMaybe<Scalars['Boolean']['input']>;
  occurredAt: Scalars['DateTime']['input'];
  participants: InputMaybe<Scalars['String']['input']>;
  subject: Scalars['String']['input'];
  summary: InputMaybe<Scalars['String']['input']>;
  type: ClientCommunicationType;
};

export type ClientCommunicationType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'MESSAGE'
  | 'OTHER';

export type ClientContactInput = {
  clientId: Scalars['ID']['input'];
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type ClientHubTicketInput = {
  category: SupportCategory;
  description: Scalars['String']['input'];
  priority: SupportPriority;
  subject: Scalars['String']['input'];
};

export type ClientInput = {
  billingAddress: InputMaybe<Scalars['String']['input']>;
  city: InputMaybe<Scalars['String']['input']>;
  company: Scalars['String']['input'];
  country: InputMaybe<Scalars['String']['input']>;
  currency: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  /** Deprecated: send taxIdType IN_GST and taxId instead. */
  gstin: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  postalCode: InputMaybe<Scalars['String']['input']>;
  region: InputMaybe<Scalars['String']['input']>;
  stateCode: InputMaybe<Scalars['String']['input']>;
  status: ClientStatus;
  taxId: InputMaybe<Scalars['String']['input']>;
  taxIdType: InputMaybe<ClientTaxIdType>;
};

export type ClientLinkInput = {
  description: InputMaybe<Scalars['String']['input']>;
  details: InputMaybe<Scalars['String']['input']>;
  /** Email the client's hub contacts about the new link (create only). */
  notify: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type ClientShareInput = {
  kind: ClientSharedKind;
  note: InputMaybe<Scalars['String']['input']>;
  /** Email the client's hub contacts. Sent at most once per shared record. */
  notify: InputMaybe<Scalars['Boolean']['input']>;
  refId: Scalars['ID']['input'];
};

/** A Legal record that can be shared with a client. */
export type ClientSharedKind =
  | 'CONTRACT'
  | 'DOCUMENT'
  | 'POLICY';

export type ClientStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PROSPECT';

/** What the public customer form sends. Every field is re-validated on the server. */
export type ClientSupportTicketInput = {
  category: SupportCategory;
  description: Scalars['String']['input'];
  priority: SupportPriority;
  requesterEmail: Scalars['String']['input'];
  requesterName: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

/** The kind of business tax number a client is registered under (the same codes as @exyconn/regex TAX_ID_TYPES). */
export type ClientTaxIdType =
  /** United Arab Emirates: Tax Registration Number */
  | 'AE_TRN'
  /** Australia: Australian Business Number */
  | 'AU_ABN'
  /** Brazil: CNPJ */
  | 'BR_CNPJ'
  /** Canada: Business Number (GST/HST) */
  | 'CA_BN'
  /** Switzerland and Liechtenstein: UID / VAT number */
  | 'CH_UID'
  /** European Union: VAT number */
  | 'EU_VAT'
  /** United Kingdom: VAT number */
  | 'GB_VAT'
  /** India: GSTIN */
  | 'IN_GST'
  /** Japan: Corporate Number */
  | 'JP_CN'
  /** Mexico: RFC */
  | 'MX_RFC'
  /** New Zealand: GST number */
  | 'NZ_GST'
  /** Any other country's business tax number */
  | 'OTHER'
  /** Saudi Arabia: VAT number */
  | 'SA_VAT'
  /** Singapore: UEN / GST registration */
  | 'SG_UEN'
  /** United States: Employer Identification Number */
  | 'US_EIN'
  /** South Africa: VAT number */
  | 'ZA_VAT';

export type CloudflareConfigInput = {
  accountId: Scalars['String']['input'];
  /** Write-only. Leave empty when editing to keep the stored token. */
  apiToken: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

/** Which engine a Clutch search ran on: Clutch's own MCP server (free) or an Apify scraper. */
export type ClutchEngine =
  | 'APIFY'
  | 'MCP';

export type ClutchRunStatus =
  | 'FAILED'
  | 'RUNNING'
  | 'SUCCEEDED';

export type ClutchSearchInput = {
  engine: ClutchEngine;
  includeDetails: Scalars['Boolean']['input'];
  includePortfolio: Scalars['Boolean']['input'];
  includeReviews: Scalars['Boolean']['input'];
  industry: Scalars['String']['input'];
  /** What to search for, e.g. Web Development or 'api development'. */
  keyword: Scalars['String']['input'];
  location: Scalars['String']['input'];
  /** 1 to 200. */
  maxItems: Scalars['Int']['input'];
  /** Clutch profile links to read in full (https://clutch.co/profile/…). */
  profileUrls: Array<Scalars['String']['input']>;
};

export type CmsAssetUploadInput = {
  alt: InputMaybe<Scalars['String']['input']>;
  /** A data: URL (image or PDF, up to 12 MB). */
  file: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  height: InputMaybe<Scalars['Int']['input']>;
  siteId: Scalars['String']['input'];
  width: InputMaybe<Scalars['Int']['input']>;
};

export type CmsDesignSystemInput = {
  extraCss: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  siteId: Scalars['String']['input'];
  tokens: Scalars['JSON']['input'];
};

export type CmsDocumentStatus =
  /** Live, with newer edits waiting to be published. */
  | 'CHANGED'
  /** Never published. */
  | 'DRAFT'
  /** Live, and unchanged since it was published. */
  | 'PUBLISHED';

export type CmsDraftInput = {
  css: Scalars['String']['input'];
  html: Scalars['String']['input'];
  projectData: InputMaybe<Scalars['JSON']['input']>;
};

export type CmsFragmentInput = {
  kind: CmsFragmentKind;
  name: Scalars['String']['input'];
};

export type CmsFragmentKind =
  | 'FOOTER'
  | 'HEADER'
  | 'SECTION'
  | 'SNIPPET';

export type CmsPageKind =
  /** One page at one path. */
  | 'PAGE'
  /** A family of pages, e.g. /blog/:slug; its components read the matching item. */
  | 'TEMPLATE';

export type CmsPageLayout =
  /** Without them (a landing page, an embed). */
  | 'bare'
  /** With the site's header and footer. */
  | 'default';

export type CmsPageListInput = {
  kind: InputMaybe<CmsPageKind>;
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  search: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<CmsDocumentStatus>;
};

export type CmsPageSeoInput = {
  canonical: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  jsonLd: InputMaybe<Scalars['JSON']['input']>;
  keywords: InputMaybe<Scalars['String']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  ogImageUrl: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type CmsPageSettingsInput = {
  kind: CmsPageKind;
  layout: CmsPageLayout;
  path: Scalars['String']['input'];
  seo: InputMaybe<CmsPageSeoInput>;
  title: Scalars['String']['input'];
};

export type CmsSiteInput = {
  bodyEndHtml: InputMaybe<Scalars['String']['input']>;
  defaultLocale: Scalars['String']['input'];
  designSystemId: InputMaybe<Scalars['String']['input']>;
  domains: Array<Scalars['String']['input']>;
  faviconUrl: InputMaybe<Scalars['String']['input']>;
  footerFragmentId: InputMaybe<Scalars['String']['input']>;
  globalCss: InputMaybe<Scalars['String']['input']>;
  headHtml: InputMaybe<Scalars['String']['input']>;
  headerFragmentId: InputMaybe<Scalars['String']['input']>;
  markets: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  notFoundPageId: InputMaybe<Scalars['String']['input']>;
  seo: InputMaybe<CmsSiteSeoInput>;
  slug: Scalars['String']['input'];
  status: CmsSiteStatus;
};

export type CmsSiteSeoInput = {
  description: InputMaybe<Scalars['String']['input']>;
  ogImageUrl: InputMaybe<Scalars['String']['input']>;
  titleTemplate: InputMaybe<Scalars['String']['input']>;
};

export type CmsSiteStatus =
  | 'ACTIVE'
  | 'DRAFT';

export type ColdEmailStatus =
  | 'DRAFT'
  /** One of its versions has been sent. */
  | 'SENT';

export type ColdEmailTone =
  | 'BRIEF'
  | 'FORMAL'
  | 'FRIENDLY';

export type CompanyBenefitInput = {
  description: InputMaybe<Scalars['String']['input']>;
  icon: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CompanyExpenseInput = {
  amount: Scalars['Float']['input'];
  category: ExpenseCategory;
  costCenterId: InputMaybe<Scalars['String']['input']>;
  currency: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  dueDate: Scalars['DateTime']['input'];
  incurredOn: Scalars['DateTime']['input'];
  reference: InputMaybe<Scalars['String']['input']>;
  vendor: Scalars['String']['input'];
};

export type CompanyInput = {
  address: InputMaybe<Scalars['String']['input']>;
  annualRevenue: InputMaybe<Scalars['Float']['input']>;
  city: InputMaybe<Scalars['String']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  custom: InputMaybe<Scalars['JSON']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  domain: Scalars['String']['input'];
  emails: InputMaybe<Array<CrmEmailAddressInput>>;
  employeeCount: InputMaybe<Scalars['Int']['input']>;
  foundedYear: InputMaybe<Scalars['Int']['input']>;
  industry: InputMaybe<Scalars['String']['input']>;
  linkedinUrl: InputMaybe<Scalars['String']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  phones: InputMaybe<Array<CrmPhoneNumberInput>>;
  /** One of COMPANY_SIZES (11-50, and so on). A string, because 1-10 is not a valid enum name. */
  size: Scalars['String']['input'];
  status: CompanyStatus;
  timezone: InputMaybe<Scalars['String']['input']>;
  twitterUrl: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
};

export type CompanySocialLinksInput = {
  facebook: InputMaybe<Scalars['String']['input']>;
  instagram: InputMaybe<Scalars['String']['input']>;
  linkedin: InputMaybe<Scalars['String']['input']>;
  twitter: InputMaybe<Scalars['String']['input']>;
};

export type CompanyStatus =
  | 'CHURNED'
  | 'CUSTOMER'
  | 'PARTNER'
  | 'PROSPECT';

/** What a compliance record is about — one list across all four standards. */
export type ComplianceCategory =
  | 'ENVIRONMENT'
  | 'FINANCIAL'
  | 'HEALTH_SAFETY'
  | 'INFORMATION_SECURITY'
  | 'LEGAL'
  | 'OPERATIONAL'
  | 'PEOPLE'
  | 'QUALITY'
  | 'SUPPLIER';

export type ContactInput = {
  address: InputMaybe<Scalars['String']['input']>;
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  city: InputMaybe<Scalars['String']['input']>;
  companyId: InputMaybe<Scalars['String']['input']>;
  companyName: InputMaybe<Scalars['String']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  custom: InputMaybe<Scalars['JSON']['input']>;
  department: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  /** The primary address; or send emails instead. */
  email: InputMaybe<Scalars['String']['input']>;
  emails: InputMaybe<Array<CrmEmailAddressInput>>;
  languages: InputMaybe<Array<Scalars['String']['input']>>;
  leadSource: InputMaybe<Scalars['String']['input']>;
  lifecycleStage: InputMaybe<LifecycleStage>;
  linkedinUrl: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  phones: InputMaybe<Array<CrmPhoneNumberInput>>;
  status: ContactStatus;
  timezone: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  twitterUrl: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
};

export type ContactStatus =
  | 'ACTIVE'
  | 'BOUNCED'
  | 'LEFT_COMPANY'
  | 'UNSUBSCRIBED';

export type ContractInput = {
  content: InputMaybe<Scalars['String']['input']>;
  documentUrl: InputMaybe<Scalars['String']['input']>;
  effectiveDate: Scalars['DateTime']['input'];
  expiryDate: Scalars['DateTime']['input'];
  groupId: InputMaybe<Scalars['ID']['input']>;
  party: Scalars['String']['input'];
  status: ContractStatus;
  title: Scalars['String']['input'];
  type: ContractType;
};

export type ContractStatus =
  | 'ACTIVE'
  | 'DRAFT'
  | 'EXPIRED'
  | 'TERMINATED';

export type ContractType =
  | 'EMPLOYMENT'
  | 'MSA'
  | 'NDA'
  | 'SOW';

/** What a lead becomes: an account, a person at it and an opportunity. */
export type ConvertLeadInput = {
  companyName: Scalars['String']['input'];
  contactEmail: InputMaybe<Scalars['String']['input']>;
  contactName: InputMaybe<Scalars['String']['input']>;
  dealTitle: Scalars['String']['input'];
  expectedCloseDate: InputMaybe<Scalars['DateTime']['input']>;
  value: Scalars['Float']['input'];
};

export type CostCenterInput = {
  code: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  ownerId: InputMaybe<Scalars['String']['input']>;
};

export type CreateColdEmailDraftInput = {
  goal: InputMaybe<Scalars['String']['input']>;
  object: CrmTimelineObject;
  /** Read their website through Firecrawl first; costs a Firecrawl call. */
  readWebsite: InputMaybe<Scalars['Boolean']['input']>;
  recordId: Scalars['ID']['input'];
  toEmail: Scalars['String']['input'];
  tone: ColdEmailTone;
  /** How many versions to write straight away, in one AI run: 1 to 4, default 4. */
  variantCount: InputMaybe<Scalars['Int']['input']>;
};

export type CreateUserInput = {
  address: InputMaybe<Scalars['String']['input']>;
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  brief: InputMaybe<Scalars['String']['input']>;
  /** The city they work in, for city holidays; null when not set. */
  city: InputMaybe<Scalars['String']['input']>;
  /** ISO 3166-1 alpha-2, or null to follow the company's country. */
  country: InputMaybe<Scalars['String']['input']>;
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  department: InputMaybe<Scalars['String']['input']>;
  designation: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  employmentStatus: InputMaybe<EmploymentStatus>;
  /** Kind of employment, by code — permanent, contract, intern. Empty when not set. */
  employmentTypeCode: InputMaybe<Scalars['String']['input']>;
  /** Job grade or band, by code. Empty when not set. */
  gradeCode: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  joinDate: InputMaybe<Scalars['DateTime']['input']>;
  /** BCP-47 tag, or null to follow the workspace default. */
  locale: InputMaybe<Scalars['String']['input']>;
  /** Office or site this person works at, by the location's code. Empty when not set. */
  locationCode: InputMaybe<Scalars['String']['input']>;
  managerId: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  /** A personal address to keep on file; null or empty clears it. */
  personalEmail: InputMaybe<Scalars['String']['input']>;
  probationEndDate: InputMaybe<Scalars['DateTime']['input']>;
  /** The state or region they work in, for regional holidays; null when not set. */
  region: InputMaybe<Scalars['String']['input']>;
  roles: Array<Role>;
  /** Working-hours pattern, by code. Empty when not set. */
  shiftCode: InputMaybe<Scalars['String']['input']>;
  /** Team inside the department. Empty when not set. */
  teamName: InputMaybe<Scalars['String']['input']>;
  /** IANA zone name, or null to follow the workspace default. */
  timezone: InputMaybe<Scalars['String']['input']>;
  /** Days of the week they work, 0 is Sunday. Null follows the workspace's week. */
  workDays: InputMaybe<Array<Scalars['Int']['input']>>;
  workHoursPerDay: InputMaybe<Scalars['Int']['input']>;
  workLocation: InputMaybe<WorkLocation>;
  workLocationNote: InputMaybe<Scalars['String']['input']>;
  workingTime: InputMaybe<WorkingTime>;
  workingTimeNote: InputMaybe<Scalars['String']['input']>;
};

/** What a calendar entry is, which decides its colour. */
export type CrmCalendarKind =
  | 'ACTIVITY'
  | 'BOOKING'
  | 'MEETING'
  | 'REMINDER'
  | 'TASK';

export type CrmCallConfigInput = {
  /** Twilio Account SID or Vobiz Auth ID. */
  accountId: Scalars['String']['input'];
  /** Twilio or Vobiz Auth Token. Blank keeps the stored one when editing. */
  authToken: Scalars['String']['input'];
  /** The number calls come from, in E.164, e.g. +14155550100. */
  fromNumber: Scalars['String']['input'];
  isActive: Scalars['Boolean']['input'];
  label: Scalars['String']['input'];
  provider: CrmCallProvider;
};

export type CrmCallProvider =
  | 'TWILIO'
  | 'VOBIZ';

export type CrmConditionInput = {
  op: CrmOp;
  property: Scalars['String']['input'];
  /** Dates as ISO strings; BETWEEN takes two values, IN/NOT_IN any number. */
  values: Array<Scalars['String']['input']>;
};

/** How the time charts are bucketed: days for a month, weeks up to about six months, months beyond. */
export type CrmDashboardGranularity =
  | 'DAY'
  | 'MONTH'
  | 'WEEK';

export type CrmEmailAddressInput = {
  address: Scalars['String']['input'];
  label: InputMaybe<Scalars['String']['input']>;
  primary: InputMaybe<Scalars['Boolean']['input']>;
};

export type CrmEmailDirection =
  | 'IN'
  | 'OUT';

export type CrmEmailProvider =
  | 'GMAIL'
  | 'MICROSOFT';

export type CrmEmailThreadPageInput = {
  /** One connected mailbox's account id. */
  accountId: InputMaybe<Scalars['String']['input']>;
  /** The latest message is on or after this moment. */
  after: InputMaybe<Scalars['DateTime']['input']>;
  /** The latest message is on or before this moment. */
  before: InputMaybe<Scalars['DateTime']['input']>;
  /** Threads with at least one message sent (OUT) or received (IN). */
  direction: InputMaybe<CrmEmailDirection>;
  /** Zero-based. */
  page: Scalars['Int']['input'];
  /** Up to 100. */
  pageSize: Scalars['Int']['input'];
  /** Words in the subject, preview, body or addresses. */
  search: InputMaybe<Scalars['String']['input']>;
  sort: InputMaybe<CrmEmailThreadSort>;
};

export type CrmEmailThreadSort =
  | 'NEWEST'
  | 'OLDEST'
  | 'SUBJECT';

/** Conditions in a group must all hold; a record matches when any group does. */
export type CrmFilterGroupInput = {
  conditions: Array<CrmConditionInput>;
};

export type CrmImportInput = {
  /** The file line of the first row, so issues name lines a person can find. */
  firstRowNumber: Scalars['Int']['input'];
  mode: CrmImportMode;
  object: CrmObject;
  /** Up to 500 rows, each an object of property key to cell text. */
  rows: Array<Scalars['JSON']['input']>;
};

/** CREATE skips rows that match an existing record, UPDATE skips rows that do not, UPSERT does both. */
export type CrmImportMode =
  | 'CREATE'
  | 'UPDATE'
  | 'UPSERT';

export type CrmInsightKind =
  | 'COMPANY_ORIGIN_CONVERSION'
  | 'LEAD_SOURCE_CONVERSION'
  | 'OVERDUE_REMINDERS'
  | 'OVERDUE_TASKS'
  | 'PAST_CLOSE_DATE'
  | 'STUCK_DEALS';

export type CrmInsightTone =
  | 'POSITIVE'
  | 'WARNING';

export type CrmMailAction =
  | 'ARCHIVE'
  | 'MARK_READ'
  | 'MARK_UNREAD'
  | 'STAR'
  /** Moves the conversation to Gmail's trash, where Gmail keeps it for 30 days. */
  | 'TRASH'
  | 'UNSTAR';

export type CrmMailFolder =
  /** Everything except spam and trash. */
  | 'ALL'
  | 'INBOX'
  | 'SENT'
  | 'STARRED';

export type CrmMailSort =
  | 'NEWEST'
  | 'OLDEST'
  | 'SENDER'
  | 'SUBJECT';

export type CrmMailThreadRef = {
  accountId: Scalars['ID']['input'];
  threadId: Scalars['String']['input'];
};

export type CrmMailThreadsInput = {
  /** One mailbox; every readable one when empty. */
  accountId: InputMaybe<Scalars['ID']['input']>;
  /** The newest message is on or after / on or before these. */
  after: InputMaybe<Scalars['DateTime']['input']>;
  before: InputMaybe<Scalars['DateTime']['input']>;
  folder: CrmMailFolder;
  /** Zero-based. */
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  /** Matches subject, preview and people, and Gmail's own search of each mailbox. */
  search: InputMaybe<Scalars['String']['input']>;
  /** Newest first unless chosen. */
  sort: InputMaybe<CrmMailSort>;
  /** Only conversations with unread mail. */
  unreadOnly: InputMaybe<Scalars['Boolean']['input']>;
  /** Only conversations with files attached. */
  withAttachments: InputMaybe<Scalars['Boolean']['input']>;
};

/** A circle on the map: only records whose coordinates fall inside it. */
export type CrmNearInput = {
  /** Centre latitude, -90 to 90. */
  lat: Scalars['Float']['input'];
  /** Centre longitude, -180 to 180. */
  lng: Scalars['Float']['input'];
  /** More than 0 and at most 500 kilometres. */
  radiusKm: Scalars['Float']['input'];
};

export type CrmObject =
  | 'COMPANY'
  | 'CONTACT'
  | 'LEAD';

/** What a filter condition asks of a property; which ones apply depends on its type. */
export type CrmOp =
  | 'AFTER'
  | 'BEFORE'
  | 'BETWEEN'
  | 'CONTAINS'
  | 'ENDS_WITH'
  | 'EQ'
  | 'GT'
  | 'GTE'
  | 'IN'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY'
  | 'LAST_DAYS'
  | 'LT'
  | 'LTE'
  | 'NEQ'
  | 'NOT_CONTAINS'
  | 'NOT_IN'
  | 'STARTS_WITH';

export type CrmOriginSource =
  | 'CLUTCH'
  | 'GOOGLE_PLACES'
  | 'LEAD_CONVERSION'
  | 'MEETING_BOOKING'
  | 'USER'
  | 'WEBSITE';

export type CrmPhoneNumberInput = {
  label: InputMaybe<Scalars['String']['input']>;
  number: Scalars['String']['input'];
  primary: InputMaybe<Scalars['Boolean']['input']>;
};

/** One new property for several record types at once: a row is made for each of objects. */
export type CrmPropertiesInput = {
  description: Scalars['String']['input'];
  key: Scalars['String']['input'];
  label: Scalars['String']['input'];
  objects: Array<CrmObject>;
  options: Array<CrmPropertyOptionInput>;
  required: Scalars['Boolean']['input'];
  type: CrmPropertyType;
};

export type CrmPropertyInput = {
  description: Scalars['String']['input'];
  key: Scalars['String']['input'];
  label: Scalars['String']['input'];
  object: CrmObject;
  options: Array<CrmPropertyOptionInput>;
  required: Scalars['Boolean']['input'];
  type: CrmPropertyType;
};

export type CrmPropertyOptionInput = {
  label: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type CrmPropertyType =
  | 'BOOLEAN'
  | 'DATE'
  | 'EMAIL'
  /** A dropdown: one of the choices. */
  | 'ENUM'
  /** An uploaded file; the value is its address. */
  | 'FILE'
  /** Checkboxes: any number of the choices. */
  | 'MULTI_SELECT'
  | 'NUMBER'
  | 'PHONE'
  /** Radio buttons: one of the choices, all shown at once. */
  | 'RADIO'
  | 'TEXT'
  /** Several lines of text. */
  | 'TEXTAREA'
  | 'URL';

/** The key, type and record type of a property are fixed once it exists. */
export type CrmPropertyUpdateInput = {
  description: Scalars['String']['input'];
  label: Scalars['String']['input'];
  options: Array<CrmPropertyOptionInput>;
  required: Scalars['Boolean']['input'];
};

export type CrmQueryInput = {
  /** True lists only archived records; otherwise archived records are left out. */
  archived: InputMaybe<Scalars['Boolean']['input']>;
  groups: InputMaybe<Array<CrmFilterGroupInput>>;
  /** Companies and contacts only: records within this circle; records without coordinates are left out. */
  near: InputMaybe<CrmNearInput>;
  /** Zero-based. */
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  search: InputMaybe<Scalars['String']['input']>;
  sorts: InputMaybe<Array<CrmSortInput>>;
};

export type CrmSmsConfigInput = {
  /** Twilio only: the Account SID. */
  accountId: InputMaybe<Scalars['String']['input']>;
  /** Twilio Auth Token or MSG91 auth key. Blank keeps the stored one when editing. */
  authToken: Scalars['String']['input'];
  /** Twilio only: the sending number in E.164. */
  fromNumber: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  label: Scalars['String']['input'];
  /** MSG91 only: the template variable that carries the message, e.g. message. */
  messageVariable: InputMaybe<Scalars['String']['input']>;
  provider: CrmSmsProvider;
  /** MSG91 only: the DLT sender id. */
  senderId: InputMaybe<Scalars['String']['input']>;
  /** MSG91 only: the DLT-approved flow template id. */
  templateId: InputMaybe<Scalars['String']['input']>;
};

export type CrmSmsProvider =
  | 'MSG91'
  | 'TWILIO';

export type CrmSortInput = {
  dir: SortDir;
  property: Scalars['String']['input'];
};

export type CrmTagObject =
  | 'COMPANY'
  | 'CONTACT';

export type CrmTimelineFieldType =
  /** An ISO date-time, shown in the viewer's date and time settings. */
  | 'DATE'
  /** An amount in the company's currency. */
  | 'MONEY'
  | 'TEXT';

export type CrmTimelineKind =
  | 'CALL'
  | 'CAMPAIGN_EMAIL'
  | 'DEAL'
  | 'EMAIL'
  | 'FORM_SUBMISSION'
  | 'LEAD'
  | 'MEETING'
  | 'NOTE'
  | 'SUPPORT_TICKET'
  | 'SYSTEM_EMAIL'
  | 'TASK'
  | 'WEBSITE_CHAT'
  | 'WHATSAPP_LEAD';

export type CrmTimelineObject =
  | 'COMPANY'
  | 'CONTACT';

export type CrmViewInput = {
  columns: Array<Scalars['String']['input']>;
  groups: Array<CrmFilterGroupInput>;
  name: Scalars['String']['input'];
  object: CrmObject;
  search: Scalars['String']['input'];
  shared: Scalars['Boolean']['input'];
  sorts: Array<CrmSortInput>;
};

export type DealInput = {
  companyId: InputMaybe<Scalars['String']['input']>;
  companyName: InputMaybe<Scalars['String']['input']>;
  contactId: InputMaybe<Scalars['String']['input']>;
  contactName: InputMaybe<Scalars['String']['input']>;
  expectedCloseDate: InputMaybe<Scalars['DateTime']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  probability: Scalars['Int']['input'];
  stage: DealStage;
  title: Scalars['String']['input'];
  value: Scalars['Float']['input'];
};

export type DealStage =
  | 'DISCOVERY'
  | 'LOST'
  | 'NEGOTIATION'
  | 'PROPOSAL'
  | 'QUALIFYING'
  | 'WON';

export type DepartmentInput = {
  code: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  headId: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

/** Who answers for a domain now, judged from the nameservers the registry holds. */
export type DnsAuthority =
  | 'CLOUDFLARE'
  | 'GODADDY'
  | 'OTHER';

export type DnsRecordStatus =
  | 'MATCH'
  | 'MISSING_ON_CLOUDFLARE'
  | 'ONLY_ON_CLOUDFLARE';

export type DocumentCategory =
  | 'COMPLIANCE'
  | 'CONTRACT'
  | 'OTHER'
  | 'POLICY';

export type DocumentKind =
  | 'APPOINTMENT_LETTER'
  | 'EXPERIENCE'
  | 'OFFER_LETTER'
  | 'OTHER'
  | 'POLICY'
  | 'RELIEVING'
  | 'SALARY_SLIP'
  | 'TAX';

export type DocumentStatus =
  | 'ARCHIVED'
  | 'DRAFT'
  | 'FINAL';

export type DraftCrmEmailInput = {
  id: Scalars['ID']['input'];
  /** What the email should say, in a few words. */
  instruction: Scalars['String']['input'];
  object: CrmTimelineObject;
  threadId: InputMaybe<Scalars['String']['input']>;
};

export type EditorMode =
  | 'CODE'
  | 'VISUAL';

export type EmailClientInput = {
  message: Scalars['String']['input'];
  subject: Scalars['String']['input'];
  /** Addresses from clientEmailRecipients; any other address is refused. */
  to: Array<Scalars['String']['input']>;
};

export type EmailConfigInput = {
  fromAddress: Scalars['String']['input'];
  host: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  /** Write-only. Leave empty when editing to keep the stored password. */
  password: Scalars['String']['input'];
  port: Scalars['Int']['input'];
  secure: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};

export type EmailFragmentInput = {
  description: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  mjml: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type EmailLogStatus =
  | 'FAILED'
  | 'SENT';

export type EmailTemplateInput = {
  description: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  key: Scalars['String']['input'];
  mjml: Scalars['String']['input'];
  name: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

/** One placeholder value, for previewing and test sends. */
export type EmailVariableInput = {
  name: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type EmailVerificationBatchStatus =
  | 'DONE'
  | 'FAILED'
  | 'QUEUED'
  | 'RUNNING';

export type EmailVerificationSource =
  | 'BULK'
  | 'CRM'
  | 'SINGLE';

/** What a check concluded: VERIFIED is a mailbox that exists and accepts email. */
export type EmailVerificationStatus =
  | 'INVALID'
  | 'RISKY'
  | 'UNKNOWN'
  | 'VERIFIED';

export type EmailVerifierConfigInput = {
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  proxyHost: Scalars['String']['input'];
  /** Write-only. Leave empty when editing to keep the stored password. */
  proxyPassword: Scalars['String']['input'];
  proxyPort: Scalars['Int']['input'];
  proxyUsername: Scalars['String']['input'];
};

export type EmployeeDocumentInput = {
  employeeId: Scalars['String']['input'];
  issuedOn: Scalars['DateTime']['input'];
  kind: DocumentKind;
  title: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

/** Which of an employee's two addresses a verification code is for. */
export type EmployeeEmailKind =
  /** The work address the person signs in with (User.email). */
  | 'OFFICIAL'
  /** The personal address HR keeps on file (User.personalEmail). */
  | 'PERSONAL';

export type EmployeeRequestInput = {
  decisionNote: InputMaybe<Scalars['String']['input']>;
  details: Scalars['String']['input'];
  employeeId: Scalars['String']['input'];
  status: RequestStatus;
  subject: Scalars['String']['input'];
  type: RequestType;
};

/** The same fields without employeeId, which saveEmployeeSalary takes as its own argument. */
export type EmployeeSalaryInput = {
  allowances: Scalars['Float']['input'];
  basic: Scalars['Float']['input'];
  billingRate: InputMaybe<Scalars['Float']['input']>;
  currency: Scalars['String']['input'];
  deductions: Scalars['Float']['input'];
  effectiveFrom: Scalars['DateTime']['input'];
  esiApplicable: InputMaybe<Scalars['Boolean']['input']>;
  esiNumber: InputMaybe<Scalars['String']['input']>;
  hra: Scalars['Float']['input'];
  panNumber: InputMaybe<Scalars['String']['input']>;
  payType: InputMaybe<PayType>;
  payTypeNote: InputMaybe<Scalars['String']['input']>;
  pfApplicable: InputMaybe<Scalars['Boolean']['input']>;
  pfNumber: InputMaybe<Scalars['String']['input']>;
  rate: InputMaybe<Scalars['Float']['input']>;
  taxExempt: InputMaybe<Scalars['Boolean']['input']>;
  taxRegimeKey: InputMaybe<Scalars['String']['input']>;
  tdsPercent: InputMaybe<Scalars['Float']['input']>;
};

export type EmploymentStatus =
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'TERMINATED';

export type EmploymentTypeInput = {
  active: Scalars['Boolean']['input'];
  code: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  payrollEligible: Scalars['Boolean']['input'];
};

export type ExitRecordInput = {
  assetsReturned: Scalars['Boolean']['input'];
  documentsIssued: Scalars['Boolean']['input'];
  employeeId: Scalars['String']['input'];
  exitInterviewNotes: Scalars['String']['input'];
  finalSettlementAmount: InputMaybe<Scalars['Float']['input']>;
  knowledgeTransferDone: Scalars['Boolean']['input'];
  lastWorkingDate: InputMaybe<Scalars['DateTime']['input']>;
  noticePeriodDays: Scalars['Int']['input'];
  reason: Scalars['String']['input'];
  resignationDate: Scalars['DateTime']['input'];
  stage: ExitStage;
};

export type ExitStage =
  | 'APPROVED'
  | 'CLEARANCE'
  | 'EXITED'
  | 'FULL_AND_FINAL'
  | 'NOTICE_PERIOD'
  | 'RESIGNED'
  | 'WITHDRAWN';

export type ExpenseCategory =
  | 'HARDWARE'
  | 'MARKETING'
  | 'OTHER'
  | 'RENT'
  | 'SALARIES'
  | 'SERVICES'
  | 'SOFTWARE'
  | 'TAXES'
  | 'TRAVEL'
  | 'UTILITIES';

export type ExpenseClaimInput = {
  amount: Scalars['Float']['input'];
  approvedAmount: InputMaybe<Scalars['Float']['input']>;
  category: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  description: Scalars['String']['input'];
  employeeId: Scalars['String']['input'];
  incurredOn: Scalars['DateTime']['input'];
  receiptUrl: InputMaybe<Scalars['String']['input']>;
  status: ExpenseStatus;
};

export type ExpenseState =
  | 'PAID'
  | 'UNPAID';

export type ExpenseStatus =
  | 'APPROVED'
  | 'PAID'
  | 'REJECTED'
  | 'SUBMITTED';

/** What a client sends when it posts a file: the server stamps who and when. */
export type FileAttachmentInput = {
  contentType: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type FilterOp =
  /** Nothing stored, or an empty string; the filter's value is ignored. */
  | 'BLANK'
  | 'CONTAINS'
  | 'ENDS_WITH'
  | 'EQUALS'
  | 'GT'
  | 'GTE'
  /** Any of the filter's values; its value is ignored. */
  | 'IN'
  | 'LT'
  | 'LTE'
  /** Anything but blank; the filter's value is ignored. */
  | 'NOT_BLANK'
  | 'NOT_CONTAINS'
  | 'NOT_EQUALS'
  | 'STARTS_WITH';

export type FindingInput = {
  auditId: Scalars['String']['input'];
  category: ComplianceCategory;
  clause: Scalars['String']['input'];
  closedOn: InputMaybe<Scalars['DateTime']['input']>;
  correctiveAction: Scalars['String']['input'];
  description: Scalars['String']['input'];
  dueOn: InputMaybe<Scalars['DateTime']['input']>;
  effective: InputMaybe<Scalars['Boolean']['input']>;
  effectivenessNote: InputMaybe<Scalars['String']['input']>;
  evidence: InputMaybe<Array<FileAttachmentInput>>;
  immediateAction: Scalars['String']['input'];
  ownerId: Scalars['String']['input'];
  ownerName: Scalars['String']['input'];
  raisedOn: Scalars['DateTime']['input'];
  riskId: Scalars['String']['input'];
  rootCause: Scalars['String']['input'];
  source: FindingSource;
  standards: Array<ManagementStandard>;
  status: FindingStatus;
  title: Scalars['String']['input'];
  type: FindingType;
  verifiedByName: InputMaybe<Scalars['String']['input']>;
  verifiedOn: InputMaybe<Scalars['DateTime']['input']>;
};

/** Where a finding came from. One register whatever raised it. */
export type FindingSource =
  | 'CUSTOMER_COMPLAINT'
  | 'EMPLOYEE_REPORT'
  | 'EXTERNAL_AUDIT'
  | 'INCIDENT'
  | 'INTERNAL_AUDIT'
  | 'MANAGEMENT_REVIEW'
  | 'OTHER'
  | 'SUPPLIER';

export type FindingStatus =
  | 'ACTION_AGREED'
  | 'CLOSED'
  | 'IMPLEMENTED'
  | 'OPEN'
  | 'VERIFIED';

/** How serious it is — the four an auditor uses. */
export type FindingType =
  | 'MAJOR_NONCONFORMITY'
  | 'MINOR_NONCONFORMITY'
  | 'OBSERVATION'
  | 'OPPORTUNITY';

export type FirecrawlConfigInput = {
  /** Required for the hosted API at api.firecrawl.dev; empty for a self-hosted Firecrawl without authentication. Leave empty when editing to keep it. */
  apiKey: Scalars['String']['input'];
  /** https://api.firecrawl.dev, or the http(s) address of a self-hosted Firecrawl. */
  baseUrl: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

/** Whether a gateway account talks to the gateway's test environment or takes real money. */
export type GatewayMode =
  | 'LIVE'
  | 'SANDBOX';

export type GccEmailInput = {
  /** The estimate (schema version 1) as JSON. Totals are never read from it. */
  estimateJson: Scalars['String']['input'];
  /** An optional line from the sender, up to 500 characters. */
  note: InputMaybe<Scalars['String']['input']>;
  /** Where to send the estimate. */
  to: Scalars['String']['input'];
};

export type GccShareInput = {
  /** The visitor agreed to the estimate being stored until the link expires. Must be true. */
  consent: Scalars['Boolean']['input'];
  estimateJson: Scalars['String']['input'];
  /** Between 1 and 30. */
  expiresInDays: Scalars['Int']['input'];
};

export type GigInput = {
  applicationContact: Scalars['String']['input'];
  applicationType: Scalars['String']['input'];
  budget: InputMaybe<Scalars['String']['input']>;
  category: Scalars['String']['input'];
  deadline: InputMaybe<Scalars['DateTime']['input']>;
  deliverables: InputMaybe<Array<Scalars['String']['input']>>;
  duration: Scalars['String']['input'];
  fullDescription: InputMaybe<Scalars['String']['input']>;
  gigCode: Scalars['String']['input'];
  isUrgent: InputMaybe<Scalars['Boolean']['input']>;
  postedDate: InputMaybe<Scalars['DateTime']['input']>;
  requirements: InputMaybe<Array<Scalars['String']['input']>>;
  seo: InputMaybe<ItemSeoInput>;
  shortDescription: InputMaybe<Scalars['String']['input']>;
  siteId: InputMaybe<Scalars['String']['input']>;
  status: Scalars['String']['input'];
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type GithubConfigInput = {
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  owner: Scalars['String']['input'];
  repo: Scalars['String']['input'];
  /** Write-only. Leave empty when editing to keep the stored token. */
  token: Scalars['String']['input'];
};

export type GmailAccountStatus =
  | 'CONNECTED'
  /** Google refused the stored connection; connect the account again. */
  | 'NEEDS_RECONNECT';

export type GmailConfigInput = {
  clientId: Scalars['String']['input'];
  /** Blank keeps the stored secret. */
  clientSecret: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
};

export type GoalInput = {
  description: Scalars['String']['input'];
  employeeId: Scalars['String']['input'];
  endDate: Scalars['DateTime']['input'];
  kpi: Scalars['String']['input'];
  managerComment: InputMaybe<Scalars['String']['input']>;
  progress: Scalars['Int']['input'];
  startDate: Scalars['DateTime']['input'];
  status: GoalStatus;
  title: Scalars['String']['input'];
  weightage: Scalars['Int']['input'];
};

export type GoalStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'DRAFT';

export type GodaddyConfigInput = {
  /** Write-only. Leave empty when editing to keep the stored key. */
  apiKey: InputMaybe<Scalars['String']['input']>;
  /** Write-only. Leave empty when editing to keep the stored secret. */
  apiSecret: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

export type GoogleMapsConfigInput = {
  /** Maps JavaScript key, restricted to the CRM's HTTP referrers. Leave empty when editing to keep it. */
  browserKey: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  /** Places API (New) key, used by the server only. Leave empty when editing to keep it. */
  serverKey: Scalars['String']['input'];
};

export type GoogleSignInConfigInput = {
  clientId: Scalars['String']['input'];
  /** Blank keeps the stored secret. */
  clientSecret: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
};

export type GradeInput = {
  active: Scalars['Boolean']['input'];
  code: Scalars['String']['input'];
  level: Scalars['Int']['input'];
  maxSalary: Scalars['Float']['input'];
  minSalary: Scalars['Float']['input'];
  name: Scalars['String']['input'];
};

export type HolidayInput = {
  /** Cities of the country that observe it. Empty with regions: the whole country. */
  cities: Array<Scalars['String']['input']>;
  /** ISO 3166-1 alpha-2, or empty for a holiday the whole company observes. */
  country: Scalars['String']['input'];
  date: Scalars['DateTime']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  /** Countries that do not observe a company-wide holiday. Ignored on a country holiday. */
  excludedCountries: Array<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  /** States or regions of the country that observe it. Ignored on a global one. */
  regions: Array<Scalars['String']['input']>;
  type: HolidayType;
};

export type HolidayType =
  | 'OPTIONAL'
  | 'PUBLIC'
  | 'RESTRICTED';

export type ImageConfigInput = {
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  /** Write-only. Leave empty when editing to keep the stored key. */
  privateKey: Scalars['String']['input'];
  provider: InputMaybe<Scalars['String']['input']>;
  publicKey: Scalars['String']['input'];
  urlEndpoint: Scalars['String']['input'];
};

export type InboundMailConfigInput = {
  deleteAfterImport: Scalars['Boolean']['input'];
  host: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  mailbox: Scalars['String']['input'];
  /** Write-only. Leave empty when editing to keep the stored password. */
  password: Scalars['String']['input'];
  pollSeconds: Scalars['Int']['input'];
  port: Scalars['Int']['input'];
  secure: Scalars['Boolean']['input'];
  user: Scalars['String']['input'];
};

export type IncidentImpact =
  | 'CRITICAL'
  | 'MAJOR'
  | 'MINOR';

export type IncidentSource =
  | 'MANUAL'
  | 'MONITOR';

export type IncidentUpdateStatus =
  | 'IDENTIFIED'
  | 'INVESTIGATING'
  | 'MONITORING'
  | 'RESOLVED';

/** An integration whose calls are counted on the Environment Variables dashboard. */
export type IntegrationProvider =
  | 'APIFY'
  | 'CLOUDFLARE'
  | 'CLUTCH'
  | 'EMAIL_VERIFIER'
  | 'FIRECRAWL'
  | 'GITHUB'
  | 'GMAIL'
  | 'GODADDY'
  | 'GOOGLE_CALENDAR'
  | 'GOOGLE_MAPS'
  | 'GOOGLE_SIGN_IN'
  | 'IMAGEKIT'
  | 'MICROSOFT'
  | 'MSG91'
  | 'OPENAI'
  | 'PAYONEER'
  | 'PAYPAL'
  | 'PEXELS'
  | 'RAZORPAY'
  | 'SARVAM'
  | 'SLACK'
  | 'SMTP'
  | 'SOCIAL'
  | 'SONARQUBE'
  | 'STRIPE'
  | 'TWILIO'
  | 'VOBIZ';

export type InternalAuditInput = {
  auditeeName: Scalars['String']['input'];
  conclusion: Scalars['String']['input'];
  criteria: Scalars['String']['input'];
  evidence: InputMaybe<Array<FileAttachmentInput>>;
  kind: AuditKind;
  leadAuditorId: Scalars['String']['input'];
  leadAuditorName: Scalars['String']['input'];
  performedOn: InputMaybe<Scalars['DateTime']['input']>;
  plannedOn: Scalars['DateTime']['input'];
  scope: Scalars['String']['input'];
  standards: Array<ManagementStandard>;
  status: AuditStatus;
  summary: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type InvoiceInput = {
  /** Required when there are no lines; ignored (recomputed) when there are. */
  amount: InputMaybe<Scalars['Float']['input']>;
  clientId: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  dueDate: Scalars['DateTime']['input'];
  issuedDate: Scalars['DateTime']['input'];
  lines: InputMaybe<Array<InvoiceLineInput>>;
  number: Scalars['String']['input'];
  placeOfSupplyStateCode: InputMaybe<Scalars['String']['input']>;
  status: InvoiceStatus;
};

export type InvoiceLineInput = {
  description: Scalars['String']['input'];
  hsnSac: InputMaybe<Scalars['String']['input']>;
  quantity: Scalars['Float']['input'];
  rate: Scalars['Float']['input'];
  taxPercent: Scalars['Float']['input'];
};

export type InvoiceStatus =
  | 'DRAFT'
  | 'OVERDUE'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'SENT';

export type ItAccessKind =
  | 'GRANT'
  | 'PASSWORD_RESET'
  | 'REVOKE'
  | 'ROLE_CHANGE';

/** Status and decision fields are set by decide/fulfil, never by this input. */
export type ItAccessRequestInput = {
  accessLevel: InputMaybe<Scalars['String']['input']>;
  application: Scalars['String']['input'];
  employeeId: Scalars['String']['input'];
  expiresAt: InputMaybe<Scalars['DateTime']['input']>;
  kind: ItAccessKind;
  reason: Scalars['String']['input'];
};

export type ItAccessStatus =
  | 'APPROVED'
  | 'CANCELLED'
  | 'FULFILLED'
  | 'PENDING'
  | 'REJECTED';

/** APPROVED and REJECTED are refused here — they come only from decideItChange. */
export type ItChangeInput = {
  description: Scalars['String']['input'];
  environment: ItEnvironment;
  ownerName: InputMaybe<Scalars['String']['input']>;
  plannedEnd: Scalars['DateTime']['input'];
  plannedStart: Scalars['DateTime']['input'];
  risk: ItRisk;
  rollbackPlan: InputMaybe<Scalars['String']['input']>;
  status: ItChangeStatus;
  system: Scalars['String']['input'];
  title: Scalars['String']['input'];
  type: ItChangeType;
};

export type ItChangeStatus =
  | 'APPROVED'
  | 'DRAFT'
  | 'FAILED'
  | 'IMPLEMENTED'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'ROLLED_BACK'
  | 'SCHEDULED';

export type ItChangeType =
  | 'EMERGENCY'
  | 'NORMAL'
  | 'STANDARD';

export type ItCloudKind =
  | 'DATABASE'
  | 'DOCKER_HOST'
  | 'DOMAIN'
  | 'KUBERNETES'
  | 'OTHER'
  | 'SERVER'
  | 'SSL_CERTIFICATE'
  | 'STORAGE';

export type ItCloudResourceInput = {
  endpoint: InputMaybe<Scalars['String']['input']>;
  environment: ItEnvironment;
  expiresAt: InputMaybe<Scalars['DateTime']['input']>;
  kind: ItCloudKind;
  monthlyCost: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  ownerName: InputMaybe<Scalars['String']['input']>;
  provider: InputMaybe<Scalars['String']['input']>;
  region: InputMaybe<Scalars['String']['input']>;
  status: ItServiceStatus;
};

export type ItDecision =
  | 'APPROVED'
  | 'REJECTED';

export type ItEnvironment =
  | 'DEVELOPMENT'
  | 'PRODUCTION'
  | 'STAGING';

export type ItIncidentCategory =
  | 'APPLICATION'
  | 'HARDWARE'
  | 'NETWORK'
  | 'OTHER'
  | 'OUTAGE'
  | 'SECURITY';

export type ItIncidentFollowUpInput = {
  done: Scalars['Boolean']['input'];
  dueAt: InputMaybe<Scalars['DateTime']['input']>;
  ownerName: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

/** The timeline is appended by addItIncidentUpdate and by status changes, never set here. */
export type ItIncidentInput = {
  affectedSystems: InputMaybe<Array<Scalars['String']['input']>>;
  category: ItIncidentCategory;
  commanderName: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  followUps: InputMaybe<Array<ItIncidentFollowUpInput>>;
  impact: InputMaybe<Scalars['String']['input']>;
  rootCause: InputMaybe<Scalars['String']['input']>;
  severity: ItIncidentSeverity;
  startedAt: Scalars['DateTime']['input'];
  status: ItIncidentStatus;
  title: Scalars['String']['input'];
};

export type ItIncidentSeverity =
  | 'SEV1'
  | 'SEV2'
  | 'SEV3'
  | 'SEV4';

export type ItIncidentStatus =
  | 'CLOSED'
  | 'IDENTIFIED'
  | 'INVESTIGATING'
  | 'MONITORING'
  | 'RESOLVED';

export type ItNetworkItemInput = {
  address: InputMaybe<Scalars['String']['input']>;
  kind: ItNetworkKind;
  location: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  provider: InputMaybe<Scalars['String']['input']>;
  status: ItServiceStatus;
};

export type ItNetworkKind =
  | 'DNS'
  | 'FIREWALL'
  | 'IP_RANGE'
  | 'OTHER'
  | 'ROUTER'
  | 'SWITCH'
  | 'VPN'
  | 'WIFI';

export type ItPurchaseKind =
  | 'HARDWARE'
  | 'SERVICE'
  | 'SOFTWARE';

export type ItPurchaseQuoteInput = {
  amount: Scalars['Float']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  vendor: Scalars['String']['input'];
};

/** APPROVED and REJECTED are refused here — they come only from decideItPurchaseRequest. */
export type ItPurchaseRequestInput = {
  estimatedCost: Scalars['Float']['input'];
  justification: Scalars['String']['input'];
  kind: ItPurchaseKind;
  orderReference: InputMaybe<Scalars['String']['input']>;
  quantity: Scalars['Int']['input'];
  quotes: InputMaybe<Array<ItPurchaseQuoteInput>>;
  requestedForName: InputMaybe<Scalars['String']['input']>;
  status: ItPurchaseStatus;
  title: Scalars['String']['input'];
};

export type ItPurchaseStatus =
  | 'APPROVED'
  | 'CANCELLED'
  | 'ORDERED'
  | 'QUOTED'
  | 'RECEIVED'
  | 'REJECTED'
  | 'REQUESTED';

export type ItRisk =
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

export type ItServiceStatus =
  | 'ACTIVE'
  | 'DEGRADED'
  | 'DOWN'
  | 'RETIRED';

export type ItSettingsInput = {
  applications: Array<Scalars['String']['input']>;
  certificateWarningDays: Scalars['Int']['input'];
  onboardingApplications: Array<Scalars['String']['input']>;
  renewalWarningDays: Scalars['Int']['input'];
  ticketTopics: Array<Scalars['String']['input']>;
  warrantyWarningDays: Scalars['Int']['input'];
};

export type ItVulnSeverity =
  | 'CRITICAL'
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

export type ItVulnSource =
  | 'PENTEST'
  | 'REPORT'
  | 'SCAN'
  | 'VENDOR_ADVISORY';

export type ItVulnStatus =
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'MITIGATED'
  | 'OPEN'
  | 'RESOLVED';

export type ItVulnerabilityInput = {
  affectedSystem: Scalars['String']['input'];
  cve: InputMaybe<Scalars['String']['input']>;
  discoveredAt: Scalars['DateTime']['input'];
  dueAt: InputMaybe<Scalars['DateTime']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  ownerName: InputMaybe<Scalars['String']['input']>;
  severity: ItVulnSeverity;
  source: ItVulnSource;
  status: ItVulnStatus;
  title: Scalars['String']['input'];
};

export type ItemSeoInput = {
  description: InputMaybe<Scalars['String']['input']>;
  keywords: InputMaybe<Scalars['String']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  ogImageUrl: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type JobCompanyInput = {
  benefits: InputMaybe<Array<CompanyBenefitInput>>;
  brandColor: InputMaybe<Scalars['String']['input']>;
  companyCode: Scalars['String']['input'];
  culture: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  employees: InputMaybe<Scalars['String']['input']>;
  founded: InputMaybe<Scalars['String']['input']>;
  headquarters: InputMaybe<Scalars['String']['input']>;
  industry: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  logo: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  order: InputMaybe<Scalars['Int']['input']>;
  secondaryColor: InputMaybe<Scalars['String']['input']>;
  seo: InputMaybe<ItemSeoInput>;
  siteId: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  socialLinks: InputMaybe<CompanySocialLinksInput>;
  tagline: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
};

export type JobInput = {
  applicationDeadline: InputMaybe<Scalars['DateTime']['input']>;
  benefits: InputMaybe<Array<Scalars['String']['input']>>;
  category: Scalars['String']['input'];
  companySlug: Scalars['String']['input'];
  experienceLevel: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  isFeatured: InputMaybe<Scalars['Boolean']['input']>;
  jobCode: Scalars['String']['input'];
  jobDescription: InputMaybe<Scalars['String']['input']>;
  jobPostDate: InputMaybe<Scalars['DateTime']['input']>;
  jobResponsibilities: InputMaybe<Scalars['String']['input']>;
  jobType: Scalars['String']['input'];
  location: InputMaybe<Scalars['String']['input']>;
  niceToHave: InputMaybe<Array<Scalars['String']['input']>>;
  requirements: InputMaybe<Array<Scalars['String']['input']>>;
  salaryRange: InputMaybe<Scalars['String']['input']>;
  seo: InputMaybe<ItemSeoInput>;
  shortJobDescription: InputMaybe<Scalars['String']['input']>;
  siteId: InputMaybe<Scalars['String']['input']>;
  skillSet: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
  workMode: Scalars['String']['input'];
};

export type KbArticleInput = {
  body: Scalars['String']['input'];
  category: SupportCategory;
  isPublished: Scalars['Boolean']['input'];
  slug: Scalars['String']['input'];
  summary: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type LatLngInput = {
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
};

export type LeadEmailStatus =
  | 'BLOCKED'
  | 'FOUND'
  | 'NONE'
  | 'UNREACHABLE';

export type LeadImportInput = {
  address: InputMaybe<Scalars['String']['input']>;
  city: InputMaybe<Scalars['String']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  emails: InputMaybe<Array<Scalars['String']['input']>>;
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
  mapUrl: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  placeId: Scalars['ID']['input'];
  primaryType: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
};

/** What a lead would do on import. */
export type LeadImportStatus =
  /** Already in the CRM with nothing new: it will be skipped. */
  | 'DUPLICATE'
  /** Already in the CRM, and it has details the company is missing. */
  | 'DUPLICATE_WITH_EXTRA'
  /** Not in the CRM yet: it will be filed. */
  | 'NEW';

export type LeadInput = {
  /** Attribution. The campaign's name is filled in by the server from this id. */
  campaignId: InputMaybe<Scalars['String']['input']>;
  custom: InputMaybe<Scalars['JSON']['input']>;
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  source: LeadSource;
  stage: LeadStage;
  value: Scalars['Float']['input'];
};

/** A duplicate lead whose extra details should be added to the company the preview matched. */
export type LeadMergeInput = {
  companyId: Scalars['ID']['input'];
  placeId: Scalars['ID']['input'];
};

export type LeadSearchInput = {
  lat: InputMaybe<Scalars['Float']['input']>;
  lng: InputMaybe<Scalars['Float']['input']>;
  /** Where, as text (e.g. Pune, India). Ignored when lat and lng are given. */
  location: InputMaybe<Scalars['String']['input']>;
  pageToken: InputMaybe<Scalars['String']['input']>;
  /** An area drawn on the map (3 to 50 points): only places inside it. Wins over location and lat/lng. */
  polygon: InputMaybe<Array<LatLngInput>>;
  /** What to look for, e.g. dentists. */
  query: Scalars['String']['input'];
  /** Radius around lat/lng in metres, at most 50000. */
  radiusMeters: InputMaybe<Scalars['Int']['input']>;
  /** A Google Places type, e.g. dentist. */
  type: InputMaybe<Scalars['String']['input']>;
};

export type LeadSource =
  | 'ADS'
  | 'EVENT'
  | 'REFERRAL'
  | 'WEBSITE';

export type LeadSourceSettingsInput = {
  /** Blank keeps the stored token. */
  apifyToken: Scalars['String']['input'];
  clutchActorId: Scalars['String']['input'];
};

export type LeadStage =
  | 'CONTACTED'
  | 'LOST'
  | 'NEW'
  | 'QUALIFIED'
  | 'WON';

export type LeaveBalanceInput = {
  adjustment: Scalars['Int']['input'];
  allocated: Scalars['Int']['input'];
  carriedForward: Scalars['Int']['input'];
  employeeId: Scalars['String']['input'];
  leaveTypeCode: Scalars['String']['input'];
  used: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};

export type LeavePolicyInput = {
  active: Scalars['Boolean']['input'];
  annualQuota: Scalars['Int']['input'];
  carryForwardCap: Scalars['Int']['input'];
  code: Scalars['String']['input'];
  halfDayAllowed: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  overrides: Array<LeavePolicyOverrideInput>;
  paid: Scalars['Boolean']['input'];
};

export type LeavePolicyOverrideInput = {
  active: Scalars['Boolean']['input'];
  annualQuota: Scalars['Int']['input'];
  carryForwardCap: Scalars['Int']['input'];
  country: Scalars['String']['input'];
};

export type LeaveRequestInput = {
  employeeId: Scalars['String']['input'];
  fromDate: Scalars['DateTime']['input'];
  reason: Scalars['String']['input'];
  status: LeaveStatus;
  toDate: Scalars['DateTime']['input'];
  type: Scalars['String']['input'];
};

export type LeaveStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

export type LegalAssignmentItemInput = {
  itemId: Scalars['ID']['input'];
  kind: LegalItemKind;
};

export type LegalDocumentInput = {
  category: DocumentCategory;
  content: InputMaybe<Scalars['String']['input']>;
  fileUrl: InputMaybe<Scalars['String']['input']>;
  groupId: InputMaybe<Scalars['ID']['input']>;
  owner: InputMaybe<Scalars['String']['input']>;
  status: DocumentStatus;
  title: Scalars['String']['input'];
};

export type LegalGroupInput = {
  description: InputMaybe<Scalars['String']['input']>;
  kind: LegalItemKind;
  name: Scalars['String']['input'];
};

/** The registers Legal keeps: each can be grouped and handed to employees. */
export type LegalItemKind =
  | 'CONTRACT'
  | 'DOCUMENT'
  | 'POLICY';

export type LicenceBillingCycle =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY';

export type LicenceInput = {
  assigneeIds: InputMaybe<Array<Scalars['String']['input']>>;
  billingCycle: LicenceBillingCycle;
  cost: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  renewalDate: Scalars['DateTime']['input'];
  seatsTotal: Scalars['Int']['input'];
  status: LicenceStatus;
  vendor: Scalars['String']['input'];
};

export type LicenceStatus =
  | 'ACTIVE'
  | 'CANCELLED';

export type LifecycleStage =
  | 'CUSTOMER'
  | 'EVANGELIST'
  | 'LEAD'
  | 'MARKETING_QUALIFIED'
  | 'OPPORTUNITY'
  | 'OTHER'
  | 'SALES_QUALIFIED'
  | 'SUBSCRIBER';

export type LocationInput = {
  active: Scalars['Boolean']['input'];
  address: Scalars['String']['input'];
  city: Scalars['String']['input'];
  code: Scalars['String']['input'];
  country: Scalars['String']['input'];
  name: Scalars['String']['input'];
  state: Scalars['String']['input'];
  timezone: Scalars['String']['input'];
};

export type LoginPageInput = {
  accentColor: Scalars['String']['input'];
  app: Scalars['String']['input'];
  backgroundImageUrl: Scalars['String']['input'];
  name: Scalars['String']['input'];
  tagline: Scalars['String']['input'];
};

export type MaActionItemInput = {
  assignedTo: InputMaybe<Scalars['String']['input']>;
  assignedUserId: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  dueDate: InputMaybe<Scalars['DateTime']['input']>;
  priority: MaPriority;
  status: MaActionStatus;
  title: Scalars['String']['input'];
};

export type MaActionStatus =
  | 'BLOCKED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'PENDING';

export type MaAuthorizeExtensionInput = {
  codeChallenge: Scalars['String']['input'];
  codeChallengeMethod: Scalars['String']['input'];
  extensionId: Scalars['String']['input'];
  redirectUri: Scalars['String']['input'];
  state: Scalars['String']['input'];
};

export type MaBulkActionInput = {
  ids: Array<Scalars['ID']['input']>;
  priority: InputMaybe<MaPriority>;
  status: InputMaybe<MaActionStatus>;
};

/** Whether the viewer's Google Meet events can be shown on the calendar. */
export type MaCalendarGoogleState =
  | 'CONNECTED'
  /** The company has no Google sign-in client in Tech. */
  | 'NOT_CONFIGURED'
  /** The viewer has not connected Google Meet. */
  | 'NOT_CONNECTED'
  /** The connection predates the calendar scope, or Google no longer accepts it. */
  | 'RECONNECT_REQUIRED'
  /** Google could not be read just now; googleError says why. */
  | 'UNAVAILABLE';

export type MaCaptureState =
  | 'ERROR'
  | 'IDLE'
  | 'PAUSED'
  | 'RECORDING'
  | 'STOPPED';

export type MaDashboardFilter = {
  from: InputMaybe<Scalars['DateTime']['input']>;
  language: InputMaybe<MaLanguage>;
  ownerId: InputMaybe<Scalars['String']['input']>;
  participantUserId: InputMaybe<Scalars['String']['input']>;
  scope: InputMaybe<MaScope>;
  status: InputMaybe<MaMeetingStatus>;
  to: InputMaybe<Scalars['DateTime']['input']>;
};

export type MaDeliveryStatus =
  | 'FAILED'
  | 'PENDING'
  | 'SENT';

export type MaEmailStatus =
  | 'AWAITING_APPROVAL'
  | 'FAILED'
  | 'NOT_SENT'
  | 'PARTIAL'
  | 'QUEUED'
  | 'SENT';

export type MaEventLevel =
  | 'ERROR'
  | 'INFO'
  | 'WARN';

export type MaHeartbeatInput = {
  captureState: MaCaptureState;
  participantCount: Scalars['Int']['input'];
  title: InputMaybe<Scalars['String']['input']>;
  transcriptionState: MaTranscriptionState;
};

export type MaLanguage =
  | 'AUTO'
  | 'ENGLISH'
  | 'HINDI'
  | 'HINGLISH';

export type MaMeetingStatus =
  | 'ACTIVE'
  | 'ENDED';

/** What a model is picked for: writing the notes (ANALYSIS) or speech to text (TRANSCRIPTION). */
export type MaModelPurpose =
  | 'ANALYSIS'
  | 'TRANSCRIPTION';

export type MaNotesContentInput = {
  agenda: Array<Scalars['String']['input']>;
  blockers: Array<Scalars['String']['input']>;
  discussionPoints: Array<Scalars['String']['input']>;
  executiveSummary: Scalars['String']['input'];
  followUps: Array<Scalars['String']['input']>;
  nextTopics: Array<Scalars['String']['input']>;
  openQuestions: Array<Scalars['String']['input']>;
  overview: Scalars['String']['input'];
  risks: Array<Scalars['String']['input']>;
};

/** A Meet participant event, as the extension saw it in the visible call UI. */
export type MaParticipantEventInput = {
  at: Scalars['DateTime']['input'];
  displayName: Scalars['String']['input'];
  event: MaParticipantStatus;
  /** True for the signed-in extension user, whose identity is verified. */
  isSelf: Scalars['Boolean']['input'];
  key: Scalars['String']['input'];
};

export type MaParticipantSource =
  | 'EXTENSION_USER'
  | 'GOOGLE_MEET_API'
  | 'MEET_UI';

export type MaParticipantStatus =
  | 'JOINED'
  | 'LEFT'
  | 'UNKNOWN';

export type MaPriority =
  | 'CRITICAL'
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

export type MaReleaseChannel =
  | 'BETA'
  | 'INTERNAL'
  | 'STABLE';

export type MaReleaseSettingsInput = {
  allowedRepository: Scalars['String']['input'];
  notifyOnNewBuild: Scalars['Boolean']['input'];
  slackChannelId: Scalars['String']['input'];
};

export type MaReleaseStatus =
  | 'BUILDING'
  | 'BUILD_FAILED'
  | 'DEPRECATED'
  | 'DRAFT'
  | 'INTERNAL_RELEASED'
  | 'IN_REVIEW'
  | 'PUBLISHED'
  | 'QA_PENDING'
  | 'READY_FOR_INTERNAL_TESTING'
  | 'READY_FOR_STORE_SUBMISSION'
  | 'REJECTED'
  | 'SUBMITTED_FOR_REVIEW';

export type MaReleaseStatusInput = {
  note: Scalars['String']['input'];
  status: MaReleaseStatus;
  storeItemId: InputMaybe<Scalars['String']['input']>;
  storeUrl: InputMaybe<Scalars['String']['input']>;
};

/** Which meetings a list covers: the caller's own, or the whole company (AI role). */
export type MaScope =
  | 'ALL'
  | 'MINE';

export type MaSettingsInput = {
  allowedUserIds: Array<Scalars['String']['input']>;
  analysisModel: Scalars['String']['input'];
  audioRetentionDays: Scalars['Int']['input'];
  autoEmail: Scalars['Boolean']['input'];
  autoGenerateSummary: Scalars['Boolean']['input'];
  defaultRecipients: Array<Scalars['String']['input']>;
  diarization: Scalars['Boolean']['input'];
  emailAllowedDomains: Array<Scalars['String']['input']>;
  emailParticipants: Scalars['Boolean']['input'];
  emailRequiresApproval: Scalars['Boolean']['input'];
  enabled: Scalars['Boolean']['input'];
  liveTranscript: Scalars['Boolean']['input'];
  maxMeetingMinutes: Scalars['Int']['input'];
  maxRemindersPerMeeting: Scalars['Int']['input'];
  monthlyBudgetUsd: Scalars['Float']['input'];
  participantTracking: Scalars['Boolean']['input'];
  preferredLanguage: MaLanguage;
  releaseChannel: MaReleaseChannel;
  reminderIntervalMinutes: Scalars['Int']['input'];
  remindersEnabled: Scalars['Boolean']['input'];
  saveRecordings: Scalars['Boolean']['input'];
  summaryStyle: MaSummaryStyle;
  transcriptRetentionDays: Scalars['Int']['input'];
  transcriptionModel: Scalars['String']['input'];
};

export type MaSpeakerInput = {
  label: Scalars['String']['input'];
  name: Scalars['String']['input'];
  userId: InputMaybe<Scalars['String']['input']>;
};

export type MaStartSessionInput = {
  meetingCode: Scalars['String']['input'];
  startedAt: Scalars['DateTime']['input'];
  timezone: Scalars['String']['input'];
  title: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type MaStepStatus =
  | 'FAILED'
  | 'NOT_STARTED'
  | 'QUEUED'
  | 'READY'
  | 'RUNNING'
  | 'SKIPPED';

export type MaSummaryStyle =
  | 'CLIENT'
  | 'DETAILED'
  | 'EXECUTIVE'
  | 'PROJECT_REVIEW'
  | 'SALES'
  | 'SHORT'
  | 'STANDUP'
  | 'TECHNICAL';

export type MaTranscriptSource =
  | 'AI'
  | 'GOOGLE_MEET';

export type MaTranscriptionState =
  | 'NOT_SUPPORTED'
  | 'OFF'
  | 'ON'
  | 'PERMISSION_REQUIRED'
  | 'UNKNOWN';

export type MaUpdateMeetingInput = {
  language: MaLanguage;
  title: Scalars['String']['input'];
};

export type ManagementReviewActionInput = {
  description: Scalars['String']['input'];
  done: Scalars['Boolean']['input'];
  dueOn: InputMaybe<Scalars['DateTime']['input']>;
  ownerName: Scalars['String']['input'];
};

export type ManagementReviewInput = {
  actions: Array<ManagementReviewActionInput>;
  attendees: Scalars['String']['input'];
  chairName: Scalars['String']['input'];
  decisions: Scalars['String']['input'];
  heldOn: Scalars['DateTime']['input'];
  inputs: Scalars['String']['input'];
  standards: Array<ManagementStandard>;
  status: ManagementReviewStatus;
  title: Scalars['String']['input'];
};

export type ManagementReviewStatus =
  | 'HELD'
  | 'MINUTED'
  | 'PLANNED';

/** A management system standard the company runs to. A record may answer to several. */
export type ManagementStandard =
  | 'ISO_9001'
  | 'ISO_14001'
  | 'ISO_27001'
  | 'ISO_45001';

/** Employee-facing attendance entry — the server sets employeeId. */
export type MarkAttendanceInput = {
  date: Scalars['DateTime']['input'];
  note: InputMaybe<Scalars['String']['input']>;
  status: AttendanceStatus;
};

export type MarketingFooterInput = {
  companyName: Scalars['String']['input'];
  contactLine: InputMaybe<Scalars['String']['input']>;
  linkColor: InputMaybe<Scalars['String']['input']>;
  postalAddress: Scalars['String']['input'];
  privacyUrl: InputMaybe<Scalars['String']['input']>;
  textColor: InputMaybe<Scalars['String']['input']>;
  websiteUrl: InputMaybe<Scalars['String']['input']>;
};

export type MarketingSuppressionInput = {
  /** Hide it from the list straight away. It is suppressed either way. */
  archived: InputMaybe<Scalars['Boolean']['input']>;
  email: Scalars['String']['input'];
  note: InputMaybe<Scalars['String']['input']>;
  reason: SuppressionReason;
};

export type MarketingSuppressionsInput = {
  emails: Array<Scalars['String']['input']>;
  /** True when the addresses were read from an uploaded file (origin IMPORT). */
  fromFile: InputMaybe<Scalars['Boolean']['input']>;
  note: InputMaybe<Scalars['String']['input']>;
  reason: SuppressionReason;
};

/** An MCP server: one module's (CRM, MARKETING, HR and the rest), or ALL, which combines every module's tools. */
export type McpEndpoint =
  | 'ADMIN'
  | 'AI'
  | 'ALL'
  | 'CLIENTHUB'
  | 'COMPLIANCE'
  | 'CRM'
  | 'EMPLOYEE'
  | 'FINANCE'
  | 'HR'
  | 'IT'
  | 'LEGAL'
  | 'MARKETING'
  | 'PRODUCTS'
  | 'PROJECTS'
  | 'SOCIAL'
  | 'STATUS'
  | 'SUPPORT'
  | 'TECH'
  | 'TRACKER'
  | 'WEBSITE';

export type McpToolKind =
  | 'MUTATION'
  | 'QUERY';

export type MeetingBookingStatus =
  | 'CANCELLED'
  | 'CONFIRMED';

export type MeetingSettingsInput = {
  bookingSlug: Scalars['String']['input'];
  googleMeetUrl: InputMaybe<Scalars['String']['input']>;
  slackChannel: InputMaybe<Scalars['String']['input']>;
  zoomUrl: InputMaybe<Scalars['String']['input']>;
};

export type MeetingTypeInput = {
  active: Scalars['Boolean']['input'];
  bufferMinutes: Scalars['Int']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  durationMinutes: Scalars['Int']['input'];
  location: InputMaybe<Scalars['String']['input']>;
  maxDaysAhead: Scalars['Int']['input'];
  minNoticeHours: Scalars['Int']['input'];
  slug: Scalars['String']['input'];
  timezone: Scalars['String']['input'];
  title: Scalars['String']['input'];
  weeklyHours: Array<MeetingWeeklyHoursInput>;
};

export type MeetingVisitKind =
  | 'BOOKED'
  | 'VIEW';

export type MeetingWeeklyHoursInput = {
  day: Scalars['Int']['input'];
  enabled: Scalars['Boolean']['input'];
  end: Scalars['String']['input'];
  start: Scalars['String']['input'];
};

export type MicrosoftMailConfigInput = {
  clientId: Scalars['String']['input'];
  /** Blank keeps the stored secret. */
  clientSecret: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  /** Blank means common. */
  tenant: Scalars['String']['input'];
};

export type MilestoneInput = {
  description: InputMaybe<Scalars['String']['input']>;
  dueOn: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  state: InputMaybe<MilestoneState>;
};

export type MilestoneState =
  | 'HIT'
  | 'IN_PROGRESS'
  | 'MISSED'
  | 'PLANNED';

/** Why a product's stock changed. */
export type MovementReason =
  | 'COUNT'
  | 'ISSUE'
  | 'RECEIPT'
  | 'RETURN'
  | 'WRITE_OFF';

export type MyExpenseClaimInput = {
  amount: Scalars['Float']['input'];
  category: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  description: Scalars['String']['input'];
  incurredOn: Scalars['DateTime']['input'];
  receiptUrl: InputMaybe<Scalars['String']['input']>;
};

export type MyRequestInput = {
  details: Scalars['String']['input'];
  subject: Scalars['String']['input'];
  type: RequestType;
};

export type NameserverTarget =
  | 'CLOUDFLARE'
  | 'CUSTOM'
  | 'GODADDY';

export type NavLinkInput = {
  category: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  href: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  keywords: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  order: InputMaybe<Scalars['Int']['input']>;
  siteId: InputMaybe<Scalars['String']['input']>;
};

export type NewsletterIssueInput = {
  content: Scalars['String']['input'];
  contentCss: InputMaybe<Scalars['String']['input']>;
  coverImage: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  publishedAt: InputMaybe<Scalars['String']['input']>;
  seo: InputMaybe<ItemSeoInput>;
  siteId: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  summary: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type NewsletterSignupInput = {
  email: Scalars['String']['input'];
  name: InputMaybe<Scalars['String']['input']>;
  /** The site's key; the default site when empty. */
  site: InputMaybe<Scalars['String']['input']>;
  /** The page they signed up on. */
  source: InputMaybe<Scalars['String']['input']>;
};

export type NewsletterSubscriberStatus =
  | 'SUBSCRIBED'
  | 'UNSUBSCRIBED';

export type NotificationAudience =
  | 'ALL'
  | 'DEPARTMENT'
  | 'EMPLOYEES';

export type NotificationKind =
  | 'ANNOUNCEMENT'
  | 'COMPLIANCE'
  | 'CRM'
  | 'FINANCE'
  | 'GENERAL'
  | 'GOAL'
  | 'IT'
  | 'LEAVE'
  | 'LEGAL'
  | 'ONBOARDING'
  | 'PAYROLL'
  | 'PERFORMANCE'
  | 'PROJECT'
  | 'REQUEST'
  | 'SOCIAL_COMMENT'
  | 'SOCIAL_LIKE'
  | 'SOCIAL_SHARE'
  | 'SUPPORT'
  | 'TRAINING';

export type NotificationPreferenceInput = {
  email: Scalars['Boolean']['input'];
  inPortal: Scalars['Boolean']['input'];
  kind: NotificationKind;
};

export type ObjectiveFrequency =
  | 'HALF_YEARLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY';

export type ObjectiveInput = {
  actual: Scalars['Float']['input'];
  area: Scalars['String']['input'];
  baseline: Scalars['Float']['input'];
  category: ComplianceCategory;
  description: Scalars['String']['input'];
  frequency: ObjectiveFrequency;
  measure: Scalars['String']['input'];
  ownerId: Scalars['String']['input'];
  ownerName: Scalars['String']['input'];
  periodEnd: Scalars['DateTime']['input'];
  periodStart: Scalars['DateTime']['input'];
  plan: Scalars['String']['input'];
  scope: ObjectiveScope;
  standards: Array<ManagementStandard>;
  status: ObjectiveStatus;
  target: Scalars['Float']['input'];
  title: Scalars['String']['input'];
  unit: Scalars['String']['input'];
};

export type ObjectiveScope =
  | 'COMPANY'
  | 'DEPARTMENT'
  | 'PROCESS';

export type ObjectiveStatus =
  | 'AT_RISK'
  | 'MET'
  | 'MISSED'
  | 'ON_TRACK'
  | 'PLANNED';

/** Who is expected to do an onboarding task — and, therefore, who may tick it off. */
export type OnboardingOwner =
  | 'EMPLOYEE'
  | 'HR'
  | 'IT'
  | 'MANAGER';

export type OnboardingTaskInput = {
  dueDaysFromJoin: Scalars['Int']['input'];
  key: Scalars['String']['input'];
  label: Scalars['String']['input'];
  owner: OnboardingOwner;
};

export type OnboardingTemplateInput = {
  active: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  tasks: Array<OnboardingTaskInput>;
};

export type OpenAiConfigInput = {
  /** Write-only. Leave empty when editing to keep the stored key. */
  apiKey: Scalars['String']['input'];
  defaultModel: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

/** The person a company is handed over to — its first administrator. */
export type OrganizationAdminInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type OrganizationInput = {
  addressLine1: InputMaybe<Scalars['String']['input']>;
  addressLine2: InputMaybe<Scalars['String']['input']>;
  city: InputMaybe<Scalars['String']['input']>;
  companySize: InputMaybe<Scalars['String']['input']>;
  contactEmail: InputMaybe<Scalars['String']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  currency: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  fiscalYearStartMonth: InputMaybe<Scalars['Int']['input']>;
  industry: InputMaybe<Scalars['String']['input']>;
  legalName: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  postalCode: InputMaybe<Scalars['String']['input']>;
  region: InputMaybe<Scalars['String']['input']>;
  registrationNumber: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  taxId: InputMaybe<Scalars['String']['input']>;
  taxSystem: InputMaybe<TaxSystem>;
  timezone: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
};

/** Somebody invited into a company, with the portals (roles) they may open. */
export type OrganizationMemberInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  /** One role per portal they may open. SUPER_ADMIN is never granted this way. */
  roles: Array<Role>;
};

export type OrganizationStatus =
  | 'ACTIVE'
  | 'SUSPENDED';

export type OrganizationUpdateInput = {
  addressLine1: InputMaybe<Scalars['String']['input']>;
  addressLine2: InputMaybe<Scalars['String']['input']>;
  city: InputMaybe<Scalars['String']['input']>;
  companySize: InputMaybe<Scalars['String']['input']>;
  contactEmail: InputMaybe<Scalars['String']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  currency: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  fiscalYearStartMonth: InputMaybe<Scalars['Int']['input']>;
  industry: InputMaybe<Scalars['String']['input']>;
  legalName: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  postalCode: InputMaybe<Scalars['String']['input']>;
  region: InputMaybe<Scalars['String']['input']>;
  registrationNumber: InputMaybe<Scalars['String']['input']>;
  taxId: InputMaybe<Scalars['String']['input']>;
  taxSystem: InputMaybe<TaxSystem>;
  timezone: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
};

/** How an employee is paid. Decides which amounts on the salary structure mean anything. */
export type PayType =
  | 'FIXED'
  | 'HOURLY'
  | 'OTHER'
  | 'STIPEND';

export type PaymentAttemptStatus =
  | 'EXPIRED'
  | 'PAID'
  | 'PENDING'
  | 'REVIEW';

export type PaymentGateway =
  | 'PAYONEER'
  | 'PAYPAL'
  | 'RAZORPAY'
  | 'STRIPE';

export type PaymentInput = {
  amount: Scalars['Float']['input'];
  invoiceId: Scalars['ID']['input'];
  method: PaymentMethod;
  notes: InputMaybe<Scalars['String']['input']>;
  receivedAt: InputMaybe<Scalars['DateTime']['input']>;
  reference: InputMaybe<Scalars['String']['input']>;
};

export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'CASH'
  | 'CHEQUE'
  | 'OTHER'
  | 'UPI';

export type PayoneerConfigInput = {
  /** Left blank on an edit, the stored token is kept. */
  apiToken: InputMaybe<Scalars['String']['input']>;
  division: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  label: Scalars['String']['input'];
  merchantCode: Scalars['String']['input'];
  mode: GatewayMode;
};

/** A blank sealed detail on an edit keeps the stored one. */
export type PayoutAccountInput = {
  accountNumber: Scalars['String']['input'];
  accountType: InputMaybe<BankAccountType>;
  bankName: Scalars['String']['input'];
  bic: Scalars['String']['input'];
  branchName: Scalars['String']['input'];
  city: Scalars['String']['input'];
  country: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  holderName: Scalars['String']['input'];
  iban: Scalars['String']['input'];
  isPrimary: InputMaybe<Scalars['Boolean']['input']>;
  method: PayoutMethod;
  phone: Scalars['String']['input'];
  region: Scalars['String']['input'];
  routingCode: Scalars['String']['input'];
  upiId: Scalars['String']['input'];
  walletEmail: Scalars['String']['input'];
};

/** How money reaches the payee (the same codes as @exyconn/payout PAYOUT_METHODS). */
export type PayoutMethod =
  | 'BANK_TRANSFER'
  | 'PAYONEER'
  | 'PAYPAL'
  | 'UPI'
  | 'WESTERN_UNION'
  | 'WISE';

/** A sealed detail of a payout account, shown in full only on request (and logged). */
export type PayoutSecretField =
  | 'ACCOUNT_NUMBER'
  | 'IBAN'
  | 'PHONE'
  | 'UPI_ID'
  | 'WALLET_EMAIL';

export type PaypalConfigInput = {
  clientId: Scalars['String']['input'];
  /** Left blank on an edit, the stored secret is kept. */
  clientSecret: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  label: Scalars['String']['input'];
  mode: GatewayMode;
  webhookId: Scalars['String']['input'];
};

/**
 * Where one active employee stands for a month's run. READY can be run; ALREADY_RUN has a
 * slip for the month and is never run again; NO_STRUCTURE has no salary structure on file.
 */
export type PayrollCandidateStatus =
  | 'ALREADY_RUN'
  | 'NO_STRUCTURE'
  | 'READY';

export type PayrollScheduleInput = {
  dayOfMonth: Scalars['Int']['input'];
  enabled: Scalars['Boolean']['input'];
  hour: Scalars['Int']['input'];
  minute: Scalars['Int']['input'];
  period: Scalars['String']['input'];
};

export type PayrollSettingsInput = {
  esiEmployeePercent: Scalars['Float']['input'];
  esiEnabled: Scalars['Boolean']['input'];
  esiWageLimit: Scalars['Float']['input'];
  financialYearStartMonth: InputMaybe<Scalars['Int']['input']>;
  pfEmployeePercent: Scalars['Float']['input'];
  pfEnabled: Scalars['Boolean']['input'];
  pfWageCeiling: Scalars['Float']['input'];
  professionalTaxMonthly: Scalars['Float']['input'];
  runFromDay: InputMaybe<Scalars['Int']['input']>;
  tdsAnnualExemption: InputMaybe<Scalars['Float']['input']>;
  tdsCessPercent: InputMaybe<Scalars['Float']['input']>;
  tdsFlatPercent: Scalars['Float']['input'];
  tdsMode: TdsMode;
  tdsRegimeKey: InputMaybe<Scalars['String']['input']>;
  tdsSlabs: InputMaybe<Array<TdsSlabInput>>;
};

export type PerformanceReviewInput = {
  actionPlan: Scalars['String']['input'];
  competencies: Scalars['String']['input'];
  cycle: Scalars['String']['input'];
  employeeId: Scalars['String']['input'];
  managerAssessment: Scalars['String']['input'];
  rating: InputMaybe<Scalars['String']['input']>;
  score: InputMaybe<Scalars['Float']['input']>;
  selfAssessment: Scalars['String']['input'];
  status: ReviewStatus;
};

export type PermissionAction =
  | 'APPROVE'
  | 'CREATE'
  | 'DELETE'
  | 'EDIT'
  | 'EXPORT'
  | 'VIEW';

export type PexelsConfigInput = {
  /** Write-only. Leave empty when editing to keep the stored key. */
  apiKey: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

/**
 * The Pexels search filters the upload dialog exposes. Colour is photo-only; the duration
 * bounds (in seconds) are video-only. An omitted field means "any".
 */
export type PexelsSearchFilters = {
  /** A Pexels colour name, or a #rrggbb value. Photos only. */
  color: InputMaybe<Scalars['String']['input']>;
  maxDuration: InputMaybe<Scalars['Int']['input']>;
  /** Videos only, in seconds. */
  minDuration: InputMaybe<Scalars['Int']['input']>;
  /** landscape | portrait | square */
  orientation: InputMaybe<Scalars['String']['input']>;
  /** large | medium | small */
  size: InputMaybe<Scalars['String']['input']>;
};

export type PolicyAudience =
  | 'ALL_STAFF'
  | 'HR_ONLY'
  | 'PUBLIC';

/** Which part of the company a policy governs. IT maintains the IT and SECURITY ones. */
export type PolicyCategory =
  | 'FINANCE'
  | 'GENERAL'
  | 'HR'
  | 'IT'
  | 'PRIVACY'
  | 'SECURITY';

/**
 * How far a document may travel (ISO 27001 A.5.12).
 *
 * The document's own label, not a permission: who may open a policy is decided by its
 * audience and the reader's role.
 */
export type PolicyClassification =
  | 'CONFIDENTIAL'
  | 'INTERNAL'
  | 'PUBLIC';

export type PolicyInput = {
  audience: PolicyAudience;
  body: Scalars['String']['input'];
  /** Defaults to GENERAL. */
  category: InputMaybe<PolicyCategory>;
  classification: InputMaybe<PolicyClassification>;
  effectiveDate: Scalars['DateTime']['input'];
  groupId: InputMaybe<Scalars['ID']['input']>;
  nextReviewOn: InputMaybe<Scalars['DateTime']['input']>;
  owner: InputMaybe<Scalars['String']['input']>;
  requiresAcknowledgement: InputMaybe<Scalars['Boolean']['input']>;
  slug: Scalars['String']['input'];
  summary: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type PolicyStatus =
  | 'ARCHIVED'
  | 'DRAFT'
  | 'PUBLISHED';

export type PositionInput = {
  active: Scalars['Boolean']['input'];
  code: InputMaybe<Scalars['String']['input']>;
  department: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  employmentType: InputMaybe<Scalars['String']['input']>;
  grade: InputMaybe<Scalars['String']['input']>;
  headcount: Scalars['Int']['input'];
  maxSalary: Scalars['Float']['input'];
  minSalary: Scalars['Float']['input'];
  name: Scalars['String']['input'];
};

export type PreferenceCategoryInput = {
  description: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  sortOrder: InputMaybe<Scalars['Int']['input']>;
};

export type PreviewRecordKind =
  | 'COMPANY'
  | 'CONTACT';

export type ProblemCategory =
  | 'DATA'
  | 'LOGIN'
  | 'OTHER'
  | 'OUTAGE'
  | 'SLOWNESS'
  | 'UI';

/** Triage fields the Tech portal owns; the public form never sends these. */
export type ProblemReportInput = {
  assignee: Scalars['String']['input'];
  category: ProblemCategory;
  description: Scalars['String']['input'];
  pageUrl: Scalars['String']['input'];
  reporterEmail: Scalars['String']['input'];
  reporterName: Scalars['String']['input'];
  resolutionNotes: Scalars['String']['input'];
  serviceKey: Scalars['String']['input'];
  serviceName: Scalars['String']['input'];
  severity: ProblemSeverity;
  status: ProblemStatus;
  subject: Scalars['String']['input'];
};

export type ProblemSeverity =
  | 'CRITICAL'
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

export type ProblemStatus =
  | 'CLOSED'
  | 'IN_PROGRESS'
  | 'NEW'
  | 'RESOLVED'
  | 'TRIAGED';

export type ProductInput = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  reorderLevel: InputMaybe<Scalars['Int']['input']>;
  sku: Scalars['String']['input'];
  status: ProductStatus;
  /** Opening stock. Only honoured on create — afterwards the level moves through stock movements. */
  stock: InputMaybe<Scalars['Int']['input']>;
};

export type ProductStatus =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'DRAFT';

export type ProjectInput = {
  budgetAmount: InputMaybe<Scalars['Float']['input']>;
  budgetHours: InputMaybe<Scalars['Float']['input']>;
  clientId: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  endDate: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  startDate: InputMaybe<Scalars['DateTime']['input']>;
  status: ProjectStatus;
};

/**
 * How worrying a project is.
 *
 * UNKNOWN is not LOW: it means nothing measurable was set up — no done column, no end date,
 * no hours budget — and silence is not good news.
 */
export type ProjectRisk =
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM'
  | 'UNKNOWN';

export type ProjectStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'PLANNING';

/** Where a project stands against its own dates. */
export type ProjectTimeline =
  | 'COMPLETED'
  | 'DUE_SOON'
  /** No end date was set, so there is nothing to be late for. */
  | 'NO_DATES'
  | 'ON_TRACK'
  | 'OVERDUE';

export type ProjectWorkflowInput = {
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type PromptCategory =
  | 'ANALYSIS'
  | 'CODING'
  | 'GENERAL'
  | 'MARKETING'
  | 'SUPPORT'
  | 'WRITING';

export type PromptInput = {
  category: PromptCategory;
  content: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

/** One value filled into a prompt's {{name}} placeholder. */
export type PromptVariableInput = {
  name: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

/** Whether reading a provider's bill needs a different key from the one the platform uses. */
export type ProviderBillingNeed =
  | 'NO_BILLING_API'
  | 'PERMISSION'
  | 'REQUIRED'
  | 'SAME_KEY';

export type ProviderLinkInput = {
  kind: ProviderLinkKind;
  label: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type ProviderLinkKind =
  | 'API_KEYS'
  | 'BILLING'
  | 'DASHBOARD'
  | 'DOCS'
  | 'OTHER'
  | 'USAGE';

export type ProviderLoginInput = {
  label: Scalars['String']['input'];
  notes: Scalars['String']['input'];
  /** Blank on an edit keeps the stored password. */
  password: Scalars['String']['input'];
  signInMethod: ProviderSignInMethod;
  username: Scalars['String']['input'];
};

export type ProviderSignInMethod =
  | 'APPLE'
  | 'EMAIL_PASSWORD'
  | 'GITHUB'
  | 'GOOGLE'
  | 'MICROSOFT'
  | 'OTHER'
  | 'SSO';

export type PurchaseOrderInput = {
  currency: Scalars['String']['input'];
  expectedDate: InputMaybe<Scalars['DateTime']['input']>;
  lines: Array<PurchaseOrderLineInput>;
  notes: InputMaybe<Scalars['String']['input']>;
  orderDate: Scalars['DateTime']['input'];
  status: PurchaseOrderStatus;
  supplierId: Scalars['String']['input'];
};

export type PurchaseOrderLineInput = {
  productId: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
  taxPercent: Scalars['Float']['input'];
  unitCost: Scalars['Float']['input'];
};

export type PurchaseOrderStatus =
  | 'CANCELLED'
  | 'DRAFT'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED';

/** What arrived against one ordered line. */
export type PurchaseReceiptLineInput = {
  productId: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
};

export type RazorpayConfigInput = {
  isActive: Scalars['Boolean']['input'];
  keyId: Scalars['String']['input'];
  /** Left blank on an edit, the stored secret is kept. */
  keySecret: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  webhookSecret: InputMaybe<Scalars['String']['input']>;
};

/** How often a retainer bills. A small fixed list, deliberately — not a cron expression. */
export type RecurrenceFrequency =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'WEEKLY'
  | 'YEARLY';

export type RecurringInvoiceInput = {
  active: InputMaybe<Scalars['Boolean']['input']>;
  clientId: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  dueDays: Scalars['Int']['input'];
  endDate: InputMaybe<Scalars['DateTime']['input']>;
  frequency: RecurrenceFrequency;
  lines: Array<InvoiceLineInput>;
  name: Scalars['String']['input'];
  placeOfSupplyStateCode: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['DateTime']['input'];
};

export type RequestStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

export type RequestType =
  | 'DOCUMENT'
  | 'OTHER'
  | 'PROFILE_CHANGE'
  | 'REGULARIZATION'
  | 'REIMBURSEMENT'
  | 'TRAVEL'
  | 'WFH';

export type ReviewStatus =
  | 'CLOSED'
  | 'MANAGER_SUBMITTED'
  | 'OPEN'
  | 'SELF_SUBMITTED';

/** The reference is drawn from the company's own series on create; never sent by a client. */
export type RiskInput = {
  category: ComplianceCategory;
  closedOn: InputMaybe<Scalars['DateTime']['input']>;
  controls: Scalars['String']['input'];
  description: Scalars['String']['input'];
  identifiedOn: Scalars['DateTime']['input'];
  impact: Scalars['Int']['input'];
  likelihood: Scalars['Int']['input'];
  ownerId: Scalars['String']['input'];
  ownerName: Scalars['String']['input'];
  residualImpact: Scalars['Int']['input'];
  residualLikelihood: Scalars['Int']['input'];
  reviewDueOn: InputMaybe<Scalars['DateTime']['input']>;
  standards: Array<ManagementStandard>;
  status: RiskStatus;
  subject: Scalars['String']['input'];
  title: Scalars['String']['input'];
  treatment: RiskTreatment;
};

/** Where a 1-25 rating lands. Derived from the rating, never stored. */
export type RiskLevel =
  | 'CRITICAL'
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

export type RiskStatus =
  | 'CLOSED'
  | 'IDENTIFIED'
  | 'MONITORING'
  | 'TREATING';

/** How a risk is being dealt with (ISO 31000). */
export type RiskTreatment =
  | 'ACCEPT'
  | 'AVOID'
  | 'REDUCE'
  | 'TRANSFER';

export type Role =
  | 'ADMIN'
  | 'AI'
  | 'COMPLIANCE'
  | 'CRM'
  | 'EMPLOYEE'
  | 'FINANCE'
  | 'HR'
  | 'IT'
  | 'LEGAL'
  | 'MARKETING'
  | 'PRODUCTS'
  | 'PROJECTS'
  | 'SUPER_ADMIN'
  | 'SUPPORT'
  | 'TECH'
  | 'TRACKER'
  | 'WEBSITE';

export type SalaryStructureInput = {
  allowances: Scalars['Float']['input'];
  basic: Scalars['Float']['input'];
  /** Per hour, always — what the tracker bills this person's time at. */
  billingRate: InputMaybe<Scalars['Float']['input']>;
  currency: Scalars['String']['input'];
  deductions: Scalars['Float']['input'];
  effectiveFrom: Scalars['DateTime']['input'];
  employeeId: Scalars['String']['input'];
  esiApplicable: InputMaybe<Scalars['Boolean']['input']>;
  esiNumber: InputMaybe<Scalars['String']['input']>;
  hra: Scalars['Float']['input'];
  panNumber: InputMaybe<Scalars['String']['input']>;
  payType: InputMaybe<PayType>;
  payTypeNote: InputMaybe<Scalars['String']['input']>;
  /** This employee's own statutory position, overriding the company payroll settings. */
  pfApplicable: InputMaybe<Scalars['Boolean']['input']>;
  pfNumber: InputMaybe<Scalars['String']['input']>;
  /** Per hour for HOURLY, per month for STIPEND and OTHER. Ignored by FIXED. */
  rate: InputMaybe<Scalars['Float']['input']>;
  /** No tax bracket: no TDS is withheld from this person at all. */
  taxExempt: InputMaybe<Scalars['Boolean']['input']>;
  /** The regime key this person is taxed under. Null follows the one Payroll Settings names. */
  taxRegimeKey: InputMaybe<Scalars['String']['input']>;
  /** Percent of taxable pay withheld for this person; 0 falls back to the company rate. */
  tdsPercent: InputMaybe<Scalars['Float']['input']>;
};

export type SendColdEmailVariantInput = {
  body: Scalars['String']['input'];
  draftId: Scalars['ID']['input'];
  /** The connected Gmail or Microsoft mailbox to send from (crmEmailSenders). */
  fromAccountId: Scalars['ID']['input'];
  subject: Scalars['String']['input'];
  variantId: Scalars['ID']['input'];
};

export type SendCrmEmailInput = {
  body: Scalars['String']['input'];
  cc: InputMaybe<Array<Scalars['String']['input']>>;
  /** The connected Gmail or Microsoft mailbox to send from (crmEmailSenders); it has to be enabled for the CRM. */
  fromAccountId: Scalars['ID']['input'];
  /** The body is rich text (HTML) from the editor, cleaned before sending; plain text otherwise. */
  html: InputMaybe<Scalars['Boolean']['input']>;
  inReplyTo: InputMaybe<Scalars['String']['input']>;
  subject: Scalars['String']['input'];
  /** Replying: Gmail's thread id and the Message-ID being answered. */
  threadId: InputMaybe<Scalars['String']['input']>;
  to: Array<Scalars['String']['input']>;
};

export type SendCrmSmsInput = {
  /** 1 to 1000 characters. */
  body: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  object: CrmTimelineObject;
  /** The record's number to text, in E.164. */
  to: Scalars['String']['input'];
};

export type SendMailInput = {
  /** Files already uploaded to the portal's CDN, attached to the email. Up to 10. */
  attachments: InputMaybe<Array<FileAttachmentInput>>;
  /** Copied in, unseen by the others. Up to 20 addresses. */
  bcc: InputMaybe<Array<Scalars['String']['input']>>;
  /** Copied in, visibly. Up to 20 addresses. */
  cc: InputMaybe<Array<Scalars['String']['input']>>;
  /** The body as rich text (HTML). It is sanitised before it is sent. */
  message: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

export type SendMyEmailInput = {
  bcc: InputMaybe<Array<Scalars['String']['input']>>;
  /** Rich HTML from the editor; sanitized on the server. */
  body: Scalars['String']['input'];
  cc: InputMaybe<Array<Scalars['String']['input']>>;
  /** One of the caller's own mailboxes (myMailboxes); their default one when omitted. */
  fromMailboxId: InputMaybe<Scalars['ID']['input']>;
  replyTo: InputMaybe<Scalars['String']['input']>;
  subject: Scalars['String']['input'];
  to: Array<Scalars['String']['input']>;
};

export type SendNotificationInput = {
  audience: NotificationAudience;
  body: InputMaybe<Scalars['String']['input']>;
  /** Required when audience is DEPARTMENT. */
  department: InputMaybe<Scalars['String']['input']>;
  /** Required when audience is EMPLOYEES. */
  employeeIds: InputMaybe<Array<Scalars['String']['input']>>;
  kind: NotificationKind;
  /** In-portal path the notification opens, e.g. /me/announcements. */
  link: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type ShiftInput = {
  active: Scalars['Boolean']['input'];
  breakMinutes: Scalars['Int']['input'];
  code: Scalars['String']['input'];
  endTime: Scalars['String']['input'];
  graceMinutes: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  startTime: Scalars['String']['input'];
};

/** How a ticket stands against the resolution time promised for its priority. */
export type SlaState =
  | 'BREACHED'
  | 'DUE_SOON'
  | 'MET'
  | 'ON_TRACK';

export type SlackConfigInput = {
  /** Write-only. Leave empty when editing to keep the stored token. */
  botToken: Scalars['String']['input'];
  defaultChannel: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  /** Write-only and optional. Leave empty when editing to keep the stored secret. */
  signingSecret: InputMaybe<Scalars['String']['input']>;
};

export type SlipStatus =
  | 'GENERATED'
  | 'PAID';

/** A person's own account, or an organization's page acting as itself (a LinkedIn company page). */
export type SocialAccountKind =
  | 'ORGANIZATION'
  | 'PERSON';

export type SocialApp =
  | 'LINKEDIN'
  | 'META'
  | 'THREADS'
  | 'X'
  | 'YOUTUBE';

export type SocialAppConfigInput = {
  app: SocialApp;
  clientId: Scalars['String']['input'];
  /** Blank keeps the stored secret. */
  clientSecret: InputMaybe<Scalars['String']['input']>;
  enabled: Scalars['Boolean']['input'];
};

export type SocialMediaPostInput = {
  accountIds: Array<Scalars['ID']['input']>;
  /** Keep it as a draft. */
  draft: InputMaybe<Scalars['Boolean']['input']>;
  link: Scalars['String']['input'];
  mediaUrl: Scalars['String']['input'];
  /** When to publish; null publishes now. */
  scheduledAt: InputMaybe<Scalars['DateTime']['input']>;
  text: Scalars['String']['input'];
};

export type SocialMediaPostOrigin =
  | 'COMPOSED'
  | 'SYNCED';

export type SocialMediaPostStatus =
  | 'DRAFT'
  | 'FAILED'
  | 'PUBLISHED'
  | 'PUBLISHING'
  | 'SCHEDULED';

export type SocialMediaPostUpdateInput = {
  link: Scalars['String']['input'];
  mediaUrl: Scalars['String']['input'];
  /** A time moves it onto the schedule; null keeps it a draft. */
  scheduledAt: InputMaybe<Scalars['DateTime']['input']>;
  text: Scalars['String']['input'];
};

export type SocialNetwork =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'LINKEDIN'
  | 'THREADS'
  | 'X'
  | 'YOUTUBE';

/** What deleting a published post did on one account. */
export type SocialPostDeletionOutcome =
  /** Deleted on the network and in Exyconn. */
  | 'DELETED'
  /** The network refused; nothing was deleted. */
  | 'FAILED'
  /** Removed from Exyconn; the network does not let apps delete posts, so it stays there. */
  | 'KEPT_ON_NETWORK';

export type SocialPostInput = {
  body: Scalars['String']['input'];
  imageUrl: InputMaybe<Scalars['String']['input']>;
};

export type SonarConfigInput = {
  hostUrl: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  organization: InputMaybe<Scalars['String']['input']>;
  projectKey: Scalars['String']['input'];
  /** Write-only. Leave empty when editing to keep the stored token. */
  token: Scalars['String']['input'];
};

export type SonarOverviewState =
  | 'ERROR'
  | 'NOT_CONFIGURED'
  | 'NOT_FOUND'
  | 'OK'
  | 'UNAUTHORIZED'
  | 'UNREACHABLE';

export type SortDir =
  | 'ASC'
  | 'DESC';

export type SprintInput = {
  endsOn: InputMaybe<Scalars['DateTime']['input']>;
  goal: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  startsOn: InputMaybe<Scalars['DateTime']['input']>;
};

export type SprintState =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'PLANNED';

export type SslCertificateStatus =
  | 'EXPIRED'
  | 'EXPIRING'
  | 'INVALID'
  | 'OK'
  | 'UNREACHABLE';

export type StartCallingBotCallInput = {
  channel: CallingBotChannel;
  /** The number to ring, in E.164; phone calls only. */
  phone: InputMaybe<Scalars['String']['input']>;
  /** The example the bot plays (from callingBotScenarios); none keeps the bot's own prompt. */
  scenarioId: InputMaybe<Scalars['ID']['input']>;
};

export type StartCrmCallInput = {
  /** The CRM user's own phone, in E.164: it rings first, then the call is bridged to the record. */
  agentPhone: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  object: CrmTimelineObject;
  /** The record's number to call, in E.164. */
  to: Scalars['String']['input'];
};

export type StatusCategory =
  | 'API'
  | 'DESKTOP_APP'
  | 'PORTAL'
  | 'TOOL'
  | 'WEBSITE';

/** What Tech fills in to open an incident by hand; the body becomes the first update. */
export type StatusIncidentInput = {
  affectedServiceKeys: Array<Scalars['String']['input']>;
  body: Scalars['String']['input'];
  impact: IncidentImpact;
  title: Scalars['String']['input'];
};

export type StatusMaintenanceInput = {
  affectedServiceKeys: Array<Scalars['String']['input']>;
  body: Scalars['String']['input'];
  endsAt: Scalars['DateTime']['input'];
  startsAt: Scalars['DateTime']['input'];
  title: Scalars['String']['input'];
};

export type StatusMonitorInput = {
  category: StatusCategory;
  description: Scalars['String']['input'];
  isActive: Scalars['Boolean']['input'];
  key: Scalars['String']['input'];
  name: Scalars['String']['input'];
  order: Scalars['Int']['input'];
  url: Scalars['String']['input'];
};

export type StatusState =
  | 'DEGRADED'
  | 'DOWN'
  | 'OPERATIONAL'
  | 'UNKNOWN';

export type StockMovementInput = {
  notes: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
  reason: MovementReason;
  reference: InputMaybe<Scalars['String']['input']>;
  supplierId: InputMaybe<Scalars['String']['input']>;
};

export type StripeConfigInput = {
  isActive: Scalars['Boolean']['input'];
  label: Scalars['String']['input'];
  /** Left blank on an edit, the stored key is kept. */
  secretKey: InputMaybe<Scalars['String']['input']>;
  webhookSecret: InputMaybe<Scalars['String']['input']>;
};

/** What the public status page submits. Everything else is set by the server. */
export type SubmitProblemReportInput = {
  category: ProblemCategory;
  description: Scalars['String']['input'];
  pageUrl: Scalars['String']['input'];
  reporterEmail: Scalars['String']['input'];
  reporterName: Scalars['String']['input'];
  serviceKey: Scalars['String']['input'];
  severity: ProblemSeverity;
  subject: Scalars['String']['input'];
};

/** How much, and in what shape, a summary comes back. */
export type SummaryStyle =
  | 'BRIEF'
  | 'BULLETS'
  | 'DETAILED';

export type SupplierInput = {
  code: Scalars['String']['input'];
  contactName: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  status: SupplierStatus;
};

export type SupplierStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ON_HOLD';

export type SupportCategory =
  | 'FACILITIES'
  | 'HR'
  | 'IT'
  | 'OTHER'
  | 'PAYROLL';

export type SupportPriority =
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

/** Who raised a ticket: somebody who works here, or a customer. */
export type SupportRequester =
  | 'CLIENT'
  | 'EMPLOYEE';

export type SupportSlaPolicyInput = {
  active: Scalars['Boolean']['input'];
  firstResponseMinutes: Scalars['Int']['input'];
  priority: SupportPriority;
  resolutionMinutes: Scalars['Int']['input'];
};

export type SupportStatus =
  | 'CLOSED'
  | 'IN_PROGRESS'
  | 'OPEN'
  | 'RESOLVED';

/** Employee-facing support request — the server sets employeeId and OPEN status. */
export type SupportTicketInput = {
  /** Screenshots or documents, already uploaded through uploadImage. */
  attachments: InputMaybe<Array<FileAttachmentInput>>;
  category: SupportCategory;
  description: Scalars['String']['input'];
  priority: SupportPriority;
  subject: Scalars['String']['input'];
};

/** What wrote the row, set by the server from the action — never chosen. */
export type SuppressionOrigin =
  | 'ADMIN'
  | 'API'
  | 'CAMPAIGN'
  | 'CRM'
  | 'IMPORT'
  | 'SUBSCRIBER'
  | 'SYSTEM';

/** Why an address is on the marketing suppression list. BOUNCED is a hard bounce. */
export type SuppressionReason =
  | 'BOUNCED'
  | 'DO_NOT_CONTACT'
  | 'MANUAL'
  | 'OTHER'
  | 'SPAM_COMPLAINT'
  | 'UNSUBSCRIBED';

/** What a suppression stops: all of the organization's marketing, never transactional mail. */
export type SuppressionScope =
  | 'ORGANIZATION_MARKETING';

/** What a grid may do with the rows a person selects. */
export type TableBulkAction =
  /** Hides the rows from the table and keeps them; they can be restored. */
  | 'ARCHIVE'
  /** Deletes each row through the module's own delete, guards and audit included. */
  | 'DELETE'
  /** Brings archived rows back into the table. */
  | 'RESTORE';

/** A bulk action to run in the background: on ticked rows, or on every row a list's query matches. */
export type TableBulkJobInput = {
  action: TableBulkAction;
  /** The record type of a client-side table's rows, e.g. Holiday; it takes DELETE only. */
  entity: InputMaybe<Scalars['String']['input']>;
  /** The ticked rows. Leave empty, with variables, to act on every row the list's query matches. */
  ids: InputMaybe<Array<Scalars['ID']['input']>>;
  /** The paged list the rows belong to. Leave empty for a client-side table and name the entity. */
  list: InputMaybe<Scalars['String']['input']>;
  /** The variables the list's own query loads pages with, for Select all matching. */
  variables: InputMaybe<Scalars['JSON']['input']>;
};

export type TableBulkJobStatus =
  | 'DONE'
  | 'FAILED'
  | 'QUEUED'
  | 'RUNNING';

/** One exported column: the row field it reads (dotted for a nested one, e.g. customer.name) and its heading. */
export type TableExportColumnInput = {
  field: Scalars['String']['input'];
  header: Scalars['String']['input'];
};

export type TableFieldKind =
  | 'BOOLEAN'
  | 'DATE'
  | 'ENUM'
  | 'LIST'
  | 'NUMBER'
  | 'OBJECT'
  | 'TEXT';

export type TableFileFormat =
  | 'CSV'
  | 'XLSX';

export type TableFilterInput = {
  field: Scalars['String']['input'];
  op: FilterOp;
  value: Scalars['String']['input'];
  /** The values an IN filter matches any of; other operators ignore it. */
  values: InputMaybe<Array<Scalars['String']['input']>>;
};

/** What an import does with a row whose match column names an existing record. */
export type TableImportMode =
  /** Every row becomes a new record. */
  | 'CREATE'
  /** Rows update the record they match; a row matching none is skipped. */
  | 'UPDATE'
  /** Rows update the record they match, and become new records when they match none. */
  | 'UPSERT';

/** Server-side pagination/sort/filter/search request. `page` is zero-indexed. */
export type TableQueryInput = {
  /** True lists only archived rows; otherwise archived rows are left out. */
  archived: InputMaybe<Scalars['Boolean']['input']>;
  filters: InputMaybe<Array<TableFilterInput>>;
  /** Zero-based: 0 is the first page, so the first pageSize rows. */
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  search: InputMaybe<Scalars['String']['input']>;
  sort: InputMaybe<TableSortInput>;
  /** Several sort columns, most significant first. When set it wins over sort. */
  sorts: InputMaybe<Array<TableSortInput>>;
};

export type TableSortInput = {
  dir: SortDir;
  field: Scalars['String']['input'];
};

/** A file being attached. The uploader and the timestamp are stamped server-side. */
export type TaskAttachmentInput = {
  contentType: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

/** Everything a ticket carries that a person can edit. Only the title is required. */
export type TaskInput = {
  assigneeId: InputMaybe<Scalars['String']['input']>;
  attachments: InputMaybe<Array<TaskAttachmentInput>>;
  description: InputMaybe<Scalars['String']['input']>;
  dueDate: InputMaybe<Scalars['DateTime']['input']>;
  labels: InputMaybe<Array<Scalars['String']['input']>>;
  milestoneId: InputMaybe<Scalars['ID']['input']>;
  parentTaskId: InputMaybe<Scalars['ID']['input']>;
  priority: InputMaybe<TaskPriority>;
  sprintId: InputMaybe<Scalars['ID']['input']>;
  storyPoints: InputMaybe<Scalars['Int']['input']>;
  title: Scalars['String']['input'];
  type: InputMaybe<TaskType>;
};

export type TaskPriority =
  | 'HIGH'
  | 'HIGHEST'
  | 'LOW'
  | 'LOWEST'
  | 'MEDIUM';

export type TaskType =
  | 'BUG'
  | 'EPIC'
  | 'STORY'
  | 'TASK';

/** Who may read a ticket: people signed in to Projects, or anyone holding its public link. */
export type TaskVisibility =
  | 'PRIVATE'
  | 'PUBLIC';

export type TaxRegimeInput = {
  active: Scalars['Boolean']['input'];
  cessPercent: Scalars['Float']['input'];
  financialYear: Scalars['String']['input'];
  name: Scalars['String']['input'];
  rebateIncomeLimit: Scalars['Float']['input'];
  rebateMaxTax: Scalars['Float']['input'];
  regimeKey: Scalars['String']['input'];
  standardDeduction: Scalars['Float']['input'];
};

export type TaxSlabInput = {
  active: Scalars['Boolean']['input'];
  financialYear: Scalars['String']['input'];
  fromAmount: Scalars['Float']['input'];
  order: Scalars['Int']['input'];
  ratePercent: Scalars['Float']['input'];
  regimeKey: Scalars['String']['input'];
  toAmount: InputMaybe<Scalars['Float']['input']>;
};

/** Whose tax rules a company's invoices and payroll follow. */
export type TaxSystem =
  /** India: GSTIN and place of supply, CGST/SGST/IGST, PF/ESI/professional tax, income-tax slabs. */
  | 'INDIA_GST'
  /** No tax lines at all. */
  | 'NONE'
  /** One tax line at the company's own rate. */
  | 'VAT';

/**
 * How TDS is worked out. NONE withholds nothing; FLAT_PERCENT takes a percentage of taxable
 * pay; SLAB applies the band table below to the annualised pay. An employee with their own
 * rate on file beats every mode except NONE, and an empty table withholds nothing rather
 * than guessing.
 */
export type TdsMode =
  | 'FLAT_PERCENT'
  | 'NONE'
  | 'SLAB';

export type TdsSlabInput = {
  percent: Scalars['Float']['input'];
  upTo: InputMaybe<Scalars['Float']['input']>;
};

export type TeamInput = {
  active: Scalars['Boolean']['input'];
  department: Scalars['String']['input'];
  description: Scalars['String']['input'];
  leadEmployeeId: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

/** A saved credential on Tech > Environment Variables that staff may reveal, one at a time. */
export type TechSecret =
  | 'BILLING_KEY'
  | 'CLOUDFLARE_API_TOKEN'
  | 'EMAIL_PASSWORD'
  | 'EMAIL_VERIFIER_PROXY_PASSWORD'
  | 'GITHUB_TOKEN'
  | 'GMAIL_CLIENT_SECRET'
  | 'GODADDY_API_KEY'
  | 'GODADDY_API_SECRET'
  | 'GOOGLE_MAPS_BROWSER_KEY'
  | 'GOOGLE_MAPS_SERVER_KEY'
  | 'GOOGLE_SIGN_IN_CLIENT_SECRET'
  | 'IMAGEKIT_PRIVATE_KEY'
  | 'INBOUND_MAIL_PASSWORD'
  | 'OPENAI_API_KEY'
  | 'PAYONEER_API_TOKEN'
  | 'PAYPAL_CLIENT_SECRET'
  | 'PEXELS_API_KEY'
  | 'RAZORPAY_KEY_SECRET'
  | 'RAZORPAY_WEBHOOK_SECRET'
  | 'SLACK_BOT_TOKEN'
  | 'SLACK_SIGNING_SECRET'
  | 'SOCIAL_APP_CLIENT_SECRET'
  | 'SONAR_TOKEN'
  | 'STRIPE_SECRET_KEY'
  | 'STRIPE_WEBHOOK_SECRET';

/** How a ticket reached the desk. */
export type TicketChannel =
  /** Typed into the console by an agent, usually off a call. */
  | 'AGENT'
  /** Opened by a chat on exyconn.com or tools.exyconn.com (Website > Chatbot). */
  | 'CHAT'
  /** Arrived in the support mailbox and was imported. */
  | 'EMAIL'
  /** Raised on a form in the portal — the employee desk or the public customer form. */
  | 'PORTAL';

export type ToolCategoryInput = {
  category: Scalars['String']['input'];
  color: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  icon: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  order: InputMaybe<Scalars['Int']['input']>;
  seo: InputMaybe<Scalars['JSON']['input']>;
  slug: Scalars['String']['input'];
};

export type ToolInput = {
  categorySlug: Scalars['String']['input'];
  color: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  features: InputMaybe<Array<Scalars['String']['input']>>;
  icon: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  isMVP: InputMaybe<Scalars['Boolean']['input']>;
  keywords: InputMaybe<Array<Scalars['String']['input']>>;
  longDescription: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  order: InputMaybe<Scalars['Int']['input']>;
  pricing: InputMaybe<ToolPricingInput>;
  seo: InputMaybe<Scalars['JSON']['input']>;
  toolCode: Scalars['String']['input'];
  url: InputMaybe<Scalars['String']['input']>;
  useCases: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ToolPricingInput = {
  alterationNote: InputMaybe<Scalars['String']['input']>;
  currency: Scalars['String']['input'];
  features: InputMaybe<Array<Scalars['String']['input']>>;
  price: Scalars['Float']['input'];
};

export type TrackerDeviceInput = {
  appVersion: InputMaybe<Scalars['String']['input']>;
  arch: InputMaybe<Scalars['String']['input']>;
  cpuCores: InputMaybe<Scalars['Int']['input']>;
  cpuModel: InputMaybe<Scalars['String']['input']>;
  deviceId: Scalars['String']['input'];
  hostname: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  machineId: InputMaybe<Scalars['String']['input']>;
  osName: InputMaybe<Scalars['String']['input']>;
  osVersion: InputMaybe<Scalars['String']['input']>;
  platform: Scalars['String']['input'];
  screenCount: InputMaybe<Scalars['Int']['input']>;
  screenResolution: InputMaybe<Scalars['String']['input']>;
  timezone: InputMaybe<Scalars['String']['input']>;
  totalMemoryMb: InputMaybe<Scalars['Int']['input']>;
};

export type TrackerIntervalInput = {
  activeMs: Scalars['Float']['input'];
  endedAt: Scalars['DateTime']['input'];
  idleMs: Scalars['Float']['input'];
  keyCount: Scalars['Int']['input'];
  mouseCount: Scalars['Int']['input'];
  startedAt: Scalars['DateTime']['input'];
  windows: InputMaybe<Array<TrackerWindowUsageInput>>;
};

/** One location fix as a tracker app reports it. */
export type TrackerLocationInput = {
  /** How far off the fix may be, in metres. */
  accuracyM: Scalars['Float']['input'];
  capturedAt: Scalars['DateTime']['input'];
  /** Degrees, -90 to 90. */
  lat: Scalars['Float']['input'];
  /** Degrees, -180 to 180. */
  lng: Scalars['Float']['input'];
  source: TrackerLocationSource;
};

/** Why a pin was taken: marking attendance, or moving while tracking. */
export type TrackerLocationKind =
  | 'ATTENDANCE'
  | 'MOVE';

/** Where a location fix came from: the phone's GPS or the computer's location service. */
export type TrackerLocationSource =
  | 'GPS'
  | 'SYSTEM';

export type TrackerManualEntryInput = {
  endedAt: Scalars['DateTime']['input'];
  note: Scalars['String']['input'];
  /** Omit to book against the house-wide Global Project. */
  projectId: InputMaybe<Scalars['ID']['input']>;
  startedAt: Scalars['DateTime']['input'];
  /** Optional ticket. Ignored when it does not belong to the project above. */
  taskId: InputMaybe<Scalars['ID']['input']>;
};

export type TrackerManualEntryStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

/** Which way a message is travelling. Read state belongs to whoever it is travelling to. */
export type TrackerMessageDirection =
  | 'TO_ADMIN'
  | 'TO_EMPLOYEE';

/** CHAT is a two-way conversation; NOTICE is an announcement pushed to the desktop app. */
export type TrackerMessageKind =
  | 'CHAT'
  | 'NOTICE';

export type TrackerNoticeInput = {
  body: Scalars['String']['input'];
  title: Scalars['String']['input'];
  /** Leave empty to reach every employee with an active tracker grant. */
  userIds: InputMaybe<Array<Scalars['ID']['input']>>;
};

/** Why a day carries no expected hours. */
export type TrackerOffReason =
  | 'HOLIDAY'
  | 'LEAVE'
  /** The employee's week off: a day outside their work days (named WEEKEND for compatibility). */
  | 'WEEKEND';

/** The installers a build can produce. */
export type TrackerPlatform =
  /** An APK to install directly, plus an AAB for the Play Store. */
  | 'ANDROID'
  /** An unsigned IPA, installable only once re-signed. */
  | 'IOS'
  | 'LINUX'
  | 'MACOS'
  | 'WINDOWS';

/**
 * What an employee has said they are doing right now, in their own words.
 *
 * Their statement, never something the tracker inferred: a quiet keyboard means the
 * keyboard was quiet, not that somebody went to lunch.
 */
export type TrackerPresence =
  | 'AWAY'
  | 'BREAK'
  | 'LUNCH'
  | 'MEETING'
  | 'WORKING';

export type TrackerScreenshotInput = {
  blurred: InputMaybe<Scalars['Boolean']['input']>;
  capturedAt: Scalars['DateTime']['input'];
  displayId: InputMaybe<Scalars['String']['input']>;
  image: Scalars['String']['input'];
  intervalStartedAt: Scalars['DateTime']['input'];
  sessionId: Scalars['ID']['input'];
};

export type TrackerSettingsInput = {
  autoStartEnabled: InputMaybe<Scalars['Boolean']['input']>;
  autoStartHour: InputMaybe<Scalars['Int']['input']>;
  autoStopHour: InputMaybe<Scalars['Int']['input']>;
  blurScreenshots: InputMaybe<Scalars['Boolean']['input']>;
  captureSoundEnabled: InputMaybe<Scalars['Boolean']['input']>;
  consentPolicySlug: InputMaybe<Scalars['String']['input']>;
  consentText: InputMaybe<Scalars['String']['input']>;
  dailyDigestEnabled: InputMaybe<Scalars['Boolean']['input']>;
  defaultTimezone: InputMaybe<Scalars['String']['input']>;
  digestHour: InputMaybe<Scalars['Int']['input']>;
  employeeDailyReportEnabled: InputMaybe<Scalars['Boolean']['input']>;
  employeeMonthlyReportEnabled: InputMaybe<Scalars['Boolean']['input']>;
  employeeReportHour: InputMaybe<Scalars['Int']['input']>;
  employeeWeeklyReportEnabled: InputMaybe<Scalars['Boolean']['input']>;
  idleAutoPauseMinutes: InputMaybe<Scalars['Int']['input']>;
  idleThresholdSeconds: InputMaybe<Scalars['Int']['input']>;
  intervalMinutes: InputMaybe<Scalars['Int']['input']>;
  randomizeScreenshotTiming: InputMaybe<Scalars['Boolean']['input']>;
  screenshotMaxWidth: InputMaybe<Scalars['Int']['input']>;
  screenshotQuality: InputMaybe<Scalars['Int']['input']>;
  screenshotRetentionDays: InputMaybe<Scalars['Int']['input']>;
  screenshotsPerInterval: InputMaybe<Scalars['Int']['input']>;
  syncIntervalMinutes: InputMaybe<Scalars['Int']['input']>;
  trackWindowTitles: InputMaybe<Scalars['Boolean']['input']>;
  webcamCorner: InputMaybe<Scalars['String']['input']>;
  webcamEnabled: InputMaybe<Scalars['Boolean']['input']>;
  weeklyDigestEnabled: InputMaybe<Scalars['Boolean']['input']>;
};

/** Which part of the tracker version a build raises before it is built. */
export type TrackerVersionBump =
  | 'MAJOR'
  | 'MINOR'
  /** Build the version already committed. */
  | 'NONE'
  | 'PATCH';

export type TrackerWindowUsageInput = {
  appName: Scalars['String']['input'];
  durationMs: Scalars['Float']['input'];
  windowTitle: InputMaybe<Scalars['String']['input']>;
};

export type TrainingInput = {
  assignedOn: Scalars['DateTime']['input'];
  category: Scalars['String']['input'];
  certificateUrl: InputMaybe<Scalars['String']['input']>;
  completedOn: InputMaybe<Scalars['DateTime']['input']>;
  dueOn: InputMaybe<Scalars['DateTime']['input']>;
  employeeId: Scalars['String']['input'];
  provider: Scalars['String']['input'];
  status: TrainingStatus;
  title: Scalars['String']['input'];
};

export type TrainingStatus =
  | 'ASSIGNED'
  | 'COMPLETED'
  | 'IN_PROGRESS';

export type UnlockTechVaultInput = {
  code: Scalars['String']['input'];
  location: VaultLocationInput;
  reason: Scalars['String']['input'];
};

export type UpdateProfileInput = {
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  /** A few lines about the person. Empty string clears it. */
  brief: InputMaybe<Scalars['String']['input']>;
  /** This person's date pattern, from the offered list. Empty string follows the workspace's. */
  dateFormat: InputMaybe<Scalars['String']['input']>;
  /** The language the portal is shown to this person in. Empty string follows the default. */
  locale: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  /** A number colleagues can reach the person on. Empty string clears it. */
  phone: InputMaybe<Scalars['String']['input']>;
  /** Replaces every shared profile at once; an empty address clears that one. */
  socialLinks: InputMaybe<UserSocialLinksInput>;
  /** This person's time pattern, from the offered list. Empty string follows the workspace's. */
  timeFormat: InputMaybe<Scalars['String']['input']>;
  /**
   * The zone every date and time is shown to this person in. Empty string clears the
   * choice and follows the workspace default again.
   */
  timezone: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSettingsInput = {
  /** Days of audit history to keep. Zero keeps it for ever. */
  auditRetentionDays: InputMaybe<Scalars['Int']['input']>;
  autoTranslate: InputMaybe<Scalars['Boolean']['input']>;
  dateFormat: InputMaybe<Scalars['String']['input']>;
  defaultLocale: InputMaybe<Scalars['String']['input']>;
  enabledLocales: InputMaybe<Array<Scalars['String']['input']>>;
  timeFormat: InputMaybe<Scalars['String']['input']>;
  timezone: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  address: InputMaybe<Scalars['String']['input']>;
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  brief: InputMaybe<Scalars['String']['input']>;
  /** The city they work in, for city holidays; null when not set. */
  city: InputMaybe<Scalars['String']['input']>;
  /** ISO 3166-1 alpha-2, or null to follow the company's country. */
  country: InputMaybe<Scalars['String']['input']>;
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  department: InputMaybe<Scalars['String']['input']>;
  designation: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  employmentStatus: InputMaybe<EmploymentStatus>;
  /** Kind of employment, by code — permanent, contract, intern. Empty when not set. */
  employmentTypeCode: InputMaybe<Scalars['String']['input']>;
  /** Job grade or band, by code. Empty when not set. */
  gradeCode: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  joinDate: InputMaybe<Scalars['DateTime']['input']>;
  /** BCP-47 tag, or null to follow the workspace default. */
  locale: InputMaybe<Scalars['String']['input']>;
  /** Office or site this person works at, by the location's code. Empty when not set. */
  locationCode: InputMaybe<Scalars['String']['input']>;
  managerId: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  /** A personal address to keep on file; null or empty clears it. */
  personalEmail: InputMaybe<Scalars['String']['input']>;
  probationEndDate: InputMaybe<Scalars['DateTime']['input']>;
  /** The state or region they work in, for regional holidays; null when not set. */
  region: InputMaybe<Scalars['String']['input']>;
  roles: InputMaybe<Array<Role>>;
  /** Working-hours pattern, by code. Empty when not set. */
  shiftCode: InputMaybe<Scalars['String']['input']>;
  /** Team inside the department. Empty when not set. */
  teamName: InputMaybe<Scalars['String']['input']>;
  /** IANA zone name, or null to follow the workspace default. */
  timezone: InputMaybe<Scalars['String']['input']>;
  /** Days of the week they work, 0 is Sunday. Null follows the workspace's week. */
  workDays: InputMaybe<Array<Scalars['Int']['input']>>;
  workHoursPerDay: InputMaybe<Scalars['Int']['input']>;
  workLocation: InputMaybe<WorkLocation>;
  workLocationNote: InputMaybe<Scalars['String']['input']>;
  workingTime: InputMaybe<WorkingTime>;
  workingTimeNote: InputMaybe<Scalars['String']['input']>;
};

export type UserSocialLinksInput = {
  github: InputMaybe<Scalars['String']['input']>;
  linkedin: InputMaybe<Scalars['String']['input']>;
  twitter: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
};

export type VaultEndReason =
  | 'EXPIRED'
  | 'LOCKED';

export type VaultLocationInput = {
  accuracy: InputMaybe<Scalars['Float']['input']>;
  latitude: InputMaybe<Scalars['Float']['input']>;
  longitude: InputMaybe<Scalars['Float']['input']>;
  state: VaultLocationState;
};

/** Whether the browser shared the device's position when the vault was opened. */
export type VaultLocationState =
  | 'DENIED'
  | 'GRANTED'
  | 'UNAVAILABLE';

export type WebsiteCaptchaAnswer = {
  answer: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type WebsiteChatAttachmentKind =
  | 'AUDIO'
  | 'IMAGE'
  | 'VIDEO';

/** The two threads of a chat: the team answering, and the knowledge bot answering. */
export type WebsiteChatChannel =
  | 'KNOWLEDGE'
  | 'LIVE';

export type WebsiteChatDayInput = {
  day: Scalars['Int']['input'];
  enabled: Scalars['Boolean']['input'];
  end: Scalars['String']['input'];
  start: Scalars['String']['input'];
};

export type WebsiteChatFaqInput = {
  answer: Scalars['String']['input'];
  isActive: Scalars['Boolean']['input'];
  question: Scalars['String']['input'];
  sortOrder: Scalars['Int']['input'];
};

export type WebsiteChatFeedback =
  | 'DOWN'
  | 'UP';

export type WebsiteChatKnowledgeInput = {
  content: Scalars['String']['input'];
  isActive: Scalars['Boolean']['input'];
  title: Scalars['String']['input'];
  url: InputMaybe<Scalars['String']['input']>;
};

export type WebsiteChatKnowledgeSource =
  /** Written by the website team. */
  | 'CUSTOM'
  /** Read from exyconn.com by the last sync. */
  | 'WEBSITE';

/** Who wrote a chat message. SYSTEM is the chat itself (welcome, handoff and offline notices). */
export type WebsiteChatSender =
  | 'AGENT'
  | 'BOT'
  | 'SYSTEM'
  | 'VISITOR';

export type WebsiteChatSettingsInput = {
  /** Portal users a new chat may be handed to; the freest of them gets it. */
  agentIds: Array<Scalars['ID']['input']>;
  allowUploads: Scalars['Boolean']['input'];
  botModel: Scalars['String']['input'];
  botName: Scalars['String']['input'];
  customInstructions: Scalars['String']['input'];
  /** The OpenAI model the knowledge is embedded with. */
  embeddingModel: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  handoffMessage: Scalars['String']['input'];
  maxContextChars: Scalars['Int']['input'];
  maxUploadMb: Scalars['Int']['input'];
  noReplyTimeoutSeconds: Scalars['Int']['input'];
  offlineMessage: Scalars['String']['input'];
  refusalMessage: Scalars['String']['input'];
  /** Minutes without a message from either side before a chat closes (2 to 120). */
  sessionTimeoutMinutes: Scalars['Int']['input'];
  /** Opens a Slack thread for the assigned agent, which they can answer the visitor from. */
  slackEnabled: Scalars['Boolean']['input'];
  soundEnabledByDefault: Scalars['Boolean']['input'];
  timezone: Scalars['String']['input'];
  transcriptOnClose: Scalars['Boolean']['input'];
  weeklyHours: Array<WebsiteChatDayInput>;
  welcomeMessage: Scalars['String']['input'];
};

/** The public site a website chat was started on. */
export type WebsiteChatSite =
  | 'TOOLS'
  | 'WEBSITE';

export type WebsiteChatStatus =
  | 'CLOSED'
  | 'OPEN';

/** A file sent with a public form: its name and its bytes as a base64 data URL. */
export type WebsiteFileInput = {
  data: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type WebsiteSubmissionInput = {
  formType: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  source: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
  submissionData: Scalars['JSON']['input'];
};

export type WebsiteSubmissionTriageInput = {
  notes: InputMaybe<Scalars['String']['input']>;
  status: Scalars['String']['input'];
};

export type WhatsappAiEntityInput = {
  description: Scalars['String']['input'];
  kind: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type WhatsappAiIntentInput = {
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
};

export type WhatsappChannelInput = {
  /** Blank keeps the stored token. */
  accessToken: Scalars['String']['input'];
  /** Blank keeps the stored secret. */
  appSecret: Scalars['String']['input'];
  displayPhone: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  phoneNumberId: Scalars['String']['input'];
  verifyToken: Scalars['String']['input'];
};

/** A stored credential of the number; the values are the field names. */
export type WhatsappChannelSecret =
  | 'accessToken'
  | 'appSecret';

/** What the Test button sends: a blank access token means the saved one. */
export type WhatsappChannelTestInput = {
  accessToken: Scalars['String']['input'];
  phoneNumberId: Scalars['String']['input'];
};

export type WhatsappDemoCodeInput = {
  company: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  source: WhatsappDemoVisitorSource;
};

export type WhatsappDemoEventInput = {
  /** ISO time on the client clock. */
  at: Scalars['String']['input'];
  demoKey: InputMaybe<Scalars['String']['input']>;
  /** phone, tablet or desktop (SESSION_START). */
  device: InputMaybe<Scalars['String']['input']>;
  durationMs: InputMaybe<Scalars['Int']['input']>;
  /** Client-generated UUID; a repeated id is ignored. */
  id: Scalars['ID']['input'];
  /** Option title or input kind; cut to 80 characters. */
  label: InputMaybe<Scalars['String']['input']>;
  node: InputMaybe<Scalars['String']['input']>;
  /** Client-generated UUID per tab session. */
  sessionId: Scalars['ID']['input'];
  /** choice or text. */
  stepKind: InputMaybe<Scalars['String']['input']>;
  type: WhatsappDemoEventType;
  /** Width x height (SESSION_START). */
  viewport: InputMaybe<Scalars['String']['input']>;
  workflow: InputMaybe<Scalars['String']['input']>;
};

export type WhatsappDemoEventType =
  | 'AI_CALL'
  | 'CHAT_CLEARED'
  | 'DEMO_OPENED'
  | 'DOCUMENT_OPENED'
  | 'FLOW_ABANDONED'
  | 'FLOW_COMPLETED'
  | 'FLOW_STARTED'
  | 'QR_OPENED'
  | 'REMINDER_DELIVERED'
  | 'SESSION_END'
  | 'SESSION_START'
  | 'STEP';

export type WhatsappDemoInput = {
  active: Scalars['Boolean']['input'];
  business: Scalars['JSON']['input'];
  /** whatsapp or website; left out when editing, the demo keeps its own. */
  channel: InputMaybe<Scalars['String']['input']>;
  greeting: Scalars['String']['input'];
  industry: Scalars['String']['input'];
  key: Scalars['String']['input'];
  menuButton: Scalars['String']['input'];
  menuText: Scalars['String']['input'];
  order: Scalars['Int']['input'];
};

export type WhatsappDemoParseInput = {
  demoKey: Scalars['String']['input'];
  entities: Array<WhatsappAiEntityInput>;
  intents: Array<WhatsappAiIntentInput>;
  node: Scalars['String']['input'];
  sessionId: Scalars['ID']['input'];
  /** At most 500 characters are read. */
  text: Scalars['String']['input'];
  /** A workflow key, or $router for the menu. */
  workflow: Scalars['String']['input'];
};

/** Where a demo visitor first asked for a sign-in code. */
export type WhatsappDemoVisitorSource =
  /** The demo's own sign-in screen. */
  | 'DEMO_LOGIN'
  /** The WhatsApp chatbot page on the website. */
  | 'WEBSITE';

export type WhatsappWorkflowCreateInput = {
  demoId: Scalars['ID']['input'];
  description: Scalars['String']['input'];
  key: Scalars['String']['input'];
  keywords: Array<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  order: InputMaybe<Scalars['Int']['input']>;
};

export type WhatsappWorkflowDraftInput = {
  description: Scalars['String']['input'];
  graph: Scalars['JSON']['input'];
  keywords: Array<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  order: Scalars['Int']['input'];
};

export type WhatsappWorkflowStatus =
  | 'DRAFT'
  | 'PUBLISHED';

/** Where an employee is expected to work from. OTHER is described in workLocationNote. */
export type WorkLocation =
  | 'HOME'
  | 'HYBRID'
  | 'OFFICE'
  | 'OTHER';

export type WorkflowEdgeInput = {
  key: Scalars['String']['input'];
  label: Scalars['String']['input'];
  source: Scalars['String']['input'];
  target: Scalars['String']['input'];
};

/** The whole drawing. Saved as one, and refused whole when it breaks a rule. */
export type WorkflowGraphInput = {
  edges: Array<WorkflowEdgeInput>;
  nodes: Array<WorkflowNodeInput>;
};

export type WorkflowNodeInput = {
  key: Scalars['String']['input'];
  kind: WorkflowNodeKind;
  label: Scalars['String']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};

/** The kinds of box a workflow is drawn from. */
export type WorkflowNodeKind =
  | 'DECISION'
  | 'END'
  | 'START'
  | 'STEP';

/** When an employee is expected to work. OTHER is described in workingTimeNote. */
export type WorkingTime =
  | 'FIXED'
  | 'FLEXIBLE'
  | 'OTHER';

export type TrackerSettingsFieldsFragment = { intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, idleAutoPauseMinutes: number, screenshotMaxWidth: number, screenshotQuality: number, captureSoundEnabled: boolean, webcamEnabled: boolean, webcamCorner: string, syncIntervalMinutes: number, consentText: string, autoStartEnabled: boolean, autoStartHour: number, autoStopHour: number };

export type BrandingFieldsFragment = { businessName: string, legalName: string, slogan: string, logoUrl: string, logoDarkUrl: string, appIconUrl: string, faviconUrl: string, primaryColor: string, secondaryColor: string, accentColor: string, backgroundColor: string, textColor: string, supportEmail: string, websiteUrl: string, copyrightText: string };

export type WorkdayFieldsFragment = { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean, offReason: TrackerOffReason | null, offLabel: string | null, profileAddress: string | null };

export type PresenceFieldsFragment = { status: TrackerPresence, note: string, since: string | null };

export type MessageFieldsFragment = { id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string };

export type ManualEntryFieldsFragment = { id: string, projectName: string, taskKey: string, taskTitle: string, startedAt: string, endedAt: string, durationMs: number, note: string, status: TrackerManualEntryStatus, reviewNote: string };

export type TaskFieldsFragment = { id: string, key: string, title: string, assignedToMe: boolean };

export type TrackerMeFieldsFragment = { consentRequired: boolean, timezone: string, locale: string, unreadMessages: number, user: { id: string, name: string, email: string }, settings: { intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, idleAutoPauseMinutes: number, screenshotMaxWidth: number, screenshotQuality: number, captureSoundEnabled: boolean, webcamEnabled: boolean, webcamCorner: string, syncIntervalMinutes: number, consentText: string, autoStartEnabled: boolean, autoStartHour: number, autoStopHour: number }, workProfile: { workingTime: WorkingTime, workingTimeNote: string, workLocation: WorkLocation, workLocationNote: string, workHoursPerDay: number, targetMs: number, workDays: Array<number> }, workday: { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean, offReason: TrackerOffReason | null, offLabel: string | null, profileAddress: string | null }, projects: Array<{ id: string, name: string, key: string }>, consentPolicy: { id: string, title: string, slug: string, summary: string, body: string, version: number, requiresAcknowledgement: boolean, acknowledged: boolean } | null, presence: { status: TrackerPresence, note: string, since: string | null }, notices: Array<{ id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string }> };

export type TrackerRecordLocationMutationVariables = Exact<{
  location: TrackerLocationInput;
}>;


export type TrackerRecordLocationMutation = { trackerRecordLocation: boolean };

export type MyTrackerLocationsQueryVariables = Exact<{
  date: Scalars['String']['input'];
}>;


export type MyTrackerLocationsQuery = { myTrackerLocations: Array<{ id: string, lat: number, lng: number, accuracyM: number, source: TrackerLocationSource, kind: TrackerLocationKind, capturedAt: string }> };

export type MyTrackerEarningsQueryVariables = Exact<{
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
}>;


export type MyTrackerEarningsQuery = { myTrackerEarnings: { payType: PayType, rate: number, currency: string, trackedMs: number, amount: number | null } };

export type ReportClientLogsMutationVariables = Exact<{
  input: AppLogBatchInput;
}>;


export type ReportClientLogsMutation = { reportClientLogs: boolean };

export type MyTrackerCalendarQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  timezone: Scalars['String']['input'];
}>;


export type MyTrackerCalendarQuery = { myTrackerCalendar: Array<{ date: string, activeMs: number, idleMs: number, manualMs: number, keyCount: number, mouseCount: number, sessions: number }> };

export type MyTrackerExpectedQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  timezone: Scalars['String']['input'];
}>;


export type MyTrackerExpectedQuery = { myTrackerExpected: { workHoursPerDay: number, days: Array<{ date: string, expectedMs: number, offReason: TrackerOffReason | null, offLabel: string | null }> } };

export type MyTrackerExpectedReportQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  timezone: Scalars['String']['input'];
}>;


export type MyTrackerExpectedReportQuery = { myTrackerExpectedReport: { fileName: string, mimeType: string, contentBase64: string } };

export type MyTrackerDayQueryVariables = Exact<{
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type MyTrackerDayQuery = { myTrackerDay: { intervals: Array<{ startedAt: string, endedAt: string, activeMs: number, idleMs: number, keyCount: number, mouseCount: number, activityPercent: number }>, screenshots: Array<{ id: string, capturedAt: string, imageUrl: string, blurred: boolean, activityPercent: number }>, sessions: Array<{ id: string }> } };

export type TrackerTimezonesQueryVariables = Exact<{ [key: string]: never; }>;


export type TrackerTimezonesQuery = { trackerTimezones: Array<string> };

export type MyTrackerTotalsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyTrackerTotalsQuery = { myTrackerTotals: { activeMs: number, idleMs: number, screenshots: number, sessions: number } };

export type MyTrackerManualEntriesQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
}>;


export type MyTrackerManualEntriesQuery = { myTrackerManualEntries: Array<{ id: string, projectName: string, taskKey: string, taskTitle: string, startedAt: string, endedAt: string, durationMs: number, note: string, status: TrackerManualEntryStatus, reviewNote: string }> };

export type CreateTrackerManualEntryMutationVariables = Exact<{
  input: TrackerManualEntryInput;
}>;


export type CreateTrackerManualEntryMutation = { createTrackerManualEntry: { id: string, projectName: string, taskKey: string, taskTitle: string, startedAt: string, endedAt: string, durationMs: number, note: string, status: TrackerManualEntryStatus, reviewNote: string } };

export type WithdrawTrackerManualEntryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type WithdrawTrackerManualEntryMutation = { withdrawTrackerManualEntry: boolean };

export type MyTrackerMessagesQueryVariables = Exact<{
  kind: InputMaybe<TrackerMessageKind>;
}>;


export type MyTrackerMessagesQuery = { myTrackerMessages: Array<{ id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string }> };

export type SendMyTrackerMessageMutationVariables = Exact<{
  body: Scalars['String']['input'];
}>;


export type SendMyTrackerMessageMutation = { sendMyTrackerMessage: { id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string } };

export type MarkMyTrackerMessagesReadMutationVariables = Exact<{
  kind: InputMaybe<TrackerMessageKind>;
}>;


export type MarkMyTrackerMessagesReadMutation = { markMyTrackerMessagesRead: number };

export type LocaleBundleQueryVariables = Exact<{
  locale: Scalars['String']['input'];
}>;


export type LocaleBundleQuery = { localeBundle: { locale: string, direction: string, translations: Array<{ source: string, text: string }> } };

export type TranslateMissingMutationVariables = Exact<{
  locale: Scalars['String']['input'];
  sources: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type TranslateMissingMutation = { translateMissing: Array<{ source: string, text: string }> };

export type TrackerLatestReleaseQueryVariables = Exact<{
  platform: InputMaybe<Scalars['String']['input']>;
}>;


export type TrackerLatestReleaseQuery = { trackerLatestRelease: { version: string, url: string, publishedAt: string, assets: Array<{ name: string, platform: string, url: string, sizeBytes: number }> } | null };

export type TrackerLoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  device: TrackerDeviceInput;
}>;


export type TrackerLoginMutation = { trackerLogin: { token: string, consentRequired: boolean, user: { id: string, name: string, email: string }, settings: { intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, idleAutoPauseMinutes: number, screenshotMaxWidth: number, screenshotQuality: number, captureSoundEnabled: boolean, webcamEnabled: boolean, webcamCorner: string, syncIntervalMinutes: number, consentText: string, autoStartEnabled: boolean, autoStartHour: number, autoStopHour: number } } };

export type PublicBrandingQueryVariables = Exact<{ [key: string]: never; }>;


export type PublicBrandingQuery = { publicBranding: { businessName: string, legalName: string, slogan: string, logoUrl: string, logoDarkUrl: string, appIconUrl: string, faviconUrl: string, primaryColor: string, secondaryColor: string, accentColor: string, backgroundColor: string, textColor: string, supportEmail: string, websiteUrl: string, copyrightText: string } };

export type TrackerMeQueryVariables = Exact<{ [key: string]: never; }>;


export type TrackerMeQuery = { trackerMe: { consentRequired: boolean, timezone: string, locale: string, unreadMessages: number, user: { id: string, name: string, email: string }, settings: { intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, idleAutoPauseMinutes: number, screenshotMaxWidth: number, screenshotQuality: number, captureSoundEnabled: boolean, webcamEnabled: boolean, webcamCorner: string, syncIntervalMinutes: number, consentText: string, autoStartEnabled: boolean, autoStartHour: number, autoStopHour: number }, workProfile: { workingTime: WorkingTime, workingTimeNote: string, workLocation: WorkLocation, workLocationNote: string, workHoursPerDay: number, targetMs: number, workDays: Array<number> }, workday: { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean, offReason: TrackerOffReason | null, offLabel: string | null, profileAddress: string | null }, projects: Array<{ id: string, name: string, key: string }>, consentPolicy: { id: string, title: string, slug: string, summary: string, body: string, version: number, requiresAcknowledgement: boolean, acknowledged: boolean } | null, presence: { status: TrackerPresence, note: string, since: string | null }, notices: Array<{ id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string }> } };

export type TrackerHeartbeatMutationVariables = Exact<{
  device: TrackerDeviceInput;
}>;


export type TrackerHeartbeatMutation = { trackerHeartbeat: { consentRequired: boolean, timezone: string, locale: string, unreadMessages: number, user: { id: string, name: string, email: string }, settings: { intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, idleAutoPauseMinutes: number, screenshotMaxWidth: number, screenshotQuality: number, captureSoundEnabled: boolean, webcamEnabled: boolean, webcamCorner: string, syncIntervalMinutes: number, consentText: string, autoStartEnabled: boolean, autoStartHour: number, autoStopHour: number }, workProfile: { workingTime: WorkingTime, workingTimeNote: string, workLocation: WorkLocation, workLocationNote: string, workHoursPerDay: number, targetMs: number, workDays: Array<number> }, workday: { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean, offReason: TrackerOffReason | null, offLabel: string | null, profileAddress: string | null }, projects: Array<{ id: string, name: string, key: string }>, consentPolicy: { id: string, title: string, slug: string, summary: string, body: string, version: number, requiresAcknowledgement: boolean, acknowledged: boolean } | null, presence: { status: TrackerPresence, note: string, since: string | null }, notices: Array<{ id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string }> } };

export type TrackerSetTimezoneMutationVariables = Exact<{
  timezone: Scalars['String']['input'];
}>;


export type TrackerSetTimezoneMutation = { trackerSetTimezone: { timezone: string } };

export type TrackerAcceptConsentMutationVariables = Exact<{
  signedName: InputMaybe<Scalars['String']['input']>;
}>;


export type TrackerAcceptConsentMutation = { trackerAcceptConsent: boolean };

export type TrackerMarkAttendanceMutationVariables = Exact<{
  status: AttendanceStatus;
  note: InputMaybe<Scalars['String']['input']>;
  location: InputMaybe<TrackerLocationInput>;
  fallback: InputMaybe<AttendanceLocationFallback>;
}>;


export type TrackerMarkAttendanceMutation = { trackerMarkAttendance: { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean, offReason: TrackerOffReason | null, offLabel: string | null, profileAddress: string | null } };

export type TrackerTaskOptionsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type TrackerTaskOptionsQuery = { trackerTaskOptions: Array<{ id: string, key: string, title: string, assignedToMe: boolean }> };

export type SetMyTrackerPresenceMutationVariables = Exact<{
  status: TrackerPresence;
  note: InputMaybe<Scalars['String']['input']>;
}>;


export type SetMyTrackerPresenceMutation = { setMyTrackerPresence: { status: TrackerPresence, note: string, since: string | null } };

export type TrackerStartSessionMutationVariables = Exact<{
  startedAt: Scalars['DateTime']['input'];
  projectId: InputMaybe<Scalars['ID']['input']>;
  taskId: InputMaybe<Scalars['ID']['input']>;
}>;


export type TrackerStartSessionMutation = { trackerStartSession: { id: string } };

export type TrackerStopSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  endedAt: Scalars['DateTime']['input'];
}>;


export type TrackerStopSessionMutation = { trackerStopSession: { id: string } };

export type TrackerSyncIntervalsMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  intervals: Array<TrackerIntervalInput> | TrackerIntervalInput;
}>;


export type TrackerSyncIntervalsMutation = { trackerSyncIntervals: number };

export type TrackerUploadScreenshotMutationVariables = Exact<{
  input: TrackerScreenshotInput;
}>;


export type TrackerUploadScreenshotMutation = { trackerUploadScreenshot: { id: string } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const BrandingFieldsFragmentDoc = new TypedDocumentString(`
    fragment BrandingFields on Branding {
  businessName
  legalName
  slogan
  logoUrl
  logoDarkUrl
  appIconUrl
  faviconUrl
  primaryColor
  secondaryColor
  accentColor
  backgroundColor
  textColor
  supportEmail
  websiteUrl
  copyrightText
}
    `, {"fragmentName":"BrandingFields"}) as unknown as TypedDocumentString<BrandingFieldsFragment, unknown>;
export const ManualEntryFieldsFragmentDoc = new TypedDocumentString(`
    fragment ManualEntryFields on TrackerManualEntry {
  id
  projectName
  taskKey
  taskTitle
  startedAt
  endedAt
  durationMs
  note
  status
  reviewNote
}
    `, {"fragmentName":"ManualEntryFields"}) as unknown as TypedDocumentString<ManualEntryFieldsFragment, unknown>;
export const TaskFieldsFragmentDoc = new TypedDocumentString(`
    fragment TaskFields on TrackerTask {
  id
  key
  title
  assignedToMe
}
    `, {"fragmentName":"TaskFields"}) as unknown as TypedDocumentString<TaskFieldsFragment, unknown>;
export const TrackerSettingsFieldsFragmentDoc = new TypedDocumentString(`
    fragment TrackerSettingsFields on TrackerSettings {
  intervalMinutes
  screenshotsPerInterval
  randomizeScreenshotTiming
  blurScreenshots
  trackWindowTitles
  idleThresholdSeconds
  idleAutoPauseMinutes
  screenshotMaxWidth
  screenshotQuality
  captureSoundEnabled
  webcamEnabled
  webcamCorner
  syncIntervalMinutes
  consentText
  autoStartEnabled
  autoStartHour
  autoStopHour
}
    `, {"fragmentName":"TrackerSettingsFields"}) as unknown as TypedDocumentString<TrackerSettingsFieldsFragment, unknown>;
export const WorkdayFieldsFragmentDoc = new TypedDocumentString(`
    fragment WorkdayFields on TrackerWorkday {
  date
  targetMs
  activeMs
  attendanceStatus
  attendanceNote
  attendanceMarked
  offReason
  offLabel
  profileAddress
}
    `, {"fragmentName":"WorkdayFields"}) as unknown as TypedDocumentString<WorkdayFieldsFragment, unknown>;
export const PresenceFieldsFragmentDoc = new TypedDocumentString(`
    fragment PresenceFields on TrackerPresenceState {
  status
  note
  since
}
    `, {"fragmentName":"PresenceFields"}) as unknown as TypedDocumentString<PresenceFieldsFragment, unknown>;
export const MessageFieldsFragmentDoc = new TypedDocumentString(`
    fragment MessageFields on TrackerMessage {
  id
  kind
  direction
  title
  body
  authorName
  readAt
  createdAt
}
    `, {"fragmentName":"MessageFields"}) as unknown as TypedDocumentString<MessageFieldsFragment, unknown>;
export const TrackerMeFieldsFragmentDoc = new TypedDocumentString(`
    fragment TrackerMeFields on TrackerMe {
  user {
    id
    name
    email
  }
  consentRequired
  timezone
  locale
  settings {
    ...TrackerSettingsFields
  }
  workProfile {
    workingTime
    workingTimeNote
    workLocation
    workLocationNote
    workHoursPerDay
    targetMs
    workDays
  }
  workday {
    ...WorkdayFields
  }
  projects {
    id
    name
    key
  }
  consentPolicy {
    id
    title
    slug
    summary
    body
    version
    requiresAcknowledgement
    acknowledged
  }
  presence {
    ...PresenceFields
  }
  notices {
    ...MessageFields
  }
  unreadMessages
}
    fragment TrackerSettingsFields on TrackerSettings {
  intervalMinutes
  screenshotsPerInterval
  randomizeScreenshotTiming
  blurScreenshots
  trackWindowTitles
  idleThresholdSeconds
  idleAutoPauseMinutes
  screenshotMaxWidth
  screenshotQuality
  captureSoundEnabled
  webcamEnabled
  webcamCorner
  syncIntervalMinutes
  consentText
  autoStartEnabled
  autoStartHour
  autoStopHour
}
fragment WorkdayFields on TrackerWorkday {
  date
  targetMs
  activeMs
  attendanceStatus
  attendanceNote
  attendanceMarked
  offReason
  offLabel
  profileAddress
}
fragment PresenceFields on TrackerPresenceState {
  status
  note
  since
}
fragment MessageFields on TrackerMessage {
  id
  kind
  direction
  title
  body
  authorName
  readAt
  createdAt
}`, {"fragmentName":"TrackerMeFields"}) as unknown as TypedDocumentString<TrackerMeFieldsFragment, unknown>;
export const TrackerRecordLocationDocument = new TypedDocumentString(`
    mutation TrackerRecordLocation($location: TrackerLocationInput!) {
  trackerRecordLocation(location: $location)
}
    `) as unknown as TypedDocumentString<TrackerRecordLocationMutation, TrackerRecordLocationMutationVariables>;
export const MyTrackerLocationsDocument = new TypedDocumentString(`
    query MyTrackerLocations($date: String!) {
  myTrackerLocations(date: $date) {
    id
    lat
    lng
    accuracyM
    source
    kind
    capturedAt
  }
}
    `) as unknown as TypedDocumentString<MyTrackerLocationsQuery, MyTrackerLocationsQueryVariables>;
export const MyTrackerEarningsDocument = new TypedDocumentString(`
    query MyTrackerEarnings($from: String!, $to: String!) {
  myTrackerEarnings(from: $from, to: $to) {
    payType
    rate
    currency
    trackedMs
    amount
  }
}
    `) as unknown as TypedDocumentString<MyTrackerEarningsQuery, MyTrackerEarningsQueryVariables>;
export const ReportClientLogsDocument = new TypedDocumentString(`
    mutation ReportClientLogs($input: AppLogBatchInput!) {
  reportClientLogs(input: $input)
}
    `) as unknown as TypedDocumentString<ReportClientLogsMutation, ReportClientLogsMutationVariables>;
export const MyTrackerCalendarDocument = new TypedDocumentString(`
    query MyTrackerCalendar($from: DateTime!, $to: DateTime!, $timezone: String!) {
  myTrackerCalendar(from: $from, to: $to, timezone: $timezone) {
    date
    activeMs
    idleMs
    manualMs
    keyCount
    mouseCount
    sessions
  }
}
    `) as unknown as TypedDocumentString<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>;
export const MyTrackerExpectedDocument = new TypedDocumentString(`
    query MyTrackerExpected($from: DateTime!, $to: DateTime!, $timezone: String!) {
  myTrackerExpected(from: $from, to: $to, timezone: $timezone) {
    workHoursPerDay
    days {
      date
      expectedMs
      offReason
      offLabel
    }
  }
}
    `) as unknown as TypedDocumentString<MyTrackerExpectedQuery, MyTrackerExpectedQueryVariables>;
export const MyTrackerExpectedReportDocument = new TypedDocumentString(`
    query MyTrackerExpectedReport($from: DateTime!, $to: DateTime!, $timezone: String!) {
  myTrackerExpectedReport(from: $from, to: $to, timezone: $timezone) {
    fileName
    mimeType
    contentBase64
  }
}
    `) as unknown as TypedDocumentString<MyTrackerExpectedReportQuery, MyTrackerExpectedReportQueryVariables>;
export const MyTrackerDayDocument = new TypedDocumentString(`
    query MyTrackerDay($start: DateTime!, $end: DateTime!) {
  myTrackerDay(start: $start, end: $end) {
    intervals {
      startedAt
      endedAt
      activeMs
      idleMs
      keyCount
      mouseCount
      activityPercent
    }
    screenshots {
      id
      capturedAt
      imageUrl
      blurred
      activityPercent
    }
    sessions {
      id
    }
  }
}
    `) as unknown as TypedDocumentString<MyTrackerDayQuery, MyTrackerDayQueryVariables>;
export const TrackerTimezonesDocument = new TypedDocumentString(`
    query TrackerTimezones {
  trackerTimezones
}
    `) as unknown as TypedDocumentString<TrackerTimezonesQuery, TrackerTimezonesQueryVariables>;
export const MyTrackerTotalsDocument = new TypedDocumentString(`
    query MyTrackerTotals {
  myTrackerTotals {
    activeMs
    idleMs
    screenshots
    sessions
  }
}
    `) as unknown as TypedDocumentString<MyTrackerTotalsQuery, MyTrackerTotalsQueryVariables>;
export const MyTrackerManualEntriesDocument = new TypedDocumentString(`
    query MyTrackerManualEntries($from: DateTime!, $to: DateTime!) {
  myTrackerManualEntries(from: $from, to: $to) {
    ...ManualEntryFields
  }
}
    fragment ManualEntryFields on TrackerManualEntry {
  id
  projectName
  taskKey
  taskTitle
  startedAt
  endedAt
  durationMs
  note
  status
  reviewNote
}`) as unknown as TypedDocumentString<MyTrackerManualEntriesQuery, MyTrackerManualEntriesQueryVariables>;
export const CreateTrackerManualEntryDocument = new TypedDocumentString(`
    mutation CreateTrackerManualEntry($input: TrackerManualEntryInput!) {
  createTrackerManualEntry(input: $input) {
    ...ManualEntryFields
  }
}
    fragment ManualEntryFields on TrackerManualEntry {
  id
  projectName
  taskKey
  taskTitle
  startedAt
  endedAt
  durationMs
  note
  status
  reviewNote
}`) as unknown as TypedDocumentString<CreateTrackerManualEntryMutation, CreateTrackerManualEntryMutationVariables>;
export const WithdrawTrackerManualEntryDocument = new TypedDocumentString(`
    mutation WithdrawTrackerManualEntry($id: ID!) {
  withdrawTrackerManualEntry(id: $id)
}
    `) as unknown as TypedDocumentString<WithdrawTrackerManualEntryMutation, WithdrawTrackerManualEntryMutationVariables>;
export const MyTrackerMessagesDocument = new TypedDocumentString(`
    query MyTrackerMessages($kind: TrackerMessageKind) {
  myTrackerMessages(kind: $kind) {
    ...MessageFields
  }
}
    fragment MessageFields on TrackerMessage {
  id
  kind
  direction
  title
  body
  authorName
  readAt
  createdAt
}`) as unknown as TypedDocumentString<MyTrackerMessagesQuery, MyTrackerMessagesQueryVariables>;
export const SendMyTrackerMessageDocument = new TypedDocumentString(`
    mutation SendMyTrackerMessage($body: String!) {
  sendMyTrackerMessage(body: $body) {
    ...MessageFields
  }
}
    fragment MessageFields on TrackerMessage {
  id
  kind
  direction
  title
  body
  authorName
  readAt
  createdAt
}`) as unknown as TypedDocumentString<SendMyTrackerMessageMutation, SendMyTrackerMessageMutationVariables>;
export const MarkMyTrackerMessagesReadDocument = new TypedDocumentString(`
    mutation MarkMyTrackerMessagesRead($kind: TrackerMessageKind) {
  markMyTrackerMessagesRead(kind: $kind)
}
    `) as unknown as TypedDocumentString<MarkMyTrackerMessagesReadMutation, MarkMyTrackerMessagesReadMutationVariables>;
export const LocaleBundleDocument = new TypedDocumentString(`
    query LocaleBundle($locale: String!) {
  localeBundle(locale: $locale) {
    locale
    direction
    translations {
      source
      text
    }
  }
}
    `) as unknown as TypedDocumentString<LocaleBundleQuery, LocaleBundleQueryVariables>;
export const TranslateMissingDocument = new TypedDocumentString(`
    mutation TranslateMissing($locale: String!, $sources: [String!]!) {
  translateMissing(locale: $locale, sources: $sources) {
    source
    text
  }
}
    `) as unknown as TypedDocumentString<TranslateMissingMutation, TranslateMissingMutationVariables>;
export const TrackerLatestReleaseDocument = new TypedDocumentString(`
    query TrackerLatestRelease($platform: String) {
  trackerLatestRelease(platform: $platform) {
    version
    url
    publishedAt
    assets {
      name
      platform
      url
      sizeBytes
    }
  }
}
    `) as unknown as TypedDocumentString<TrackerLatestReleaseQuery, TrackerLatestReleaseQueryVariables>;
export const TrackerLoginDocument = new TypedDocumentString(`
    mutation TrackerLogin($email: String!, $password: String!, $device: TrackerDeviceInput!) {
  trackerLogin(email: $email, password: $password, device: $device) {
    token
    user {
      id
      name
      email
    }
    consentRequired
    settings {
      ...TrackerSettingsFields
    }
  }
}
    fragment TrackerSettingsFields on TrackerSettings {
  intervalMinutes
  screenshotsPerInterval
  randomizeScreenshotTiming
  blurScreenshots
  trackWindowTitles
  idleThresholdSeconds
  idleAutoPauseMinutes
  screenshotMaxWidth
  screenshotQuality
  captureSoundEnabled
  webcamEnabled
  webcamCorner
  syncIntervalMinutes
  consentText
  autoStartEnabled
  autoStartHour
  autoStopHour
}`) as unknown as TypedDocumentString<TrackerLoginMutation, TrackerLoginMutationVariables>;
export const PublicBrandingDocument = new TypedDocumentString(`
    query PublicBranding {
  publicBranding {
    ...BrandingFields
  }
}
    fragment BrandingFields on Branding {
  businessName
  legalName
  slogan
  logoUrl
  logoDarkUrl
  appIconUrl
  faviconUrl
  primaryColor
  secondaryColor
  accentColor
  backgroundColor
  textColor
  supportEmail
  websiteUrl
  copyrightText
}`) as unknown as TypedDocumentString<PublicBrandingQuery, PublicBrandingQueryVariables>;
export const TrackerMeDocument = new TypedDocumentString(`
    query TrackerMe {
  trackerMe {
    ...TrackerMeFields
  }
}
    fragment TrackerSettingsFields on TrackerSettings {
  intervalMinutes
  screenshotsPerInterval
  randomizeScreenshotTiming
  blurScreenshots
  trackWindowTitles
  idleThresholdSeconds
  idleAutoPauseMinutes
  screenshotMaxWidth
  screenshotQuality
  captureSoundEnabled
  webcamEnabled
  webcamCorner
  syncIntervalMinutes
  consentText
  autoStartEnabled
  autoStartHour
  autoStopHour
}
fragment WorkdayFields on TrackerWorkday {
  date
  targetMs
  activeMs
  attendanceStatus
  attendanceNote
  attendanceMarked
  offReason
  offLabel
  profileAddress
}
fragment PresenceFields on TrackerPresenceState {
  status
  note
  since
}
fragment MessageFields on TrackerMessage {
  id
  kind
  direction
  title
  body
  authorName
  readAt
  createdAt
}
fragment TrackerMeFields on TrackerMe {
  user {
    id
    name
    email
  }
  consentRequired
  timezone
  locale
  settings {
    ...TrackerSettingsFields
  }
  workProfile {
    workingTime
    workingTimeNote
    workLocation
    workLocationNote
    workHoursPerDay
    targetMs
    workDays
  }
  workday {
    ...WorkdayFields
  }
  projects {
    id
    name
    key
  }
  consentPolicy {
    id
    title
    slug
    summary
    body
    version
    requiresAcknowledgement
    acknowledged
  }
  presence {
    ...PresenceFields
  }
  notices {
    ...MessageFields
  }
  unreadMessages
}`) as unknown as TypedDocumentString<TrackerMeQuery, TrackerMeQueryVariables>;
export const TrackerHeartbeatDocument = new TypedDocumentString(`
    mutation TrackerHeartbeat($device: TrackerDeviceInput!) {
  trackerHeartbeat(device: $device) {
    ...TrackerMeFields
  }
}
    fragment TrackerSettingsFields on TrackerSettings {
  intervalMinutes
  screenshotsPerInterval
  randomizeScreenshotTiming
  blurScreenshots
  trackWindowTitles
  idleThresholdSeconds
  idleAutoPauseMinutes
  screenshotMaxWidth
  screenshotQuality
  captureSoundEnabled
  webcamEnabled
  webcamCorner
  syncIntervalMinutes
  consentText
  autoStartEnabled
  autoStartHour
  autoStopHour
}
fragment WorkdayFields on TrackerWorkday {
  date
  targetMs
  activeMs
  attendanceStatus
  attendanceNote
  attendanceMarked
  offReason
  offLabel
  profileAddress
}
fragment PresenceFields on TrackerPresenceState {
  status
  note
  since
}
fragment MessageFields on TrackerMessage {
  id
  kind
  direction
  title
  body
  authorName
  readAt
  createdAt
}
fragment TrackerMeFields on TrackerMe {
  user {
    id
    name
    email
  }
  consentRequired
  timezone
  locale
  settings {
    ...TrackerSettingsFields
  }
  workProfile {
    workingTime
    workingTimeNote
    workLocation
    workLocationNote
    workHoursPerDay
    targetMs
    workDays
  }
  workday {
    ...WorkdayFields
  }
  projects {
    id
    name
    key
  }
  consentPolicy {
    id
    title
    slug
    summary
    body
    version
    requiresAcknowledgement
    acknowledged
  }
  presence {
    ...PresenceFields
  }
  notices {
    ...MessageFields
  }
  unreadMessages
}`) as unknown as TypedDocumentString<TrackerHeartbeatMutation, TrackerHeartbeatMutationVariables>;
export const TrackerSetTimezoneDocument = new TypedDocumentString(`
    mutation TrackerSetTimezone($timezone: String!) {
  trackerSetTimezone(timezone: $timezone) {
    timezone
  }
}
    `) as unknown as TypedDocumentString<TrackerSetTimezoneMutation, TrackerSetTimezoneMutationVariables>;
export const TrackerAcceptConsentDocument = new TypedDocumentString(`
    mutation TrackerAcceptConsent($signedName: String) {
  trackerAcceptConsent(signedName: $signedName)
}
    `) as unknown as TypedDocumentString<TrackerAcceptConsentMutation, TrackerAcceptConsentMutationVariables>;
export const TrackerMarkAttendanceDocument = new TypedDocumentString(`
    mutation TrackerMarkAttendance($status: AttendanceStatus!, $note: String, $location: TrackerLocationInput, $fallback: AttendanceLocationFallback) {
  trackerMarkAttendance(
    status: $status
    note: $note
    location: $location
    fallback: $fallback
  ) {
    ...WorkdayFields
  }
}
    fragment WorkdayFields on TrackerWorkday {
  date
  targetMs
  activeMs
  attendanceStatus
  attendanceNote
  attendanceMarked
  offReason
  offLabel
  profileAddress
}`) as unknown as TypedDocumentString<TrackerMarkAttendanceMutation, TrackerMarkAttendanceMutationVariables>;
export const TrackerTaskOptionsDocument = new TypedDocumentString(`
    query TrackerTaskOptions($projectId: ID!) {
  trackerTaskOptions(projectId: $projectId) {
    ...TaskFields
  }
}
    fragment TaskFields on TrackerTask {
  id
  key
  title
  assignedToMe
}`) as unknown as TypedDocumentString<TrackerTaskOptionsQuery, TrackerTaskOptionsQueryVariables>;
export const SetMyTrackerPresenceDocument = new TypedDocumentString(`
    mutation SetMyTrackerPresence($status: TrackerPresence!, $note: String) {
  setMyTrackerPresence(status: $status, note: $note) {
    ...PresenceFields
  }
}
    fragment PresenceFields on TrackerPresenceState {
  status
  note
  since
}`) as unknown as TypedDocumentString<SetMyTrackerPresenceMutation, SetMyTrackerPresenceMutationVariables>;
export const TrackerStartSessionDocument = new TypedDocumentString(`
    mutation TrackerStartSession($startedAt: DateTime!, $projectId: ID, $taskId: ID) {
  trackerStartSession(
    startedAt: $startedAt
    projectId: $projectId
    taskId: $taskId
  ) {
    id
  }
}
    `) as unknown as TypedDocumentString<TrackerStartSessionMutation, TrackerStartSessionMutationVariables>;
export const TrackerStopSessionDocument = new TypedDocumentString(`
    mutation TrackerStopSession($sessionId: ID!, $endedAt: DateTime!) {
  trackerStopSession(sessionId: $sessionId, endedAt: $endedAt) {
    id
  }
}
    `) as unknown as TypedDocumentString<TrackerStopSessionMutation, TrackerStopSessionMutationVariables>;
export const TrackerSyncIntervalsDocument = new TypedDocumentString(`
    mutation TrackerSyncIntervals($sessionId: ID!, $intervals: [TrackerIntervalInput!]!) {
  trackerSyncIntervals(sessionId: $sessionId, intervals: $intervals)
}
    `) as unknown as TypedDocumentString<TrackerSyncIntervalsMutation, TrackerSyncIntervalsMutationVariables>;
export const TrackerUploadScreenshotDocument = new TypedDocumentString(`
    mutation TrackerUploadScreenshot($input: TrackerScreenshotInput!) {
  trackerUploadScreenshot(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<TrackerUploadScreenshotMutation, TrackerUploadScreenshotMutationVariables>;