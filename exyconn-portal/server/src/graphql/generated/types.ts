import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLContext } from '../../middleware/auth';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
  JSON: { input: any; output: any; }
};

export type Activity = {
  __typename?: 'Activity';
  createdAt: Scalars['DateTime']['output'];
  done: Scalars['Boolean']['output'];
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  notes: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  relatedId: Scalars['String']['output'];
  relatedName: Scalars['String']['output'];
  relatedType: ActivitySubject;
  subject: Scalars['String']['output'];
  type: ActivityType;
  updatedAt: Scalars['DateTime']['output'];
};

export type ActivityInput = {
  done: Scalars['Boolean']['input'];
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  relatedId?: InputMaybe<Scalars['String']['input']>;
  relatedName?: InputMaybe<Scalars['String']['input']>;
  relatedType: ActivitySubject;
  subject: Scalars['String']['input'];
  type: ActivityType;
};

export type ActivityPage = {
  __typename?: 'ActivityPage';
  rows: Array<Activity>;
  totalCount: Scalars['Int']['output'];
};

export enum ActivitySubject {
  Company = 'COMPANY',
  Contact = 'CONTACT',
  Deal = 'DEAL'
}

export enum ActivityType {
  Call = 'CALL',
  Email = 'EMAIL',
  Meeting = 'MEETING',
  Note = 'NOTE',
  Task = 'TASK'
}

/** One prompt sent to OpenAI, with the answer and the tokens it cost. */
export type AiJob = {
  __typename?: 'AiJob';
  completionTokens: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Why the run failed, in the words the API gave. Empty unless the status is FAILED. */
  error: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  latencyMs: Scalars['Int']['output'];
  model: Scalars['String']['output'];
  name: Scalars['String']['output'];
  prompt: Scalars['String']['output'];
  /** The prompt-library entry this job was started from, when it was. */
  promptId: Scalars['String']['output'];
  promptTokens: Scalars['Int']['output'];
  ranAt?: Maybe<Scalars['DateTime']['output']>;
  response: Scalars['String']['output'];
  status: AiJobStatus;
  totalTokens: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** A job is always created QUEUED — only running it moves the status on. */
export type AiJobInput = {
  model: Scalars['String']['input'];
  name: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
};

export type AiJobPage = {
  __typename?: 'AiJobPage';
  rows: Array<AiJob>;
  totalCount: Scalars['Int']['output'];
};

export enum AiJobStatus {
  Failed = 'FAILED',
  Queued = 'QUEUED',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED'
}

/** The model picker's options and the value it should open on. */
export type AiModelOptions = {
  __typename?: 'AiModelOptions';
  defaultModel: Scalars['String']['output'];
  models: Array<Scalars['String']['output']>;
};

export type Announcement = {
  __typename?: 'Announcement';
  audience: AnnouncementAudience;
  body: Scalars['String']['output'];
  category: AnnouncementCategory;
  createdAt: Scalars['DateTime']['output'];
  department?: Maybe<Scalars['String']['output']>;
  employeeIds: Array<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  pinned: Scalars['Boolean']['output'];
  publishedAt: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum AnnouncementAudience {
  All = 'ALL',
  Department = 'DEPARTMENT',
  Employees = 'EMPLOYEES'
}

export enum AnnouncementCategory {
  Event = 'EVENT',
  Notice = 'NOTICE',
  Policy = 'POLICY',
  Update = 'UPDATE'
}

export type AnnouncementInput = {
  audience: AnnouncementAudience;
  body: Scalars['String']['input'];
  category: AnnouncementCategory;
  /** Required when audience is DEPARTMENT. */
  department?: InputMaybe<Scalars['String']['input']>;
  /** Required when audience is EMPLOYEES. */
  employeeIds?: InputMaybe<Array<Scalars['String']['input']>>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  pinned: Scalars['Boolean']['input'];
  publishedAt: Scalars['DateTime']['input'];
  title: Scalars['String']['input'];
};

export type AnnouncementPage = {
  __typename?: 'AnnouncementPage';
  rows: Array<Announcement>;
  totalCount: Scalars['Int']['output'];
};

export type AppSettings = {
  __typename?: 'AppSettings';
  dateFormat: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  timeFormat: Scalars['String']['output'];
  timezone: Scalars['String']['output'];
};

/** Employee-facing leave application — the server sets employeeId and PENDING status. */
export type ApplyLeaveInput = {
  fromDate: Scalars['DateTime']['input'];
  reason: Scalars['String']['input'];
  toDate: Scalars['DateTime']['input'];
  type: LeaveType;
};

export type Asset = {
  __typename?: 'Asset';
  assetTag: Scalars['String']['output'];
  assignedToId: Scalars['String']['output'];
  assignedToName: Scalars['String']['output'];
  category: AssetCategory;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  location: Scalars['String']['output'];
  manufacturer: Scalars['String']['output'];
  modelName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  notes: Scalars['String']['output'];
  purchaseCost: Scalars['Float']['output'];
  purchaseDate?: Maybe<Scalars['DateTime']['output']>;
  serialNumber: Scalars['String']['output'];
  status: AssetStatus;
  updatedAt: Scalars['DateTime']['output'];
  warrantyExpiry?: Maybe<Scalars['DateTime']['output']>;
};

/** Just enough of an employee to put them in the 'assigned to' picker. */
export type AssetAssignee = {
  __typename?: 'AssetAssignee';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export enum AssetCategory {
  Desktop = 'DESKTOP',
  Laptop = 'LAPTOP',
  Monitor = 'MONITOR',
  Network = 'NETWORK',
  Other = 'OTHER',
  Peripheral = 'PERIPHERAL',
  Phone = 'PHONE',
  SoftwareLicence = 'SOFTWARE_LICENCE',
  Tablet = 'TABLET'
}

export type AssetInput = {
  assetTag: Scalars['String']['input'];
  assignedToId?: InputMaybe<Scalars['String']['input']>;
  assignedToName?: InputMaybe<Scalars['String']['input']>;
  category: AssetCategory;
  location?: InputMaybe<Scalars['String']['input']>;
  manufacturer?: InputMaybe<Scalars['String']['input']>;
  modelName?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  purchaseCost?: InputMaybe<Scalars['Float']['input']>;
  purchaseDate?: InputMaybe<Scalars['DateTime']['input']>;
  serialNumber?: InputMaybe<Scalars['String']['input']>;
  status: AssetStatus;
  warrantyExpiry?: InputMaybe<Scalars['DateTime']['input']>;
};

export type AssetPage = {
  __typename?: 'AssetPage';
  rows: Array<Asset>;
  totalCount: Scalars['Int']['output'];
};

export enum AssetStatus {
  Assigned = 'ASSIGNED',
  InRepair = 'IN_REPAIR',
  InStock = 'IN_STOCK',
  Lost = 'LOST',
  Retired = 'RETIRED'
}

export type Attendance = {
  __typename?: 'Attendance';
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['DateTime']['output'];
  employeeId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  status: AttendanceStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export enum AttendanceStatus {
  Absent = 'ABSENT',
  HalfDay = 'HALF_DAY',
  Present = 'PRESENT',
  Wfh = 'WFH'
}

/** A saved set of clients a campaign can be sent to. */
export type AudienceList = {
  __typename?: 'AudienceList';
  clientIds: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AudienceListInput = {
  clientIds?: InputMaybe<Array<Scalars['String']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type AudienceListPage = {
  __typename?: 'AudienceListPage';
  rows: Array<AudienceList>;
  totalCount: Scalars['Int']['output'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
  user: User;
};

export type Benefit = {
  __typename?: 'Benefit';
  coverage: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  documentUrl?: Maybe<Scalars['String']['output']>;
  employeeId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kind: BenefitKind;
  name: Scalars['String']['output'];
  provider: Scalars['String']['output'];
  reference: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  validFrom?: Maybe<Scalars['DateTime']['output']>;
  validTo?: Maybe<Scalars['DateTime']['output']>;
};

export type BenefitInput = {
  coverage: Scalars['String']['input'];
  documentUrl?: InputMaybe<Scalars['String']['input']>;
  employeeId: Scalars['String']['input'];
  kind: BenefitKind;
  name: Scalars['String']['input'];
  provider: Scalars['String']['input'];
  reference: Scalars['String']['input'];
  validFrom?: InputMaybe<Scalars['DateTime']['input']>;
  validTo?: InputMaybe<Scalars['DateTime']['input']>;
};

export enum BenefitKind {
  Gratuity = 'GRATUITY',
  Insurance = 'INSURANCE',
  Other = 'OTHER',
  Pf = 'PF',
  Wellness = 'WELLNESS'
}

export type BenefitPage = {
  __typename?: 'BenefitPage';
  rows: Array<Benefit>;
  totalCount: Scalars['Int']['output'];
};

export type BlogAuthor = {
  __typename?: 'BlogAuthor';
  initials: Scalars['String']['output'];
  name: Scalars['String']['output'];
  role: Scalars['String']['output'];
};

export type BlogAuthorInput = {
  initials?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  role?: InputMaybe<Scalars['String']['input']>;
};

export type BlogPost = {
  __typename?: 'BlogPost';
  author: BlogAuthor;
  content: Scalars['String']['output'];
  coverImage: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  featured: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  publishedAt: Scalars['DateTime']['output'];
  readTime: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  summary: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type BlogPostInput = {
  author: BlogAuthorInput;
  content?: InputMaybe<Scalars['String']['input']>;
  coverImage?: InputMaybe<Scalars['String']['input']>;
  featured?: InputMaybe<Scalars['Boolean']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  readTime?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  summary?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type BlogPostPage = {
  __typename?: 'BlogPostPage';
  rows: Array<BlogPost>;
  totalCount: Scalars['Int']['output'];
};

export type BoardColumn = {
  __typename?: 'BoardColumn';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
};

export type Branding = {
  __typename?: 'Branding';
  accentColor: Scalars['String']['output'];
  address: Scalars['String']['output'];
  appIconUrl: Scalars['String']['output'];
  backgroundColor: Scalars['String']['output'];
  businessName: Scalars['String']['output'];
  contactPhone: Scalars['String']['output'];
  copyrightText: Scalars['String']['output'];
  description: Scalars['String']['output'];
  emailLogoUrl: Scalars['String']['output'];
  facebookUrl: Scalars['String']['output'];
  faviconUrl: Scalars['String']['output'];
  githubUrl: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  instagramUrl: Scalars['String']['output'];
  legalName: Scalars['String']['output'];
  linkedinUrl: Scalars['String']['output'];
  loginPages: Array<LoginPage>;
  logoDarkUrl: Scalars['String']['output'];
  logoUrl: Scalars['String']['output'];
  ogImageUrl: Scalars['String']['output'];
  primaryColor: Scalars['String']['output'];
  secondaryColor: Scalars['String']['output'];
  slogan: Scalars['String']['output'];
  supportEmail: Scalars['String']['output'];
  textColor: Scalars['String']['output'];
  twitterUrl: Scalars['String']['output'];
  websiteUrl: Scalars['String']['output'];
  youtubeUrl: Scalars['String']['output'];
};

export type BrandingInput = {
  accentColor?: InputMaybe<Scalars['String']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  appIconUrl?: InputMaybe<Scalars['String']['input']>;
  backgroundColor?: InputMaybe<Scalars['String']['input']>;
  businessName?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  copyrightText?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  emailLogoUrl?: InputMaybe<Scalars['String']['input']>;
  facebookUrl?: InputMaybe<Scalars['String']['input']>;
  faviconUrl?: InputMaybe<Scalars['String']['input']>;
  githubUrl?: InputMaybe<Scalars['String']['input']>;
  instagramUrl?: InputMaybe<Scalars['String']['input']>;
  legalName?: InputMaybe<Scalars['String']['input']>;
  linkedinUrl?: InputMaybe<Scalars['String']['input']>;
  loginPages?: InputMaybe<Array<LoginPageInput>>;
  logoDarkUrl?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  ogImageUrl?: InputMaybe<Scalars['String']['input']>;
  primaryColor?: InputMaybe<Scalars['String']['input']>;
  secondaryColor?: InputMaybe<Scalars['String']['input']>;
  slogan?: InputMaybe<Scalars['String']['input']>;
  supportEmail?: InputMaybe<Scalars['String']['input']>;
  textColor?: InputMaybe<Scalars['String']['input']>;
  twitterUrl?: InputMaybe<Scalars['String']['input']>;
  websiteUrl?: InputMaybe<Scalars['String']['input']>;
  youtubeUrl?: InputMaybe<Scalars['String']['input']>;
};

export type Bug = {
  __typename?: 'Bug';
  assignee: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  dueDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  severity: BugSeverity;
  status: BugStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type BugInput = {
  assignee: Scalars['String']['input'];
  description: Scalars['String']['input'];
  dueDate: Scalars['DateTime']['input'];
  severity: BugSeverity;
  status: BugStatus;
  title: Scalars['String']['input'];
};

export type BugPage = {
  __typename?: 'BugPage';
  rows: Array<Bug>;
  totalCount: Scalars['Int']['output'];
};

export enum BugSeverity {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export enum BugStatus {
  Closed = 'CLOSED',
  InProgress = 'IN_PROGRESS',
  Open = 'OPEN',
  Resolved = 'RESOLVED'
}

export type Campaign = {
  __typename?: 'Campaign';
  body?: Maybe<Scalars['String']['output']>;
  budget: Scalars['Float']['output'];
  channel: CampaignChannel;
  createdAt: Scalars['DateTime']['output'];
  endDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  lastSentAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  /** Recipients reached by the last send. Null for campaigns never sent / created before email support. */
  recipientsCount?: Maybe<Scalars['Int']['output']>;
  startDate: Scalars['DateTime']['output'];
  status: CampaignStatus;
  subject?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export enum CampaignChannel {
  Display = 'DISPLAY',
  Email = 'EMAIL',
  Search = 'SEARCH',
  Social = 'SOCIAL'
}

export type CampaignInput = {
  body?: InputMaybe<Scalars['String']['input']>;
  budget: Scalars['Float']['input'];
  channel: CampaignChannel;
  endDate: Scalars['DateTime']['input'];
  name: Scalars['String']['input'];
  startDate: Scalars['DateTime']['input'];
  status: CampaignStatus;
  subject?: InputMaybe<Scalars['String']['input']>;
};

export type CampaignPage = {
  __typename?: 'CampaignPage';
  rows: Array<Campaign>;
  totalCount: Scalars['Int']['output'];
};

/** One recipient's copy of one campaign send, kept whether it worked or not. */
export type CampaignSend = {
  __typename?: 'CampaignSend';
  audienceListId: Scalars['String']['output'];
  campaignId: Scalars['String']['output'];
  error: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  recipientName: Scalars['String']['output'];
  sentAt: Scalars['DateTime']['output'];
  status: CampaignSendStatus;
  to: Scalars['String']['output'];
};

/** Outcome of a campaign email blast. */
export type CampaignSendResult = {
  __typename?: 'CampaignSendResult';
  campaign: Campaign;
  failed: Scalars['Int']['output'];
  sent: Scalars['Int']['output'];
};

export enum CampaignSendStatus {
  Failed = 'FAILED',
  Sent = 'SENT'
}

export enum CampaignStatus {
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  Paused = 'PAUSED',
  Planned = 'PLANNED'
}

export type CaseStudy = {
  __typename?: 'CaseStudy';
  author: Scalars['String']['output'];
  category: Scalars['String']['output'];
  content: Scalars['String']['output'];
  coverImage: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  excerpt: Scalars['String']['output'];
  featured: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  pdfUrl: Scalars['String']['output'];
  publishedAt: Scalars['DateTime']['output'];
  slug: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type CaseStudyInput = {
  author?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  coverImage?: InputMaybe<Scalars['String']['input']>;
  excerpt?: InputMaybe<Scalars['String']['input']>;
  featured?: InputMaybe<Scalars['Boolean']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  pdfUrl?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug: Scalars['String']['input'];
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type CaseStudyPage = {
  __typename?: 'CaseStudyPage';
  rows: Array<CaseStudy>;
  totalCount: Scalars['Int']['output'];
};

export type Client = {
  __typename?: 'Client';
  company: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  status: ClientStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type ClientInput = {
  company: Scalars['String']['input'];
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  status: ClientStatus;
};

export type ClientPage = {
  __typename?: 'ClientPage';
  rows: Array<Client>;
  totalCount: Scalars['Int']['output'];
};

export enum ClientStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Prospect = 'PROSPECT'
}

export type Company = {
  __typename?: 'Company';
  createdAt: Scalars['DateTime']['output'];
  domain: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  industry: Scalars['String']['output'];
  location: Scalars['String']['output'];
  name: Scalars['String']['output'];
  notes: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  /** One of COMPANY_SIZES (11-50, and so on). A string, because 1-10 is not a valid enum name. */
  size: Scalars['String']['output'];
  status: CompanyStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type CompanyBenefit = {
  __typename?: 'CompanyBenefit';
  description: Scalars['String']['output'];
  icon: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type CompanyBenefitInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  icon: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

/** A cost the company incurred — a vendor bill, rent, a subscription. */
export type CompanyExpense = {
  __typename?: 'CompanyExpense';
  amount: Scalars['Float']['output'];
  category: ExpenseCategory;
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  description: Scalars['String']['output'];
  dueDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** When the cost was incurred. Profit is measured on this date. */
  incurredOn: Scalars['DateTime']['output'];
  /** When the money actually left. Cash flow is measured on this date. Null until paid. */
  paidOn?: Maybe<Scalars['DateTime']['output']>;
  recordedBy: Scalars['String']['output'];
  reference: Scalars['String']['output'];
  status: ExpenseState;
  updatedAt: Scalars['DateTime']['output'];
  vendor: Scalars['String']['output'];
};

export type CompanyExpenseInput = {
  amount: Scalars['Float']['input'];
  category: ExpenseCategory;
  currency: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate: Scalars['DateTime']['input'];
  incurredOn: Scalars['DateTime']['input'];
  reference?: InputMaybe<Scalars['String']['input']>;
  vendor: Scalars['String']['input'];
};

export type CompanyExpensePage = {
  __typename?: 'CompanyExpensePage';
  rows: Array<CompanyExpense>;
  totalCount: Scalars['Int']['output'];
};

/**
 * The company's finances over a period.
 *
 * Two different questions live here and they are answered separately on purpose. The
 * ACCRUAL figures (invoiced, expenses, payroll, reimbursements, profit) say what the period
 * earned and what it cost, whenever the money happens to move. The CASH figures (collected,
 * paidOut, netCash) say what actually moved. A dashboard that shows one number called
 * "revenue" without saying which of the two it is invites an argument nobody can settle.
 */
export type CompanyFinance = {
  __typename?: 'CompanyFinance';
  byCategory: Array<FinanceBucket>;
  /** Cash: customer payments received in the period. */
  collected: Scalars['Float']['output'];
  /** Accrual: company bills incurred in the period. */
  expenses: Scalars['Float']['output'];
  from: Scalars['DateTime']['output'];
  /** Accrual: invoices issued in the period. */
  invoiced: Scalars['Float']['output'];
  months: Array<FinanceMonth>;
  /** collected - paidOut. */
  netCash: Scalars['Float']['output'];
  /** Owed by the company right now, regardless of the period. */
  outstandingPayable: Scalars['Float']['output'];
  /** Owed to the company right now, regardless of the period. */
  outstandingReceivable: Scalars['Float']['output'];
  /** The part of outstandingPayable already past its due date. */
  overduePayable: Scalars['Float']['output'];
  /** Cash: bills settled in the period. */
  paidOut: Scalars['Float']['output'];
  /** Accrual: payslips issued in the period. */
  payroll: Scalars['Float']['output'];
  /** invoiced - totalCost. */
  profit: Scalars['Float']['output'];
  /** Accrual: employee expense claims incurred in the period, once approved. */
  reimbursements: Scalars['Float']['output'];
  to: Scalars['DateTime']['output'];
  /** expenses + payroll + reimbursements. */
  totalCost: Scalars['Float']['output'];
};

export type CompanyInput = {
  domain: Scalars['String']['input'];
  industry?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  /** One of COMPANY_SIZES (11-50, and so on). A string, because 1-10 is not a valid enum name. */
  size: Scalars['String']['input'];
  status: CompanyStatus;
};

export type CompanyPage = {
  __typename?: 'CompanyPage';
  rows: Array<Company>;
  totalCount: Scalars['Int']['output'];
};

export type CompanySocialLinks = {
  __typename?: 'CompanySocialLinks';
  facebook: Scalars['String']['output'];
  instagram: Scalars['String']['output'];
  linkedin: Scalars['String']['output'];
  twitter: Scalars['String']['output'];
};

export type CompanySocialLinksInput = {
  facebook?: InputMaybe<Scalars['String']['input']>;
  instagram?: InputMaybe<Scalars['String']['input']>;
  linkedin?: InputMaybe<Scalars['String']['input']>;
  twitter?: InputMaybe<Scalars['String']['input']>;
};

export enum CompanyStatus {
  Churned = 'CHURNED',
  Customer = 'CUSTOMER',
  Partner = 'PARTNER',
  Prospect = 'PROSPECT'
}

export type Contact = {
  __typename?: 'Contact';
  companyId: Scalars['String']['output'];
  companyName: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  notes: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  status: ContactStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ContactInput = {
  companyId?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  status: ContactStatus;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type ContactPage = {
  __typename?: 'ContactPage';
  rows: Array<Contact>;
  totalCount: Scalars['Int']['output'];
};

export enum ContactStatus {
  Active = 'ACTIVE',
  Bounced = 'BOUNCED',
  LeftCompany = 'LEFT_COMPANY',
  Unsubscribed = 'UNSUBSCRIBED'
}

export type ContainerMount = {
  __typename?: 'ContainerMount';
  destination: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  source: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

/** A published port: the host side is what nginx proxies a public domain to. */
export type ContainerPort = {
  __typename?: 'ContainerPort';
  ip: Scalars['String']['output'];
  privatePort: Scalars['Int']['output'];
  protocol: Scalars['String']['output'];
  publicPort: Scalars['Int']['output'];
};

export type Contract = {
  __typename?: 'Contract';
  createdAt: Scalars['DateTime']['output'];
  effectiveDate: Scalars['DateTime']['output'];
  expiryDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  party: Scalars['String']['output'];
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  signedAt?: Maybe<Scalars['DateTime']['output']>;
  signedBy?: Maybe<Scalars['String']['output']>;
  status: ContractStatus;
  title: Scalars['String']['output'];
  type: ContractType;
  updatedAt: Scalars['DateTime']['output'];
};

export type ContractInput = {
  effectiveDate: Scalars['DateTime']['input'];
  expiryDate: Scalars['DateTime']['input'];
  party: Scalars['String']['input'];
  status: ContractStatus;
  title: Scalars['String']['input'];
  type: ContractType;
};

export type ContractPage = {
  __typename?: 'ContractPage';
  rows: Array<Contract>;
  totalCount: Scalars['Int']['output'];
};

export enum ContractStatus {
  Active = 'ACTIVE',
  Draft = 'DRAFT',
  Expired = 'EXPIRED',
  Terminated = 'TERMINATED'
}

export enum ContractType {
  Employment = 'EMPLOYMENT',
  Msa = 'MSA',
  Nda = 'NDA',
  Sow = 'SOW'
}

export type CreateUserInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  brief?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  department?: InputMaybe<Scalars['String']['input']>;
  designation?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  employmentStatus?: InputMaybe<EmploymentStatus>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  joinDate?: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  roles: Array<Role>;
  workHoursPerDay?: InputMaybe<Scalars['Int']['input']>;
  workLocation?: InputMaybe<WorkLocation>;
  workLocationNote?: InputMaybe<Scalars['String']['input']>;
  workingTime?: InputMaybe<WorkingTime>;
  workingTimeNote?: InputMaybe<Scalars['String']['input']>;
};

/** The MongoDB this server is connected to, reported by the database server. */
export type DatabaseInfo = {
  __typename?: 'DatabaseInfo';
  collections: Scalars['Int']['output'];
  connectionsAvailable: Scalars['Int']['output'];
  connectionsCurrent: Scalars['Int']['output'];
  dataSizeBytes: Scalars['Float']['output'];
  host: Scalars['String']['output'];
  indexSizeBytes: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  objects: Scalars['Float']['output'];
  storageSizeBytes: Scalars['Float']['output'];
  uptimeSeconds: Scalars['Int']['output'];
  version: Scalars['String']['output'];
};

export type Deal = {
  __typename?: 'Deal';
  companyId: Scalars['String']['output'];
  companyName: Scalars['String']['output'];
  contactId: Scalars['String']['output'];
  contactName: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  expectedCloseDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  notes: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  /** Percent, 0-100. With value, this gives the weighted pipeline figure. */
  probability: Scalars['Int']['output'];
  stage: DealStage;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value: Scalars['Float']['output'];
};

export type DealInput = {
  companyId?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  contactId?: InputMaybe<Scalars['String']['input']>;
  contactName?: InputMaybe<Scalars['String']['input']>;
  expectedCloseDate?: InputMaybe<Scalars['DateTime']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  probability: Scalars['Int']['input'];
  stage: DealStage;
  title: Scalars['String']['input'];
  value: Scalars['Float']['input'];
};

export type DealPage = {
  __typename?: 'DealPage';
  rows: Array<Deal>;
  totalCount: Scalars['Int']['output'];
};

export enum DealStage {
  Discovery = 'DISCOVERY',
  Lost = 'LOST',
  Negotiation = 'NEGOTIATION',
  Proposal = 'PROPOSAL',
  Qualifying = 'QUALIFYING',
  Won = 'WON'
}

export type Department = {
  __typename?: 'Department';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type DepartmentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

/** One page of a project's documentation. Pages nest through parentId. */
export type DocPage = {
  __typename?: 'DocPage';
  /** Rich text (HTML). Empty until somebody writes the page. */
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  /** Null for a top-level page; the parent's id for a page filed under another. */
  parentId?: Maybe<Scalars['ID']['output']>;
  projectId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedByName: Scalars['String']['output'];
};

export type DockerContainer = {
  __typename?: 'DockerContainer';
  createdAt: Scalars['DateTime']['output'];
  health: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  /** The image's :tag — for this stack, the commit SHA that was deployed. */
  imageTag: Scalars['String']['output'];
  ipAddress: Scalars['String']['output'];
  name: Scalars['String']['output'];
  networks: Array<Scalars['String']['output']>;
  ports: Array<ContainerPort>;
  state: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

/** Everything docker inspect says about one container, plus a live resource sample. */
export type DockerContainerDetail = {
  __typename?: 'DockerContainerDetail';
  command: Scalars['String']['output'];
  /** CPU limit in cores. 0 means unlimited. */
  cpuLimit: Scalars['Float']['output'];
  cpuPercent: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  exitCode: Scalars['Int']['output'];
  health: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  imageId: Scalars['String']['output'];
  imageTag: Scalars['String']['output'];
  ipAddress: Scalars['String']['output'];
  logDriver: Scalars['String']['output'];
  memoryBytes: Scalars['Float']['output'];
  memoryLimitBytes: Scalars['Float']['output'];
  mounts: Array<ContainerMount>;
  name: Scalars['String']['output'];
  networks: Array<Scalars['String']['output']>;
  restartCount: Scalars['Int']['output'];
  restartPolicy: Scalars['String']['output'];
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  state: Scalars['String']['output'];
};

export type DockerDiskUsage = {
  __typename?: 'DockerDiskUsage';
  buildCacheBytes: Scalars['Float']['output'];
  containersBytes: Scalars['Float']['output'];
  layersBytes: Scalars['Float']['output'];
  volumesBytes: Scalars['Float']['output'];
};

/** The Docker engine and the machine hosting it. Unreadable is a state, not an error. */
export type DockerHost = {
  __typename?: 'DockerHost';
  apiVersion: Scalars['String']['output'];
  architecture: Scalars['String']['output'];
  containersPaused: Scalars['Int']['output'];
  containersRunning: Scalars['Int']['output'];
  containersStopped: Scalars['Int']['output'];
  cpus: Scalars['Int']['output'];
  dockerRootDir: Scalars['String']['output'];
  /** Why the engine could not be read. Empty when reachable. */
  error: Scalars['String']['output'];
  imagesCount: Scalars['Int']['output'];
  kernelVersion: Scalars['String']['output'];
  loggingDriver: Scalars['String']['output'];
  memoryBytes: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  operatingSystem: Scalars['String']['output'];
  osType: Scalars['String']['output'];
  reachable: Scalars['Boolean']['output'];
  serverTime?: Maybe<Scalars['DateTime']['output']>;
  serverVersion: Scalars['String']['output'];
  storageDriver: Scalars['String']['output'];
};

export type DockerImage = {
  __typename?: 'DockerImage';
  containers: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  repoTags: Array<Scalars['String']['output']>;
  sizeBytes: Scalars['Float']['output'];
};

export type DockerStorage = {
  __typename?: 'DockerStorage';
  images: Array<DockerImage>;
  usage: DockerDiskUsage;
};

export enum DocumentCategory {
  Compliance = 'COMPLIANCE',
  Contract = 'CONTRACT',
  Other = 'OTHER',
  Policy = 'POLICY'
}

export enum DocumentKind {
  AppointmentLetter = 'APPOINTMENT_LETTER',
  Experience = 'EXPERIENCE',
  OfferLetter = 'OFFER_LETTER',
  Other = 'OTHER',
  Policy = 'POLICY',
  Relieving = 'RELIEVING',
  SalarySlip = 'SALARY_SLIP',
  Tax = 'TAX'
}

export enum DocumentStatus {
  Archived = 'ARCHIVED',
  Draft = 'DRAFT',
  Final = 'FINAL'
}

export type EmailConfig = {
  __typename?: 'EmailConfig';
  createdAt: Scalars['DateTime']['output'];
  fromAddress: Scalars['String']['output'];
  host: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  password: Scalars['String']['output'];
  port: Scalars['Int']['output'];
  secure: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  username: Scalars['String']['output'];
};

export type EmailConfigInput = {
  fromAddress: Scalars['String']['input'];
  host: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  password: Scalars['String']['input'];
  port: Scalars['Int']['input'];
  secure: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};

export type EmailDashboard = {
  __typename?: 'EmailDashboard';
  activeTemplates: Scalars['Int']['output'];
  byTemplate: Array<EmailTemplateUsage>;
  /** Whether an SMTP configuration is active. Nothing sends without one. */
  configured: Scalars['Boolean']['output'];
  days: Array<EmailDayCount>;
  failed: Scalars['Int']['output'];
  fragments: Scalars['Int']['output'];
  recentFailures: Array<EmailLog>;
  sent: Scalars['Int']['output'];
  templates: Scalars['Int']['output'];
};

/** One day of sending, for the dashboard's trend. */
export type EmailDayCount = {
  __typename?: 'EmailDayCount';
  date: Scalars['String']['output'];
  failed: Scalars['Int']['output'];
  sent: Scalars['Int']['output'];
};

/** A reusable piece of MJML, pulled into a template with {{> key }}. */
export type EmailFragment = {
  __typename?: 'EmailFragment';
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  mjml: Scalars['String']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
};

export type EmailFragmentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  mjml: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type EmailFragmentPage = {
  __typename?: 'EmailFragmentPage';
  rows: Array<EmailFragment>;
  totalCount: Scalars['Int']['output'];
};

/** One attempt to send, kept whether it worked or not. */
export type EmailLog = {
  __typename?: 'EmailLog';
  /** The transport's own words when it refused. Empty on success. */
  error: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  sentAt: Scalars['DateTime']['output'];
  status: EmailLogStatus;
  subject: Scalars['String']['output'];
  templateKey: Scalars['String']['output'];
  templateName: Scalars['String']['output'];
  to: Scalars['String']['output'];
  triggeredBy: Scalars['String']['output'];
};

export type EmailLogPage = {
  __typename?: 'EmailLogPage';
  rows: Array<EmailLog>;
  totalCount: Scalars['Int']['output'];
};

export enum EmailLogStatus {
  Failed = 'FAILED',
  Sent = 'SENT'
}

/** A rendered template, as the send path itself produces it. */
export type EmailPreview = {
  __typename?: 'EmailPreview';
  fragments: Array<Scalars['String']['output']>;
  html: Scalars['String']['output'];
  subject: Scalars['String']['output'];
  variables: Array<Scalars['String']['output']>;
};

/** One transactional email, authored here rather than compiled into the server. */
export type EmailTemplate = {
  __typename?: 'EmailTemplate';
  description: Scalars['String']['output'];
  /** The fragments it pulls in. */
  fragments: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  /** What code sends by. Renaming it breaks the caller. */
  key: Scalars['String']['output'];
  mjml: Scalars['String']['output'];
  name: Scalars['String']['output'];
  subject: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  /**
   * The placeholders this template needs, read out of its own markup (and its fragments')
   * every time it is asked for — never a stored list, which drifts the moment copy is edited.
   */
  variables: Array<Scalars['String']['output']>;
};

export type EmailTemplateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  key: Scalars['String']['input'];
  mjml: Scalars['String']['input'];
  name: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

export type EmailTemplatePage = {
  __typename?: 'EmailTemplatePage';
  rows: Array<EmailTemplate>;
  totalCount: Scalars['Int']['output'];
};

/** How much a single template is used, and how reliably. */
export type EmailTemplateUsage = {
  __typename?: 'EmailTemplateUsage';
  failed: Scalars['Int']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  sent: Scalars['Int']['output'];
};

/** One placeholder value, for previewing and test sends. */
export type EmailVariableInput = {
  name: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type EmployeeDocument = {
  __typename?: 'EmployeeDocument';
  createdAt: Scalars['DateTime']['output'];
  employeeId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  issuedOn: Scalars['DateTime']['output'];
  kind: DocumentKind;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
};

export type EmployeeDocumentInput = {
  employeeId: Scalars['String']['input'];
  issuedOn: Scalars['DateTime']['input'];
  kind: DocumentKind;
  title: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type EmployeeDocumentPage = {
  __typename?: 'EmployeeDocumentPage';
  rows: Array<EmployeeDocument>;
  totalCount: Scalars['Int']['output'];
};

export type EmployeeRequest = {
  __typename?: 'EmployeeRequest';
  createdAt: Scalars['DateTime']['output'];
  decidedAt?: Maybe<Scalars['DateTime']['output']>;
  decisionNote?: Maybe<Scalars['String']['output']>;
  details: Scalars['String']['output'];
  employeeId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status: RequestStatus;
  subject: Scalars['String']['output'];
  type: RequestType;
  updatedAt: Scalars['DateTime']['output'];
};

export type EmployeeRequestInput = {
  decisionNote?: InputMaybe<Scalars['String']['input']>;
  details: Scalars['String']['input'];
  employeeId: Scalars['String']['input'];
  status: RequestStatus;
  subject: Scalars['String']['input'];
  type: RequestType;
};

export type EmployeeRequestPage = {
  __typename?: 'EmployeeRequestPage';
  rows: Array<EmployeeRequest>;
  totalCount: Scalars['Int']['output'];
};

/** The same fields without employeeId, which saveEmployeeSalary takes as its own argument. */
export type EmployeeSalaryInput = {
  allowances: Scalars['Float']['input'];
  basic: Scalars['Float']['input'];
  billingRate?: InputMaybe<Scalars['Float']['input']>;
  currency: Scalars['String']['input'];
  deductions: Scalars['Float']['input'];
  effectiveFrom: Scalars['DateTime']['input'];
  hra: Scalars['Float']['input'];
  payType?: InputMaybe<PayType>;
  payTypeNote?: InputMaybe<Scalars['String']['input']>;
  rate?: InputMaybe<Scalars['Float']['input']>;
};

export enum EmploymentStatus {
  Active = 'ACTIVE',
  OnLeave = 'ON_LEAVE',
  Terminated = 'TERMINATED'
}

export type EmploymentType = {
  __typename?: 'EmploymentType';
  active: Scalars['Boolean']['output'];
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  payrollEligible: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type EmploymentTypeInput = {
  active: Scalars['Boolean']['input'];
  code: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  payrollEligible: Scalars['Boolean']['input'];
};

export type EmploymentTypePage = {
  __typename?: 'EmploymentTypePage';
  rows: Array<EmploymentType>;
  totalCount: Scalars['Int']['output'];
};

export type ExitRecord = {
  __typename?: 'ExitRecord';
  assetsReturned: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Days left until the last working day; null once it has passed or is unset. */
  daysToLastWorkingDay?: Maybe<Scalars['Int']['output']>;
  documentsIssued: Scalars['Boolean']['output'];
  employeeId: Scalars['String']['output'];
  exitInterviewNotes: Scalars['String']['output'];
  finalSettlementAmount?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  knowledgeTransferDone: Scalars['Boolean']['output'];
  lastWorkingDate?: Maybe<Scalars['DateTime']['output']>;
  noticePeriodDays: Scalars['Int']['output'];
  reason: Scalars['String']['output'];
  resignationDate: Scalars['DateTime']['output'];
  stage: ExitStage;
  updatedAt: Scalars['DateTime']['output'];
};

export type ExitRecordInput = {
  assetsReturned: Scalars['Boolean']['input'];
  documentsIssued: Scalars['Boolean']['input'];
  employeeId: Scalars['String']['input'];
  exitInterviewNotes: Scalars['String']['input'];
  finalSettlementAmount?: InputMaybe<Scalars['Float']['input']>;
  knowledgeTransferDone: Scalars['Boolean']['input'];
  lastWorkingDate?: InputMaybe<Scalars['DateTime']['input']>;
  noticePeriodDays: Scalars['Int']['input'];
  reason: Scalars['String']['input'];
  resignationDate: Scalars['DateTime']['input'];
  stage: ExitStage;
};

export type ExitRecordPage = {
  __typename?: 'ExitRecordPage';
  rows: Array<ExitRecord>;
  totalCount: Scalars['Int']['output'];
};

export enum ExitStage {
  Approved = 'APPROVED',
  Clearance = 'CLEARANCE',
  Exited = 'EXITED',
  FullAndFinal = 'FULL_AND_FINAL',
  NoticePeriod = 'NOTICE_PERIOD',
  Resigned = 'RESIGNED',
  Withdrawn = 'WITHDRAWN'
}

export enum ExpenseCategory {
  Hardware = 'HARDWARE',
  Marketing = 'MARKETING',
  Other = 'OTHER',
  Rent = 'RENT',
  Salaries = 'SALARIES',
  Services = 'SERVICES',
  Software = 'SOFTWARE',
  Taxes = 'TAXES',
  Travel = 'TRAVEL',
  Utilities = 'UTILITIES'
}

export type ExpenseClaim = {
  __typename?: 'ExpenseClaim';
  amount: Scalars['Float']['output'];
  approvedAmount?: Maybe<Scalars['Float']['output']>;
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  description: Scalars['String']['output'];
  employeeId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  incurredOn: Scalars['DateTime']['output'];
  receiptUrl?: Maybe<Scalars['String']['output']>;
  status: ExpenseStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type ExpenseClaimInput = {
  amount: Scalars['Float']['input'];
  approvedAmount?: InputMaybe<Scalars['Float']['input']>;
  category: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  description: Scalars['String']['input'];
  employeeId: Scalars['String']['input'];
  incurredOn: Scalars['DateTime']['input'];
  receiptUrl?: InputMaybe<Scalars['String']['input']>;
  status: ExpenseStatus;
};

export type ExpenseClaimPage = {
  __typename?: 'ExpenseClaimPage';
  rows: Array<ExpenseClaim>;
  totalCount: Scalars['Int']['output'];
};

export enum ExpenseState {
  Paid = 'PAID',
  Unpaid = 'UNPAID'
}

export enum ExpenseStatus {
  Approved = 'APPROVED',
  Paid = 'PAID',
  Rejected = 'REJECTED',
  Submitted = 'SUBMITTED'
}

export enum FilterOp {
  Contains = 'CONTAINS',
  Equals = 'EQUALS',
  Gt = 'GT',
  Lt = 'LT',
  StartsWith = 'STARTS_WITH'
}

/** One slice of spend, for the category breakdown. */
export type FinanceBucket = {
  __typename?: 'FinanceBucket';
  amount: Scalars['Float']['output'];
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
};

/** One month of the trend. Revenue and cost are accrual figures, not cash. */
export type FinanceMonth = {
  __typename?: 'FinanceMonth';
  cost: Scalars['Float']['output'];
  label: Scalars['String']['output'];
  /** YYYY-MM. */
  month: Scalars['String']['output'];
  profit: Scalars['Float']['output'];
  revenue: Scalars['Float']['output'];
};

export type Gig = {
  __typename?: 'Gig';
  applicationContact: Scalars['String']['output'];
  applicationType: Scalars['String']['output'];
  budget: Scalars['String']['output'];
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deadline?: Maybe<Scalars['DateTime']['output']>;
  deliverables: Array<Scalars['String']['output']>;
  duration: Scalars['String']['output'];
  fullDescription: Scalars['String']['output'];
  gigCode: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isUrgent: Scalars['Boolean']['output'];
  postedDate: Scalars['DateTime']['output'];
  requirements: Array<Scalars['String']['output']>;
  shortDescription: Scalars['String']['output'];
  status: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type GigInput = {
  applicationContact: Scalars['String']['input'];
  applicationType: Scalars['String']['input'];
  budget?: InputMaybe<Scalars['String']['input']>;
  category: Scalars['String']['input'];
  deadline?: InputMaybe<Scalars['DateTime']['input']>;
  deliverables?: InputMaybe<Array<Scalars['String']['input']>>;
  duration: Scalars['String']['input'];
  fullDescription?: InputMaybe<Scalars['String']['input']>;
  gigCode: Scalars['String']['input'];
  isUrgent?: InputMaybe<Scalars['Boolean']['input']>;
  postedDate?: InputMaybe<Scalars['DateTime']['input']>;
  requirements?: InputMaybe<Array<Scalars['String']['input']>>;
  shortDescription?: InputMaybe<Scalars['String']['input']>;
  status: Scalars['String']['input'];
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type GigPage = {
  __typename?: 'GigPage';
  rows: Array<Gig>;
  totalCount: Scalars['Int']['output'];
};

export type GithubConfig = {
  __typename?: 'GithubConfig';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  repo: Scalars['String']['output'];
  token: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type GithubConfigInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  owner: Scalars['String']['input'];
  repo: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type Goal = {
  __typename?: 'Goal';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  employeeId: Scalars['String']['output'];
  endDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  kpi: Scalars['String']['output'];
  managerComment?: Maybe<Scalars['String']['output']>;
  progress: Scalars['Int']['output'];
  startDate: Scalars['DateTime']['output'];
  status: GoalStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  weightage: Scalars['Int']['output'];
};

export type GoalInput = {
  description: Scalars['String']['input'];
  employeeId: Scalars['String']['input'];
  endDate: Scalars['DateTime']['input'];
  kpi: Scalars['String']['input'];
  managerComment?: InputMaybe<Scalars['String']['input']>;
  progress: Scalars['Int']['input'];
  startDate: Scalars['DateTime']['input'];
  status: GoalStatus;
  title: Scalars['String']['input'];
  weightage: Scalars['Int']['input'];
};

export type GoalPage = {
  __typename?: 'GoalPage';
  rows: Array<Goal>;
  totalCount: Scalars['Int']['output'];
};

export enum GoalStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Draft = 'DRAFT'
}

export type Grade = {
  __typename?: 'Grade';
  active: Scalars['Boolean']['output'];
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  level: Scalars['Int']['output'];
  maxSalary: Scalars['Float']['output'];
  minSalary: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type GradeInput = {
  active: Scalars['Boolean']['input'];
  code: Scalars['String']['input'];
  level: Scalars['Int']['input'];
  maxSalary: Scalars['Float']['input'];
  minSalary: Scalars['Float']['input'];
  name: Scalars['String']['input'];
};

export type GradePage = {
  __typename?: 'GradePage';
  rows: Array<Grade>;
  totalCount: Scalars['Int']['output'];
};

export type HeadcountPoint = {
  __typename?: 'HeadcountPoint';
  count: Scalars['Int']['output'];
  label: Scalars['String']['output'];
};

export type Holiday = {
  __typename?: 'Holiday';
  date: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: HolidayType;
};

export type HolidayInput = {
  date: Scalars['DateTime']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  type: HolidayType;
};

export type HolidayPage = {
  __typename?: 'HolidayPage';
  rows: Array<Holiday>;
  totalCount: Scalars['Int']['output'];
};

export enum HolidayType {
  Optional = 'OPTIONAL',
  Public = 'PUBLIC',
  Restricted = 'RESTRICTED'
}

export type HrDashboard = {
  __typename?: 'HrDashboard';
  activeEmployees: Scalars['Int']['output'];
  headcount: Array<HeadcountPoint>;
  onLeave: Scalars['Int']['output'];
  totalEmployees: Scalars['Int']['output'];
};

export type ImageConfig = {
  __typename?: 'ImageConfig';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  privateKey: Scalars['String']['output'];
  provider: Scalars['String']['output'];
  publicKey: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  urlEndpoint: Scalars['String']['output'];
};

export type ImageConfigInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  privateKey: Scalars['String']['input'];
  provider?: InputMaybe<Scalars['String']['input']>;
  publicKey: Scalars['String']['input'];
  urlEndpoint: Scalars['String']['input'];
};

export type InfrastructureOverview = {
  __typename?: 'InfrastructureOverview';
  database: DatabaseInfo;
  docker: DockerHost;
  runtime: ServerRuntime;
};

export type Invoice = {
  __typename?: 'Invoice';
  amount: Scalars['Float']['output'];
  /** Sum of the payments recorded against this invoice. */
  amountPaid: Scalars['Float']['output'];
  /** amount - amountPaid. What is still owed. */
  balanceDue: Scalars['Float']['output'];
  clientId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  dueDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  issuedDate: Scalars['DateTime']['output'];
  number: Scalars['String']['output'];
  status: InvoiceStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type InvoiceInput = {
  amount: Scalars['Float']['input'];
  clientId: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  dueDate: Scalars['DateTime']['input'];
  issuedDate: Scalars['DateTime']['input'];
  number: Scalars['String']['input'];
  status: InvoiceStatus;
};

export type InvoicePage = {
  __typename?: 'InvoicePage';
  rows: Array<Invoice>;
  totalCount: Scalars['Int']['output'];
};

export enum InvoiceStatus {
  Draft = 'DRAFT',
  Overdue = 'OVERDUE',
  Paid = 'PAID',
  Sent = 'SENT'
}

export type Job = {
  __typename?: 'Job';
  applicationDeadline?: Maybe<Scalars['DateTime']['output']>;
  benefits: Array<Scalars['String']['output']>;
  category: Scalars['String']['output'];
  companySlug: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  experienceLevel: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isFeatured: Scalars['Boolean']['output'];
  jobCode: Scalars['String']['output'];
  jobDescription: Scalars['String']['output'];
  jobPostDate: Scalars['DateTime']['output'];
  jobResponsibilities: Scalars['String']['output'];
  jobType: Scalars['String']['output'];
  location: Scalars['String']['output'];
  niceToHave: Array<Scalars['String']['output']>;
  requirements: Array<Scalars['String']['output']>;
  salaryRange: Scalars['String']['output'];
  shortJobDescription: Scalars['String']['output'];
  skillSet: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  workMode: Scalars['String']['output'];
};

export type JobCompany = {
  __typename?: 'JobCompany';
  benefits: Array<CompanyBenefit>;
  brandColor: Scalars['String']['output'];
  companyCode: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  culture: Scalars['String']['output'];
  description: Scalars['String']['output'];
  employees: Scalars['String']['output'];
  founded: Scalars['String']['output'];
  headquarters: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  industry: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  logo: Scalars['String']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  secondaryColor: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  socialLinks: CompanySocialLinks;
  tagline: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  website: Scalars['String']['output'];
};

export type JobCompanyInput = {
  benefits?: InputMaybe<Array<CompanyBenefitInput>>;
  brandColor?: InputMaybe<Scalars['String']['input']>;
  companyCode: Scalars['String']['input'];
  culture?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  employees?: InputMaybe<Scalars['String']['input']>;
  founded?: InputMaybe<Scalars['String']['input']>;
  headquarters?: InputMaybe<Scalars['String']['input']>;
  industry?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  logo?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  secondaryColor?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  socialLinks?: InputMaybe<CompanySocialLinksInput>;
  tagline?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type JobCompanyPage = {
  __typename?: 'JobCompanyPage';
  rows: Array<JobCompany>;
  totalCount: Scalars['Int']['output'];
};

export type JobInput = {
  applicationDeadline?: InputMaybe<Scalars['DateTime']['input']>;
  benefits?: InputMaybe<Array<Scalars['String']['input']>>;
  category: Scalars['String']['input'];
  companySlug: Scalars['String']['input'];
  experienceLevel: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isFeatured?: InputMaybe<Scalars['Boolean']['input']>;
  jobCode: Scalars['String']['input'];
  jobDescription?: InputMaybe<Scalars['String']['input']>;
  jobPostDate?: InputMaybe<Scalars['DateTime']['input']>;
  jobResponsibilities?: InputMaybe<Scalars['String']['input']>;
  jobType: Scalars['String']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  niceToHave?: InputMaybe<Array<Scalars['String']['input']>>;
  requirements?: InputMaybe<Array<Scalars['String']['input']>>;
  salaryRange?: InputMaybe<Scalars['String']['input']>;
  shortJobDescription?: InputMaybe<Scalars['String']['input']>;
  skillSet?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
  workMode: Scalars['String']['input'];
};

export type JobPage = {
  __typename?: 'JobPage';
  rows: Array<Job>;
  totalCount: Scalars['Int']['output'];
};

export type Lead = {
  __typename?: 'Lead';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  source: LeadSource;
  stage: LeadStage;
  updatedAt: Scalars['DateTime']['output'];
  value: Scalars['Float']['output'];
};

export type LeadInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  owner: Scalars['String']['input'];
  source: LeadSource;
  stage: LeadStage;
  value: Scalars['Float']['input'];
};

export type LeadPage = {
  __typename?: 'LeadPage';
  rows: Array<Lead>;
  totalCount: Scalars['Int']['output'];
};

export enum LeadSource {
  Ads = 'ADS',
  Event = 'EVENT',
  Referral = 'REFERRAL',
  Website = 'WEBSITE'
}

export enum LeadStage {
  Contacted = 'CONTACTED',
  Lost = 'LOST',
  New = 'NEW',
  Qualified = 'QUALIFIED',
  Won = 'WON'
}

export type LeaveBalance = {
  __typename?: 'LeaveBalance';
  adjustment: Scalars['Int']['output'];
  allocated: Scalars['Int']['output'];
  /** allocated + carriedForward + adjustment - used */
  available: Scalars['Int']['output'];
  carriedForward: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  employeeId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  leaveTypeCode: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  used: Scalars['Int']['output'];
  year: Scalars['Int']['output'];
};

export type LeaveBalanceInput = {
  adjustment: Scalars['Int']['input'];
  allocated: Scalars['Int']['input'];
  carriedForward: Scalars['Int']['input'];
  employeeId: Scalars['String']['input'];
  leaveTypeCode: Scalars['String']['input'];
  used: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};

export type LeaveBalancePage = {
  __typename?: 'LeaveBalancePage';
  rows: Array<LeaveBalance>;
  totalCount: Scalars['Int']['output'];
};

export type LeavePolicy = {
  __typename?: 'LeavePolicy';
  active: Scalars['Boolean']['output'];
  annualQuota: Scalars['Int']['output'];
  carryForwardCap: Scalars['Int']['output'];
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  halfDayAllowed: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  paid: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type LeavePolicyInput = {
  active: Scalars['Boolean']['input'];
  annualQuota: Scalars['Int']['input'];
  carryForwardCap: Scalars['Int']['input'];
  code: Scalars['String']['input'];
  halfDayAllowed: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  paid: Scalars['Boolean']['input'];
};

export type LeavePolicyPage = {
  __typename?: 'LeavePolicyPage';
  rows: Array<LeavePolicy>;
  totalCount: Scalars['Int']['output'];
};

export type LeaveRequest = {
  __typename?: 'LeaveRequest';
  createdAt: Scalars['DateTime']['output'];
  employeeId: Scalars['String']['output'];
  fromDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  reason: Scalars['String']['output'];
  status: LeaveStatus;
  toDate: Scalars['DateTime']['output'];
  type: LeaveType;
  updatedAt: Scalars['DateTime']['output'];
};

export type LeaveRequestInput = {
  employeeId: Scalars['String']['input'];
  fromDate: Scalars['DateTime']['input'];
  reason: Scalars['String']['input'];
  status: LeaveStatus;
  toDate: Scalars['DateTime']['input'];
  type: LeaveType;
};

export enum LeaveStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export enum LeaveType {
  Casual = 'CASUAL',
  Earned = 'EARNED',
  Sick = 'SICK',
  Unpaid = 'UNPAID'
}

export type LegalDocument = {
  __typename?: 'LegalDocument';
  category: DocumentCategory;
  createdAt: Scalars['DateTime']['output'];
  fileUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  owner?: Maybe<Scalars['String']['output']>;
  status: DocumentStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type LegalDocumentInput = {
  category: DocumentCategory;
  fileUrl?: InputMaybe<Scalars['String']['input']>;
  owner?: InputMaybe<Scalars['String']['input']>;
  status: DocumentStatus;
  title: Scalars['String']['input'];
};

export type LegalDocumentPage = {
  __typename?: 'LegalDocumentPage';
  rows: Array<LegalDocument>;
  totalCount: Scalars['Int']['output'];
};

/** A software subscription IT pays for: a pot of seats that renews on a date. */
export type Licence = {
  __typename?: 'Licence';
  /** Employees holding a seat. Its length is the seats used. */
  assigneeIds: Array<Scalars['String']['output']>;
  billingCycle: LicenceBillingCycle;
  cost: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  notes: Scalars['String']['output'];
  renewalDate: Scalars['DateTime']['output'];
  seatsTotal: Scalars['Int']['output'];
  status: LicenceStatus;
  updatedAt: Scalars['DateTime']['output'];
  vendor: Scalars['String']['output'];
};

export enum LicenceBillingCycle {
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  Yearly = 'YEARLY'
}

export type LicenceInput = {
  assigneeIds?: InputMaybe<Array<Scalars['String']['input']>>;
  billingCycle: LicenceBillingCycle;
  cost: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  renewalDate: Scalars['DateTime']['input'];
  seatsTotal: Scalars['Int']['input'];
  status: LicenceStatus;
  vendor: Scalars['String']['input'];
};

export type LicencePage = {
  __typename?: 'LicencePage';
  rows: Array<Licence>;
  totalCount: Scalars['Int']['output'];
};

export enum LicenceStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED'
}

export type Location = {
  __typename?: 'Location';
  active: Scalars['Boolean']['output'];
  address: Scalars['String']['output'];
  city: Scalars['String']['output'];
  code: Scalars['String']['output'];
  country: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  state: Scalars['String']['output'];
  timezone: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

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

export type LocationPage = {
  __typename?: 'LocationPage';
  rows: Array<Location>;
  totalCount: Scalars['Int']['output'];
};

export type LoginPage = {
  __typename?: 'LoginPage';
  accentColor: Scalars['String']['output'];
  app: Scalars['String']['output'];
  backgroundImageUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  tagline: Scalars['String']['output'];
};

export type LoginPageInput = {
  accentColor: Scalars['String']['input'];
  app: Scalars['String']['input'];
  backgroundImageUrl: Scalars['String']['input'];
  name: Scalars['String']['input'];
  tagline: Scalars['String']['input'];
};

/** Employee-facing attendance entry — the server sets employeeId. */
export type MarkAttendanceInput = {
  date: Scalars['DateTime']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  status: AttendanceStatus;
};

/** Why a product's stock changed. */
export enum MovementReason {
  Count = 'COUNT',
  Issue = 'ISSUE',
  Receipt = 'RECEIPT',
  Return = 'RETURN',
  WriteOff = 'WRITE_OFF'
}

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  /**
   * Signs the version currently published. The signer's identity comes from their token, so
   * nobody can sign on somebody else's behalf; signedName is what they typed.
   */
  acknowledgePolicy: PolicyAcknowledgement;
  /** SUPPORT/ADMIN: reply on a ticket, or leave an internal note. */
  addSupportReply: SupportReply;
  addTaskComment: TaskComment;
  /** Self-service: apply for leave (status forced to PENDING). */
  applyLeave: LeaveRequest;
  archivePolicy: Policy;
  /** SUPPORT/ADMIN: hand a ticket to someone, or pass an empty id to unassign it. */
  assignSupportTicket: SupportTicket;
  changePassword: Scalars['Boolean']['output'];
  clearRolePermission: Scalars['Boolean']['output'];
  createActivity: Activity;
  createAiJob: AiJob;
  createAnnouncement: Announcement;
  createAsset: Asset;
  createAudienceList: AudienceList;
  createBenefit: Benefit;
  createBlogPost: BlogPost;
  createBug: Bug;
  createCampaign: Campaign;
  createCaseStudy: CaseStudy;
  createClient: Client;
  createColumn: BoardColumn;
  createCompany: Company;
  createCompanyExpense: CompanyExpense;
  createContact: Contact;
  createContract: Contract;
  createDeal: Deal;
  createDepartment: Department;
  createDocPage: DocPage;
  createEmailConfig: EmailConfig;
  createEmailFragment: EmailFragment;
  createEmailTemplate: EmailTemplate;
  createEmployeeDocument: EmployeeDocument;
  createEmployeeRequest: EmployeeRequest;
  createEmploymentType: EmploymentType;
  createExitRecord: ExitRecord;
  createExpenseClaim: ExpenseClaim;
  createGig: Gig;
  createGithubConfig: GithubConfig;
  createGoal: Goal;
  createGrade: Grade;
  createHoliday: Holiday;
  createImageConfig: ImageConfig;
  createInvoice: Invoice;
  createJob: Job;
  createJobCompany: JobCompany;
  createLead: Lead;
  createLeaveBalance: LeaveBalance;
  createLeavePolicy: LeavePolicy;
  createLeaveRequest: LeaveRequest;
  createLegalDocument: LegalDocument;
  createLicence: Licence;
  createLocation: Location;
  /**
   * Filed by the employee for themselves: id from the token, always SUBMITTED,
   * and the approved amount stays finance's to set.
   */
  createMyExpenseClaim: ExpenseClaim;
  /**
   * Raised by the employee for themselves — the employee id comes from the token,
   * and the status always starts PENDING.
   */
  createMyRequest: EmployeeRequest;
  createNavLink: NavLink;
  createOpenAiConfig: OpenAiConfig;
  createPerformanceReview: PerformanceReview;
  createPexelsConfig: PexelsConfig;
  createPolicy: Policy;
  createPosition: Position;
  createProblemReport: ProblemReport;
  createProduct: Product;
  createProject: Project;
  createPrompt: Prompt;
  createSalaryStructure: SalaryStructure;
  createShift: Shift;
  createSlackConfig: SlackConfig;
  createStatusMonitor: StatusMonitor;
  createSupplier: Supplier;
  /** Self-service: raise a support ticket (status forced to OPEN). */
  createSupportTicket: SupportTicket;
  createTask: Task;
  createTeam: Team;
  createTool: Tool;
  createToolCategory: ToolCategory;
  /**
   * Claims work done away from the computer. Always lands PENDING; it counts for nothing
   * until a reviewer approves it.
   */
  createTrackerManualEntry: TrackerManualEntry;
  createTraining: Training;
  /** Creates a user, emails a temporary password, and returns it once for copying. */
  createUser: UserCredentials;
  createWebsiteSubmission: WebsiteSubmission;
  deleteActivity: Scalars['Boolean']['output'];
  deleteAiJob: Scalars['Boolean']['output'];
  deleteAnnouncement: Scalars['Boolean']['output'];
  deleteAsset: Scalars['Boolean']['output'];
  deleteAudienceList: Scalars['Boolean']['output'];
  deleteBenefit: Scalars['Boolean']['output'];
  deleteBlogPost: Scalars['Boolean']['output'];
  deleteBug: Scalars['Boolean']['output'];
  deleteCampaign: Scalars['Boolean']['output'];
  deleteCaseStudy: Scalars['Boolean']['output'];
  deleteClient: Scalars['Boolean']['output'];
  deleteColumn: Scalars['Boolean']['output'];
  deleteCompany: Scalars['Boolean']['output'];
  deleteCompanyExpense: Scalars['Boolean']['output'];
  deleteContact: Scalars['Boolean']['output'];
  deleteContract: Scalars['Boolean']['output'];
  deleteDeal: Scalars['Boolean']['output'];
  deleteDepartment: Scalars['Boolean']['output'];
  /** Deletes the page and everything filed under it. */
  deleteDocPage: Scalars['Boolean']['output'];
  deleteEmailConfig: Scalars['Boolean']['output'];
  deleteEmailFragment: Scalars['Boolean']['output'];
  deleteEmailTemplate: Scalars['Boolean']['output'];
  deleteEmployeeDocument: Scalars['Boolean']['output'];
  deleteEmployeeRequest: Scalars['Boolean']['output'];
  deleteEmploymentType: Scalars['Boolean']['output'];
  deleteExitRecord: Scalars['Boolean']['output'];
  deleteExpenseClaim: Scalars['Boolean']['output'];
  deleteGig: Scalars['Boolean']['output'];
  deleteGithubConfig: Scalars['Boolean']['output'];
  deleteGoal: Scalars['Boolean']['output'];
  deleteGrade: Scalars['Boolean']['output'];
  deleteHoliday: Scalars['Boolean']['output'];
  deleteImageConfig: Scalars['Boolean']['output'];
  deleteInvoice: Scalars['Boolean']['output'];
  deleteJob: Scalars['Boolean']['output'];
  deleteJobCompany: Scalars['Boolean']['output'];
  deleteLead: Scalars['Boolean']['output'];
  deleteLeaveBalance: Scalars['Boolean']['output'];
  deleteLeavePolicy: Scalars['Boolean']['output'];
  deleteLeaveRequest: Scalars['Boolean']['output'];
  deleteLegalDocument: Scalars['Boolean']['output'];
  deleteLicence: Scalars['Boolean']['output'];
  deleteLocation: Scalars['Boolean']['output'];
  deleteNavLink: Scalars['Boolean']['output'];
  deleteOpenAiConfig: Scalars['Boolean']['output'];
  deletePerformanceReview: Scalars['Boolean']['output'];
  deletePexelsConfig: Scalars['Boolean']['output'];
  deletePolicy: Scalars['Boolean']['output'];
  deletePosition: Scalars['Boolean']['output'];
  deleteProblemReport: Scalars['Boolean']['output'];
  deleteProduct: Scalars['Boolean']['output'];
  deleteProject: Scalars['Boolean']['output'];
  deletePrompt: Scalars['Boolean']['output'];
  deleteSalaryStructure: Scalars['Boolean']['output'];
  deleteShift: Scalars['Boolean']['output'];
  deleteSlackConfig: Scalars['Boolean']['output'];
  deleteStatusMonitor: Scalars['Boolean']['output'];
  deleteSupplier: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  deleteTaskComment: Scalars['Boolean']['output'];
  deleteTeam: Scalars['Boolean']['output'];
  deleteTool: Scalars['Boolean']['output'];
  deleteToolCategory: Scalars['Boolean']['output'];
  deleteTraining: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  deleteWebsiteSubmission: Scalars['Boolean']['output'];
  grantTrackerAccess: TrackerAccess;
  importMediaFromUrl: Scalars['String']['output'];
  login: AuthPayload;
  markAllNotificationsRead: Scalars['Int']['output'];
  /** Self-service: mark today's (or a given day's) attendance — upserts per day. */
  markAttendance: Attendance;
  /** Settles a bill: records when the money left and moves it to PAID. */
  markExpensePaid: CompanyExpense;
  markNotificationRead: Scalars['Boolean']['output'];
  /** Marks every GENERATED slip of the month PAID. Returns how many changed. */
  markPayrollPaid: Scalars['Int']['output'];
  /** Re-files a page under a new parent (null for top level) at a given position. */
  moveDocPage: Scalars['Boolean']['output'];
  moveTask: Scalars['Boolean']['output'];
  /**
   * Publishes a policy. raiseVersion asks everybody who already signed to sign again,
   * which is what a change in wording means — leave it off for a typo fix.
   */
  publishPolicy: Policy;
  /** Records a receipt and moves the invoice's paid figure and status with it, in one step. */
  recordPayment: Payment;
  /** Records a movement and moves the product's stock with it, in one step. */
  recordStockMovement: StockMovement;
  renameColumn: BoardColumn;
  reorderColumns: Scalars['Boolean']['output'];
  /** Generates a new temporary password, emails it, and returns it once for copying. */
  resetUserPassword: Scalars['String']['output'];
  /**
   * Approves or rejects an off-computer claim (TRACKER role). A decision is final — an
   * entry that has already been decided is refused rather than flipped, so hours somebody
   * has been paid against cannot quietly leave a timesheet.
   */
  reviewTrackerManualEntry: TrackerManualEntry;
  revokeTrackerAccess: TrackerAccess;
  revokeTrackerDevice: TrackerDevice;
  /** Sends the job's prompt to OpenAI and stores the answer, the tokens and the timing. */
  runAiJob: AiJob;
  /**
   * Generates (or recomputes) every active employee's slip for the month from their
   * salary structure and approved unpaid leave. Idempotent: running it twice
   * recomputes GENERATED slips and never touches PAID ones.
   */
  runPayroll: PayrollRunResult;
  /** Runs a prompt-library entry as a new job, so the run keeps its own history. */
  runPrompt: AiJob;
  /**
   * Creates or replaces ONE employee's salary structure, keyed on the employee.
   *
   * An upsert, because employeeId is unique and the HR employee form saves compensation
   * alongside the rest of the record — it has no business knowing whether a structure
   * already exists, and guessing wrong would fail the save on a duplicate key.
   */
  saveEmployeeSalary: SalaryStructure;
  saveTrackerBuildSettings: TrackerBuildSettings;
  /**
   * Recovery for a portal with no administrator: mails a fresh password for the
   * configured admin account to that configured address. A no-op once any ADMIN
   * exists. Returns a message safe to show the caller.
   */
  sendAdminCredentials: Scalars['String']['output'];
  /** Emails the campaign's subject/body to every client in the audience list. */
  sendCampaign: CampaignSendResult;
  sendContract: Contract;
  /** HR broadcast to every active employee, one department, or a chosen list. */
  sendNotification: SendNotificationResult;
  /**
   * Emails every payslip of the month to its employee, PDF attached, right now.
   * Does not wait for the schedule and does not change it.
   */
  sendSalarySlips: PayrollDispatchResult;
  sendTestEmail: Scalars['Boolean']['output'];
  /** Sends the real thing to one address, and logs it like any other send. */
  sendTestEmailTemplate: Scalars['Boolean']['output'];
  sendTestSlackMessage: Scalars['Boolean']['output'];
  sendUserMail: Scalars['Boolean']['output'];
  /** Moves a deal to another pipeline stage — what a drag on the board does. */
  setDealStage: Deal;
  /** HR/ADMIN: approve or reject a leave request. */
  setLeaveStatus: LeaveRequest;
  /**
   * Sets exactly what a role may do in a module. An empty list blocks the role
   * from the module entirely; deleting the row (clearRolePermission) restores
   * the default of everything the role's module access allows.
   */
  setRolePermission: RolePermission;
  /** SUPPORT/ADMIN: move a ticket through its lifecycle. */
  setSupportTicketStatus: SupportTicket;
  setUserActive: User;
  setUserBlocked: User;
  signContract: Contract;
  /** Asks GitHub to build the chosen installers off the given branch. */
  startTrackerBuild: Scalars['Boolean']['output'];
  /** Public: filed from the status page's report form, triaged in the Tech portal. */
  submitProblemReport: ProblemReportReceipt;
  /**
   * The employee's own half of the appraisal. Allowed only while the cycle is
   * still OPEN, and it never touches the manager's assessment or the rating.
   */
  submitSelfAssessment: PerformanceReview;
  testGithubConnection: Scalars['Boolean']['output'];
  testImageUpload: Scalars['String']['output'];
  testOpenAiConnection: Scalars['Boolean']['output'];
  testPexelsConnection: Scalars['Boolean']['output'];
  /**
   * Accepts the disclosure. When the workspace has pointed the tracker at a Legal policy,
   * signedName is required and the acceptance is also recorded in Legal's versioned
   * signature ledger — so one press of "I agree" counts in Legal, HR and the tracker at once.
   */
  trackerAcceptConsent: Scalars['Boolean']['output'];
  /**
   * Desktop keep-alive, called on a timer for as long as the app is signed in.
   *
   * Does three things in one round-trip: records that this device is still online (the
   * portal's Devices console reads lastSeenAt), hands back the CURRENT portal state so a
   * running app adopts settings, consent and timezone changes without a restart, and fails
   * with an auth error the moment the device or the access grant is revoked.
   */
  trackerHeartbeat: TrackerMe;
  trackerLogin: TrackerLoginPayload;
  /** Marks the caller in for their current local day. Tracking cannot start until they have. */
  trackerMarkAttendance: TrackerWorkday;
  /** Sets the CALLER's own timezone. Must be a resolvable IANA zone name. */
  trackerSetTimezone: TrackerAccess;
  /**
   * Opens a tracking session. Refused until the employee has accepted the disclosure AND
   * marked their attendance for the day. An unknown or missing projectId books the time
   * against the house-wide Global Project rather than failing the start.
   */
  trackerStartSession: TrackerSession;
  trackerStopSession: TrackerSession;
  trackerSyncIntervals: Scalars['Int']['output'];
  trackerUploadScreenshot: TrackerScreenshot;
  triageWebsiteSubmission: WebsiteSubmission;
  updateActivity: Activity;
  updateAiJob: AiJob;
  updateAnnouncement: Announcement;
  updateAsset: Asset;
  updateAudienceList: AudienceList;
  updateBenefit: Benefit;
  updateBlogPost: BlogPost;
  updateBranding: Branding;
  updateBug: Bug;
  updateCampaign: Campaign;
  updateCaseStudy: CaseStudy;
  updateClient: Client;
  updateCompany: Company;
  updateCompanyExpense: CompanyExpense;
  updateContact: Contact;
  updateContract: Contract;
  updateDeal: Deal;
  updateDepartment: Department;
  updateDocPage: DocPage;
  updateEmailConfig: EmailConfig;
  updateEmailFragment: EmailFragment;
  updateEmailTemplate: EmailTemplate;
  updateEmployeeDocument: EmployeeDocument;
  updateEmployeeRequest: EmployeeRequest;
  updateEmploymentType: EmploymentType;
  updateExitRecord: ExitRecord;
  updateExpenseClaim: ExpenseClaim;
  updateGig: Gig;
  updateGithubConfig: GithubConfig;
  updateGoal: Goal;
  updateGrade: Grade;
  updateHoliday: Holiday;
  updateImageConfig: ImageConfig;
  updateInvoice: Invoice;
  updateJob: Job;
  updateJobCompany: JobCompany;
  updateLead: Lead;
  updateLeaveBalance: LeaveBalance;
  updateLeavePolicy: LeavePolicy;
  updateLeaveRequest: LeaveRequest;
  updateLegalDocument: LegalDocument;
  updateLicence: Licence;
  updateLocation: Location;
  /**
   * Employee self-update. Only progress moves; weightage, dates and the manager's
   * comment stay HR/manager-owned.
   */
  updateMyGoalProgress: Goal;
  /** The employee marking their own progress. Completing it stamps completedOn. */
  updateMyTrainingStatus: Training;
  updateNavLink: NavLink;
  updateOpenAiConfig: OpenAiConfig;
  /** Saves when payslip emails go out. Turning it off stops the scheduled run. */
  updatePayrollSchedule: PayrollSchedule;
  updatePerformanceReview: PerformanceReview;
  updatePexelsConfig: PexelsConfig;
  updatePolicy: Policy;
  updatePosition: Position;
  updateProblemReport: ProblemReport;
  updateProduct: Product;
  updateProfile: User;
  updateProject: Project;
  updatePrompt: Prompt;
  updateSalaryStructure: SalaryStructure;
  updateSettings: AppSettings;
  updateShift: Shift;
  updateSlackConfig: SlackConfig;
  updateStatusMonitor: StatusMonitor;
  updateSupplier: Supplier;
  updateTask: Task;
  updateTeam: Team;
  updateTool: Tool;
  updateToolCategory: ToolCategory;
  updateTrackerSettings: TrackerSettings;
  updateTraining: Training;
  updateUser: User;
  uploadAvatar: Scalars['String']['output'];
  uploadImage: Scalars['String']['output'];
  /** Withdraws one of the caller's OWN entries, and only while it is still pending. */
  withdrawTrackerManualEntry: Scalars['Boolean']['output'];
};


export type MutationAcknowledgePolicyArgs = {
  policyId: Scalars['ID']['input'];
  signedName: Scalars['String']['input'];
};


export type MutationAddSupportReplyArgs = {
  body: Scalars['String']['input'];
  internal: Scalars['Boolean']['input'];
  ticketId: Scalars['ID']['input'];
};


export type MutationAddTaskCommentArgs = {
  body: Scalars['String']['input'];
  taskId: Scalars['ID']['input'];
};


export type MutationApplyLeaveArgs = {
  input: ApplyLeaveInput;
};


export type MutationArchivePolicyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAssignSupportTicketArgs = {
  assigneeId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationClearRolePermissionArgs = {
  module: Scalars['String']['input'];
  role: Role;
};


export type MutationCreateActivityArgs = {
  input: ActivityInput;
};


export type MutationCreateAiJobArgs = {
  input: AiJobInput;
};


export type MutationCreateAnnouncementArgs = {
  input: AnnouncementInput;
};


export type MutationCreateAssetArgs = {
  input: AssetInput;
};


export type MutationCreateAudienceListArgs = {
  input: AudienceListInput;
};


export type MutationCreateBenefitArgs = {
  input: BenefitInput;
};


export type MutationCreateBlogPostArgs = {
  input: BlogPostInput;
};


export type MutationCreateBugArgs = {
  input: BugInput;
};


export type MutationCreateCampaignArgs = {
  input: CampaignInput;
};


export type MutationCreateCaseStudyArgs = {
  input: CaseStudyInput;
};


export type MutationCreateClientArgs = {
  input: ClientInput;
};


export type MutationCreateColumnArgs = {
  name: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};


export type MutationCreateCompanyArgs = {
  input: CompanyInput;
};


export type MutationCreateCompanyExpenseArgs = {
  input: CompanyExpenseInput;
};


export type MutationCreateContactArgs = {
  input: ContactInput;
};


export type MutationCreateContractArgs = {
  input: ContractInput;
};


export type MutationCreateDealArgs = {
  input: DealInput;
};


export type MutationCreateDepartmentArgs = {
  input: DepartmentInput;
};


export type MutationCreateDocPageArgs = {
  parentId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};


export type MutationCreateEmailConfigArgs = {
  input: EmailConfigInput;
};


export type MutationCreateEmailFragmentArgs = {
  input: EmailFragmentInput;
};


export type MutationCreateEmailTemplateArgs = {
  input: EmailTemplateInput;
};


export type MutationCreateEmployeeDocumentArgs = {
  input: EmployeeDocumentInput;
};


export type MutationCreateEmployeeRequestArgs = {
  input: EmployeeRequestInput;
};


export type MutationCreateEmploymentTypeArgs = {
  input: EmploymentTypeInput;
};


export type MutationCreateExitRecordArgs = {
  input: ExitRecordInput;
};


export type MutationCreateExpenseClaimArgs = {
  input: ExpenseClaimInput;
};


export type MutationCreateGigArgs = {
  input: GigInput;
};


export type MutationCreateGithubConfigArgs = {
  input: GithubConfigInput;
};


export type MutationCreateGoalArgs = {
  input: GoalInput;
};


export type MutationCreateGradeArgs = {
  input: GradeInput;
};


export type MutationCreateHolidayArgs = {
  input: HolidayInput;
};


export type MutationCreateImageConfigArgs = {
  input: ImageConfigInput;
};


export type MutationCreateInvoiceArgs = {
  input: InvoiceInput;
};


export type MutationCreateJobArgs = {
  input: JobInput;
};


export type MutationCreateJobCompanyArgs = {
  input: JobCompanyInput;
};


export type MutationCreateLeadArgs = {
  input: LeadInput;
};


export type MutationCreateLeaveBalanceArgs = {
  input: LeaveBalanceInput;
};


export type MutationCreateLeavePolicyArgs = {
  input: LeavePolicyInput;
};


export type MutationCreateLeaveRequestArgs = {
  input: LeaveRequestInput;
};


export type MutationCreateLegalDocumentArgs = {
  input: LegalDocumentInput;
};


export type MutationCreateLicenceArgs = {
  input: LicenceInput;
};


export type MutationCreateLocationArgs = {
  input: LocationInput;
};


export type MutationCreateMyExpenseClaimArgs = {
  input: MyExpenseClaimInput;
};


export type MutationCreateMyRequestArgs = {
  input: MyRequestInput;
};


export type MutationCreateNavLinkArgs = {
  input: NavLinkInput;
};


export type MutationCreateOpenAiConfigArgs = {
  input: OpenAiConfigInput;
};


export type MutationCreatePerformanceReviewArgs = {
  input: PerformanceReviewInput;
};


export type MutationCreatePexelsConfigArgs = {
  input: PexelsConfigInput;
};


export type MutationCreatePolicyArgs = {
  input: PolicyInput;
};


export type MutationCreatePositionArgs = {
  input: PositionInput;
};


export type MutationCreateProblemReportArgs = {
  input: ProblemReportInput;
};


export type MutationCreateProductArgs = {
  input: ProductInput;
};


export type MutationCreateProjectArgs = {
  input: ProjectInput;
};


export type MutationCreatePromptArgs = {
  input: PromptInput;
};


export type MutationCreateSalaryStructureArgs = {
  input: SalaryStructureInput;
};


export type MutationCreateShiftArgs = {
  input: ShiftInput;
};


export type MutationCreateSlackConfigArgs = {
  input: SlackConfigInput;
};


export type MutationCreateStatusMonitorArgs = {
  input: StatusMonitorInput;
};


export type MutationCreateSupplierArgs = {
  input: SupplierInput;
};


export type MutationCreateSupportTicketArgs = {
  input: SupportTicketInput;
};


export type MutationCreateTaskArgs = {
  columnId: Scalars['ID']['input'];
  input: TaskInput;
  projectId: Scalars['ID']['input'];
};


export type MutationCreateTeamArgs = {
  input: TeamInput;
};


export type MutationCreateToolArgs = {
  input: ToolInput;
};


export type MutationCreateToolCategoryArgs = {
  input: ToolCategoryInput;
};


export type MutationCreateTrackerManualEntryArgs = {
  input: TrackerManualEntryInput;
};


export type MutationCreateTrainingArgs = {
  input: TrainingInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationCreateWebsiteSubmissionArgs = {
  input: WebsiteSubmissionInput;
};


export type MutationDeleteActivityArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAiJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAnnouncementArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAssetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAudienceListArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteBenefitArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteBlogPostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteBugArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCampaignArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCaseStudyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteClientArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteColumnArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCompanyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCompanyExpenseArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteContactArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteContractArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDealArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDepartmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDocPageArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmailConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmailFragmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmailTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmployeeDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmployeeRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmploymentTypeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteExitRecordArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteExpenseClaimArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGithubConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGoalArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGradeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteHolidayArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteImageConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteInvoiceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteJobCompanyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLeadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLeaveBalanceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLeavePolicyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLeaveRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLegalDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLicenceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLocationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteNavLinkArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteOpenAiConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePerformanceReviewArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePexelsConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePolicyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePositionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProblemReportArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProductArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePromptArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSalaryStructureArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteShiftArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSlackConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteStatusMonitorArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSupplierArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaskCommentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTeamArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteToolArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteToolCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTrainingArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWebsiteSubmissionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationGrantTrackerAccessArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationImportMediaFromUrlArgs = {
  fileName: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationMarkAttendanceArgs = {
  input: MarkAttendanceInput;
};


export type MutationMarkExpensePaidArgs = {
  id: Scalars['ID']['input'];
  paidOn?: InputMaybe<Scalars['DateTime']['input']>;
};


export type MutationMarkNotificationReadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMarkPayrollPaidArgs = {
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};


export type MutationMoveDocPageArgs = {
  id: Scalars['ID']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  toIndex: Scalars['Int']['input'];
};


export type MutationMoveTaskArgs = {
  id: Scalars['ID']['input'];
  toColumnId: Scalars['ID']['input'];
  toIndex: Scalars['Int']['input'];
};


export type MutationPublishPolicyArgs = {
  id: Scalars['ID']['input'];
  raiseVersion?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationRecordPaymentArgs = {
  input: PaymentInput;
};


export type MutationRecordStockMovementArgs = {
  input: StockMovementInput;
};


export type MutationRenameColumnArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationReorderColumnsArgs = {
  columnIds: Array<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
};


export type MutationResetUserPasswordArgs = {
  id: Scalars['ID']['input'];
};


export type MutationReviewTrackerManualEntryArgs = {
  id: Scalars['ID']['input'];
  reviewNote?: InputMaybe<Scalars['String']['input']>;
  status: TrackerManualEntryStatus;
};


export type MutationRevokeTrackerAccessArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationRevokeTrackerDeviceArgs = {
  deviceId: Scalars['String']['input'];
};


export type MutationRunAiJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRunPayrollArgs = {
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};


export type MutationRunPromptArgs = {
  id: Scalars['ID']['input'];
  model: Scalars['String']['input'];
};


export type MutationSaveEmployeeSalaryArgs = {
  employeeId: Scalars['ID']['input'];
  input: EmployeeSalaryInput;
};


export type MutationSaveTrackerBuildSettingsArgs = {
  slackChannels: Array<Scalars['String']['input']>;
};


export type MutationSendCampaignArgs = {
  audienceListId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};


export type MutationSendContractArgs = {
  email: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSendNotificationArgs = {
  input: SendNotificationInput;
};


export type MutationSendSalarySlipsArgs = {
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};


export type MutationSendTestEmailArgs = {
  id: Scalars['ID']['input'];
  to: Scalars['String']['input'];
};


export type MutationSendTestEmailTemplateArgs = {
  key: Scalars['String']['input'];
  to: Scalars['String']['input'];
  variables?: InputMaybe<Array<EmailVariableInput>>;
};


export type MutationSendTestSlackMessageArgs = {
  channel: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationSendUserMailArgs = {
  id: Scalars['ID']['input'];
  input: SendMailInput;
};


export type MutationSetDealStageArgs = {
  id: Scalars['ID']['input'];
  stage: DealStage;
};


export type MutationSetLeaveStatusArgs = {
  id: Scalars['ID']['input'];
  status: LeaveStatus;
};


export type MutationSetRolePermissionArgs = {
  actions: Array<PermissionAction>;
  module: Scalars['String']['input'];
  role: Role;
};


export type MutationSetSupportTicketStatusArgs = {
  id: Scalars['ID']['input'];
  status: SupportStatus;
};


export type MutationSetUserActiveArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetUserBlockedArgs = {
  id: Scalars['ID']['input'];
  isBlocked: Scalars['Boolean']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSignContractArgs = {
  id: Scalars['ID']['input'];
  signedBy: Scalars['String']['input'];
};


export type MutationStartTrackerBuildArgs = {
  platforms: Array<TrackerPlatform>;
  ref: Scalars['String']['input'];
};


export type MutationSubmitProblemReportArgs = {
  input: SubmitProblemReportInput;
};


export type MutationSubmitSelfAssessmentArgs = {
  id: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};


export type MutationTestGithubConnectionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTestImageUploadArgs = {
  file: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationTestOpenAiConnectionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTestPexelsConnectionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTrackerAcceptConsentArgs = {
  signedName?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTrackerHeartbeatArgs = {
  device?: InputMaybe<TrackerDeviceInput>;
};


export type MutationTrackerLoginArgs = {
  device: TrackerDeviceInput;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationTrackerMarkAttendanceArgs = {
  note?: InputMaybe<Scalars['String']['input']>;
  status: AttendanceStatus;
};


export type MutationTrackerSetTimezoneArgs = {
  timezone: Scalars['String']['input'];
};


export type MutationTrackerStartSessionArgs = {
  projectId?: InputMaybe<Scalars['ID']['input']>;
  startedAt: Scalars['DateTime']['input'];
};


export type MutationTrackerStopSessionArgs = {
  endedAt: Scalars['DateTime']['input'];
  sessionId: Scalars['ID']['input'];
};


export type MutationTrackerSyncIntervalsArgs = {
  intervals: Array<TrackerIntervalInput>;
  sessionId: Scalars['ID']['input'];
};


export type MutationTrackerUploadScreenshotArgs = {
  input: TrackerScreenshotInput;
};


export type MutationTriageWebsiteSubmissionArgs = {
  id: Scalars['ID']['input'];
  input: WebsiteSubmissionTriageInput;
};


export type MutationUpdateActivityArgs = {
  id: Scalars['ID']['input'];
  input: ActivityInput;
};


export type MutationUpdateAiJobArgs = {
  id: Scalars['ID']['input'];
  input: AiJobInput;
};


export type MutationUpdateAnnouncementArgs = {
  id: Scalars['ID']['input'];
  input: AnnouncementInput;
};


export type MutationUpdateAssetArgs = {
  id: Scalars['ID']['input'];
  input: AssetInput;
};


export type MutationUpdateAudienceListArgs = {
  id: Scalars['ID']['input'];
  input: AudienceListInput;
};


export type MutationUpdateBenefitArgs = {
  id: Scalars['ID']['input'];
  input: BenefitInput;
};


export type MutationUpdateBlogPostArgs = {
  id: Scalars['ID']['input'];
  input: BlogPostInput;
};


export type MutationUpdateBrandingArgs = {
  input: BrandingInput;
};


export type MutationUpdateBugArgs = {
  id: Scalars['ID']['input'];
  input: BugInput;
};


export type MutationUpdateCampaignArgs = {
  id: Scalars['ID']['input'];
  input: CampaignInput;
};


export type MutationUpdateCaseStudyArgs = {
  id: Scalars['ID']['input'];
  input: CaseStudyInput;
};


export type MutationUpdateClientArgs = {
  id: Scalars['ID']['input'];
  input: ClientInput;
};


export type MutationUpdateCompanyArgs = {
  id: Scalars['ID']['input'];
  input: CompanyInput;
};


export type MutationUpdateCompanyExpenseArgs = {
  id: Scalars['ID']['input'];
  input: CompanyExpenseInput;
};


export type MutationUpdateContactArgs = {
  id: Scalars['ID']['input'];
  input: ContactInput;
};


export type MutationUpdateContractArgs = {
  id: Scalars['ID']['input'];
  input: ContractInput;
};


export type MutationUpdateDealArgs = {
  id: Scalars['ID']['input'];
  input: DealInput;
};


export type MutationUpdateDepartmentArgs = {
  id: Scalars['ID']['input'];
  input: DepartmentInput;
};


export type MutationUpdateDocPageArgs = {
  body?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateEmailConfigArgs = {
  id: Scalars['ID']['input'];
  input: EmailConfigInput;
};


export type MutationUpdateEmailFragmentArgs = {
  id: Scalars['ID']['input'];
  input: EmailFragmentInput;
};


export type MutationUpdateEmailTemplateArgs = {
  id: Scalars['ID']['input'];
  input: EmailTemplateInput;
};


export type MutationUpdateEmployeeDocumentArgs = {
  id: Scalars['ID']['input'];
  input: EmployeeDocumentInput;
};


export type MutationUpdateEmployeeRequestArgs = {
  id: Scalars['ID']['input'];
  input: EmployeeRequestInput;
};


export type MutationUpdateEmploymentTypeArgs = {
  id: Scalars['ID']['input'];
  input: EmploymentTypeInput;
};


export type MutationUpdateExitRecordArgs = {
  id: Scalars['ID']['input'];
  input: ExitRecordInput;
};


export type MutationUpdateExpenseClaimArgs = {
  id: Scalars['ID']['input'];
  input: ExpenseClaimInput;
};


export type MutationUpdateGigArgs = {
  id: Scalars['ID']['input'];
  input: GigInput;
};


export type MutationUpdateGithubConfigArgs = {
  id: Scalars['ID']['input'];
  input: GithubConfigInput;
};


export type MutationUpdateGoalArgs = {
  id: Scalars['ID']['input'];
  input: GoalInput;
};


export type MutationUpdateGradeArgs = {
  id: Scalars['ID']['input'];
  input: GradeInput;
};


export type MutationUpdateHolidayArgs = {
  id: Scalars['ID']['input'];
  input: HolidayInput;
};


export type MutationUpdateImageConfigArgs = {
  id: Scalars['ID']['input'];
  input: ImageConfigInput;
};


export type MutationUpdateInvoiceArgs = {
  id: Scalars['ID']['input'];
  input: InvoiceInput;
};


export type MutationUpdateJobArgs = {
  id: Scalars['ID']['input'];
  input: JobInput;
};


export type MutationUpdateJobCompanyArgs = {
  id: Scalars['ID']['input'];
  input: JobCompanyInput;
};


export type MutationUpdateLeadArgs = {
  id: Scalars['ID']['input'];
  input: LeadInput;
};


export type MutationUpdateLeaveBalanceArgs = {
  id: Scalars['ID']['input'];
  input: LeaveBalanceInput;
};


export type MutationUpdateLeavePolicyArgs = {
  id: Scalars['ID']['input'];
  input: LeavePolicyInput;
};


export type MutationUpdateLeaveRequestArgs = {
  id: Scalars['ID']['input'];
  input: LeaveRequestInput;
};


export type MutationUpdateLegalDocumentArgs = {
  id: Scalars['ID']['input'];
  input: LegalDocumentInput;
};


export type MutationUpdateLicenceArgs = {
  id: Scalars['ID']['input'];
  input: LicenceInput;
};


export type MutationUpdateLocationArgs = {
  id: Scalars['ID']['input'];
  input: LocationInput;
};


export type MutationUpdateMyGoalProgressArgs = {
  id: Scalars['ID']['input'];
  progress: Scalars['Int']['input'];
};


export type MutationUpdateMyTrainingStatusArgs = {
  id: Scalars['ID']['input'];
  status: TrainingStatus;
};


export type MutationUpdateNavLinkArgs = {
  id: Scalars['ID']['input'];
  input: NavLinkInput;
};


export type MutationUpdateOpenAiConfigArgs = {
  id: Scalars['ID']['input'];
  input: OpenAiConfigInput;
};


export type MutationUpdatePayrollScheduleArgs = {
  input: PayrollScheduleInput;
};


export type MutationUpdatePerformanceReviewArgs = {
  id: Scalars['ID']['input'];
  input: PerformanceReviewInput;
};


export type MutationUpdatePexelsConfigArgs = {
  id: Scalars['ID']['input'];
  input: PexelsConfigInput;
};


export type MutationUpdatePolicyArgs = {
  id: Scalars['ID']['input'];
  input: PolicyInput;
};


export type MutationUpdatePositionArgs = {
  id: Scalars['ID']['input'];
  input: PositionInput;
};


export type MutationUpdateProblemReportArgs = {
  id: Scalars['ID']['input'];
  input: ProblemReportInput;
};


export type MutationUpdateProductArgs = {
  id: Scalars['ID']['input'];
  input: ProductInput;
};


export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};


export type MutationUpdateProjectArgs = {
  id: Scalars['ID']['input'];
  input: ProjectInput;
};


export type MutationUpdatePromptArgs = {
  id: Scalars['ID']['input'];
  input: PromptInput;
};


export type MutationUpdateSalaryStructureArgs = {
  id: Scalars['ID']['input'];
  input: SalaryStructureInput;
};


export type MutationUpdateSettingsArgs = {
  input: UpdateSettingsInput;
};


export type MutationUpdateShiftArgs = {
  id: Scalars['ID']['input'];
  input: ShiftInput;
};


export type MutationUpdateSlackConfigArgs = {
  id: Scalars['ID']['input'];
  input: SlackConfigInput;
};


export type MutationUpdateStatusMonitorArgs = {
  id: Scalars['ID']['input'];
  input: StatusMonitorInput;
};


export type MutationUpdateSupplierArgs = {
  id: Scalars['ID']['input'];
  input: SupplierInput;
};


export type MutationUpdateTaskArgs = {
  id: Scalars['ID']['input'];
  input: TaskInput;
};


export type MutationUpdateTeamArgs = {
  id: Scalars['ID']['input'];
  input: TeamInput;
};


export type MutationUpdateToolArgs = {
  id: Scalars['ID']['input'];
  input: ToolInput;
};


export type MutationUpdateToolCategoryArgs = {
  id: Scalars['ID']['input'];
  input: ToolCategoryInput;
};


export type MutationUpdateTrackerSettingsArgs = {
  input: TrackerSettingsInput;
};


export type MutationUpdateTrainingArgs = {
  id: Scalars['ID']['input'];
  input: TrainingInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};


export type MutationUploadAvatarArgs = {
  file: Scalars['String']['input'];
};


export type MutationUploadImageArgs = {
  file: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
};


export type MutationWithdrawTrackerManualEntryArgs = {
  id: Scalars['ID']['input'];
};

export type MyExpenseClaimInput = {
  amount: Scalars['Float']['input'];
  category: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  description: Scalars['String']['input'];
  incurredOn: Scalars['DateTime']['input'];
  receiptUrl?: InputMaybe<Scalars['String']['input']>;
};

/**
 * A policy as a member of staff sees it: the wording, and whether THEY have signed the
 * version now in force.
 */
export type MyPolicy = {
  __typename?: 'MyPolicy';
  /** True only when this person has signed the version currently published. */
  acknowledged: Scalars['Boolean']['output'];
  acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  body: Scalars['String']['output'];
  effectiveDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  requiresAcknowledgement: Scalars['Boolean']['output'];
  slug: Scalars['String']['output'];
  summary: Scalars['String']['output'];
  title: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export type MyRequestInput = {
  details: Scalars['String']['input'];
  subject: Scalars['String']['input'];
  type: RequestType;
};

export type NavLink = {
  __typename?: 'NavLink';
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  href: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  keywords: Scalars['String']['output'];
  label: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type NavLinkInput = {
  category: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  href: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  keywords?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
};

export type Notification = {
  __typename?: 'Notification';
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  kind: NotificationKind;
  link?: Maybe<Scalars['String']['output']>;
  read: Scalars['Boolean']['output'];
  title: Scalars['String']['output'];
};

export enum NotificationAudience {
  All = 'ALL',
  Department = 'DEPARTMENT',
  Employees = 'EMPLOYEES'
}

export enum NotificationKind {
  Announcement = 'ANNOUNCEMENT',
  General = 'GENERAL',
  Goal = 'GOAL',
  Leave = 'LEAVE',
  Payroll = 'PAYROLL',
  Performance = 'PERFORMANCE',
  Request = 'REQUEST',
  Training = 'TRAINING'
}

/** The OpenAI credential the platform's AI features run on. */
export type OpenAiConfig = {
  __typename?: 'OpenAiConfig';
  apiKey: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** The model requests default to, e.g. gpt-4o-mini. */
  defaultModel: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type OpenAiConfigInput = {
  apiKey: Scalars['String']['input'];
  defaultModel: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

/** How an employee is paid. Decides which amounts on the salary structure mean anything. */
export enum PayType {
  Fixed = 'FIXED',
  Hourly = 'HOURLY',
  Other = 'OTHER',
  Stipend = 'STIPEND'
}

/** One receipt against one invoice. Negative for a refund. */
export type Payment = {
  __typename?: 'Payment';
  amount: Scalars['Float']['output'];
  clientId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  invoiceId: Scalars['ID']['output'];
  invoiceNumber: Scalars['String']['output'];
  method: PaymentMethod;
  notes: Scalars['String']['output'];
  receivedAt: Scalars['DateTime']['output'];
  recordedBy: Scalars['String']['output'];
  reference: Scalars['String']['output'];
};

export type PaymentInput = {
  amount: Scalars['Float']['input'];
  invoiceId: Scalars['ID']['input'];
  method: PaymentMethod;
  notes?: InputMaybe<Scalars['String']['input']>;
  receivedAt?: InputMaybe<Scalars['DateTime']['input']>;
  reference?: InputMaybe<Scalars['String']['input']>;
};

export enum PaymentMethod {
  BankTransfer = 'BANK_TRANSFER',
  Card = 'CARD',
  Cash = 'CASH',
  Cheque = 'CHEQUE',
  Other = 'OTHER',
  Upi = 'UPI'
}

export type PaymentPage = {
  __typename?: 'PaymentPage';
  rows: Array<Payment>;
  totalCount: Scalars['Int']['output'];
};

/** What one payslip email run did, per employee outcome. */
export type PayrollDispatchResult = {
  __typename?: 'PayrollDispatchResult';
  /** Employees whose payslip email was refused; the run carried on past each one. */
  failed: Scalars['Int']['output'];
  month: Scalars['Int']['output'];
  sent: Scalars['Int']['output'];
  /** Employees with no email address on file. */
  skipped: Scalars['Int']['output'];
  year: Scalars['Int']['output'];
};

/** What one payroll run did. */
export type PayrollRunResult = {
  __typename?: 'PayrollRunResult';
  /** Slips created for the first time. */
  generated: Scalars['Int']['output'];
  month: Scalars['Int']['output'];
  /** Employees skipped: no salary structure, inactive, or slip already PAID. */
  skipped: Scalars['Int']['output'];
  totalNet: Scalars['Float']['output'];
  /** Slips that already existed and were recomputed (only while still GENERATED). */
  updated: Scalars['Int']['output'];
  year: Scalars['Int']['output'];
};

/** When payslip emails go out, as HR configures them. */
export type PayrollSchedule = {
  __typename?: 'PayrollSchedule';
  /** Day of the month the run fires on. Capped at 28 so every month has it. */
  dayOfMonth: Scalars['Int']['output'];
  enabled: Scalars['Boolean']['output'];
  hour: Scalars['Int']['output'];
  lastFailed: Scalars['Int']['output'];
  lastRunAt?: Maybe<Scalars['DateTime']['output']>;
  /** The period the last run sent for, as YYYY-MM. Empty until the first run. */
  lastRunPeriod: Scalars['String']['output'];
  lastSent: Scalars['Int']['output'];
  lastSkipped: Scalars['Int']['output'];
  minute: Scalars['Int']['output'];
  /** Which month the run sends: PREVIOUS_MONTH or CURRENT_MONTH. */
  period: Scalars['String']['output'];
};

export type PayrollScheduleInput = {
  dayOfMonth: Scalars['Int']['input'];
  enabled: Scalars['Boolean']['input'];
  hour: Scalars['Int']['input'];
  minute: Scalars['Int']['input'];
  period: Scalars['String']['input'];
};

/** The month at a glance, for review before marking paid. */
export type PayrollSummary = {
  __typename?: 'PayrollSummary';
  month: Scalars['Int']['output'];
  paid: Scalars['Int']['output'];
  slips: Scalars['Int']['output'];
  totalDeductions: Scalars['Float']['output'];
  totalGross: Scalars['Float']['output'];
  totalNet: Scalars['Float']['output'];
  year: Scalars['Int']['output'];
};

export type PerformanceReview = {
  __typename?: 'PerformanceReview';
  actionPlan: Scalars['String']['output'];
  competencies: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  cycle: Scalars['String']['output'];
  employeeId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  managerAssessment: Scalars['String']['output'];
  rating?: Maybe<Scalars['String']['output']>;
  score?: Maybe<Scalars['Float']['output']>;
  selfAssessment: Scalars['String']['output'];
  status: ReviewStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type PerformanceReviewInput = {
  actionPlan: Scalars['String']['input'];
  competencies: Scalars['String']['input'];
  cycle: Scalars['String']['input'];
  employeeId: Scalars['String']['input'];
  managerAssessment: Scalars['String']['input'];
  rating?: InputMaybe<Scalars['String']['input']>;
  score?: InputMaybe<Scalars['Float']['input']>;
  selfAssessment: Scalars['String']['input'];
  status: ReviewStatus;
};

export type PerformanceReviewPage = {
  __typename?: 'PerformanceReviewPage';
  rows: Array<PerformanceReview>;
  totalCount: Scalars['Int']['output'];
};

export enum PermissionAction {
  Approve = 'APPROVE',
  Create = 'CREATE',
  Delete = 'DELETE',
  Edit = 'EDIT',
  Export = 'EXPORT',
  View = 'VIEW'
}

/** The Pexels API credential behind the shared upload dialog's stock tabs. */
export type PexelsConfig = {
  __typename?: 'PexelsConfig';
  apiKey: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type PexelsConfigInput = {
  apiKey: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

/** One Pexels result — a photo or a video — flattened to what the upload dialog renders. */
export type PexelsMedia = {
  __typename?: 'PexelsMedia';
  alt: Scalars['String']['output'];
  /** Photographer / videographer, credited under the grid as Pexels requires. */
  credit: Scalars['String']['output'];
  /** Seconds. Zero for photos. */
  duration: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  /** Still frame for the grid: the photo thumbnail, or the video's poster. */
  previewUrl: Scalars['String']['output'];
  /** The URL stored when the item is picked. */
  url: Scalars['String']['output'];
};

/**
 * The Pexels search filters the upload dialog exposes. Colour is photo-only; the duration
 * bounds (in seconds) are video-only. An omitted field means "any".
 */
export type PexelsSearchFilters = {
  /** A Pexels colour name, or a #rrggbb value. Photos only. */
  color?: InputMaybe<Scalars['String']['input']>;
  maxDuration?: InputMaybe<Scalars['Int']['input']>;
  /** Videos only, in seconds. */
  minDuration?: InputMaybe<Scalars['Int']['input']>;
  /** landscape | portrait | square */
  orientation?: InputMaybe<Scalars['String']['input']>;
  /** large | medium | small */
  size?: InputMaybe<Scalars['String']['input']>;
};

export type Policy = {
  __typename?: 'Policy';
  /** How many people have signed the CURRENT version. */
  acknowledgedCount: Scalars['Int']['output'];
  audience: PolicyAudience;
  body: Scalars['String']['output'];
  effectiveDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  owner: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  requiresAcknowledgement: Scalars['Boolean']['output'];
  /** URL segment the website renders this at. */
  slug: Scalars['String']['output'];
  status: PolicyStatus;
  summary: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  /** Raised whenever published wording changes. Signatures are recorded per version. */
  version: Scalars['Int']['output'];
};

/** One person's signature on one version of one policy. */
export type PolicyAcknowledgement = {
  __typename?: 'PolicyAcknowledgement';
  id: Scalars['ID']['output'];
  policyId: Scalars['ID']['output'];
  policyTitle: Scalars['String']['output'];
  signedAt: Scalars['DateTime']['output'];
  signedName: Scalars['String']['output'];
  userEmail: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
  userName: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export enum PolicyAudience {
  AllStaff = 'ALL_STAFF',
  HrOnly = 'HR_ONLY',
  Public = 'PUBLIC'
}

export type PolicyInput = {
  audience: PolicyAudience;
  body: Scalars['String']['input'];
  effectiveDate: Scalars['DateTime']['input'];
  owner?: InputMaybe<Scalars['String']['input']>;
  requiresAcknowledgement?: InputMaybe<Scalars['Boolean']['input']>;
  slug: Scalars['String']['input'];
  summary?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type PolicyPage = {
  __typename?: 'PolicyPage';
  rows: Array<Policy>;
  totalCount: Scalars['Int']['output'];
};

export enum PolicyStatus {
  Archived = 'ARCHIVED',
  Draft = 'DRAFT',
  Published = 'PUBLISHED'
}

export type Position = {
  __typename?: 'Position';
  createdAt: Scalars['DateTime']['output'];
  department: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type PositionInput = {
  department: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export enum ProblemCategory {
  Data = 'DATA',
  Login = 'LOGIN',
  Other = 'OTHER',
  Outage = 'OUTAGE',
  Slowness = 'SLOWNESS',
  Ui = 'UI'
}

export type ProblemReport = {
  __typename?: 'ProblemReport';
  assignee: Scalars['String']['output'];
  category: ProblemCategory;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  pageUrl: Scalars['String']['output'];
  reference: Scalars['String']['output'];
  reporterEmail: Scalars['String']['output'];
  reporterName: Scalars['String']['output'];
  resolutionNotes: Scalars['String']['output'];
  serviceKey: Scalars['String']['output'];
  serviceName: Scalars['String']['output'];
  severity: ProblemSeverity;
  status: ProblemStatus;
  subject: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

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

export type ProblemReportPage = {
  __typename?: 'ProblemReportPage';
  rows: Array<ProblemReport>;
  totalCount: Scalars['Int']['output'];
};

/** Only the reference comes back — a reporter never reads anyone else's report. */
export type ProblemReportReceipt = {
  __typename?: 'ProblemReportReceipt';
  reference: Scalars['String']['output'];
  submittedAt: Scalars['DateTime']['output'];
};

export enum ProblemSeverity {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export enum ProblemStatus {
  Closed = 'CLOSED',
  InProgress = 'IN_PROGRESS',
  New = 'NEW',
  Resolved = 'RESOLVED',
  Triaged = 'TRIAGED'
}

export type Product = {
  __typename?: 'Product';
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  sku: Scalars['String']['output'];
  status: ProductStatus;
  stock: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ProductInput = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  sku: Scalars['String']['input'];
  status: ProductStatus;
  stock: Scalars['Int']['input'];
};

export type ProductPage = {
  __typename?: 'ProductPage';
  rows: Array<Product>;
  totalCount: Scalars['Int']['output'];
};

export enum ProductStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Draft = 'DRAFT'
}

export type Project = {
  __typename?: 'Project';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  /** The prefix every ticket key carries, e.g. EXY in EXY-14. Derived from the name. */
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  startDate?: Maybe<Scalars['DateTime']['output']>;
  status: ProjectStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type ProjectBoard = {
  __typename?: 'ProjectBoard';
  columns: Array<BoardColumn>;
  tasks: Array<Task>;
};

export type ProjectInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  status: ProjectStatus;
};

/** Somebody a ticket can be assigned to. */
export type ProjectMember = {
  __typename?: 'ProjectMember';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type ProjectPage = {
  __typename?: 'ProjectPage';
  rows: Array<Project>;
  totalCount: Scalars['Int']['output'];
};

export enum ProjectStatus {
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  OnHold = 'ON_HOLD',
  Planning = 'PLANNING'
}

export type Prompt = {
  __typename?: 'Prompt';
  category: PromptCategory;
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  tags: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum PromptCategory {
  Analysis = 'ANALYSIS',
  Coding = 'CODING',
  General = 'GENERAL',
  Marketing = 'MARKETING',
  Support = 'SUPPORT',
  Writing = 'WRITING'
}

export type PromptInput = {
  category: PromptCategory;
  content: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type PromptPage = {
  __typename?: 'PromptPage';
  rows: Array<Prompt>;
  totalCount: Scalars['Int']['output'];
};

/** A published PUBLIC policy, for the website. No authentication. */
export type PublicPolicy = {
  __typename?: 'PublicPolicy';
  body: Scalars['String']['output'];
  effectiveDate: Scalars['DateTime']['output'];
  slug: Scalars['String']['output'];
  summary: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  /**
   * The employee-facing feed: everything published, not yet expired and aimed at
   * the caller (company-wide, their department, or them by name), pinned first
   * then newest. Readable by any signed-in user, unlike the HR CRUD above.
   */
  activeAnnouncements: Array<Announcement>;
  /** Leave types an employee can pick from when applying. */
  activeLeavePolicies: Array<LeavePolicy>;
  /** Read live from OpenAI with the active key, so the list is what the account can reach. */
  aiModels: AiModelOptions;
  appSettings: AppSettings;
  /** HR/ADMIN: a specific employee's attendance records. */
  attendanceByEmployee: Array<Attendance>;
  branding: Branding;
  /**
   * The company's finances between two dates. Both bounds are inclusive of the days they
   * fall on, as the caller sends them.
   */
  companyFinance: CompanyFinance;
  docPage: DocPage;
  /** One container in full, including a live CPU/memory sample (takes ~2s to measure). */
  dockerContainerDetail: DockerContainerDetail;
  /** Every container on the host, running or not. */
  dockerContainers: Array<DockerContainer>;
  /** Images on the host and what the engine's disk is spent on. */
  dockerStorage: DockerStorage;
  emailDashboard: EmailDashboard;
  /**
   * ONE employee's salary structure, looked up by the employee rather than by structure id.
   * Null until HR has set one up. This is what the employee record reads.
   */
  employeeSalary?: Maybe<SalaryStructure>;
  getActivity: Activity;
  getAiJob: AiJob;
  getAnnouncement: Announcement;
  getAsset: Asset;
  getAudienceList: AudienceList;
  getBenefit: Benefit;
  getBlogPost: BlogPost;
  getBug: Bug;
  getCampaign: Campaign;
  getCaseStudy: CaseStudy;
  getClient: Client;
  getCompany: Company;
  getCompanyExpense: CompanyExpense;
  getContact: Contact;
  getContract: Contract;
  getDeal: Deal;
  getDepartment: Department;
  getEmailFragment: EmailFragment;
  getEmailTemplate: EmailTemplate;
  getEmployeeDocument: EmployeeDocument;
  getEmployeeRequest: EmployeeRequest;
  getEmploymentType: EmploymentType;
  getExitRecord: ExitRecord;
  getExpenseClaim: ExpenseClaim;
  getGig: Gig;
  getGoal: Goal;
  getGrade: Grade;
  getHoliday: Holiday;
  getInvoice: Invoice;
  getJob: Job;
  getJobCompany: JobCompany;
  getLead: Lead;
  getLeaveBalance: LeaveBalance;
  getLeavePolicy: LeavePolicy;
  getLeaveRequest: LeaveRequest;
  getLegalDocument: LegalDocument;
  getLicence: Licence;
  getLocation: Location;
  getNavLink: NavLink;
  getPerformanceReview: PerformanceReview;
  getPolicy: Policy;
  getPosition: Position;
  getProblemReport: ProblemReport;
  getProduct: Product;
  getProject: Project;
  getPrompt: Prompt;
  getSalaryStructure: SalaryStructure;
  getShift: Shift;
  getStatusMonitor: StatusMonitor;
  getSupplier: Supplier;
  getTeam: Team;
  getTool: Tool;
  getToolCategory: ToolCategory;
  getTraining: Training;
  getUser: User;
  getWebsiteSubmission: WebsiteSubmission;
  /** HR/ADMIN: workforce counts + headcount-over-time series. */
  hrDashboard: HrDashboard;
  /** Host, this process and the database in one read — the Infrastructure overview. */
  infrastructureOverview: InfrastructureOverview;
  /** Payments against one invoice, newest first. */
  invoicePayments: Array<Payment>;
  /** HR/ADMIN: a specific employee's leave requests. */
  leaveRequestsByEmployee: Array<LeaveRequest>;
  listActivities: Array<Activity>;
  listActivitiesPaged: ActivityPage;
  listActivitiesStats: TableStats;
  listAiJobs: Array<AiJob>;
  listAiJobsPaged: AiJobPage;
  listAiJobsStats: TableStats;
  listAnnouncements: Array<Announcement>;
  listAnnouncementsPaged: AnnouncementPage;
  listAnnouncementsStats: TableStats;
  /** Employees an asset can be handed to. */
  listAssetAssignees: Array<AssetAssignee>;
  listAssets: Array<Asset>;
  listAssetsPaged: AssetPage;
  listAssetsStats: TableStats;
  /** HR/ADMIN: all attendance records. */
  listAttendance: Array<Attendance>;
  listAudienceLists: Array<AudienceList>;
  listAudienceListsPaged: AudienceListPage;
  listBenefits: Array<Benefit>;
  listBenefitsPaged: BenefitPage;
  listBenefitsStats: TableStats;
  listBlogPosts: Array<BlogPost>;
  listBlogPostsPaged: BlogPostPage;
  listBlogPostsStats: TableStats;
  listBugs: Array<Bug>;
  listBugsPaged: BugPage;
  listBugsStats: TableStats;
  /** Every recipient of a campaign's sends, newest first. */
  listCampaignSends: Array<CampaignSend>;
  listCampaigns: Array<Campaign>;
  listCampaignsPaged: CampaignPage;
  listCampaignsStats: TableStats;
  listCaseStudies: Array<CaseStudy>;
  listCaseStudiesPaged: CaseStudyPage;
  listCaseStudiesStats: TableStats;
  listClients: Array<Client>;
  listClientsPaged: ClientPage;
  listClientsStats: TableStats;
  listCompanies: Array<Company>;
  listCompaniesPaged: CompanyPage;
  listCompaniesStats: TableStats;
  listCompanyExpenses: Array<CompanyExpense>;
  listCompanyExpensesPaged: CompanyExpensePage;
  listCompanyExpensesStats: TableStats;
  listContacts: Array<Contact>;
  listContactsPaged: ContactPage;
  listContactsStats: TableStats;
  listContracts: Array<Contract>;
  listContractsPaged: ContractPage;
  listContractsStats: TableStats;
  listDeals: Array<Deal>;
  listDealsPaged: DealPage;
  listDealsStats: TableStats;
  /** HR/ADMIN: organizational departments. */
  listDepartments: Array<Department>;
  listEmailConfigs: Array<EmailConfig>;
  listEmailFragments: Array<EmailFragment>;
  listEmailFragmentsPaged: EmailFragmentPage;
  listEmailFragmentsStats: TableStats;
  listEmailLogsPaged: EmailLogPage;
  listEmailLogsStats: TableStats;
  listEmailTemplates: Array<EmailTemplate>;
  listEmailTemplatesPaged: EmailTemplatePage;
  listEmailTemplatesStats: TableStats;
  listEmployeeDocuments: Array<EmployeeDocument>;
  listEmployeeDocumentsPaged: EmployeeDocumentPage;
  listEmployeeDocumentsStats: TableStats;
  listEmployeeRequests: Array<EmployeeRequest>;
  listEmployeeRequestsPaged: EmployeeRequestPage;
  listEmployeeRequestsStats: TableStats;
  listEmploymentTypes: Array<EmploymentType>;
  listEmploymentTypesPaged: EmploymentTypePage;
  listEmploymentTypesStats: TableStats;
  listExitRecords: Array<ExitRecord>;
  listExitRecordsPaged: ExitRecordPage;
  listExitRecordsStats: TableStats;
  listExpenseClaims: Array<ExpenseClaim>;
  listExpenseClaimsPaged: ExpenseClaimPage;
  listExpenseClaimsStats: TableStats;
  listGigs: Array<Gig>;
  listGigsPaged: GigPage;
  listGigsStats: TableStats;
  listGithubConfigs: Array<GithubConfig>;
  listGoals: Array<Goal>;
  listGoalsPaged: GoalPage;
  listGoalsStats: TableStats;
  listGrades: Array<Grade>;
  listGradesPaged: GradePage;
  listGradesStats: TableStats;
  /** Company-wide holidays, readable by any authenticated employee. */
  listHolidays: Array<Holiday>;
  listHolidaysPaged: HolidayPage;
  listHolidaysStats: TableStats;
  listImageConfigs: Array<ImageConfig>;
  listInvoices: Array<Invoice>;
  listInvoicesPaged: InvoicePage;
  listInvoicesStats: TableStats;
  listJobCompanies: Array<JobCompany>;
  listJobCompaniesPaged: JobCompanyPage;
  listJobCompaniesStats: TableStats;
  listJobs: Array<Job>;
  listJobsPaged: JobPage;
  listJobsStats: TableStats;
  listLeads: Array<Lead>;
  listLeadsPaged: LeadPage;
  listLeadsStats: TableStats;
  listLeaveBalances: Array<LeaveBalance>;
  listLeaveBalancesPaged: LeaveBalancePage;
  listLeaveBalancesStats: TableStats;
  listLeavePolicies: Array<LeavePolicy>;
  listLeavePoliciesPaged: LeavePolicyPage;
  listLeavePoliciesStats: TableStats;
  listLeaveRequests: Array<LeaveRequest>;
  listLegalDocuments: Array<LegalDocument>;
  listLegalDocumentsPaged: LegalDocumentPage;
  listLegalDocumentsStats: TableStats;
  listLicences: Array<Licence>;
  listLicencesPaged: LicencePage;
  listLicencesStats: TableStats;
  listLocations: Array<Location>;
  listLocationsPaged: LocationPage;
  listLocationsStats: TableStats;
  listNavLinks: Array<NavLink>;
  listOpenAiConfigs: Array<OpenAiConfig>;
  listPayments: Array<Payment>;
  listPaymentsPaged: PaymentPage;
  listPaymentsStats: TableStats;
  listPerformanceReviews: Array<PerformanceReview>;
  listPerformanceReviewsPaged: PerformanceReviewPage;
  listPerformanceReviewsStats: TableStats;
  /** Every module that can be restricted, as registered by the server. */
  listPermissionModules: Array<Scalars['String']['output']>;
  listPexelsConfigs: Array<PexelsConfig>;
  listPolicies: Array<Policy>;
  listPoliciesPaged: PolicyPage;
  listPoliciesStats: TableStats;
  /** HR/ADMIN: job positions / designations. */
  listPositions: Array<Position>;
  listProblemReports: Array<ProblemReport>;
  listProblemReportsPaged: ProblemReportPage;
  listProblemReportsStats: TableStats;
  listProducts: Array<Product>;
  listProductsPaged: ProductPage;
  listProductsStats: TableStats;
  /** Who tickets can be assigned to: everyone who can open this module. */
  listProjectMembers: Array<ProjectMember>;
  listProjects: Array<Project>;
  listProjectsPaged: ProjectPage;
  listProjectsStats: TableStats;
  listPrompts: Array<Prompt>;
  listPromptsPaged: PromptPage;
  listPromptsStats: TableStats;
  /** Only restrictions that exist; a missing (role, module) pair means everything is allowed. */
  listRolePermissions: Array<RolePermission>;
  listSalarySlipsPaged: SalarySlipPage;
  listSalarySlipsStats: TableStats;
  listSalaryStructures: Array<SalaryStructure>;
  listSalaryStructuresPaged: SalaryStructurePage;
  listSalaryStructuresStats: TableStats;
  listShifts: Array<Shift>;
  listShiftsPaged: ShiftPage;
  listShiftsStats: TableStats;
  /** Every channel the active Slack bot token can see. */
  listSlackChannels: Array<SlackChannel>;
  listSlackConfigs: Array<SlackConfig>;
  listStatusMonitors: Array<StatusMonitor>;
  listStatusMonitorsPaged: StatusMonitorPage;
  listStatusMonitorsStats: TableStats;
  listStockMovements: Array<StockMovement>;
  listStockMovementsPaged: StockMovementPage;
  listStockMovementsStats: TableStats;
  listSuppliers: Array<Supplier>;
  listSuppliersPaged: SupplierPage;
  listSuppliersStats: TableStats;
  /** SUPPORT/ADMIN: who a ticket can be assigned to. */
  listSupportAgents: Array<SupportAgent>;
  /** SUPPORT/ADMIN: the whole thread on one ticket, internal notes included. */
  listSupportReplies: Array<SupportReply>;
  /** SUPPORT/ADMIN: every employee support ticket, newest first. */
  listSupportTickets: Array<SupportTicket>;
  listTeams: Array<Team>;
  listTeamsPaged: TeamPage;
  listTeamsStats: TableStats;
  listToolCategories: Array<ToolCategory>;
  listTools: Array<Tool>;
  listToolsPaged: ToolPage;
  listToolsStats: TableStats;
  listTrackerBuilds: Array<TrackerBuild>;
  listTrainings: Array<Training>;
  listTrainingsPaged: TrainingPage;
  listTrainingsStats: TableStats;
  listUsers: Array<User>;
  listUsersPaged: UserPage;
  listUsersStats: TableStats;
  listWebsiteSubmissions: Array<WebsiteSubmission>;
  me: User;
  /** Self-service: the signed-in user's own attendance records. */
  myAttendance: Array<Attendance>;
  myBenefits: Array<Benefit>;
  myDocuments: Array<EmployeeDocument>;
  /** The signed-in employee's own exit record, if one has been opened. */
  myExitRecord?: Maybe<ExitRecord>;
  myExpenseClaims: Array<ExpenseClaim>;
  myGoals: Array<Goal>;
  /** This employee's own balances for the current year. */
  myLeaveBalances: Array<LeaveBalance>;
  /** Self-service: the signed-in user's own leave requests. */
  myLeaveRequests: Array<LeaveRequest>;
  myNotifications: Array<Notification>;
  /** Self-service: the signed-in employee's salary structure (null if unset). */
  myPayroll?: Maybe<SalaryStructure>;
  myPerformanceReviews: Array<PerformanceReview>;
  /** Published policies this person is meant to see, with their own signature state. */
  myPolicies: Array<MyPolicy>;
  myPolicy?: Maybe<MyPolicy>;
  myRequests: Array<EmployeeRequest>;
  /** Self-service: the signed-in employee's monthly payslips. */
  mySalarySlips: Array<SalarySlip>;
  /** The signed-in employee's own support tickets. */
  mySupportTickets: Array<SupportTicket>;
  myTrackerAccess?: Maybe<TrackerAccess>;
  myTrackerCalendar: Array<TrackerDayBucket>;
  myTrackerDay: TrackerDay;
  /** The caller's own off-computer entries in a range, any status. */
  myTrackerManualEntries: Array<TrackerManualEntry>;
  /** The calling device's own employee, all-time. Device token, not a portal session. */
  myTrackerTotals: TrackerTotals;
  myTrainings: Array<Training>;
  myUnreadNotificationCount: Scalars['Int']['output'];
  /** The payslip email schedule. Created with its defaults on first read. */
  payrollSchedule: PayrollSchedule;
  payrollSummary: PayrollSummary;
  /** Who has signed a policy, newest first. */
  policyAcknowledgements: Array<PolicyAcknowledgement>;
  /** Renders a stored template with the values given, through the very code that sends it. */
  previewEmailTemplate: EmailPreview;
  projectBoard: ProjectBoard;
  /** Every page in a project's space, flat. The sidebar builds the tree from parentId. */
  projectDocPages: Array<DocPage>;
  /** Every ticket in a project, newest first — the list view behind the board. */
  projectTasks: Array<Task>;
  publicBlogPost?: Maybe<BlogPost>;
  publicBlogPosts: Array<BlogPost>;
  publicBranding: Branding;
  publicCaseStudies: Array<CaseStudy>;
  publicCaseStudy?: Maybe<CaseStudy>;
  publicGig?: Maybe<Gig>;
  publicGigs: Array<Gig>;
  publicJob?: Maybe<Job>;
  publicJobCompanies: Array<JobCompany>;
  publicJobCompany?: Maybe<JobCompany>;
  publicJobs: Array<Job>;
  publicNavLinks: Array<NavLink>;
  publicPolicies: Array<PublicPolicy>;
  publicPolicy?: Maybe<PublicPolicy>;
  publicTool?: Maybe<Tool>;
  publicToolCategories: Array<ToolCategory>;
  publicTools: Array<Tool>;
  receivables: Receivables;
  /**
   * One payslip as a PDF. An employee may download their own; HR and Finance may
   * download anyone's.
   */
  salarySlipPdf: SalarySlipDownload;
  /** Stock photos for the shared upload dialog. Any signed-in user may search. */
  searchPexelsPhotos: Array<PexelsMedia>;
  /** Stock videos for the shared upload dialog. Any signed-in user may search. */
  searchPexelsVideos: Array<PexelsMedia>;
  /** Public: no sign-in, this is what status.exyconn.com reads. */
  statusOverview: StatusOverview;
  /** The ticket's history, newest first. */
  taskActivity: Array<TaskActivity>;
  taskComments: Array<TaskComment>;
  trackerAccessList: Array<TrackerAccess>;
  /**
   * Billing for tracked time over a range. Active time only — idle minutes are time at a
   * desk, and the rate comes from the employee's HR salary structure, never from here.
   */
  trackerBilling: TrackerBilling;
  trackerBuildSettings: TrackerBuildSettings;
  trackerCalendar: Array<TrackerDayBucket>;
  trackerDay: TrackerDay;
  trackerDevices: Array<TrackerDevice>;
  /**
   * The latest desktop installers. Any signed-in employee may read it — the files
   * themselves live on a public GitHub release. Null until a release exists.
   */
  trackerLatestRelease?: Maybe<TrackerRelease>;
  /** One employee's off-computer entries in a range, any status (TRACKER role). */
  trackerManualEntries: Array<TrackerManualEntry>;
  trackerMe: TrackerMe;
  /** Every off-computer entry waiting on a decision, oldest first (TRACKER role). */
  trackerPendingManualEntries: Array<TrackerManualEntry>;
  /**
   * Projects time may be booked against, the house-wide one first. The desktop app gets
   * the same list inside trackerMe; this is the portal's way in, for the off-computer
   * time form. Any signed-in employee may read it — it is a list of project names.
   */
  trackerProjectOptions: Array<TrackerProject>;
  trackerSettings: TrackerSettings;
  trackerTotals: TrackerTotals;
};


export type QueryAttendanceByEmployeeArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryCompanyFinanceArgs = {
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
};


export type QueryDocPageArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDockerContainerDetailArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEmailDashboardArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEmployeeSalaryArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryGetActivityArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAiJobArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAnnouncementArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAssetArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAudienceListArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetBenefitArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetBlogPostArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetBugArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCampaignArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCaseStudyArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetClientArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCompanyArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCompanyExpenseArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetContactArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetContractArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetDealArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetDepartmentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetEmailFragmentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetEmailTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetEmployeeDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetEmployeeRequestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetEmploymentTypeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetExitRecordArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetExpenseClaimArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetGigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetGoalArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetGradeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetHolidayArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetInvoiceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetJobArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetJobCompanyArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetLeadArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetLeaveBalanceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetLeavePolicyArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetLeaveRequestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetLegalDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetLicenceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetLocationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetNavLinkArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPerformanceReviewArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPolicyArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPositionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetProblemReportArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetProductArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetProjectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPromptArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetSalaryStructureArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetShiftArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetStatusMonitorArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetSupplierArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetTeamArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetToolArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetToolCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetTrainingArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetWebsiteSubmissionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryInvoicePaymentsArgs = {
  invoiceId: Scalars['ID']['input'];
};


export type QueryLeaveRequestsByEmployeeArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryListActivitiesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListAiJobsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListAnnouncementsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListAssetsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListAudienceListsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListBenefitsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListBlogPostsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListBugsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListCampaignSendsArgs = {
  campaignId: Scalars['ID']['input'];
};


export type QueryListCampaignsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListCaseStudiesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListClientsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListCompaniesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListCompanyExpensesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListContactsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListContractsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListDealsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListEmailFragmentsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListEmailLogsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListEmailTemplatesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListEmployeeDocumentsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListEmployeeRequestsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListEmploymentTypesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListExitRecordsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListExpenseClaimsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListGigsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListGoalsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListGradesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListHolidaysPagedArgs = {
  input: TableQueryInput;
};


export type QueryListInvoicesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListJobCompaniesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListJobsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListLeadsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListLeaveBalancesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListLeavePoliciesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListLegalDocumentsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListLicencesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListLocationsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListPaymentsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListPerformanceReviewsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListPoliciesPagedArgs = {
  input: TableQueryInput;
};


export type QueryListProblemReportsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListProductsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListProjectsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListPromptsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListSalarySlipsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListSalaryStructuresPagedArgs = {
  input: TableQueryInput;
};


export type QueryListShiftsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListStatusMonitorsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListStockMovementsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListSuppliersPagedArgs = {
  input: TableQueryInput;
};


export type QueryListSupportRepliesArgs = {
  ticketId: Scalars['ID']['input'];
};


export type QueryListTeamsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListToolsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListTrainingsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListUsersPagedArgs = {
  input: TableQueryInput;
};


export type QueryMyPolicyArgs = {
  slug: Scalars['String']['input'];
};


export type QueryMyTrackerCalendarArgs = {
  from: Scalars['DateTime']['input'];
  timezone: Scalars['String']['input'];
  to: Scalars['DateTime']['input'];
};


export type QueryMyTrackerDayArgs = {
  end: Scalars['DateTime']['input'];
  start: Scalars['DateTime']['input'];
};


export type QueryMyTrackerManualEntriesArgs = {
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
};


export type QueryPayrollSummaryArgs = {
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};


export type QueryPolicyAcknowledgementsArgs = {
  policyId: Scalars['ID']['input'];
};


export type QueryPreviewEmailTemplateArgs = {
  key: Scalars['String']['input'];
  variables?: InputMaybe<Array<EmailVariableInput>>;
};


export type QueryProjectBoardArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryProjectDocPagesArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryProjectTasksArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryPublicBlogPostArgs = {
  slug: Scalars['String']['input'];
};


export type QueryPublicCaseStudyArgs = {
  slug: Scalars['String']['input'];
};


export type QueryPublicGigArgs = {
  gigCode: Scalars['String']['input'];
};


export type QueryPublicJobArgs = {
  jobCode: Scalars['String']['input'];
};


export type QueryPublicJobCompanyArgs = {
  slug: Scalars['String']['input'];
};


export type QueryPublicJobsArgs = {
  companySlug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPublicPolicyArgs = {
  slug: Scalars['String']['input'];
};


export type QueryPublicToolArgs = {
  toolCode: Scalars['String']['input'];
};


export type QueryPublicToolsArgs = {
  categorySlug?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySalarySlipPdfArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySearchPexelsPhotosArgs = {
  filters?: InputMaybe<PexelsSearchFilters>;
  page?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchPexelsVideosArgs = {
  filters?: InputMaybe<PexelsSearchFilters>;
  page?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QueryStatusOverviewArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTaskActivityArgs = {
  taskId: Scalars['ID']['input'];
};


export type QueryTaskCommentsArgs = {
  taskId: Scalars['ID']['input'];
};


export type QueryTrackerBillingArgs = {
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
};


export type QueryTrackerCalendarArgs = {
  from: Scalars['DateTime']['input'];
  timezone: Scalars['String']['input'];
  to: Scalars['DateTime']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryTrackerDayArgs = {
  end: Scalars['DateTime']['input'];
  start: Scalars['DateTime']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryTrackerDevicesArgs = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryTrackerManualEntriesArgs = {
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryTrackerTotalsArgs = {
  userId: Scalars['ID']['input'];
};

/** What is owed, and how late it is. */
export type Receivables = {
  __typename?: 'Receivables';
  buckets: Array<ReceivablesBucket>;
  invoices: Scalars['Int']['output'];
  /** Everything unpaid, whether or not it is late. */
  outstanding: Scalars['Float']['output'];
  /** The part of outstanding that is past its due date. */
  overdue: Scalars['Float']['output'];
};

/** One age band of unpaid invoice balances, counted from the due date. */
export type ReceivablesBucket = {
  __typename?: 'ReceivablesBucket';
  amount: Scalars['Float']['output'];
  /** CURRENT, D1_30, D31_60 or D60_PLUS. */
  band: Scalars['String']['output'];
  invoices: Scalars['Int']['output'];
  label: Scalars['String']['output'];
};

export enum RequestStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export enum RequestType {
  Document = 'DOCUMENT',
  Other = 'OTHER',
  ProfileChange = 'PROFILE_CHANGE',
  Regularization = 'REGULARIZATION',
  Reimbursement = 'REIMBURSEMENT',
  Travel = 'TRAVEL',
  Wfh = 'WFH'
}

export enum ReviewStatus {
  Closed = 'CLOSED',
  ManagerSubmitted = 'MANAGER_SUBMITTED',
  Open = 'OPEN',
  SelfSubmitted = 'SELF_SUBMITTED'
}

export enum Role {
  Admin = 'ADMIN',
  Ai = 'AI',
  Crm = 'CRM',
  Employee = 'EMPLOYEE',
  Finance = 'FINANCE',
  Hr = 'HR',
  It = 'IT',
  Legal = 'LEGAL',
  Marketing = 'MARKETING',
  Products = 'PRODUCTS',
  Projects = 'PROJECTS',
  Support = 'SUPPORT',
  Tech = 'TECH',
  Tracker = 'TRACKER',
  Website = 'WEBSITE'
}

export type RolePermission = {
  __typename?: 'RolePermission';
  actions: Array<PermissionAction>;
  id: Scalars['ID']['output'];
  module: Scalars['String']['output'];
  role: Role;
  updatedAt: Scalars['DateTime']['output'];
};

export type SalarySlip = {
  __typename?: 'SalarySlip';
  currency: Scalars['String']['output'];
  deductions: Scalars['Float']['output'];
  employeeId: Scalars['String']['output'];
  gross: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  issuedDate: Scalars['DateTime']['output'];
  month: Scalars['Int']['output'];
  net: Scalars['Float']['output'];
  status: SlipStatus;
  year: Scalars['Int']['output'];
};

/** A payslip PDF, base64 encoded so the browser can save it straight from the response. */
export type SalarySlipDownload = {
  __typename?: 'SalarySlipDownload';
  contentBase64: Scalars['String']['output'];
  contentType: Scalars['String']['output'];
  filename: Scalars['String']['output'];
};

export type SalarySlipPage = {
  __typename?: 'SalarySlipPage';
  rows: Array<SalarySlip>;
  totalCount: Scalars['Int']['output'];
};

/** The signed-in employee's salary structure. gross/net are derived server-side. */
export type SalaryStructure = {
  __typename?: 'SalaryStructure';
  allowances: Scalars['Float']['output'];
  /** FIXED only: the monthly components. Zero for every other pay type. */
  basic: Scalars['Float']['output'];
  /**
   * What an hour of this person's tracked time is BILLED at — always per hour, whatever they
   * are paid. This is the number the tracker's billing report multiplies hours by.
   */
  billingRate: Scalars['Float']['output'];
  currency: Scalars['String']['output'];
  deductions: Scalars['Float']['output'];
  effectiveFrom: Scalars['DateTime']['output'];
  employeeId: Scalars['String']['output'];
  /** Monthly gross for the pay type. Zero for HOURLY, which earns per tracked hour. */
  gross: Scalars['Float']['output'];
  hra: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  net: Scalars['Float']['output'];
  payType: PayType;
  /** What OTHER means for this person; empty for the named pay types. */
  payTypeNote?: Maybe<Scalars['String']['output']>;
  /**
   * The single amount the non-FIXED types are paid at: per HOUR for HOURLY, per MONTH for
   * STIPEND and OTHER. Ignored for FIXED, whose money is in the components above.
   */
  rate: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type SalaryStructureInput = {
  allowances: Scalars['Float']['input'];
  basic: Scalars['Float']['input'];
  /** Per hour, always — what the tracker bills this person's time at. */
  billingRate?: InputMaybe<Scalars['Float']['input']>;
  currency: Scalars['String']['input'];
  deductions: Scalars['Float']['input'];
  effectiveFrom: Scalars['DateTime']['input'];
  employeeId: Scalars['String']['input'];
  hra: Scalars['Float']['input'];
  payType?: InputMaybe<PayType>;
  payTypeNote?: InputMaybe<Scalars['String']['input']>;
  /** Per hour for HOURLY, per month for STIPEND and OTHER. Ignored by FIXED. */
  rate?: InputMaybe<Scalars['Float']['input']>;
};

export type SalaryStructurePage = {
  __typename?: 'SalaryStructurePage';
  rows: Array<SalaryStructure>;
  totalCount: Scalars['Int']['output'];
};

export type SendMailInput = {
  message: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

export type SendNotificationInput = {
  audience: NotificationAudience;
  body?: InputMaybe<Scalars['String']['input']>;
  /** Required when audience is DEPARTMENT. */
  department?: InputMaybe<Scalars['String']['input']>;
  /** Required when audience is EMPLOYEES. */
  employeeIds?: InputMaybe<Array<Scalars['String']['input']>>;
  kind: NotificationKind;
  /** In-portal path the notification opens, e.g. /me/announcements. */
  link?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type SendNotificationResult = {
  __typename?: 'SendNotificationResult';
  recipients: Scalars['Int']['output'];
};

/** The API process itself, as it sees the world from inside its own container. */
export type ServerRuntime = {
  __typename?: 'ServerRuntime';
  arch: Scalars['String']['output'];
  environment: Scalars['String']['output'];
  heapTotalBytes: Scalars['Float']['output'];
  heapUsedBytes: Scalars['Float']['output'];
  hostname: Scalars['String']['output'];
  load1: Scalars['Float']['output'];
  load5: Scalars['Float']['output'];
  load15: Scalars['Float']['output'];
  nodeVersion: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  processUptimeSeconds: Scalars['Int']['output'];
  rssBytes: Scalars['Float']['output'];
  startedAt: Scalars['DateTime']['output'];
};

export type Shift = {
  __typename?: 'Shift';
  active: Scalars['Boolean']['output'];
  breakMinutes: Scalars['Int']['output'];
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  endTime: Scalars['String']['output'];
  graceMinutes: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
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

export type ShiftPage = {
  __typename?: 'ShiftPage';
  rows: Array<Shift>;
  totalCount: Scalars['Int']['output'];
};

export type SlackChannel = {
  __typename?: 'SlackChannel';
  id: Scalars['String']['output'];
  isMember: Scalars['Boolean']['output'];
  isPrivate: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
};

export type SlackConfig = {
  __typename?: 'SlackConfig';
  botToken: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  defaultChannel: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type SlackConfigInput = {
  botToken: Scalars['String']['input'];
  defaultChannel: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

export enum SlipStatus {
  Generated = 'GENERATED',
  Paid = 'PAID'
}

export enum SortDir {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type StatBucket = {
  __typename?: 'StatBucket';
  count: Scalars['Int']['output'];
  value: Scalars['String']['output'];
};

export type StatFieldCounts = {
  __typename?: 'StatFieldCounts';
  buckets: Array<StatBucket>;
  field: Scalars['String']['output'];
};

export type StatFieldSum = {
  __typename?: 'StatFieldSum';
  field: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

export enum StatusCategory {
  Api = 'API',
  DesktopApp = 'DESKTOP_APP',
  Portal = 'PORTAL',
  Tool = 'TOOL',
  Website = 'WEBSITE'
}

/** One UTC day of a service's history. A day with checks: 0 was never measured. */
export type StatusDayPoint = {
  __typename?: 'StatusDayPoint';
  avgResponseMs: Scalars['Int']['output'];
  checks: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  failures: Scalars['Int']['output'];
  uptimePercent: Scalars['Float']['output'];
};

export type StatusIncident = {
  __typename?: 'StatusIncident';
  durationMinutes: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  reason: Scalars['String']['output'];
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  serviceKey: Scalars['String']['output'];
  serviceName: Scalars['String']['output'];
  startedAt: Scalars['DateTime']['output'];
  state: StatusState;
};

/** A monitored endpoint, maintained from Tech > Status Monitors. */
export type StatusMonitor = {
  __typename?: 'StatusMonitor';
  category: StatusCategory;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  lastCheckedAt?: Maybe<Scalars['DateTime']['output']>;
  lastError: Scalars['String']['output'];
  lastHttpStatus: Scalars['Int']['output'];
  lastResponseMs: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  state: StatusState;
  updatedAt: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
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

export type StatusMonitorPage = {
  __typename?: 'StatusMonitorPage';
  rows: Array<StatusMonitor>;
  totalCount: Scalars['Int']['output'];
};

/** Everything the public status page renders, resolved in a single read. */
export type StatusOverview = {
  __typename?: 'StatusOverview';
  avgResponseMs: Scalars['Int']['output'];
  checkIntervalMinutes: Scalars['Int']['output'];
  daily: Array<StatusDayPoint>;
  degraded: Scalars['Int']['output'];
  down: Scalars['Int']['output'];
  generatedAt: Scalars['DateTime']['output'];
  incidents: Array<StatusIncident>;
  operational: Scalars['Int']['output'];
  services: Array<StatusServiceSummary>;
  state: StatusState;
  total: Scalars['Int']['output'];
  uptime30d: Scalars['Float']['output'];
  uptimeToday: Scalars['Float']['output'];
};

export type StatusServiceSummary = {
  __typename?: 'StatusServiceSummary';
  category: StatusCategory;
  days: Array<StatusDayPoint>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  lastCheckedAt?: Maybe<Scalars['DateTime']['output']>;
  lastError: Scalars['String']['output'];
  name: Scalars['String']['output'];
  responseMs: Scalars['Int']['output'];
  state: StatusState;
  uptime30d: Scalars['Float']['output'];
  uptimeToday: Scalars['Float']['output'];
  url: Scalars['String']['output'];
};

export enum StatusState {
  Degraded = 'DEGRADED',
  Down = 'DOWN',
  Operational = 'OPERATIONAL',
  Unknown = 'UNKNOWN'
}

export type StockMovement = {
  __typename?: 'StockMovement';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  notes: Scalars['String']['output'];
  productId: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  /** Always positive; the reason decides the direction. */
  quantity: Scalars['Int']['output'];
  reason: MovementReason;
  recordedBy: Scalars['String']['output'];
  reference: Scalars['String']['output'];
  /** The stock level after this movement. */
  stockAfter: Scalars['Int']['output'];
  supplierId: Scalars['String']['output'];
  supplierName: Scalars['String']['output'];
};

export type StockMovementInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
  reason: MovementReason;
  reference?: InputMaybe<Scalars['String']['input']>;
  supplierId?: InputMaybe<Scalars['String']['input']>;
};

export type StockMovementPage = {
  __typename?: 'StockMovementPage';
  rows: Array<StockMovement>;
  totalCount: Scalars['Int']['output'];
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

export type Supplier = {
  __typename?: 'Supplier';
  code: Scalars['String']['output'];
  contactName: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  notes: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  status: SupplierStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type SupplierInput = {
  code: Scalars['String']['input'];
  contactName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  status: SupplierStatus;
};

export type SupplierPage = {
  __typename?: 'SupplierPage';
  rows: Array<Supplier>;
  totalCount: Scalars['Int']['output'];
};

export enum SupplierStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  OnHold = 'ON_HOLD'
}

/** Somebody the support team can hand a ticket to. */
export type SupportAgent = {
  __typename?: 'SupportAgent';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export enum SupportCategory {
  Facilities = 'FACILITIES',
  Hr = 'HR',
  It = 'IT',
  Other = 'OTHER',
  Payroll = 'PAYROLL'
}

export enum SupportPriority {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

/** One message on a ticket. Internal notes are hidden from the employee. */
export type SupportReply = {
  __typename?: 'SupportReply';
  authorId: Scalars['String']['output'];
  authorName: Scalars['String']['output'];
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  internal: Scalars['Boolean']['output'];
  ticketId: Scalars['String']['output'];
};

export enum SupportStatus {
  Closed = 'CLOSED',
  InProgress = 'IN_PROGRESS',
  Open = 'OPEN',
  Resolved = 'RESOLVED'
}

export type SupportTicket = {
  __typename?: 'SupportTicket';
  /** Support-team member who owns it. Empty until someone picks it up. */
  assigneeId: Scalars['String']['output'];
  assigneeName: Scalars['String']['output'];
  category: SupportCategory;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  employeeId: Scalars['String']['output'];
  /** Resolved display name of the employee — populated by the support console. */
  employeeName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  priority: SupportPriority;
  status: SupportStatus;
  subject: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Employee-facing support request — the server sets employeeId and OPEN status. */
export type SupportTicketInput = {
  category: SupportCategory;
  description: Scalars['String']['input'];
  priority: SupportPriority;
  subject: Scalars['String']['input'];
};

export type TableFilterInput = {
  field: Scalars['String']['input'];
  op: FilterOp;
  value: Scalars['String']['input'];
};

/** Server-side pagination/sort/filter/search request. `page` is zero-indexed. */
export type TableQueryInput = {
  filters?: InputMaybe<Array<TableFilterInput>>;
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<TableSortInput>;
};

export type TableSortInput = {
  dir: SortDir;
  field: Scalars['String']['input'];
};

export type TableStats = {
  __typename?: 'TableStats';
  counts: Array<StatFieldCounts>;
  sums: Array<StatFieldSum>;
  total: Scalars['Int']['output'];
};

/** One ticket on a project board. */
export type Task = {
  __typename?: 'Task';
  assigneeId: Scalars['String']['output'];
  assigneeName: Scalars['String']['output'];
  columnId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Rich text (HTML) written in the ticket editor. */
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  /** The ticket's human handle, e.g. EXY-14. Fixed for the life of the ticket. */
  key: Scalars['String']['output'];
  labels: Array<Scalars['String']['output']>;
  order: Scalars['Int']['output'];
  priority: TaskPriority;
  reporterName: Scalars['String']['output'];
  /** Estimate in points. Null means nobody has sized it, which is not the same as zero. */
  storyPoints?: Maybe<Scalars['Int']['output']>;
  title: Scalars['String']['output'];
  type: TaskType;
  updatedAt: Scalars['DateTime']['output'];
};

/** One recorded change to a ticket: who changed what, from what, to what. */
export type TaskActivity = {
  __typename?: 'TaskActivity';
  actorName: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** The field that changed: a ticket field name, or column, or created. */
  field: Scalars['String']['output'];
  fromValue: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  taskId: Scalars['ID']['output'];
  toValue: Scalars['String']['output'];
};

export type TaskComment = {
  __typename?: 'TaskComment';
  authorId: Scalars['String']['output'];
  authorName: Scalars['String']['output'];
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  taskId: Scalars['ID']['output'];
};

/** Everything a ticket carries that a person can edit. Only the title is required. */
export type TaskInput = {
  assigneeId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  labels?: InputMaybe<Array<Scalars['String']['input']>>;
  priority?: InputMaybe<TaskPriority>;
  storyPoints?: InputMaybe<Scalars['Int']['input']>;
  title: Scalars['String']['input'];
  type?: InputMaybe<TaskType>;
};

export enum TaskPriority {
  High = 'HIGH',
  Highest = 'HIGHEST',
  Low = 'LOW',
  Lowest = 'LOWEST',
  Medium = 'MEDIUM'
}

export enum TaskType {
  Bug = 'BUG',
  Epic = 'EPIC',
  Story = 'STORY',
  Task = 'TASK'
}

export type Team = {
  __typename?: 'Team';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  department: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  leadEmployeeId?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TeamInput = {
  active: Scalars['Boolean']['input'];
  department: Scalars['String']['input'];
  description: Scalars['String']['input'];
  leadEmployeeId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type TeamPage = {
  __typename?: 'TeamPage';
  rows: Array<Team>;
  totalCount: Scalars['Int']['output'];
};

export type Tool = {
  __typename?: 'Tool';
  categorySlug: Scalars['String']['output'];
  color: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  features: Array<Scalars['String']['output']>;
  icon: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isMVP: Scalars['Boolean']['output'];
  keywords: Array<Scalars['String']['output']>;
  longDescription: Scalars['String']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  pricing?: Maybe<ToolPricing>;
  seo: Scalars['JSON']['output'];
  toolCode: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
  useCases: Array<Scalars['String']['output']>;
};

export type ToolCategory = {
  __typename?: 'ToolCategory';
  category: Scalars['String']['output'];
  color: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  icon: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  order: Scalars['Int']['output'];
  seo: Scalars['JSON']['output'];
  slug: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ToolCategoryInput = {
  category: Scalars['String']['input'];
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  seo?: InputMaybe<Scalars['JSON']['input']>;
  slug: Scalars['String']['input'];
};

export type ToolInput = {
  categorySlug: Scalars['String']['input'];
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  features?: InputMaybe<Array<Scalars['String']['input']>>;
  icon?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isMVP?: InputMaybe<Scalars['Boolean']['input']>;
  keywords?: InputMaybe<Array<Scalars['String']['input']>>;
  longDescription?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  pricing?: InputMaybe<ToolPricingInput>;
  seo?: InputMaybe<Scalars['JSON']['input']>;
  toolCode: Scalars['String']['input'];
  url?: InputMaybe<Scalars['String']['input']>;
  useCases?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ToolPage = {
  __typename?: 'ToolPage';
  rows: Array<Tool>;
  totalCount: Scalars['Int']['output'];
};

export type ToolPricing = {
  __typename?: 'ToolPricing';
  alterationNote: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  features: Array<Scalars['String']['output']>;
  price: Scalars['Float']['output'];
};

export type ToolPricingInput = {
  alterationNote?: InputMaybe<Scalars['String']['input']>;
  currency: Scalars['String']['input'];
  features?: InputMaybe<Array<Scalars['String']['input']>>;
  price: Scalars['Float']['input'];
};

export type TrackerAccess = {
  __typename?: 'TrackerAccess';
  consentedAt?: Maybe<Scalars['DateTime']['output']>;
  grantedAt: Scalars['DateTime']['output'];
  grantedBy: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  revokedAt?: Maybe<Scalars['DateTime']['output']>;
  /**
   * The zone THIS employee picked in the desktop app.
   * An empty string means they never picked one.
   */
  timezone: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type TrackerAppUsage = {
  __typename?: 'TrackerAppUsage';
  appName: Scalars['String']['output'];
  durationMs: Scalars['Float']['output'];
};

/** Tracked time priced for a date range. Employees with no time in the range are omitted. */
export type TrackerBilling = {
  __typename?: 'TrackerBilling';
  currency: Scalars['String']['output'];
  from: Scalars['DateTime']['output'];
  rows: Array<TrackerBillingRow>;
  to: Scalars['DateTime']['output'];
  totalAmount: Scalars['Float']['output'];
  totalHours: Scalars['Float']['output'];
};

/** One employee's tracked time over a range, priced at the rate on their HR salary structure. */
export type TrackerBillingRow = {
  __typename?: 'TrackerBillingRow';
  /** Billable time: measured active time plus approved off-computer time. */
  activeMs: Scalars['Float']['output'];
  amount: Scalars['Float']['output'];
  /** Per hour, from the employee's salary structure in HR. Zero when HR has not set one. */
  billingRate: Scalars['Float']['output'];
  currency: Scalars['String']['output'];
  email: Scalars['String']['output'];
  /** activeMs as hours, to two places. */
  hours: Scalars['Float']['output'];
  /** The employee's user id — one row per employee, so this is the row's identity. */
  id: Scalars['ID']['output'];
  /** How much of activeMs was claimed off-computer rather than measured. */
  manualMs: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  payType: PayType;
  /** False when no rate is set — the amount is zero because nobody priced the work, not because the work was free. */
  rated: Scalars['Boolean']['output'];
};

/** One run of the tracker build workflow. */
export type TrackerBuild = {
  __typename?: 'TrackerBuild';
  branch: Scalars['String']['output'];
  /** success, failure, cancelled — null until the run completes. */
  conclusion?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  startedAt: Scalars['DateTime']['output'];
  /** queued, in_progress or completed. */
  status: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type TrackerBuildSettings = {
  __typename?: 'TrackerBuildSettings';
  slackChannels: Array<Scalars['String']['output']>;
};

/**
 * The Legal policy the workspace uses as its tracking disclosure, with THIS employee's
 * signature state on the version now published. Null when no policy is configured.
 */
export type TrackerConsentPolicy = {
  __typename?: 'TrackerConsentPolicy';
  /** True only when this person has signed the version currently published. */
  acknowledged: Scalars['Boolean']['output'];
  acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  body: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  requiresAcknowledgement: Scalars['Boolean']['output'];
  slug: Scalars['String']['output'];
  summary: Scalars['String']['output'];
  title: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export type TrackerDay = {
  __typename?: 'TrackerDay';
  appUsage: Array<TrackerAppUsage>;
  intervals: Array<TrackerInterval>;
  screenshots: Array<TrackerScreenshot>;
  sessions: Array<TrackerSession>;
};

export type TrackerDayBucket = {
  __typename?: 'TrackerDayBucket';
  activeMs: Scalars['Float']['output'];
  date: Scalars['String']['output'];
  idleMs: Scalars['Float']['output'];
  keyCount: Scalars['Int']['output'];
  /** Approved off-computer time on this day. Measured time and claimed time stay apart. */
  manualMs: Scalars['Float']['output'];
  mouseCount: Scalars['Int']['output'];
  sessions: Scalars['Int']['output'];
};

export type TrackerDevice = {
  __typename?: 'TrackerDevice';
  appVersion: Scalars['String']['output'];
  arch: Scalars['String']['output'];
  cpuCores: Scalars['Int']['output'];
  cpuModel: Scalars['String']['output'];
  deviceId: Scalars['String']['output'];
  hostname: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  issuedAt: Scalars['DateTime']['output'];
  lastSeenAt: Scalars['DateTime']['output'];
  locale: Scalars['String']['output'];
  machineId: Scalars['String']['output'];
  osName: Scalars['String']['output'];
  osVersion: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  revokedAt?: Maybe<Scalars['DateTime']['output']>;
  screenCount: Scalars['Int']['output'];
  screenResolution: Scalars['String']['output'];
  timezone: Scalars['String']['output'];
  totalMemoryMb: Scalars['Int']['output'];
  userId: Scalars['ID']['output'];
};

export type TrackerDeviceInput = {
  appVersion?: InputMaybe<Scalars['String']['input']>;
  arch?: InputMaybe<Scalars['String']['input']>;
  cpuCores?: InputMaybe<Scalars['Int']['input']>;
  cpuModel?: InputMaybe<Scalars['String']['input']>;
  deviceId: Scalars['String']['input'];
  hostname?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  machineId?: InputMaybe<Scalars['String']['input']>;
  osName?: InputMaybe<Scalars['String']['input']>;
  osVersion?: InputMaybe<Scalars['String']['input']>;
  platform: Scalars['String']['input'];
  screenCount?: InputMaybe<Scalars['Int']['input']>;
  screenResolution?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  totalMemoryMb?: InputMaybe<Scalars['Int']['input']>;
};

export type TrackerInterval = {
  __typename?: 'TrackerInterval';
  activeMs: Scalars['Float']['output'];
  activityPercent: Scalars['Int']['output'];
  endedAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  idleMs: Scalars['Float']['output'];
  keyCount: Scalars['Int']['output'];
  mouseCount: Scalars['Int']['output'];
  sessionId: Scalars['ID']['output'];
  startedAt: Scalars['DateTime']['output'];
};

export type TrackerIntervalInput = {
  activeMs: Scalars['Float']['input'];
  endedAt: Scalars['DateTime']['input'];
  idleMs: Scalars['Float']['input'];
  keyCount: Scalars['Int']['input'];
  mouseCount: Scalars['Int']['input'];
  startedAt: Scalars['DateTime']['input'];
  windows?: InputMaybe<Array<TrackerWindowUsageInput>>;
};

export type TrackerLoginPayload = {
  __typename?: 'TrackerLoginPayload';
  consentRequired: Scalars['Boolean']['output'];
  settings: TrackerSettings;
  token: Scalars['String']['output'];
  user: User;
};

/**
 * Work done away from the computer, claimed by the employee and signed off by a reviewer.
 *
 * Deliberately separate from a session: everything in a session was measured, this was
 * claimed. Only an APPROVED entry counts towards a calendar, a total or an invoice.
 */
export type TrackerManualEntry = {
  __typename?: 'TrackerManualEntry';
  createdAt: Scalars['DateTime']['output'];
  durationMs: Scalars['Float']['output'];
  endedAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** What the time was for. Always present — unexplained claimed time is not reviewable. */
  note: Scalars['String']['output'];
  projectId: Scalars['ID']['output'];
  /** The project's name as it was when the entry was filed. */
  projectName: Scalars['String']['output'];
  reviewNote: Scalars['String']['output'];
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy: Scalars['ID']['output'];
  startedAt: Scalars['DateTime']['output'];
  status: TrackerManualEntryStatus;
  userId: Scalars['ID']['output'];
  /** Employee's name, resolved for the review queue. Empty on an employee's own list. */
  userName: Scalars['String']['output'];
};

export type TrackerManualEntryInput = {
  endedAt: Scalars['DateTime']['input'];
  note: Scalars['String']['input'];
  /** Omit to book against the house-wide Global Project. */
  projectId?: InputMaybe<Scalars['ID']['input']>;
  startedAt: Scalars['DateTime']['input'];
};

export enum TrackerManualEntryStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export type TrackerMe = {
  __typename?: 'TrackerMe';
  consentPolicy?: Maybe<TrackerConsentPolicy>;
  consentRequired: Scalars['Boolean']['output'];
  /** Projects this employee may book time against, the house-wide one first. */
  projects: Array<TrackerProject>;
  settings: TrackerSettings;
  /**
   * The EFFECTIVE zone: the employee's own pick, else the admin default, else the zone this
   * device reported at sign-in, else UTC. Never empty.
   */
  timezone: Scalars['String']['output'];
  user: User;
  workProfile: TrackerWorkProfile;
  workday: TrackerWorkday;
};

/** The installers a build can produce. */
export enum TrackerPlatform {
  Linux = 'LINUX',
  Macos = 'MACOS',
  Windows = 'WINDOWS'
}

/** One project time may be booked against. */
export type TrackerProject = {
  __typename?: 'TrackerProject';
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** The newest published desktop tracker build, with its installers. */
export type TrackerRelease = {
  __typename?: 'TrackerRelease';
  assets: Array<TrackerReleaseAsset>;
  name: Scalars['String']['output'];
  /** Release notes, as Markdown. */
  notes: Scalars['String']['output'];
  publishedAt: Scalars['DateTime']['output'];
  tag: Scalars['String']['output'];
  url: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

/** One installer file published on a tracker release. */
export type TrackerReleaseAsset = {
  __typename?: 'TrackerReleaseAsset';
  downloadCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  /** One of: windows, macos, linux. */
  platform: Scalars['String']['output'];
  sizeBytes: Scalars['Float']['output'];
  /** Direct download URL on the public GitHub release. */
  url: Scalars['String']['output'];
};

export type TrackerScreenshot = {
  __typename?: 'TrackerScreenshot';
  /**
   * Activity level (0-100) of the interval this screenshot belongs to. 0 when the interval
   * it belongs to has not been synced yet — the app uploads shots from inside the interval.
   */
  activityPercent: Scalars['Int']['output'];
  blurred: Scalars['Boolean']['output'];
  capturedAt: Scalars['DateTime']['output'];
  displayId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  intervalStartedAt: Scalars['DateTime']['output'];
  sessionId: Scalars['ID']['output'];
};

export type TrackerScreenshotInput = {
  blurred?: InputMaybe<Scalars['Boolean']['input']>;
  capturedAt: Scalars['DateTime']['input'];
  displayId?: InputMaybe<Scalars['String']['input']>;
  image: Scalars['String']['input'];
  intervalStartedAt: Scalars['DateTime']['input'];
  sessionId: Scalars['ID']['input'];
};

export type TrackerSession = {
  __typename?: 'TrackerSession';
  activeMs: Scalars['Float']['output'];
  deviceId: Scalars['String']['output'];
  endedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  idleMs: Scalars['Float']['output'];
  keyCount: Scalars['Int']['output'];
  mouseCount: Scalars['Int']['output'];
  /** The project this run booked its time against. */
  projectId: Scalars['String']['output'];
  /** The project's name as it was when the session opened, so a rename cannot rewrite it. */
  projectName: Scalars['String']['output'];
  startedAt: Scalars['DateTime']['output'];
  status: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type TrackerSettings = {
  __typename?: 'TrackerSettings';
  /**
   * Start and stop tracking on a schedule rather than waiting for the employee to press
   * start. The consent gate still applies before the first session.
   */
  autoStartEnabled: Scalars['Boolean']['output'];
  /** Local hour (0-23) tracking starts, in the EMPLOYEE's own timezone. */
  autoStartHour: Scalars['Int']['output'];
  /** Local hour (0-23) tracking stops. At or before the start hour means it crosses midnight. */
  autoStopHour: Scalars['Int']['output'];
  blurScreenshots: Scalars['Boolean']['output'];
  /**
   * Slug of the Legal policy used as the disclosure instead of consentText. Empty means
   * no policy is chosen; the app then falls back to the text above.
   */
  consentPolicySlug: Scalars['String']['output'];
  consentText: Scalars['String']['output'];
  /** Email yesterday's tracked time to everyone holding the TRACKER role. */
  dailyDigestEnabled: Scalars['Boolean']['output'];
  /**
   * House default IANA zone (e.g. "Asia/Kolkata"), chosen by an admin.
   * An empty string means "no house default" — fall back to the device's own zone.
   */
  defaultTimezone: Scalars['String']['output'];
  /** Local hour (0-23) the digests go out at, read in the workspace's own timezone. */
  digestHour: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  idleThresholdSeconds: Scalars['Int']['output'];
  intervalMinutes: Scalars['Int']['output'];
  randomizeScreenshotTiming: Scalars['Boolean']['output'];
  screenshotMaxWidth: Scalars['Int']['output'];
  /**
   * 0-100. 100 means actual best quality: native resolution, encoded losslessly, no
   * downscale. Below 100 is a JPEG at that quality, downscaled to screenshotMaxWidth.
   */
  screenshotQuality: Scalars['Int']['output'];
  /**
   * Days a screenshot is kept before it is deleted from the portal AND from storage.
   * 0 keeps them indefinitely, which is the default — a workspace opts in to expiry.
   */
  screenshotRetentionDays: Scalars['Int']['output'];
  screenshotsPerInterval: Scalars['Int']['output'];
  syncIntervalMinutes: Scalars['Int']['output'];
  trackWindowTitles: Scalars['Boolean']['output'];
  /** One of: top-left, top-right, bottom-left, bottom-right. */
  webcamCorner: Scalars['String']['output'];
  /** Capture a webcam photo with each screenshot and composite it into a corner of the shot. */
  webcamEnabled: Scalars['Boolean']['output'];
  /** The same summary for the last seven days, sent on a Monday. */
  weeklyDigestEnabled: Scalars['Boolean']['output'];
};

export type TrackerSettingsInput = {
  autoStartEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  autoStartHour?: InputMaybe<Scalars['Int']['input']>;
  autoStopHour?: InputMaybe<Scalars['Int']['input']>;
  blurScreenshots?: InputMaybe<Scalars['Boolean']['input']>;
  consentPolicySlug?: InputMaybe<Scalars['String']['input']>;
  consentText?: InputMaybe<Scalars['String']['input']>;
  dailyDigestEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  defaultTimezone?: InputMaybe<Scalars['String']['input']>;
  digestHour?: InputMaybe<Scalars['Int']['input']>;
  idleThresholdSeconds?: InputMaybe<Scalars['Int']['input']>;
  intervalMinutes?: InputMaybe<Scalars['Int']['input']>;
  randomizeScreenshotTiming?: InputMaybe<Scalars['Boolean']['input']>;
  screenshotMaxWidth?: InputMaybe<Scalars['Int']['input']>;
  screenshotQuality?: InputMaybe<Scalars['Int']['input']>;
  screenshotRetentionDays?: InputMaybe<Scalars['Int']['input']>;
  screenshotsPerInterval?: InputMaybe<Scalars['Int']['input']>;
  syncIntervalMinutes?: InputMaybe<Scalars['Int']['input']>;
  trackWindowTitles?: InputMaybe<Scalars['Boolean']['input']>;
  webcamCorner?: InputMaybe<Scalars['String']['input']>;
  webcamEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  weeklyDigestEnabled?: InputMaybe<Scalars['Boolean']['input']>;
};

/** All-time tracker totals for one employee. */
export type TrackerTotals = {
  __typename?: 'TrackerTotals';
  /** Float, not Int: all-time milliseconds overflow a 32-bit Int. */
  activeMs: Scalars['Float']['output'];
  idleMs: Scalars['Float']['output'];
  /** All-time approved off-computer time, kept apart from the measured total. */
  manualMs: Scalars['Float']['output'];
  screenshots: Scalars['Int']['output'];
  sessions: Scalars['Int']['output'];
};

export type TrackerWindowUsageInput = {
  appName: Scalars['String']['input'];
  durationMs: Scalars['Float']['input'];
  windowTitle?: InputMaybe<Scalars['String']['input']>;
};

/**
 * What an employee is contracted to work: when, from where, and for how long a day. Set on
 * the employee record in HR; the tracker measures the day against it.
 */
export type TrackerWorkProfile = {
  __typename?: 'TrackerWorkProfile';
  /** The contracted day in milliseconds — the unit every tracker total is in. */
  targetMs: Scalars['Float']['output'];
  workHoursPerDay: Scalars['Int']['output'];
  workLocation: WorkLocation;
  workLocationNote: Scalars['String']['output'];
  workingTime: WorkingTime;
  /** What OTHER means for this person; empty for the named arrangements. */
  workingTimeNote: Scalars['String']['output'];
};

/**
 * The employee's CURRENT local day: what they are contracted to work, how much of it they
 * have worked, and whether they have marked themselves in.
 */
export type TrackerWorkday = {
  __typename?: 'TrackerWorkday';
  /** Active milliseconds recorded today. Idle time is excluded — this is time worked. */
  activeMs: Scalars['Float']['output'];
  /** Tracking cannot start until this is true. */
  attendanceMarked: Scalars['Boolean']['output'];
  attendanceNote?: Maybe<Scalars['String']['output']>;
  attendanceStatus?: Maybe<AttendanceStatus>;
  /** The employee's local calendar date, YYYY-MM-DD. */
  date: Scalars['String']['output'];
  /**
   * Approved off-computer milliseconds today. Separate from activeMs because that was
   * measured and this was claimed; a client adding them must say which is which.
   */
  manualMs: Scalars['Float']['output'];
  targetMs: Scalars['Float']['output'];
};

export type Training = {
  __typename?: 'Training';
  assignedOn: Scalars['DateTime']['output'];
  category: Scalars['String']['output'];
  certificateUrl?: Maybe<Scalars['String']['output']>;
  completedOn?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dueOn?: Maybe<Scalars['DateTime']['output']>;
  employeeId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  provider: Scalars['String']['output'];
  status: TrainingStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TrainingInput = {
  assignedOn: Scalars['DateTime']['input'];
  category: Scalars['String']['input'];
  certificateUrl?: InputMaybe<Scalars['String']['input']>;
  completedOn?: InputMaybe<Scalars['DateTime']['input']>;
  dueOn?: InputMaybe<Scalars['DateTime']['input']>;
  employeeId: Scalars['String']['input'];
  provider: Scalars['String']['input'];
  status: TrainingStatus;
  title: Scalars['String']['input'];
};

export type TrainingPage = {
  __typename?: 'TrainingPage';
  rows: Array<Training>;
  totalCount: Scalars['Int']['output'];
};

export enum TrainingStatus {
  Assigned = 'ASSIGNED',
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS'
}

export type UpdateProfileInput = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSettingsInput = {
  dateFormat?: InputMaybe<Scalars['String']['input']>;
  timeFormat?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  brief?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  department?: InputMaybe<Scalars['String']['input']>;
  designation?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  employmentStatus?: InputMaybe<EmploymentStatus>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  joinDate?: InputMaybe<Scalars['DateTime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  roles?: InputMaybe<Array<Role>>;
  workHoursPerDay?: InputMaybe<Scalars['Int']['input']>;
  workLocation?: InputMaybe<WorkLocation>;
  workLocationNote?: InputMaybe<Scalars['String']['input']>;
  workingTime?: InputMaybe<WorkingTime>;
  workingTimeNote?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  address?: Maybe<Scalars['String']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  blockReason?: Maybe<Scalars['String']['output']>;
  /** A few lines about the person, shown on their profile across the portals. */
  brief?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dateOfBirth?: Maybe<Scalars['DateTime']['output']>;
  department?: Maybe<Scalars['String']['output']>;
  designation?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  employmentStatus: EmploymentStatus;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isBlocked: Scalars['Boolean']['output'];
  joinDate?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  roles: Array<Role>;
  updatedAt: Scalars['DateTime']['output'];
  /**
   * The contracted working day, in hours. Every arrangement has one — flexible moves the
   * clock time, not the length of the day. Null on accounts that predate the field; readers
   * fall back to the house default of 8.
   */
  workHoursPerDay?: Maybe<Scalars['Int']['output']>;
  workLocation?: Maybe<WorkLocation>;
  workLocationNote?: Maybe<Scalars['String']['output']>;
  /** Nullable because accounts created before the working arrangement existed have none. */
  workingTime?: Maybe<WorkingTime>;
  workingTimeNote?: Maybe<Scalars['String']['output']>;
};

/** A newly-created user together with the one-time temporary password (also emailed). */
export type UserCredentials = {
  __typename?: 'UserCredentials';
  password: Scalars['String']['output'];
  user: User;
};

/** One page of users for the server-side Users grid. */
export type UserPage = {
  __typename?: 'UserPage';
  rows: Array<User>;
  totalCount: Scalars['Int']['output'];
};

export type WebsiteSubmission = {
  __typename?: 'WebsiteSubmission';
  createdAt: Scalars['DateTime']['output'];
  formType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  notes: Scalars['String']['output'];
  source: Scalars['String']['output'];
  status: Scalars['String']['output'];
  submissionData: Scalars['JSON']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type WebsiteSubmissionInput = {
  formType: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  submissionData: Scalars['JSON']['input'];
};

export type WebsiteSubmissionTriageInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  status: Scalars['String']['input'];
};

/** Where an employee is expected to work from. OTHER is described in workLocationNote. */
export enum WorkLocation {
  Home = 'HOME',
  Hybrid = 'HYBRID',
  Office = 'OFFICE',
  Other = 'OTHER'
}

/** When an employee is expected to work. OTHER is described in workingTimeNote. */
export enum WorkingTime {
  Fixed = 'FIXED',
  Flexible = 'FLEXIBLE',
  Other = 'OTHER'
}

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Activity: ResolverTypeWrapper<Activity>;
  ActivityInput: ActivityInput;
  ActivityPage: ResolverTypeWrapper<ActivityPage>;
  ActivitySubject: ActivitySubject;
  ActivityType: ActivityType;
  AiJob: ResolverTypeWrapper<AiJob>;
  AiJobInput: AiJobInput;
  AiJobPage: ResolverTypeWrapper<AiJobPage>;
  AiJobStatus: AiJobStatus;
  AiModelOptions: ResolverTypeWrapper<AiModelOptions>;
  Announcement: ResolverTypeWrapper<Announcement>;
  AnnouncementAudience: AnnouncementAudience;
  AnnouncementCategory: AnnouncementCategory;
  AnnouncementInput: AnnouncementInput;
  AnnouncementPage: ResolverTypeWrapper<AnnouncementPage>;
  AppSettings: ResolverTypeWrapper<AppSettings>;
  ApplyLeaveInput: ApplyLeaveInput;
  Asset: ResolverTypeWrapper<Asset>;
  AssetAssignee: ResolverTypeWrapper<AssetAssignee>;
  AssetCategory: AssetCategory;
  AssetInput: AssetInput;
  AssetPage: ResolverTypeWrapper<AssetPage>;
  AssetStatus: AssetStatus;
  Attendance: ResolverTypeWrapper<Attendance>;
  AttendanceStatus: AttendanceStatus;
  AudienceList: ResolverTypeWrapper<AudienceList>;
  AudienceListInput: AudienceListInput;
  AudienceListPage: ResolverTypeWrapper<AudienceListPage>;
  AuthPayload: ResolverTypeWrapper<AuthPayload>;
  Benefit: ResolverTypeWrapper<Benefit>;
  BenefitInput: BenefitInput;
  BenefitKind: BenefitKind;
  BenefitPage: ResolverTypeWrapper<BenefitPage>;
  BlogAuthor: ResolverTypeWrapper<BlogAuthor>;
  BlogAuthorInput: BlogAuthorInput;
  BlogPost: ResolverTypeWrapper<BlogPost>;
  BlogPostInput: BlogPostInput;
  BlogPostPage: ResolverTypeWrapper<BlogPostPage>;
  BoardColumn: ResolverTypeWrapper<BoardColumn>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Branding: ResolverTypeWrapper<Branding>;
  BrandingInput: BrandingInput;
  Bug: ResolverTypeWrapper<Bug>;
  BugInput: BugInput;
  BugPage: ResolverTypeWrapper<BugPage>;
  BugSeverity: BugSeverity;
  BugStatus: BugStatus;
  Campaign: ResolverTypeWrapper<Campaign>;
  CampaignChannel: CampaignChannel;
  CampaignInput: CampaignInput;
  CampaignPage: ResolverTypeWrapper<CampaignPage>;
  CampaignSend: ResolverTypeWrapper<CampaignSend>;
  CampaignSendResult: ResolverTypeWrapper<CampaignSendResult>;
  CampaignSendStatus: CampaignSendStatus;
  CampaignStatus: CampaignStatus;
  CaseStudy: ResolverTypeWrapper<CaseStudy>;
  CaseStudyInput: CaseStudyInput;
  CaseStudyPage: ResolverTypeWrapper<CaseStudyPage>;
  Client: ResolverTypeWrapper<Client>;
  ClientInput: ClientInput;
  ClientPage: ResolverTypeWrapper<ClientPage>;
  ClientStatus: ClientStatus;
  Company: ResolverTypeWrapper<Company>;
  CompanyBenefit: ResolverTypeWrapper<CompanyBenefit>;
  CompanyBenefitInput: CompanyBenefitInput;
  CompanyExpense: ResolverTypeWrapper<CompanyExpense>;
  CompanyExpenseInput: CompanyExpenseInput;
  CompanyExpensePage: ResolverTypeWrapper<CompanyExpensePage>;
  CompanyFinance: ResolverTypeWrapper<CompanyFinance>;
  CompanyInput: CompanyInput;
  CompanyPage: ResolverTypeWrapper<CompanyPage>;
  CompanySocialLinks: ResolverTypeWrapper<CompanySocialLinks>;
  CompanySocialLinksInput: CompanySocialLinksInput;
  CompanyStatus: CompanyStatus;
  Contact: ResolverTypeWrapper<Contact>;
  ContactInput: ContactInput;
  ContactPage: ResolverTypeWrapper<ContactPage>;
  ContactStatus: ContactStatus;
  ContainerMount: ResolverTypeWrapper<ContainerMount>;
  ContainerPort: ResolverTypeWrapper<ContainerPort>;
  Contract: ResolverTypeWrapper<Contract>;
  ContractInput: ContractInput;
  ContractPage: ResolverTypeWrapper<ContractPage>;
  ContractStatus: ContractStatus;
  ContractType: ContractType;
  CreateUserInput: CreateUserInput;
  DatabaseInfo: ResolverTypeWrapper<DatabaseInfo>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Deal: ResolverTypeWrapper<Deal>;
  DealInput: DealInput;
  DealPage: ResolverTypeWrapper<DealPage>;
  DealStage: DealStage;
  Department: ResolverTypeWrapper<Department>;
  DepartmentInput: DepartmentInput;
  DocPage: ResolverTypeWrapper<DocPage>;
  DockerContainer: ResolverTypeWrapper<DockerContainer>;
  DockerContainerDetail: ResolverTypeWrapper<DockerContainerDetail>;
  DockerDiskUsage: ResolverTypeWrapper<DockerDiskUsage>;
  DockerHost: ResolverTypeWrapper<DockerHost>;
  DockerImage: ResolverTypeWrapper<DockerImage>;
  DockerStorage: ResolverTypeWrapper<DockerStorage>;
  DocumentCategory: DocumentCategory;
  DocumentKind: DocumentKind;
  DocumentStatus: DocumentStatus;
  EmailConfig: ResolverTypeWrapper<EmailConfig>;
  EmailConfigInput: EmailConfigInput;
  EmailDashboard: ResolverTypeWrapper<EmailDashboard>;
  EmailDayCount: ResolverTypeWrapper<EmailDayCount>;
  EmailFragment: ResolverTypeWrapper<EmailFragment>;
  EmailFragmentInput: EmailFragmentInput;
  EmailFragmentPage: ResolverTypeWrapper<EmailFragmentPage>;
  EmailLog: ResolverTypeWrapper<EmailLog>;
  EmailLogPage: ResolverTypeWrapper<EmailLogPage>;
  EmailLogStatus: EmailLogStatus;
  EmailPreview: ResolverTypeWrapper<EmailPreview>;
  EmailTemplate: ResolverTypeWrapper<EmailTemplate>;
  EmailTemplateInput: EmailTemplateInput;
  EmailTemplatePage: ResolverTypeWrapper<EmailTemplatePage>;
  EmailTemplateUsage: ResolverTypeWrapper<EmailTemplateUsage>;
  EmailVariableInput: EmailVariableInput;
  EmployeeDocument: ResolverTypeWrapper<EmployeeDocument>;
  EmployeeDocumentInput: EmployeeDocumentInput;
  EmployeeDocumentPage: ResolverTypeWrapper<EmployeeDocumentPage>;
  EmployeeRequest: ResolverTypeWrapper<EmployeeRequest>;
  EmployeeRequestInput: EmployeeRequestInput;
  EmployeeRequestPage: ResolverTypeWrapper<EmployeeRequestPage>;
  EmployeeSalaryInput: EmployeeSalaryInput;
  EmploymentStatus: EmploymentStatus;
  EmploymentType: ResolverTypeWrapper<EmploymentType>;
  EmploymentTypeInput: EmploymentTypeInput;
  EmploymentTypePage: ResolverTypeWrapper<EmploymentTypePage>;
  ExitRecord: ResolverTypeWrapper<ExitRecord>;
  ExitRecordInput: ExitRecordInput;
  ExitRecordPage: ResolverTypeWrapper<ExitRecordPage>;
  ExitStage: ExitStage;
  ExpenseCategory: ExpenseCategory;
  ExpenseClaim: ResolverTypeWrapper<ExpenseClaim>;
  ExpenseClaimInput: ExpenseClaimInput;
  ExpenseClaimPage: ResolverTypeWrapper<ExpenseClaimPage>;
  ExpenseState: ExpenseState;
  ExpenseStatus: ExpenseStatus;
  FilterOp: FilterOp;
  FinanceBucket: ResolverTypeWrapper<FinanceBucket>;
  FinanceMonth: ResolverTypeWrapper<FinanceMonth>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Gig: ResolverTypeWrapper<Gig>;
  GigInput: GigInput;
  GigPage: ResolverTypeWrapper<GigPage>;
  GithubConfig: ResolverTypeWrapper<GithubConfig>;
  GithubConfigInput: GithubConfigInput;
  Goal: ResolverTypeWrapper<Goal>;
  GoalInput: GoalInput;
  GoalPage: ResolverTypeWrapper<GoalPage>;
  GoalStatus: GoalStatus;
  Grade: ResolverTypeWrapper<Grade>;
  GradeInput: GradeInput;
  GradePage: ResolverTypeWrapper<GradePage>;
  HeadcountPoint: ResolverTypeWrapper<HeadcountPoint>;
  Holiday: ResolverTypeWrapper<Holiday>;
  HolidayInput: HolidayInput;
  HolidayPage: ResolverTypeWrapper<HolidayPage>;
  HolidayType: HolidayType;
  HrDashboard: ResolverTypeWrapper<HrDashboard>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  ImageConfig: ResolverTypeWrapper<ImageConfig>;
  ImageConfigInput: ImageConfigInput;
  InfrastructureOverview: ResolverTypeWrapper<InfrastructureOverview>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Invoice: ResolverTypeWrapper<Invoice>;
  InvoiceInput: InvoiceInput;
  InvoicePage: ResolverTypeWrapper<InvoicePage>;
  InvoiceStatus: InvoiceStatus;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Job: ResolverTypeWrapper<Job>;
  JobCompany: ResolverTypeWrapper<JobCompany>;
  JobCompanyInput: JobCompanyInput;
  JobCompanyPage: ResolverTypeWrapper<JobCompanyPage>;
  JobInput: JobInput;
  JobPage: ResolverTypeWrapper<JobPage>;
  Lead: ResolverTypeWrapper<Lead>;
  LeadInput: LeadInput;
  LeadPage: ResolverTypeWrapper<LeadPage>;
  LeadSource: LeadSource;
  LeadStage: LeadStage;
  LeaveBalance: ResolverTypeWrapper<LeaveBalance>;
  LeaveBalanceInput: LeaveBalanceInput;
  LeaveBalancePage: ResolverTypeWrapper<LeaveBalancePage>;
  LeavePolicy: ResolverTypeWrapper<LeavePolicy>;
  LeavePolicyInput: LeavePolicyInput;
  LeavePolicyPage: ResolverTypeWrapper<LeavePolicyPage>;
  LeaveRequest: ResolverTypeWrapper<LeaveRequest>;
  LeaveRequestInput: LeaveRequestInput;
  LeaveStatus: LeaveStatus;
  LeaveType: LeaveType;
  LegalDocument: ResolverTypeWrapper<LegalDocument>;
  LegalDocumentInput: LegalDocumentInput;
  LegalDocumentPage: ResolverTypeWrapper<LegalDocumentPage>;
  Licence: ResolverTypeWrapper<Licence>;
  LicenceBillingCycle: LicenceBillingCycle;
  LicenceInput: LicenceInput;
  LicencePage: ResolverTypeWrapper<LicencePage>;
  LicenceStatus: LicenceStatus;
  Location: ResolverTypeWrapper<Location>;
  LocationInput: LocationInput;
  LocationPage: ResolverTypeWrapper<LocationPage>;
  LoginPage: ResolverTypeWrapper<LoginPage>;
  LoginPageInput: LoginPageInput;
  MarkAttendanceInput: MarkAttendanceInput;
  MovementReason: MovementReason;
  Mutation: ResolverTypeWrapper<{}>;
  MyExpenseClaimInput: MyExpenseClaimInput;
  MyPolicy: ResolverTypeWrapper<MyPolicy>;
  MyRequestInput: MyRequestInput;
  NavLink: ResolverTypeWrapper<NavLink>;
  NavLinkInput: NavLinkInput;
  Notification: ResolverTypeWrapper<Notification>;
  NotificationAudience: NotificationAudience;
  NotificationKind: NotificationKind;
  OpenAiConfig: ResolverTypeWrapper<OpenAiConfig>;
  OpenAiConfigInput: OpenAiConfigInput;
  PayType: PayType;
  Payment: ResolverTypeWrapper<Payment>;
  PaymentInput: PaymentInput;
  PaymentMethod: PaymentMethod;
  PaymentPage: ResolverTypeWrapper<PaymentPage>;
  PayrollDispatchResult: ResolverTypeWrapper<PayrollDispatchResult>;
  PayrollRunResult: ResolverTypeWrapper<PayrollRunResult>;
  PayrollSchedule: ResolverTypeWrapper<PayrollSchedule>;
  PayrollScheduleInput: PayrollScheduleInput;
  PayrollSummary: ResolverTypeWrapper<PayrollSummary>;
  PerformanceReview: ResolverTypeWrapper<PerformanceReview>;
  PerformanceReviewInput: PerformanceReviewInput;
  PerformanceReviewPage: ResolverTypeWrapper<PerformanceReviewPage>;
  PermissionAction: PermissionAction;
  PexelsConfig: ResolverTypeWrapper<PexelsConfig>;
  PexelsConfigInput: PexelsConfigInput;
  PexelsMedia: ResolverTypeWrapper<PexelsMedia>;
  PexelsSearchFilters: PexelsSearchFilters;
  Policy: ResolverTypeWrapper<Policy>;
  PolicyAcknowledgement: ResolverTypeWrapper<PolicyAcknowledgement>;
  PolicyAudience: PolicyAudience;
  PolicyInput: PolicyInput;
  PolicyPage: ResolverTypeWrapper<PolicyPage>;
  PolicyStatus: PolicyStatus;
  Position: ResolverTypeWrapper<Position>;
  PositionInput: PositionInput;
  ProblemCategory: ProblemCategory;
  ProblemReport: ResolverTypeWrapper<ProblemReport>;
  ProblemReportInput: ProblemReportInput;
  ProblemReportPage: ResolverTypeWrapper<ProblemReportPage>;
  ProblemReportReceipt: ResolverTypeWrapper<ProblemReportReceipt>;
  ProblemSeverity: ProblemSeverity;
  ProblemStatus: ProblemStatus;
  Product: ResolverTypeWrapper<Product>;
  ProductInput: ProductInput;
  ProductPage: ResolverTypeWrapper<ProductPage>;
  ProductStatus: ProductStatus;
  Project: ResolverTypeWrapper<Project>;
  ProjectBoard: ResolverTypeWrapper<ProjectBoard>;
  ProjectInput: ProjectInput;
  ProjectMember: ResolverTypeWrapper<ProjectMember>;
  ProjectPage: ResolverTypeWrapper<ProjectPage>;
  ProjectStatus: ProjectStatus;
  Prompt: ResolverTypeWrapper<Prompt>;
  PromptCategory: PromptCategory;
  PromptInput: PromptInput;
  PromptPage: ResolverTypeWrapper<PromptPage>;
  PublicPolicy: ResolverTypeWrapper<PublicPolicy>;
  Query: ResolverTypeWrapper<{}>;
  Receivables: ResolverTypeWrapper<Receivables>;
  ReceivablesBucket: ResolverTypeWrapper<ReceivablesBucket>;
  RequestStatus: RequestStatus;
  RequestType: RequestType;
  ReviewStatus: ReviewStatus;
  Role: Role;
  RolePermission: ResolverTypeWrapper<RolePermission>;
  SalarySlip: ResolverTypeWrapper<SalarySlip>;
  SalarySlipDownload: ResolverTypeWrapper<SalarySlipDownload>;
  SalarySlipPage: ResolverTypeWrapper<SalarySlipPage>;
  SalaryStructure: ResolverTypeWrapper<SalaryStructure>;
  SalaryStructureInput: SalaryStructureInput;
  SalaryStructurePage: ResolverTypeWrapper<SalaryStructurePage>;
  SendMailInput: SendMailInput;
  SendNotificationInput: SendNotificationInput;
  SendNotificationResult: ResolverTypeWrapper<SendNotificationResult>;
  ServerRuntime: ResolverTypeWrapper<ServerRuntime>;
  Shift: ResolverTypeWrapper<Shift>;
  ShiftInput: ShiftInput;
  ShiftPage: ResolverTypeWrapper<ShiftPage>;
  SlackChannel: ResolverTypeWrapper<SlackChannel>;
  SlackConfig: ResolverTypeWrapper<SlackConfig>;
  SlackConfigInput: SlackConfigInput;
  SlipStatus: SlipStatus;
  SortDir: SortDir;
  StatBucket: ResolverTypeWrapper<StatBucket>;
  StatFieldCounts: ResolverTypeWrapper<StatFieldCounts>;
  StatFieldSum: ResolverTypeWrapper<StatFieldSum>;
  StatusCategory: StatusCategory;
  StatusDayPoint: ResolverTypeWrapper<StatusDayPoint>;
  StatusIncident: ResolverTypeWrapper<StatusIncident>;
  StatusMonitor: ResolverTypeWrapper<StatusMonitor>;
  StatusMonitorInput: StatusMonitorInput;
  StatusMonitorPage: ResolverTypeWrapper<StatusMonitorPage>;
  StatusOverview: ResolverTypeWrapper<StatusOverview>;
  StatusServiceSummary: ResolverTypeWrapper<StatusServiceSummary>;
  StatusState: StatusState;
  StockMovement: ResolverTypeWrapper<StockMovement>;
  StockMovementInput: StockMovementInput;
  StockMovementPage: ResolverTypeWrapper<StockMovementPage>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  SubmitProblemReportInput: SubmitProblemReportInput;
  Supplier: ResolverTypeWrapper<Supplier>;
  SupplierInput: SupplierInput;
  SupplierPage: ResolverTypeWrapper<SupplierPage>;
  SupplierStatus: SupplierStatus;
  SupportAgent: ResolverTypeWrapper<SupportAgent>;
  SupportCategory: SupportCategory;
  SupportPriority: SupportPriority;
  SupportReply: ResolverTypeWrapper<SupportReply>;
  SupportStatus: SupportStatus;
  SupportTicket: ResolverTypeWrapper<SupportTicket>;
  SupportTicketInput: SupportTicketInput;
  TableFilterInput: TableFilterInput;
  TableQueryInput: TableQueryInput;
  TableSortInput: TableSortInput;
  TableStats: ResolverTypeWrapper<TableStats>;
  Task: ResolverTypeWrapper<Task>;
  TaskActivity: ResolverTypeWrapper<TaskActivity>;
  TaskComment: ResolverTypeWrapper<TaskComment>;
  TaskInput: TaskInput;
  TaskPriority: TaskPriority;
  TaskType: TaskType;
  Team: ResolverTypeWrapper<Team>;
  TeamInput: TeamInput;
  TeamPage: ResolverTypeWrapper<TeamPage>;
  Tool: ResolverTypeWrapper<Tool>;
  ToolCategory: ResolverTypeWrapper<ToolCategory>;
  ToolCategoryInput: ToolCategoryInput;
  ToolInput: ToolInput;
  ToolPage: ResolverTypeWrapper<ToolPage>;
  ToolPricing: ResolverTypeWrapper<ToolPricing>;
  ToolPricingInput: ToolPricingInput;
  TrackerAccess: ResolverTypeWrapper<TrackerAccess>;
  TrackerAppUsage: ResolverTypeWrapper<TrackerAppUsage>;
  TrackerBilling: ResolverTypeWrapper<TrackerBilling>;
  TrackerBillingRow: ResolverTypeWrapper<TrackerBillingRow>;
  TrackerBuild: ResolverTypeWrapper<TrackerBuild>;
  TrackerBuildSettings: ResolverTypeWrapper<TrackerBuildSettings>;
  TrackerConsentPolicy: ResolverTypeWrapper<TrackerConsentPolicy>;
  TrackerDay: ResolverTypeWrapper<TrackerDay>;
  TrackerDayBucket: ResolverTypeWrapper<TrackerDayBucket>;
  TrackerDevice: ResolverTypeWrapper<TrackerDevice>;
  TrackerDeviceInput: TrackerDeviceInput;
  TrackerInterval: ResolverTypeWrapper<TrackerInterval>;
  TrackerIntervalInput: TrackerIntervalInput;
  TrackerLoginPayload: ResolverTypeWrapper<TrackerLoginPayload>;
  TrackerManualEntry: ResolverTypeWrapper<TrackerManualEntry>;
  TrackerManualEntryInput: TrackerManualEntryInput;
  TrackerManualEntryStatus: TrackerManualEntryStatus;
  TrackerMe: ResolverTypeWrapper<TrackerMe>;
  TrackerPlatform: TrackerPlatform;
  TrackerProject: ResolverTypeWrapper<TrackerProject>;
  TrackerRelease: ResolverTypeWrapper<TrackerRelease>;
  TrackerReleaseAsset: ResolverTypeWrapper<TrackerReleaseAsset>;
  TrackerScreenshot: ResolverTypeWrapper<TrackerScreenshot>;
  TrackerScreenshotInput: TrackerScreenshotInput;
  TrackerSession: ResolverTypeWrapper<TrackerSession>;
  TrackerSettings: ResolverTypeWrapper<TrackerSettings>;
  TrackerSettingsInput: TrackerSettingsInput;
  TrackerTotals: ResolverTypeWrapper<TrackerTotals>;
  TrackerWindowUsageInput: TrackerWindowUsageInput;
  TrackerWorkProfile: ResolverTypeWrapper<TrackerWorkProfile>;
  TrackerWorkday: ResolverTypeWrapper<TrackerWorkday>;
  Training: ResolverTypeWrapper<Training>;
  TrainingInput: TrainingInput;
  TrainingPage: ResolverTypeWrapper<TrainingPage>;
  TrainingStatus: TrainingStatus;
  UpdateProfileInput: UpdateProfileInput;
  UpdateSettingsInput: UpdateSettingsInput;
  UpdateUserInput: UpdateUserInput;
  User: ResolverTypeWrapper<User>;
  UserCredentials: ResolverTypeWrapper<UserCredentials>;
  UserPage: ResolverTypeWrapper<UserPage>;
  WebsiteSubmission: ResolverTypeWrapper<WebsiteSubmission>;
  WebsiteSubmissionInput: WebsiteSubmissionInput;
  WebsiteSubmissionTriageInput: WebsiteSubmissionTriageInput;
  WorkLocation: WorkLocation;
  WorkingTime: WorkingTime;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Activity: Activity;
  ActivityInput: ActivityInput;
  ActivityPage: ActivityPage;
  AiJob: AiJob;
  AiJobInput: AiJobInput;
  AiJobPage: AiJobPage;
  AiModelOptions: AiModelOptions;
  Announcement: Announcement;
  AnnouncementInput: AnnouncementInput;
  AnnouncementPage: AnnouncementPage;
  AppSettings: AppSettings;
  ApplyLeaveInput: ApplyLeaveInput;
  Asset: Asset;
  AssetAssignee: AssetAssignee;
  AssetInput: AssetInput;
  AssetPage: AssetPage;
  Attendance: Attendance;
  AudienceList: AudienceList;
  AudienceListInput: AudienceListInput;
  AudienceListPage: AudienceListPage;
  AuthPayload: AuthPayload;
  Benefit: Benefit;
  BenefitInput: BenefitInput;
  BenefitPage: BenefitPage;
  BlogAuthor: BlogAuthor;
  BlogAuthorInput: BlogAuthorInput;
  BlogPost: BlogPost;
  BlogPostInput: BlogPostInput;
  BlogPostPage: BlogPostPage;
  BoardColumn: BoardColumn;
  Boolean: Scalars['Boolean']['output'];
  Branding: Branding;
  BrandingInput: BrandingInput;
  Bug: Bug;
  BugInput: BugInput;
  BugPage: BugPage;
  Campaign: Campaign;
  CampaignInput: CampaignInput;
  CampaignPage: CampaignPage;
  CampaignSend: CampaignSend;
  CampaignSendResult: CampaignSendResult;
  CaseStudy: CaseStudy;
  CaseStudyInput: CaseStudyInput;
  CaseStudyPage: CaseStudyPage;
  Client: Client;
  ClientInput: ClientInput;
  ClientPage: ClientPage;
  Company: Company;
  CompanyBenefit: CompanyBenefit;
  CompanyBenefitInput: CompanyBenefitInput;
  CompanyExpense: CompanyExpense;
  CompanyExpenseInput: CompanyExpenseInput;
  CompanyExpensePage: CompanyExpensePage;
  CompanyFinance: CompanyFinance;
  CompanyInput: CompanyInput;
  CompanyPage: CompanyPage;
  CompanySocialLinks: CompanySocialLinks;
  CompanySocialLinksInput: CompanySocialLinksInput;
  Contact: Contact;
  ContactInput: ContactInput;
  ContactPage: ContactPage;
  ContainerMount: ContainerMount;
  ContainerPort: ContainerPort;
  Contract: Contract;
  ContractInput: ContractInput;
  ContractPage: ContractPage;
  CreateUserInput: CreateUserInput;
  DatabaseInfo: DatabaseInfo;
  DateTime: Scalars['DateTime']['output'];
  Deal: Deal;
  DealInput: DealInput;
  DealPage: DealPage;
  Department: Department;
  DepartmentInput: DepartmentInput;
  DocPage: DocPage;
  DockerContainer: DockerContainer;
  DockerContainerDetail: DockerContainerDetail;
  DockerDiskUsage: DockerDiskUsage;
  DockerHost: DockerHost;
  DockerImage: DockerImage;
  DockerStorage: DockerStorage;
  EmailConfig: EmailConfig;
  EmailConfigInput: EmailConfigInput;
  EmailDashboard: EmailDashboard;
  EmailDayCount: EmailDayCount;
  EmailFragment: EmailFragment;
  EmailFragmentInput: EmailFragmentInput;
  EmailFragmentPage: EmailFragmentPage;
  EmailLog: EmailLog;
  EmailLogPage: EmailLogPage;
  EmailPreview: EmailPreview;
  EmailTemplate: EmailTemplate;
  EmailTemplateInput: EmailTemplateInput;
  EmailTemplatePage: EmailTemplatePage;
  EmailTemplateUsage: EmailTemplateUsage;
  EmailVariableInput: EmailVariableInput;
  EmployeeDocument: EmployeeDocument;
  EmployeeDocumentInput: EmployeeDocumentInput;
  EmployeeDocumentPage: EmployeeDocumentPage;
  EmployeeRequest: EmployeeRequest;
  EmployeeRequestInput: EmployeeRequestInput;
  EmployeeRequestPage: EmployeeRequestPage;
  EmployeeSalaryInput: EmployeeSalaryInput;
  EmploymentType: EmploymentType;
  EmploymentTypeInput: EmploymentTypeInput;
  EmploymentTypePage: EmploymentTypePage;
  ExitRecord: ExitRecord;
  ExitRecordInput: ExitRecordInput;
  ExitRecordPage: ExitRecordPage;
  ExpenseClaim: ExpenseClaim;
  ExpenseClaimInput: ExpenseClaimInput;
  ExpenseClaimPage: ExpenseClaimPage;
  FinanceBucket: FinanceBucket;
  FinanceMonth: FinanceMonth;
  Float: Scalars['Float']['output'];
  Gig: Gig;
  GigInput: GigInput;
  GigPage: GigPage;
  GithubConfig: GithubConfig;
  GithubConfigInput: GithubConfigInput;
  Goal: Goal;
  GoalInput: GoalInput;
  GoalPage: GoalPage;
  Grade: Grade;
  GradeInput: GradeInput;
  GradePage: GradePage;
  HeadcountPoint: HeadcountPoint;
  Holiday: Holiday;
  HolidayInput: HolidayInput;
  HolidayPage: HolidayPage;
  HrDashboard: HrDashboard;
  ID: Scalars['ID']['output'];
  ImageConfig: ImageConfig;
  ImageConfigInput: ImageConfigInput;
  InfrastructureOverview: InfrastructureOverview;
  Int: Scalars['Int']['output'];
  Invoice: Invoice;
  InvoiceInput: InvoiceInput;
  InvoicePage: InvoicePage;
  JSON: Scalars['JSON']['output'];
  Job: Job;
  JobCompany: JobCompany;
  JobCompanyInput: JobCompanyInput;
  JobCompanyPage: JobCompanyPage;
  JobInput: JobInput;
  JobPage: JobPage;
  Lead: Lead;
  LeadInput: LeadInput;
  LeadPage: LeadPage;
  LeaveBalance: LeaveBalance;
  LeaveBalanceInput: LeaveBalanceInput;
  LeaveBalancePage: LeaveBalancePage;
  LeavePolicy: LeavePolicy;
  LeavePolicyInput: LeavePolicyInput;
  LeavePolicyPage: LeavePolicyPage;
  LeaveRequest: LeaveRequest;
  LeaveRequestInput: LeaveRequestInput;
  LegalDocument: LegalDocument;
  LegalDocumentInput: LegalDocumentInput;
  LegalDocumentPage: LegalDocumentPage;
  Licence: Licence;
  LicenceInput: LicenceInput;
  LicencePage: LicencePage;
  Location: Location;
  LocationInput: LocationInput;
  LocationPage: LocationPage;
  LoginPage: LoginPage;
  LoginPageInput: LoginPageInput;
  MarkAttendanceInput: MarkAttendanceInput;
  Mutation: {};
  MyExpenseClaimInput: MyExpenseClaimInput;
  MyPolicy: MyPolicy;
  MyRequestInput: MyRequestInput;
  NavLink: NavLink;
  NavLinkInput: NavLinkInput;
  Notification: Notification;
  OpenAiConfig: OpenAiConfig;
  OpenAiConfigInput: OpenAiConfigInput;
  Payment: Payment;
  PaymentInput: PaymentInput;
  PaymentPage: PaymentPage;
  PayrollDispatchResult: PayrollDispatchResult;
  PayrollRunResult: PayrollRunResult;
  PayrollSchedule: PayrollSchedule;
  PayrollScheduleInput: PayrollScheduleInput;
  PayrollSummary: PayrollSummary;
  PerformanceReview: PerformanceReview;
  PerformanceReviewInput: PerformanceReviewInput;
  PerformanceReviewPage: PerformanceReviewPage;
  PexelsConfig: PexelsConfig;
  PexelsConfigInput: PexelsConfigInput;
  PexelsMedia: PexelsMedia;
  PexelsSearchFilters: PexelsSearchFilters;
  Policy: Policy;
  PolicyAcknowledgement: PolicyAcknowledgement;
  PolicyInput: PolicyInput;
  PolicyPage: PolicyPage;
  Position: Position;
  PositionInput: PositionInput;
  ProblemReport: ProblemReport;
  ProblemReportInput: ProblemReportInput;
  ProblemReportPage: ProblemReportPage;
  ProblemReportReceipt: ProblemReportReceipt;
  Product: Product;
  ProductInput: ProductInput;
  ProductPage: ProductPage;
  Project: Project;
  ProjectBoard: ProjectBoard;
  ProjectInput: ProjectInput;
  ProjectMember: ProjectMember;
  ProjectPage: ProjectPage;
  Prompt: Prompt;
  PromptInput: PromptInput;
  PromptPage: PromptPage;
  PublicPolicy: PublicPolicy;
  Query: {};
  Receivables: Receivables;
  ReceivablesBucket: ReceivablesBucket;
  RolePermission: RolePermission;
  SalarySlip: SalarySlip;
  SalarySlipDownload: SalarySlipDownload;
  SalarySlipPage: SalarySlipPage;
  SalaryStructure: SalaryStructure;
  SalaryStructureInput: SalaryStructureInput;
  SalaryStructurePage: SalaryStructurePage;
  SendMailInput: SendMailInput;
  SendNotificationInput: SendNotificationInput;
  SendNotificationResult: SendNotificationResult;
  ServerRuntime: ServerRuntime;
  Shift: Shift;
  ShiftInput: ShiftInput;
  ShiftPage: ShiftPage;
  SlackChannel: SlackChannel;
  SlackConfig: SlackConfig;
  SlackConfigInput: SlackConfigInput;
  StatBucket: StatBucket;
  StatFieldCounts: StatFieldCounts;
  StatFieldSum: StatFieldSum;
  StatusDayPoint: StatusDayPoint;
  StatusIncident: StatusIncident;
  StatusMonitor: StatusMonitor;
  StatusMonitorInput: StatusMonitorInput;
  StatusMonitorPage: StatusMonitorPage;
  StatusOverview: StatusOverview;
  StatusServiceSummary: StatusServiceSummary;
  StockMovement: StockMovement;
  StockMovementInput: StockMovementInput;
  StockMovementPage: StockMovementPage;
  String: Scalars['String']['output'];
  SubmitProblemReportInput: SubmitProblemReportInput;
  Supplier: Supplier;
  SupplierInput: SupplierInput;
  SupplierPage: SupplierPage;
  SupportAgent: SupportAgent;
  SupportReply: SupportReply;
  SupportTicket: SupportTicket;
  SupportTicketInput: SupportTicketInput;
  TableFilterInput: TableFilterInput;
  TableQueryInput: TableQueryInput;
  TableSortInput: TableSortInput;
  TableStats: TableStats;
  Task: Task;
  TaskActivity: TaskActivity;
  TaskComment: TaskComment;
  TaskInput: TaskInput;
  Team: Team;
  TeamInput: TeamInput;
  TeamPage: TeamPage;
  Tool: Tool;
  ToolCategory: ToolCategory;
  ToolCategoryInput: ToolCategoryInput;
  ToolInput: ToolInput;
  ToolPage: ToolPage;
  ToolPricing: ToolPricing;
  ToolPricingInput: ToolPricingInput;
  TrackerAccess: TrackerAccess;
  TrackerAppUsage: TrackerAppUsage;
  TrackerBilling: TrackerBilling;
  TrackerBillingRow: TrackerBillingRow;
  TrackerBuild: TrackerBuild;
  TrackerBuildSettings: TrackerBuildSettings;
  TrackerConsentPolicy: TrackerConsentPolicy;
  TrackerDay: TrackerDay;
  TrackerDayBucket: TrackerDayBucket;
  TrackerDevice: TrackerDevice;
  TrackerDeviceInput: TrackerDeviceInput;
  TrackerInterval: TrackerInterval;
  TrackerIntervalInput: TrackerIntervalInput;
  TrackerLoginPayload: TrackerLoginPayload;
  TrackerManualEntry: TrackerManualEntry;
  TrackerManualEntryInput: TrackerManualEntryInput;
  TrackerMe: TrackerMe;
  TrackerProject: TrackerProject;
  TrackerRelease: TrackerRelease;
  TrackerReleaseAsset: TrackerReleaseAsset;
  TrackerScreenshot: TrackerScreenshot;
  TrackerScreenshotInput: TrackerScreenshotInput;
  TrackerSession: TrackerSession;
  TrackerSettings: TrackerSettings;
  TrackerSettingsInput: TrackerSettingsInput;
  TrackerTotals: TrackerTotals;
  TrackerWindowUsageInput: TrackerWindowUsageInput;
  TrackerWorkProfile: TrackerWorkProfile;
  TrackerWorkday: TrackerWorkday;
  Training: Training;
  TrainingInput: TrainingInput;
  TrainingPage: TrainingPage;
  UpdateProfileInput: UpdateProfileInput;
  UpdateSettingsInput: UpdateSettingsInput;
  UpdateUserInput: UpdateUserInput;
  User: User;
  UserCredentials: UserCredentials;
  UserPage: UserPage;
  WebsiteSubmission: WebsiteSubmission;
  WebsiteSubmissionInput: WebsiteSubmissionInput;
  WebsiteSubmissionTriageInput: WebsiteSubmissionTriageInput;
}>;

export type ActivityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Activity'] = ResolversParentTypes['Activity']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  done?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  dueDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  relatedId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  relatedName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  relatedType?: Resolver<ResolversTypes['ActivitySubject'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ActivityType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ActivityPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ActivityPage'] = ResolversParentTypes['ActivityPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Activity']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AiJobResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AiJob'] = ResolversParentTypes['AiJob']> = ResolversObject<{
  completionTokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  error?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  latencyMs?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  model?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  prompt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  promptId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  promptTokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  ranAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  response?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AiJobStatus'], ParentType, ContextType>;
  totalTokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AiJobPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AiJobPage'] = ResolversParentTypes['AiJobPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['AiJob']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AiModelOptionsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AiModelOptions'] = ResolversParentTypes['AiModelOptions']> = ResolversObject<{
  defaultModel?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  models?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AnnouncementResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Announcement'] = ResolversParentTypes['Announcement']> = ResolversObject<{
  audience?: Resolver<ResolversTypes['AnnouncementAudience'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['AnnouncementCategory'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  department?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  employeeIds?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  expiresAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  pinned?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  publishedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AnnouncementPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AnnouncementPage'] = ResolversParentTypes['AnnouncementPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Announcement']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AppSettingsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AppSettings'] = ResolversParentTypes['AppSettings']> = ResolversObject<{
  dateFormat?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  timeFormat?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssetResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Asset'] = ResolversParentTypes['Asset']> = ResolversObject<{
  assetTag?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  assignedToId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  assignedToName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['AssetCategory'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  location?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  manufacturer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modelName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  purchaseCost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  purchaseDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  serialNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AssetStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  warrantyExpiry?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssetAssigneeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AssetAssignee'] = ResolversParentTypes['AssetAssignee']> = ResolversObject<{
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssetPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AssetPage'] = ResolversParentTypes['AssetPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Asset']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AttendanceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Attendance'] = ResolversParentTypes['Attendance']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AttendanceStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AudienceListResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AudienceList'] = ResolversParentTypes['AudienceList']> = ResolversObject<{
  clientIds?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AudienceListPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AudienceListPage'] = ResolversParentTypes['AudienceListPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['AudienceList']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AuthPayloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AuthPayload'] = ResolversParentTypes['AuthPayload']> = ResolversObject<{
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BenefitResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Benefit'] = ResolversParentTypes['Benefit']> = ResolversObject<{
  coverage?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  documentUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['BenefitKind'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  validFrom?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  validTo?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BenefitPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BenefitPage'] = ResolversParentTypes['BenefitPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Benefit']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BlogAuthorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BlogAuthor'] = ResolversParentTypes['BlogAuthor']> = ResolversObject<{
  initials?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BlogPostResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BlogPost'] = ResolversParentTypes['BlogPost']> = ResolversObject<{
  author?: Resolver<ResolversTypes['BlogAuthor'], ParentType, ContextType>;
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  coverImage?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  featured?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  publishedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  readTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BlogPostPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BlogPostPage'] = ResolversParentTypes['BlogPostPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['BlogPost']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BoardColumnResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BoardColumn'] = ResolversParentTypes['BoardColumn']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BrandingResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Branding'] = ResolversParentTypes['Branding']> = ResolversObject<{
  accentColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  appIconUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  backgroundColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  businessName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contactPhone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  copyrightText?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  emailLogoUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  facebookUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  faviconUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  githubUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  instagramUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  legalName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  linkedinUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loginPages?: Resolver<Array<ResolversTypes['LoginPage']>, ParentType, ContextType>;
  logoDarkUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  logoUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ogImageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  primaryColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  secondaryColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slogan?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  supportEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  textColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  twitterUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  websiteUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  youtubeUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BugResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Bug'] = ResolversParentTypes['Bug']> = ResolversObject<{
  assignee?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dueDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  severity?: Resolver<ResolversTypes['BugSeverity'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['BugStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BugPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BugPage'] = ResolversParentTypes['BugPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Bug']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CampaignResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Campaign'] = ResolversParentTypes['Campaign']> = ResolversObject<{
  body?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  budget?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  channel?: Resolver<ResolversTypes['CampaignChannel'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastSentAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  recipientsCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['CampaignStatus'], ParentType, ContextType>;
  subject?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CampaignPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CampaignPage'] = ResolversParentTypes['CampaignPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Campaign']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CampaignSendResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CampaignSend'] = ResolversParentTypes['CampaignSend']> = ResolversObject<{
  audienceListId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  campaignId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  error?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  recipientName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sentAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['CampaignSendStatus'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CampaignSendResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CampaignSendResult'] = ResolversParentTypes['CampaignSendResult']> = ResolversObject<{
  campaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CaseStudyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CaseStudy'] = ResolversParentTypes['CaseStudy']> = ResolversObject<{
  author?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  coverImage?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  excerpt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  featured?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  pdfUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  publishedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CaseStudyPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CaseStudyPage'] = ResolversParentTypes['CaseStudyPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['CaseStudy']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ClientResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Client'] = ResolversParentTypes['Client']> = ResolversObject<{
  company?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ClientStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ClientPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ClientPage'] = ResolversParentTypes['ClientPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Client']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CompanyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Company'] = ResolversParentTypes['Company']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  domain?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  industry?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  location?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  size?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['CompanyStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CompanyBenefitResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CompanyBenefit'] = ResolversParentTypes['CompanyBenefit']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CompanyExpenseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CompanyExpense'] = ResolversParentTypes['CompanyExpense']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['ExpenseCategory'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dueDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  incurredOn?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  paidOn?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  recordedBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ExpenseState'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  vendor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CompanyExpensePageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CompanyExpensePage'] = ResolversParentTypes['CompanyExpensePage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['CompanyExpense']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CompanyFinanceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CompanyFinance'] = ResolversParentTypes['CompanyFinance']> = ResolversObject<{
  byCategory?: Resolver<Array<ResolversTypes['FinanceBucket']>, ParentType, ContextType>;
  collected?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  expenses?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  from?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  invoiced?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  months?: Resolver<Array<ResolversTypes['FinanceMonth']>, ParentType, ContextType>;
  netCash?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  outstandingPayable?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  outstandingReceivable?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  overduePayable?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  paidOut?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  payroll?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  profit?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  reimbursements?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  totalCost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CompanyPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CompanyPage'] = ResolversParentTypes['CompanyPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Company']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CompanySocialLinksResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CompanySocialLinks'] = ResolversParentTypes['CompanySocialLinks']> = ResolversObject<{
  facebook?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  instagram?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  linkedin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  twitter?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContactResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Contact'] = ResolversParentTypes['Contact']> = ResolversObject<{
  companyId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  companyName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ContactStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContactPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContactPage'] = ResolversParentTypes['ContactPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Contact']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContainerMountResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContainerMount'] = ResolversParentTypes['ContainerMount']> = ResolversObject<{
  destination?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  readOnly?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContainerPortResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContainerPort'] = ResolversParentTypes['ContainerPort']> = ResolversObject<{
  ip?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  privatePort?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  protocol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  publicPort?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContractResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Contract'] = ResolversParentTypes['Contract']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  effectiveDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  expiryDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  party?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sentAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  signedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  signedBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ContractStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ContractType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContractPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContractPage'] = ResolversParentTypes['ContractPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Contract']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DatabaseInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DatabaseInfo'] = ResolversParentTypes['DatabaseInfo']> = ResolversObject<{
  collections?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  connectionsAvailable?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  connectionsCurrent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  dataSizeBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  host?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  indexSizeBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  objects?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  storageSizeBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  uptimeSeconds?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DealResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Deal'] = ResolversParentTypes['Deal']> = ResolversObject<{
  companyId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  companyName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contactId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contactName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  expectedCloseDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  probability?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stage?: Resolver<ResolversTypes['DealStage'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DealPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DealPage'] = ResolversParentTypes['DealPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Deal']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DepartmentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Department'] = ResolversParentTypes['Department']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DocPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DocPage'] = ResolversParentTypes['DocPage']> = ResolversObject<{
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  parentId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  updatedByName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DockerContainerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DockerContainer'] = ResolversParentTypes['DockerContainer']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  health?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  imageTag?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ipAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  networks?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  ports?: Resolver<Array<ResolversTypes['ContainerPort']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DockerContainerDetailResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DockerContainerDetail'] = ResolversParentTypes['DockerContainerDetail']> = ResolversObject<{
  command?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  cpuLimit?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  cpuPercent?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  exitCode?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  health?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  imageId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  imageTag?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ipAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  logDriver?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  memoryBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  memoryLimitBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  mounts?: Resolver<Array<ResolversTypes['ContainerMount']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  networks?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  restartCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  restartPolicy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DockerDiskUsageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DockerDiskUsage'] = ResolversParentTypes['DockerDiskUsage']> = ResolversObject<{
  buildCacheBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  containersBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  layersBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  volumesBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DockerHostResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DockerHost'] = ResolversParentTypes['DockerHost']> = ResolversObject<{
  apiVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  architecture?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  containersPaused?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  containersRunning?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  containersStopped?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  cpus?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  dockerRootDir?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  error?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  imagesCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  kernelVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loggingDriver?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  memoryBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  operatingSystem?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  osType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reachable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  serverTime?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  serverVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  storageDriver?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DockerImageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DockerImage'] = ResolversParentTypes['DockerImage']> = ResolversObject<{
  containers?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  repoTags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DockerStorageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DockerStorage'] = ResolversParentTypes['DockerStorage']> = ResolversObject<{
  images?: Resolver<Array<ResolversTypes['DockerImage']>, ParentType, ContextType>;
  usage?: Resolver<ResolversTypes['DockerDiskUsage'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailConfigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailConfig'] = ResolversParentTypes['EmailConfig']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  fromAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  host?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  password?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  port?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  secure?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailDashboardResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailDashboard'] = ResolversParentTypes['EmailDashboard']> = ResolversObject<{
  activeTemplates?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  byTemplate?: Resolver<Array<ResolversTypes['EmailTemplateUsage']>, ParentType, ContextType>;
  configured?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  days?: Resolver<Array<ResolversTypes['EmailDayCount']>, ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fragments?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  recentFailures?: Resolver<Array<ResolversTypes['EmailLog']>, ParentType, ContextType>;
  sent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  templates?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailDayCountResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailDayCount'] = ResolversParentTypes['EmailDayCount']> = ResolversObject<{
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailFragmentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailFragment'] = ResolversParentTypes['EmailFragment']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mjml?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  updatedBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailFragmentPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailFragmentPage'] = ResolversParentTypes['EmailFragmentPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['EmailFragment']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailLogResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailLog'] = ResolversParentTypes['EmailLog']> = ResolversObject<{
  error?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  sentAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EmailLogStatus'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  templateKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  templateName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  triggeredBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailLogPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailLogPage'] = ResolversParentTypes['EmailLogPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['EmailLog']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailPreviewResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailPreview'] = ResolversParentTypes['EmailPreview']> = ResolversObject<{
  fragments?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  html?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  variables?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailTemplateResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailTemplate'] = ResolversParentTypes['EmailTemplate']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fragments?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mjml?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  updatedBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  variables?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailTemplatePageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailTemplatePage'] = ResolversParentTypes['EmailTemplatePage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['EmailTemplate']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailTemplateUsageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailTemplateUsage'] = ResolversParentTypes['EmailTemplateUsage']> = ResolversObject<{
  failed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmployeeDocumentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmployeeDocument'] = ResolversParentTypes['EmployeeDocument']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  issuedOn?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['DocumentKind'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmployeeDocumentPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmployeeDocumentPage'] = ResolversParentTypes['EmployeeDocumentPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['EmployeeDocument']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmployeeRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmployeeRequest'] = ResolversParentTypes['EmployeeRequest']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  decidedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  decisionNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  details?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['RequestStatus'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['RequestType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmployeeRequestPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmployeeRequestPage'] = ResolversParentTypes['EmployeeRequestPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['EmployeeRequest']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmploymentTypeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmploymentType'] = ResolversParentTypes['EmploymentType']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  payrollEligible?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmploymentTypePageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmploymentTypePage'] = ResolversParentTypes['EmploymentTypePage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['EmploymentType']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ExitRecordResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ExitRecord'] = ResolversParentTypes['ExitRecord']> = ResolversObject<{
  assetsReturned?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  daysToLastWorkingDay?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  documentsIssued?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  exitInterviewNotes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  finalSettlementAmount?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  knowledgeTransferDone?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastWorkingDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  noticePeriodDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resignationDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  stage?: Resolver<ResolversTypes['ExitStage'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ExitRecordPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ExitRecordPage'] = ResolversParentTypes['ExitRecordPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['ExitRecord']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ExpenseClaimResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ExpenseClaim'] = ResolversParentTypes['ExpenseClaim']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  approvedAmount?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  incurredOn?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  receiptUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ExpenseStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ExpenseClaimPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ExpenseClaimPage'] = ResolversParentTypes['ExpenseClaimPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['ExpenseClaim']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FinanceBucketResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FinanceBucket'] = ResolversParentTypes['FinanceBucket']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FinanceMonthResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FinanceMonth'] = ResolversParentTypes['FinanceMonth']> = ResolversObject<{
  cost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  month?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  profit?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  revenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Gig'] = ResolversParentTypes['Gig']> = ResolversObject<{
  applicationContact?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  applicationType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  budget?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  deadline?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  deliverables?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  duration?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fullDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gigCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isUrgent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  postedDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  requirements?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  shortDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GigPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GigPage'] = ResolversParentTypes['GigPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Gig']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GithubConfigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GithubConfig'] = ResolversParentTypes['GithubConfig']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  repo?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GoalResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Goal'] = ResolversParentTypes['Goal']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kpi?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  managerComment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  progress?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['GoalStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  weightage?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GoalPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GoalPage'] = ResolversParentTypes['GoalPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Goal']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GradeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Grade'] = ResolversParentTypes['Grade']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  level?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  maxSalary?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  minSalary?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GradePageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GradePage'] = ResolversParentTypes['GradePage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Grade']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HeadcountPointResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['HeadcountPoint'] = ResolversParentTypes['HeadcountPoint']> = ResolversObject<{
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HolidayResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Holiday'] = ResolversParentTypes['Holiday']> = ResolversObject<{
  date?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['HolidayType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HolidayPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['HolidayPage'] = ResolversParentTypes['HolidayPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Holiday']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HrDashboardResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['HrDashboard'] = ResolversParentTypes['HrDashboard']> = ResolversObject<{
  activeEmployees?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  headcount?: Resolver<Array<ResolversTypes['HeadcountPoint']>, ParentType, ContextType>;
  onLeave?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalEmployees?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ImageConfigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ImageConfig'] = ResolversParentTypes['ImageConfig']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  privateKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  publicKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  urlEndpoint?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InfrastructureOverviewResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['InfrastructureOverview'] = ResolversParentTypes['InfrastructureOverview']> = ResolversObject<{
  database?: Resolver<ResolversTypes['DatabaseInfo'], ParentType, ContextType>;
  docker?: Resolver<ResolversTypes['DockerHost'], ParentType, ContextType>;
  runtime?: Resolver<ResolversTypes['ServerRuntime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InvoiceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Invoice'] = ResolversParentTypes['Invoice']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  amountPaid?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  balanceDue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dueDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  issuedDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['InvoiceStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InvoicePageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['InvoicePage'] = ResolversParentTypes['InvoicePage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Invoice']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type JobResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Job'] = ResolversParentTypes['Job']> = ResolversObject<{
  applicationDeadline?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  benefits?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  companySlug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  experienceLevel?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isFeatured?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  jobCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  jobDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  jobPostDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  jobResponsibilities?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  jobType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  location?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  niceToHave?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  requirements?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  salaryRange?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  shortJobDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  skillSet?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  workMode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type JobCompanyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobCompany'] = ResolversParentTypes['JobCompany']> = ResolversObject<{
  benefits?: Resolver<Array<ResolversTypes['CompanyBenefit']>, ParentType, ContextType>;
  brandColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  companyCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  culture?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  employees?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  founded?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  headquarters?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  industry?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  logo?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  secondaryColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  socialLinks?: Resolver<ResolversTypes['CompanySocialLinks'], ParentType, ContextType>;
  tagline?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  website?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type JobCompanyPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobCompanyPage'] = ResolversParentTypes['JobCompanyPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['JobCompany']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type JobPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobPage'] = ResolversParentTypes['JobPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Job']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LeadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Lead'] = ResolversParentTypes['Lead']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['LeadSource'], ParentType, ContextType>;
  stage?: Resolver<ResolversTypes['LeadStage'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LeadPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LeadPage'] = ResolversParentTypes['LeadPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Lead']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LeaveBalanceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LeaveBalance'] = ResolversParentTypes['LeaveBalance']> = ResolversObject<{
  adjustment?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  allocated?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  available?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  carriedForward?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  leaveTypeCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  used?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LeaveBalancePageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LeaveBalancePage'] = ResolversParentTypes['LeaveBalancePage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['LeaveBalance']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LeavePolicyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LeavePolicy'] = ResolversParentTypes['LeavePolicy']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  annualQuota?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  carryForwardCap?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  halfDayAllowed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  paid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LeavePolicyPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LeavePolicyPage'] = ResolversParentTypes['LeavePolicyPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['LeavePolicy']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LeaveRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LeaveRequest'] = ResolversParentTypes['LeaveRequest']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fromDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['LeaveStatus'], ParentType, ContextType>;
  toDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['LeaveType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LegalDocumentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LegalDocument'] = ResolversParentTypes['LegalDocument']> = ResolversObject<{
  category?: Resolver<ResolversTypes['DocumentCategory'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  fileUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['DocumentStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LegalDocumentPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LegalDocumentPage'] = ResolversParentTypes['LegalDocumentPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['LegalDocument']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LicenceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Licence'] = ResolversParentTypes['Licence']> = ResolversObject<{
  assigneeIds?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  billingCycle?: Resolver<ResolversTypes['LicenceBillingCycle'], ParentType, ContextType>;
  cost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  renewalDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  seatsTotal?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['LicenceStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  vendor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LicencePageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LicencePage'] = ResolversParentTypes['LicencePage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Licence']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LocationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Location'] = ResolversParentTypes['Location']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  city?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  country?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LocationPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LocationPage'] = ResolversParentTypes['LocationPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Location']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoginPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LoginPage'] = ResolversParentTypes['LoginPage']> = ResolversObject<{
  accentColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  app?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  backgroundImageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tagline?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  acknowledgePolicy?: Resolver<ResolversTypes['PolicyAcknowledgement'], ParentType, ContextType, RequireFields<MutationAcknowledgePolicyArgs, 'policyId' | 'signedName'>>;
  addSupportReply?: Resolver<ResolversTypes['SupportReply'], ParentType, ContextType, RequireFields<MutationAddSupportReplyArgs, 'body' | 'internal' | 'ticketId'>>;
  addTaskComment?: Resolver<ResolversTypes['TaskComment'], ParentType, ContextType, RequireFields<MutationAddTaskCommentArgs, 'body' | 'taskId'>>;
  applyLeave?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<MutationApplyLeaveArgs, 'input'>>;
  archivePolicy?: Resolver<ResolversTypes['Policy'], ParentType, ContextType, RequireFields<MutationArchivePolicyArgs, 'id'>>;
  assignSupportTicket?: Resolver<ResolversTypes['SupportTicket'], ParentType, ContextType, RequireFields<MutationAssignSupportTicketArgs, 'assigneeId' | 'id'>>;
  changePassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationChangePasswordArgs, 'currentPassword' | 'newPassword'>>;
  clearRolePermission?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationClearRolePermissionArgs, 'module' | 'role'>>;
  createActivity?: Resolver<ResolversTypes['Activity'], ParentType, ContextType, RequireFields<MutationCreateActivityArgs, 'input'>>;
  createAiJob?: Resolver<ResolversTypes['AiJob'], ParentType, ContextType, RequireFields<MutationCreateAiJobArgs, 'input'>>;
  createAnnouncement?: Resolver<ResolversTypes['Announcement'], ParentType, ContextType, RequireFields<MutationCreateAnnouncementArgs, 'input'>>;
  createAsset?: Resolver<ResolversTypes['Asset'], ParentType, ContextType, RequireFields<MutationCreateAssetArgs, 'input'>>;
  createAudienceList?: Resolver<ResolversTypes['AudienceList'], ParentType, ContextType, RequireFields<MutationCreateAudienceListArgs, 'input'>>;
  createBenefit?: Resolver<ResolversTypes['Benefit'], ParentType, ContextType, RequireFields<MutationCreateBenefitArgs, 'input'>>;
  createBlogPost?: Resolver<ResolversTypes['BlogPost'], ParentType, ContextType, RequireFields<MutationCreateBlogPostArgs, 'input'>>;
  createBug?: Resolver<ResolversTypes['Bug'], ParentType, ContextType, RequireFields<MutationCreateBugArgs, 'input'>>;
  createCampaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType, RequireFields<MutationCreateCampaignArgs, 'input'>>;
  createCaseStudy?: Resolver<ResolversTypes['CaseStudy'], ParentType, ContextType, RequireFields<MutationCreateCaseStudyArgs, 'input'>>;
  createClient?: Resolver<ResolversTypes['Client'], ParentType, ContextType, RequireFields<MutationCreateClientArgs, 'input'>>;
  createColumn?: Resolver<ResolversTypes['BoardColumn'], ParentType, ContextType, RequireFields<MutationCreateColumnArgs, 'name' | 'projectId'>>;
  createCompany?: Resolver<ResolversTypes['Company'], ParentType, ContextType, RequireFields<MutationCreateCompanyArgs, 'input'>>;
  createCompanyExpense?: Resolver<ResolversTypes['CompanyExpense'], ParentType, ContextType, RequireFields<MutationCreateCompanyExpenseArgs, 'input'>>;
  createContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationCreateContactArgs, 'input'>>;
  createContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationCreateContractArgs, 'input'>>;
  createDeal?: Resolver<ResolversTypes['Deal'], ParentType, ContextType, RequireFields<MutationCreateDealArgs, 'input'>>;
  createDepartment?: Resolver<ResolversTypes['Department'], ParentType, ContextType, RequireFields<MutationCreateDepartmentArgs, 'input'>>;
  createDocPage?: Resolver<ResolversTypes['DocPage'], ParentType, ContextType, RequireFields<MutationCreateDocPageArgs, 'projectId' | 'title'>>;
  createEmailConfig?: Resolver<ResolversTypes['EmailConfig'], ParentType, ContextType, RequireFields<MutationCreateEmailConfigArgs, 'input'>>;
  createEmailFragment?: Resolver<ResolversTypes['EmailFragment'], ParentType, ContextType, RequireFields<MutationCreateEmailFragmentArgs, 'input'>>;
  createEmailTemplate?: Resolver<ResolversTypes['EmailTemplate'], ParentType, ContextType, RequireFields<MutationCreateEmailTemplateArgs, 'input'>>;
  createEmployeeDocument?: Resolver<ResolversTypes['EmployeeDocument'], ParentType, ContextType, RequireFields<MutationCreateEmployeeDocumentArgs, 'input'>>;
  createEmployeeRequest?: Resolver<ResolversTypes['EmployeeRequest'], ParentType, ContextType, RequireFields<MutationCreateEmployeeRequestArgs, 'input'>>;
  createEmploymentType?: Resolver<ResolversTypes['EmploymentType'], ParentType, ContextType, RequireFields<MutationCreateEmploymentTypeArgs, 'input'>>;
  createExitRecord?: Resolver<ResolversTypes['ExitRecord'], ParentType, ContextType, RequireFields<MutationCreateExitRecordArgs, 'input'>>;
  createExpenseClaim?: Resolver<ResolversTypes['ExpenseClaim'], ParentType, ContextType, RequireFields<MutationCreateExpenseClaimArgs, 'input'>>;
  createGig?: Resolver<ResolversTypes['Gig'], ParentType, ContextType, RequireFields<MutationCreateGigArgs, 'input'>>;
  createGithubConfig?: Resolver<ResolversTypes['GithubConfig'], ParentType, ContextType, RequireFields<MutationCreateGithubConfigArgs, 'input'>>;
  createGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationCreateGoalArgs, 'input'>>;
  createGrade?: Resolver<ResolversTypes['Grade'], ParentType, ContextType, RequireFields<MutationCreateGradeArgs, 'input'>>;
  createHoliday?: Resolver<ResolversTypes['Holiday'], ParentType, ContextType, RequireFields<MutationCreateHolidayArgs, 'input'>>;
  createImageConfig?: Resolver<ResolversTypes['ImageConfig'], ParentType, ContextType, RequireFields<MutationCreateImageConfigArgs, 'input'>>;
  createInvoice?: Resolver<ResolversTypes['Invoice'], ParentType, ContextType, RequireFields<MutationCreateInvoiceArgs, 'input'>>;
  createJob?: Resolver<ResolversTypes['Job'], ParentType, ContextType, RequireFields<MutationCreateJobArgs, 'input'>>;
  createJobCompany?: Resolver<ResolversTypes['JobCompany'], ParentType, ContextType, RequireFields<MutationCreateJobCompanyArgs, 'input'>>;
  createLead?: Resolver<ResolversTypes['Lead'], ParentType, ContextType, RequireFields<MutationCreateLeadArgs, 'input'>>;
  createLeaveBalance?: Resolver<ResolversTypes['LeaveBalance'], ParentType, ContextType, RequireFields<MutationCreateLeaveBalanceArgs, 'input'>>;
  createLeavePolicy?: Resolver<ResolversTypes['LeavePolicy'], ParentType, ContextType, RequireFields<MutationCreateLeavePolicyArgs, 'input'>>;
  createLeaveRequest?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<MutationCreateLeaveRequestArgs, 'input'>>;
  createLegalDocument?: Resolver<ResolversTypes['LegalDocument'], ParentType, ContextType, RequireFields<MutationCreateLegalDocumentArgs, 'input'>>;
  createLicence?: Resolver<ResolversTypes['Licence'], ParentType, ContextType, RequireFields<MutationCreateLicenceArgs, 'input'>>;
  createLocation?: Resolver<ResolversTypes['Location'], ParentType, ContextType, RequireFields<MutationCreateLocationArgs, 'input'>>;
  createMyExpenseClaim?: Resolver<ResolversTypes['ExpenseClaim'], ParentType, ContextType, RequireFields<MutationCreateMyExpenseClaimArgs, 'input'>>;
  createMyRequest?: Resolver<ResolversTypes['EmployeeRequest'], ParentType, ContextType, RequireFields<MutationCreateMyRequestArgs, 'input'>>;
  createNavLink?: Resolver<ResolversTypes['NavLink'], ParentType, ContextType, RequireFields<MutationCreateNavLinkArgs, 'input'>>;
  createOpenAiConfig?: Resolver<ResolversTypes['OpenAiConfig'], ParentType, ContextType, RequireFields<MutationCreateOpenAiConfigArgs, 'input'>>;
  createPerformanceReview?: Resolver<ResolversTypes['PerformanceReview'], ParentType, ContextType, RequireFields<MutationCreatePerformanceReviewArgs, 'input'>>;
  createPexelsConfig?: Resolver<ResolversTypes['PexelsConfig'], ParentType, ContextType, RequireFields<MutationCreatePexelsConfigArgs, 'input'>>;
  createPolicy?: Resolver<ResolversTypes['Policy'], ParentType, ContextType, RequireFields<MutationCreatePolicyArgs, 'input'>>;
  createPosition?: Resolver<ResolversTypes['Position'], ParentType, ContextType, RequireFields<MutationCreatePositionArgs, 'input'>>;
  createProblemReport?: Resolver<ResolversTypes['ProblemReport'], ParentType, ContextType, RequireFields<MutationCreateProblemReportArgs, 'input'>>;
  createProduct?: Resolver<ResolversTypes['Product'], ParentType, ContextType, RequireFields<MutationCreateProductArgs, 'input'>>;
  createProject?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<MutationCreateProjectArgs, 'input'>>;
  createPrompt?: Resolver<ResolversTypes['Prompt'], ParentType, ContextType, RequireFields<MutationCreatePromptArgs, 'input'>>;
  createSalaryStructure?: Resolver<ResolversTypes['SalaryStructure'], ParentType, ContextType, RequireFields<MutationCreateSalaryStructureArgs, 'input'>>;
  createShift?: Resolver<ResolversTypes['Shift'], ParentType, ContextType, RequireFields<MutationCreateShiftArgs, 'input'>>;
  createSlackConfig?: Resolver<ResolversTypes['SlackConfig'], ParentType, ContextType, RequireFields<MutationCreateSlackConfigArgs, 'input'>>;
  createStatusMonitor?: Resolver<ResolversTypes['StatusMonitor'], ParentType, ContextType, RequireFields<MutationCreateStatusMonitorArgs, 'input'>>;
  createSupplier?: Resolver<ResolversTypes['Supplier'], ParentType, ContextType, RequireFields<MutationCreateSupplierArgs, 'input'>>;
  createSupportTicket?: Resolver<ResolversTypes['SupportTicket'], ParentType, ContextType, RequireFields<MutationCreateSupportTicketArgs, 'input'>>;
  createTask?: Resolver<ResolversTypes['Task'], ParentType, ContextType, RequireFields<MutationCreateTaskArgs, 'columnId' | 'input' | 'projectId'>>;
  createTeam?: Resolver<ResolversTypes['Team'], ParentType, ContextType, RequireFields<MutationCreateTeamArgs, 'input'>>;
  createTool?: Resolver<ResolversTypes['Tool'], ParentType, ContextType, RequireFields<MutationCreateToolArgs, 'input'>>;
  createToolCategory?: Resolver<ResolversTypes['ToolCategory'], ParentType, ContextType, RequireFields<MutationCreateToolCategoryArgs, 'input'>>;
  createTrackerManualEntry?: Resolver<ResolversTypes['TrackerManualEntry'], ParentType, ContextType, RequireFields<MutationCreateTrackerManualEntryArgs, 'input'>>;
  createTraining?: Resolver<ResolversTypes['Training'], ParentType, ContextType, RequireFields<MutationCreateTrainingArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['UserCredentials'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  createWebsiteSubmission?: Resolver<ResolversTypes['WebsiteSubmission'], ParentType, ContextType, RequireFields<MutationCreateWebsiteSubmissionArgs, 'input'>>;
  deleteActivity?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteActivityArgs, 'id'>>;
  deleteAiJob?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAiJobArgs, 'id'>>;
  deleteAnnouncement?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAnnouncementArgs, 'id'>>;
  deleteAsset?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAssetArgs, 'id'>>;
  deleteAudienceList?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAudienceListArgs, 'id'>>;
  deleteBenefit?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteBenefitArgs, 'id'>>;
  deleteBlogPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteBlogPostArgs, 'id'>>;
  deleteBug?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteBugArgs, 'id'>>;
  deleteCampaign?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCampaignArgs, 'id'>>;
  deleteCaseStudy?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCaseStudyArgs, 'id'>>;
  deleteClient?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteClientArgs, 'id'>>;
  deleteColumn?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteColumnArgs, 'id'>>;
  deleteCompany?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCompanyArgs, 'id'>>;
  deleteCompanyExpense?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCompanyExpenseArgs, 'id'>>;
  deleteContact?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteContactArgs, 'id'>>;
  deleteContract?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteContractArgs, 'id'>>;
  deleteDeal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteDealArgs, 'id'>>;
  deleteDepartment?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteDepartmentArgs, 'id'>>;
  deleteDocPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteDocPageArgs, 'id'>>;
  deleteEmailConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEmailConfigArgs, 'id'>>;
  deleteEmailFragment?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEmailFragmentArgs, 'id'>>;
  deleteEmailTemplate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEmailTemplateArgs, 'id'>>;
  deleteEmployeeDocument?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEmployeeDocumentArgs, 'id'>>;
  deleteEmployeeRequest?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEmployeeRequestArgs, 'id'>>;
  deleteEmploymentType?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEmploymentTypeArgs, 'id'>>;
  deleteExitRecord?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteExitRecordArgs, 'id'>>;
  deleteExpenseClaim?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteExpenseClaimArgs, 'id'>>;
  deleteGig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteGigArgs, 'id'>>;
  deleteGithubConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteGithubConfigArgs, 'id'>>;
  deleteGoal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteGoalArgs, 'id'>>;
  deleteGrade?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteGradeArgs, 'id'>>;
  deleteHoliday?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteHolidayArgs, 'id'>>;
  deleteImageConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteImageConfigArgs, 'id'>>;
  deleteInvoice?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteInvoiceArgs, 'id'>>;
  deleteJob?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteJobArgs, 'id'>>;
  deleteJobCompany?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteJobCompanyArgs, 'id'>>;
  deleteLead?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLeadArgs, 'id'>>;
  deleteLeaveBalance?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLeaveBalanceArgs, 'id'>>;
  deleteLeavePolicy?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLeavePolicyArgs, 'id'>>;
  deleteLeaveRequest?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLeaveRequestArgs, 'id'>>;
  deleteLegalDocument?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLegalDocumentArgs, 'id'>>;
  deleteLicence?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLicenceArgs, 'id'>>;
  deleteLocation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLocationArgs, 'id'>>;
  deleteNavLink?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteNavLinkArgs, 'id'>>;
  deleteOpenAiConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteOpenAiConfigArgs, 'id'>>;
  deletePerformanceReview?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeletePerformanceReviewArgs, 'id'>>;
  deletePexelsConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeletePexelsConfigArgs, 'id'>>;
  deletePolicy?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeletePolicyArgs, 'id'>>;
  deletePosition?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeletePositionArgs, 'id'>>;
  deleteProblemReport?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteProblemReportArgs, 'id'>>;
  deleteProduct?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteProductArgs, 'id'>>;
  deleteProject?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteProjectArgs, 'id'>>;
  deletePrompt?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeletePromptArgs, 'id'>>;
  deleteSalaryStructure?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSalaryStructureArgs, 'id'>>;
  deleteShift?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteShiftArgs, 'id'>>;
  deleteSlackConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSlackConfigArgs, 'id'>>;
  deleteStatusMonitor?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteStatusMonitorArgs, 'id'>>;
  deleteSupplier?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSupplierArgs, 'id'>>;
  deleteTask?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTaskArgs, 'id'>>;
  deleteTaskComment?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTaskCommentArgs, 'id'>>;
  deleteTeam?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTeamArgs, 'id'>>;
  deleteTool?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteToolArgs, 'id'>>;
  deleteToolCategory?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteToolCategoryArgs, 'id'>>;
  deleteTraining?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTrainingArgs, 'id'>>;
  deleteUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
  deleteWebsiteSubmission?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteWebsiteSubmissionArgs, 'id'>>;
  grantTrackerAccess?: Resolver<ResolversTypes['TrackerAccess'], ParentType, ContextType, RequireFields<MutationGrantTrackerAccessArgs, 'userId'>>;
  importMediaFromUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationImportMediaFromUrlArgs, 'fileName' | 'url'>>;
  login?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'email' | 'password'>>;
  markAllNotificationsRead?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  markAttendance?: Resolver<ResolversTypes['Attendance'], ParentType, ContextType, RequireFields<MutationMarkAttendanceArgs, 'input'>>;
  markExpensePaid?: Resolver<ResolversTypes['CompanyExpense'], ParentType, ContextType, RequireFields<MutationMarkExpensePaidArgs, 'id'>>;
  markNotificationRead?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMarkNotificationReadArgs, 'id'>>;
  markPayrollPaid?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationMarkPayrollPaidArgs, 'month' | 'year'>>;
  moveDocPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMoveDocPageArgs, 'id' | 'toIndex'>>;
  moveTask?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMoveTaskArgs, 'id' | 'toColumnId' | 'toIndex'>>;
  publishPolicy?: Resolver<ResolversTypes['Policy'], ParentType, ContextType, RequireFields<MutationPublishPolicyArgs, 'id'>>;
  recordPayment?: Resolver<ResolversTypes['Payment'], ParentType, ContextType, RequireFields<MutationRecordPaymentArgs, 'input'>>;
  recordStockMovement?: Resolver<ResolversTypes['StockMovement'], ParentType, ContextType, RequireFields<MutationRecordStockMovementArgs, 'input'>>;
  renameColumn?: Resolver<ResolversTypes['BoardColumn'], ParentType, ContextType, RequireFields<MutationRenameColumnArgs, 'id' | 'name'>>;
  reorderColumns?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationReorderColumnsArgs, 'columnIds' | 'projectId'>>;
  resetUserPassword?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationResetUserPasswordArgs, 'id'>>;
  reviewTrackerManualEntry?: Resolver<ResolversTypes['TrackerManualEntry'], ParentType, ContextType, RequireFields<MutationReviewTrackerManualEntryArgs, 'id' | 'status'>>;
  revokeTrackerAccess?: Resolver<ResolversTypes['TrackerAccess'], ParentType, ContextType, RequireFields<MutationRevokeTrackerAccessArgs, 'userId'>>;
  revokeTrackerDevice?: Resolver<ResolversTypes['TrackerDevice'], ParentType, ContextType, RequireFields<MutationRevokeTrackerDeviceArgs, 'deviceId'>>;
  runAiJob?: Resolver<ResolversTypes['AiJob'], ParentType, ContextType, RequireFields<MutationRunAiJobArgs, 'id'>>;
  runPayroll?: Resolver<ResolversTypes['PayrollRunResult'], ParentType, ContextType, RequireFields<MutationRunPayrollArgs, 'month' | 'year'>>;
  runPrompt?: Resolver<ResolversTypes['AiJob'], ParentType, ContextType, RequireFields<MutationRunPromptArgs, 'id' | 'model'>>;
  saveEmployeeSalary?: Resolver<ResolversTypes['SalaryStructure'], ParentType, ContextType, RequireFields<MutationSaveEmployeeSalaryArgs, 'employeeId' | 'input'>>;
  saveTrackerBuildSettings?: Resolver<ResolversTypes['TrackerBuildSettings'], ParentType, ContextType, RequireFields<MutationSaveTrackerBuildSettingsArgs, 'slackChannels'>>;
  sendAdminCredentials?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sendCampaign?: Resolver<ResolversTypes['CampaignSendResult'], ParentType, ContextType, RequireFields<MutationSendCampaignArgs, 'audienceListId' | 'id'>>;
  sendContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationSendContractArgs, 'email' | 'id'>>;
  sendNotification?: Resolver<ResolversTypes['SendNotificationResult'], ParentType, ContextType, RequireFields<MutationSendNotificationArgs, 'input'>>;
  sendSalarySlips?: Resolver<ResolversTypes['PayrollDispatchResult'], ParentType, ContextType, RequireFields<MutationSendSalarySlipsArgs, 'month' | 'year'>>;
  sendTestEmail?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSendTestEmailArgs, 'id' | 'to'>>;
  sendTestEmailTemplate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSendTestEmailTemplateArgs, 'key' | 'to'>>;
  sendTestSlackMessage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSendTestSlackMessageArgs, 'channel' | 'id'>>;
  sendUserMail?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSendUserMailArgs, 'id' | 'input'>>;
  setDealStage?: Resolver<ResolversTypes['Deal'], ParentType, ContextType, RequireFields<MutationSetDealStageArgs, 'id' | 'stage'>>;
  setLeaveStatus?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<MutationSetLeaveStatusArgs, 'id' | 'status'>>;
  setRolePermission?: Resolver<ResolversTypes['RolePermission'], ParentType, ContextType, RequireFields<MutationSetRolePermissionArgs, 'actions' | 'module' | 'role'>>;
  setSupportTicketStatus?: Resolver<ResolversTypes['SupportTicket'], ParentType, ContextType, RequireFields<MutationSetSupportTicketStatusArgs, 'id' | 'status'>>;
  setUserActive?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationSetUserActiveArgs, 'id' | 'isActive'>>;
  setUserBlocked?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationSetUserBlockedArgs, 'id' | 'isBlocked'>>;
  signContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationSignContractArgs, 'id' | 'signedBy'>>;
  startTrackerBuild?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationStartTrackerBuildArgs, 'platforms' | 'ref'>>;
  submitProblemReport?: Resolver<ResolversTypes['ProblemReportReceipt'], ParentType, ContextType, RequireFields<MutationSubmitProblemReportArgs, 'input'>>;
  submitSelfAssessment?: Resolver<ResolversTypes['PerformanceReview'], ParentType, ContextType, RequireFields<MutationSubmitSelfAssessmentArgs, 'id' | 'text'>>;
  testGithubConnection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationTestGithubConnectionArgs, 'id'>>;
  testImageUpload?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationTestImageUploadArgs, 'file' | 'fileName' | 'id'>>;
  testOpenAiConnection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationTestOpenAiConnectionArgs, 'id'>>;
  testPexelsConnection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationTestPexelsConnectionArgs, 'id'>>;
  trackerAcceptConsent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<MutationTrackerAcceptConsentArgs>>;
  trackerHeartbeat?: Resolver<ResolversTypes['TrackerMe'], ParentType, ContextType, Partial<MutationTrackerHeartbeatArgs>>;
  trackerLogin?: Resolver<ResolversTypes['TrackerLoginPayload'], ParentType, ContextType, RequireFields<MutationTrackerLoginArgs, 'device' | 'email' | 'password'>>;
  trackerMarkAttendance?: Resolver<ResolversTypes['TrackerWorkday'], ParentType, ContextType, RequireFields<MutationTrackerMarkAttendanceArgs, 'status'>>;
  trackerSetTimezone?: Resolver<ResolversTypes['TrackerAccess'], ParentType, ContextType, RequireFields<MutationTrackerSetTimezoneArgs, 'timezone'>>;
  trackerStartSession?: Resolver<ResolversTypes['TrackerSession'], ParentType, ContextType, RequireFields<MutationTrackerStartSessionArgs, 'startedAt'>>;
  trackerStopSession?: Resolver<ResolversTypes['TrackerSession'], ParentType, ContextType, RequireFields<MutationTrackerStopSessionArgs, 'endedAt' | 'sessionId'>>;
  trackerSyncIntervals?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationTrackerSyncIntervalsArgs, 'intervals' | 'sessionId'>>;
  trackerUploadScreenshot?: Resolver<ResolversTypes['TrackerScreenshot'], ParentType, ContextType, RequireFields<MutationTrackerUploadScreenshotArgs, 'input'>>;
  triageWebsiteSubmission?: Resolver<ResolversTypes['WebsiteSubmission'], ParentType, ContextType, RequireFields<MutationTriageWebsiteSubmissionArgs, 'id' | 'input'>>;
  updateActivity?: Resolver<ResolversTypes['Activity'], ParentType, ContextType, RequireFields<MutationUpdateActivityArgs, 'id' | 'input'>>;
  updateAiJob?: Resolver<ResolversTypes['AiJob'], ParentType, ContextType, RequireFields<MutationUpdateAiJobArgs, 'id' | 'input'>>;
  updateAnnouncement?: Resolver<ResolversTypes['Announcement'], ParentType, ContextType, RequireFields<MutationUpdateAnnouncementArgs, 'id' | 'input'>>;
  updateAsset?: Resolver<ResolversTypes['Asset'], ParentType, ContextType, RequireFields<MutationUpdateAssetArgs, 'id' | 'input'>>;
  updateAudienceList?: Resolver<ResolversTypes['AudienceList'], ParentType, ContextType, RequireFields<MutationUpdateAudienceListArgs, 'id' | 'input'>>;
  updateBenefit?: Resolver<ResolversTypes['Benefit'], ParentType, ContextType, RequireFields<MutationUpdateBenefitArgs, 'id' | 'input'>>;
  updateBlogPost?: Resolver<ResolversTypes['BlogPost'], ParentType, ContextType, RequireFields<MutationUpdateBlogPostArgs, 'id' | 'input'>>;
  updateBranding?: Resolver<ResolversTypes['Branding'], ParentType, ContextType, RequireFields<MutationUpdateBrandingArgs, 'input'>>;
  updateBug?: Resolver<ResolversTypes['Bug'], ParentType, ContextType, RequireFields<MutationUpdateBugArgs, 'id' | 'input'>>;
  updateCampaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType, RequireFields<MutationUpdateCampaignArgs, 'id' | 'input'>>;
  updateCaseStudy?: Resolver<ResolversTypes['CaseStudy'], ParentType, ContextType, RequireFields<MutationUpdateCaseStudyArgs, 'id' | 'input'>>;
  updateClient?: Resolver<ResolversTypes['Client'], ParentType, ContextType, RequireFields<MutationUpdateClientArgs, 'id' | 'input'>>;
  updateCompany?: Resolver<ResolversTypes['Company'], ParentType, ContextType, RequireFields<MutationUpdateCompanyArgs, 'id' | 'input'>>;
  updateCompanyExpense?: Resolver<ResolversTypes['CompanyExpense'], ParentType, ContextType, RequireFields<MutationUpdateCompanyExpenseArgs, 'id' | 'input'>>;
  updateContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationUpdateContactArgs, 'id' | 'input'>>;
  updateContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationUpdateContractArgs, 'id' | 'input'>>;
  updateDeal?: Resolver<ResolversTypes['Deal'], ParentType, ContextType, RequireFields<MutationUpdateDealArgs, 'id' | 'input'>>;
  updateDepartment?: Resolver<ResolversTypes['Department'], ParentType, ContextType, RequireFields<MutationUpdateDepartmentArgs, 'id' | 'input'>>;
  updateDocPage?: Resolver<ResolversTypes['DocPage'], ParentType, ContextType, RequireFields<MutationUpdateDocPageArgs, 'id'>>;
  updateEmailConfig?: Resolver<ResolversTypes['EmailConfig'], ParentType, ContextType, RequireFields<MutationUpdateEmailConfigArgs, 'id' | 'input'>>;
  updateEmailFragment?: Resolver<ResolversTypes['EmailFragment'], ParentType, ContextType, RequireFields<MutationUpdateEmailFragmentArgs, 'id' | 'input'>>;
  updateEmailTemplate?: Resolver<ResolversTypes['EmailTemplate'], ParentType, ContextType, RequireFields<MutationUpdateEmailTemplateArgs, 'id' | 'input'>>;
  updateEmployeeDocument?: Resolver<ResolversTypes['EmployeeDocument'], ParentType, ContextType, RequireFields<MutationUpdateEmployeeDocumentArgs, 'id' | 'input'>>;
  updateEmployeeRequest?: Resolver<ResolversTypes['EmployeeRequest'], ParentType, ContextType, RequireFields<MutationUpdateEmployeeRequestArgs, 'id' | 'input'>>;
  updateEmploymentType?: Resolver<ResolversTypes['EmploymentType'], ParentType, ContextType, RequireFields<MutationUpdateEmploymentTypeArgs, 'id' | 'input'>>;
  updateExitRecord?: Resolver<ResolversTypes['ExitRecord'], ParentType, ContextType, RequireFields<MutationUpdateExitRecordArgs, 'id' | 'input'>>;
  updateExpenseClaim?: Resolver<ResolversTypes['ExpenseClaim'], ParentType, ContextType, RequireFields<MutationUpdateExpenseClaimArgs, 'id' | 'input'>>;
  updateGig?: Resolver<ResolversTypes['Gig'], ParentType, ContextType, RequireFields<MutationUpdateGigArgs, 'id' | 'input'>>;
  updateGithubConfig?: Resolver<ResolversTypes['GithubConfig'], ParentType, ContextType, RequireFields<MutationUpdateGithubConfigArgs, 'id' | 'input'>>;
  updateGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationUpdateGoalArgs, 'id' | 'input'>>;
  updateGrade?: Resolver<ResolversTypes['Grade'], ParentType, ContextType, RequireFields<MutationUpdateGradeArgs, 'id' | 'input'>>;
  updateHoliday?: Resolver<ResolversTypes['Holiday'], ParentType, ContextType, RequireFields<MutationUpdateHolidayArgs, 'id' | 'input'>>;
  updateImageConfig?: Resolver<ResolversTypes['ImageConfig'], ParentType, ContextType, RequireFields<MutationUpdateImageConfigArgs, 'id' | 'input'>>;
  updateInvoice?: Resolver<ResolversTypes['Invoice'], ParentType, ContextType, RequireFields<MutationUpdateInvoiceArgs, 'id' | 'input'>>;
  updateJob?: Resolver<ResolversTypes['Job'], ParentType, ContextType, RequireFields<MutationUpdateJobArgs, 'id' | 'input'>>;
  updateJobCompany?: Resolver<ResolversTypes['JobCompany'], ParentType, ContextType, RequireFields<MutationUpdateJobCompanyArgs, 'id' | 'input'>>;
  updateLead?: Resolver<ResolversTypes['Lead'], ParentType, ContextType, RequireFields<MutationUpdateLeadArgs, 'id' | 'input'>>;
  updateLeaveBalance?: Resolver<ResolversTypes['LeaveBalance'], ParentType, ContextType, RequireFields<MutationUpdateLeaveBalanceArgs, 'id' | 'input'>>;
  updateLeavePolicy?: Resolver<ResolversTypes['LeavePolicy'], ParentType, ContextType, RequireFields<MutationUpdateLeavePolicyArgs, 'id' | 'input'>>;
  updateLeaveRequest?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<MutationUpdateLeaveRequestArgs, 'id' | 'input'>>;
  updateLegalDocument?: Resolver<ResolversTypes['LegalDocument'], ParentType, ContextType, RequireFields<MutationUpdateLegalDocumentArgs, 'id' | 'input'>>;
  updateLicence?: Resolver<ResolversTypes['Licence'], ParentType, ContextType, RequireFields<MutationUpdateLicenceArgs, 'id' | 'input'>>;
  updateLocation?: Resolver<ResolversTypes['Location'], ParentType, ContextType, RequireFields<MutationUpdateLocationArgs, 'id' | 'input'>>;
  updateMyGoalProgress?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<MutationUpdateMyGoalProgressArgs, 'id' | 'progress'>>;
  updateMyTrainingStatus?: Resolver<ResolversTypes['Training'], ParentType, ContextType, RequireFields<MutationUpdateMyTrainingStatusArgs, 'id' | 'status'>>;
  updateNavLink?: Resolver<ResolversTypes['NavLink'], ParentType, ContextType, RequireFields<MutationUpdateNavLinkArgs, 'id' | 'input'>>;
  updateOpenAiConfig?: Resolver<ResolversTypes['OpenAiConfig'], ParentType, ContextType, RequireFields<MutationUpdateOpenAiConfigArgs, 'id' | 'input'>>;
  updatePayrollSchedule?: Resolver<ResolversTypes['PayrollSchedule'], ParentType, ContextType, RequireFields<MutationUpdatePayrollScheduleArgs, 'input'>>;
  updatePerformanceReview?: Resolver<ResolversTypes['PerformanceReview'], ParentType, ContextType, RequireFields<MutationUpdatePerformanceReviewArgs, 'id' | 'input'>>;
  updatePexelsConfig?: Resolver<ResolversTypes['PexelsConfig'], ParentType, ContextType, RequireFields<MutationUpdatePexelsConfigArgs, 'id' | 'input'>>;
  updatePolicy?: Resolver<ResolversTypes['Policy'], ParentType, ContextType, RequireFields<MutationUpdatePolicyArgs, 'id' | 'input'>>;
  updatePosition?: Resolver<ResolversTypes['Position'], ParentType, ContextType, RequireFields<MutationUpdatePositionArgs, 'id' | 'input'>>;
  updateProblemReport?: Resolver<ResolversTypes['ProblemReport'], ParentType, ContextType, RequireFields<MutationUpdateProblemReportArgs, 'id' | 'input'>>;
  updateProduct?: Resolver<ResolversTypes['Product'], ParentType, ContextType, RequireFields<MutationUpdateProductArgs, 'id' | 'input'>>;
  updateProfile?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateProfileArgs, 'input'>>;
  updateProject?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<MutationUpdateProjectArgs, 'id' | 'input'>>;
  updatePrompt?: Resolver<ResolversTypes['Prompt'], ParentType, ContextType, RequireFields<MutationUpdatePromptArgs, 'id' | 'input'>>;
  updateSalaryStructure?: Resolver<ResolversTypes['SalaryStructure'], ParentType, ContextType, RequireFields<MutationUpdateSalaryStructureArgs, 'id' | 'input'>>;
  updateSettings?: Resolver<ResolversTypes['AppSettings'], ParentType, ContextType, RequireFields<MutationUpdateSettingsArgs, 'input'>>;
  updateShift?: Resolver<ResolversTypes['Shift'], ParentType, ContextType, RequireFields<MutationUpdateShiftArgs, 'id' | 'input'>>;
  updateSlackConfig?: Resolver<ResolversTypes['SlackConfig'], ParentType, ContextType, RequireFields<MutationUpdateSlackConfigArgs, 'id' | 'input'>>;
  updateStatusMonitor?: Resolver<ResolversTypes['StatusMonitor'], ParentType, ContextType, RequireFields<MutationUpdateStatusMonitorArgs, 'id' | 'input'>>;
  updateSupplier?: Resolver<ResolversTypes['Supplier'], ParentType, ContextType, RequireFields<MutationUpdateSupplierArgs, 'id' | 'input'>>;
  updateTask?: Resolver<ResolversTypes['Task'], ParentType, ContextType, RequireFields<MutationUpdateTaskArgs, 'id' | 'input'>>;
  updateTeam?: Resolver<ResolversTypes['Team'], ParentType, ContextType, RequireFields<MutationUpdateTeamArgs, 'id' | 'input'>>;
  updateTool?: Resolver<ResolversTypes['Tool'], ParentType, ContextType, RequireFields<MutationUpdateToolArgs, 'id' | 'input'>>;
  updateToolCategory?: Resolver<ResolversTypes['ToolCategory'], ParentType, ContextType, RequireFields<MutationUpdateToolCategoryArgs, 'id' | 'input'>>;
  updateTrackerSettings?: Resolver<ResolversTypes['TrackerSettings'], ParentType, ContextType, RequireFields<MutationUpdateTrackerSettingsArgs, 'input'>>;
  updateTraining?: Resolver<ResolversTypes['Training'], ParentType, ContextType, RequireFields<MutationUpdateTrainingArgs, 'id' | 'input'>>;
  updateUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'id' | 'input'>>;
  uploadAvatar?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationUploadAvatarArgs, 'file'>>;
  uploadImage?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationUploadImageArgs, 'file' | 'fileName'>>;
  withdrawTrackerManualEntry?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationWithdrawTrackerManualEntryArgs, 'id'>>;
}>;

export type MyPolicyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MyPolicy'] = ResolversParentTypes['MyPolicy']> = ResolversObject<{
  acknowledged?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  acknowledgedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  effectiveDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  requiresAcknowledgement?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NavLinkResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['NavLink'] = ResolversParentTypes['NavLink']> = ResolversObject<{
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  href?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  keywords?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NotificationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']> = ResolversObject<{
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['NotificationKind'], ParentType, ContextType>;
  link?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  read?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OpenAiConfigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['OpenAiConfig'] = ResolversParentTypes['OpenAiConfig']> = ResolversObject<{
  apiKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  defaultModel?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PaymentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Payment'] = ResolversParentTypes['Payment']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  invoiceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  invoiceNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  method?: Resolver<ResolversTypes['PaymentMethod'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receivedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  recordedBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PaymentPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PaymentPage'] = ResolversParentTypes['PaymentPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Payment']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PayrollDispatchResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PayrollDispatchResult'] = ResolversParentTypes['PayrollDispatchResult']> = ResolversObject<{
  failed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  month?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  skipped?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PayrollRunResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PayrollRunResult'] = ResolversParentTypes['PayrollRunResult']> = ResolversObject<{
  generated?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  month?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  skipped?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalNet?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  updated?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PayrollScheduleResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PayrollSchedule'] = ResolversParentTypes['PayrollSchedule']> = ResolversObject<{
  dayOfMonth?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hour?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lastFailed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lastRunAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  lastRunPeriod?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastSent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lastSkipped?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  minute?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  period?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PayrollSummaryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PayrollSummary'] = ResolversParentTypes['PayrollSummary']> = ResolversObject<{
  month?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  paid?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  slips?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalDeductions?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalGross?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalNet?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PerformanceReviewResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PerformanceReview'] = ResolversParentTypes['PerformanceReview']> = ResolversObject<{
  actionPlan?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  competencies?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  cycle?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  managerAssessment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rating?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  score?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  selfAssessment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ReviewStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PerformanceReviewPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PerformanceReviewPage'] = ResolversParentTypes['PerformanceReviewPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['PerformanceReview']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PexelsConfigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PexelsConfig'] = ResolversParentTypes['PexelsConfig']> = ResolversObject<{
  apiKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PexelsMediaResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PexelsMedia'] = ResolversParentTypes['PexelsMedia']> = ResolversObject<{
  alt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  credit?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  duration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  previewUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PolicyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Policy'] = ResolversParentTypes['Policy']> = ResolversObject<{
  acknowledgedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  audience?: Resolver<ResolversTypes['PolicyAudience'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  effectiveDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  publishedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  requiresAcknowledgement?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['PolicyStatus'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PolicyAcknowledgementResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PolicyAcknowledgement'] = ResolversParentTypes['PolicyAcknowledgement']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  policyId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  policyTitle?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  signedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  signedName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  userName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PolicyPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PolicyPage'] = ResolversParentTypes['PolicyPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Policy']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PositionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Position'] = ResolversParentTypes['Position']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  department?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProblemReportResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProblemReport'] = ResolversParentTypes['ProblemReport']> = ResolversObject<{
  assignee?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['ProblemCategory'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  pageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reporterEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reporterName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resolutionNotes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  severity?: Resolver<ResolversTypes['ProblemSeverity'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ProblemStatus'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProblemReportPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProblemReportPage'] = ResolversParentTypes['ProblemReportPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['ProblemReport']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProblemReportReceiptResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProblemReportReceipt'] = ResolversParentTypes['ProblemReportReceipt']> = ResolversObject<{
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  submittedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProductResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Product'] = ResolversParentTypes['Product']> = ResolversObject<{
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  sku?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ProductStatus'], ParentType, ContextType>;
  stock?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProductPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProductPage'] = ResolversParentTypes['ProductPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Product']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProjectResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  endDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ProjectStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProjectBoardResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectBoard'] = ResolversParentTypes['ProjectBoard']> = ResolversObject<{
  columns?: Resolver<Array<ResolversTypes['BoardColumn']>, ParentType, ContextType>;
  tasks?: Resolver<Array<ResolversTypes['Task']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProjectMemberResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectMember'] = ResolversParentTypes['ProjectMember']> = ResolversObject<{
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProjectPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ProjectPage'] = ResolversParentTypes['ProjectPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Project']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PromptResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Prompt'] = ResolversParentTypes['Prompt']> = ResolversObject<{
  category?: Resolver<ResolversTypes['PromptCategory'], ParentType, ContextType>;
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PromptPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PromptPage'] = ResolversParentTypes['PromptPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Prompt']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PublicPolicyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PublicPolicy'] = ResolversParentTypes['PublicPolicy']> = ResolversObject<{
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  effectiveDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activeAnnouncements?: Resolver<Array<ResolversTypes['Announcement']>, ParentType, ContextType>;
  activeLeavePolicies?: Resolver<Array<ResolversTypes['LeavePolicy']>, ParentType, ContextType>;
  aiModels?: Resolver<ResolversTypes['AiModelOptions'], ParentType, ContextType>;
  appSettings?: Resolver<ResolversTypes['AppSettings'], ParentType, ContextType>;
  attendanceByEmployee?: Resolver<Array<ResolversTypes['Attendance']>, ParentType, ContextType, RequireFields<QueryAttendanceByEmployeeArgs, 'employeeId'>>;
  branding?: Resolver<ResolversTypes['Branding'], ParentType, ContextType>;
  companyFinance?: Resolver<ResolversTypes['CompanyFinance'], ParentType, ContextType, RequireFields<QueryCompanyFinanceArgs, 'from' | 'to'>>;
  docPage?: Resolver<ResolversTypes['DocPage'], ParentType, ContextType, RequireFields<QueryDocPageArgs, 'id'>>;
  dockerContainerDetail?: Resolver<ResolversTypes['DockerContainerDetail'], ParentType, ContextType, RequireFields<QueryDockerContainerDetailArgs, 'id'>>;
  dockerContainers?: Resolver<Array<ResolversTypes['DockerContainer']>, ParentType, ContextType>;
  dockerStorage?: Resolver<ResolversTypes['DockerStorage'], ParentType, ContextType>;
  emailDashboard?: Resolver<ResolversTypes['EmailDashboard'], ParentType, ContextType, Partial<QueryEmailDashboardArgs>>;
  employeeSalary?: Resolver<Maybe<ResolversTypes['SalaryStructure']>, ParentType, ContextType, RequireFields<QueryEmployeeSalaryArgs, 'employeeId'>>;
  getActivity?: Resolver<ResolversTypes['Activity'], ParentType, ContextType, RequireFields<QueryGetActivityArgs, 'id'>>;
  getAiJob?: Resolver<ResolversTypes['AiJob'], ParentType, ContextType, RequireFields<QueryGetAiJobArgs, 'id'>>;
  getAnnouncement?: Resolver<ResolversTypes['Announcement'], ParentType, ContextType, RequireFields<QueryGetAnnouncementArgs, 'id'>>;
  getAsset?: Resolver<ResolversTypes['Asset'], ParentType, ContextType, RequireFields<QueryGetAssetArgs, 'id'>>;
  getAudienceList?: Resolver<ResolversTypes['AudienceList'], ParentType, ContextType, RequireFields<QueryGetAudienceListArgs, 'id'>>;
  getBenefit?: Resolver<ResolversTypes['Benefit'], ParentType, ContextType, RequireFields<QueryGetBenefitArgs, 'id'>>;
  getBlogPost?: Resolver<ResolversTypes['BlogPost'], ParentType, ContextType, RequireFields<QueryGetBlogPostArgs, 'id'>>;
  getBug?: Resolver<ResolversTypes['Bug'], ParentType, ContextType, RequireFields<QueryGetBugArgs, 'id'>>;
  getCampaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType, RequireFields<QueryGetCampaignArgs, 'id'>>;
  getCaseStudy?: Resolver<ResolversTypes['CaseStudy'], ParentType, ContextType, RequireFields<QueryGetCaseStudyArgs, 'id'>>;
  getClient?: Resolver<ResolversTypes['Client'], ParentType, ContextType, RequireFields<QueryGetClientArgs, 'id'>>;
  getCompany?: Resolver<ResolversTypes['Company'], ParentType, ContextType, RequireFields<QueryGetCompanyArgs, 'id'>>;
  getCompanyExpense?: Resolver<ResolversTypes['CompanyExpense'], ParentType, ContextType, RequireFields<QueryGetCompanyExpenseArgs, 'id'>>;
  getContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<QueryGetContactArgs, 'id'>>;
  getContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<QueryGetContractArgs, 'id'>>;
  getDeal?: Resolver<ResolversTypes['Deal'], ParentType, ContextType, RequireFields<QueryGetDealArgs, 'id'>>;
  getDepartment?: Resolver<ResolversTypes['Department'], ParentType, ContextType, RequireFields<QueryGetDepartmentArgs, 'id'>>;
  getEmailFragment?: Resolver<ResolversTypes['EmailFragment'], ParentType, ContextType, RequireFields<QueryGetEmailFragmentArgs, 'id'>>;
  getEmailTemplate?: Resolver<ResolversTypes['EmailTemplate'], ParentType, ContextType, RequireFields<QueryGetEmailTemplateArgs, 'id'>>;
  getEmployeeDocument?: Resolver<ResolversTypes['EmployeeDocument'], ParentType, ContextType, RequireFields<QueryGetEmployeeDocumentArgs, 'id'>>;
  getEmployeeRequest?: Resolver<ResolversTypes['EmployeeRequest'], ParentType, ContextType, RequireFields<QueryGetEmployeeRequestArgs, 'id'>>;
  getEmploymentType?: Resolver<ResolversTypes['EmploymentType'], ParentType, ContextType, RequireFields<QueryGetEmploymentTypeArgs, 'id'>>;
  getExitRecord?: Resolver<ResolversTypes['ExitRecord'], ParentType, ContextType, RequireFields<QueryGetExitRecordArgs, 'id'>>;
  getExpenseClaim?: Resolver<ResolversTypes['ExpenseClaim'], ParentType, ContextType, RequireFields<QueryGetExpenseClaimArgs, 'id'>>;
  getGig?: Resolver<ResolversTypes['Gig'], ParentType, ContextType, RequireFields<QueryGetGigArgs, 'id'>>;
  getGoal?: Resolver<ResolversTypes['Goal'], ParentType, ContextType, RequireFields<QueryGetGoalArgs, 'id'>>;
  getGrade?: Resolver<ResolversTypes['Grade'], ParentType, ContextType, RequireFields<QueryGetGradeArgs, 'id'>>;
  getHoliday?: Resolver<ResolversTypes['Holiday'], ParentType, ContextType, RequireFields<QueryGetHolidayArgs, 'id'>>;
  getInvoice?: Resolver<ResolversTypes['Invoice'], ParentType, ContextType, RequireFields<QueryGetInvoiceArgs, 'id'>>;
  getJob?: Resolver<ResolversTypes['Job'], ParentType, ContextType, RequireFields<QueryGetJobArgs, 'id'>>;
  getJobCompany?: Resolver<ResolversTypes['JobCompany'], ParentType, ContextType, RequireFields<QueryGetJobCompanyArgs, 'id'>>;
  getLead?: Resolver<ResolversTypes['Lead'], ParentType, ContextType, RequireFields<QueryGetLeadArgs, 'id'>>;
  getLeaveBalance?: Resolver<ResolversTypes['LeaveBalance'], ParentType, ContextType, RequireFields<QueryGetLeaveBalanceArgs, 'id'>>;
  getLeavePolicy?: Resolver<ResolversTypes['LeavePolicy'], ParentType, ContextType, RequireFields<QueryGetLeavePolicyArgs, 'id'>>;
  getLeaveRequest?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<QueryGetLeaveRequestArgs, 'id'>>;
  getLegalDocument?: Resolver<ResolversTypes['LegalDocument'], ParentType, ContextType, RequireFields<QueryGetLegalDocumentArgs, 'id'>>;
  getLicence?: Resolver<ResolversTypes['Licence'], ParentType, ContextType, RequireFields<QueryGetLicenceArgs, 'id'>>;
  getLocation?: Resolver<ResolversTypes['Location'], ParentType, ContextType, RequireFields<QueryGetLocationArgs, 'id'>>;
  getNavLink?: Resolver<ResolversTypes['NavLink'], ParentType, ContextType, RequireFields<QueryGetNavLinkArgs, 'id'>>;
  getPerformanceReview?: Resolver<ResolversTypes['PerformanceReview'], ParentType, ContextType, RequireFields<QueryGetPerformanceReviewArgs, 'id'>>;
  getPolicy?: Resolver<ResolversTypes['Policy'], ParentType, ContextType, RequireFields<QueryGetPolicyArgs, 'id'>>;
  getPosition?: Resolver<ResolversTypes['Position'], ParentType, ContextType, RequireFields<QueryGetPositionArgs, 'id'>>;
  getProblemReport?: Resolver<ResolversTypes['ProblemReport'], ParentType, ContextType, RequireFields<QueryGetProblemReportArgs, 'id'>>;
  getProduct?: Resolver<ResolversTypes['Product'], ParentType, ContextType, RequireFields<QueryGetProductArgs, 'id'>>;
  getProject?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<QueryGetProjectArgs, 'id'>>;
  getPrompt?: Resolver<ResolversTypes['Prompt'], ParentType, ContextType, RequireFields<QueryGetPromptArgs, 'id'>>;
  getSalaryStructure?: Resolver<ResolversTypes['SalaryStructure'], ParentType, ContextType, RequireFields<QueryGetSalaryStructureArgs, 'id'>>;
  getShift?: Resolver<ResolversTypes['Shift'], ParentType, ContextType, RequireFields<QueryGetShiftArgs, 'id'>>;
  getStatusMonitor?: Resolver<ResolversTypes['StatusMonitor'], ParentType, ContextType, RequireFields<QueryGetStatusMonitorArgs, 'id'>>;
  getSupplier?: Resolver<ResolversTypes['Supplier'], ParentType, ContextType, RequireFields<QueryGetSupplierArgs, 'id'>>;
  getTeam?: Resolver<ResolversTypes['Team'], ParentType, ContextType, RequireFields<QueryGetTeamArgs, 'id'>>;
  getTool?: Resolver<ResolversTypes['Tool'], ParentType, ContextType, RequireFields<QueryGetToolArgs, 'id'>>;
  getToolCategory?: Resolver<ResolversTypes['ToolCategory'], ParentType, ContextType, RequireFields<QueryGetToolCategoryArgs, 'id'>>;
  getTraining?: Resolver<ResolversTypes['Training'], ParentType, ContextType, RequireFields<QueryGetTrainingArgs, 'id'>>;
  getUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryGetUserArgs, 'id'>>;
  getWebsiteSubmission?: Resolver<ResolversTypes['WebsiteSubmission'], ParentType, ContextType, RequireFields<QueryGetWebsiteSubmissionArgs, 'id'>>;
  hrDashboard?: Resolver<ResolversTypes['HrDashboard'], ParentType, ContextType>;
  infrastructureOverview?: Resolver<ResolversTypes['InfrastructureOverview'], ParentType, ContextType>;
  invoicePayments?: Resolver<Array<ResolversTypes['Payment']>, ParentType, ContextType, RequireFields<QueryInvoicePaymentsArgs, 'invoiceId'>>;
  leaveRequestsByEmployee?: Resolver<Array<ResolversTypes['LeaveRequest']>, ParentType, ContextType, RequireFields<QueryLeaveRequestsByEmployeeArgs, 'employeeId'>>;
  listActivities?: Resolver<Array<ResolversTypes['Activity']>, ParentType, ContextType>;
  listActivitiesPaged?: Resolver<ResolversTypes['ActivityPage'], ParentType, ContextType, RequireFields<QueryListActivitiesPagedArgs, 'input'>>;
  listActivitiesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listAiJobs?: Resolver<Array<ResolversTypes['AiJob']>, ParentType, ContextType>;
  listAiJobsPaged?: Resolver<ResolversTypes['AiJobPage'], ParentType, ContextType, RequireFields<QueryListAiJobsPagedArgs, 'input'>>;
  listAiJobsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listAnnouncements?: Resolver<Array<ResolversTypes['Announcement']>, ParentType, ContextType>;
  listAnnouncementsPaged?: Resolver<ResolversTypes['AnnouncementPage'], ParentType, ContextType, RequireFields<QueryListAnnouncementsPagedArgs, 'input'>>;
  listAnnouncementsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listAssetAssignees?: Resolver<Array<ResolversTypes['AssetAssignee']>, ParentType, ContextType>;
  listAssets?: Resolver<Array<ResolversTypes['Asset']>, ParentType, ContextType>;
  listAssetsPaged?: Resolver<ResolversTypes['AssetPage'], ParentType, ContextType, RequireFields<QueryListAssetsPagedArgs, 'input'>>;
  listAssetsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listAttendance?: Resolver<Array<ResolversTypes['Attendance']>, ParentType, ContextType>;
  listAudienceLists?: Resolver<Array<ResolversTypes['AudienceList']>, ParentType, ContextType>;
  listAudienceListsPaged?: Resolver<ResolversTypes['AudienceListPage'], ParentType, ContextType, RequireFields<QueryListAudienceListsPagedArgs, 'input'>>;
  listBenefits?: Resolver<Array<ResolversTypes['Benefit']>, ParentType, ContextType>;
  listBenefitsPaged?: Resolver<ResolversTypes['BenefitPage'], ParentType, ContextType, RequireFields<QueryListBenefitsPagedArgs, 'input'>>;
  listBenefitsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listBlogPosts?: Resolver<Array<ResolversTypes['BlogPost']>, ParentType, ContextType>;
  listBlogPostsPaged?: Resolver<ResolversTypes['BlogPostPage'], ParentType, ContextType, RequireFields<QueryListBlogPostsPagedArgs, 'input'>>;
  listBlogPostsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listBugs?: Resolver<Array<ResolversTypes['Bug']>, ParentType, ContextType>;
  listBugsPaged?: Resolver<ResolversTypes['BugPage'], ParentType, ContextType, RequireFields<QueryListBugsPagedArgs, 'input'>>;
  listBugsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listCampaignSends?: Resolver<Array<ResolversTypes['CampaignSend']>, ParentType, ContextType, RequireFields<QueryListCampaignSendsArgs, 'campaignId'>>;
  listCampaigns?: Resolver<Array<ResolversTypes['Campaign']>, ParentType, ContextType>;
  listCampaignsPaged?: Resolver<ResolversTypes['CampaignPage'], ParentType, ContextType, RequireFields<QueryListCampaignsPagedArgs, 'input'>>;
  listCampaignsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listCaseStudies?: Resolver<Array<ResolversTypes['CaseStudy']>, ParentType, ContextType>;
  listCaseStudiesPaged?: Resolver<ResolversTypes['CaseStudyPage'], ParentType, ContextType, RequireFields<QueryListCaseStudiesPagedArgs, 'input'>>;
  listCaseStudiesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listClients?: Resolver<Array<ResolversTypes['Client']>, ParentType, ContextType>;
  listClientsPaged?: Resolver<ResolversTypes['ClientPage'], ParentType, ContextType, RequireFields<QueryListClientsPagedArgs, 'input'>>;
  listClientsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listCompanies?: Resolver<Array<ResolversTypes['Company']>, ParentType, ContextType>;
  listCompaniesPaged?: Resolver<ResolversTypes['CompanyPage'], ParentType, ContextType, RequireFields<QueryListCompaniesPagedArgs, 'input'>>;
  listCompaniesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listCompanyExpenses?: Resolver<Array<ResolversTypes['CompanyExpense']>, ParentType, ContextType>;
  listCompanyExpensesPaged?: Resolver<ResolversTypes['CompanyExpensePage'], ParentType, ContextType, RequireFields<QueryListCompanyExpensesPagedArgs, 'input'>>;
  listCompanyExpensesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listContacts?: Resolver<Array<ResolversTypes['Contact']>, ParentType, ContextType>;
  listContactsPaged?: Resolver<ResolversTypes['ContactPage'], ParentType, ContextType, RequireFields<QueryListContactsPagedArgs, 'input'>>;
  listContactsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listContracts?: Resolver<Array<ResolversTypes['Contract']>, ParentType, ContextType>;
  listContractsPaged?: Resolver<ResolversTypes['ContractPage'], ParentType, ContextType, RequireFields<QueryListContractsPagedArgs, 'input'>>;
  listContractsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listDeals?: Resolver<Array<ResolversTypes['Deal']>, ParentType, ContextType>;
  listDealsPaged?: Resolver<ResolversTypes['DealPage'], ParentType, ContextType, RequireFields<QueryListDealsPagedArgs, 'input'>>;
  listDealsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listDepartments?: Resolver<Array<ResolversTypes['Department']>, ParentType, ContextType>;
  listEmailConfigs?: Resolver<Array<ResolversTypes['EmailConfig']>, ParentType, ContextType>;
  listEmailFragments?: Resolver<Array<ResolversTypes['EmailFragment']>, ParentType, ContextType>;
  listEmailFragmentsPaged?: Resolver<ResolversTypes['EmailFragmentPage'], ParentType, ContextType, RequireFields<QueryListEmailFragmentsPagedArgs, 'input'>>;
  listEmailFragmentsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listEmailLogsPaged?: Resolver<ResolversTypes['EmailLogPage'], ParentType, ContextType, RequireFields<QueryListEmailLogsPagedArgs, 'input'>>;
  listEmailLogsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listEmailTemplates?: Resolver<Array<ResolversTypes['EmailTemplate']>, ParentType, ContextType>;
  listEmailTemplatesPaged?: Resolver<ResolversTypes['EmailTemplatePage'], ParentType, ContextType, RequireFields<QueryListEmailTemplatesPagedArgs, 'input'>>;
  listEmailTemplatesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listEmployeeDocuments?: Resolver<Array<ResolversTypes['EmployeeDocument']>, ParentType, ContextType>;
  listEmployeeDocumentsPaged?: Resolver<ResolversTypes['EmployeeDocumentPage'], ParentType, ContextType, RequireFields<QueryListEmployeeDocumentsPagedArgs, 'input'>>;
  listEmployeeDocumentsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listEmployeeRequests?: Resolver<Array<ResolversTypes['EmployeeRequest']>, ParentType, ContextType>;
  listEmployeeRequestsPaged?: Resolver<ResolversTypes['EmployeeRequestPage'], ParentType, ContextType, RequireFields<QueryListEmployeeRequestsPagedArgs, 'input'>>;
  listEmployeeRequestsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listEmploymentTypes?: Resolver<Array<ResolversTypes['EmploymentType']>, ParentType, ContextType>;
  listEmploymentTypesPaged?: Resolver<ResolversTypes['EmploymentTypePage'], ParentType, ContextType, RequireFields<QueryListEmploymentTypesPagedArgs, 'input'>>;
  listEmploymentTypesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listExitRecords?: Resolver<Array<ResolversTypes['ExitRecord']>, ParentType, ContextType>;
  listExitRecordsPaged?: Resolver<ResolversTypes['ExitRecordPage'], ParentType, ContextType, RequireFields<QueryListExitRecordsPagedArgs, 'input'>>;
  listExitRecordsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listExpenseClaims?: Resolver<Array<ResolversTypes['ExpenseClaim']>, ParentType, ContextType>;
  listExpenseClaimsPaged?: Resolver<ResolversTypes['ExpenseClaimPage'], ParentType, ContextType, RequireFields<QueryListExpenseClaimsPagedArgs, 'input'>>;
  listExpenseClaimsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listGigs?: Resolver<Array<ResolversTypes['Gig']>, ParentType, ContextType>;
  listGigsPaged?: Resolver<ResolversTypes['GigPage'], ParentType, ContextType, RequireFields<QueryListGigsPagedArgs, 'input'>>;
  listGigsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listGithubConfigs?: Resolver<Array<ResolversTypes['GithubConfig']>, ParentType, ContextType>;
  listGoals?: Resolver<Array<ResolversTypes['Goal']>, ParentType, ContextType>;
  listGoalsPaged?: Resolver<ResolversTypes['GoalPage'], ParentType, ContextType, RequireFields<QueryListGoalsPagedArgs, 'input'>>;
  listGoalsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listGrades?: Resolver<Array<ResolversTypes['Grade']>, ParentType, ContextType>;
  listGradesPaged?: Resolver<ResolversTypes['GradePage'], ParentType, ContextType, RequireFields<QueryListGradesPagedArgs, 'input'>>;
  listGradesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listHolidays?: Resolver<Array<ResolversTypes['Holiday']>, ParentType, ContextType>;
  listHolidaysPaged?: Resolver<ResolversTypes['HolidayPage'], ParentType, ContextType, RequireFields<QueryListHolidaysPagedArgs, 'input'>>;
  listHolidaysStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listImageConfigs?: Resolver<Array<ResolversTypes['ImageConfig']>, ParentType, ContextType>;
  listInvoices?: Resolver<Array<ResolversTypes['Invoice']>, ParentType, ContextType>;
  listInvoicesPaged?: Resolver<ResolversTypes['InvoicePage'], ParentType, ContextType, RequireFields<QueryListInvoicesPagedArgs, 'input'>>;
  listInvoicesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listJobCompanies?: Resolver<Array<ResolversTypes['JobCompany']>, ParentType, ContextType>;
  listJobCompaniesPaged?: Resolver<ResolversTypes['JobCompanyPage'], ParentType, ContextType, RequireFields<QueryListJobCompaniesPagedArgs, 'input'>>;
  listJobCompaniesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listJobs?: Resolver<Array<ResolversTypes['Job']>, ParentType, ContextType>;
  listJobsPaged?: Resolver<ResolversTypes['JobPage'], ParentType, ContextType, RequireFields<QueryListJobsPagedArgs, 'input'>>;
  listJobsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listLeads?: Resolver<Array<ResolversTypes['Lead']>, ParentType, ContextType>;
  listLeadsPaged?: Resolver<ResolversTypes['LeadPage'], ParentType, ContextType, RequireFields<QueryListLeadsPagedArgs, 'input'>>;
  listLeadsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listLeaveBalances?: Resolver<Array<ResolversTypes['LeaveBalance']>, ParentType, ContextType>;
  listLeaveBalancesPaged?: Resolver<ResolversTypes['LeaveBalancePage'], ParentType, ContextType, RequireFields<QueryListLeaveBalancesPagedArgs, 'input'>>;
  listLeaveBalancesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listLeavePolicies?: Resolver<Array<ResolversTypes['LeavePolicy']>, ParentType, ContextType>;
  listLeavePoliciesPaged?: Resolver<ResolversTypes['LeavePolicyPage'], ParentType, ContextType, RequireFields<QueryListLeavePoliciesPagedArgs, 'input'>>;
  listLeavePoliciesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listLeaveRequests?: Resolver<Array<ResolversTypes['LeaveRequest']>, ParentType, ContextType>;
  listLegalDocuments?: Resolver<Array<ResolversTypes['LegalDocument']>, ParentType, ContextType>;
  listLegalDocumentsPaged?: Resolver<ResolversTypes['LegalDocumentPage'], ParentType, ContextType, RequireFields<QueryListLegalDocumentsPagedArgs, 'input'>>;
  listLegalDocumentsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listLicences?: Resolver<Array<ResolversTypes['Licence']>, ParentType, ContextType>;
  listLicencesPaged?: Resolver<ResolversTypes['LicencePage'], ParentType, ContextType, RequireFields<QueryListLicencesPagedArgs, 'input'>>;
  listLicencesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listLocations?: Resolver<Array<ResolversTypes['Location']>, ParentType, ContextType>;
  listLocationsPaged?: Resolver<ResolversTypes['LocationPage'], ParentType, ContextType, RequireFields<QueryListLocationsPagedArgs, 'input'>>;
  listLocationsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listNavLinks?: Resolver<Array<ResolversTypes['NavLink']>, ParentType, ContextType>;
  listOpenAiConfigs?: Resolver<Array<ResolversTypes['OpenAiConfig']>, ParentType, ContextType>;
  listPayments?: Resolver<Array<ResolversTypes['Payment']>, ParentType, ContextType>;
  listPaymentsPaged?: Resolver<ResolversTypes['PaymentPage'], ParentType, ContextType, RequireFields<QueryListPaymentsPagedArgs, 'input'>>;
  listPaymentsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listPerformanceReviews?: Resolver<Array<ResolversTypes['PerformanceReview']>, ParentType, ContextType>;
  listPerformanceReviewsPaged?: Resolver<ResolversTypes['PerformanceReviewPage'], ParentType, ContextType, RequireFields<QueryListPerformanceReviewsPagedArgs, 'input'>>;
  listPerformanceReviewsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listPermissionModules?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  listPexelsConfigs?: Resolver<Array<ResolversTypes['PexelsConfig']>, ParentType, ContextType>;
  listPolicies?: Resolver<Array<ResolversTypes['Policy']>, ParentType, ContextType>;
  listPoliciesPaged?: Resolver<ResolversTypes['PolicyPage'], ParentType, ContextType, RequireFields<QueryListPoliciesPagedArgs, 'input'>>;
  listPoliciesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listPositions?: Resolver<Array<ResolversTypes['Position']>, ParentType, ContextType>;
  listProblemReports?: Resolver<Array<ResolversTypes['ProblemReport']>, ParentType, ContextType>;
  listProblemReportsPaged?: Resolver<ResolversTypes['ProblemReportPage'], ParentType, ContextType, RequireFields<QueryListProblemReportsPagedArgs, 'input'>>;
  listProblemReportsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listProducts?: Resolver<Array<ResolversTypes['Product']>, ParentType, ContextType>;
  listProductsPaged?: Resolver<ResolversTypes['ProductPage'], ParentType, ContextType, RequireFields<QueryListProductsPagedArgs, 'input'>>;
  listProductsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listProjectMembers?: Resolver<Array<ResolversTypes['ProjectMember']>, ParentType, ContextType>;
  listProjects?: Resolver<Array<ResolversTypes['Project']>, ParentType, ContextType>;
  listProjectsPaged?: Resolver<ResolversTypes['ProjectPage'], ParentType, ContextType, RequireFields<QueryListProjectsPagedArgs, 'input'>>;
  listProjectsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listPrompts?: Resolver<Array<ResolversTypes['Prompt']>, ParentType, ContextType>;
  listPromptsPaged?: Resolver<ResolversTypes['PromptPage'], ParentType, ContextType, RequireFields<QueryListPromptsPagedArgs, 'input'>>;
  listPromptsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listRolePermissions?: Resolver<Array<ResolversTypes['RolePermission']>, ParentType, ContextType>;
  listSalarySlipsPaged?: Resolver<ResolversTypes['SalarySlipPage'], ParentType, ContextType, RequireFields<QueryListSalarySlipsPagedArgs, 'input'>>;
  listSalarySlipsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listSalaryStructures?: Resolver<Array<ResolversTypes['SalaryStructure']>, ParentType, ContextType>;
  listSalaryStructuresPaged?: Resolver<ResolversTypes['SalaryStructurePage'], ParentType, ContextType, RequireFields<QueryListSalaryStructuresPagedArgs, 'input'>>;
  listSalaryStructuresStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listShifts?: Resolver<Array<ResolversTypes['Shift']>, ParentType, ContextType>;
  listShiftsPaged?: Resolver<ResolversTypes['ShiftPage'], ParentType, ContextType, RequireFields<QueryListShiftsPagedArgs, 'input'>>;
  listShiftsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listSlackChannels?: Resolver<Array<ResolversTypes['SlackChannel']>, ParentType, ContextType>;
  listSlackConfigs?: Resolver<Array<ResolversTypes['SlackConfig']>, ParentType, ContextType>;
  listStatusMonitors?: Resolver<Array<ResolversTypes['StatusMonitor']>, ParentType, ContextType>;
  listStatusMonitorsPaged?: Resolver<ResolversTypes['StatusMonitorPage'], ParentType, ContextType, RequireFields<QueryListStatusMonitorsPagedArgs, 'input'>>;
  listStatusMonitorsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listStockMovements?: Resolver<Array<ResolversTypes['StockMovement']>, ParentType, ContextType>;
  listStockMovementsPaged?: Resolver<ResolversTypes['StockMovementPage'], ParentType, ContextType, RequireFields<QueryListStockMovementsPagedArgs, 'input'>>;
  listStockMovementsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listSuppliers?: Resolver<Array<ResolversTypes['Supplier']>, ParentType, ContextType>;
  listSuppliersPaged?: Resolver<ResolversTypes['SupplierPage'], ParentType, ContextType, RequireFields<QueryListSuppliersPagedArgs, 'input'>>;
  listSuppliersStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listSupportAgents?: Resolver<Array<ResolversTypes['SupportAgent']>, ParentType, ContextType>;
  listSupportReplies?: Resolver<Array<ResolversTypes['SupportReply']>, ParentType, ContextType, RequireFields<QueryListSupportRepliesArgs, 'ticketId'>>;
  listSupportTickets?: Resolver<Array<ResolversTypes['SupportTicket']>, ParentType, ContextType>;
  listTeams?: Resolver<Array<ResolversTypes['Team']>, ParentType, ContextType>;
  listTeamsPaged?: Resolver<ResolversTypes['TeamPage'], ParentType, ContextType, RequireFields<QueryListTeamsPagedArgs, 'input'>>;
  listTeamsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listToolCategories?: Resolver<Array<ResolversTypes['ToolCategory']>, ParentType, ContextType>;
  listTools?: Resolver<Array<ResolversTypes['Tool']>, ParentType, ContextType>;
  listToolsPaged?: Resolver<ResolversTypes['ToolPage'], ParentType, ContextType, RequireFields<QueryListToolsPagedArgs, 'input'>>;
  listToolsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listTrackerBuilds?: Resolver<Array<ResolversTypes['TrackerBuild']>, ParentType, ContextType>;
  listTrainings?: Resolver<Array<ResolversTypes['Training']>, ParentType, ContextType>;
  listTrainingsPaged?: Resolver<ResolversTypes['TrainingPage'], ParentType, ContextType, RequireFields<QueryListTrainingsPagedArgs, 'input'>>;
  listTrainingsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listUsers?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  listUsersPaged?: Resolver<ResolversTypes['UserPage'], ParentType, ContextType, RequireFields<QueryListUsersPagedArgs, 'input'>>;
  listUsersStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listWebsiteSubmissions?: Resolver<Array<ResolversTypes['WebsiteSubmission']>, ParentType, ContextType>;
  me?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  myAttendance?: Resolver<Array<ResolversTypes['Attendance']>, ParentType, ContextType>;
  myBenefits?: Resolver<Array<ResolversTypes['Benefit']>, ParentType, ContextType>;
  myDocuments?: Resolver<Array<ResolversTypes['EmployeeDocument']>, ParentType, ContextType>;
  myExitRecord?: Resolver<Maybe<ResolversTypes['ExitRecord']>, ParentType, ContextType>;
  myExpenseClaims?: Resolver<Array<ResolversTypes['ExpenseClaim']>, ParentType, ContextType>;
  myGoals?: Resolver<Array<ResolversTypes['Goal']>, ParentType, ContextType>;
  myLeaveBalances?: Resolver<Array<ResolversTypes['LeaveBalance']>, ParentType, ContextType>;
  myLeaveRequests?: Resolver<Array<ResolversTypes['LeaveRequest']>, ParentType, ContextType>;
  myNotifications?: Resolver<Array<ResolversTypes['Notification']>, ParentType, ContextType>;
  myPayroll?: Resolver<Maybe<ResolversTypes['SalaryStructure']>, ParentType, ContextType>;
  myPerformanceReviews?: Resolver<Array<ResolversTypes['PerformanceReview']>, ParentType, ContextType>;
  myPolicies?: Resolver<Array<ResolversTypes['MyPolicy']>, ParentType, ContextType>;
  myPolicy?: Resolver<Maybe<ResolversTypes['MyPolicy']>, ParentType, ContextType, RequireFields<QueryMyPolicyArgs, 'slug'>>;
  myRequests?: Resolver<Array<ResolversTypes['EmployeeRequest']>, ParentType, ContextType>;
  mySalarySlips?: Resolver<Array<ResolversTypes['SalarySlip']>, ParentType, ContextType>;
  mySupportTickets?: Resolver<Array<ResolversTypes['SupportTicket']>, ParentType, ContextType>;
  myTrackerAccess?: Resolver<Maybe<ResolversTypes['TrackerAccess']>, ParentType, ContextType>;
  myTrackerCalendar?: Resolver<Array<ResolversTypes['TrackerDayBucket']>, ParentType, ContextType, RequireFields<QueryMyTrackerCalendarArgs, 'from' | 'timezone' | 'to'>>;
  myTrackerDay?: Resolver<ResolversTypes['TrackerDay'], ParentType, ContextType, RequireFields<QueryMyTrackerDayArgs, 'end' | 'start'>>;
  myTrackerManualEntries?: Resolver<Array<ResolversTypes['TrackerManualEntry']>, ParentType, ContextType, RequireFields<QueryMyTrackerManualEntriesArgs, 'from' | 'to'>>;
  myTrackerTotals?: Resolver<ResolversTypes['TrackerTotals'], ParentType, ContextType>;
  myTrainings?: Resolver<Array<ResolversTypes['Training']>, ParentType, ContextType>;
  myUnreadNotificationCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  payrollSchedule?: Resolver<ResolversTypes['PayrollSchedule'], ParentType, ContextType>;
  payrollSummary?: Resolver<ResolversTypes['PayrollSummary'], ParentType, ContextType, RequireFields<QueryPayrollSummaryArgs, 'month' | 'year'>>;
  policyAcknowledgements?: Resolver<Array<ResolversTypes['PolicyAcknowledgement']>, ParentType, ContextType, RequireFields<QueryPolicyAcknowledgementsArgs, 'policyId'>>;
  previewEmailTemplate?: Resolver<ResolversTypes['EmailPreview'], ParentType, ContextType, RequireFields<QueryPreviewEmailTemplateArgs, 'key'>>;
  projectBoard?: Resolver<ResolversTypes['ProjectBoard'], ParentType, ContextType, RequireFields<QueryProjectBoardArgs, 'projectId'>>;
  projectDocPages?: Resolver<Array<ResolversTypes['DocPage']>, ParentType, ContextType, RequireFields<QueryProjectDocPagesArgs, 'projectId'>>;
  projectTasks?: Resolver<Array<ResolversTypes['Task']>, ParentType, ContextType, RequireFields<QueryProjectTasksArgs, 'projectId'>>;
  publicBlogPost?: Resolver<Maybe<ResolversTypes['BlogPost']>, ParentType, ContextType, RequireFields<QueryPublicBlogPostArgs, 'slug'>>;
  publicBlogPosts?: Resolver<Array<ResolversTypes['BlogPost']>, ParentType, ContextType>;
  publicBranding?: Resolver<ResolversTypes['Branding'], ParentType, ContextType>;
  publicCaseStudies?: Resolver<Array<ResolversTypes['CaseStudy']>, ParentType, ContextType>;
  publicCaseStudy?: Resolver<Maybe<ResolversTypes['CaseStudy']>, ParentType, ContextType, RequireFields<QueryPublicCaseStudyArgs, 'slug'>>;
  publicGig?: Resolver<Maybe<ResolversTypes['Gig']>, ParentType, ContextType, RequireFields<QueryPublicGigArgs, 'gigCode'>>;
  publicGigs?: Resolver<Array<ResolversTypes['Gig']>, ParentType, ContextType>;
  publicJob?: Resolver<Maybe<ResolversTypes['Job']>, ParentType, ContextType, RequireFields<QueryPublicJobArgs, 'jobCode'>>;
  publicJobCompanies?: Resolver<Array<ResolversTypes['JobCompany']>, ParentType, ContextType>;
  publicJobCompany?: Resolver<Maybe<ResolversTypes['JobCompany']>, ParentType, ContextType, RequireFields<QueryPublicJobCompanyArgs, 'slug'>>;
  publicJobs?: Resolver<Array<ResolversTypes['Job']>, ParentType, ContextType, Partial<QueryPublicJobsArgs>>;
  publicNavLinks?: Resolver<Array<ResolversTypes['NavLink']>, ParentType, ContextType>;
  publicPolicies?: Resolver<Array<ResolversTypes['PublicPolicy']>, ParentType, ContextType>;
  publicPolicy?: Resolver<Maybe<ResolversTypes['PublicPolicy']>, ParentType, ContextType, RequireFields<QueryPublicPolicyArgs, 'slug'>>;
  publicTool?: Resolver<Maybe<ResolversTypes['Tool']>, ParentType, ContextType, RequireFields<QueryPublicToolArgs, 'toolCode'>>;
  publicToolCategories?: Resolver<Array<ResolversTypes['ToolCategory']>, ParentType, ContextType>;
  publicTools?: Resolver<Array<ResolversTypes['Tool']>, ParentType, ContextType, Partial<QueryPublicToolsArgs>>;
  receivables?: Resolver<ResolversTypes['Receivables'], ParentType, ContextType>;
  salarySlipPdf?: Resolver<ResolversTypes['SalarySlipDownload'], ParentType, ContextType, RequireFields<QuerySalarySlipPdfArgs, 'id'>>;
  searchPexelsPhotos?: Resolver<Array<ResolversTypes['PexelsMedia']>, ParentType, ContextType, RequireFields<QuerySearchPexelsPhotosArgs, 'query'>>;
  searchPexelsVideos?: Resolver<Array<ResolversTypes['PexelsMedia']>, ParentType, ContextType, RequireFields<QuerySearchPexelsVideosArgs, 'query'>>;
  statusOverview?: Resolver<ResolversTypes['StatusOverview'], ParentType, ContextType, Partial<QueryStatusOverviewArgs>>;
  taskActivity?: Resolver<Array<ResolversTypes['TaskActivity']>, ParentType, ContextType, RequireFields<QueryTaskActivityArgs, 'taskId'>>;
  taskComments?: Resolver<Array<ResolversTypes['TaskComment']>, ParentType, ContextType, RequireFields<QueryTaskCommentsArgs, 'taskId'>>;
  trackerAccessList?: Resolver<Array<ResolversTypes['TrackerAccess']>, ParentType, ContextType>;
  trackerBilling?: Resolver<ResolversTypes['TrackerBilling'], ParentType, ContextType, RequireFields<QueryTrackerBillingArgs, 'from' | 'to'>>;
  trackerBuildSettings?: Resolver<ResolversTypes['TrackerBuildSettings'], ParentType, ContextType>;
  trackerCalendar?: Resolver<Array<ResolversTypes['TrackerDayBucket']>, ParentType, ContextType, RequireFields<QueryTrackerCalendarArgs, 'from' | 'timezone' | 'to' | 'userId'>>;
  trackerDay?: Resolver<ResolversTypes['TrackerDay'], ParentType, ContextType, RequireFields<QueryTrackerDayArgs, 'end' | 'start' | 'userId'>>;
  trackerDevices?: Resolver<Array<ResolversTypes['TrackerDevice']>, ParentType, ContextType, Partial<QueryTrackerDevicesArgs>>;
  trackerLatestRelease?: Resolver<Maybe<ResolversTypes['TrackerRelease']>, ParentType, ContextType>;
  trackerManualEntries?: Resolver<Array<ResolversTypes['TrackerManualEntry']>, ParentType, ContextType, RequireFields<QueryTrackerManualEntriesArgs, 'from' | 'to' | 'userId'>>;
  trackerMe?: Resolver<ResolversTypes['TrackerMe'], ParentType, ContextType>;
  trackerPendingManualEntries?: Resolver<Array<ResolversTypes['TrackerManualEntry']>, ParentType, ContextType>;
  trackerProjectOptions?: Resolver<Array<ResolversTypes['TrackerProject']>, ParentType, ContextType>;
  trackerSettings?: Resolver<ResolversTypes['TrackerSettings'], ParentType, ContextType>;
  trackerTotals?: Resolver<ResolversTypes['TrackerTotals'], ParentType, ContextType, RequireFields<QueryTrackerTotalsArgs, 'userId'>>;
}>;

export type ReceivablesResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Receivables'] = ResolversParentTypes['Receivables']> = ResolversObject<{
  buckets?: Resolver<Array<ResolversTypes['ReceivablesBucket']>, ParentType, ContextType>;
  invoices?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  outstanding?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  overdue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ReceivablesBucketResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ReceivablesBucket'] = ResolversParentTypes['ReceivablesBucket']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  band?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  invoices?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RolePermissionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RolePermission'] = ResolversParentTypes['RolePermission']> = ResolversObject<{
  actions?: Resolver<Array<ResolversTypes['PermissionAction']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  module?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SalarySlipResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SalarySlip'] = ResolversParentTypes['SalarySlip']> = ResolversObject<{
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  deductions?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gross?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  issuedDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  month?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  net?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SlipStatus'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SalarySlipDownloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SalarySlipDownload'] = ResolversParentTypes['SalarySlipDownload']> = ResolversObject<{
  contentBase64?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contentType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SalarySlipPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SalarySlipPage'] = ResolversParentTypes['SalarySlipPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['SalarySlip']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SalaryStructureResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SalaryStructure'] = ResolversParentTypes['SalaryStructure']> = ResolversObject<{
  allowances?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  basic?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  billingRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  deductions?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  effectiveFrom?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gross?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  hra?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  net?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  payType?: Resolver<ResolversTypes['PayType'], ParentType, ContextType>;
  payTypeNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SalaryStructurePageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SalaryStructurePage'] = ResolversParentTypes['SalaryStructurePage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['SalaryStructure']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SendNotificationResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SendNotificationResult'] = ResolversParentTypes['SendNotificationResult']> = ResolversObject<{
  recipients?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServerRuntimeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServerRuntime'] = ResolversParentTypes['ServerRuntime']> = ResolversObject<{
  arch?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  environment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  heapTotalBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  heapUsedBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  hostname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  load1?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  load5?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  load15?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  nodeVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  platform?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  processUptimeSeconds?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rssBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Shift'] = ResolversParentTypes['Shift']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  breakMinutes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  graceMinutes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ShiftPage'] = ResolversParentTypes['ShiftPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Shift']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SlackChannelResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SlackChannel'] = ResolversParentTypes['SlackChannel']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isMember?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isPrivate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SlackConfigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SlackConfig'] = ResolversParentTypes['SlackConfig']> = ResolversObject<{
  botToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  defaultChannel?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StatBucketResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StatBucket'] = ResolversParentTypes['StatBucket']> = ResolversObject<{
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StatFieldCountsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StatFieldCounts'] = ResolversParentTypes['StatFieldCounts']> = ResolversObject<{
  buckets?: Resolver<Array<ResolversTypes['StatBucket']>, ParentType, ContextType>;
  field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StatFieldSumResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StatFieldSum'] = ResolversParentTypes['StatFieldSum']> = ResolversObject<{
  field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StatusDayPointResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StatusDayPoint'] = ResolversParentTypes['StatusDayPoint']> = ResolversObject<{
  avgResponseMs?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  checks?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  failures?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  uptimePercent?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StatusIncidentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StatusIncident'] = ResolversParentTypes['StatusIncident']> = ResolversObject<{
  durationMinutes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resolvedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  serviceKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['StatusState'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StatusMonitorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StatusMonitor'] = ResolversParentTypes['StatusMonitor']> = ResolversObject<{
  category?: Resolver<ResolversTypes['StatusCategory'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastCheckedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  lastError?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastHttpStatus?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lastResponseMs?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['StatusState'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StatusMonitorPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StatusMonitorPage'] = ResolversParentTypes['StatusMonitorPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['StatusMonitor']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StatusOverviewResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StatusOverview'] = ResolversParentTypes['StatusOverview']> = ResolversObject<{
  avgResponseMs?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  checkIntervalMinutes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  daily?: Resolver<Array<ResolversTypes['StatusDayPoint']>, ParentType, ContextType>;
  degraded?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  down?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  generatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  incidents?: Resolver<Array<ResolversTypes['StatusIncident']>, ParentType, ContextType>;
  operational?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  services?: Resolver<Array<ResolversTypes['StatusServiceSummary']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['StatusState'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  uptime30d?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  uptimeToday?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StatusServiceSummaryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StatusServiceSummary'] = ResolversParentTypes['StatusServiceSummary']> = ResolversObject<{
  category?: Resolver<ResolversTypes['StatusCategory'], ParentType, ContextType>;
  days?: Resolver<Array<ResolversTypes['StatusDayPoint']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastCheckedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  lastError?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  responseMs?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['StatusState'], ParentType, ContextType>;
  uptime30d?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  uptimeToday?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StockMovementResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StockMovement'] = ResolversParentTypes['StockMovement']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['MovementReason'], ParentType, ContextType>;
  recordedBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stockAfter?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  supplierId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  supplierName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StockMovementPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StockMovementPage'] = ResolversParentTypes['StockMovementPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['StockMovement']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SupplierResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Supplier'] = ResolversParentTypes['Supplier']> = ResolversObject<{
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contactName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SupplierStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SupplierPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SupplierPage'] = ResolversParentTypes['SupplierPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Supplier']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SupportAgentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SupportAgent'] = ResolversParentTypes['SupportAgent']> = ResolversObject<{
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SupportReplyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SupportReply'] = ResolversParentTypes['SupportReply']> = ResolversObject<{
  authorId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  authorName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  internal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  ticketId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SupportTicketResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SupportTicket'] = ResolversParentTypes['SupportTicket']> = ResolversObject<{
  assigneeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  assigneeName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['SupportCategory'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  employeeName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['SupportPriority'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SupportStatus'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TableStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TableStats'] = ResolversParentTypes['TableStats']> = ResolversObject<{
  counts?: Resolver<Array<ResolversTypes['StatFieldCounts']>, ParentType, ContextType>;
  sums?: Resolver<Array<ResolversTypes['StatFieldSum']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TaskResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Task'] = ResolversParentTypes['Task']> = ResolversObject<{
  assigneeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  assigneeName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  columnId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dueDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  labels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['TaskPriority'], ParentType, ContextType>;
  reporterName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  storyPoints?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['TaskType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TaskActivityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TaskActivity'] = ResolversParentTypes['TaskActivity']> = ResolversObject<{
  actorName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fromValue?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  taskId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  toValue?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TaskCommentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TaskComment'] = ResolversParentTypes['TaskComment']> = ResolversObject<{
  authorId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  authorName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  taskId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TeamResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  department?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  leadEmployeeId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TeamPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TeamPage'] = ResolversParentTypes['TeamPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Team']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ToolResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Tool'] = ResolversParentTypes['Tool']> = ResolversObject<{
  categorySlug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  features?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isMVP?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  keywords?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  longDescription?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pricing?: Resolver<Maybe<ResolversTypes['ToolPricing']>, ParentType, ContextType>;
  seo?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  toolCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  useCases?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ToolCategoryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ToolCategory'] = ResolversParentTypes['ToolCategory']> = ResolversObject<{
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  seo?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ToolPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ToolPage'] = ResolversParentTypes['ToolPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Tool']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ToolPricingResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ToolPricing'] = ResolversParentTypes['ToolPricing']> = ResolversObject<{
  alterationNote?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  features?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerAccessResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerAccess'] = ResolversParentTypes['TrackerAccess']> = ResolversObject<{
  consentedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  grantedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  grantedBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  revokedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerAppUsageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerAppUsage'] = ResolversParentTypes['TrackerAppUsage']> = ResolversObject<{
  appName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  durationMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerBillingResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerBilling'] = ResolversParentTypes['TrackerBilling']> = ResolversObject<{
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  from?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  rows?: Resolver<Array<ResolversTypes['TrackerBillingRow']>, ParentType, ContextType>;
  to?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  totalAmount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalHours?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerBillingRowResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerBillingRow'] = ResolversParentTypes['TrackerBillingRow']> = ResolversObject<{
  activeMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  billingRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hours?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  manualMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  payType?: Resolver<ResolversTypes['PayType'], ParentType, ContextType>;
  rated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerBuildResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerBuild'] = ResolversParentTypes['TrackerBuild']> = ResolversObject<{
  branch?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  conclusion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerBuildSettingsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerBuildSettings'] = ResolversParentTypes['TrackerBuildSettings']> = ResolversObject<{
  slackChannels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerConsentPolicyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerConsentPolicy'] = ResolversParentTypes['TrackerConsentPolicy']> = ResolversObject<{
  acknowledged?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  acknowledgedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  requiresAcknowledgement?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerDayResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerDay'] = ResolversParentTypes['TrackerDay']> = ResolversObject<{
  appUsage?: Resolver<Array<ResolversTypes['TrackerAppUsage']>, ParentType, ContextType>;
  intervals?: Resolver<Array<ResolversTypes['TrackerInterval']>, ParentType, ContextType>;
  screenshots?: Resolver<Array<ResolversTypes['TrackerScreenshot']>, ParentType, ContextType>;
  sessions?: Resolver<Array<ResolversTypes['TrackerSession']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerDayBucketResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerDayBucket'] = ResolversParentTypes['TrackerDayBucket']> = ResolversObject<{
  activeMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  idleMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  keyCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  manualMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  mouseCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sessions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerDeviceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerDevice'] = ResolversParentTypes['TrackerDevice']> = ResolversObject<{
  appVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  arch?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  cpuCores?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  cpuModel?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hostname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  issuedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lastSeenAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  locale?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  machineId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  osName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  osVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  platform?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  revokedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  screenCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  screenResolution?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalMemoryMb?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerIntervalResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerInterval'] = ResolversParentTypes['TrackerInterval']> = ResolversObject<{
  activeMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  activityPercent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  endedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  idleMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  keyCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  mouseCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sessionId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerLoginPayloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerLoginPayload'] = ResolversParentTypes['TrackerLoginPayload']> = ResolversObject<{
  consentRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['TrackerSettings'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerManualEntryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerManualEntry'] = ResolversParentTypes['TrackerManualEntry']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  durationMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  endedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  note?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  projectName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reviewNote?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reviewedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  reviewedBy?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TrackerManualEntryStatus'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  userName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerMeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerMe'] = ResolversParentTypes['TrackerMe']> = ResolversObject<{
  consentPolicy?: Resolver<Maybe<ResolversTypes['TrackerConsentPolicy']>, ParentType, ContextType>;
  consentRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  projects?: Resolver<Array<ResolversTypes['TrackerProject']>, ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['TrackerSettings'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  workProfile?: Resolver<ResolversTypes['TrackerWorkProfile'], ParentType, ContextType>;
  workday?: Resolver<ResolversTypes['TrackerWorkday'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerProjectResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerProject'] = ResolversParentTypes['TrackerProject']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerReleaseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerRelease'] = ResolversParentTypes['TrackerRelease']> = ResolversObject<{
  assets?: Resolver<Array<ResolversTypes['TrackerReleaseAsset']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  publishedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  tag?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerReleaseAssetResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerReleaseAsset'] = ResolversParentTypes['TrackerReleaseAsset']> = ResolversObject<{
  downloadCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  platform?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerScreenshotResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerScreenshot'] = ResolversParentTypes['TrackerScreenshot']> = ResolversObject<{
  activityPercent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  blurred?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  capturedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  displayId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intervalStartedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  sessionId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerSessionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerSession'] = ResolversParentTypes['TrackerSession']> = ResolversObject<{
  activeMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  idleMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  keyCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  mouseCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerSettingsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerSettings'] = ResolversParentTypes['TrackerSettings']> = ResolversObject<{
  autoStartEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  autoStartHour?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  autoStopHour?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  blurScreenshots?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  consentPolicySlug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  consentText?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dailyDigestEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  defaultTimezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  digestHour?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  idleThresholdSeconds?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  intervalMinutes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  randomizeScreenshotTiming?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  screenshotMaxWidth?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  screenshotQuality?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  screenshotRetentionDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  screenshotsPerInterval?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  syncIntervalMinutes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  trackWindowTitles?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  webcamCorner?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  webcamEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  weeklyDigestEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerTotalsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerTotals'] = ResolversParentTypes['TrackerTotals']> = ResolversObject<{
  activeMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  idleMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  manualMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  screenshots?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sessions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerWorkProfileResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerWorkProfile'] = ResolversParentTypes['TrackerWorkProfile']> = ResolversObject<{
  targetMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  workHoursPerDay?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  workLocation?: Resolver<ResolversTypes['WorkLocation'], ParentType, ContextType>;
  workLocationNote?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workingTime?: Resolver<ResolversTypes['WorkingTime'], ParentType, ContextType>;
  workingTimeNote?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerWorkdayResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerWorkday'] = ResolversParentTypes['TrackerWorkday']> = ResolversObject<{
  activeMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  attendanceMarked?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  attendanceNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  attendanceStatus?: Resolver<Maybe<ResolversTypes['AttendanceStatus']>, ParentType, ContextType>;
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  manualMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  targetMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrainingResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Training'] = ResolversParentTypes['Training']> = ResolversObject<{
  assignedOn?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  certificateUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  completedOn?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  dueOn?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TrainingStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrainingPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrainingPage'] = ResolversParentTypes['TrainingPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['Training']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  avatarUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  blockReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  brief?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  dateOfBirth?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  department?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  designation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  employmentStatus?: Resolver<ResolversTypes['EmploymentStatus'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isBlocked?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  joinDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  workHoursPerDay?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  workLocation?: Resolver<Maybe<ResolversTypes['WorkLocation']>, ParentType, ContextType>;
  workLocationNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  workingTime?: Resolver<Maybe<ResolversTypes['WorkingTime']>, ParentType, ContextType>;
  workingTimeNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserCredentialsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserCredentials'] = ResolversParentTypes['UserCredentials']> = ResolversObject<{
  password?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserPage'] = ResolversParentTypes['UserPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WebsiteSubmissionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WebsiteSubmission'] = ResolversParentTypes['WebsiteSubmission']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  formType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  submissionData?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  Activity?: ActivityResolvers<ContextType>;
  ActivityPage?: ActivityPageResolvers<ContextType>;
  AiJob?: AiJobResolvers<ContextType>;
  AiJobPage?: AiJobPageResolvers<ContextType>;
  AiModelOptions?: AiModelOptionsResolvers<ContextType>;
  Announcement?: AnnouncementResolvers<ContextType>;
  AnnouncementPage?: AnnouncementPageResolvers<ContextType>;
  AppSettings?: AppSettingsResolvers<ContextType>;
  Asset?: AssetResolvers<ContextType>;
  AssetAssignee?: AssetAssigneeResolvers<ContextType>;
  AssetPage?: AssetPageResolvers<ContextType>;
  Attendance?: AttendanceResolvers<ContextType>;
  AudienceList?: AudienceListResolvers<ContextType>;
  AudienceListPage?: AudienceListPageResolvers<ContextType>;
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  Benefit?: BenefitResolvers<ContextType>;
  BenefitPage?: BenefitPageResolvers<ContextType>;
  BlogAuthor?: BlogAuthorResolvers<ContextType>;
  BlogPost?: BlogPostResolvers<ContextType>;
  BlogPostPage?: BlogPostPageResolvers<ContextType>;
  BoardColumn?: BoardColumnResolvers<ContextType>;
  Branding?: BrandingResolvers<ContextType>;
  Bug?: BugResolvers<ContextType>;
  BugPage?: BugPageResolvers<ContextType>;
  Campaign?: CampaignResolvers<ContextType>;
  CampaignPage?: CampaignPageResolvers<ContextType>;
  CampaignSend?: CampaignSendResolvers<ContextType>;
  CampaignSendResult?: CampaignSendResultResolvers<ContextType>;
  CaseStudy?: CaseStudyResolvers<ContextType>;
  CaseStudyPage?: CaseStudyPageResolvers<ContextType>;
  Client?: ClientResolvers<ContextType>;
  ClientPage?: ClientPageResolvers<ContextType>;
  Company?: CompanyResolvers<ContextType>;
  CompanyBenefit?: CompanyBenefitResolvers<ContextType>;
  CompanyExpense?: CompanyExpenseResolvers<ContextType>;
  CompanyExpensePage?: CompanyExpensePageResolvers<ContextType>;
  CompanyFinance?: CompanyFinanceResolvers<ContextType>;
  CompanyPage?: CompanyPageResolvers<ContextType>;
  CompanySocialLinks?: CompanySocialLinksResolvers<ContextType>;
  Contact?: ContactResolvers<ContextType>;
  ContactPage?: ContactPageResolvers<ContextType>;
  ContainerMount?: ContainerMountResolvers<ContextType>;
  ContainerPort?: ContainerPortResolvers<ContextType>;
  Contract?: ContractResolvers<ContextType>;
  ContractPage?: ContractPageResolvers<ContextType>;
  DatabaseInfo?: DatabaseInfoResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Deal?: DealResolvers<ContextType>;
  DealPage?: DealPageResolvers<ContextType>;
  Department?: DepartmentResolvers<ContextType>;
  DocPage?: DocPageResolvers<ContextType>;
  DockerContainer?: DockerContainerResolvers<ContextType>;
  DockerContainerDetail?: DockerContainerDetailResolvers<ContextType>;
  DockerDiskUsage?: DockerDiskUsageResolvers<ContextType>;
  DockerHost?: DockerHostResolvers<ContextType>;
  DockerImage?: DockerImageResolvers<ContextType>;
  DockerStorage?: DockerStorageResolvers<ContextType>;
  EmailConfig?: EmailConfigResolvers<ContextType>;
  EmailDashboard?: EmailDashboardResolvers<ContextType>;
  EmailDayCount?: EmailDayCountResolvers<ContextType>;
  EmailFragment?: EmailFragmentResolvers<ContextType>;
  EmailFragmentPage?: EmailFragmentPageResolvers<ContextType>;
  EmailLog?: EmailLogResolvers<ContextType>;
  EmailLogPage?: EmailLogPageResolvers<ContextType>;
  EmailPreview?: EmailPreviewResolvers<ContextType>;
  EmailTemplate?: EmailTemplateResolvers<ContextType>;
  EmailTemplatePage?: EmailTemplatePageResolvers<ContextType>;
  EmailTemplateUsage?: EmailTemplateUsageResolvers<ContextType>;
  EmployeeDocument?: EmployeeDocumentResolvers<ContextType>;
  EmployeeDocumentPage?: EmployeeDocumentPageResolvers<ContextType>;
  EmployeeRequest?: EmployeeRequestResolvers<ContextType>;
  EmployeeRequestPage?: EmployeeRequestPageResolvers<ContextType>;
  EmploymentType?: EmploymentTypeResolvers<ContextType>;
  EmploymentTypePage?: EmploymentTypePageResolvers<ContextType>;
  ExitRecord?: ExitRecordResolvers<ContextType>;
  ExitRecordPage?: ExitRecordPageResolvers<ContextType>;
  ExpenseClaim?: ExpenseClaimResolvers<ContextType>;
  ExpenseClaimPage?: ExpenseClaimPageResolvers<ContextType>;
  FinanceBucket?: FinanceBucketResolvers<ContextType>;
  FinanceMonth?: FinanceMonthResolvers<ContextType>;
  Gig?: GigResolvers<ContextType>;
  GigPage?: GigPageResolvers<ContextType>;
  GithubConfig?: GithubConfigResolvers<ContextType>;
  Goal?: GoalResolvers<ContextType>;
  GoalPage?: GoalPageResolvers<ContextType>;
  Grade?: GradeResolvers<ContextType>;
  GradePage?: GradePageResolvers<ContextType>;
  HeadcountPoint?: HeadcountPointResolvers<ContextType>;
  Holiday?: HolidayResolvers<ContextType>;
  HolidayPage?: HolidayPageResolvers<ContextType>;
  HrDashboard?: HrDashboardResolvers<ContextType>;
  ImageConfig?: ImageConfigResolvers<ContextType>;
  InfrastructureOverview?: InfrastructureOverviewResolvers<ContextType>;
  Invoice?: InvoiceResolvers<ContextType>;
  InvoicePage?: InvoicePageResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Job?: JobResolvers<ContextType>;
  JobCompany?: JobCompanyResolvers<ContextType>;
  JobCompanyPage?: JobCompanyPageResolvers<ContextType>;
  JobPage?: JobPageResolvers<ContextType>;
  Lead?: LeadResolvers<ContextType>;
  LeadPage?: LeadPageResolvers<ContextType>;
  LeaveBalance?: LeaveBalanceResolvers<ContextType>;
  LeaveBalancePage?: LeaveBalancePageResolvers<ContextType>;
  LeavePolicy?: LeavePolicyResolvers<ContextType>;
  LeavePolicyPage?: LeavePolicyPageResolvers<ContextType>;
  LeaveRequest?: LeaveRequestResolvers<ContextType>;
  LegalDocument?: LegalDocumentResolvers<ContextType>;
  LegalDocumentPage?: LegalDocumentPageResolvers<ContextType>;
  Licence?: LicenceResolvers<ContextType>;
  LicencePage?: LicencePageResolvers<ContextType>;
  Location?: LocationResolvers<ContextType>;
  LocationPage?: LocationPageResolvers<ContextType>;
  LoginPage?: LoginPageResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  MyPolicy?: MyPolicyResolvers<ContextType>;
  NavLink?: NavLinkResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  OpenAiConfig?: OpenAiConfigResolvers<ContextType>;
  Payment?: PaymentResolvers<ContextType>;
  PaymentPage?: PaymentPageResolvers<ContextType>;
  PayrollDispatchResult?: PayrollDispatchResultResolvers<ContextType>;
  PayrollRunResult?: PayrollRunResultResolvers<ContextType>;
  PayrollSchedule?: PayrollScheduleResolvers<ContextType>;
  PayrollSummary?: PayrollSummaryResolvers<ContextType>;
  PerformanceReview?: PerformanceReviewResolvers<ContextType>;
  PerformanceReviewPage?: PerformanceReviewPageResolvers<ContextType>;
  PexelsConfig?: PexelsConfigResolvers<ContextType>;
  PexelsMedia?: PexelsMediaResolvers<ContextType>;
  Policy?: PolicyResolvers<ContextType>;
  PolicyAcknowledgement?: PolicyAcknowledgementResolvers<ContextType>;
  PolicyPage?: PolicyPageResolvers<ContextType>;
  Position?: PositionResolvers<ContextType>;
  ProblemReport?: ProblemReportResolvers<ContextType>;
  ProblemReportPage?: ProblemReportPageResolvers<ContextType>;
  ProblemReportReceipt?: ProblemReportReceiptResolvers<ContextType>;
  Product?: ProductResolvers<ContextType>;
  ProductPage?: ProductPageResolvers<ContextType>;
  Project?: ProjectResolvers<ContextType>;
  ProjectBoard?: ProjectBoardResolvers<ContextType>;
  ProjectMember?: ProjectMemberResolvers<ContextType>;
  ProjectPage?: ProjectPageResolvers<ContextType>;
  Prompt?: PromptResolvers<ContextType>;
  PromptPage?: PromptPageResolvers<ContextType>;
  PublicPolicy?: PublicPolicyResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Receivables?: ReceivablesResolvers<ContextType>;
  ReceivablesBucket?: ReceivablesBucketResolvers<ContextType>;
  RolePermission?: RolePermissionResolvers<ContextType>;
  SalarySlip?: SalarySlipResolvers<ContextType>;
  SalarySlipDownload?: SalarySlipDownloadResolvers<ContextType>;
  SalarySlipPage?: SalarySlipPageResolvers<ContextType>;
  SalaryStructure?: SalaryStructureResolvers<ContextType>;
  SalaryStructurePage?: SalaryStructurePageResolvers<ContextType>;
  SendNotificationResult?: SendNotificationResultResolvers<ContextType>;
  ServerRuntime?: ServerRuntimeResolvers<ContextType>;
  Shift?: ShiftResolvers<ContextType>;
  ShiftPage?: ShiftPageResolvers<ContextType>;
  SlackChannel?: SlackChannelResolvers<ContextType>;
  SlackConfig?: SlackConfigResolvers<ContextType>;
  StatBucket?: StatBucketResolvers<ContextType>;
  StatFieldCounts?: StatFieldCountsResolvers<ContextType>;
  StatFieldSum?: StatFieldSumResolvers<ContextType>;
  StatusDayPoint?: StatusDayPointResolvers<ContextType>;
  StatusIncident?: StatusIncidentResolvers<ContextType>;
  StatusMonitor?: StatusMonitorResolvers<ContextType>;
  StatusMonitorPage?: StatusMonitorPageResolvers<ContextType>;
  StatusOverview?: StatusOverviewResolvers<ContextType>;
  StatusServiceSummary?: StatusServiceSummaryResolvers<ContextType>;
  StockMovement?: StockMovementResolvers<ContextType>;
  StockMovementPage?: StockMovementPageResolvers<ContextType>;
  Supplier?: SupplierResolvers<ContextType>;
  SupplierPage?: SupplierPageResolvers<ContextType>;
  SupportAgent?: SupportAgentResolvers<ContextType>;
  SupportReply?: SupportReplyResolvers<ContextType>;
  SupportTicket?: SupportTicketResolvers<ContextType>;
  TableStats?: TableStatsResolvers<ContextType>;
  Task?: TaskResolvers<ContextType>;
  TaskActivity?: TaskActivityResolvers<ContextType>;
  TaskComment?: TaskCommentResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  TeamPage?: TeamPageResolvers<ContextType>;
  Tool?: ToolResolvers<ContextType>;
  ToolCategory?: ToolCategoryResolvers<ContextType>;
  ToolPage?: ToolPageResolvers<ContextType>;
  ToolPricing?: ToolPricingResolvers<ContextType>;
  TrackerAccess?: TrackerAccessResolvers<ContextType>;
  TrackerAppUsage?: TrackerAppUsageResolvers<ContextType>;
  TrackerBilling?: TrackerBillingResolvers<ContextType>;
  TrackerBillingRow?: TrackerBillingRowResolvers<ContextType>;
  TrackerBuild?: TrackerBuildResolvers<ContextType>;
  TrackerBuildSettings?: TrackerBuildSettingsResolvers<ContextType>;
  TrackerConsentPolicy?: TrackerConsentPolicyResolvers<ContextType>;
  TrackerDay?: TrackerDayResolvers<ContextType>;
  TrackerDayBucket?: TrackerDayBucketResolvers<ContextType>;
  TrackerDevice?: TrackerDeviceResolvers<ContextType>;
  TrackerInterval?: TrackerIntervalResolvers<ContextType>;
  TrackerLoginPayload?: TrackerLoginPayloadResolvers<ContextType>;
  TrackerManualEntry?: TrackerManualEntryResolvers<ContextType>;
  TrackerMe?: TrackerMeResolvers<ContextType>;
  TrackerProject?: TrackerProjectResolvers<ContextType>;
  TrackerRelease?: TrackerReleaseResolvers<ContextType>;
  TrackerReleaseAsset?: TrackerReleaseAssetResolvers<ContextType>;
  TrackerScreenshot?: TrackerScreenshotResolvers<ContextType>;
  TrackerSession?: TrackerSessionResolvers<ContextType>;
  TrackerSettings?: TrackerSettingsResolvers<ContextType>;
  TrackerTotals?: TrackerTotalsResolvers<ContextType>;
  TrackerWorkProfile?: TrackerWorkProfileResolvers<ContextType>;
  TrackerWorkday?: TrackerWorkdayResolvers<ContextType>;
  Training?: TrainingResolvers<ContextType>;
  TrainingPage?: TrainingPageResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserCredentials?: UserCredentialsResolvers<ContextType>;
  UserPage?: UserPageResolvers<ContextType>;
  WebsiteSubmission?: WebsiteSubmissionResolvers<ContextType>;
}>;

