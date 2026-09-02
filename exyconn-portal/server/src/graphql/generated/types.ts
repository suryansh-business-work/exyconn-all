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

export type AiJob = {
  __typename?: 'AiJob';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  model: Scalars['String']['output'];
  name: Scalars['String']['output'];
  prompt: Scalars['String']['output'];
  status: AiJobStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type AiJobInput = {
  model: Scalars['String']['input'];
  name: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
  status: AiJobStatus;
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

export type Announcement = {
  __typename?: 'Announcement';
  body: Scalars['String']['output'];
  category: AnnouncementCategory;
  createdAt: Scalars['DateTime']['output'];
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  pinned: Scalars['Boolean']['output'];
  publishedAt: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum AnnouncementCategory {
  Event = 'EVENT',
  Notice = 'NOTICE',
  Policy = 'POLICY',
  Update = 'UPDATE'
}

export type AnnouncementInput = {
  body: Scalars['String']['input'];
  category: AnnouncementCategory;
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

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
  user: User;
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

/** Outcome of a campaign email blast. */
export type CampaignSendResult = {
  __typename?: 'CampaignSendResult';
  campaign: Campaign;
  failed: Scalars['Int']['output'];
  sent: Scalars['Int']['output'];
};

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
  department?: InputMaybe<Scalars['String']['input']>;
  designation?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  employmentStatus?: InputMaybe<EmploymentStatus>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  joinDate?: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  roles: Array<Role>;
};

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

export enum DocumentCategory {
  Compliance = 'COMPLIANCE',
  Contract = 'CONTRACT',
  Other = 'OTHER',
  Policy = 'POLICY'
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

export enum EmploymentStatus {
  Active = 'ACTIVE',
  OnLeave = 'ON_LEAVE',
  Terminated = 'TERMINATED'
}

export enum FilterOp {
  Contains = 'CONTAINS',
  Equals = 'EQUALS',
  Gt = 'GT',
  Lt = 'LT',
  StartsWith = 'STARTS_WITH'
}

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

export type Invoice = {
  __typename?: 'Invoice';
  amount: Scalars['Float']['output'];
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

/** Employee-facing attendance entry — the server sets employeeId. */
export type MarkAttendanceInput = {
  date: Scalars['DateTime']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  status: AttendanceStatus;
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  /** Self-service: apply for leave (status forced to PENDING). */
  applyLeave: LeaveRequest;
  changePassword: Scalars['Boolean']['output'];
  createAiJob: AiJob;
  createAnnouncement: Announcement;
  createBlogPost: BlogPost;
  createBug: Bug;
  createCampaign: Campaign;
  createCaseStudy: CaseStudy;
  createClient: Client;
  createColumn: BoardColumn;
  createContract: Contract;
  createDepartment: Department;
  createEmailConfig: EmailConfig;
  createGig: Gig;
  createImageConfig: ImageConfig;
  createInvoice: Invoice;
  createJob: Job;
  createJobCompany: JobCompany;
  createLead: Lead;
  createLeaveRequest: LeaveRequest;
  createLegalDocument: LegalDocument;
  createNavLink: NavLink;
  createPosition: Position;
  createProduct: Product;
  createProject: Project;
  createPrompt: Prompt;
  /** Self-service: raise a support ticket (status forced to OPEN). */
  createSupportTicket: SupportTicket;
  createTask: Task;
  createTool: Tool;
  createToolCategory: ToolCategory;
  /** Creates a user, emails a temporary password, and returns it once for copying. */
  createUser: UserCredentials;
  createWebsiteSubmission: WebsiteSubmission;
  deleteAiJob: Scalars['Boolean']['output'];
  deleteAnnouncement: Scalars['Boolean']['output'];
  deleteBlogPost: Scalars['Boolean']['output'];
  deleteBug: Scalars['Boolean']['output'];
  deleteCampaign: Scalars['Boolean']['output'];
  deleteCaseStudy: Scalars['Boolean']['output'];
  deleteClient: Scalars['Boolean']['output'];
  deleteColumn: Scalars['Boolean']['output'];
  deleteContract: Scalars['Boolean']['output'];
  deleteDepartment: Scalars['Boolean']['output'];
  deleteEmailConfig: Scalars['Boolean']['output'];
  deleteGig: Scalars['Boolean']['output'];
  deleteImageConfig: Scalars['Boolean']['output'];
  deleteInvoice: Scalars['Boolean']['output'];
  deleteJob: Scalars['Boolean']['output'];
  deleteJobCompany: Scalars['Boolean']['output'];
  deleteLead: Scalars['Boolean']['output'];
  deleteLeaveRequest: Scalars['Boolean']['output'];
  deleteLegalDocument: Scalars['Boolean']['output'];
  deleteNavLink: Scalars['Boolean']['output'];
  deletePosition: Scalars['Boolean']['output'];
  deleteProduct: Scalars['Boolean']['output'];
  deleteProject: Scalars['Boolean']['output'];
  deletePrompt: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  deleteTool: Scalars['Boolean']['output'];
  deleteToolCategory: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  deleteWebsiteSubmission: Scalars['Boolean']['output'];
  grantTrackerAccess: TrackerAccess;
  login: AuthPayload;
  /** Self-service: mark today's (or a given day's) attendance — upserts per day. */
  markAttendance: Attendance;
  moveTask: Scalars['Boolean']['output'];
  renameColumn: BoardColumn;
  reorderColumns: Scalars['Boolean']['output'];
  /** Generates a new temporary password, emails it, and returns it once for copying. */
  resetUserPassword: Scalars['String']['output'];
  revokeTrackerAccess: TrackerAccess;
  revokeTrackerDevice: TrackerDevice;
  /**
   * Recovery for a portal with no administrator: mails a fresh password for the
   * configured admin account to that configured address. A no-op once any ADMIN
   * exists. Returns a message safe to show the caller.
   */
  sendAdminCredentials: Scalars['String']['output'];
  /** Emails the campaign's subject/body to the selected clients. */
  sendCampaign: CampaignSendResult;
  sendContract: Contract;
  sendTestEmail: Scalars['Boolean']['output'];
  sendUserMail: Scalars['Boolean']['output'];
  /** HR/ADMIN: approve or reject a leave request. */
  setLeaveStatus: LeaveRequest;
  /** SUPPORT/ADMIN: move a ticket through its lifecycle. */
  setSupportTicketStatus: SupportTicket;
  setUserActive: User;
  setUserBlocked: User;
  signContract: Contract;
  testImageUpload: Scalars['String']['output'];
  trackerAcceptConsent: Scalars['Boolean']['output'];
  trackerHeartbeat: Scalars['Boolean']['output'];
  trackerLogin: TrackerLoginPayload;
  /** Sets the CALLER's own timezone. Must be a resolvable IANA zone name. */
  trackerSetTimezone: TrackerAccess;
  trackerStartSession: TrackerSession;
  trackerStopSession: TrackerSession;
  trackerSyncIntervals: Scalars['Int']['output'];
  trackerUploadScreenshot: TrackerScreenshot;
  triageWebsiteSubmission: WebsiteSubmission;
  updateAiJob: AiJob;
  updateAnnouncement: Announcement;
  updateBlogPost: BlogPost;
  updateBranding: Branding;
  updateBug: Bug;
  updateCampaign: Campaign;
  updateCaseStudy: CaseStudy;
  updateClient: Client;
  updateContract: Contract;
  updateDepartment: Department;
  updateEmailConfig: EmailConfig;
  updateGig: Gig;
  updateImageConfig: ImageConfig;
  updateInvoice: Invoice;
  updateJob: Job;
  updateJobCompany: JobCompany;
  updateLead: Lead;
  updateLeaveRequest: LeaveRequest;
  updateLegalDocument: LegalDocument;
  updateNavLink: NavLink;
  updatePosition: Position;
  updateProduct: Product;
  updateProfile: User;
  updateProject: Project;
  updatePrompt: Prompt;
  updateSettings: AppSettings;
  updateTask: Task;
  updateTool: Tool;
  updateToolCategory: ToolCategory;
  updateTrackerSettings: TrackerSettings;
  updateUser: User;
  uploadAvatar: Scalars['String']['output'];
  uploadImage: Scalars['String']['output'];
};


export type MutationApplyLeaveArgs = {
  input: ApplyLeaveInput;
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationCreateAiJobArgs = {
  input: AiJobInput;
};


export type MutationCreateAnnouncementArgs = {
  input: AnnouncementInput;
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


export type MutationCreateContractArgs = {
  input: ContractInput;
};


export type MutationCreateDepartmentArgs = {
  input: DepartmentInput;
};


export type MutationCreateEmailConfigArgs = {
  input: EmailConfigInput;
};


export type MutationCreateGigArgs = {
  input: GigInput;
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


export type MutationCreateLeaveRequestArgs = {
  input: LeaveRequestInput;
};


export type MutationCreateLegalDocumentArgs = {
  input: LegalDocumentInput;
};


export type MutationCreateNavLinkArgs = {
  input: NavLinkInput;
};


export type MutationCreatePositionArgs = {
  input: PositionInput;
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


export type MutationCreateSupportTicketArgs = {
  input: SupportTicketInput;
};


export type MutationCreateTaskArgs = {
  columnId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};


export type MutationCreateToolArgs = {
  input: ToolInput;
};


export type MutationCreateToolCategoryArgs = {
  input: ToolCategoryInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationCreateWebsiteSubmissionArgs = {
  input: WebsiteSubmissionInput;
};


export type MutationDeleteAiJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAnnouncementArgs = {
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


export type MutationDeleteContractArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDepartmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmailConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGigArgs = {
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


export type MutationDeleteLeaveRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLegalDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteNavLinkArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePositionArgs = {
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


export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteToolArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteToolCategoryArgs = {
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


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationMarkAttendanceArgs = {
  input: MarkAttendanceInput;
};


export type MutationMoveTaskArgs = {
  id: Scalars['ID']['input'];
  toColumnId: Scalars['ID']['input'];
  toIndex: Scalars['Int']['input'];
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


export type MutationRevokeTrackerAccessArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationRevokeTrackerDeviceArgs = {
  deviceId: Scalars['String']['input'];
};


export type MutationSendCampaignArgs = {
  clientIds: Array<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
};


export type MutationSendContractArgs = {
  email: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSendTestEmailArgs = {
  id: Scalars['ID']['input'];
  to: Scalars['String']['input'];
};


export type MutationSendUserMailArgs = {
  id: Scalars['ID']['input'];
  input: SendMailInput;
};


export type MutationSetLeaveStatusArgs = {
  id: Scalars['ID']['input'];
  status: LeaveStatus;
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


export type MutationTestImageUploadArgs = {
  file: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationTrackerLoginArgs = {
  device: TrackerDeviceInput;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationTrackerSetTimezoneArgs = {
  timezone: Scalars['String']['input'];
};


export type MutationTrackerStartSessionArgs = {
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


export type MutationUpdateAiJobArgs = {
  id: Scalars['ID']['input'];
  input: AiJobInput;
};


export type MutationUpdateAnnouncementArgs = {
  id: Scalars['ID']['input'];
  input: AnnouncementInput;
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


export type MutationUpdateContractArgs = {
  id: Scalars['ID']['input'];
  input: ContractInput;
};


export type MutationUpdateDepartmentArgs = {
  id: Scalars['ID']['input'];
  input: DepartmentInput;
};


export type MutationUpdateEmailConfigArgs = {
  id: Scalars['ID']['input'];
  input: EmailConfigInput;
};


export type MutationUpdateGigArgs = {
  id: Scalars['ID']['input'];
  input: GigInput;
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


export type MutationUpdateLeaveRequestArgs = {
  id: Scalars['ID']['input'];
  input: LeaveRequestInput;
};


export type MutationUpdateLegalDocumentArgs = {
  id: Scalars['ID']['input'];
  input: LegalDocumentInput;
};


export type MutationUpdateNavLinkArgs = {
  id: Scalars['ID']['input'];
  input: NavLinkInput;
};


export type MutationUpdatePositionArgs = {
  id: Scalars['ID']['input'];
  input: PositionInput;
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


export type MutationUpdateSettingsArgs = {
  input: UpdateSettingsInput;
};


export type MutationUpdateTaskArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
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

export type Policy = {
  __typename?: 'Policy';
  category: PolicyCategory;
  effectiveDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  summary: Scalars['String']['output'];
  title: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export enum PolicyCategory {
  Conduct = 'CONDUCT',
  Finance = 'FINANCE',
  General = 'GENERAL',
  It = 'IT',
  Leave = 'LEAVE'
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

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  /**
   * The employee-facing feed: everything published and not yet expired, pinned
   * first then newest. Readable by any signed-in user, unlike the HR CRUD above.
   */
  activeAnnouncements: Array<Announcement>;
  appSettings: AppSettings;
  /** HR/ADMIN: a specific employee's attendance records. */
  attendanceByEmployee: Array<Attendance>;
  branding: Branding;
  getAiJob: AiJob;
  getAnnouncement: Announcement;
  getBlogPost: BlogPost;
  getBug: Bug;
  getCampaign: Campaign;
  getCaseStudy: CaseStudy;
  getClient: Client;
  getContract: Contract;
  getDepartment: Department;
  getGig: Gig;
  getInvoice: Invoice;
  getJob: Job;
  getJobCompany: JobCompany;
  getLead: Lead;
  getLeaveRequest: LeaveRequest;
  getLegalDocument: LegalDocument;
  getNavLink: NavLink;
  getPosition: Position;
  getProduct: Product;
  getProject: Project;
  getPrompt: Prompt;
  getTool: Tool;
  getToolCategory: ToolCategory;
  getUser: User;
  getWebsiteSubmission: WebsiteSubmission;
  /** HR/ADMIN: workforce counts + headcount-over-time series. */
  hrDashboard: HrDashboard;
  /** HR/ADMIN: a specific employee's leave requests. */
  leaveRequestsByEmployee: Array<LeaveRequest>;
  listAiJobs: Array<AiJob>;
  listAiJobsPaged: AiJobPage;
  listAiJobsStats: TableStats;
  listAnnouncements: Array<Announcement>;
  listAnnouncementsPaged: AnnouncementPage;
  listAnnouncementsStats: TableStats;
  /** HR/ADMIN: all attendance records. */
  listAttendance: Array<Attendance>;
  listBlogPosts: Array<BlogPost>;
  listBlogPostsPaged: BlogPostPage;
  listBlogPostsStats: TableStats;
  listBugs: Array<Bug>;
  listBugsPaged: BugPage;
  listBugsStats: TableStats;
  listCampaigns: Array<Campaign>;
  listCampaignsPaged: CampaignPage;
  listCampaignsStats: TableStats;
  listCaseStudies: Array<CaseStudy>;
  listCaseStudiesPaged: CaseStudyPage;
  listCaseStudiesStats: TableStats;
  listClients: Array<Client>;
  listClientsPaged: ClientPage;
  listClientsStats: TableStats;
  listContracts: Array<Contract>;
  listContractsPaged: ContractPage;
  listContractsStats: TableStats;
  /** HR/ADMIN: organizational departments. */
  listDepartments: Array<Department>;
  listEmailConfigs: Array<EmailConfig>;
  listGigs: Array<Gig>;
  listGigsPaged: GigPage;
  listGigsStats: TableStats;
  /** Company-wide holidays, readable by any authenticated employee. */
  listHolidays: Array<Holiday>;
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
  listLeaveRequests: Array<LeaveRequest>;
  listLegalDocuments: Array<LegalDocument>;
  listLegalDocumentsPaged: LegalDocumentPage;
  listLegalDocumentsStats: TableStats;
  listNavLinks: Array<NavLink>;
  /** Company-wide HR policies, readable by any authenticated employee. */
  listPolicies: Array<Policy>;
  /** HR/ADMIN: job positions / designations. */
  listPositions: Array<Position>;
  listProducts: Array<Product>;
  listProductsPaged: ProductPage;
  listProductsStats: TableStats;
  listProjects: Array<Project>;
  listProjectsPaged: ProjectPage;
  listProjectsStats: TableStats;
  listPrompts: Array<Prompt>;
  listPromptsPaged: PromptPage;
  listPromptsStats: TableStats;
  /** SUPPORT/ADMIN: every employee support ticket, newest first. */
  listSupportTickets: Array<SupportTicket>;
  listToolCategories: Array<ToolCategory>;
  listTools: Array<Tool>;
  listToolsPaged: ToolPage;
  listToolsStats: TableStats;
  listUsers: Array<User>;
  listUsersPaged: UserPage;
  listUsersStats: TableStats;
  listWebsiteSubmissions: Array<WebsiteSubmission>;
  me: User;
  /** Self-service: the signed-in user's own attendance records. */
  myAttendance: Array<Attendance>;
  /** Self-service: the signed-in user's own leave requests. */
  myLeaveRequests: Array<LeaveRequest>;
  /** Self-service: the signed-in employee's salary structure (null if unset). */
  myPayroll?: Maybe<SalaryStructure>;
  /** Self-service: the signed-in employee's monthly payslips. */
  mySalarySlips: Array<SalarySlip>;
  /** The signed-in employee's own support tickets. */
  mySupportTickets: Array<SupportTicket>;
  myTrackerAccess?: Maybe<TrackerAccess>;
  myTrackerCalendar: Array<TrackerDayBucket>;
  myTrackerDay: TrackerDay;
  /** The calling device's own employee, all-time. Device token, not a portal session. */
  myTrackerTotals: TrackerTotals;
  projectBoard: ProjectBoard;
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
  publicTool?: Maybe<Tool>;
  publicToolCategories: Array<ToolCategory>;
  publicTools: Array<Tool>;
  trackerAccessList: Array<TrackerAccess>;
  trackerCalendar: Array<TrackerDayBucket>;
  trackerDay: TrackerDay;
  trackerDevices: Array<TrackerDevice>;
  trackerMe: TrackerMe;
  trackerSettings: TrackerSettings;
  trackerTotals: TrackerTotals;
};


export type QueryAttendanceByEmployeeArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryGetAiJobArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAnnouncementArgs = {
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


export type QueryGetContractArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetDepartmentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetGigArgs = {
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


export type QueryGetLeaveRequestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetLegalDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetNavLinkArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPositionArgs = {
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


export type QueryGetToolArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetToolCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetWebsiteSubmissionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLeaveRequestsByEmployeeArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryListAiJobsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListAnnouncementsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListBlogPostsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListBugsPagedArgs = {
  input: TableQueryInput;
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


export type QueryListContractsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListGigsPagedArgs = {
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


export type QueryListLegalDocumentsPagedArgs = {
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


export type QueryListToolsPagedArgs = {
  input: TableQueryInput;
};


export type QueryListUsersPagedArgs = {
  input: TableQueryInput;
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


export type QueryProjectBoardArgs = {
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


export type QueryPublicToolArgs = {
  toolCode: Scalars['String']['input'];
};


export type QueryPublicToolsArgs = {
  categorySlug?: InputMaybe<Scalars['String']['input']>;
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


export type QueryTrackerTotalsArgs = {
  userId: Scalars['ID']['input'];
};

export enum Role {
  Admin = 'ADMIN',
  Ai = 'AI',
  Crm = 'CRM',
  Employee = 'EMPLOYEE',
  Finance = 'FINANCE',
  Hr = 'HR',
  Legal = 'LEGAL',
  Marketing = 'MARKETING',
  Products = 'PRODUCTS',
  Projects = 'PROJECTS',
  Support = 'SUPPORT',
  Tracker = 'TRACKER',
  Website = 'WEBSITE'
}

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

/** The signed-in employee's salary structure. gross/net are derived server-side. */
export type SalaryStructure = {
  __typename?: 'SalaryStructure';
  allowances: Scalars['Float']['output'];
  basic: Scalars['Float']['output'];
  currency: Scalars['String']['output'];
  deductions: Scalars['Float']['output'];
  effectiveFrom: Scalars['DateTime']['output'];
  employeeId: Scalars['String']['output'];
  gross: Scalars['Float']['output'];
  hra: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  net: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type SendMailInput = {
  message: Scalars['String']['input'];
  subject: Scalars['String']['input'];
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

export enum SupportStatus {
  Closed = 'CLOSED',
  InProgress = 'IN_PROGRESS',
  Open = 'OPEN',
  Resolved = 'RESOLVED'
}

export type SupportTicket = {
  __typename?: 'SupportTicket';
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

export type Task = {
  __typename?: 'Task';
  columnId: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  title: Scalars['String']['output'];
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

export type TrackerMe = {
  __typename?: 'TrackerMe';
  consentRequired: Scalars['Boolean']['output'];
  settings: TrackerSettings;
  /**
   * The EFFECTIVE zone: the employee's own pick, else the admin default, else the zone this
   * device reported at sign-in, else UTC. Never empty.
   */
  timezone: Scalars['String']['output'];
  user: User;
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
  startedAt: Scalars['DateTime']['output'];
  status: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type TrackerSettings = {
  __typename?: 'TrackerSettings';
  autoSyncEnabled: Scalars['Boolean']['output'];
  blurScreenshots: Scalars['Boolean']['output'];
  consentText: Scalars['String']['output'];
  /**
   * House default IANA zone (e.g. "Asia/Kolkata"), chosen by an admin.
   * An empty string means "no house default" — fall back to the device's own zone.
   */
  defaultTimezone: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  idleThresholdSeconds: Scalars['Int']['output'];
  intervalMinutes: Scalars['Int']['output'];
  randomizeScreenshotTiming: Scalars['Boolean']['output'];
  screenshotMaxWidth: Scalars['Int']['output'];
  screenshotQuality: Scalars['Int']['output'];
  screenshotsPerInterval: Scalars['Int']['output'];
  syncIntervalMinutes: Scalars['Int']['output'];
  trackWindowTitles: Scalars['Boolean']['output'];
};

export type TrackerSettingsInput = {
  autoSyncEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  blurScreenshots?: InputMaybe<Scalars['Boolean']['input']>;
  consentText?: InputMaybe<Scalars['String']['input']>;
  defaultTimezone?: InputMaybe<Scalars['String']['input']>;
  idleThresholdSeconds?: InputMaybe<Scalars['Int']['input']>;
  intervalMinutes?: InputMaybe<Scalars['Int']['input']>;
  randomizeScreenshotTiming?: InputMaybe<Scalars['Boolean']['input']>;
  screenshotMaxWidth?: InputMaybe<Scalars['Int']['input']>;
  screenshotQuality?: InputMaybe<Scalars['Int']['input']>;
  screenshotsPerInterval?: InputMaybe<Scalars['Int']['input']>;
  syncIntervalMinutes?: InputMaybe<Scalars['Int']['input']>;
  trackWindowTitles?: InputMaybe<Scalars['Boolean']['input']>;
};

/** All-time tracker totals for one employee. */
export type TrackerTotals = {
  __typename?: 'TrackerTotals';
  /** Float, not Int: all-time milliseconds overflow a 32-bit Int. */
  activeMs: Scalars['Float']['output'];
  idleMs: Scalars['Float']['output'];
  screenshots: Scalars['Int']['output'];
  sessions: Scalars['Int']['output'];
};

export type TrackerWindowUsageInput = {
  appName: Scalars['String']['input'];
  durationMs: Scalars['Float']['input'];
  windowTitle?: InputMaybe<Scalars['String']['input']>;
};

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
  department?: InputMaybe<Scalars['String']['input']>;
  designation?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  employmentStatus?: InputMaybe<EmploymentStatus>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  joinDate?: InputMaybe<Scalars['DateTime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  roles?: InputMaybe<Array<Role>>;
};

export type User = {
  __typename?: 'User';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  blockReason?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
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
  AiJob: ResolverTypeWrapper<AiJob>;
  AiJobInput: AiJobInput;
  AiJobPage: ResolverTypeWrapper<AiJobPage>;
  AiJobStatus: AiJobStatus;
  Announcement: ResolverTypeWrapper<Announcement>;
  AnnouncementCategory: AnnouncementCategory;
  AnnouncementInput: AnnouncementInput;
  AnnouncementPage: ResolverTypeWrapper<AnnouncementPage>;
  AppSettings: ResolverTypeWrapper<AppSettings>;
  ApplyLeaveInput: ApplyLeaveInput;
  Attendance: ResolverTypeWrapper<Attendance>;
  AttendanceStatus: AttendanceStatus;
  AuthPayload: ResolverTypeWrapper<AuthPayload>;
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
  CampaignSendResult: ResolverTypeWrapper<CampaignSendResult>;
  CampaignStatus: CampaignStatus;
  CaseStudy: ResolverTypeWrapper<CaseStudy>;
  CaseStudyInput: CaseStudyInput;
  CaseStudyPage: ResolverTypeWrapper<CaseStudyPage>;
  Client: ResolverTypeWrapper<Client>;
  ClientInput: ClientInput;
  ClientPage: ResolverTypeWrapper<ClientPage>;
  ClientStatus: ClientStatus;
  CompanyBenefit: ResolverTypeWrapper<CompanyBenefit>;
  CompanyBenefitInput: CompanyBenefitInput;
  CompanySocialLinks: ResolverTypeWrapper<CompanySocialLinks>;
  CompanySocialLinksInput: CompanySocialLinksInput;
  Contract: ResolverTypeWrapper<Contract>;
  ContractInput: ContractInput;
  ContractPage: ResolverTypeWrapper<ContractPage>;
  ContractStatus: ContractStatus;
  ContractType: ContractType;
  CreateUserInput: CreateUserInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Department: ResolverTypeWrapper<Department>;
  DepartmentInput: DepartmentInput;
  DocumentCategory: DocumentCategory;
  DocumentStatus: DocumentStatus;
  EmailConfig: ResolverTypeWrapper<EmailConfig>;
  EmailConfigInput: EmailConfigInput;
  EmploymentStatus: EmploymentStatus;
  FilterOp: FilterOp;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Gig: ResolverTypeWrapper<Gig>;
  GigInput: GigInput;
  GigPage: ResolverTypeWrapper<GigPage>;
  HeadcountPoint: ResolverTypeWrapper<HeadcountPoint>;
  Holiday: ResolverTypeWrapper<Holiday>;
  HolidayType: HolidayType;
  HrDashboard: ResolverTypeWrapper<HrDashboard>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  ImageConfig: ResolverTypeWrapper<ImageConfig>;
  ImageConfigInput: ImageConfigInput;
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
  LeaveRequest: ResolverTypeWrapper<LeaveRequest>;
  LeaveRequestInput: LeaveRequestInput;
  LeaveStatus: LeaveStatus;
  LeaveType: LeaveType;
  LegalDocument: ResolverTypeWrapper<LegalDocument>;
  LegalDocumentInput: LegalDocumentInput;
  LegalDocumentPage: ResolverTypeWrapper<LegalDocumentPage>;
  MarkAttendanceInput: MarkAttendanceInput;
  Mutation: ResolverTypeWrapper<{}>;
  NavLink: ResolverTypeWrapper<NavLink>;
  NavLinkInput: NavLinkInput;
  Policy: ResolverTypeWrapper<Policy>;
  PolicyCategory: PolicyCategory;
  Position: ResolverTypeWrapper<Position>;
  PositionInput: PositionInput;
  Product: ResolverTypeWrapper<Product>;
  ProductInput: ProductInput;
  ProductPage: ResolverTypeWrapper<ProductPage>;
  ProductStatus: ProductStatus;
  Project: ResolverTypeWrapper<Project>;
  ProjectBoard: ResolverTypeWrapper<ProjectBoard>;
  ProjectInput: ProjectInput;
  ProjectPage: ResolverTypeWrapper<ProjectPage>;
  ProjectStatus: ProjectStatus;
  Prompt: ResolverTypeWrapper<Prompt>;
  PromptCategory: PromptCategory;
  PromptInput: PromptInput;
  PromptPage: ResolverTypeWrapper<PromptPage>;
  Query: ResolverTypeWrapper<{}>;
  Role: Role;
  SalarySlip: ResolverTypeWrapper<SalarySlip>;
  SalaryStructure: ResolverTypeWrapper<SalaryStructure>;
  SendMailInput: SendMailInput;
  SlipStatus: SlipStatus;
  SortDir: SortDir;
  StatBucket: ResolverTypeWrapper<StatBucket>;
  StatFieldCounts: ResolverTypeWrapper<StatFieldCounts>;
  StatFieldSum: ResolverTypeWrapper<StatFieldSum>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  SupportCategory: SupportCategory;
  SupportPriority: SupportPriority;
  SupportStatus: SupportStatus;
  SupportTicket: ResolverTypeWrapper<SupportTicket>;
  SupportTicketInput: SupportTicketInput;
  TableFilterInput: TableFilterInput;
  TableQueryInput: TableQueryInput;
  TableSortInput: TableSortInput;
  TableStats: ResolverTypeWrapper<TableStats>;
  Task: ResolverTypeWrapper<Task>;
  Tool: ResolverTypeWrapper<Tool>;
  ToolCategory: ResolverTypeWrapper<ToolCategory>;
  ToolCategoryInput: ToolCategoryInput;
  ToolInput: ToolInput;
  ToolPage: ResolverTypeWrapper<ToolPage>;
  ToolPricing: ResolverTypeWrapper<ToolPricing>;
  ToolPricingInput: ToolPricingInput;
  TrackerAccess: ResolverTypeWrapper<TrackerAccess>;
  TrackerAppUsage: ResolverTypeWrapper<TrackerAppUsage>;
  TrackerDay: ResolverTypeWrapper<TrackerDay>;
  TrackerDayBucket: ResolverTypeWrapper<TrackerDayBucket>;
  TrackerDevice: ResolverTypeWrapper<TrackerDevice>;
  TrackerDeviceInput: TrackerDeviceInput;
  TrackerInterval: ResolverTypeWrapper<TrackerInterval>;
  TrackerIntervalInput: TrackerIntervalInput;
  TrackerLoginPayload: ResolverTypeWrapper<TrackerLoginPayload>;
  TrackerMe: ResolverTypeWrapper<TrackerMe>;
  TrackerScreenshot: ResolverTypeWrapper<TrackerScreenshot>;
  TrackerScreenshotInput: TrackerScreenshotInput;
  TrackerSession: ResolverTypeWrapper<TrackerSession>;
  TrackerSettings: ResolverTypeWrapper<TrackerSettings>;
  TrackerSettingsInput: TrackerSettingsInput;
  TrackerTotals: ResolverTypeWrapper<TrackerTotals>;
  TrackerWindowUsageInput: TrackerWindowUsageInput;
  UpdateProfileInput: UpdateProfileInput;
  UpdateSettingsInput: UpdateSettingsInput;
  UpdateUserInput: UpdateUserInput;
  User: ResolverTypeWrapper<User>;
  UserCredentials: ResolverTypeWrapper<UserCredentials>;
  UserPage: ResolverTypeWrapper<UserPage>;
  WebsiteSubmission: ResolverTypeWrapper<WebsiteSubmission>;
  WebsiteSubmissionInput: WebsiteSubmissionInput;
  WebsiteSubmissionTriageInput: WebsiteSubmissionTriageInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AiJob: AiJob;
  AiJobInput: AiJobInput;
  AiJobPage: AiJobPage;
  Announcement: Announcement;
  AnnouncementInput: AnnouncementInput;
  AnnouncementPage: AnnouncementPage;
  AppSettings: AppSettings;
  ApplyLeaveInput: ApplyLeaveInput;
  Attendance: Attendance;
  AuthPayload: AuthPayload;
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
  CampaignSendResult: CampaignSendResult;
  CaseStudy: CaseStudy;
  CaseStudyInput: CaseStudyInput;
  CaseStudyPage: CaseStudyPage;
  Client: Client;
  ClientInput: ClientInput;
  ClientPage: ClientPage;
  CompanyBenefit: CompanyBenefit;
  CompanyBenefitInput: CompanyBenefitInput;
  CompanySocialLinks: CompanySocialLinks;
  CompanySocialLinksInput: CompanySocialLinksInput;
  Contract: Contract;
  ContractInput: ContractInput;
  ContractPage: ContractPage;
  CreateUserInput: CreateUserInput;
  DateTime: Scalars['DateTime']['output'];
  Department: Department;
  DepartmentInput: DepartmentInput;
  EmailConfig: EmailConfig;
  EmailConfigInput: EmailConfigInput;
  Float: Scalars['Float']['output'];
  Gig: Gig;
  GigInput: GigInput;
  GigPage: GigPage;
  HeadcountPoint: HeadcountPoint;
  Holiday: Holiday;
  HrDashboard: HrDashboard;
  ID: Scalars['ID']['output'];
  ImageConfig: ImageConfig;
  ImageConfigInput: ImageConfigInput;
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
  LeaveRequest: LeaveRequest;
  LeaveRequestInput: LeaveRequestInput;
  LegalDocument: LegalDocument;
  LegalDocumentInput: LegalDocumentInput;
  LegalDocumentPage: LegalDocumentPage;
  MarkAttendanceInput: MarkAttendanceInput;
  Mutation: {};
  NavLink: NavLink;
  NavLinkInput: NavLinkInput;
  Policy: Policy;
  Position: Position;
  PositionInput: PositionInput;
  Product: Product;
  ProductInput: ProductInput;
  ProductPage: ProductPage;
  Project: Project;
  ProjectBoard: ProjectBoard;
  ProjectInput: ProjectInput;
  ProjectPage: ProjectPage;
  Prompt: Prompt;
  PromptInput: PromptInput;
  PromptPage: PromptPage;
  Query: {};
  SalarySlip: SalarySlip;
  SalaryStructure: SalaryStructure;
  SendMailInput: SendMailInput;
  StatBucket: StatBucket;
  StatFieldCounts: StatFieldCounts;
  StatFieldSum: StatFieldSum;
  String: Scalars['String']['output'];
  SupportTicket: SupportTicket;
  SupportTicketInput: SupportTicketInput;
  TableFilterInput: TableFilterInput;
  TableQueryInput: TableQueryInput;
  TableSortInput: TableSortInput;
  TableStats: TableStats;
  Task: Task;
  Tool: Tool;
  ToolCategory: ToolCategory;
  ToolCategoryInput: ToolCategoryInput;
  ToolInput: ToolInput;
  ToolPage: ToolPage;
  ToolPricing: ToolPricing;
  ToolPricingInput: ToolPricingInput;
  TrackerAccess: TrackerAccess;
  TrackerAppUsage: TrackerAppUsage;
  TrackerDay: TrackerDay;
  TrackerDayBucket: TrackerDayBucket;
  TrackerDevice: TrackerDevice;
  TrackerDeviceInput: TrackerDeviceInput;
  TrackerInterval: TrackerInterval;
  TrackerIntervalInput: TrackerIntervalInput;
  TrackerLoginPayload: TrackerLoginPayload;
  TrackerMe: TrackerMe;
  TrackerScreenshot: TrackerScreenshot;
  TrackerScreenshotInput: TrackerScreenshotInput;
  TrackerSession: TrackerSession;
  TrackerSettings: TrackerSettings;
  TrackerSettingsInput: TrackerSettingsInput;
  TrackerTotals: TrackerTotals;
  TrackerWindowUsageInput: TrackerWindowUsageInput;
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

export type AiJobResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AiJob'] = ResolversParentTypes['AiJob']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  model?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  prompt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AiJobStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AiJobPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AiJobPage'] = ResolversParentTypes['AiJobPage']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['AiJob']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AnnouncementResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Announcement'] = ResolversParentTypes['Announcement']> = ResolversObject<{
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['AnnouncementCategory'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
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

export type AuthPayloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AuthPayload'] = ResolversParentTypes['AuthPayload']> = ResolversObject<{
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
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

export type CompanyBenefitResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CompanyBenefit'] = ResolversParentTypes['CompanyBenefit']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CompanySocialLinksResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CompanySocialLinks'] = ResolversParentTypes['CompanySocialLinks']> = ResolversObject<{
  facebook?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  instagram?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  linkedin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  twitter?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DepartmentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Department'] = ResolversParentTypes['Department']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
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

export type InvoiceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Invoice'] = ResolversParentTypes['Invoice']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
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

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  applyLeave?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<MutationApplyLeaveArgs, 'input'>>;
  changePassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationChangePasswordArgs, 'currentPassword' | 'newPassword'>>;
  createAiJob?: Resolver<ResolversTypes['AiJob'], ParentType, ContextType, RequireFields<MutationCreateAiJobArgs, 'input'>>;
  createAnnouncement?: Resolver<ResolversTypes['Announcement'], ParentType, ContextType, RequireFields<MutationCreateAnnouncementArgs, 'input'>>;
  createBlogPost?: Resolver<ResolversTypes['BlogPost'], ParentType, ContextType, RequireFields<MutationCreateBlogPostArgs, 'input'>>;
  createBug?: Resolver<ResolversTypes['Bug'], ParentType, ContextType, RequireFields<MutationCreateBugArgs, 'input'>>;
  createCampaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType, RequireFields<MutationCreateCampaignArgs, 'input'>>;
  createCaseStudy?: Resolver<ResolversTypes['CaseStudy'], ParentType, ContextType, RequireFields<MutationCreateCaseStudyArgs, 'input'>>;
  createClient?: Resolver<ResolversTypes['Client'], ParentType, ContextType, RequireFields<MutationCreateClientArgs, 'input'>>;
  createColumn?: Resolver<ResolversTypes['BoardColumn'], ParentType, ContextType, RequireFields<MutationCreateColumnArgs, 'name' | 'projectId'>>;
  createContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationCreateContractArgs, 'input'>>;
  createDepartment?: Resolver<ResolversTypes['Department'], ParentType, ContextType, RequireFields<MutationCreateDepartmentArgs, 'input'>>;
  createEmailConfig?: Resolver<ResolversTypes['EmailConfig'], ParentType, ContextType, RequireFields<MutationCreateEmailConfigArgs, 'input'>>;
  createGig?: Resolver<ResolversTypes['Gig'], ParentType, ContextType, RequireFields<MutationCreateGigArgs, 'input'>>;
  createImageConfig?: Resolver<ResolversTypes['ImageConfig'], ParentType, ContextType, RequireFields<MutationCreateImageConfigArgs, 'input'>>;
  createInvoice?: Resolver<ResolversTypes['Invoice'], ParentType, ContextType, RequireFields<MutationCreateInvoiceArgs, 'input'>>;
  createJob?: Resolver<ResolversTypes['Job'], ParentType, ContextType, RequireFields<MutationCreateJobArgs, 'input'>>;
  createJobCompany?: Resolver<ResolversTypes['JobCompany'], ParentType, ContextType, RequireFields<MutationCreateJobCompanyArgs, 'input'>>;
  createLead?: Resolver<ResolversTypes['Lead'], ParentType, ContextType, RequireFields<MutationCreateLeadArgs, 'input'>>;
  createLeaveRequest?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<MutationCreateLeaveRequestArgs, 'input'>>;
  createLegalDocument?: Resolver<ResolversTypes['LegalDocument'], ParentType, ContextType, RequireFields<MutationCreateLegalDocumentArgs, 'input'>>;
  createNavLink?: Resolver<ResolversTypes['NavLink'], ParentType, ContextType, RequireFields<MutationCreateNavLinkArgs, 'input'>>;
  createPosition?: Resolver<ResolversTypes['Position'], ParentType, ContextType, RequireFields<MutationCreatePositionArgs, 'input'>>;
  createProduct?: Resolver<ResolversTypes['Product'], ParentType, ContextType, RequireFields<MutationCreateProductArgs, 'input'>>;
  createProject?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<MutationCreateProjectArgs, 'input'>>;
  createPrompt?: Resolver<ResolversTypes['Prompt'], ParentType, ContextType, RequireFields<MutationCreatePromptArgs, 'input'>>;
  createSupportTicket?: Resolver<ResolversTypes['SupportTicket'], ParentType, ContextType, RequireFields<MutationCreateSupportTicketArgs, 'input'>>;
  createTask?: Resolver<ResolversTypes['Task'], ParentType, ContextType, RequireFields<MutationCreateTaskArgs, 'columnId' | 'projectId' | 'title'>>;
  createTool?: Resolver<ResolversTypes['Tool'], ParentType, ContextType, RequireFields<MutationCreateToolArgs, 'input'>>;
  createToolCategory?: Resolver<ResolversTypes['ToolCategory'], ParentType, ContextType, RequireFields<MutationCreateToolCategoryArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['UserCredentials'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  createWebsiteSubmission?: Resolver<ResolversTypes['WebsiteSubmission'], ParentType, ContextType, RequireFields<MutationCreateWebsiteSubmissionArgs, 'input'>>;
  deleteAiJob?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAiJobArgs, 'id'>>;
  deleteAnnouncement?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAnnouncementArgs, 'id'>>;
  deleteBlogPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteBlogPostArgs, 'id'>>;
  deleteBug?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteBugArgs, 'id'>>;
  deleteCampaign?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCampaignArgs, 'id'>>;
  deleteCaseStudy?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCaseStudyArgs, 'id'>>;
  deleteClient?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteClientArgs, 'id'>>;
  deleteColumn?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteColumnArgs, 'id'>>;
  deleteContract?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteContractArgs, 'id'>>;
  deleteDepartment?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteDepartmentArgs, 'id'>>;
  deleteEmailConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEmailConfigArgs, 'id'>>;
  deleteGig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteGigArgs, 'id'>>;
  deleteImageConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteImageConfigArgs, 'id'>>;
  deleteInvoice?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteInvoiceArgs, 'id'>>;
  deleteJob?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteJobArgs, 'id'>>;
  deleteJobCompany?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteJobCompanyArgs, 'id'>>;
  deleteLead?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLeadArgs, 'id'>>;
  deleteLeaveRequest?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLeaveRequestArgs, 'id'>>;
  deleteLegalDocument?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteLegalDocumentArgs, 'id'>>;
  deleteNavLink?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteNavLinkArgs, 'id'>>;
  deletePosition?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeletePositionArgs, 'id'>>;
  deleteProduct?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteProductArgs, 'id'>>;
  deleteProject?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteProjectArgs, 'id'>>;
  deletePrompt?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeletePromptArgs, 'id'>>;
  deleteTask?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTaskArgs, 'id'>>;
  deleteTool?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteToolArgs, 'id'>>;
  deleteToolCategory?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteToolCategoryArgs, 'id'>>;
  deleteUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
  deleteWebsiteSubmission?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteWebsiteSubmissionArgs, 'id'>>;
  grantTrackerAccess?: Resolver<ResolversTypes['TrackerAccess'], ParentType, ContextType, RequireFields<MutationGrantTrackerAccessArgs, 'userId'>>;
  login?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'email' | 'password'>>;
  markAttendance?: Resolver<ResolversTypes['Attendance'], ParentType, ContextType, RequireFields<MutationMarkAttendanceArgs, 'input'>>;
  moveTask?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationMoveTaskArgs, 'id' | 'toColumnId' | 'toIndex'>>;
  renameColumn?: Resolver<ResolversTypes['BoardColumn'], ParentType, ContextType, RequireFields<MutationRenameColumnArgs, 'id' | 'name'>>;
  reorderColumns?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationReorderColumnsArgs, 'columnIds' | 'projectId'>>;
  resetUserPassword?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationResetUserPasswordArgs, 'id'>>;
  revokeTrackerAccess?: Resolver<ResolversTypes['TrackerAccess'], ParentType, ContextType, RequireFields<MutationRevokeTrackerAccessArgs, 'userId'>>;
  revokeTrackerDevice?: Resolver<ResolversTypes['TrackerDevice'], ParentType, ContextType, RequireFields<MutationRevokeTrackerDeviceArgs, 'deviceId'>>;
  sendAdminCredentials?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sendCampaign?: Resolver<ResolversTypes['CampaignSendResult'], ParentType, ContextType, RequireFields<MutationSendCampaignArgs, 'clientIds' | 'id'>>;
  sendContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationSendContractArgs, 'email' | 'id'>>;
  sendTestEmail?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSendTestEmailArgs, 'id' | 'to'>>;
  sendUserMail?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSendUserMailArgs, 'id' | 'input'>>;
  setLeaveStatus?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<MutationSetLeaveStatusArgs, 'id' | 'status'>>;
  setSupportTicketStatus?: Resolver<ResolversTypes['SupportTicket'], ParentType, ContextType, RequireFields<MutationSetSupportTicketStatusArgs, 'id' | 'status'>>;
  setUserActive?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationSetUserActiveArgs, 'id' | 'isActive'>>;
  setUserBlocked?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationSetUserBlockedArgs, 'id' | 'isBlocked'>>;
  signContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationSignContractArgs, 'id' | 'signedBy'>>;
  testImageUpload?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationTestImageUploadArgs, 'file' | 'fileName' | 'id'>>;
  trackerAcceptConsent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  trackerHeartbeat?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  trackerLogin?: Resolver<ResolversTypes['TrackerLoginPayload'], ParentType, ContextType, RequireFields<MutationTrackerLoginArgs, 'device' | 'email' | 'password'>>;
  trackerSetTimezone?: Resolver<ResolversTypes['TrackerAccess'], ParentType, ContextType, RequireFields<MutationTrackerSetTimezoneArgs, 'timezone'>>;
  trackerStartSession?: Resolver<ResolversTypes['TrackerSession'], ParentType, ContextType, RequireFields<MutationTrackerStartSessionArgs, 'startedAt'>>;
  trackerStopSession?: Resolver<ResolversTypes['TrackerSession'], ParentType, ContextType, RequireFields<MutationTrackerStopSessionArgs, 'endedAt' | 'sessionId'>>;
  trackerSyncIntervals?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationTrackerSyncIntervalsArgs, 'intervals' | 'sessionId'>>;
  trackerUploadScreenshot?: Resolver<ResolversTypes['TrackerScreenshot'], ParentType, ContextType, RequireFields<MutationTrackerUploadScreenshotArgs, 'input'>>;
  triageWebsiteSubmission?: Resolver<ResolversTypes['WebsiteSubmission'], ParentType, ContextType, RequireFields<MutationTriageWebsiteSubmissionArgs, 'id' | 'input'>>;
  updateAiJob?: Resolver<ResolversTypes['AiJob'], ParentType, ContextType, RequireFields<MutationUpdateAiJobArgs, 'id' | 'input'>>;
  updateAnnouncement?: Resolver<ResolversTypes['Announcement'], ParentType, ContextType, RequireFields<MutationUpdateAnnouncementArgs, 'id' | 'input'>>;
  updateBlogPost?: Resolver<ResolversTypes['BlogPost'], ParentType, ContextType, RequireFields<MutationUpdateBlogPostArgs, 'id' | 'input'>>;
  updateBranding?: Resolver<ResolversTypes['Branding'], ParentType, ContextType, RequireFields<MutationUpdateBrandingArgs, 'input'>>;
  updateBug?: Resolver<ResolversTypes['Bug'], ParentType, ContextType, RequireFields<MutationUpdateBugArgs, 'id' | 'input'>>;
  updateCampaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType, RequireFields<MutationUpdateCampaignArgs, 'id' | 'input'>>;
  updateCaseStudy?: Resolver<ResolversTypes['CaseStudy'], ParentType, ContextType, RequireFields<MutationUpdateCaseStudyArgs, 'id' | 'input'>>;
  updateClient?: Resolver<ResolversTypes['Client'], ParentType, ContextType, RequireFields<MutationUpdateClientArgs, 'id' | 'input'>>;
  updateContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationUpdateContractArgs, 'id' | 'input'>>;
  updateDepartment?: Resolver<ResolversTypes['Department'], ParentType, ContextType, RequireFields<MutationUpdateDepartmentArgs, 'id' | 'input'>>;
  updateEmailConfig?: Resolver<ResolversTypes['EmailConfig'], ParentType, ContextType, RequireFields<MutationUpdateEmailConfigArgs, 'id' | 'input'>>;
  updateGig?: Resolver<ResolversTypes['Gig'], ParentType, ContextType, RequireFields<MutationUpdateGigArgs, 'id' | 'input'>>;
  updateImageConfig?: Resolver<ResolversTypes['ImageConfig'], ParentType, ContextType, RequireFields<MutationUpdateImageConfigArgs, 'id' | 'input'>>;
  updateInvoice?: Resolver<ResolversTypes['Invoice'], ParentType, ContextType, RequireFields<MutationUpdateInvoiceArgs, 'id' | 'input'>>;
  updateJob?: Resolver<ResolversTypes['Job'], ParentType, ContextType, RequireFields<MutationUpdateJobArgs, 'id' | 'input'>>;
  updateJobCompany?: Resolver<ResolversTypes['JobCompany'], ParentType, ContextType, RequireFields<MutationUpdateJobCompanyArgs, 'id' | 'input'>>;
  updateLead?: Resolver<ResolversTypes['Lead'], ParentType, ContextType, RequireFields<MutationUpdateLeadArgs, 'id' | 'input'>>;
  updateLeaveRequest?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<MutationUpdateLeaveRequestArgs, 'id' | 'input'>>;
  updateLegalDocument?: Resolver<ResolversTypes['LegalDocument'], ParentType, ContextType, RequireFields<MutationUpdateLegalDocumentArgs, 'id' | 'input'>>;
  updateNavLink?: Resolver<ResolversTypes['NavLink'], ParentType, ContextType, RequireFields<MutationUpdateNavLinkArgs, 'id' | 'input'>>;
  updatePosition?: Resolver<ResolversTypes['Position'], ParentType, ContextType, RequireFields<MutationUpdatePositionArgs, 'id' | 'input'>>;
  updateProduct?: Resolver<ResolversTypes['Product'], ParentType, ContextType, RequireFields<MutationUpdateProductArgs, 'id' | 'input'>>;
  updateProfile?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateProfileArgs, 'input'>>;
  updateProject?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<MutationUpdateProjectArgs, 'id' | 'input'>>;
  updatePrompt?: Resolver<ResolversTypes['Prompt'], ParentType, ContextType, RequireFields<MutationUpdatePromptArgs, 'id' | 'input'>>;
  updateSettings?: Resolver<ResolversTypes['AppSettings'], ParentType, ContextType, RequireFields<MutationUpdateSettingsArgs, 'input'>>;
  updateTask?: Resolver<ResolversTypes['Task'], ParentType, ContextType, RequireFields<MutationUpdateTaskArgs, 'id'>>;
  updateTool?: Resolver<ResolversTypes['Tool'], ParentType, ContextType, RequireFields<MutationUpdateToolArgs, 'id' | 'input'>>;
  updateToolCategory?: Resolver<ResolversTypes['ToolCategory'], ParentType, ContextType, RequireFields<MutationUpdateToolCategoryArgs, 'id' | 'input'>>;
  updateTrackerSettings?: Resolver<ResolversTypes['TrackerSettings'], ParentType, ContextType, RequireFields<MutationUpdateTrackerSettingsArgs, 'input'>>;
  updateUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'id' | 'input'>>;
  uploadAvatar?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationUploadAvatarArgs, 'file'>>;
  uploadImage?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationUploadImageArgs, 'file' | 'fileName'>>;
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

export type PolicyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Policy'] = ResolversParentTypes['Policy']> = ResolversObject<{
  category?: Resolver<ResolversTypes['PolicyCategory'], ParentType, ContextType>;
  effectiveDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activeAnnouncements?: Resolver<Array<ResolversTypes['Announcement']>, ParentType, ContextType>;
  appSettings?: Resolver<ResolversTypes['AppSettings'], ParentType, ContextType>;
  attendanceByEmployee?: Resolver<Array<ResolversTypes['Attendance']>, ParentType, ContextType, RequireFields<QueryAttendanceByEmployeeArgs, 'employeeId'>>;
  branding?: Resolver<ResolversTypes['Branding'], ParentType, ContextType>;
  getAiJob?: Resolver<ResolversTypes['AiJob'], ParentType, ContextType, RequireFields<QueryGetAiJobArgs, 'id'>>;
  getAnnouncement?: Resolver<ResolversTypes['Announcement'], ParentType, ContextType, RequireFields<QueryGetAnnouncementArgs, 'id'>>;
  getBlogPost?: Resolver<ResolversTypes['BlogPost'], ParentType, ContextType, RequireFields<QueryGetBlogPostArgs, 'id'>>;
  getBug?: Resolver<ResolversTypes['Bug'], ParentType, ContextType, RequireFields<QueryGetBugArgs, 'id'>>;
  getCampaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType, RequireFields<QueryGetCampaignArgs, 'id'>>;
  getCaseStudy?: Resolver<ResolversTypes['CaseStudy'], ParentType, ContextType, RequireFields<QueryGetCaseStudyArgs, 'id'>>;
  getClient?: Resolver<ResolversTypes['Client'], ParentType, ContextType, RequireFields<QueryGetClientArgs, 'id'>>;
  getContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<QueryGetContractArgs, 'id'>>;
  getDepartment?: Resolver<ResolversTypes['Department'], ParentType, ContextType, RequireFields<QueryGetDepartmentArgs, 'id'>>;
  getGig?: Resolver<ResolversTypes['Gig'], ParentType, ContextType, RequireFields<QueryGetGigArgs, 'id'>>;
  getInvoice?: Resolver<ResolversTypes['Invoice'], ParentType, ContextType, RequireFields<QueryGetInvoiceArgs, 'id'>>;
  getJob?: Resolver<ResolversTypes['Job'], ParentType, ContextType, RequireFields<QueryGetJobArgs, 'id'>>;
  getJobCompany?: Resolver<ResolversTypes['JobCompany'], ParentType, ContextType, RequireFields<QueryGetJobCompanyArgs, 'id'>>;
  getLead?: Resolver<ResolversTypes['Lead'], ParentType, ContextType, RequireFields<QueryGetLeadArgs, 'id'>>;
  getLeaveRequest?: Resolver<ResolversTypes['LeaveRequest'], ParentType, ContextType, RequireFields<QueryGetLeaveRequestArgs, 'id'>>;
  getLegalDocument?: Resolver<ResolversTypes['LegalDocument'], ParentType, ContextType, RequireFields<QueryGetLegalDocumentArgs, 'id'>>;
  getNavLink?: Resolver<ResolversTypes['NavLink'], ParentType, ContextType, RequireFields<QueryGetNavLinkArgs, 'id'>>;
  getPosition?: Resolver<ResolversTypes['Position'], ParentType, ContextType, RequireFields<QueryGetPositionArgs, 'id'>>;
  getProduct?: Resolver<ResolversTypes['Product'], ParentType, ContextType, RequireFields<QueryGetProductArgs, 'id'>>;
  getProject?: Resolver<ResolversTypes['Project'], ParentType, ContextType, RequireFields<QueryGetProjectArgs, 'id'>>;
  getPrompt?: Resolver<ResolversTypes['Prompt'], ParentType, ContextType, RequireFields<QueryGetPromptArgs, 'id'>>;
  getTool?: Resolver<ResolversTypes['Tool'], ParentType, ContextType, RequireFields<QueryGetToolArgs, 'id'>>;
  getToolCategory?: Resolver<ResolversTypes['ToolCategory'], ParentType, ContextType, RequireFields<QueryGetToolCategoryArgs, 'id'>>;
  getUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryGetUserArgs, 'id'>>;
  getWebsiteSubmission?: Resolver<ResolversTypes['WebsiteSubmission'], ParentType, ContextType, RequireFields<QueryGetWebsiteSubmissionArgs, 'id'>>;
  hrDashboard?: Resolver<ResolversTypes['HrDashboard'], ParentType, ContextType>;
  leaveRequestsByEmployee?: Resolver<Array<ResolversTypes['LeaveRequest']>, ParentType, ContextType, RequireFields<QueryLeaveRequestsByEmployeeArgs, 'employeeId'>>;
  listAiJobs?: Resolver<Array<ResolversTypes['AiJob']>, ParentType, ContextType>;
  listAiJobsPaged?: Resolver<ResolversTypes['AiJobPage'], ParentType, ContextType, RequireFields<QueryListAiJobsPagedArgs, 'input'>>;
  listAiJobsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listAnnouncements?: Resolver<Array<ResolversTypes['Announcement']>, ParentType, ContextType>;
  listAnnouncementsPaged?: Resolver<ResolversTypes['AnnouncementPage'], ParentType, ContextType, RequireFields<QueryListAnnouncementsPagedArgs, 'input'>>;
  listAnnouncementsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listAttendance?: Resolver<Array<ResolversTypes['Attendance']>, ParentType, ContextType>;
  listBlogPosts?: Resolver<Array<ResolversTypes['BlogPost']>, ParentType, ContextType>;
  listBlogPostsPaged?: Resolver<ResolversTypes['BlogPostPage'], ParentType, ContextType, RequireFields<QueryListBlogPostsPagedArgs, 'input'>>;
  listBlogPostsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listBugs?: Resolver<Array<ResolversTypes['Bug']>, ParentType, ContextType>;
  listBugsPaged?: Resolver<ResolversTypes['BugPage'], ParentType, ContextType, RequireFields<QueryListBugsPagedArgs, 'input'>>;
  listBugsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listCampaigns?: Resolver<Array<ResolversTypes['Campaign']>, ParentType, ContextType>;
  listCampaignsPaged?: Resolver<ResolversTypes['CampaignPage'], ParentType, ContextType, RequireFields<QueryListCampaignsPagedArgs, 'input'>>;
  listCampaignsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listCaseStudies?: Resolver<Array<ResolversTypes['CaseStudy']>, ParentType, ContextType>;
  listCaseStudiesPaged?: Resolver<ResolversTypes['CaseStudyPage'], ParentType, ContextType, RequireFields<QueryListCaseStudiesPagedArgs, 'input'>>;
  listCaseStudiesStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listClients?: Resolver<Array<ResolversTypes['Client']>, ParentType, ContextType>;
  listClientsPaged?: Resolver<ResolversTypes['ClientPage'], ParentType, ContextType, RequireFields<QueryListClientsPagedArgs, 'input'>>;
  listClientsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listContracts?: Resolver<Array<ResolversTypes['Contract']>, ParentType, ContextType>;
  listContractsPaged?: Resolver<ResolversTypes['ContractPage'], ParentType, ContextType, RequireFields<QueryListContractsPagedArgs, 'input'>>;
  listContractsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listDepartments?: Resolver<Array<ResolversTypes['Department']>, ParentType, ContextType>;
  listEmailConfigs?: Resolver<Array<ResolversTypes['EmailConfig']>, ParentType, ContextType>;
  listGigs?: Resolver<Array<ResolversTypes['Gig']>, ParentType, ContextType>;
  listGigsPaged?: Resolver<ResolversTypes['GigPage'], ParentType, ContextType, RequireFields<QueryListGigsPagedArgs, 'input'>>;
  listGigsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listHolidays?: Resolver<Array<ResolversTypes['Holiday']>, ParentType, ContextType>;
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
  listLeaveRequests?: Resolver<Array<ResolversTypes['LeaveRequest']>, ParentType, ContextType>;
  listLegalDocuments?: Resolver<Array<ResolversTypes['LegalDocument']>, ParentType, ContextType>;
  listLegalDocumentsPaged?: Resolver<ResolversTypes['LegalDocumentPage'], ParentType, ContextType, RequireFields<QueryListLegalDocumentsPagedArgs, 'input'>>;
  listLegalDocumentsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listNavLinks?: Resolver<Array<ResolversTypes['NavLink']>, ParentType, ContextType>;
  listPolicies?: Resolver<Array<ResolversTypes['Policy']>, ParentType, ContextType>;
  listPositions?: Resolver<Array<ResolversTypes['Position']>, ParentType, ContextType>;
  listProducts?: Resolver<Array<ResolversTypes['Product']>, ParentType, ContextType>;
  listProductsPaged?: Resolver<ResolversTypes['ProductPage'], ParentType, ContextType, RequireFields<QueryListProductsPagedArgs, 'input'>>;
  listProductsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listProjects?: Resolver<Array<ResolversTypes['Project']>, ParentType, ContextType>;
  listProjectsPaged?: Resolver<ResolversTypes['ProjectPage'], ParentType, ContextType, RequireFields<QueryListProjectsPagedArgs, 'input'>>;
  listProjectsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listPrompts?: Resolver<Array<ResolversTypes['Prompt']>, ParentType, ContextType>;
  listPromptsPaged?: Resolver<ResolversTypes['PromptPage'], ParentType, ContextType, RequireFields<QueryListPromptsPagedArgs, 'input'>>;
  listPromptsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listSupportTickets?: Resolver<Array<ResolversTypes['SupportTicket']>, ParentType, ContextType>;
  listToolCategories?: Resolver<Array<ResolversTypes['ToolCategory']>, ParentType, ContextType>;
  listTools?: Resolver<Array<ResolversTypes['Tool']>, ParentType, ContextType>;
  listToolsPaged?: Resolver<ResolversTypes['ToolPage'], ParentType, ContextType, RequireFields<QueryListToolsPagedArgs, 'input'>>;
  listToolsStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listUsers?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  listUsersPaged?: Resolver<ResolversTypes['UserPage'], ParentType, ContextType, RequireFields<QueryListUsersPagedArgs, 'input'>>;
  listUsersStats?: Resolver<ResolversTypes['TableStats'], ParentType, ContextType>;
  listWebsiteSubmissions?: Resolver<Array<ResolversTypes['WebsiteSubmission']>, ParentType, ContextType>;
  me?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  myAttendance?: Resolver<Array<ResolversTypes['Attendance']>, ParentType, ContextType>;
  myLeaveRequests?: Resolver<Array<ResolversTypes['LeaveRequest']>, ParentType, ContextType>;
  myPayroll?: Resolver<Maybe<ResolversTypes['SalaryStructure']>, ParentType, ContextType>;
  mySalarySlips?: Resolver<Array<ResolversTypes['SalarySlip']>, ParentType, ContextType>;
  mySupportTickets?: Resolver<Array<ResolversTypes['SupportTicket']>, ParentType, ContextType>;
  myTrackerAccess?: Resolver<Maybe<ResolversTypes['TrackerAccess']>, ParentType, ContextType>;
  myTrackerCalendar?: Resolver<Array<ResolversTypes['TrackerDayBucket']>, ParentType, ContextType, RequireFields<QueryMyTrackerCalendarArgs, 'from' | 'timezone' | 'to'>>;
  myTrackerDay?: Resolver<ResolversTypes['TrackerDay'], ParentType, ContextType, RequireFields<QueryMyTrackerDayArgs, 'end' | 'start'>>;
  myTrackerTotals?: Resolver<ResolversTypes['TrackerTotals'], ParentType, ContextType>;
  projectBoard?: Resolver<ResolversTypes['ProjectBoard'], ParentType, ContextType, RequireFields<QueryProjectBoardArgs, 'projectId'>>;
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
  publicTool?: Resolver<Maybe<ResolversTypes['Tool']>, ParentType, ContextType, RequireFields<QueryPublicToolArgs, 'toolCode'>>;
  publicToolCategories?: Resolver<Array<ResolversTypes['ToolCategory']>, ParentType, ContextType>;
  publicTools?: Resolver<Array<ResolversTypes['Tool']>, ParentType, ContextType, Partial<QueryPublicToolsArgs>>;
  trackerAccessList?: Resolver<Array<ResolversTypes['TrackerAccess']>, ParentType, ContextType>;
  trackerCalendar?: Resolver<Array<ResolversTypes['TrackerDayBucket']>, ParentType, ContextType, RequireFields<QueryTrackerCalendarArgs, 'from' | 'timezone' | 'to' | 'userId'>>;
  trackerDay?: Resolver<ResolversTypes['TrackerDay'], ParentType, ContextType, RequireFields<QueryTrackerDayArgs, 'end' | 'start' | 'userId'>>;
  trackerDevices?: Resolver<Array<ResolversTypes['TrackerDevice']>, ParentType, ContextType, Partial<QueryTrackerDevicesArgs>>;
  trackerMe?: Resolver<ResolversTypes['TrackerMe'], ParentType, ContextType>;
  trackerSettings?: Resolver<ResolversTypes['TrackerSettings'], ParentType, ContextType>;
  trackerTotals?: Resolver<ResolversTypes['TrackerTotals'], ParentType, ContextType, RequireFields<QueryTrackerTotalsArgs, 'userId'>>;
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

export type SalaryStructureResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SalaryStructure'] = ResolversParentTypes['SalaryStructure']> = ResolversObject<{
  allowances?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  basic?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  deductions?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  effectiveFrom?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  employeeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gross?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  hra?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  net?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
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

export type SupportTicketResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SupportTicket'] = ResolversParentTypes['SupportTicket']> = ResolversObject<{
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
  columnId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export type TrackerMeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerMe'] = ResolversParentTypes['TrackerMe']> = ResolversObject<{
  consentRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['TrackerSettings'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
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
  startedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerSettingsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerSettings'] = ResolversParentTypes['TrackerSettings']> = ResolversObject<{
  autoSyncEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  blurScreenshots?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  consentText?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  defaultTimezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  idleThresholdSeconds?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  intervalMinutes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  randomizeScreenshotTiming?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  screenshotMaxWidth?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  screenshotQuality?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  screenshotsPerInterval?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  syncIntervalMinutes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  trackWindowTitles?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TrackerTotalsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TrackerTotals'] = ResolversParentTypes['TrackerTotals']> = ResolversObject<{
  activeMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  idleMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  screenshots?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sessions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  avatarUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  blockReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
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
  AiJob?: AiJobResolvers<ContextType>;
  AiJobPage?: AiJobPageResolvers<ContextType>;
  Announcement?: AnnouncementResolvers<ContextType>;
  AnnouncementPage?: AnnouncementPageResolvers<ContextType>;
  AppSettings?: AppSettingsResolvers<ContextType>;
  Attendance?: AttendanceResolvers<ContextType>;
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  BlogAuthor?: BlogAuthorResolvers<ContextType>;
  BlogPost?: BlogPostResolvers<ContextType>;
  BlogPostPage?: BlogPostPageResolvers<ContextType>;
  BoardColumn?: BoardColumnResolvers<ContextType>;
  Branding?: BrandingResolvers<ContextType>;
  Bug?: BugResolvers<ContextType>;
  BugPage?: BugPageResolvers<ContextType>;
  Campaign?: CampaignResolvers<ContextType>;
  CampaignPage?: CampaignPageResolvers<ContextType>;
  CampaignSendResult?: CampaignSendResultResolvers<ContextType>;
  CaseStudy?: CaseStudyResolvers<ContextType>;
  CaseStudyPage?: CaseStudyPageResolvers<ContextType>;
  Client?: ClientResolvers<ContextType>;
  ClientPage?: ClientPageResolvers<ContextType>;
  CompanyBenefit?: CompanyBenefitResolvers<ContextType>;
  CompanySocialLinks?: CompanySocialLinksResolvers<ContextType>;
  Contract?: ContractResolvers<ContextType>;
  ContractPage?: ContractPageResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Department?: DepartmentResolvers<ContextType>;
  EmailConfig?: EmailConfigResolvers<ContextType>;
  Gig?: GigResolvers<ContextType>;
  GigPage?: GigPageResolvers<ContextType>;
  HeadcountPoint?: HeadcountPointResolvers<ContextType>;
  Holiday?: HolidayResolvers<ContextType>;
  HrDashboard?: HrDashboardResolvers<ContextType>;
  ImageConfig?: ImageConfigResolvers<ContextType>;
  Invoice?: InvoiceResolvers<ContextType>;
  InvoicePage?: InvoicePageResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Job?: JobResolvers<ContextType>;
  JobCompany?: JobCompanyResolvers<ContextType>;
  JobCompanyPage?: JobCompanyPageResolvers<ContextType>;
  JobPage?: JobPageResolvers<ContextType>;
  Lead?: LeadResolvers<ContextType>;
  LeadPage?: LeadPageResolvers<ContextType>;
  LeaveRequest?: LeaveRequestResolvers<ContextType>;
  LegalDocument?: LegalDocumentResolvers<ContextType>;
  LegalDocumentPage?: LegalDocumentPageResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NavLink?: NavLinkResolvers<ContextType>;
  Policy?: PolicyResolvers<ContextType>;
  Position?: PositionResolvers<ContextType>;
  Product?: ProductResolvers<ContextType>;
  ProductPage?: ProductPageResolvers<ContextType>;
  Project?: ProjectResolvers<ContextType>;
  ProjectBoard?: ProjectBoardResolvers<ContextType>;
  ProjectPage?: ProjectPageResolvers<ContextType>;
  Prompt?: PromptResolvers<ContextType>;
  PromptPage?: PromptPageResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SalarySlip?: SalarySlipResolvers<ContextType>;
  SalaryStructure?: SalaryStructureResolvers<ContextType>;
  StatBucket?: StatBucketResolvers<ContextType>;
  StatFieldCounts?: StatFieldCountsResolvers<ContextType>;
  StatFieldSum?: StatFieldSumResolvers<ContextType>;
  SupportTicket?: SupportTicketResolvers<ContextType>;
  TableStats?: TableStatsResolvers<ContextType>;
  Task?: TaskResolvers<ContextType>;
  Tool?: ToolResolvers<ContextType>;
  ToolCategory?: ToolCategoryResolvers<ContextType>;
  ToolPage?: ToolPageResolvers<ContextType>;
  ToolPricing?: ToolPricingResolvers<ContextType>;
  TrackerAccess?: TrackerAccessResolvers<ContextType>;
  TrackerAppUsage?: TrackerAppUsageResolvers<ContextType>;
  TrackerDay?: TrackerDayResolvers<ContextType>;
  TrackerDayBucket?: TrackerDayBucketResolvers<ContextType>;
  TrackerDevice?: TrackerDeviceResolvers<ContextType>;
  TrackerInterval?: TrackerIntervalResolvers<ContextType>;
  TrackerLoginPayload?: TrackerLoginPayloadResolvers<ContextType>;
  TrackerMe?: TrackerMeResolvers<ContextType>;
  TrackerScreenshot?: TrackerScreenshotResolvers<ContextType>;
  TrackerSession?: TrackerSessionResolvers<ContextType>;
  TrackerSettings?: TrackerSettingsResolvers<ContextType>;
  TrackerTotals?: TrackerTotalsResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserCredentials?: UserCredentialsResolvers<ContextType>;
  UserPage?: UserPageResolvers<ContextType>;
  WebsiteSubmission?: WebsiteSubmissionResolvers<ContextType>;
}>;

