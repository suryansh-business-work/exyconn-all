import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
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

export type ListUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type ListUsersQuery = { __typename?: 'Query', listUsers: Array<{ __typename?: 'User', id: string, name: string, email: string, roles: Array<Role>, avatarUrl?: string | null, isActive: boolean, isBlocked: boolean, blockReason?: string | null, department?: string | null, designation?: string | null, joinDate?: string | null, employmentStatus: EmploymentStatus }> };

export type ListUsersPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListUsersPagedQuery = { __typename?: 'Query', listUsersPaged: { __typename?: 'UserPage', totalCount: number, rows: Array<{ __typename?: 'User', id: string, name: string, email: string, roles: Array<Role>, avatarUrl?: string | null, isActive: boolean, isBlocked: boolean, blockReason?: string | null, department?: string | null, designation?: string | null, joinDate?: string | null, employmentStatus: EmploymentStatus }> } };

export type ListUsersStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListUsersStatsQuery = { __typename?: 'Query', listUsersStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', getUser: { __typename?: 'User', id: string, name: string, email: string, roles: Array<Role>, avatarUrl?: string | null, isActive: boolean, isBlocked: boolean, blockReason?: string | null, department?: string | null, designation?: string | null, joinDate?: string | null, employmentStatus: EmploymentStatus, createdAt: string, updatedAt: string } };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'UserCredentials', password: string, user: { __typename?: 'User', id: string, name: string, email: string } } };

export type UpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'User', id: string } };

export type DeleteUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser: boolean };

export type SetUserActiveMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
}>;


export type SetUserActiveMutation = { __typename?: 'Mutation', setUserActive: { __typename?: 'User', id: string, isActive: boolean } };

export type SetUserBlockedMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  isBlocked: Scalars['Boolean']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type SetUserBlockedMutation = { __typename?: 'Mutation', setUserBlocked: { __typename?: 'User', id: string, isBlocked: boolean, blockReason?: string | null } };

export type ResetUserPasswordMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ResetUserPasswordMutation = { __typename?: 'Mutation', resetUserPassword: string };

export type SendUserMailMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: SendMailInput;
}>;


export type SendUserMailMutation = { __typename?: 'Mutation', sendUserMail: boolean };

export type UpdateSettingsMutationVariables = Exact<{
  input: UpdateSettingsInput;
}>;


export type UpdateSettingsMutation = { __typename?: 'Mutation', updateSettings: { __typename?: 'AppSettings', id: string, dateFormat: string, timeFormat: string, timezone: string } };

export type ListAiJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAiJobsQuery = { __typename?: 'Query', listAiJobs: Array<{ __typename?: 'AiJob', id: string, name: string, model: string, prompt: string, status: AiJobStatus }> };

export type ListAiJobsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListAiJobsPagedQuery = { __typename?: 'Query', listAiJobsPaged: { __typename?: 'AiJobPage', totalCount: number, rows: Array<{ __typename?: 'AiJob', id: string, name: string, model: string, prompt: string, status: AiJobStatus }> } };

export type ListAiJobsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAiJobsStatsQuery = { __typename?: 'Query', listAiJobsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateAiJobMutationVariables = Exact<{
  input: AiJobInput;
}>;


export type CreateAiJobMutation = { __typename?: 'Mutation', createAiJob: { __typename?: 'AiJob', id: string } };

export type UpdateAiJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: AiJobInput;
}>;


export type UpdateAiJobMutation = { __typename?: 'Mutation', updateAiJob: { __typename?: 'AiJob', id: string } };

export type DeleteAiJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAiJobMutation = { __typename?: 'Mutation', deleteAiJob: boolean };

export type ListPromptsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListPromptsQuery = { __typename?: 'Query', listPrompts: Array<{ __typename?: 'Prompt', id: string, title: string, category: PromptCategory, content: string, description?: string | null, tags: Array<string> }> };

export type ListPromptsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListPromptsPagedQuery = { __typename?: 'Query', listPromptsPaged: { __typename?: 'PromptPage', totalCount: number, rows: Array<{ __typename?: 'Prompt', id: string, title: string, category: PromptCategory, content: string, description?: string | null, tags: Array<string> }> } };

export type ListPromptsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListPromptsStatsQuery = { __typename?: 'Query', listPromptsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreatePromptMutationVariables = Exact<{
  input: PromptInput;
}>;


export type CreatePromptMutation = { __typename?: 'Mutation', createPrompt: { __typename?: 'Prompt', id: string } };

export type UpdatePromptMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: PromptInput;
}>;


export type UpdatePromptMutation = { __typename?: 'Mutation', updatePrompt: { __typename?: 'Prompt', id: string } };

export type DeletePromptMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePromptMutation = { __typename?: 'Mutation', deletePrompt: boolean };

export type AnnouncementFieldsFragment = { __typename?: 'Announcement', id: string, title: string, body: string, category: AnnouncementCategory, pinned: boolean, publishedAt: string, expiresAt?: string | null };

export type ActiveAnnouncementsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveAnnouncementsQuery = { __typename?: 'Query', activeAnnouncements: Array<{ __typename?: 'Announcement', id: string, title: string, body: string, category: AnnouncementCategory, pinned: boolean, publishedAt: string, expiresAt?: string | null }> };

export type ListAnnouncementsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListAnnouncementsPagedQuery = { __typename?: 'Query', listAnnouncementsPaged: { __typename?: 'AnnouncementPage', totalCount: number, rows: Array<{ __typename?: 'Announcement', id: string, title: string, body: string, category: AnnouncementCategory, pinned: boolean, publishedAt: string, expiresAt?: string | null }> } };

export type ListAnnouncementsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAnnouncementsStatsQuery = { __typename?: 'Query', listAnnouncementsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateAnnouncementMutationVariables = Exact<{
  input: AnnouncementInput;
}>;


export type CreateAnnouncementMutation = { __typename?: 'Mutation', createAnnouncement: { __typename?: 'Announcement', id: string } };

export type UpdateAnnouncementMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: AnnouncementInput;
}>;


export type UpdateAnnouncementMutation = { __typename?: 'Mutation', updateAnnouncement: { __typename?: 'Announcement', id: string } };

export type DeleteAnnouncementMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAnnouncementMutation = { __typename?: 'Mutation', deleteAnnouncement: boolean };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, name: string, email: string, roles: Array<Role>, avatarUrl?: string | null } } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, name: string, email: string, roles: Array<Role>, avatarUrl?: string | null } };

export type AppSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type AppSettingsQuery = { __typename?: 'Query', appSettings: { __typename?: 'AppSettings', id: string, dateFormat: string, timeFormat: string, timezone: string } };

export type SendAdminCredentialsMutationVariables = Exact<{ [key: string]: never; }>;


export type SendAdminCredentialsMutation = { __typename?: 'Mutation', sendAdminCredentials: string };

export type ProjectBoardQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type ProjectBoardQuery = { __typename?: 'Query', projectBoard: { __typename?: 'ProjectBoard', columns: Array<{ __typename?: 'BoardColumn', id: string, name: string, order: number }>, tasks: Array<{ __typename?: 'Task', id: string, columnId: string, title: string, description?: string | null, order: number }> } };

export type CreateColumnMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type CreateColumnMutation = { __typename?: 'Mutation', createColumn: { __typename?: 'BoardColumn', id: string } };

export type RenameColumnMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type RenameColumnMutation = { __typename?: 'Mutation', renameColumn: { __typename?: 'BoardColumn', id: string } };

export type DeleteColumnMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteColumnMutation = { __typename?: 'Mutation', deleteColumn: boolean };

export type ReorderColumnsMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  columnIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type ReorderColumnsMutation = { __typename?: 'Mutation', reorderColumns: boolean };

export type CreateTaskMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  columnId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateTaskMutation = { __typename?: 'Mutation', createTask: { __typename?: 'Task', id: string } };

export type UpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'Task', id: string } };

export type DeleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTaskMutation = { __typename?: 'Mutation', deleteTask: boolean };

export type MoveTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  toColumnId: Scalars['ID']['input'];
  toIndex: Scalars['Int']['input'];
}>;


export type MoveTaskMutation = { __typename?: 'Mutation', moveTask: boolean };

export type GetProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProjectQuery = { __typename?: 'Query', getProject: { __typename?: 'Project', id: string, name: string, description?: string | null, status: ProjectStatus } };

export type BrandingFieldsFragment = { __typename?: 'Branding', id: string, businessName: string, legalName: string, slogan: string, description: string, logoUrl: string, logoDarkUrl: string, faviconUrl: string, appIconUrl: string, emailLogoUrl: string, ogImageUrl: string, primaryColor: string, secondaryColor: string, accentColor: string, backgroundColor: string, textColor: string, supportEmail: string, contactPhone: string, websiteUrl: string, address: string, linkedinUrl: string, twitterUrl: string, facebookUrl: string, instagramUrl: string, youtubeUrl: string, githubUrl: string, copyrightText: string };

export type BrandingQueryVariables = Exact<{ [key: string]: never; }>;


export type BrandingQuery = { __typename?: 'Query', branding: { __typename?: 'Branding', id: string, businessName: string, legalName: string, slogan: string, description: string, logoUrl: string, logoDarkUrl: string, faviconUrl: string, appIconUrl: string, emailLogoUrl: string, ogImageUrl: string, primaryColor: string, secondaryColor: string, accentColor: string, backgroundColor: string, textColor: string, supportEmail: string, contactPhone: string, websiteUrl: string, address: string, linkedinUrl: string, twitterUrl: string, facebookUrl: string, instagramUrl: string, youtubeUrl: string, githubUrl: string, copyrightText: string } };

export type PublicBrandingQueryVariables = Exact<{ [key: string]: never; }>;


export type PublicBrandingQuery = { __typename?: 'Query', publicBranding: { __typename?: 'Branding', id: string, businessName: string, legalName: string, slogan: string, description: string, logoUrl: string, logoDarkUrl: string, faviconUrl: string, appIconUrl: string, emailLogoUrl: string, ogImageUrl: string, primaryColor: string, secondaryColor: string, accentColor: string, backgroundColor: string, textColor: string, supportEmail: string, contactPhone: string, websiteUrl: string, address: string, linkedinUrl: string, twitterUrl: string, facebookUrl: string, instagramUrl: string, youtubeUrl: string, githubUrl: string, copyrightText: string } };

export type UpdateBrandingMutationVariables = Exact<{
  input: BrandingInput;
}>;


export type UpdateBrandingMutation = { __typename?: 'Mutation', updateBranding: { __typename?: 'Branding', id: string, businessName: string, legalName: string, slogan: string, description: string, logoUrl: string, logoDarkUrl: string, faviconUrl: string, appIconUrl: string, emailLogoUrl: string, ogImageUrl: string, primaryColor: string, secondaryColor: string, accentColor: string, backgroundColor: string, textColor: string, supportEmail: string, contactPhone: string, websiteUrl: string, address: string, linkedinUrl: string, twitterUrl: string, facebookUrl: string, instagramUrl: string, youtubeUrl: string, githubUrl: string, copyrightText: string } };

export type UploadImageMutationVariables = Exact<{
  file: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
}>;


export type UploadImageMutation = { __typename?: 'Mutation', uploadImage: string };

export type ListBugsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListBugsQuery = { __typename?: 'Query', listBugs: Array<{ __typename?: 'Bug', id: string, title: string, description: string, severity: BugSeverity, status: BugStatus, assignee: string, dueDate: string }> };

export type ListBugsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListBugsPagedQuery = { __typename?: 'Query', listBugsPaged: { __typename?: 'BugPage', totalCount: number, rows: Array<{ __typename?: 'Bug', id: string, title: string, description: string, severity: BugSeverity, status: BugStatus, assignee: string, dueDate: string }> } };

export type ListBugsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListBugsStatsQuery = { __typename?: 'Query', listBugsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateBugMutationVariables = Exact<{
  input: BugInput;
}>;


export type CreateBugMutation = { __typename?: 'Mutation', createBug: { __typename?: 'Bug', id: string } };

export type UpdateBugMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: BugInput;
}>;


export type UpdateBugMutation = { __typename?: 'Mutation', updateBug: { __typename?: 'Bug', id: string } };

export type DeleteBugMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteBugMutation = { __typename?: 'Mutation', deleteBug: boolean };

export type ListClientsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListClientsQuery = { __typename?: 'Query', listClients: Array<{ __typename?: 'Client', id: string, name: string, email: string, phone: string, company: string, status: ClientStatus }> };

export type ListClientsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListClientsPagedQuery = { __typename?: 'Query', listClientsPaged: { __typename?: 'ClientPage', totalCount: number, rows: Array<{ __typename?: 'Client', id: string, name: string, email: string, phone: string, company: string, status: ClientStatus }> } };

export type ListClientsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListClientsStatsQuery = { __typename?: 'Query', listClientsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateClientMutationVariables = Exact<{
  input: ClientInput;
}>;


export type CreateClientMutation = { __typename?: 'Mutation', createClient: { __typename?: 'Client', id: string } };

export type UpdateClientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ClientInput;
}>;


export type UpdateClientMutation = { __typename?: 'Mutation', updateClient: { __typename?: 'Client', id: string } };

export type DeleteClientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteClientMutation = { __typename?: 'Mutation', deleteClient: boolean };

export type ListLeadsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListLeadsQuery = { __typename?: 'Query', listLeads: Array<{ __typename?: 'Lead', id: string, name: string, email: string, source: LeadSource, stage: LeadStage, value: number, owner: string }> };

export type ListLeadsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListLeadsPagedQuery = { __typename?: 'Query', listLeadsPaged: { __typename?: 'LeadPage', totalCount: number, rows: Array<{ __typename?: 'Lead', id: string, name: string, email: string, source: LeadSource, stage: LeadStage, value: number, owner: string }> } };

export type ListLeadsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListLeadsStatsQuery = { __typename?: 'Query', listLeadsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateLeadMutationVariables = Exact<{
  input: LeadInput;
}>;


export type CreateLeadMutation = { __typename?: 'Mutation', createLead: { __typename?: 'Lead', id: string } };

export type UpdateLeadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: LeadInput;
}>;


export type UpdateLeadMutation = { __typename?: 'Mutation', updateLead: { __typename?: 'Lead', id: string } };

export type DeleteLeadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteLeadMutation = { __typename?: 'Mutation', deleteLead: boolean };

export type PayrollFieldsFragment = { __typename?: 'SalaryStructure', id: string, currency: string, basic: number, hra: number, allowances: number, deductions: number, gross: number, net: number, effectiveFrom: string };

export type SalarySlipFieldsFragment = { __typename?: 'SalarySlip', id: string, month: number, year: number, currency: string, gross: number, deductions: number, net: number, status: SlipStatus, issuedDate: string };

export type PolicyFieldsFragment = { __typename?: 'Policy', id: string, title: string, category: PolicyCategory, summary: string, url?: string | null, effectiveDate: string };

export type HolidayFieldsFragment = { __typename?: 'Holiday', id: string, name: string, date: string, type: HolidayType, description?: string | null };

export type SupportTicketFieldsFragment = { __typename?: 'SupportTicket', id: string, subject: string, category: SupportCategory, description: string, priority: SupportPriority, status: SupportStatus, createdAt: string };

export type MyPayrollQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPayrollQuery = { __typename?: 'Query', myPayroll?: { __typename?: 'SalaryStructure', id: string, currency: string, basic: number, hra: number, allowances: number, deductions: number, gross: number, net: number, effectiveFrom: string } | null };

export type MySalarySlipsQueryVariables = Exact<{ [key: string]: never; }>;


export type MySalarySlipsQuery = { __typename?: 'Query', mySalarySlips: Array<{ __typename?: 'SalarySlip', id: string, month: number, year: number, currency: string, gross: number, deductions: number, net: number, status: SlipStatus, issuedDate: string }> };

export type ListPoliciesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListPoliciesQuery = { __typename?: 'Query', listPolicies: Array<{ __typename?: 'Policy', id: string, title: string, category: PolicyCategory, summary: string, url?: string | null, effectiveDate: string }> };

export type ListHolidaysQueryVariables = Exact<{ [key: string]: never; }>;


export type ListHolidaysQuery = { __typename?: 'Query', listHolidays: Array<{ __typename?: 'Holiday', id: string, name: string, date: string, type: HolidayType, description?: string | null }> };

export type MySupportTicketsQueryVariables = Exact<{ [key: string]: never; }>;


export type MySupportTicketsQuery = { __typename?: 'Query', mySupportTickets: Array<{ __typename?: 'SupportTicket', id: string, subject: string, category: SupportCategory, description: string, priority: SupportPriority, status: SupportStatus, createdAt: string }> };

export type CreateSupportTicketMutationVariables = Exact<{
  input: SupportTicketInput;
}>;


export type CreateSupportTicketMutation = { __typename?: 'Mutation', createSupportTicket: { __typename?: 'SupportTicket', id: string } };

export type ListInvoicesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListInvoicesQuery = { __typename?: 'Query', listInvoices: Array<{ __typename?: 'Invoice', id: string, number: string, clientId: string, amount: number, currency: string, status: InvoiceStatus, issuedDate: string, dueDate: string }> };

export type ListInvoicesPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListInvoicesPagedQuery = { __typename?: 'Query', listInvoicesPaged: { __typename?: 'InvoicePage', totalCount: number, rows: Array<{ __typename?: 'Invoice', id: string, number: string, clientId: string, amount: number, currency: string, status: InvoiceStatus, issuedDate: string, dueDate: string }> } };

export type ListInvoicesStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListInvoicesStatsQuery = { __typename?: 'Query', listInvoicesStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateInvoiceMutationVariables = Exact<{
  input: InvoiceInput;
}>;


export type CreateInvoiceMutation = { __typename?: 'Mutation', createInvoice: { __typename?: 'Invoice', id: string } };

export type UpdateInvoiceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: InvoiceInput;
}>;


export type UpdateInvoiceMutation = { __typename?: 'Mutation', updateInvoice: { __typename?: 'Invoice', id: string } };

export type DeleteInvoiceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteInvoiceMutation = { __typename?: 'Mutation', deleteInvoice: boolean };

export type ListLeaveRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListLeaveRequestsQuery = { __typename?: 'Query', listLeaveRequests: Array<{ __typename?: 'LeaveRequest', id: string, employeeId: string, type: LeaveType, fromDate: string, toDate: string, reason: string, status: LeaveStatus }> };

export type CreateLeaveRequestMutationVariables = Exact<{
  input: LeaveRequestInput;
}>;


export type CreateLeaveRequestMutation = { __typename?: 'Mutation', createLeaveRequest: { __typename?: 'LeaveRequest', id: string } };

export type UpdateLeaveRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: LeaveRequestInput;
}>;


export type UpdateLeaveRequestMutation = { __typename?: 'Mutation', updateLeaveRequest: { __typename?: 'LeaveRequest', id: string } };

export type DeleteLeaveRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteLeaveRequestMutation = { __typename?: 'Mutation', deleteLeaveRequest: boolean };

export type LeaveFieldsFragment = { __typename?: 'LeaveRequest', id: string, employeeId: string, type: LeaveType, fromDate: string, toDate: string, reason: string, status: LeaveStatus };

export type AttendanceFieldsFragment = { __typename?: 'Attendance', id: string, employeeId: string, date: string, status: AttendanceStatus, note?: string | null };

export type MyLeaveRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyLeaveRequestsQuery = { __typename?: 'Query', myLeaveRequests: Array<{ __typename?: 'LeaveRequest', id: string, employeeId: string, type: LeaveType, fromDate: string, toDate: string, reason: string, status: LeaveStatus }> };

export type ApplyLeaveMutationVariables = Exact<{
  input: ApplyLeaveInput;
}>;


export type ApplyLeaveMutation = { __typename?: 'Mutation', applyLeave: { __typename?: 'LeaveRequest', id: string } };

export type MyAttendanceQueryVariables = Exact<{ [key: string]: never; }>;


export type MyAttendanceQuery = { __typename?: 'Query', myAttendance: Array<{ __typename?: 'Attendance', id: string, employeeId: string, date: string, status: AttendanceStatus, note?: string | null }> };

export type MarkAttendanceMutationVariables = Exact<{
  input: MarkAttendanceInput;
}>;


export type MarkAttendanceMutation = { __typename?: 'Mutation', markAttendance: { __typename?: 'Attendance', id: string } };

export type ListAttendanceQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAttendanceQuery = { __typename?: 'Query', listAttendance: Array<{ __typename?: 'Attendance', id: string, employeeId: string, date: string, status: AttendanceStatus, note?: string | null }> };

export type LeaveRequestsByEmployeeQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type LeaveRequestsByEmployeeQuery = { __typename?: 'Query', leaveRequestsByEmployee: Array<{ __typename?: 'LeaveRequest', id: string, employeeId: string, type: LeaveType, fromDate: string, toDate: string, reason: string, status: LeaveStatus }> };

export type AttendanceByEmployeeQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type AttendanceByEmployeeQuery = { __typename?: 'Query', attendanceByEmployee: Array<{ __typename?: 'Attendance', id: string, employeeId: string, date: string, status: AttendanceStatus, note?: string | null }> };

export type SetLeaveStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: LeaveStatus;
}>;


export type SetLeaveStatusMutation = { __typename?: 'Mutation', setLeaveStatus: { __typename?: 'LeaveRequest', id: string, status: LeaveStatus } };

export type HrDashboardQueryVariables = Exact<{ [key: string]: never; }>;


export type HrDashboardQuery = { __typename?: 'Query', hrDashboard: { __typename?: 'HrDashboard', totalEmployees: number, activeEmployees: number, onLeave: number, headcount: Array<{ __typename?: 'HeadcountPoint', label: string, count: number }> } };

export type ListDepartmentsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListDepartmentsQuery = { __typename?: 'Query', listDepartments: Array<{ __typename?: 'Department', id: string, name: string, description?: string | null }> };

export type CreateDepartmentMutationVariables = Exact<{
  input: DepartmentInput;
}>;


export type CreateDepartmentMutation = { __typename?: 'Mutation', createDepartment: { __typename?: 'Department', id: string } };

export type UpdateDepartmentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: DepartmentInput;
}>;


export type UpdateDepartmentMutation = { __typename?: 'Mutation', updateDepartment: { __typename?: 'Department', id: string } };

export type DeleteDepartmentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteDepartmentMutation = { __typename?: 'Mutation', deleteDepartment: boolean };

export type ListPositionsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListPositionsQuery = { __typename?: 'Query', listPositions: Array<{ __typename?: 'Position', id: string, name: string, department: string, description?: string | null }> };

export type CreatePositionMutationVariables = Exact<{
  input: PositionInput;
}>;


export type CreatePositionMutation = { __typename?: 'Mutation', createPosition: { __typename?: 'Position', id: string } };

export type UpdatePositionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: PositionInput;
}>;


export type UpdatePositionMutation = { __typename?: 'Mutation', updatePosition: { __typename?: 'Position', id: string } };

export type DeletePositionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePositionMutation = { __typename?: 'Mutation', deletePosition: boolean };

export type ListContractsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListContractsQuery = { __typename?: 'Query', listContracts: Array<{ __typename?: 'Contract', id: string, title: string, party: string, type: ContractType, effectiveDate: string, expiryDate: string, status: ContractStatus, sentAt?: string | null, signedBy?: string | null, signedAt?: string | null }> };

export type ListContractsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListContractsPagedQuery = { __typename?: 'Query', listContractsPaged: { __typename?: 'ContractPage', totalCount: number, rows: Array<{ __typename?: 'Contract', id: string, title: string, party: string, type: ContractType, effectiveDate: string, expiryDate: string, status: ContractStatus, sentAt?: string | null, signedBy?: string | null, signedAt?: string | null }> } };

export type ListContractsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListContractsStatsQuery = { __typename?: 'Query', listContractsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateContractMutationVariables = Exact<{
  input: ContractInput;
}>;


export type CreateContractMutation = { __typename?: 'Mutation', createContract: { __typename?: 'Contract', id: string } };

export type UpdateContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ContractInput;
}>;


export type UpdateContractMutation = { __typename?: 'Mutation', updateContract: { __typename?: 'Contract', id: string } };

export type DeleteContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteContractMutation = { __typename?: 'Mutation', deleteContract: boolean };

export type SendContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  email: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
}>;


export type SendContractMutation = { __typename?: 'Mutation', sendContract: { __typename?: 'Contract', id: string, sentAt?: string | null } };

export type SignContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  signedBy: Scalars['String']['input'];
}>;


export type SignContractMutation = { __typename?: 'Mutation', signContract: { __typename?: 'Contract', id: string, signedBy?: string | null, signedAt?: string | null, status: ContractStatus } };

export type ListLegalDocumentsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListLegalDocumentsQuery = { __typename?: 'Query', listLegalDocuments: Array<{ __typename?: 'LegalDocument', id: string, title: string, category: DocumentCategory, owner?: string | null, fileUrl?: string | null, status: DocumentStatus }> };

export type ListLegalDocumentsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListLegalDocumentsPagedQuery = { __typename?: 'Query', listLegalDocumentsPaged: { __typename?: 'LegalDocumentPage', totalCount: number, rows: Array<{ __typename?: 'LegalDocument', id: string, title: string, category: DocumentCategory, owner?: string | null, fileUrl?: string | null, status: DocumentStatus }> } };

export type ListLegalDocumentsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListLegalDocumentsStatsQuery = { __typename?: 'Query', listLegalDocumentsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateLegalDocumentMutationVariables = Exact<{
  input: LegalDocumentInput;
}>;


export type CreateLegalDocumentMutation = { __typename?: 'Mutation', createLegalDocument: { __typename?: 'LegalDocument', id: string } };

export type UpdateLegalDocumentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: LegalDocumentInput;
}>;


export type UpdateLegalDocumentMutation = { __typename?: 'Mutation', updateLegalDocument: { __typename?: 'LegalDocument', id: string } };

export type DeleteLegalDocumentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteLegalDocumentMutation = { __typename?: 'Mutation', deleteLegalDocument: boolean };

export type ListCampaignsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListCampaignsQuery = { __typename?: 'Query', listCampaigns: Array<{ __typename?: 'Campaign', id: string, name: string, channel: CampaignChannel, budget: number, startDate: string, endDate: string, status: CampaignStatus, subject?: string | null, body?: string | null, lastSentAt?: string | null, recipientsCount?: number | null }> };

export type ListCampaignsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListCampaignsPagedQuery = { __typename?: 'Query', listCampaignsPaged: { __typename?: 'CampaignPage', totalCount: number, rows: Array<{ __typename?: 'Campaign', id: string, name: string, channel: CampaignChannel, budget: number, startDate: string, endDate: string, status: CampaignStatus, subject?: string | null, body?: string | null, lastSentAt?: string | null, recipientsCount?: number | null }> } };

export type ListCampaignsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListCampaignsStatsQuery = { __typename?: 'Query', listCampaignsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateCampaignMutationVariables = Exact<{
  input: CampaignInput;
}>;


export type CreateCampaignMutation = { __typename?: 'Mutation', createCampaign: { __typename?: 'Campaign', id: string } };

export type UpdateCampaignMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CampaignInput;
}>;


export type UpdateCampaignMutation = { __typename?: 'Mutation', updateCampaign: { __typename?: 'Campaign', id: string } };

export type DeleteCampaignMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCampaignMutation = { __typename?: 'Mutation', deleteCampaign: boolean };

export type SendCampaignMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  clientIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type SendCampaignMutation = { __typename?: 'Mutation', sendCampaign: { __typename?: 'CampaignSendResult', sent: number, failed: number, campaign: { __typename?: 'Campaign', id: string, lastSentAt?: string | null, recipientsCount?: number | null } } };

export type ListProductsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListProductsQuery = { __typename?: 'Query', listProducts: Array<{ __typename?: 'Product', id: string, name: string, sku: string, price: number, category: string, stock: number, status: ProductStatus }> };

export type ListProductsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListProductsPagedQuery = { __typename?: 'Query', listProductsPaged: { __typename?: 'ProductPage', totalCount: number, rows: Array<{ __typename?: 'Product', id: string, name: string, sku: string, price: number, category: string, stock: number, status: ProductStatus }> } };

export type ListProductsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListProductsStatsQuery = { __typename?: 'Query', listProductsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateProductMutationVariables = Exact<{
  input: ProductInput;
}>;


export type CreateProductMutation = { __typename?: 'Mutation', createProduct: { __typename?: 'Product', id: string } };

export type UpdateProductMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ProductInput;
}>;


export type UpdateProductMutation = { __typename?: 'Mutation', updateProduct: { __typename?: 'Product', id: string } };

export type DeleteProductMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProductMutation = { __typename?: 'Mutation', deleteProduct: boolean };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'User', id: string, name: string, email: string, roles: Array<Role>, avatarUrl?: string | null } };

export type ChangePasswordMutationVariables = Exact<{
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ChangePasswordMutation = { __typename?: 'Mutation', changePassword: boolean };

export type UploadAvatarMutationVariables = Exact<{
  file: Scalars['String']['input'];
}>;


export type UploadAvatarMutation = { __typename?: 'Mutation', uploadAvatar: string };

export type ListProjectsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListProjectsQuery = { __typename?: 'Query', listProjects: Array<{ __typename?: 'Project', id: string, name: string, description?: string | null, status: ProjectStatus, startDate?: string | null, endDate?: string | null }> };

export type ListProjectsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListProjectsPagedQuery = { __typename?: 'Query', listProjectsPaged: { __typename?: 'ProjectPage', totalCount: number, rows: Array<{ __typename?: 'Project', id: string, name: string, description?: string | null, status: ProjectStatus, startDate?: string | null, endDate?: string | null }> } };

export type ListProjectsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListProjectsStatsQuery = { __typename?: 'Query', listProjectsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateProjectMutationVariables = Exact<{
  input: ProjectInput;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', createProject: { __typename?: 'Project', id: string } };

export type UpdateProjectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ProjectInput;
}>;


export type UpdateProjectMutation = { __typename?: 'Mutation', updateProject: { __typename?: 'Project', id: string } };

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProjectMutation = { __typename?: 'Mutation', deleteProject: boolean };

export type ListSupportTicketsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListSupportTicketsQuery = { __typename?: 'Query', listSupportTickets: Array<{ __typename?: 'SupportTicket', id: string, employeeName?: string | null, subject: string, category: SupportCategory, description: string, priority: SupportPriority, status: SupportStatus, createdAt: string }> };

export type SetSupportTicketStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: SupportStatus;
}>;


export type SetSupportTicketStatusMutation = { __typename?: 'Mutation', setSupportTicketStatus: { __typename?: 'SupportTicket', id: string, status: SupportStatus } };

export type ListEmailConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListEmailConfigsQuery = { __typename?: 'Query', listEmailConfigs: Array<{ __typename?: 'EmailConfig', id: string, label: string, host: string, port: number, secure: boolean, username: string, password: string, fromAddress: string, isActive: boolean }> };

export type CreateEmailConfigMutationVariables = Exact<{
  input: EmailConfigInput;
}>;


export type CreateEmailConfigMutation = { __typename?: 'Mutation', createEmailConfig: { __typename?: 'EmailConfig', id: string } };

export type UpdateEmailConfigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: EmailConfigInput;
}>;


export type UpdateEmailConfigMutation = { __typename?: 'Mutation', updateEmailConfig: { __typename?: 'EmailConfig', id: string } };

export type DeleteEmailConfigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteEmailConfigMutation = { __typename?: 'Mutation', deleteEmailConfig: boolean };

export type ListImageConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListImageConfigsQuery = { __typename?: 'Query', listImageConfigs: Array<{ __typename?: 'ImageConfig', id: string, label: string, provider: string, publicKey: string, privateKey: string, urlEndpoint: string, isActive: boolean }> };

export type CreateImageConfigMutationVariables = Exact<{
  input: ImageConfigInput;
}>;


export type CreateImageConfigMutation = { __typename?: 'Mutation', createImageConfig: { __typename?: 'ImageConfig', id: string } };

export type UpdateImageConfigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ImageConfigInput;
}>;


export type UpdateImageConfigMutation = { __typename?: 'Mutation', updateImageConfig: { __typename?: 'ImageConfig', id: string } };

export type DeleteImageConfigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteImageConfigMutation = { __typename?: 'Mutation', deleteImageConfig: boolean };

export type SendTestEmailMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  to: Scalars['String']['input'];
}>;


export type SendTestEmailMutation = { __typename?: 'Mutation', sendTestEmail: boolean };

export type TestImageUploadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  file: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
}>;


export type TestImageUploadMutation = { __typename?: 'Mutation', testImageUpload: string };

export type TrackerAccessFieldsFragment = { __typename?: 'TrackerAccess', id: string, userId: string, grantedBy: string, grantedAt: string, revokedAt?: string | null, isActive: boolean, consentedAt?: string | null, timezone: string };

export type TrackerDeviceFieldsFragment = { __typename?: 'TrackerDevice', id: string, userId: string, deviceId: string, platform: string, hostname: string, appVersion: string, machineId: string, osName: string, osVersion: string, arch: string, cpuModel: string, cpuCores: number, totalMemoryMb: number, locale: string, timezone: string, screenCount: number, screenResolution: string, issuedAt: string, lastSeenAt: string, revokedAt?: string | null, isActive: boolean };

export type TrackerSettingsFieldsFragment = { __typename?: 'TrackerSettings', id: string, intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, screenshotMaxWidth: number, screenshotQuality: number, autoSyncEnabled: boolean, syncIntervalMinutes: number, consentText: string, defaultTimezone: string };

export type TrackerDayBucketFieldsFragment = { __typename?: 'TrackerDayBucket', date: string, activeMs: number, idleMs: number, keyCount: number, mouseCount: number, sessions: number };

export type TrackerDayFieldsFragment = { __typename?: 'TrackerDay', intervals: Array<{ __typename?: 'TrackerInterval', id: string, sessionId: string, startedAt: string, endedAt: string, keyCount: number, mouseCount: number, activeMs: number, idleMs: number, activityPercent: number }>, screenshots: Array<{ __typename?: 'TrackerScreenshot', id: string, sessionId: string, intervalStartedAt: string, capturedAt: string, imageUrl: string, displayId: string, blurred: boolean, activityPercent: number }>, sessions: Array<{ __typename?: 'TrackerSession', id: string, startedAt: string, endedAt?: string | null, status: string, activeMs: number, idleMs: number, keyCount: number, mouseCount: number }>, appUsage: Array<{ __typename?: 'TrackerAppUsage', appName: string, durationMs: number }> };

export type TrackerAccessListQueryVariables = Exact<{ [key: string]: never; }>;


export type TrackerAccessListQuery = { __typename?: 'Query', trackerAccessList: Array<{ __typename?: 'TrackerAccess', id: string, userId: string, grantedBy: string, grantedAt: string, revokedAt?: string | null, isActive: boolean, consentedAt?: string | null, timezone: string }> };

export type TrackerDevicesQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type TrackerDevicesQuery = { __typename?: 'Query', trackerDevices: Array<{ __typename?: 'TrackerDevice', id: string, userId: string, deviceId: string, platform: string, hostname: string, appVersion: string, machineId: string, osName: string, osVersion: string, arch: string, cpuModel: string, cpuCores: number, totalMemoryMb: number, locale: string, timezone: string, screenCount: number, screenResolution: string, issuedAt: string, lastSeenAt: string, revokedAt?: string | null, isActive: boolean }> };

export type TrackerSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type TrackerSettingsQuery = { __typename?: 'Query', trackerSettings: { __typename?: 'TrackerSettings', id: string, intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, screenshotMaxWidth: number, screenshotQuality: number, autoSyncEnabled: boolean, syncIntervalMinutes: number, consentText: string, defaultTimezone: string } };

export type TrackerCalendarQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  timezone: Scalars['String']['input'];
}>;


export type TrackerCalendarQuery = { __typename?: 'Query', trackerCalendar: Array<{ __typename?: 'TrackerDayBucket', date: string, activeMs: number, idleMs: number, keyCount: number, mouseCount: number, sessions: number }> };

export type TrackerDayQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type TrackerDayQuery = { __typename?: 'Query', trackerDay: { __typename?: 'TrackerDay', intervals: Array<{ __typename?: 'TrackerInterval', id: string, sessionId: string, startedAt: string, endedAt: string, keyCount: number, mouseCount: number, activeMs: number, idleMs: number, activityPercent: number }>, screenshots: Array<{ __typename?: 'TrackerScreenshot', id: string, sessionId: string, intervalStartedAt: string, capturedAt: string, imageUrl: string, displayId: string, blurred: boolean, activityPercent: number }>, sessions: Array<{ __typename?: 'TrackerSession', id: string, startedAt: string, endedAt?: string | null, status: string, activeMs: number, idleMs: number, keyCount: number, mouseCount: number }>, appUsage: Array<{ __typename?: 'TrackerAppUsage', appName: string, durationMs: number }> } };

export type MyTrackerAccessQueryVariables = Exact<{ [key: string]: never; }>;


export type MyTrackerAccessQuery = { __typename?: 'Query', myTrackerAccess?: { __typename?: 'TrackerAccess', id: string, userId: string, grantedBy: string, grantedAt: string, revokedAt?: string | null, isActive: boolean, consentedAt?: string | null, timezone: string } | null };

export type MyTrackerCalendarQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  timezone: Scalars['String']['input'];
}>;


export type MyTrackerCalendarQuery = { __typename?: 'Query', myTrackerCalendar: Array<{ __typename?: 'TrackerDayBucket', date: string, activeMs: number, idleMs: number, keyCount: number, mouseCount: number, sessions: number }> };

export type MyTrackerDayQueryVariables = Exact<{
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type MyTrackerDayQuery = { __typename?: 'Query', myTrackerDay: { __typename?: 'TrackerDay', intervals: Array<{ __typename?: 'TrackerInterval', id: string, sessionId: string, startedAt: string, endedAt: string, keyCount: number, mouseCount: number, activeMs: number, idleMs: number, activityPercent: number }>, screenshots: Array<{ __typename?: 'TrackerScreenshot', id: string, sessionId: string, intervalStartedAt: string, capturedAt: string, imageUrl: string, displayId: string, blurred: boolean, activityPercent: number }>, sessions: Array<{ __typename?: 'TrackerSession', id: string, startedAt: string, endedAt?: string | null, status: string, activeMs: number, idleMs: number, keyCount: number, mouseCount: number }>, appUsage: Array<{ __typename?: 'TrackerAppUsage', appName: string, durationMs: number }> } };

export type GrantTrackerAccessMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GrantTrackerAccessMutation = { __typename?: 'Mutation', grantTrackerAccess: { __typename?: 'TrackerAccess', id: string, userId: string, grantedBy: string, grantedAt: string, revokedAt?: string | null, isActive: boolean, consentedAt?: string | null, timezone: string } };

export type RevokeTrackerAccessMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type RevokeTrackerAccessMutation = { __typename?: 'Mutation', revokeTrackerAccess: { __typename?: 'TrackerAccess', id: string, userId: string, grantedBy: string, grantedAt: string, revokedAt?: string | null, isActive: boolean, consentedAt?: string | null, timezone: string } };

export type RevokeTrackerDeviceMutationVariables = Exact<{
  deviceId: Scalars['String']['input'];
}>;


export type RevokeTrackerDeviceMutation = { __typename?: 'Mutation', revokeTrackerDevice: { __typename?: 'TrackerDevice', id: string, userId: string, deviceId: string, platform: string, hostname: string, appVersion: string, machineId: string, osName: string, osVersion: string, arch: string, cpuModel: string, cpuCores: number, totalMemoryMb: number, locale: string, timezone: string, screenCount: number, screenResolution: string, issuedAt: string, lastSeenAt: string, revokedAt?: string | null, isActive: boolean } };

export type UpdateTrackerSettingsMutationVariables = Exact<{
  input: TrackerSettingsInput;
}>;


export type UpdateTrackerSettingsMutation = { __typename?: 'Mutation', updateTrackerSettings: { __typename?: 'TrackerSettings', id: string, intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, screenshotMaxWidth: number, screenshotQuality: number, autoSyncEnabled: boolean, syncIntervalMinutes: number, consentText: string, defaultTimezone: string } };

export type BlogPostFieldsFragment = { __typename?: 'BlogPost', id: string, slug: string, title: string, summary: string, content: string, readTime: string, tags: Array<string>, coverImage: string, featured: boolean, isActive: boolean, publishedAt: string, author: { __typename?: 'BlogAuthor', name: string, role: string, initials: string } };

export type ListBlogPostsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListBlogPostsQuery = { __typename?: 'Query', listBlogPosts: Array<{ __typename?: 'BlogPost', id: string, slug: string, title: string, summary: string, content: string, readTime: string, tags: Array<string>, coverImage: string, featured: boolean, isActive: boolean, publishedAt: string, author: { __typename?: 'BlogAuthor', name: string, role: string, initials: string } }> };

export type ListBlogPostsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListBlogPostsPagedQuery = { __typename?: 'Query', listBlogPostsPaged: { __typename?: 'BlogPostPage', totalCount: number, rows: Array<{ __typename?: 'BlogPost', id: string, slug: string, title: string, summary: string, content: string, readTime: string, tags: Array<string>, coverImage: string, featured: boolean, isActive: boolean, publishedAt: string, author: { __typename?: 'BlogAuthor', name: string, role: string, initials: string } }> } };

export type ListBlogPostsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListBlogPostsStatsQuery = { __typename?: 'Query', listBlogPostsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateBlogPostMutationVariables = Exact<{
  input: BlogPostInput;
}>;


export type CreateBlogPostMutation = { __typename?: 'Mutation', createBlogPost: { __typename?: 'BlogPost', id: string } };

export type UpdateBlogPostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: BlogPostInput;
}>;


export type UpdateBlogPostMutation = { __typename?: 'Mutation', updateBlogPost: { __typename?: 'BlogPost', id: string } };

export type DeleteBlogPostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteBlogPostMutation = { __typename?: 'Mutation', deleteBlogPost: boolean };

export type CaseStudyFieldsFragment = { __typename?: 'CaseStudy', id: string, slug: string, title: string, excerpt: string, content: string, coverImage: string, category: string, author: string, tags: Array<string>, pdfUrl: string, featured: boolean, isActive: boolean, publishedAt: string };

export type ListCaseStudiesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListCaseStudiesQuery = { __typename?: 'Query', listCaseStudies: Array<{ __typename?: 'CaseStudy', id: string, slug: string, title: string, excerpt: string, content: string, coverImage: string, category: string, author: string, tags: Array<string>, pdfUrl: string, featured: boolean, isActive: boolean, publishedAt: string }> };

export type ListCaseStudiesPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListCaseStudiesPagedQuery = { __typename?: 'Query', listCaseStudiesPaged: { __typename?: 'CaseStudyPage', totalCount: number, rows: Array<{ __typename?: 'CaseStudy', id: string, slug: string, title: string, excerpt: string, content: string, coverImage: string, category: string, author: string, tags: Array<string>, pdfUrl: string, featured: boolean, isActive: boolean, publishedAt: string }> } };

export type ListCaseStudiesStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListCaseStudiesStatsQuery = { __typename?: 'Query', listCaseStudiesStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateCaseStudyMutationVariables = Exact<{
  input: CaseStudyInput;
}>;


export type CreateCaseStudyMutation = { __typename?: 'Mutation', createCaseStudy: { __typename?: 'CaseStudy', id: string } };

export type UpdateCaseStudyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CaseStudyInput;
}>;


export type UpdateCaseStudyMutation = { __typename?: 'Mutation', updateCaseStudy: { __typename?: 'CaseStudy', id: string } };

export type DeleteCaseStudyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCaseStudyMutation = { __typename?: 'Mutation', deleteCaseStudy: boolean };

export type JobCompanyFieldsFragment = { __typename?: 'JobCompany', id: string, companyCode: string, slug: string, name: string, logo: string, tagline: string, description: string, culture: string, website: string, founded: string, employees: string, industry: string, headquarters: string, brandColor: string, secondaryColor: string, isActive: boolean, order: number, benefits: Array<{ __typename?: 'CompanyBenefit', icon: string, title: string, description: string }>, socialLinks: { __typename?: 'CompanySocialLinks', linkedin: string, twitter: string, facebook: string, instagram: string } };

export type ListJobCompaniesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListJobCompaniesQuery = { __typename?: 'Query', listJobCompanies: Array<{ __typename?: 'JobCompany', id: string, companyCode: string, slug: string, name: string, logo: string, tagline: string, description: string, culture: string, website: string, founded: string, employees: string, industry: string, headquarters: string, brandColor: string, secondaryColor: string, isActive: boolean, order: number, benefits: Array<{ __typename?: 'CompanyBenefit', icon: string, title: string, description: string }>, socialLinks: { __typename?: 'CompanySocialLinks', linkedin: string, twitter: string, facebook: string, instagram: string } }> };

export type ListJobCompaniesPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListJobCompaniesPagedQuery = { __typename?: 'Query', listJobCompaniesPaged: { __typename?: 'JobCompanyPage', totalCount: number, rows: Array<{ __typename?: 'JobCompany', id: string, companyCode: string, slug: string, name: string, logo: string, tagline: string, description: string, culture: string, website: string, founded: string, employees: string, industry: string, headquarters: string, brandColor: string, secondaryColor: string, isActive: boolean, order: number, benefits: Array<{ __typename?: 'CompanyBenefit', icon: string, title: string, description: string }>, socialLinks: { __typename?: 'CompanySocialLinks', linkedin: string, twitter: string, facebook: string, instagram: string } }> } };

export type ListJobCompaniesStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListJobCompaniesStatsQuery = { __typename?: 'Query', listJobCompaniesStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateJobCompanyMutationVariables = Exact<{
  input: JobCompanyInput;
}>;


export type CreateJobCompanyMutation = { __typename?: 'Mutation', createJobCompany: { __typename?: 'JobCompany', id: string } };

export type UpdateJobCompanyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: JobCompanyInput;
}>;


export type UpdateJobCompanyMutation = { __typename?: 'Mutation', updateJobCompany: { __typename?: 'JobCompany', id: string } };

export type DeleteJobCompanyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteJobCompanyMutation = { __typename?: 'Mutation', deleteJobCompany: boolean };

export type JobFieldsFragment = { __typename?: 'Job', id: string, jobCode: string, companySlug: string, title: string, category: string, skillSet: Array<string>, shortJobDescription: string, jobDescription: string, jobResponsibilities: string, requirements: Array<string>, niceToHave: Array<string>, benefits: Array<string>, location: string, jobType: string, experienceLevel: string, workMode: string, salaryRange: string, jobPostDate: string, applicationDeadline?: string | null, isActive: boolean, isFeatured: boolean };

export type ListJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListJobsQuery = { __typename?: 'Query', listJobs: Array<{ __typename?: 'Job', id: string, jobCode: string, companySlug: string, title: string, category: string, skillSet: Array<string>, shortJobDescription: string, jobDescription: string, jobResponsibilities: string, requirements: Array<string>, niceToHave: Array<string>, benefits: Array<string>, location: string, jobType: string, experienceLevel: string, workMode: string, salaryRange: string, jobPostDate: string, applicationDeadline?: string | null, isActive: boolean, isFeatured: boolean }> };

export type ListJobsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListJobsPagedQuery = { __typename?: 'Query', listJobsPaged: { __typename?: 'JobPage', totalCount: number, rows: Array<{ __typename?: 'Job', id: string, jobCode: string, companySlug: string, title: string, category: string, skillSet: Array<string>, shortJobDescription: string, jobDescription: string, jobResponsibilities: string, requirements: Array<string>, niceToHave: Array<string>, benefits: Array<string>, location: string, jobType: string, experienceLevel: string, workMode: string, salaryRange: string, jobPostDate: string, applicationDeadline?: string | null, isActive: boolean, isFeatured: boolean }> } };

export type ListJobsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListJobsStatsQuery = { __typename?: 'Query', listJobsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateJobMutationVariables = Exact<{
  input: JobInput;
}>;


export type CreateJobMutation = { __typename?: 'Mutation', createJob: { __typename?: 'Job', id: string } };

export type UpdateJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: JobInput;
}>;


export type UpdateJobMutation = { __typename?: 'Mutation', updateJob: { __typename?: 'Job', id: string } };

export type DeleteJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteJobMutation = { __typename?: 'Mutation', deleteJob: boolean };

export type GigFieldsFragment = { __typename?: 'Gig', id: string, gigCode: string, title: string, category: string, shortDescription: string, fullDescription: string, deliverables: Array<string>, requirements: Array<string>, tags: Array<string>, budget: string, duration: string, status: string, applicationType: string, applicationContact: string, postedDate: string, deadline?: string | null, isUrgent: boolean };

export type ListGigsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListGigsQuery = { __typename?: 'Query', listGigs: Array<{ __typename?: 'Gig', id: string, gigCode: string, title: string, category: string, shortDescription: string, fullDescription: string, deliverables: Array<string>, requirements: Array<string>, tags: Array<string>, budget: string, duration: string, status: string, applicationType: string, applicationContact: string, postedDate: string, deadline?: string | null, isUrgent: boolean }> };

export type ListGigsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListGigsPagedQuery = { __typename?: 'Query', listGigsPaged: { __typename?: 'GigPage', totalCount: number, rows: Array<{ __typename?: 'Gig', id: string, gigCode: string, title: string, category: string, shortDescription: string, fullDescription: string, deliverables: Array<string>, requirements: Array<string>, tags: Array<string>, budget: string, duration: string, status: string, applicationType: string, applicationContact: string, postedDate: string, deadline?: string | null, isUrgent: boolean }> } };

export type ListGigsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListGigsStatsQuery = { __typename?: 'Query', listGigsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateGigMutationVariables = Exact<{
  input: GigInput;
}>;


export type CreateGigMutation = { __typename?: 'Mutation', createGig: { __typename?: 'Gig', id: string } };

export type UpdateGigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: GigInput;
}>;


export type UpdateGigMutation = { __typename?: 'Mutation', updateGig: { __typename?: 'Gig', id: string } };

export type DeleteGigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteGigMutation = { __typename?: 'Mutation', deleteGig: boolean };

export type ToolCategoryFieldsFragment = { __typename?: 'ToolCategory', id: string, slug: string, category: string, description: string, icon: string, color: string, isActive: boolean, order: number };

export type ListToolCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListToolCategoriesQuery = { __typename?: 'Query', listToolCategories: Array<{ __typename?: 'ToolCategory', id: string, slug: string, category: string, description: string, icon: string, color: string, isActive: boolean, order: number }> };

export type CreateToolCategoryMutationVariables = Exact<{
  input: ToolCategoryInput;
}>;


export type CreateToolCategoryMutation = { __typename?: 'Mutation', createToolCategory: { __typename?: 'ToolCategory', id: string } };

export type UpdateToolCategoryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ToolCategoryInput;
}>;


export type UpdateToolCategoryMutation = { __typename?: 'Mutation', updateToolCategory: { __typename?: 'ToolCategory', id: string } };

export type DeleteToolCategoryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteToolCategoryMutation = { __typename?: 'Mutation', deleteToolCategory: boolean };

export type ToolFieldsFragment = { __typename?: 'Tool', id: string, toolCode: string, categorySlug: string, name: string, description: string, longDescription: string, url: string, icon: string, color: string, features: Array<string>, useCases: Array<string>, keywords: Array<string>, isActive: boolean, isMVP: boolean, order: number };

export type ListToolsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListToolsQuery = { __typename?: 'Query', listTools: Array<{ __typename?: 'Tool', id: string, toolCode: string, categorySlug: string, name: string, description: string, longDescription: string, url: string, icon: string, color: string, features: Array<string>, useCases: Array<string>, keywords: Array<string>, isActive: boolean, isMVP: boolean, order: number }> };

export type ListToolsPagedQueryVariables = Exact<{
  input: TableQueryInput;
}>;


export type ListToolsPagedQuery = { __typename?: 'Query', listToolsPaged: { __typename?: 'ToolPage', totalCount: number, rows: Array<{ __typename?: 'Tool', id: string, toolCode: string, categorySlug: string, name: string, description: string, longDescription: string, url: string, icon: string, color: string, features: Array<string>, useCases: Array<string>, keywords: Array<string>, isActive: boolean, isMVP: boolean, order: number }> } };

export type ListToolsStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListToolsStatsQuery = { __typename?: 'Query', listToolsStats: { __typename?: 'TableStats', total: number, counts: Array<{ __typename?: 'StatFieldCounts', field: string, buckets: Array<{ __typename?: 'StatBucket', value: string, count: number }> }>, sums: Array<{ __typename?: 'StatFieldSum', field: string, total: number }> } };

export type CreateToolMutationVariables = Exact<{
  input: ToolInput;
}>;


export type CreateToolMutation = { __typename?: 'Mutation', createTool: { __typename?: 'Tool', id: string } };

export type UpdateToolMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ToolInput;
}>;


export type UpdateToolMutation = { __typename?: 'Mutation', updateTool: { __typename?: 'Tool', id: string } };

export type DeleteToolMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteToolMutation = { __typename?: 'Mutation', deleteTool: boolean };

export type NavLinkFieldsFragment = { __typename?: 'NavLink', id: string, label: string, href: string, description: string, category: string, keywords: string, isActive: boolean, order: number };

export type ListNavLinksQueryVariables = Exact<{ [key: string]: never; }>;


export type ListNavLinksQuery = { __typename?: 'Query', listNavLinks: Array<{ __typename?: 'NavLink', id: string, label: string, href: string, description: string, category: string, keywords: string, isActive: boolean, order: number }> };

export type CreateNavLinkMutationVariables = Exact<{
  input: NavLinkInput;
}>;


export type CreateNavLinkMutation = { __typename?: 'Mutation', createNavLink: { __typename?: 'NavLink', id: string } };

export type UpdateNavLinkMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: NavLinkInput;
}>;


export type UpdateNavLinkMutation = { __typename?: 'Mutation', updateNavLink: { __typename?: 'NavLink', id: string } };

export type DeleteNavLinkMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteNavLinkMutation = { __typename?: 'Mutation', deleteNavLink: boolean };

export type WebsiteSubmissionFieldsFragment = { __typename?: 'WebsiteSubmission', id: string, formType: string, source: string, submissionData: any, status: string, notes: string, createdAt: string };

export type ListWebsiteSubmissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListWebsiteSubmissionsQuery = { __typename?: 'Query', listWebsiteSubmissions: Array<{ __typename?: 'WebsiteSubmission', id: string, formType: string, source: string, submissionData: any, status: string, notes: string, createdAt: string }> };

export type TriageWebsiteSubmissionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: WebsiteSubmissionTriageInput;
}>;


export type TriageWebsiteSubmissionMutation = { __typename?: 'Mutation', triageWebsiteSubmission: { __typename?: 'WebsiteSubmission', id: string, status: string, notes: string } };

export type DeleteWebsiteSubmissionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteWebsiteSubmissionMutation = { __typename?: 'Mutation', deleteWebsiteSubmission: boolean };

export const AnnouncementFieldsFragmentDoc = gql`
    fragment AnnouncementFields on Announcement {
  id
  title
  body
  category
  pinned
  publishedAt
  expiresAt
}
    `;
export const BrandingFieldsFragmentDoc = gql`
    fragment BrandingFields on Branding {
  id
  businessName
  legalName
  slogan
  description
  logoUrl
  logoDarkUrl
  faviconUrl
  appIconUrl
  emailLogoUrl
  ogImageUrl
  primaryColor
  secondaryColor
  accentColor
  backgroundColor
  textColor
  supportEmail
  contactPhone
  websiteUrl
  address
  linkedinUrl
  twitterUrl
  facebookUrl
  instagramUrl
  youtubeUrl
  githubUrl
  copyrightText
}
    `;
export const PayrollFieldsFragmentDoc = gql`
    fragment PayrollFields on SalaryStructure {
  id
  currency
  basic
  hra
  allowances
  deductions
  gross
  net
  effectiveFrom
}
    `;
export const SalarySlipFieldsFragmentDoc = gql`
    fragment SalarySlipFields on SalarySlip {
  id
  month
  year
  currency
  gross
  deductions
  net
  status
  issuedDate
}
    `;
export const PolicyFieldsFragmentDoc = gql`
    fragment PolicyFields on Policy {
  id
  title
  category
  summary
  url
  effectiveDate
}
    `;
export const HolidayFieldsFragmentDoc = gql`
    fragment HolidayFields on Holiday {
  id
  name
  date
  type
  description
}
    `;
export const SupportTicketFieldsFragmentDoc = gql`
    fragment SupportTicketFields on SupportTicket {
  id
  subject
  category
  description
  priority
  status
  createdAt
}
    `;
export const LeaveFieldsFragmentDoc = gql`
    fragment LeaveFields on LeaveRequest {
  id
  employeeId
  type
  fromDate
  toDate
  reason
  status
}
    `;
export const AttendanceFieldsFragmentDoc = gql`
    fragment AttendanceFields on Attendance {
  id
  employeeId
  date
  status
  note
}
    `;
export const TrackerAccessFieldsFragmentDoc = gql`
    fragment TrackerAccessFields on TrackerAccess {
  id
  userId
  grantedBy
  grantedAt
  revokedAt
  isActive
  consentedAt
  timezone
}
    `;
export const TrackerDeviceFieldsFragmentDoc = gql`
    fragment TrackerDeviceFields on TrackerDevice {
  id
  userId
  deviceId
  platform
  hostname
  appVersion
  machineId
  osName
  osVersion
  arch
  cpuModel
  cpuCores
  totalMemoryMb
  locale
  timezone
  screenCount
  screenResolution
  issuedAt
  lastSeenAt
  revokedAt
  isActive
}
    `;
export const TrackerSettingsFieldsFragmentDoc = gql`
    fragment TrackerSettingsFields on TrackerSettings {
  id
  intervalMinutes
  screenshotsPerInterval
  randomizeScreenshotTiming
  blurScreenshots
  trackWindowTitles
  idleThresholdSeconds
  screenshotMaxWidth
  screenshotQuality
  autoSyncEnabled
  syncIntervalMinutes
  consentText
  defaultTimezone
}
    `;
export const TrackerDayBucketFieldsFragmentDoc = gql`
    fragment TrackerDayBucketFields on TrackerDayBucket {
  date
  activeMs
  idleMs
  keyCount
  mouseCount
  sessions
}
    `;
export const TrackerDayFieldsFragmentDoc = gql`
    fragment TrackerDayFields on TrackerDay {
  intervals {
    id
    sessionId
    startedAt
    endedAt
    keyCount
    mouseCount
    activeMs
    idleMs
    activityPercent
  }
  screenshots {
    id
    sessionId
    intervalStartedAt
    capturedAt
    imageUrl
    displayId
    blurred
    activityPercent
  }
  sessions {
    id
    startedAt
    endedAt
    status
    activeMs
    idleMs
    keyCount
    mouseCount
  }
  appUsage {
    appName
    durationMs
  }
}
    `;
export const BlogPostFieldsFragmentDoc = gql`
    fragment BlogPostFields on BlogPost {
  id
  slug
  title
  summary
  content
  author {
    name
    role
    initials
  }
  readTime
  tags
  coverImage
  featured
  isActive
  publishedAt
}
    `;
export const CaseStudyFieldsFragmentDoc = gql`
    fragment CaseStudyFields on CaseStudy {
  id
  slug
  title
  excerpt
  content
  coverImage
  category
  author
  tags
  pdfUrl
  featured
  isActive
  publishedAt
}
    `;
export const JobCompanyFieldsFragmentDoc = gql`
    fragment JobCompanyFields on JobCompany {
  id
  companyCode
  slug
  name
  logo
  tagline
  description
  culture
  website
  founded
  employees
  industry
  headquarters
  benefits {
    icon
    title
    description
  }
  socialLinks {
    linkedin
    twitter
    facebook
    instagram
  }
  brandColor
  secondaryColor
  isActive
  order
}
    `;
export const JobFieldsFragmentDoc = gql`
    fragment JobFields on Job {
  id
  jobCode
  companySlug
  title
  category
  skillSet
  shortJobDescription
  jobDescription
  jobResponsibilities
  requirements
  niceToHave
  benefits
  location
  jobType
  experienceLevel
  workMode
  salaryRange
  jobPostDate
  applicationDeadline
  isActive
  isFeatured
}
    `;
export const GigFieldsFragmentDoc = gql`
    fragment GigFields on Gig {
  id
  gigCode
  title
  category
  shortDescription
  fullDescription
  deliverables
  requirements
  tags
  budget
  duration
  status
  applicationType
  applicationContact
  postedDate
  deadline
  isUrgent
}
    `;
export const ToolCategoryFieldsFragmentDoc = gql`
    fragment ToolCategoryFields on ToolCategory {
  id
  slug
  category
  description
  icon
  color
  isActive
  order
}
    `;
export const ToolFieldsFragmentDoc = gql`
    fragment ToolFields on Tool {
  id
  toolCode
  categorySlug
  name
  description
  longDescription
  url
  icon
  color
  features
  useCases
  keywords
  isActive
  isMVP
  order
}
    `;
export const NavLinkFieldsFragmentDoc = gql`
    fragment NavLinkFields on NavLink {
  id
  label
  href
  description
  category
  keywords
  isActive
  order
}
    `;
export const WebsiteSubmissionFieldsFragmentDoc = gql`
    fragment WebsiteSubmissionFields on WebsiteSubmission {
  id
  formType
  source
  submissionData
  status
  notes
  createdAt
}
    `;
export const ListUsersDocument = gql`
    query ListUsers {
  listUsers {
    id
    name
    email
    roles
    avatarUrl
    isActive
    isBlocked
    blockReason
    department
    designation
    joinDate
    employmentStatus
  }
}
    `;

/**
 * __useListUsersQuery__
 *
 * To run a query within a React component, call `useListUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useListUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListUsersQuery({
 *   variables: {
 *   },
 * });
 */
export function useListUsersQuery(baseOptions?: Apollo.QueryHookOptions<ListUsersQuery, ListUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListUsersQuery, ListUsersQueryVariables>(ListUsersDocument, options);
      }
export function useListUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListUsersQuery, ListUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListUsersQuery, ListUsersQueryVariables>(ListUsersDocument, options);
        }
// @ts-ignore
export function useListUsersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListUsersQuery, ListUsersQueryVariables>): Apollo.UseSuspenseQueryResult<ListUsersQuery, ListUsersQueryVariables>;
export function useListUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListUsersQuery, ListUsersQueryVariables>): Apollo.UseSuspenseQueryResult<ListUsersQuery | undefined, ListUsersQueryVariables>;
export function useListUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListUsersQuery, ListUsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListUsersQuery, ListUsersQueryVariables>(ListUsersDocument, options);
        }
export type ListUsersQueryHookResult = ReturnType<typeof useListUsersQuery>;
export type ListUsersLazyQueryHookResult = ReturnType<typeof useListUsersLazyQuery>;
export type ListUsersSuspenseQueryHookResult = ReturnType<typeof useListUsersSuspenseQuery>;
export type ListUsersQueryResult = Apollo.QueryResult<ListUsersQuery, ListUsersQueryVariables>;
export const ListUsersPagedDocument = gql`
    query ListUsersPaged($input: TableQueryInput!) {
  listUsersPaged(input: $input) {
    totalCount
    rows {
      id
      name
      email
      roles
      avatarUrl
      isActive
      isBlocked
      blockReason
      department
      designation
      joinDate
      employmentStatus
    }
  }
}
    `;

/**
 * __useListUsersPagedQuery__
 *
 * To run a query within a React component, call `useListUsersPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListUsersPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListUsersPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListUsersPagedQuery(baseOptions: Apollo.QueryHookOptions<ListUsersPagedQuery, ListUsersPagedQueryVariables> & ({ variables: ListUsersPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListUsersPagedQuery, ListUsersPagedQueryVariables>(ListUsersPagedDocument, options);
      }
export function useListUsersPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListUsersPagedQuery, ListUsersPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListUsersPagedQuery, ListUsersPagedQueryVariables>(ListUsersPagedDocument, options);
        }
// @ts-ignore
export function useListUsersPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListUsersPagedQuery, ListUsersPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListUsersPagedQuery, ListUsersPagedQueryVariables>;
export function useListUsersPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListUsersPagedQuery, ListUsersPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListUsersPagedQuery | undefined, ListUsersPagedQueryVariables>;
export function useListUsersPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListUsersPagedQuery, ListUsersPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListUsersPagedQuery, ListUsersPagedQueryVariables>(ListUsersPagedDocument, options);
        }
export type ListUsersPagedQueryHookResult = ReturnType<typeof useListUsersPagedQuery>;
export type ListUsersPagedLazyQueryHookResult = ReturnType<typeof useListUsersPagedLazyQuery>;
export type ListUsersPagedSuspenseQueryHookResult = ReturnType<typeof useListUsersPagedSuspenseQuery>;
export type ListUsersPagedQueryResult = Apollo.QueryResult<ListUsersPagedQuery, ListUsersPagedQueryVariables>;
export const ListUsersStatsDocument = gql`
    query ListUsersStats {
  listUsersStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListUsersStatsQuery__
 *
 * To run a query within a React component, call `useListUsersStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListUsersStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListUsersStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListUsersStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListUsersStatsQuery, ListUsersStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListUsersStatsQuery, ListUsersStatsQueryVariables>(ListUsersStatsDocument, options);
      }
export function useListUsersStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListUsersStatsQuery, ListUsersStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListUsersStatsQuery, ListUsersStatsQueryVariables>(ListUsersStatsDocument, options);
        }
// @ts-ignore
export function useListUsersStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListUsersStatsQuery, ListUsersStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListUsersStatsQuery, ListUsersStatsQueryVariables>;
export function useListUsersStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListUsersStatsQuery, ListUsersStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListUsersStatsQuery | undefined, ListUsersStatsQueryVariables>;
export function useListUsersStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListUsersStatsQuery, ListUsersStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListUsersStatsQuery, ListUsersStatsQueryVariables>(ListUsersStatsDocument, options);
        }
export type ListUsersStatsQueryHookResult = ReturnType<typeof useListUsersStatsQuery>;
export type ListUsersStatsLazyQueryHookResult = ReturnType<typeof useListUsersStatsLazyQuery>;
export type ListUsersStatsSuspenseQueryHookResult = ReturnType<typeof useListUsersStatsSuspenseQuery>;
export type ListUsersStatsQueryResult = Apollo.QueryResult<ListUsersStatsQuery, ListUsersStatsQueryVariables>;
export const GetUserDocument = gql`
    query GetUser($id: ID!) {
  getUser(id: $id) {
    id
    name
    email
    roles
    avatarUrl
    isActive
    isBlocked
    blockReason
    department
    designation
    joinDate
    employmentStatus
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: Apollo.QueryHookOptions<GetUserQuery, GetUserQueryVariables> & ({ variables: GetUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
// @ts-ignore
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserQuery, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserQuery | undefined, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserSuspenseQueryHookResult = ReturnType<typeof useGetUserSuspenseQuery>;
export type GetUserQueryResult = Apollo.QueryResult<GetUserQuery, GetUserQueryVariables>;
export const CreateUserDocument = gql`
    mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    password
    user {
      id
      name
      email
    }
  }
}
    `;
export type CreateUserMutationFn = Apollo.MutationFunction<CreateUserMutation, CreateUserMutationVariables>;

/**
 * __useCreateUserMutation__
 *
 * To run a mutation, you first call `useCreateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUserMutation, { data, loading, error }] = useCreateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateUserMutation(baseOptions?: Apollo.MutationHookOptions<CreateUserMutation, CreateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument, options);
      }
export type CreateUserMutationHookResult = ReturnType<typeof useCreateUserMutation>;
export type CreateUserMutationResult = Apollo.MutationResult<CreateUserMutation>;
export type CreateUserMutationOptions = Apollo.BaseMutationOptions<CreateUserMutation, CreateUserMutationVariables>;
export const UpdateUserDocument = gql`
    mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateUserMutationFn = Apollo.MutationFunction<UpdateUserMutation, UpdateUserMutationVariables>;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, options);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;
export type UpdateUserMutationResult = Apollo.MutationResult<UpdateUserMutation>;
export type UpdateUserMutationOptions = Apollo.BaseMutationOptions<UpdateUserMutation, UpdateUserMutationVariables>;
export const DeleteUserDocument = gql`
    mutation DeleteUser($id: ID!) {
  deleteUser(id: $id)
}
    `;
export type DeleteUserMutationFn = Apollo.MutationFunction<DeleteUserMutation, DeleteUserMutationVariables>;

/**
 * __useDeleteUserMutation__
 *
 * To run a mutation, you first call `useDeleteUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUserMutation, { data, loading, error }] = useDeleteUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteUserMutation(baseOptions?: Apollo.MutationHookOptions<DeleteUserMutation, DeleteUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteUserMutation, DeleteUserMutationVariables>(DeleteUserDocument, options);
      }
export type DeleteUserMutationHookResult = ReturnType<typeof useDeleteUserMutation>;
export type DeleteUserMutationResult = Apollo.MutationResult<DeleteUserMutation>;
export type DeleteUserMutationOptions = Apollo.BaseMutationOptions<DeleteUserMutation, DeleteUserMutationVariables>;
export const SetUserActiveDocument = gql`
    mutation SetUserActive($id: ID!, $isActive: Boolean!) {
  setUserActive(id: $id, isActive: $isActive) {
    id
    isActive
  }
}
    `;
export type SetUserActiveMutationFn = Apollo.MutationFunction<SetUserActiveMutation, SetUserActiveMutationVariables>;

/**
 * __useSetUserActiveMutation__
 *
 * To run a mutation, you first call `useSetUserActiveMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetUserActiveMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setUserActiveMutation, { data, loading, error }] = useSetUserActiveMutation({
 *   variables: {
 *      id: // value for 'id'
 *      isActive: // value for 'isActive'
 *   },
 * });
 */
export function useSetUserActiveMutation(baseOptions?: Apollo.MutationHookOptions<SetUserActiveMutation, SetUserActiveMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetUserActiveMutation, SetUserActiveMutationVariables>(SetUserActiveDocument, options);
      }
export type SetUserActiveMutationHookResult = ReturnType<typeof useSetUserActiveMutation>;
export type SetUserActiveMutationResult = Apollo.MutationResult<SetUserActiveMutation>;
export type SetUserActiveMutationOptions = Apollo.BaseMutationOptions<SetUserActiveMutation, SetUserActiveMutationVariables>;
export const SetUserBlockedDocument = gql`
    mutation SetUserBlocked($id: ID!, $isBlocked: Boolean!, $reason: String) {
  setUserBlocked(id: $id, isBlocked: $isBlocked, reason: $reason) {
    id
    isBlocked
    blockReason
  }
}
    `;
export type SetUserBlockedMutationFn = Apollo.MutationFunction<SetUserBlockedMutation, SetUserBlockedMutationVariables>;

/**
 * __useSetUserBlockedMutation__
 *
 * To run a mutation, you first call `useSetUserBlockedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetUserBlockedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setUserBlockedMutation, { data, loading, error }] = useSetUserBlockedMutation({
 *   variables: {
 *      id: // value for 'id'
 *      isBlocked: // value for 'isBlocked'
 *      reason: // value for 'reason'
 *   },
 * });
 */
export function useSetUserBlockedMutation(baseOptions?: Apollo.MutationHookOptions<SetUserBlockedMutation, SetUserBlockedMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetUserBlockedMutation, SetUserBlockedMutationVariables>(SetUserBlockedDocument, options);
      }
export type SetUserBlockedMutationHookResult = ReturnType<typeof useSetUserBlockedMutation>;
export type SetUserBlockedMutationResult = Apollo.MutationResult<SetUserBlockedMutation>;
export type SetUserBlockedMutationOptions = Apollo.BaseMutationOptions<SetUserBlockedMutation, SetUserBlockedMutationVariables>;
export const ResetUserPasswordDocument = gql`
    mutation ResetUserPassword($id: ID!) {
  resetUserPassword(id: $id)
}
    `;
export type ResetUserPasswordMutationFn = Apollo.MutationFunction<ResetUserPasswordMutation, ResetUserPasswordMutationVariables>;

/**
 * __useResetUserPasswordMutation__
 *
 * To run a mutation, you first call `useResetUserPasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetUserPasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetUserPasswordMutation, { data, loading, error }] = useResetUserPasswordMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useResetUserPasswordMutation(baseOptions?: Apollo.MutationHookOptions<ResetUserPasswordMutation, ResetUserPasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ResetUserPasswordMutation, ResetUserPasswordMutationVariables>(ResetUserPasswordDocument, options);
      }
export type ResetUserPasswordMutationHookResult = ReturnType<typeof useResetUserPasswordMutation>;
export type ResetUserPasswordMutationResult = Apollo.MutationResult<ResetUserPasswordMutation>;
export type ResetUserPasswordMutationOptions = Apollo.BaseMutationOptions<ResetUserPasswordMutation, ResetUserPasswordMutationVariables>;
export const SendUserMailDocument = gql`
    mutation SendUserMail($id: ID!, $input: SendMailInput!) {
  sendUserMail(id: $id, input: $input)
}
    `;
export type SendUserMailMutationFn = Apollo.MutationFunction<SendUserMailMutation, SendUserMailMutationVariables>;

/**
 * __useSendUserMailMutation__
 *
 * To run a mutation, you first call `useSendUserMailMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendUserMailMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendUserMailMutation, { data, loading, error }] = useSendUserMailMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSendUserMailMutation(baseOptions?: Apollo.MutationHookOptions<SendUserMailMutation, SendUserMailMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendUserMailMutation, SendUserMailMutationVariables>(SendUserMailDocument, options);
      }
export type SendUserMailMutationHookResult = ReturnType<typeof useSendUserMailMutation>;
export type SendUserMailMutationResult = Apollo.MutationResult<SendUserMailMutation>;
export type SendUserMailMutationOptions = Apollo.BaseMutationOptions<SendUserMailMutation, SendUserMailMutationVariables>;
export const UpdateSettingsDocument = gql`
    mutation UpdateSettings($input: UpdateSettingsInput!) {
  updateSettings(input: $input) {
    id
    dateFormat
    timeFormat
    timezone
  }
}
    `;
export type UpdateSettingsMutationFn = Apollo.MutationFunction<UpdateSettingsMutation, UpdateSettingsMutationVariables>;

/**
 * __useUpdateSettingsMutation__
 *
 * To run a mutation, you first call `useUpdateSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSettingsMutation, { data, loading, error }] = useUpdateSettingsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSettingsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSettingsMutation, UpdateSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSettingsMutation, UpdateSettingsMutationVariables>(UpdateSettingsDocument, options);
      }
export type UpdateSettingsMutationHookResult = ReturnType<typeof useUpdateSettingsMutation>;
export type UpdateSettingsMutationResult = Apollo.MutationResult<UpdateSettingsMutation>;
export type UpdateSettingsMutationOptions = Apollo.BaseMutationOptions<UpdateSettingsMutation, UpdateSettingsMutationVariables>;
export const ListAiJobsDocument = gql`
    query ListAiJobs {
  listAiJobs {
    id
    name
    model
    prompt
    status
  }
}
    `;

/**
 * __useListAiJobsQuery__
 *
 * To run a query within a React component, call `useListAiJobsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAiJobsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAiJobsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListAiJobsQuery(baseOptions?: Apollo.QueryHookOptions<ListAiJobsQuery, ListAiJobsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListAiJobsQuery, ListAiJobsQueryVariables>(ListAiJobsDocument, options);
      }
export function useListAiJobsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListAiJobsQuery, ListAiJobsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListAiJobsQuery, ListAiJobsQueryVariables>(ListAiJobsDocument, options);
        }
// @ts-ignore
export function useListAiJobsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListAiJobsQuery, ListAiJobsQueryVariables>): Apollo.UseSuspenseQueryResult<ListAiJobsQuery, ListAiJobsQueryVariables>;
export function useListAiJobsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAiJobsQuery, ListAiJobsQueryVariables>): Apollo.UseSuspenseQueryResult<ListAiJobsQuery | undefined, ListAiJobsQueryVariables>;
export function useListAiJobsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAiJobsQuery, ListAiJobsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListAiJobsQuery, ListAiJobsQueryVariables>(ListAiJobsDocument, options);
        }
export type ListAiJobsQueryHookResult = ReturnType<typeof useListAiJobsQuery>;
export type ListAiJobsLazyQueryHookResult = ReturnType<typeof useListAiJobsLazyQuery>;
export type ListAiJobsSuspenseQueryHookResult = ReturnType<typeof useListAiJobsSuspenseQuery>;
export type ListAiJobsQueryResult = Apollo.QueryResult<ListAiJobsQuery, ListAiJobsQueryVariables>;
export const ListAiJobsPagedDocument = gql`
    query ListAiJobsPaged($input: TableQueryInput!) {
  listAiJobsPaged(input: $input) {
    totalCount
    rows {
      id
      name
      model
      prompt
      status
    }
  }
}
    `;

/**
 * __useListAiJobsPagedQuery__
 *
 * To run a query within a React component, call `useListAiJobsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAiJobsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAiJobsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListAiJobsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables> & ({ variables: ListAiJobsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>(ListAiJobsPagedDocument, options);
      }
export function useListAiJobsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>(ListAiJobsPagedDocument, options);
        }
// @ts-ignore
export function useListAiJobsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>;
export function useListAiJobsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListAiJobsPagedQuery | undefined, ListAiJobsPagedQueryVariables>;
export function useListAiJobsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>(ListAiJobsPagedDocument, options);
        }
export type ListAiJobsPagedQueryHookResult = ReturnType<typeof useListAiJobsPagedQuery>;
export type ListAiJobsPagedLazyQueryHookResult = ReturnType<typeof useListAiJobsPagedLazyQuery>;
export type ListAiJobsPagedSuspenseQueryHookResult = ReturnType<typeof useListAiJobsPagedSuspenseQuery>;
export type ListAiJobsPagedQueryResult = Apollo.QueryResult<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>;
export const ListAiJobsStatsDocument = gql`
    query ListAiJobsStats {
  listAiJobsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListAiJobsStatsQuery__
 *
 * To run a query within a React component, call `useListAiJobsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAiJobsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAiJobsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListAiJobsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>(ListAiJobsStatsDocument, options);
      }
export function useListAiJobsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>(ListAiJobsStatsDocument, options);
        }
// @ts-ignore
export function useListAiJobsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>;
export function useListAiJobsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListAiJobsStatsQuery | undefined, ListAiJobsStatsQueryVariables>;
export function useListAiJobsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>(ListAiJobsStatsDocument, options);
        }
export type ListAiJobsStatsQueryHookResult = ReturnType<typeof useListAiJobsStatsQuery>;
export type ListAiJobsStatsLazyQueryHookResult = ReturnType<typeof useListAiJobsStatsLazyQuery>;
export type ListAiJobsStatsSuspenseQueryHookResult = ReturnType<typeof useListAiJobsStatsSuspenseQuery>;
export type ListAiJobsStatsQueryResult = Apollo.QueryResult<ListAiJobsStatsQuery, ListAiJobsStatsQueryVariables>;
export const CreateAiJobDocument = gql`
    mutation CreateAiJob($input: AiJobInput!) {
  createAiJob(input: $input) {
    id
  }
}
    `;
export type CreateAiJobMutationFn = Apollo.MutationFunction<CreateAiJobMutation, CreateAiJobMutationVariables>;

/**
 * __useCreateAiJobMutation__
 *
 * To run a mutation, you first call `useCreateAiJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAiJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAiJobMutation, { data, loading, error }] = useCreateAiJobMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateAiJobMutation(baseOptions?: Apollo.MutationHookOptions<CreateAiJobMutation, CreateAiJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateAiJobMutation, CreateAiJobMutationVariables>(CreateAiJobDocument, options);
      }
export type CreateAiJobMutationHookResult = ReturnType<typeof useCreateAiJobMutation>;
export type CreateAiJobMutationResult = Apollo.MutationResult<CreateAiJobMutation>;
export type CreateAiJobMutationOptions = Apollo.BaseMutationOptions<CreateAiJobMutation, CreateAiJobMutationVariables>;
export const UpdateAiJobDocument = gql`
    mutation UpdateAiJob($id: ID!, $input: AiJobInput!) {
  updateAiJob(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateAiJobMutationFn = Apollo.MutationFunction<UpdateAiJobMutation, UpdateAiJobMutationVariables>;

/**
 * __useUpdateAiJobMutation__
 *
 * To run a mutation, you first call `useUpdateAiJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAiJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAiJobMutation, { data, loading, error }] = useUpdateAiJobMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAiJobMutation(baseOptions?: Apollo.MutationHookOptions<UpdateAiJobMutation, UpdateAiJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateAiJobMutation, UpdateAiJobMutationVariables>(UpdateAiJobDocument, options);
      }
export type UpdateAiJobMutationHookResult = ReturnType<typeof useUpdateAiJobMutation>;
export type UpdateAiJobMutationResult = Apollo.MutationResult<UpdateAiJobMutation>;
export type UpdateAiJobMutationOptions = Apollo.BaseMutationOptions<UpdateAiJobMutation, UpdateAiJobMutationVariables>;
export const DeleteAiJobDocument = gql`
    mutation DeleteAiJob($id: ID!) {
  deleteAiJob(id: $id)
}
    `;
export type DeleteAiJobMutationFn = Apollo.MutationFunction<DeleteAiJobMutation, DeleteAiJobMutationVariables>;

/**
 * __useDeleteAiJobMutation__
 *
 * To run a mutation, you first call `useDeleteAiJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAiJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAiJobMutation, { data, loading, error }] = useDeleteAiJobMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteAiJobMutation(baseOptions?: Apollo.MutationHookOptions<DeleteAiJobMutation, DeleteAiJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteAiJobMutation, DeleteAiJobMutationVariables>(DeleteAiJobDocument, options);
      }
export type DeleteAiJobMutationHookResult = ReturnType<typeof useDeleteAiJobMutation>;
export type DeleteAiJobMutationResult = Apollo.MutationResult<DeleteAiJobMutation>;
export type DeleteAiJobMutationOptions = Apollo.BaseMutationOptions<DeleteAiJobMutation, DeleteAiJobMutationVariables>;
export const ListPromptsDocument = gql`
    query ListPrompts {
  listPrompts {
    id
    title
    category
    content
    description
    tags
  }
}
    `;

/**
 * __useListPromptsQuery__
 *
 * To run a query within a React component, call `useListPromptsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListPromptsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListPromptsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListPromptsQuery(baseOptions?: Apollo.QueryHookOptions<ListPromptsQuery, ListPromptsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListPromptsQuery, ListPromptsQueryVariables>(ListPromptsDocument, options);
      }
export function useListPromptsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListPromptsQuery, ListPromptsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListPromptsQuery, ListPromptsQueryVariables>(ListPromptsDocument, options);
        }
// @ts-ignore
export function useListPromptsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListPromptsQuery, ListPromptsQueryVariables>): Apollo.UseSuspenseQueryResult<ListPromptsQuery, ListPromptsQueryVariables>;
export function useListPromptsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPromptsQuery, ListPromptsQueryVariables>): Apollo.UseSuspenseQueryResult<ListPromptsQuery | undefined, ListPromptsQueryVariables>;
export function useListPromptsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPromptsQuery, ListPromptsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListPromptsQuery, ListPromptsQueryVariables>(ListPromptsDocument, options);
        }
export type ListPromptsQueryHookResult = ReturnType<typeof useListPromptsQuery>;
export type ListPromptsLazyQueryHookResult = ReturnType<typeof useListPromptsLazyQuery>;
export type ListPromptsSuspenseQueryHookResult = ReturnType<typeof useListPromptsSuspenseQuery>;
export type ListPromptsQueryResult = Apollo.QueryResult<ListPromptsQuery, ListPromptsQueryVariables>;
export const ListPromptsPagedDocument = gql`
    query ListPromptsPaged($input: TableQueryInput!) {
  listPromptsPaged(input: $input) {
    totalCount
    rows {
      id
      title
      category
      content
      description
      tags
    }
  }
}
    `;

/**
 * __useListPromptsPagedQuery__
 *
 * To run a query within a React component, call `useListPromptsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListPromptsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListPromptsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListPromptsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListPromptsPagedQuery, ListPromptsPagedQueryVariables> & ({ variables: ListPromptsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>(ListPromptsPagedDocument, options);
      }
export function useListPromptsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>(ListPromptsPagedDocument, options);
        }
// @ts-ignore
export function useListPromptsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>;
export function useListPromptsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListPromptsPagedQuery | undefined, ListPromptsPagedQueryVariables>;
export function useListPromptsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>(ListPromptsPagedDocument, options);
        }
export type ListPromptsPagedQueryHookResult = ReturnType<typeof useListPromptsPagedQuery>;
export type ListPromptsPagedLazyQueryHookResult = ReturnType<typeof useListPromptsPagedLazyQuery>;
export type ListPromptsPagedSuspenseQueryHookResult = ReturnType<typeof useListPromptsPagedSuspenseQuery>;
export type ListPromptsPagedQueryResult = Apollo.QueryResult<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>;
export const ListPromptsStatsDocument = gql`
    query ListPromptsStats {
  listPromptsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListPromptsStatsQuery__
 *
 * To run a query within a React component, call `useListPromptsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListPromptsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListPromptsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListPromptsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>(ListPromptsStatsDocument, options);
      }
export function useListPromptsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>(ListPromptsStatsDocument, options);
        }
// @ts-ignore
export function useListPromptsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>;
export function useListPromptsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListPromptsStatsQuery | undefined, ListPromptsStatsQueryVariables>;
export function useListPromptsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>(ListPromptsStatsDocument, options);
        }
export type ListPromptsStatsQueryHookResult = ReturnType<typeof useListPromptsStatsQuery>;
export type ListPromptsStatsLazyQueryHookResult = ReturnType<typeof useListPromptsStatsLazyQuery>;
export type ListPromptsStatsSuspenseQueryHookResult = ReturnType<typeof useListPromptsStatsSuspenseQuery>;
export type ListPromptsStatsQueryResult = Apollo.QueryResult<ListPromptsStatsQuery, ListPromptsStatsQueryVariables>;
export const CreatePromptDocument = gql`
    mutation CreatePrompt($input: PromptInput!) {
  createPrompt(input: $input) {
    id
  }
}
    `;
export type CreatePromptMutationFn = Apollo.MutationFunction<CreatePromptMutation, CreatePromptMutationVariables>;

/**
 * __useCreatePromptMutation__
 *
 * To run a mutation, you first call `useCreatePromptMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePromptMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPromptMutation, { data, loading, error }] = useCreatePromptMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePromptMutation(baseOptions?: Apollo.MutationHookOptions<CreatePromptMutation, CreatePromptMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreatePromptMutation, CreatePromptMutationVariables>(CreatePromptDocument, options);
      }
export type CreatePromptMutationHookResult = ReturnType<typeof useCreatePromptMutation>;
export type CreatePromptMutationResult = Apollo.MutationResult<CreatePromptMutation>;
export type CreatePromptMutationOptions = Apollo.BaseMutationOptions<CreatePromptMutation, CreatePromptMutationVariables>;
export const UpdatePromptDocument = gql`
    mutation UpdatePrompt($id: ID!, $input: PromptInput!) {
  updatePrompt(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdatePromptMutationFn = Apollo.MutationFunction<UpdatePromptMutation, UpdatePromptMutationVariables>;

/**
 * __useUpdatePromptMutation__
 *
 * To run a mutation, you first call `useUpdatePromptMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePromptMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePromptMutation, { data, loading, error }] = useUpdatePromptMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePromptMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePromptMutation, UpdatePromptMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePromptMutation, UpdatePromptMutationVariables>(UpdatePromptDocument, options);
      }
export type UpdatePromptMutationHookResult = ReturnType<typeof useUpdatePromptMutation>;
export type UpdatePromptMutationResult = Apollo.MutationResult<UpdatePromptMutation>;
export type UpdatePromptMutationOptions = Apollo.BaseMutationOptions<UpdatePromptMutation, UpdatePromptMutationVariables>;
export const DeletePromptDocument = gql`
    mutation DeletePrompt($id: ID!) {
  deletePrompt(id: $id)
}
    `;
export type DeletePromptMutationFn = Apollo.MutationFunction<DeletePromptMutation, DeletePromptMutationVariables>;

/**
 * __useDeletePromptMutation__
 *
 * To run a mutation, you first call `useDeletePromptMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePromptMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePromptMutation, { data, loading, error }] = useDeletePromptMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePromptMutation(baseOptions?: Apollo.MutationHookOptions<DeletePromptMutation, DeletePromptMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeletePromptMutation, DeletePromptMutationVariables>(DeletePromptDocument, options);
      }
export type DeletePromptMutationHookResult = ReturnType<typeof useDeletePromptMutation>;
export type DeletePromptMutationResult = Apollo.MutationResult<DeletePromptMutation>;
export type DeletePromptMutationOptions = Apollo.BaseMutationOptions<DeletePromptMutation, DeletePromptMutationVariables>;
export const ActiveAnnouncementsDocument = gql`
    query ActiveAnnouncements {
  activeAnnouncements {
    ...AnnouncementFields
  }
}
    ${AnnouncementFieldsFragmentDoc}`;

/**
 * __useActiveAnnouncementsQuery__
 *
 * To run a query within a React component, call `useActiveAnnouncementsQuery` and pass it any options that fit your needs.
 * When your component renders, `useActiveAnnouncementsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useActiveAnnouncementsQuery({
 *   variables: {
 *   },
 * });
 */
export function useActiveAnnouncementsQuery(baseOptions?: Apollo.QueryHookOptions<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>(ActiveAnnouncementsDocument, options);
      }
export function useActiveAnnouncementsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>(ActiveAnnouncementsDocument, options);
        }
// @ts-ignore
export function useActiveAnnouncementsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>): Apollo.UseSuspenseQueryResult<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>;
export function useActiveAnnouncementsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>): Apollo.UseSuspenseQueryResult<ActiveAnnouncementsQuery | undefined, ActiveAnnouncementsQueryVariables>;
export function useActiveAnnouncementsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>(ActiveAnnouncementsDocument, options);
        }
export type ActiveAnnouncementsQueryHookResult = ReturnType<typeof useActiveAnnouncementsQuery>;
export type ActiveAnnouncementsLazyQueryHookResult = ReturnType<typeof useActiveAnnouncementsLazyQuery>;
export type ActiveAnnouncementsSuspenseQueryHookResult = ReturnType<typeof useActiveAnnouncementsSuspenseQuery>;
export type ActiveAnnouncementsQueryResult = Apollo.QueryResult<ActiveAnnouncementsQuery, ActiveAnnouncementsQueryVariables>;
export const ListAnnouncementsPagedDocument = gql`
    query ListAnnouncementsPaged($input: TableQueryInput!) {
  listAnnouncementsPaged(input: $input) {
    totalCount
    rows {
      ...AnnouncementFields
    }
  }
}
    ${AnnouncementFieldsFragmentDoc}`;

/**
 * __useListAnnouncementsPagedQuery__
 *
 * To run a query within a React component, call `useListAnnouncementsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAnnouncementsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAnnouncementsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListAnnouncementsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables> & ({ variables: ListAnnouncementsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables>(ListAnnouncementsPagedDocument, options);
      }
export function useListAnnouncementsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables>(ListAnnouncementsPagedDocument, options);
        }
// @ts-ignore
export function useListAnnouncementsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables>;
export function useListAnnouncementsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListAnnouncementsPagedQuery | undefined, ListAnnouncementsPagedQueryVariables>;
export function useListAnnouncementsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables>(ListAnnouncementsPagedDocument, options);
        }
export type ListAnnouncementsPagedQueryHookResult = ReturnType<typeof useListAnnouncementsPagedQuery>;
export type ListAnnouncementsPagedLazyQueryHookResult = ReturnType<typeof useListAnnouncementsPagedLazyQuery>;
export type ListAnnouncementsPagedSuspenseQueryHookResult = ReturnType<typeof useListAnnouncementsPagedSuspenseQuery>;
export type ListAnnouncementsPagedQueryResult = Apollo.QueryResult<ListAnnouncementsPagedQuery, ListAnnouncementsPagedQueryVariables>;
export const ListAnnouncementsStatsDocument = gql`
    query ListAnnouncementsStats {
  listAnnouncementsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListAnnouncementsStatsQuery__
 *
 * To run a query within a React component, call `useListAnnouncementsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAnnouncementsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAnnouncementsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListAnnouncementsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>(ListAnnouncementsStatsDocument, options);
      }
export function useListAnnouncementsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>(ListAnnouncementsStatsDocument, options);
        }
// @ts-ignore
export function useListAnnouncementsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>;
export function useListAnnouncementsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListAnnouncementsStatsQuery | undefined, ListAnnouncementsStatsQueryVariables>;
export function useListAnnouncementsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>(ListAnnouncementsStatsDocument, options);
        }
export type ListAnnouncementsStatsQueryHookResult = ReturnType<typeof useListAnnouncementsStatsQuery>;
export type ListAnnouncementsStatsLazyQueryHookResult = ReturnType<typeof useListAnnouncementsStatsLazyQuery>;
export type ListAnnouncementsStatsSuspenseQueryHookResult = ReturnType<typeof useListAnnouncementsStatsSuspenseQuery>;
export type ListAnnouncementsStatsQueryResult = Apollo.QueryResult<ListAnnouncementsStatsQuery, ListAnnouncementsStatsQueryVariables>;
export const CreateAnnouncementDocument = gql`
    mutation CreateAnnouncement($input: AnnouncementInput!) {
  createAnnouncement(input: $input) {
    id
  }
}
    `;
export type CreateAnnouncementMutationFn = Apollo.MutationFunction<CreateAnnouncementMutation, CreateAnnouncementMutationVariables>;

/**
 * __useCreateAnnouncementMutation__
 *
 * To run a mutation, you first call `useCreateAnnouncementMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAnnouncementMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAnnouncementMutation, { data, loading, error }] = useCreateAnnouncementMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateAnnouncementMutation(baseOptions?: Apollo.MutationHookOptions<CreateAnnouncementMutation, CreateAnnouncementMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateAnnouncementMutation, CreateAnnouncementMutationVariables>(CreateAnnouncementDocument, options);
      }
export type CreateAnnouncementMutationHookResult = ReturnType<typeof useCreateAnnouncementMutation>;
export type CreateAnnouncementMutationResult = Apollo.MutationResult<CreateAnnouncementMutation>;
export type CreateAnnouncementMutationOptions = Apollo.BaseMutationOptions<CreateAnnouncementMutation, CreateAnnouncementMutationVariables>;
export const UpdateAnnouncementDocument = gql`
    mutation UpdateAnnouncement($id: ID!, $input: AnnouncementInput!) {
  updateAnnouncement(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateAnnouncementMutationFn = Apollo.MutationFunction<UpdateAnnouncementMutation, UpdateAnnouncementMutationVariables>;

/**
 * __useUpdateAnnouncementMutation__
 *
 * To run a mutation, you first call `useUpdateAnnouncementMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAnnouncementMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAnnouncementMutation, { data, loading, error }] = useUpdateAnnouncementMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAnnouncementMutation(baseOptions?: Apollo.MutationHookOptions<UpdateAnnouncementMutation, UpdateAnnouncementMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateAnnouncementMutation, UpdateAnnouncementMutationVariables>(UpdateAnnouncementDocument, options);
      }
export type UpdateAnnouncementMutationHookResult = ReturnType<typeof useUpdateAnnouncementMutation>;
export type UpdateAnnouncementMutationResult = Apollo.MutationResult<UpdateAnnouncementMutation>;
export type UpdateAnnouncementMutationOptions = Apollo.BaseMutationOptions<UpdateAnnouncementMutation, UpdateAnnouncementMutationVariables>;
export const DeleteAnnouncementDocument = gql`
    mutation DeleteAnnouncement($id: ID!) {
  deleteAnnouncement(id: $id)
}
    `;
export type DeleteAnnouncementMutationFn = Apollo.MutationFunction<DeleteAnnouncementMutation, DeleteAnnouncementMutationVariables>;

/**
 * __useDeleteAnnouncementMutation__
 *
 * To run a mutation, you first call `useDeleteAnnouncementMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAnnouncementMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAnnouncementMutation, { data, loading, error }] = useDeleteAnnouncementMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteAnnouncementMutation(baseOptions?: Apollo.MutationHookOptions<DeleteAnnouncementMutation, DeleteAnnouncementMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteAnnouncementMutation, DeleteAnnouncementMutationVariables>(DeleteAnnouncementDocument, options);
      }
export type DeleteAnnouncementMutationHookResult = ReturnType<typeof useDeleteAnnouncementMutation>;
export type DeleteAnnouncementMutationResult = Apollo.MutationResult<DeleteAnnouncementMutation>;
export type DeleteAnnouncementMutationOptions = Apollo.BaseMutationOptions<DeleteAnnouncementMutation, DeleteAnnouncementMutationVariables>;
export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      name
      email
      roles
      avatarUrl
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const MeDocument = gql`
    query Me {
  me {
    id
    name
    email
    roles
    avatarUrl
  }
}
    `;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
// @ts-ignore
export function useMeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery | undefined, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const AppSettingsDocument = gql`
    query AppSettings {
  appSettings {
    id
    dateFormat
    timeFormat
    timezone
  }
}
    `;

/**
 * __useAppSettingsQuery__
 *
 * To run a query within a React component, call `useAppSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAppSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAppSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useAppSettingsQuery(baseOptions?: Apollo.QueryHookOptions<AppSettingsQuery, AppSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AppSettingsQuery, AppSettingsQueryVariables>(AppSettingsDocument, options);
      }
export function useAppSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AppSettingsQuery, AppSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AppSettingsQuery, AppSettingsQueryVariables>(AppSettingsDocument, options);
        }
// @ts-ignore
export function useAppSettingsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<AppSettingsQuery, AppSettingsQueryVariables>): Apollo.UseSuspenseQueryResult<AppSettingsQuery, AppSettingsQueryVariables>;
export function useAppSettingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AppSettingsQuery, AppSettingsQueryVariables>): Apollo.UseSuspenseQueryResult<AppSettingsQuery | undefined, AppSettingsQueryVariables>;
export function useAppSettingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AppSettingsQuery, AppSettingsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<AppSettingsQuery, AppSettingsQueryVariables>(AppSettingsDocument, options);
        }
export type AppSettingsQueryHookResult = ReturnType<typeof useAppSettingsQuery>;
export type AppSettingsLazyQueryHookResult = ReturnType<typeof useAppSettingsLazyQuery>;
export type AppSettingsSuspenseQueryHookResult = ReturnType<typeof useAppSettingsSuspenseQuery>;
export type AppSettingsQueryResult = Apollo.QueryResult<AppSettingsQuery, AppSettingsQueryVariables>;
export const SendAdminCredentialsDocument = gql`
    mutation SendAdminCredentials {
  sendAdminCredentials
}
    `;
export type SendAdminCredentialsMutationFn = Apollo.MutationFunction<SendAdminCredentialsMutation, SendAdminCredentialsMutationVariables>;

/**
 * __useSendAdminCredentialsMutation__
 *
 * To run a mutation, you first call `useSendAdminCredentialsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendAdminCredentialsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendAdminCredentialsMutation, { data, loading, error }] = useSendAdminCredentialsMutation({
 *   variables: {
 *   },
 * });
 */
export function useSendAdminCredentialsMutation(baseOptions?: Apollo.MutationHookOptions<SendAdminCredentialsMutation, SendAdminCredentialsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendAdminCredentialsMutation, SendAdminCredentialsMutationVariables>(SendAdminCredentialsDocument, options);
      }
export type SendAdminCredentialsMutationHookResult = ReturnType<typeof useSendAdminCredentialsMutation>;
export type SendAdminCredentialsMutationResult = Apollo.MutationResult<SendAdminCredentialsMutation>;
export type SendAdminCredentialsMutationOptions = Apollo.BaseMutationOptions<SendAdminCredentialsMutation, SendAdminCredentialsMutationVariables>;
export const ProjectBoardDocument = gql`
    query ProjectBoard($projectId: ID!) {
  projectBoard(projectId: $projectId) {
    columns {
      id
      name
      order
    }
    tasks {
      id
      columnId
      title
      description
      order
    }
  }
}
    `;

/**
 * __useProjectBoardQuery__
 *
 * To run a query within a React component, call `useProjectBoardQuery` and pass it any options that fit your needs.
 * When your component renders, `useProjectBoardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProjectBoardQuery({
 *   variables: {
 *      projectId: // value for 'projectId'
 *   },
 * });
 */
export function useProjectBoardQuery(baseOptions: Apollo.QueryHookOptions<ProjectBoardQuery, ProjectBoardQueryVariables> & ({ variables: ProjectBoardQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProjectBoardQuery, ProjectBoardQueryVariables>(ProjectBoardDocument, options);
      }
export function useProjectBoardLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProjectBoardQuery, ProjectBoardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProjectBoardQuery, ProjectBoardQueryVariables>(ProjectBoardDocument, options);
        }
// @ts-ignore
export function useProjectBoardSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ProjectBoardQuery, ProjectBoardQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectBoardQuery, ProjectBoardQueryVariables>;
export function useProjectBoardSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectBoardQuery, ProjectBoardQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectBoardQuery | undefined, ProjectBoardQueryVariables>;
export function useProjectBoardSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectBoardQuery, ProjectBoardQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ProjectBoardQuery, ProjectBoardQueryVariables>(ProjectBoardDocument, options);
        }
export type ProjectBoardQueryHookResult = ReturnType<typeof useProjectBoardQuery>;
export type ProjectBoardLazyQueryHookResult = ReturnType<typeof useProjectBoardLazyQuery>;
export type ProjectBoardSuspenseQueryHookResult = ReturnType<typeof useProjectBoardSuspenseQuery>;
export type ProjectBoardQueryResult = Apollo.QueryResult<ProjectBoardQuery, ProjectBoardQueryVariables>;
export const CreateColumnDocument = gql`
    mutation CreateColumn($projectId: ID!, $name: String!) {
  createColumn(projectId: $projectId, name: $name) {
    id
  }
}
    `;
export type CreateColumnMutationFn = Apollo.MutationFunction<CreateColumnMutation, CreateColumnMutationVariables>;

/**
 * __useCreateColumnMutation__
 *
 * To run a mutation, you first call `useCreateColumnMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateColumnMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createColumnMutation, { data, loading, error }] = useCreateColumnMutation({
 *   variables: {
 *      projectId: // value for 'projectId'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useCreateColumnMutation(baseOptions?: Apollo.MutationHookOptions<CreateColumnMutation, CreateColumnMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateColumnMutation, CreateColumnMutationVariables>(CreateColumnDocument, options);
      }
export type CreateColumnMutationHookResult = ReturnType<typeof useCreateColumnMutation>;
export type CreateColumnMutationResult = Apollo.MutationResult<CreateColumnMutation>;
export type CreateColumnMutationOptions = Apollo.BaseMutationOptions<CreateColumnMutation, CreateColumnMutationVariables>;
export const RenameColumnDocument = gql`
    mutation RenameColumn($id: ID!, $name: String!) {
  renameColumn(id: $id, name: $name) {
    id
  }
}
    `;
export type RenameColumnMutationFn = Apollo.MutationFunction<RenameColumnMutation, RenameColumnMutationVariables>;

/**
 * __useRenameColumnMutation__
 *
 * To run a mutation, you first call `useRenameColumnMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenameColumnMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renameColumnMutation, { data, loading, error }] = useRenameColumnMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useRenameColumnMutation(baseOptions?: Apollo.MutationHookOptions<RenameColumnMutation, RenameColumnMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RenameColumnMutation, RenameColumnMutationVariables>(RenameColumnDocument, options);
      }
export type RenameColumnMutationHookResult = ReturnType<typeof useRenameColumnMutation>;
export type RenameColumnMutationResult = Apollo.MutationResult<RenameColumnMutation>;
export type RenameColumnMutationOptions = Apollo.BaseMutationOptions<RenameColumnMutation, RenameColumnMutationVariables>;
export const DeleteColumnDocument = gql`
    mutation DeleteColumn($id: ID!) {
  deleteColumn(id: $id)
}
    `;
export type DeleteColumnMutationFn = Apollo.MutationFunction<DeleteColumnMutation, DeleteColumnMutationVariables>;

/**
 * __useDeleteColumnMutation__
 *
 * To run a mutation, you first call `useDeleteColumnMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteColumnMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteColumnMutation, { data, loading, error }] = useDeleteColumnMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteColumnMutation(baseOptions?: Apollo.MutationHookOptions<DeleteColumnMutation, DeleteColumnMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteColumnMutation, DeleteColumnMutationVariables>(DeleteColumnDocument, options);
      }
export type DeleteColumnMutationHookResult = ReturnType<typeof useDeleteColumnMutation>;
export type DeleteColumnMutationResult = Apollo.MutationResult<DeleteColumnMutation>;
export type DeleteColumnMutationOptions = Apollo.BaseMutationOptions<DeleteColumnMutation, DeleteColumnMutationVariables>;
export const ReorderColumnsDocument = gql`
    mutation ReorderColumns($projectId: ID!, $columnIds: [ID!]!) {
  reorderColumns(projectId: $projectId, columnIds: $columnIds)
}
    `;
export type ReorderColumnsMutationFn = Apollo.MutationFunction<ReorderColumnsMutation, ReorderColumnsMutationVariables>;

/**
 * __useReorderColumnsMutation__
 *
 * To run a mutation, you first call `useReorderColumnsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReorderColumnsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [reorderColumnsMutation, { data, loading, error }] = useReorderColumnsMutation({
 *   variables: {
 *      projectId: // value for 'projectId'
 *      columnIds: // value for 'columnIds'
 *   },
 * });
 */
export function useReorderColumnsMutation(baseOptions?: Apollo.MutationHookOptions<ReorderColumnsMutation, ReorderColumnsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ReorderColumnsMutation, ReorderColumnsMutationVariables>(ReorderColumnsDocument, options);
      }
export type ReorderColumnsMutationHookResult = ReturnType<typeof useReorderColumnsMutation>;
export type ReorderColumnsMutationResult = Apollo.MutationResult<ReorderColumnsMutation>;
export type ReorderColumnsMutationOptions = Apollo.BaseMutationOptions<ReorderColumnsMutation, ReorderColumnsMutationVariables>;
export const CreateTaskDocument = gql`
    mutation CreateTask($projectId: ID!, $columnId: ID!, $title: String!, $description: String) {
  createTask(
    projectId: $projectId
    columnId: $columnId
    title: $title
    description: $description
  ) {
    id
  }
}
    `;
export type CreateTaskMutationFn = Apollo.MutationFunction<CreateTaskMutation, CreateTaskMutationVariables>;

/**
 * __useCreateTaskMutation__
 *
 * To run a mutation, you first call `useCreateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTaskMutation, { data, loading, error }] = useCreateTaskMutation({
 *   variables: {
 *      projectId: // value for 'projectId'
 *      columnId: // value for 'columnId'
 *      title: // value for 'title'
 *      description: // value for 'description'
 *   },
 * });
 */
export function useCreateTaskMutation(baseOptions?: Apollo.MutationHookOptions<CreateTaskMutation, CreateTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateTaskMutation, CreateTaskMutationVariables>(CreateTaskDocument, options);
      }
export type CreateTaskMutationHookResult = ReturnType<typeof useCreateTaskMutation>;
export type CreateTaskMutationResult = Apollo.MutationResult<CreateTaskMutation>;
export type CreateTaskMutationOptions = Apollo.BaseMutationOptions<CreateTaskMutation, CreateTaskMutationVariables>;
export const UpdateTaskDocument = gql`
    mutation UpdateTask($id: ID!, $title: String, $description: String) {
  updateTask(id: $id, title: $title, description: $description) {
    id
  }
}
    `;
export type UpdateTaskMutationFn = Apollo.MutationFunction<UpdateTaskMutation, UpdateTaskMutationVariables>;

/**
 * __useUpdateTaskMutation__
 *
 * To run a mutation, you first call `useUpdateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTaskMutation, { data, loading, error }] = useUpdateTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *      title: // value for 'title'
 *      description: // value for 'description'
 *   },
 * });
 */
export function useUpdateTaskMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTaskMutation, UpdateTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateTaskMutation, UpdateTaskMutationVariables>(UpdateTaskDocument, options);
      }
export type UpdateTaskMutationHookResult = ReturnType<typeof useUpdateTaskMutation>;
export type UpdateTaskMutationResult = Apollo.MutationResult<UpdateTaskMutation>;
export type UpdateTaskMutationOptions = Apollo.BaseMutationOptions<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const DeleteTaskDocument = gql`
    mutation DeleteTask($id: ID!) {
  deleteTask(id: $id)
}
    `;
export type DeleteTaskMutationFn = Apollo.MutationFunction<DeleteTaskMutation, DeleteTaskMutationVariables>;

/**
 * __useDeleteTaskMutation__
 *
 * To run a mutation, you first call `useDeleteTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTaskMutation, { data, loading, error }] = useDeleteTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTaskMutation(baseOptions?: Apollo.MutationHookOptions<DeleteTaskMutation, DeleteTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteTaskMutation, DeleteTaskMutationVariables>(DeleteTaskDocument, options);
      }
export type DeleteTaskMutationHookResult = ReturnType<typeof useDeleteTaskMutation>;
export type DeleteTaskMutationResult = Apollo.MutationResult<DeleteTaskMutation>;
export type DeleteTaskMutationOptions = Apollo.BaseMutationOptions<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const MoveTaskDocument = gql`
    mutation MoveTask($id: ID!, $toColumnId: ID!, $toIndex: Int!) {
  moveTask(id: $id, toColumnId: $toColumnId, toIndex: $toIndex)
}
    `;
export type MoveTaskMutationFn = Apollo.MutationFunction<MoveTaskMutation, MoveTaskMutationVariables>;

/**
 * __useMoveTaskMutation__
 *
 * To run a mutation, you first call `useMoveTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMoveTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [moveTaskMutation, { data, loading, error }] = useMoveTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *      toColumnId: // value for 'toColumnId'
 *      toIndex: // value for 'toIndex'
 *   },
 * });
 */
export function useMoveTaskMutation(baseOptions?: Apollo.MutationHookOptions<MoveTaskMutation, MoveTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<MoveTaskMutation, MoveTaskMutationVariables>(MoveTaskDocument, options);
      }
export type MoveTaskMutationHookResult = ReturnType<typeof useMoveTaskMutation>;
export type MoveTaskMutationResult = Apollo.MutationResult<MoveTaskMutation>;
export type MoveTaskMutationOptions = Apollo.BaseMutationOptions<MoveTaskMutation, MoveTaskMutationVariables>;
export const GetProjectDocument = gql`
    query GetProject($id: ID!) {
  getProject(id: $id) {
    id
    name
    description
    status
  }
}
    `;

/**
 * __useGetProjectQuery__
 *
 * To run a query within a React component, call `useGetProjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetProjectQuery(baseOptions: Apollo.QueryHookOptions<GetProjectQuery, GetProjectQueryVariables> & ({ variables: GetProjectQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
      }
export function useGetProjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
        }
// @ts-ignore
export function useGetProjectSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetProjectQuery, GetProjectQueryVariables>): Apollo.UseSuspenseQueryResult<GetProjectQuery, GetProjectQueryVariables>;
export function useGetProjectSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProjectQuery, GetProjectQueryVariables>): Apollo.UseSuspenseQueryResult<GetProjectQuery | undefined, GetProjectQueryVariables>;
export function useGetProjectSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
        }
export type GetProjectQueryHookResult = ReturnType<typeof useGetProjectQuery>;
export type GetProjectLazyQueryHookResult = ReturnType<typeof useGetProjectLazyQuery>;
export type GetProjectSuspenseQueryHookResult = ReturnType<typeof useGetProjectSuspenseQuery>;
export type GetProjectQueryResult = Apollo.QueryResult<GetProjectQuery, GetProjectQueryVariables>;
export const BrandingDocument = gql`
    query Branding {
  branding {
    ...BrandingFields
  }
}
    ${BrandingFieldsFragmentDoc}`;

/**
 * __useBrandingQuery__
 *
 * To run a query within a React component, call `useBrandingQuery` and pass it any options that fit your needs.
 * When your component renders, `useBrandingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBrandingQuery({
 *   variables: {
 *   },
 * });
 */
export function useBrandingQuery(baseOptions?: Apollo.QueryHookOptions<BrandingQuery, BrandingQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BrandingQuery, BrandingQueryVariables>(BrandingDocument, options);
      }
export function useBrandingLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BrandingQuery, BrandingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BrandingQuery, BrandingQueryVariables>(BrandingDocument, options);
        }
// @ts-ignore
export function useBrandingSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<BrandingQuery, BrandingQueryVariables>): Apollo.UseSuspenseQueryResult<BrandingQuery, BrandingQueryVariables>;
export function useBrandingSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BrandingQuery, BrandingQueryVariables>): Apollo.UseSuspenseQueryResult<BrandingQuery | undefined, BrandingQueryVariables>;
export function useBrandingSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BrandingQuery, BrandingQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BrandingQuery, BrandingQueryVariables>(BrandingDocument, options);
        }
export type BrandingQueryHookResult = ReturnType<typeof useBrandingQuery>;
export type BrandingLazyQueryHookResult = ReturnType<typeof useBrandingLazyQuery>;
export type BrandingSuspenseQueryHookResult = ReturnType<typeof useBrandingSuspenseQuery>;
export type BrandingQueryResult = Apollo.QueryResult<BrandingQuery, BrandingQueryVariables>;
export const PublicBrandingDocument = gql`
    query PublicBranding {
  publicBranding {
    ...BrandingFields
  }
}
    ${BrandingFieldsFragmentDoc}`;

/**
 * __usePublicBrandingQuery__
 *
 * To run a query within a React component, call `usePublicBrandingQuery` and pass it any options that fit your needs.
 * When your component renders, `usePublicBrandingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePublicBrandingQuery({
 *   variables: {
 *   },
 * });
 */
export function usePublicBrandingQuery(baseOptions?: Apollo.QueryHookOptions<PublicBrandingQuery, PublicBrandingQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PublicBrandingQuery, PublicBrandingQueryVariables>(PublicBrandingDocument, options);
      }
export function usePublicBrandingLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PublicBrandingQuery, PublicBrandingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PublicBrandingQuery, PublicBrandingQueryVariables>(PublicBrandingDocument, options);
        }
// @ts-ignore
export function usePublicBrandingSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PublicBrandingQuery, PublicBrandingQueryVariables>): Apollo.UseSuspenseQueryResult<PublicBrandingQuery, PublicBrandingQueryVariables>;
export function usePublicBrandingSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PublicBrandingQuery, PublicBrandingQueryVariables>): Apollo.UseSuspenseQueryResult<PublicBrandingQuery | undefined, PublicBrandingQueryVariables>;
export function usePublicBrandingSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PublicBrandingQuery, PublicBrandingQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PublicBrandingQuery, PublicBrandingQueryVariables>(PublicBrandingDocument, options);
        }
export type PublicBrandingQueryHookResult = ReturnType<typeof usePublicBrandingQuery>;
export type PublicBrandingLazyQueryHookResult = ReturnType<typeof usePublicBrandingLazyQuery>;
export type PublicBrandingSuspenseQueryHookResult = ReturnType<typeof usePublicBrandingSuspenseQuery>;
export type PublicBrandingQueryResult = Apollo.QueryResult<PublicBrandingQuery, PublicBrandingQueryVariables>;
export const UpdateBrandingDocument = gql`
    mutation UpdateBranding($input: BrandingInput!) {
  updateBranding(input: $input) {
    ...BrandingFields
  }
}
    ${BrandingFieldsFragmentDoc}`;
export type UpdateBrandingMutationFn = Apollo.MutationFunction<UpdateBrandingMutation, UpdateBrandingMutationVariables>;

/**
 * __useUpdateBrandingMutation__
 *
 * To run a mutation, you first call `useUpdateBrandingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBrandingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBrandingMutation, { data, loading, error }] = useUpdateBrandingMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateBrandingMutation(baseOptions?: Apollo.MutationHookOptions<UpdateBrandingMutation, UpdateBrandingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateBrandingMutation, UpdateBrandingMutationVariables>(UpdateBrandingDocument, options);
      }
export type UpdateBrandingMutationHookResult = ReturnType<typeof useUpdateBrandingMutation>;
export type UpdateBrandingMutationResult = Apollo.MutationResult<UpdateBrandingMutation>;
export type UpdateBrandingMutationOptions = Apollo.BaseMutationOptions<UpdateBrandingMutation, UpdateBrandingMutationVariables>;
export const UploadImageDocument = gql`
    mutation UploadImage($file: String!, $fileName: String!, $folder: String) {
  uploadImage(file: $file, fileName: $fileName, folder: $folder)
}
    `;
export type UploadImageMutationFn = Apollo.MutationFunction<UploadImageMutation, UploadImageMutationVariables>;

/**
 * __useUploadImageMutation__
 *
 * To run a mutation, you first call `useUploadImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadImageMutation, { data, loading, error }] = useUploadImageMutation({
 *   variables: {
 *      file: // value for 'file'
 *      fileName: // value for 'fileName'
 *      folder: // value for 'folder'
 *   },
 * });
 */
export function useUploadImageMutation(baseOptions?: Apollo.MutationHookOptions<UploadImageMutation, UploadImageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UploadImageMutation, UploadImageMutationVariables>(UploadImageDocument, options);
      }
export type UploadImageMutationHookResult = ReturnType<typeof useUploadImageMutation>;
export type UploadImageMutationResult = Apollo.MutationResult<UploadImageMutation>;
export type UploadImageMutationOptions = Apollo.BaseMutationOptions<UploadImageMutation, UploadImageMutationVariables>;
export const ListBugsDocument = gql`
    query ListBugs {
  listBugs {
    id
    title
    description
    severity
    status
    assignee
    dueDate
  }
}
    `;

/**
 * __useListBugsQuery__
 *
 * To run a query within a React component, call `useListBugsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListBugsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListBugsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListBugsQuery(baseOptions?: Apollo.QueryHookOptions<ListBugsQuery, ListBugsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListBugsQuery, ListBugsQueryVariables>(ListBugsDocument, options);
      }
export function useListBugsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListBugsQuery, ListBugsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListBugsQuery, ListBugsQueryVariables>(ListBugsDocument, options);
        }
// @ts-ignore
export function useListBugsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListBugsQuery, ListBugsQueryVariables>): Apollo.UseSuspenseQueryResult<ListBugsQuery, ListBugsQueryVariables>;
export function useListBugsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBugsQuery, ListBugsQueryVariables>): Apollo.UseSuspenseQueryResult<ListBugsQuery | undefined, ListBugsQueryVariables>;
export function useListBugsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBugsQuery, ListBugsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListBugsQuery, ListBugsQueryVariables>(ListBugsDocument, options);
        }
export type ListBugsQueryHookResult = ReturnType<typeof useListBugsQuery>;
export type ListBugsLazyQueryHookResult = ReturnType<typeof useListBugsLazyQuery>;
export type ListBugsSuspenseQueryHookResult = ReturnType<typeof useListBugsSuspenseQuery>;
export type ListBugsQueryResult = Apollo.QueryResult<ListBugsQuery, ListBugsQueryVariables>;
export const ListBugsPagedDocument = gql`
    query ListBugsPaged($input: TableQueryInput!) {
  listBugsPaged(input: $input) {
    totalCount
    rows {
      id
      title
      description
      severity
      status
      assignee
      dueDate
    }
  }
}
    `;

/**
 * __useListBugsPagedQuery__
 *
 * To run a query within a React component, call `useListBugsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListBugsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListBugsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListBugsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListBugsPagedQuery, ListBugsPagedQueryVariables> & ({ variables: ListBugsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListBugsPagedQuery, ListBugsPagedQueryVariables>(ListBugsPagedDocument, options);
      }
export function useListBugsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListBugsPagedQuery, ListBugsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListBugsPagedQuery, ListBugsPagedQueryVariables>(ListBugsPagedDocument, options);
        }
// @ts-ignore
export function useListBugsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListBugsPagedQuery, ListBugsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListBugsPagedQuery, ListBugsPagedQueryVariables>;
export function useListBugsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBugsPagedQuery, ListBugsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListBugsPagedQuery | undefined, ListBugsPagedQueryVariables>;
export function useListBugsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBugsPagedQuery, ListBugsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListBugsPagedQuery, ListBugsPagedQueryVariables>(ListBugsPagedDocument, options);
        }
export type ListBugsPagedQueryHookResult = ReturnType<typeof useListBugsPagedQuery>;
export type ListBugsPagedLazyQueryHookResult = ReturnType<typeof useListBugsPagedLazyQuery>;
export type ListBugsPagedSuspenseQueryHookResult = ReturnType<typeof useListBugsPagedSuspenseQuery>;
export type ListBugsPagedQueryResult = Apollo.QueryResult<ListBugsPagedQuery, ListBugsPagedQueryVariables>;
export const ListBugsStatsDocument = gql`
    query ListBugsStats {
  listBugsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListBugsStatsQuery__
 *
 * To run a query within a React component, call `useListBugsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListBugsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListBugsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListBugsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListBugsStatsQuery, ListBugsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListBugsStatsQuery, ListBugsStatsQueryVariables>(ListBugsStatsDocument, options);
      }
export function useListBugsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListBugsStatsQuery, ListBugsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListBugsStatsQuery, ListBugsStatsQueryVariables>(ListBugsStatsDocument, options);
        }
// @ts-ignore
export function useListBugsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListBugsStatsQuery, ListBugsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListBugsStatsQuery, ListBugsStatsQueryVariables>;
export function useListBugsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBugsStatsQuery, ListBugsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListBugsStatsQuery | undefined, ListBugsStatsQueryVariables>;
export function useListBugsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBugsStatsQuery, ListBugsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListBugsStatsQuery, ListBugsStatsQueryVariables>(ListBugsStatsDocument, options);
        }
export type ListBugsStatsQueryHookResult = ReturnType<typeof useListBugsStatsQuery>;
export type ListBugsStatsLazyQueryHookResult = ReturnType<typeof useListBugsStatsLazyQuery>;
export type ListBugsStatsSuspenseQueryHookResult = ReturnType<typeof useListBugsStatsSuspenseQuery>;
export type ListBugsStatsQueryResult = Apollo.QueryResult<ListBugsStatsQuery, ListBugsStatsQueryVariables>;
export const CreateBugDocument = gql`
    mutation CreateBug($input: BugInput!) {
  createBug(input: $input) {
    id
  }
}
    `;
export type CreateBugMutationFn = Apollo.MutationFunction<CreateBugMutation, CreateBugMutationVariables>;

/**
 * __useCreateBugMutation__
 *
 * To run a mutation, you first call `useCreateBugMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateBugMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createBugMutation, { data, loading, error }] = useCreateBugMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateBugMutation(baseOptions?: Apollo.MutationHookOptions<CreateBugMutation, CreateBugMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateBugMutation, CreateBugMutationVariables>(CreateBugDocument, options);
      }
export type CreateBugMutationHookResult = ReturnType<typeof useCreateBugMutation>;
export type CreateBugMutationResult = Apollo.MutationResult<CreateBugMutation>;
export type CreateBugMutationOptions = Apollo.BaseMutationOptions<CreateBugMutation, CreateBugMutationVariables>;
export const UpdateBugDocument = gql`
    mutation UpdateBug($id: ID!, $input: BugInput!) {
  updateBug(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateBugMutationFn = Apollo.MutationFunction<UpdateBugMutation, UpdateBugMutationVariables>;

/**
 * __useUpdateBugMutation__
 *
 * To run a mutation, you first call `useUpdateBugMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBugMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBugMutation, { data, loading, error }] = useUpdateBugMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateBugMutation(baseOptions?: Apollo.MutationHookOptions<UpdateBugMutation, UpdateBugMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateBugMutation, UpdateBugMutationVariables>(UpdateBugDocument, options);
      }
export type UpdateBugMutationHookResult = ReturnType<typeof useUpdateBugMutation>;
export type UpdateBugMutationResult = Apollo.MutationResult<UpdateBugMutation>;
export type UpdateBugMutationOptions = Apollo.BaseMutationOptions<UpdateBugMutation, UpdateBugMutationVariables>;
export const DeleteBugDocument = gql`
    mutation DeleteBug($id: ID!) {
  deleteBug(id: $id)
}
    `;
export type DeleteBugMutationFn = Apollo.MutationFunction<DeleteBugMutation, DeleteBugMutationVariables>;

/**
 * __useDeleteBugMutation__
 *
 * To run a mutation, you first call `useDeleteBugMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteBugMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteBugMutation, { data, loading, error }] = useDeleteBugMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteBugMutation(baseOptions?: Apollo.MutationHookOptions<DeleteBugMutation, DeleteBugMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteBugMutation, DeleteBugMutationVariables>(DeleteBugDocument, options);
      }
export type DeleteBugMutationHookResult = ReturnType<typeof useDeleteBugMutation>;
export type DeleteBugMutationResult = Apollo.MutationResult<DeleteBugMutation>;
export type DeleteBugMutationOptions = Apollo.BaseMutationOptions<DeleteBugMutation, DeleteBugMutationVariables>;
export const ListClientsDocument = gql`
    query ListClients {
  listClients {
    id
    name
    email
    phone
    company
    status
  }
}
    `;

/**
 * __useListClientsQuery__
 *
 * To run a query within a React component, call `useListClientsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListClientsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListClientsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListClientsQuery(baseOptions?: Apollo.QueryHookOptions<ListClientsQuery, ListClientsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListClientsQuery, ListClientsQueryVariables>(ListClientsDocument, options);
      }
export function useListClientsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListClientsQuery, ListClientsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListClientsQuery, ListClientsQueryVariables>(ListClientsDocument, options);
        }
// @ts-ignore
export function useListClientsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListClientsQuery, ListClientsQueryVariables>): Apollo.UseSuspenseQueryResult<ListClientsQuery, ListClientsQueryVariables>;
export function useListClientsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListClientsQuery, ListClientsQueryVariables>): Apollo.UseSuspenseQueryResult<ListClientsQuery | undefined, ListClientsQueryVariables>;
export function useListClientsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListClientsQuery, ListClientsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListClientsQuery, ListClientsQueryVariables>(ListClientsDocument, options);
        }
export type ListClientsQueryHookResult = ReturnType<typeof useListClientsQuery>;
export type ListClientsLazyQueryHookResult = ReturnType<typeof useListClientsLazyQuery>;
export type ListClientsSuspenseQueryHookResult = ReturnType<typeof useListClientsSuspenseQuery>;
export type ListClientsQueryResult = Apollo.QueryResult<ListClientsQuery, ListClientsQueryVariables>;
export const ListClientsPagedDocument = gql`
    query ListClientsPaged($input: TableQueryInput!) {
  listClientsPaged(input: $input) {
    totalCount
    rows {
      id
      name
      email
      phone
      company
      status
    }
  }
}
    `;

/**
 * __useListClientsPagedQuery__
 *
 * To run a query within a React component, call `useListClientsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListClientsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListClientsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListClientsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListClientsPagedQuery, ListClientsPagedQueryVariables> & ({ variables: ListClientsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListClientsPagedQuery, ListClientsPagedQueryVariables>(ListClientsPagedDocument, options);
      }
export function useListClientsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListClientsPagedQuery, ListClientsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListClientsPagedQuery, ListClientsPagedQueryVariables>(ListClientsPagedDocument, options);
        }
// @ts-ignore
export function useListClientsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListClientsPagedQuery, ListClientsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListClientsPagedQuery, ListClientsPagedQueryVariables>;
export function useListClientsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListClientsPagedQuery, ListClientsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListClientsPagedQuery | undefined, ListClientsPagedQueryVariables>;
export function useListClientsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListClientsPagedQuery, ListClientsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListClientsPagedQuery, ListClientsPagedQueryVariables>(ListClientsPagedDocument, options);
        }
export type ListClientsPagedQueryHookResult = ReturnType<typeof useListClientsPagedQuery>;
export type ListClientsPagedLazyQueryHookResult = ReturnType<typeof useListClientsPagedLazyQuery>;
export type ListClientsPagedSuspenseQueryHookResult = ReturnType<typeof useListClientsPagedSuspenseQuery>;
export type ListClientsPagedQueryResult = Apollo.QueryResult<ListClientsPagedQuery, ListClientsPagedQueryVariables>;
export const ListClientsStatsDocument = gql`
    query ListClientsStats {
  listClientsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListClientsStatsQuery__
 *
 * To run a query within a React component, call `useListClientsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListClientsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListClientsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListClientsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListClientsStatsQuery, ListClientsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListClientsStatsQuery, ListClientsStatsQueryVariables>(ListClientsStatsDocument, options);
      }
export function useListClientsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListClientsStatsQuery, ListClientsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListClientsStatsQuery, ListClientsStatsQueryVariables>(ListClientsStatsDocument, options);
        }
// @ts-ignore
export function useListClientsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListClientsStatsQuery, ListClientsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListClientsStatsQuery, ListClientsStatsQueryVariables>;
export function useListClientsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListClientsStatsQuery, ListClientsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListClientsStatsQuery | undefined, ListClientsStatsQueryVariables>;
export function useListClientsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListClientsStatsQuery, ListClientsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListClientsStatsQuery, ListClientsStatsQueryVariables>(ListClientsStatsDocument, options);
        }
export type ListClientsStatsQueryHookResult = ReturnType<typeof useListClientsStatsQuery>;
export type ListClientsStatsLazyQueryHookResult = ReturnType<typeof useListClientsStatsLazyQuery>;
export type ListClientsStatsSuspenseQueryHookResult = ReturnType<typeof useListClientsStatsSuspenseQuery>;
export type ListClientsStatsQueryResult = Apollo.QueryResult<ListClientsStatsQuery, ListClientsStatsQueryVariables>;
export const CreateClientDocument = gql`
    mutation CreateClient($input: ClientInput!) {
  createClient(input: $input) {
    id
  }
}
    `;
export type CreateClientMutationFn = Apollo.MutationFunction<CreateClientMutation, CreateClientMutationVariables>;

/**
 * __useCreateClientMutation__
 *
 * To run a mutation, you first call `useCreateClientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateClientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createClientMutation, { data, loading, error }] = useCreateClientMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateClientMutation(baseOptions?: Apollo.MutationHookOptions<CreateClientMutation, CreateClientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateClientMutation, CreateClientMutationVariables>(CreateClientDocument, options);
      }
export type CreateClientMutationHookResult = ReturnType<typeof useCreateClientMutation>;
export type CreateClientMutationResult = Apollo.MutationResult<CreateClientMutation>;
export type CreateClientMutationOptions = Apollo.BaseMutationOptions<CreateClientMutation, CreateClientMutationVariables>;
export const UpdateClientDocument = gql`
    mutation UpdateClient($id: ID!, $input: ClientInput!) {
  updateClient(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateClientMutationFn = Apollo.MutationFunction<UpdateClientMutation, UpdateClientMutationVariables>;

/**
 * __useUpdateClientMutation__
 *
 * To run a mutation, you first call `useUpdateClientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateClientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateClientMutation, { data, loading, error }] = useUpdateClientMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateClientMutation(baseOptions?: Apollo.MutationHookOptions<UpdateClientMutation, UpdateClientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateClientMutation, UpdateClientMutationVariables>(UpdateClientDocument, options);
      }
export type UpdateClientMutationHookResult = ReturnType<typeof useUpdateClientMutation>;
export type UpdateClientMutationResult = Apollo.MutationResult<UpdateClientMutation>;
export type UpdateClientMutationOptions = Apollo.BaseMutationOptions<UpdateClientMutation, UpdateClientMutationVariables>;
export const DeleteClientDocument = gql`
    mutation DeleteClient($id: ID!) {
  deleteClient(id: $id)
}
    `;
export type DeleteClientMutationFn = Apollo.MutationFunction<DeleteClientMutation, DeleteClientMutationVariables>;

/**
 * __useDeleteClientMutation__
 *
 * To run a mutation, you first call `useDeleteClientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteClientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteClientMutation, { data, loading, error }] = useDeleteClientMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteClientMutation(baseOptions?: Apollo.MutationHookOptions<DeleteClientMutation, DeleteClientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteClientMutation, DeleteClientMutationVariables>(DeleteClientDocument, options);
      }
export type DeleteClientMutationHookResult = ReturnType<typeof useDeleteClientMutation>;
export type DeleteClientMutationResult = Apollo.MutationResult<DeleteClientMutation>;
export type DeleteClientMutationOptions = Apollo.BaseMutationOptions<DeleteClientMutation, DeleteClientMutationVariables>;
export const ListLeadsDocument = gql`
    query ListLeads {
  listLeads {
    id
    name
    email
    source
    stage
    value
    owner
  }
}
    `;

/**
 * __useListLeadsQuery__
 *
 * To run a query within a React component, call `useListLeadsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListLeadsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListLeadsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListLeadsQuery(baseOptions?: Apollo.QueryHookOptions<ListLeadsQuery, ListLeadsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListLeadsQuery, ListLeadsQueryVariables>(ListLeadsDocument, options);
      }
export function useListLeadsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListLeadsQuery, ListLeadsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListLeadsQuery, ListLeadsQueryVariables>(ListLeadsDocument, options);
        }
// @ts-ignore
export function useListLeadsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListLeadsQuery, ListLeadsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLeadsQuery, ListLeadsQueryVariables>;
export function useListLeadsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLeadsQuery, ListLeadsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLeadsQuery | undefined, ListLeadsQueryVariables>;
export function useListLeadsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLeadsQuery, ListLeadsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListLeadsQuery, ListLeadsQueryVariables>(ListLeadsDocument, options);
        }
export type ListLeadsQueryHookResult = ReturnType<typeof useListLeadsQuery>;
export type ListLeadsLazyQueryHookResult = ReturnType<typeof useListLeadsLazyQuery>;
export type ListLeadsSuspenseQueryHookResult = ReturnType<typeof useListLeadsSuspenseQuery>;
export type ListLeadsQueryResult = Apollo.QueryResult<ListLeadsQuery, ListLeadsQueryVariables>;
export const ListLeadsPagedDocument = gql`
    query ListLeadsPaged($input: TableQueryInput!) {
  listLeadsPaged(input: $input) {
    totalCount
    rows {
      id
      name
      email
      source
      stage
      value
      owner
    }
  }
}
    `;

/**
 * __useListLeadsPagedQuery__
 *
 * To run a query within a React component, call `useListLeadsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListLeadsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListLeadsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListLeadsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListLeadsPagedQuery, ListLeadsPagedQueryVariables> & ({ variables: ListLeadsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>(ListLeadsPagedDocument, options);
      }
export function useListLeadsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>(ListLeadsPagedDocument, options);
        }
// @ts-ignore
export function useListLeadsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>;
export function useListLeadsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListLeadsPagedQuery | undefined, ListLeadsPagedQueryVariables>;
export function useListLeadsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>(ListLeadsPagedDocument, options);
        }
export type ListLeadsPagedQueryHookResult = ReturnType<typeof useListLeadsPagedQuery>;
export type ListLeadsPagedLazyQueryHookResult = ReturnType<typeof useListLeadsPagedLazyQuery>;
export type ListLeadsPagedSuspenseQueryHookResult = ReturnType<typeof useListLeadsPagedSuspenseQuery>;
export type ListLeadsPagedQueryResult = Apollo.QueryResult<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>;
export const ListLeadsStatsDocument = gql`
    query ListLeadsStats {
  listLeadsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListLeadsStatsQuery__
 *
 * To run a query within a React component, call `useListLeadsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListLeadsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListLeadsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListLeadsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>(ListLeadsStatsDocument, options);
      }
export function useListLeadsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>(ListLeadsStatsDocument, options);
        }
// @ts-ignore
export function useListLeadsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>;
export function useListLeadsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLeadsStatsQuery | undefined, ListLeadsStatsQueryVariables>;
export function useListLeadsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>(ListLeadsStatsDocument, options);
        }
export type ListLeadsStatsQueryHookResult = ReturnType<typeof useListLeadsStatsQuery>;
export type ListLeadsStatsLazyQueryHookResult = ReturnType<typeof useListLeadsStatsLazyQuery>;
export type ListLeadsStatsSuspenseQueryHookResult = ReturnType<typeof useListLeadsStatsSuspenseQuery>;
export type ListLeadsStatsQueryResult = Apollo.QueryResult<ListLeadsStatsQuery, ListLeadsStatsQueryVariables>;
export const CreateLeadDocument = gql`
    mutation CreateLead($input: LeadInput!) {
  createLead(input: $input) {
    id
  }
}
    `;
export type CreateLeadMutationFn = Apollo.MutationFunction<CreateLeadMutation, CreateLeadMutationVariables>;

/**
 * __useCreateLeadMutation__
 *
 * To run a mutation, you first call `useCreateLeadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateLeadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createLeadMutation, { data, loading, error }] = useCreateLeadMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateLeadMutation(baseOptions?: Apollo.MutationHookOptions<CreateLeadMutation, CreateLeadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateLeadMutation, CreateLeadMutationVariables>(CreateLeadDocument, options);
      }
export type CreateLeadMutationHookResult = ReturnType<typeof useCreateLeadMutation>;
export type CreateLeadMutationResult = Apollo.MutationResult<CreateLeadMutation>;
export type CreateLeadMutationOptions = Apollo.BaseMutationOptions<CreateLeadMutation, CreateLeadMutationVariables>;
export const UpdateLeadDocument = gql`
    mutation UpdateLead($id: ID!, $input: LeadInput!) {
  updateLead(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateLeadMutationFn = Apollo.MutationFunction<UpdateLeadMutation, UpdateLeadMutationVariables>;

/**
 * __useUpdateLeadMutation__
 *
 * To run a mutation, you first call `useUpdateLeadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLeadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLeadMutation, { data, loading, error }] = useUpdateLeadMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateLeadMutation(baseOptions?: Apollo.MutationHookOptions<UpdateLeadMutation, UpdateLeadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateLeadMutation, UpdateLeadMutationVariables>(UpdateLeadDocument, options);
      }
export type UpdateLeadMutationHookResult = ReturnType<typeof useUpdateLeadMutation>;
export type UpdateLeadMutationResult = Apollo.MutationResult<UpdateLeadMutation>;
export type UpdateLeadMutationOptions = Apollo.BaseMutationOptions<UpdateLeadMutation, UpdateLeadMutationVariables>;
export const DeleteLeadDocument = gql`
    mutation DeleteLead($id: ID!) {
  deleteLead(id: $id)
}
    `;
export type DeleteLeadMutationFn = Apollo.MutationFunction<DeleteLeadMutation, DeleteLeadMutationVariables>;

/**
 * __useDeleteLeadMutation__
 *
 * To run a mutation, you first call `useDeleteLeadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteLeadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteLeadMutation, { data, loading, error }] = useDeleteLeadMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteLeadMutation(baseOptions?: Apollo.MutationHookOptions<DeleteLeadMutation, DeleteLeadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteLeadMutation, DeleteLeadMutationVariables>(DeleteLeadDocument, options);
      }
export type DeleteLeadMutationHookResult = ReturnType<typeof useDeleteLeadMutation>;
export type DeleteLeadMutationResult = Apollo.MutationResult<DeleteLeadMutation>;
export type DeleteLeadMutationOptions = Apollo.BaseMutationOptions<DeleteLeadMutation, DeleteLeadMutationVariables>;
export const MyPayrollDocument = gql`
    query MyPayroll {
  myPayroll {
    ...PayrollFields
  }
}
    ${PayrollFieldsFragmentDoc}`;

/**
 * __useMyPayrollQuery__
 *
 * To run a query within a React component, call `useMyPayrollQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyPayrollQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyPayrollQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyPayrollQuery(baseOptions?: Apollo.QueryHookOptions<MyPayrollQuery, MyPayrollQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyPayrollQuery, MyPayrollQueryVariables>(MyPayrollDocument, options);
      }
export function useMyPayrollLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyPayrollQuery, MyPayrollQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyPayrollQuery, MyPayrollQueryVariables>(MyPayrollDocument, options);
        }
// @ts-ignore
export function useMyPayrollSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyPayrollQuery, MyPayrollQueryVariables>): Apollo.UseSuspenseQueryResult<MyPayrollQuery, MyPayrollQueryVariables>;
export function useMyPayrollSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyPayrollQuery, MyPayrollQueryVariables>): Apollo.UseSuspenseQueryResult<MyPayrollQuery | undefined, MyPayrollQueryVariables>;
export function useMyPayrollSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyPayrollQuery, MyPayrollQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyPayrollQuery, MyPayrollQueryVariables>(MyPayrollDocument, options);
        }
export type MyPayrollQueryHookResult = ReturnType<typeof useMyPayrollQuery>;
export type MyPayrollLazyQueryHookResult = ReturnType<typeof useMyPayrollLazyQuery>;
export type MyPayrollSuspenseQueryHookResult = ReturnType<typeof useMyPayrollSuspenseQuery>;
export type MyPayrollQueryResult = Apollo.QueryResult<MyPayrollQuery, MyPayrollQueryVariables>;
export const MySalarySlipsDocument = gql`
    query MySalarySlips {
  mySalarySlips {
    ...SalarySlipFields
  }
}
    ${SalarySlipFieldsFragmentDoc}`;

/**
 * __useMySalarySlipsQuery__
 *
 * To run a query within a React component, call `useMySalarySlipsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMySalarySlipsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMySalarySlipsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMySalarySlipsQuery(baseOptions?: Apollo.QueryHookOptions<MySalarySlipsQuery, MySalarySlipsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MySalarySlipsQuery, MySalarySlipsQueryVariables>(MySalarySlipsDocument, options);
      }
export function useMySalarySlipsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MySalarySlipsQuery, MySalarySlipsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MySalarySlipsQuery, MySalarySlipsQueryVariables>(MySalarySlipsDocument, options);
        }
// @ts-ignore
export function useMySalarySlipsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MySalarySlipsQuery, MySalarySlipsQueryVariables>): Apollo.UseSuspenseQueryResult<MySalarySlipsQuery, MySalarySlipsQueryVariables>;
export function useMySalarySlipsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MySalarySlipsQuery, MySalarySlipsQueryVariables>): Apollo.UseSuspenseQueryResult<MySalarySlipsQuery | undefined, MySalarySlipsQueryVariables>;
export function useMySalarySlipsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MySalarySlipsQuery, MySalarySlipsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MySalarySlipsQuery, MySalarySlipsQueryVariables>(MySalarySlipsDocument, options);
        }
export type MySalarySlipsQueryHookResult = ReturnType<typeof useMySalarySlipsQuery>;
export type MySalarySlipsLazyQueryHookResult = ReturnType<typeof useMySalarySlipsLazyQuery>;
export type MySalarySlipsSuspenseQueryHookResult = ReturnType<typeof useMySalarySlipsSuspenseQuery>;
export type MySalarySlipsQueryResult = Apollo.QueryResult<MySalarySlipsQuery, MySalarySlipsQueryVariables>;
export const ListPoliciesDocument = gql`
    query ListPolicies {
  listPolicies {
    ...PolicyFields
  }
}
    ${PolicyFieldsFragmentDoc}`;

/**
 * __useListPoliciesQuery__
 *
 * To run a query within a React component, call `useListPoliciesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListPoliciesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListPoliciesQuery({
 *   variables: {
 *   },
 * });
 */
export function useListPoliciesQuery(baseOptions?: Apollo.QueryHookOptions<ListPoliciesQuery, ListPoliciesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListPoliciesQuery, ListPoliciesQueryVariables>(ListPoliciesDocument, options);
      }
export function useListPoliciesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListPoliciesQuery, ListPoliciesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListPoliciesQuery, ListPoliciesQueryVariables>(ListPoliciesDocument, options);
        }
// @ts-ignore
export function useListPoliciesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListPoliciesQuery, ListPoliciesQueryVariables>): Apollo.UseSuspenseQueryResult<ListPoliciesQuery, ListPoliciesQueryVariables>;
export function useListPoliciesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPoliciesQuery, ListPoliciesQueryVariables>): Apollo.UseSuspenseQueryResult<ListPoliciesQuery | undefined, ListPoliciesQueryVariables>;
export function useListPoliciesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPoliciesQuery, ListPoliciesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListPoliciesQuery, ListPoliciesQueryVariables>(ListPoliciesDocument, options);
        }
export type ListPoliciesQueryHookResult = ReturnType<typeof useListPoliciesQuery>;
export type ListPoliciesLazyQueryHookResult = ReturnType<typeof useListPoliciesLazyQuery>;
export type ListPoliciesSuspenseQueryHookResult = ReturnType<typeof useListPoliciesSuspenseQuery>;
export type ListPoliciesQueryResult = Apollo.QueryResult<ListPoliciesQuery, ListPoliciesQueryVariables>;
export const ListHolidaysDocument = gql`
    query ListHolidays {
  listHolidays {
    ...HolidayFields
  }
}
    ${HolidayFieldsFragmentDoc}`;

/**
 * __useListHolidaysQuery__
 *
 * To run a query within a React component, call `useListHolidaysQuery` and pass it any options that fit your needs.
 * When your component renders, `useListHolidaysQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListHolidaysQuery({
 *   variables: {
 *   },
 * });
 */
export function useListHolidaysQuery(baseOptions?: Apollo.QueryHookOptions<ListHolidaysQuery, ListHolidaysQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListHolidaysQuery, ListHolidaysQueryVariables>(ListHolidaysDocument, options);
      }
export function useListHolidaysLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListHolidaysQuery, ListHolidaysQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListHolidaysQuery, ListHolidaysQueryVariables>(ListHolidaysDocument, options);
        }
// @ts-ignore
export function useListHolidaysSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListHolidaysQuery, ListHolidaysQueryVariables>): Apollo.UseSuspenseQueryResult<ListHolidaysQuery, ListHolidaysQueryVariables>;
export function useListHolidaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListHolidaysQuery, ListHolidaysQueryVariables>): Apollo.UseSuspenseQueryResult<ListHolidaysQuery | undefined, ListHolidaysQueryVariables>;
export function useListHolidaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListHolidaysQuery, ListHolidaysQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListHolidaysQuery, ListHolidaysQueryVariables>(ListHolidaysDocument, options);
        }
export type ListHolidaysQueryHookResult = ReturnType<typeof useListHolidaysQuery>;
export type ListHolidaysLazyQueryHookResult = ReturnType<typeof useListHolidaysLazyQuery>;
export type ListHolidaysSuspenseQueryHookResult = ReturnType<typeof useListHolidaysSuspenseQuery>;
export type ListHolidaysQueryResult = Apollo.QueryResult<ListHolidaysQuery, ListHolidaysQueryVariables>;
export const MySupportTicketsDocument = gql`
    query MySupportTickets {
  mySupportTickets {
    ...SupportTicketFields
  }
}
    ${SupportTicketFieldsFragmentDoc}`;

/**
 * __useMySupportTicketsQuery__
 *
 * To run a query within a React component, call `useMySupportTicketsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMySupportTicketsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMySupportTicketsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMySupportTicketsQuery(baseOptions?: Apollo.QueryHookOptions<MySupportTicketsQuery, MySupportTicketsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MySupportTicketsQuery, MySupportTicketsQueryVariables>(MySupportTicketsDocument, options);
      }
export function useMySupportTicketsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MySupportTicketsQuery, MySupportTicketsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MySupportTicketsQuery, MySupportTicketsQueryVariables>(MySupportTicketsDocument, options);
        }
// @ts-ignore
export function useMySupportTicketsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MySupportTicketsQuery, MySupportTicketsQueryVariables>): Apollo.UseSuspenseQueryResult<MySupportTicketsQuery, MySupportTicketsQueryVariables>;
export function useMySupportTicketsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MySupportTicketsQuery, MySupportTicketsQueryVariables>): Apollo.UseSuspenseQueryResult<MySupportTicketsQuery | undefined, MySupportTicketsQueryVariables>;
export function useMySupportTicketsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MySupportTicketsQuery, MySupportTicketsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MySupportTicketsQuery, MySupportTicketsQueryVariables>(MySupportTicketsDocument, options);
        }
export type MySupportTicketsQueryHookResult = ReturnType<typeof useMySupportTicketsQuery>;
export type MySupportTicketsLazyQueryHookResult = ReturnType<typeof useMySupportTicketsLazyQuery>;
export type MySupportTicketsSuspenseQueryHookResult = ReturnType<typeof useMySupportTicketsSuspenseQuery>;
export type MySupportTicketsQueryResult = Apollo.QueryResult<MySupportTicketsQuery, MySupportTicketsQueryVariables>;
export const CreateSupportTicketDocument = gql`
    mutation CreateSupportTicket($input: SupportTicketInput!) {
  createSupportTicket(input: $input) {
    id
  }
}
    `;
export type CreateSupportTicketMutationFn = Apollo.MutationFunction<CreateSupportTicketMutation, CreateSupportTicketMutationVariables>;

/**
 * __useCreateSupportTicketMutation__
 *
 * To run a mutation, you first call `useCreateSupportTicketMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSupportTicketMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSupportTicketMutation, { data, loading, error }] = useCreateSupportTicketMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSupportTicketMutation(baseOptions?: Apollo.MutationHookOptions<CreateSupportTicketMutation, CreateSupportTicketMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSupportTicketMutation, CreateSupportTicketMutationVariables>(CreateSupportTicketDocument, options);
      }
export type CreateSupportTicketMutationHookResult = ReturnType<typeof useCreateSupportTicketMutation>;
export type CreateSupportTicketMutationResult = Apollo.MutationResult<CreateSupportTicketMutation>;
export type CreateSupportTicketMutationOptions = Apollo.BaseMutationOptions<CreateSupportTicketMutation, CreateSupportTicketMutationVariables>;
export const ListInvoicesDocument = gql`
    query ListInvoices {
  listInvoices {
    id
    number
    clientId
    amount
    currency
    status
    issuedDate
    dueDate
  }
}
    `;

/**
 * __useListInvoicesQuery__
 *
 * To run a query within a React component, call `useListInvoicesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListInvoicesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListInvoicesQuery({
 *   variables: {
 *   },
 * });
 */
export function useListInvoicesQuery(baseOptions?: Apollo.QueryHookOptions<ListInvoicesQuery, ListInvoicesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListInvoicesQuery, ListInvoicesQueryVariables>(ListInvoicesDocument, options);
      }
export function useListInvoicesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListInvoicesQuery, ListInvoicesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListInvoicesQuery, ListInvoicesQueryVariables>(ListInvoicesDocument, options);
        }
// @ts-ignore
export function useListInvoicesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListInvoicesQuery, ListInvoicesQueryVariables>): Apollo.UseSuspenseQueryResult<ListInvoicesQuery, ListInvoicesQueryVariables>;
export function useListInvoicesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListInvoicesQuery, ListInvoicesQueryVariables>): Apollo.UseSuspenseQueryResult<ListInvoicesQuery | undefined, ListInvoicesQueryVariables>;
export function useListInvoicesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListInvoicesQuery, ListInvoicesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListInvoicesQuery, ListInvoicesQueryVariables>(ListInvoicesDocument, options);
        }
export type ListInvoicesQueryHookResult = ReturnType<typeof useListInvoicesQuery>;
export type ListInvoicesLazyQueryHookResult = ReturnType<typeof useListInvoicesLazyQuery>;
export type ListInvoicesSuspenseQueryHookResult = ReturnType<typeof useListInvoicesSuspenseQuery>;
export type ListInvoicesQueryResult = Apollo.QueryResult<ListInvoicesQuery, ListInvoicesQueryVariables>;
export const ListInvoicesPagedDocument = gql`
    query ListInvoicesPaged($input: TableQueryInput!) {
  listInvoicesPaged(input: $input) {
    totalCount
    rows {
      id
      number
      clientId
      amount
      currency
      status
      issuedDate
      dueDate
    }
  }
}
    `;

/**
 * __useListInvoicesPagedQuery__
 *
 * To run a query within a React component, call `useListInvoicesPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListInvoicesPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListInvoicesPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListInvoicesPagedQuery(baseOptions: Apollo.QueryHookOptions<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables> & ({ variables: ListInvoicesPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>(ListInvoicesPagedDocument, options);
      }
export function useListInvoicesPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>(ListInvoicesPagedDocument, options);
        }
// @ts-ignore
export function useListInvoicesPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>;
export function useListInvoicesPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListInvoicesPagedQuery | undefined, ListInvoicesPagedQueryVariables>;
export function useListInvoicesPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>(ListInvoicesPagedDocument, options);
        }
export type ListInvoicesPagedQueryHookResult = ReturnType<typeof useListInvoicesPagedQuery>;
export type ListInvoicesPagedLazyQueryHookResult = ReturnType<typeof useListInvoicesPagedLazyQuery>;
export type ListInvoicesPagedSuspenseQueryHookResult = ReturnType<typeof useListInvoicesPagedSuspenseQuery>;
export type ListInvoicesPagedQueryResult = Apollo.QueryResult<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>;
export const ListInvoicesStatsDocument = gql`
    query ListInvoicesStats {
  listInvoicesStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListInvoicesStatsQuery__
 *
 * To run a query within a React component, call `useListInvoicesStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListInvoicesStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListInvoicesStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListInvoicesStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>(ListInvoicesStatsDocument, options);
      }
export function useListInvoicesStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>(ListInvoicesStatsDocument, options);
        }
// @ts-ignore
export function useListInvoicesStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>;
export function useListInvoicesStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListInvoicesStatsQuery | undefined, ListInvoicesStatsQueryVariables>;
export function useListInvoicesStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>(ListInvoicesStatsDocument, options);
        }
export type ListInvoicesStatsQueryHookResult = ReturnType<typeof useListInvoicesStatsQuery>;
export type ListInvoicesStatsLazyQueryHookResult = ReturnType<typeof useListInvoicesStatsLazyQuery>;
export type ListInvoicesStatsSuspenseQueryHookResult = ReturnType<typeof useListInvoicesStatsSuspenseQuery>;
export type ListInvoicesStatsQueryResult = Apollo.QueryResult<ListInvoicesStatsQuery, ListInvoicesStatsQueryVariables>;
export const CreateInvoiceDocument = gql`
    mutation CreateInvoice($input: InvoiceInput!) {
  createInvoice(input: $input) {
    id
  }
}
    `;
export type CreateInvoiceMutationFn = Apollo.MutationFunction<CreateInvoiceMutation, CreateInvoiceMutationVariables>;

/**
 * __useCreateInvoiceMutation__
 *
 * To run a mutation, you first call `useCreateInvoiceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateInvoiceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createInvoiceMutation, { data, loading, error }] = useCreateInvoiceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateInvoiceMutation(baseOptions?: Apollo.MutationHookOptions<CreateInvoiceMutation, CreateInvoiceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateInvoiceMutation, CreateInvoiceMutationVariables>(CreateInvoiceDocument, options);
      }
export type CreateInvoiceMutationHookResult = ReturnType<typeof useCreateInvoiceMutation>;
export type CreateInvoiceMutationResult = Apollo.MutationResult<CreateInvoiceMutation>;
export type CreateInvoiceMutationOptions = Apollo.BaseMutationOptions<CreateInvoiceMutation, CreateInvoiceMutationVariables>;
export const UpdateInvoiceDocument = gql`
    mutation UpdateInvoice($id: ID!, $input: InvoiceInput!) {
  updateInvoice(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateInvoiceMutationFn = Apollo.MutationFunction<UpdateInvoiceMutation, UpdateInvoiceMutationVariables>;

/**
 * __useUpdateInvoiceMutation__
 *
 * To run a mutation, you first call `useUpdateInvoiceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateInvoiceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateInvoiceMutation, { data, loading, error }] = useUpdateInvoiceMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateInvoiceMutation(baseOptions?: Apollo.MutationHookOptions<UpdateInvoiceMutation, UpdateInvoiceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateInvoiceMutation, UpdateInvoiceMutationVariables>(UpdateInvoiceDocument, options);
      }
export type UpdateInvoiceMutationHookResult = ReturnType<typeof useUpdateInvoiceMutation>;
export type UpdateInvoiceMutationResult = Apollo.MutationResult<UpdateInvoiceMutation>;
export type UpdateInvoiceMutationOptions = Apollo.BaseMutationOptions<UpdateInvoiceMutation, UpdateInvoiceMutationVariables>;
export const DeleteInvoiceDocument = gql`
    mutation DeleteInvoice($id: ID!) {
  deleteInvoice(id: $id)
}
    `;
export type DeleteInvoiceMutationFn = Apollo.MutationFunction<DeleteInvoiceMutation, DeleteInvoiceMutationVariables>;

/**
 * __useDeleteInvoiceMutation__
 *
 * To run a mutation, you first call `useDeleteInvoiceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteInvoiceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteInvoiceMutation, { data, loading, error }] = useDeleteInvoiceMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteInvoiceMutation(baseOptions?: Apollo.MutationHookOptions<DeleteInvoiceMutation, DeleteInvoiceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteInvoiceMutation, DeleteInvoiceMutationVariables>(DeleteInvoiceDocument, options);
      }
export type DeleteInvoiceMutationHookResult = ReturnType<typeof useDeleteInvoiceMutation>;
export type DeleteInvoiceMutationResult = Apollo.MutationResult<DeleteInvoiceMutation>;
export type DeleteInvoiceMutationOptions = Apollo.BaseMutationOptions<DeleteInvoiceMutation, DeleteInvoiceMutationVariables>;
export const ListLeaveRequestsDocument = gql`
    query ListLeaveRequests {
  listLeaveRequests {
    id
    employeeId
    type
    fromDate
    toDate
    reason
    status
  }
}
    `;

/**
 * __useListLeaveRequestsQuery__
 *
 * To run a query within a React component, call `useListLeaveRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListLeaveRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListLeaveRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListLeaveRequestsQuery(baseOptions?: Apollo.QueryHookOptions<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>(ListLeaveRequestsDocument, options);
      }
export function useListLeaveRequestsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>(ListLeaveRequestsDocument, options);
        }
// @ts-ignore
export function useListLeaveRequestsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>;
export function useListLeaveRequestsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLeaveRequestsQuery | undefined, ListLeaveRequestsQueryVariables>;
export function useListLeaveRequestsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>(ListLeaveRequestsDocument, options);
        }
export type ListLeaveRequestsQueryHookResult = ReturnType<typeof useListLeaveRequestsQuery>;
export type ListLeaveRequestsLazyQueryHookResult = ReturnType<typeof useListLeaveRequestsLazyQuery>;
export type ListLeaveRequestsSuspenseQueryHookResult = ReturnType<typeof useListLeaveRequestsSuspenseQuery>;
export type ListLeaveRequestsQueryResult = Apollo.QueryResult<ListLeaveRequestsQuery, ListLeaveRequestsQueryVariables>;
export const CreateLeaveRequestDocument = gql`
    mutation CreateLeaveRequest($input: LeaveRequestInput!) {
  createLeaveRequest(input: $input) {
    id
  }
}
    `;
export type CreateLeaveRequestMutationFn = Apollo.MutationFunction<CreateLeaveRequestMutation, CreateLeaveRequestMutationVariables>;

/**
 * __useCreateLeaveRequestMutation__
 *
 * To run a mutation, you first call `useCreateLeaveRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateLeaveRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createLeaveRequestMutation, { data, loading, error }] = useCreateLeaveRequestMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateLeaveRequestMutation(baseOptions?: Apollo.MutationHookOptions<CreateLeaveRequestMutation, CreateLeaveRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateLeaveRequestMutation, CreateLeaveRequestMutationVariables>(CreateLeaveRequestDocument, options);
      }
export type CreateLeaveRequestMutationHookResult = ReturnType<typeof useCreateLeaveRequestMutation>;
export type CreateLeaveRequestMutationResult = Apollo.MutationResult<CreateLeaveRequestMutation>;
export type CreateLeaveRequestMutationOptions = Apollo.BaseMutationOptions<CreateLeaveRequestMutation, CreateLeaveRequestMutationVariables>;
export const UpdateLeaveRequestDocument = gql`
    mutation UpdateLeaveRequest($id: ID!, $input: LeaveRequestInput!) {
  updateLeaveRequest(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateLeaveRequestMutationFn = Apollo.MutationFunction<UpdateLeaveRequestMutation, UpdateLeaveRequestMutationVariables>;

/**
 * __useUpdateLeaveRequestMutation__
 *
 * To run a mutation, you first call `useUpdateLeaveRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLeaveRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLeaveRequestMutation, { data, loading, error }] = useUpdateLeaveRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateLeaveRequestMutation(baseOptions?: Apollo.MutationHookOptions<UpdateLeaveRequestMutation, UpdateLeaveRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateLeaveRequestMutation, UpdateLeaveRequestMutationVariables>(UpdateLeaveRequestDocument, options);
      }
export type UpdateLeaveRequestMutationHookResult = ReturnType<typeof useUpdateLeaveRequestMutation>;
export type UpdateLeaveRequestMutationResult = Apollo.MutationResult<UpdateLeaveRequestMutation>;
export type UpdateLeaveRequestMutationOptions = Apollo.BaseMutationOptions<UpdateLeaveRequestMutation, UpdateLeaveRequestMutationVariables>;
export const DeleteLeaveRequestDocument = gql`
    mutation DeleteLeaveRequest($id: ID!) {
  deleteLeaveRequest(id: $id)
}
    `;
export type DeleteLeaveRequestMutationFn = Apollo.MutationFunction<DeleteLeaveRequestMutation, DeleteLeaveRequestMutationVariables>;

/**
 * __useDeleteLeaveRequestMutation__
 *
 * To run a mutation, you first call `useDeleteLeaveRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteLeaveRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteLeaveRequestMutation, { data, loading, error }] = useDeleteLeaveRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteLeaveRequestMutation(baseOptions?: Apollo.MutationHookOptions<DeleteLeaveRequestMutation, DeleteLeaveRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteLeaveRequestMutation, DeleteLeaveRequestMutationVariables>(DeleteLeaveRequestDocument, options);
      }
export type DeleteLeaveRequestMutationHookResult = ReturnType<typeof useDeleteLeaveRequestMutation>;
export type DeleteLeaveRequestMutationResult = Apollo.MutationResult<DeleteLeaveRequestMutation>;
export type DeleteLeaveRequestMutationOptions = Apollo.BaseMutationOptions<DeleteLeaveRequestMutation, DeleteLeaveRequestMutationVariables>;
export const MyLeaveRequestsDocument = gql`
    query MyLeaveRequests {
  myLeaveRequests {
    ...LeaveFields
  }
}
    ${LeaveFieldsFragmentDoc}`;

/**
 * __useMyLeaveRequestsQuery__
 *
 * To run a query within a React component, call `useMyLeaveRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyLeaveRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyLeaveRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyLeaveRequestsQuery(baseOptions?: Apollo.QueryHookOptions<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>(MyLeaveRequestsDocument, options);
      }
export function useMyLeaveRequestsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>(MyLeaveRequestsDocument, options);
        }
// @ts-ignore
export function useMyLeaveRequestsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>): Apollo.UseSuspenseQueryResult<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>;
export function useMyLeaveRequestsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>): Apollo.UseSuspenseQueryResult<MyLeaveRequestsQuery | undefined, MyLeaveRequestsQueryVariables>;
export function useMyLeaveRequestsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>(MyLeaveRequestsDocument, options);
        }
export type MyLeaveRequestsQueryHookResult = ReturnType<typeof useMyLeaveRequestsQuery>;
export type MyLeaveRequestsLazyQueryHookResult = ReturnType<typeof useMyLeaveRequestsLazyQuery>;
export type MyLeaveRequestsSuspenseQueryHookResult = ReturnType<typeof useMyLeaveRequestsSuspenseQuery>;
export type MyLeaveRequestsQueryResult = Apollo.QueryResult<MyLeaveRequestsQuery, MyLeaveRequestsQueryVariables>;
export const ApplyLeaveDocument = gql`
    mutation ApplyLeave($input: ApplyLeaveInput!) {
  applyLeave(input: $input) {
    id
  }
}
    `;
export type ApplyLeaveMutationFn = Apollo.MutationFunction<ApplyLeaveMutation, ApplyLeaveMutationVariables>;

/**
 * __useApplyLeaveMutation__
 *
 * To run a mutation, you first call `useApplyLeaveMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApplyLeaveMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [applyLeaveMutation, { data, loading, error }] = useApplyLeaveMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useApplyLeaveMutation(baseOptions?: Apollo.MutationHookOptions<ApplyLeaveMutation, ApplyLeaveMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ApplyLeaveMutation, ApplyLeaveMutationVariables>(ApplyLeaveDocument, options);
      }
export type ApplyLeaveMutationHookResult = ReturnType<typeof useApplyLeaveMutation>;
export type ApplyLeaveMutationResult = Apollo.MutationResult<ApplyLeaveMutation>;
export type ApplyLeaveMutationOptions = Apollo.BaseMutationOptions<ApplyLeaveMutation, ApplyLeaveMutationVariables>;
export const MyAttendanceDocument = gql`
    query MyAttendance {
  myAttendance {
    ...AttendanceFields
  }
}
    ${AttendanceFieldsFragmentDoc}`;

/**
 * __useMyAttendanceQuery__
 *
 * To run a query within a React component, call `useMyAttendanceQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyAttendanceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyAttendanceQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyAttendanceQuery(baseOptions?: Apollo.QueryHookOptions<MyAttendanceQuery, MyAttendanceQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyAttendanceQuery, MyAttendanceQueryVariables>(MyAttendanceDocument, options);
      }
export function useMyAttendanceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyAttendanceQuery, MyAttendanceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyAttendanceQuery, MyAttendanceQueryVariables>(MyAttendanceDocument, options);
        }
// @ts-ignore
export function useMyAttendanceSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyAttendanceQuery, MyAttendanceQueryVariables>): Apollo.UseSuspenseQueryResult<MyAttendanceQuery, MyAttendanceQueryVariables>;
export function useMyAttendanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyAttendanceQuery, MyAttendanceQueryVariables>): Apollo.UseSuspenseQueryResult<MyAttendanceQuery | undefined, MyAttendanceQueryVariables>;
export function useMyAttendanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyAttendanceQuery, MyAttendanceQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyAttendanceQuery, MyAttendanceQueryVariables>(MyAttendanceDocument, options);
        }
export type MyAttendanceQueryHookResult = ReturnType<typeof useMyAttendanceQuery>;
export type MyAttendanceLazyQueryHookResult = ReturnType<typeof useMyAttendanceLazyQuery>;
export type MyAttendanceSuspenseQueryHookResult = ReturnType<typeof useMyAttendanceSuspenseQuery>;
export type MyAttendanceQueryResult = Apollo.QueryResult<MyAttendanceQuery, MyAttendanceQueryVariables>;
export const MarkAttendanceDocument = gql`
    mutation MarkAttendance($input: MarkAttendanceInput!) {
  markAttendance(input: $input) {
    id
  }
}
    `;
export type MarkAttendanceMutationFn = Apollo.MutationFunction<MarkAttendanceMutation, MarkAttendanceMutationVariables>;

/**
 * __useMarkAttendanceMutation__
 *
 * To run a mutation, you first call `useMarkAttendanceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkAttendanceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markAttendanceMutation, { data, loading, error }] = useMarkAttendanceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useMarkAttendanceMutation(baseOptions?: Apollo.MutationHookOptions<MarkAttendanceMutation, MarkAttendanceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<MarkAttendanceMutation, MarkAttendanceMutationVariables>(MarkAttendanceDocument, options);
      }
export type MarkAttendanceMutationHookResult = ReturnType<typeof useMarkAttendanceMutation>;
export type MarkAttendanceMutationResult = Apollo.MutationResult<MarkAttendanceMutation>;
export type MarkAttendanceMutationOptions = Apollo.BaseMutationOptions<MarkAttendanceMutation, MarkAttendanceMutationVariables>;
export const ListAttendanceDocument = gql`
    query ListAttendance {
  listAttendance {
    ...AttendanceFields
  }
}
    ${AttendanceFieldsFragmentDoc}`;

/**
 * __useListAttendanceQuery__
 *
 * To run a query within a React component, call `useListAttendanceQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAttendanceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAttendanceQuery({
 *   variables: {
 *   },
 * });
 */
export function useListAttendanceQuery(baseOptions?: Apollo.QueryHookOptions<ListAttendanceQuery, ListAttendanceQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListAttendanceQuery, ListAttendanceQueryVariables>(ListAttendanceDocument, options);
      }
export function useListAttendanceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListAttendanceQuery, ListAttendanceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListAttendanceQuery, ListAttendanceQueryVariables>(ListAttendanceDocument, options);
        }
// @ts-ignore
export function useListAttendanceSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListAttendanceQuery, ListAttendanceQueryVariables>): Apollo.UseSuspenseQueryResult<ListAttendanceQuery, ListAttendanceQueryVariables>;
export function useListAttendanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAttendanceQuery, ListAttendanceQueryVariables>): Apollo.UseSuspenseQueryResult<ListAttendanceQuery | undefined, ListAttendanceQueryVariables>;
export function useListAttendanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAttendanceQuery, ListAttendanceQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListAttendanceQuery, ListAttendanceQueryVariables>(ListAttendanceDocument, options);
        }
export type ListAttendanceQueryHookResult = ReturnType<typeof useListAttendanceQuery>;
export type ListAttendanceLazyQueryHookResult = ReturnType<typeof useListAttendanceLazyQuery>;
export type ListAttendanceSuspenseQueryHookResult = ReturnType<typeof useListAttendanceSuspenseQuery>;
export type ListAttendanceQueryResult = Apollo.QueryResult<ListAttendanceQuery, ListAttendanceQueryVariables>;
export const LeaveRequestsByEmployeeDocument = gql`
    query LeaveRequestsByEmployee($employeeId: ID!) {
  leaveRequestsByEmployee(employeeId: $employeeId) {
    ...LeaveFields
  }
}
    ${LeaveFieldsFragmentDoc}`;

/**
 * __useLeaveRequestsByEmployeeQuery__
 *
 * To run a query within a React component, call `useLeaveRequestsByEmployeeQuery` and pass it any options that fit your needs.
 * When your component renders, `useLeaveRequestsByEmployeeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLeaveRequestsByEmployeeQuery({
 *   variables: {
 *      employeeId: // value for 'employeeId'
 *   },
 * });
 */
export function useLeaveRequestsByEmployeeQuery(baseOptions: Apollo.QueryHookOptions<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables> & ({ variables: LeaveRequestsByEmployeeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables>(LeaveRequestsByEmployeeDocument, options);
      }
export function useLeaveRequestsByEmployeeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables>(LeaveRequestsByEmployeeDocument, options);
        }
// @ts-ignore
export function useLeaveRequestsByEmployeeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables>): Apollo.UseSuspenseQueryResult<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables>;
export function useLeaveRequestsByEmployeeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables>): Apollo.UseSuspenseQueryResult<LeaveRequestsByEmployeeQuery | undefined, LeaveRequestsByEmployeeQueryVariables>;
export function useLeaveRequestsByEmployeeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables>(LeaveRequestsByEmployeeDocument, options);
        }
export type LeaveRequestsByEmployeeQueryHookResult = ReturnType<typeof useLeaveRequestsByEmployeeQuery>;
export type LeaveRequestsByEmployeeLazyQueryHookResult = ReturnType<typeof useLeaveRequestsByEmployeeLazyQuery>;
export type LeaveRequestsByEmployeeSuspenseQueryHookResult = ReturnType<typeof useLeaveRequestsByEmployeeSuspenseQuery>;
export type LeaveRequestsByEmployeeQueryResult = Apollo.QueryResult<LeaveRequestsByEmployeeQuery, LeaveRequestsByEmployeeQueryVariables>;
export const AttendanceByEmployeeDocument = gql`
    query AttendanceByEmployee($employeeId: ID!) {
  attendanceByEmployee(employeeId: $employeeId) {
    ...AttendanceFields
  }
}
    ${AttendanceFieldsFragmentDoc}`;

/**
 * __useAttendanceByEmployeeQuery__
 *
 * To run a query within a React component, call `useAttendanceByEmployeeQuery` and pass it any options that fit your needs.
 * When your component renders, `useAttendanceByEmployeeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAttendanceByEmployeeQuery({
 *   variables: {
 *      employeeId: // value for 'employeeId'
 *   },
 * });
 */
export function useAttendanceByEmployeeQuery(baseOptions: Apollo.QueryHookOptions<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables> & ({ variables: AttendanceByEmployeeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables>(AttendanceByEmployeeDocument, options);
      }
export function useAttendanceByEmployeeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables>(AttendanceByEmployeeDocument, options);
        }
// @ts-ignore
export function useAttendanceByEmployeeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables>): Apollo.UseSuspenseQueryResult<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables>;
export function useAttendanceByEmployeeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables>): Apollo.UseSuspenseQueryResult<AttendanceByEmployeeQuery | undefined, AttendanceByEmployeeQueryVariables>;
export function useAttendanceByEmployeeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables>(AttendanceByEmployeeDocument, options);
        }
export type AttendanceByEmployeeQueryHookResult = ReturnType<typeof useAttendanceByEmployeeQuery>;
export type AttendanceByEmployeeLazyQueryHookResult = ReturnType<typeof useAttendanceByEmployeeLazyQuery>;
export type AttendanceByEmployeeSuspenseQueryHookResult = ReturnType<typeof useAttendanceByEmployeeSuspenseQuery>;
export type AttendanceByEmployeeQueryResult = Apollo.QueryResult<AttendanceByEmployeeQuery, AttendanceByEmployeeQueryVariables>;
export const SetLeaveStatusDocument = gql`
    mutation SetLeaveStatus($id: ID!, $status: LeaveStatus!) {
  setLeaveStatus(id: $id, status: $status) {
    id
    status
  }
}
    `;
export type SetLeaveStatusMutationFn = Apollo.MutationFunction<SetLeaveStatusMutation, SetLeaveStatusMutationVariables>;

/**
 * __useSetLeaveStatusMutation__
 *
 * To run a mutation, you first call `useSetLeaveStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetLeaveStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setLeaveStatusMutation, { data, loading, error }] = useSetLeaveStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useSetLeaveStatusMutation(baseOptions?: Apollo.MutationHookOptions<SetLeaveStatusMutation, SetLeaveStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetLeaveStatusMutation, SetLeaveStatusMutationVariables>(SetLeaveStatusDocument, options);
      }
export type SetLeaveStatusMutationHookResult = ReturnType<typeof useSetLeaveStatusMutation>;
export type SetLeaveStatusMutationResult = Apollo.MutationResult<SetLeaveStatusMutation>;
export type SetLeaveStatusMutationOptions = Apollo.BaseMutationOptions<SetLeaveStatusMutation, SetLeaveStatusMutationVariables>;
export const HrDashboardDocument = gql`
    query HrDashboard {
  hrDashboard {
    totalEmployees
    activeEmployees
    onLeave
    headcount {
      label
      count
    }
  }
}
    `;

/**
 * __useHrDashboardQuery__
 *
 * To run a query within a React component, call `useHrDashboardQuery` and pass it any options that fit your needs.
 * When your component renders, `useHrDashboardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHrDashboardQuery({
 *   variables: {
 *   },
 * });
 */
export function useHrDashboardQuery(baseOptions?: Apollo.QueryHookOptions<HrDashboardQuery, HrDashboardQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HrDashboardQuery, HrDashboardQueryVariables>(HrDashboardDocument, options);
      }
export function useHrDashboardLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HrDashboardQuery, HrDashboardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HrDashboardQuery, HrDashboardQueryVariables>(HrDashboardDocument, options);
        }
// @ts-ignore
export function useHrDashboardSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<HrDashboardQuery, HrDashboardQueryVariables>): Apollo.UseSuspenseQueryResult<HrDashboardQuery, HrDashboardQueryVariables>;
export function useHrDashboardSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HrDashboardQuery, HrDashboardQueryVariables>): Apollo.UseSuspenseQueryResult<HrDashboardQuery | undefined, HrDashboardQueryVariables>;
export function useHrDashboardSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HrDashboardQuery, HrDashboardQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HrDashboardQuery, HrDashboardQueryVariables>(HrDashboardDocument, options);
        }
export type HrDashboardQueryHookResult = ReturnType<typeof useHrDashboardQuery>;
export type HrDashboardLazyQueryHookResult = ReturnType<typeof useHrDashboardLazyQuery>;
export type HrDashboardSuspenseQueryHookResult = ReturnType<typeof useHrDashboardSuspenseQuery>;
export type HrDashboardQueryResult = Apollo.QueryResult<HrDashboardQuery, HrDashboardQueryVariables>;
export const ListDepartmentsDocument = gql`
    query ListDepartments {
  listDepartments {
    id
    name
    description
  }
}
    `;

/**
 * __useListDepartmentsQuery__
 *
 * To run a query within a React component, call `useListDepartmentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListDepartmentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListDepartmentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListDepartmentsQuery(baseOptions?: Apollo.QueryHookOptions<ListDepartmentsQuery, ListDepartmentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListDepartmentsQuery, ListDepartmentsQueryVariables>(ListDepartmentsDocument, options);
      }
export function useListDepartmentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListDepartmentsQuery, ListDepartmentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListDepartmentsQuery, ListDepartmentsQueryVariables>(ListDepartmentsDocument, options);
        }
// @ts-ignore
export function useListDepartmentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListDepartmentsQuery, ListDepartmentsQueryVariables>): Apollo.UseSuspenseQueryResult<ListDepartmentsQuery, ListDepartmentsQueryVariables>;
export function useListDepartmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListDepartmentsQuery, ListDepartmentsQueryVariables>): Apollo.UseSuspenseQueryResult<ListDepartmentsQuery | undefined, ListDepartmentsQueryVariables>;
export function useListDepartmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListDepartmentsQuery, ListDepartmentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListDepartmentsQuery, ListDepartmentsQueryVariables>(ListDepartmentsDocument, options);
        }
export type ListDepartmentsQueryHookResult = ReturnType<typeof useListDepartmentsQuery>;
export type ListDepartmentsLazyQueryHookResult = ReturnType<typeof useListDepartmentsLazyQuery>;
export type ListDepartmentsSuspenseQueryHookResult = ReturnType<typeof useListDepartmentsSuspenseQuery>;
export type ListDepartmentsQueryResult = Apollo.QueryResult<ListDepartmentsQuery, ListDepartmentsQueryVariables>;
export const CreateDepartmentDocument = gql`
    mutation CreateDepartment($input: DepartmentInput!) {
  createDepartment(input: $input) {
    id
  }
}
    `;
export type CreateDepartmentMutationFn = Apollo.MutationFunction<CreateDepartmentMutation, CreateDepartmentMutationVariables>;

/**
 * __useCreateDepartmentMutation__
 *
 * To run a mutation, you first call `useCreateDepartmentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDepartmentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDepartmentMutation, { data, loading, error }] = useCreateDepartmentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateDepartmentMutation(baseOptions?: Apollo.MutationHookOptions<CreateDepartmentMutation, CreateDepartmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateDepartmentMutation, CreateDepartmentMutationVariables>(CreateDepartmentDocument, options);
      }
export type CreateDepartmentMutationHookResult = ReturnType<typeof useCreateDepartmentMutation>;
export type CreateDepartmentMutationResult = Apollo.MutationResult<CreateDepartmentMutation>;
export type CreateDepartmentMutationOptions = Apollo.BaseMutationOptions<CreateDepartmentMutation, CreateDepartmentMutationVariables>;
export const UpdateDepartmentDocument = gql`
    mutation UpdateDepartment($id: ID!, $input: DepartmentInput!) {
  updateDepartment(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateDepartmentMutationFn = Apollo.MutationFunction<UpdateDepartmentMutation, UpdateDepartmentMutationVariables>;

/**
 * __useUpdateDepartmentMutation__
 *
 * To run a mutation, you first call `useUpdateDepartmentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateDepartmentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateDepartmentMutation, { data, loading, error }] = useUpdateDepartmentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateDepartmentMutation(baseOptions?: Apollo.MutationHookOptions<UpdateDepartmentMutation, UpdateDepartmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateDepartmentMutation, UpdateDepartmentMutationVariables>(UpdateDepartmentDocument, options);
      }
export type UpdateDepartmentMutationHookResult = ReturnType<typeof useUpdateDepartmentMutation>;
export type UpdateDepartmentMutationResult = Apollo.MutationResult<UpdateDepartmentMutation>;
export type UpdateDepartmentMutationOptions = Apollo.BaseMutationOptions<UpdateDepartmentMutation, UpdateDepartmentMutationVariables>;
export const DeleteDepartmentDocument = gql`
    mutation DeleteDepartment($id: ID!) {
  deleteDepartment(id: $id)
}
    `;
export type DeleteDepartmentMutationFn = Apollo.MutationFunction<DeleteDepartmentMutation, DeleteDepartmentMutationVariables>;

/**
 * __useDeleteDepartmentMutation__
 *
 * To run a mutation, you first call `useDeleteDepartmentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteDepartmentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteDepartmentMutation, { data, loading, error }] = useDeleteDepartmentMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteDepartmentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteDepartmentMutation, DeleteDepartmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteDepartmentMutation, DeleteDepartmentMutationVariables>(DeleteDepartmentDocument, options);
      }
export type DeleteDepartmentMutationHookResult = ReturnType<typeof useDeleteDepartmentMutation>;
export type DeleteDepartmentMutationResult = Apollo.MutationResult<DeleteDepartmentMutation>;
export type DeleteDepartmentMutationOptions = Apollo.BaseMutationOptions<DeleteDepartmentMutation, DeleteDepartmentMutationVariables>;
export const ListPositionsDocument = gql`
    query ListPositions {
  listPositions {
    id
    name
    department
    description
  }
}
    `;

/**
 * __useListPositionsQuery__
 *
 * To run a query within a React component, call `useListPositionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListPositionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListPositionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListPositionsQuery(baseOptions?: Apollo.QueryHookOptions<ListPositionsQuery, ListPositionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListPositionsQuery, ListPositionsQueryVariables>(ListPositionsDocument, options);
      }
export function useListPositionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListPositionsQuery, ListPositionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListPositionsQuery, ListPositionsQueryVariables>(ListPositionsDocument, options);
        }
// @ts-ignore
export function useListPositionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListPositionsQuery, ListPositionsQueryVariables>): Apollo.UseSuspenseQueryResult<ListPositionsQuery, ListPositionsQueryVariables>;
export function useListPositionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPositionsQuery, ListPositionsQueryVariables>): Apollo.UseSuspenseQueryResult<ListPositionsQuery | undefined, ListPositionsQueryVariables>;
export function useListPositionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListPositionsQuery, ListPositionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListPositionsQuery, ListPositionsQueryVariables>(ListPositionsDocument, options);
        }
export type ListPositionsQueryHookResult = ReturnType<typeof useListPositionsQuery>;
export type ListPositionsLazyQueryHookResult = ReturnType<typeof useListPositionsLazyQuery>;
export type ListPositionsSuspenseQueryHookResult = ReturnType<typeof useListPositionsSuspenseQuery>;
export type ListPositionsQueryResult = Apollo.QueryResult<ListPositionsQuery, ListPositionsQueryVariables>;
export const CreatePositionDocument = gql`
    mutation CreatePosition($input: PositionInput!) {
  createPosition(input: $input) {
    id
  }
}
    `;
export type CreatePositionMutationFn = Apollo.MutationFunction<CreatePositionMutation, CreatePositionMutationVariables>;

/**
 * __useCreatePositionMutation__
 *
 * To run a mutation, you first call `useCreatePositionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePositionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPositionMutation, { data, loading, error }] = useCreatePositionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePositionMutation(baseOptions?: Apollo.MutationHookOptions<CreatePositionMutation, CreatePositionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreatePositionMutation, CreatePositionMutationVariables>(CreatePositionDocument, options);
      }
export type CreatePositionMutationHookResult = ReturnType<typeof useCreatePositionMutation>;
export type CreatePositionMutationResult = Apollo.MutationResult<CreatePositionMutation>;
export type CreatePositionMutationOptions = Apollo.BaseMutationOptions<CreatePositionMutation, CreatePositionMutationVariables>;
export const UpdatePositionDocument = gql`
    mutation UpdatePosition($id: ID!, $input: PositionInput!) {
  updatePosition(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdatePositionMutationFn = Apollo.MutationFunction<UpdatePositionMutation, UpdatePositionMutationVariables>;

/**
 * __useUpdatePositionMutation__
 *
 * To run a mutation, you first call `useUpdatePositionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePositionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePositionMutation, { data, loading, error }] = useUpdatePositionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePositionMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePositionMutation, UpdatePositionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePositionMutation, UpdatePositionMutationVariables>(UpdatePositionDocument, options);
      }
export type UpdatePositionMutationHookResult = ReturnType<typeof useUpdatePositionMutation>;
export type UpdatePositionMutationResult = Apollo.MutationResult<UpdatePositionMutation>;
export type UpdatePositionMutationOptions = Apollo.BaseMutationOptions<UpdatePositionMutation, UpdatePositionMutationVariables>;
export const DeletePositionDocument = gql`
    mutation DeletePosition($id: ID!) {
  deletePosition(id: $id)
}
    `;
export type DeletePositionMutationFn = Apollo.MutationFunction<DeletePositionMutation, DeletePositionMutationVariables>;

/**
 * __useDeletePositionMutation__
 *
 * To run a mutation, you first call `useDeletePositionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePositionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePositionMutation, { data, loading, error }] = useDeletePositionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePositionMutation(baseOptions?: Apollo.MutationHookOptions<DeletePositionMutation, DeletePositionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeletePositionMutation, DeletePositionMutationVariables>(DeletePositionDocument, options);
      }
export type DeletePositionMutationHookResult = ReturnType<typeof useDeletePositionMutation>;
export type DeletePositionMutationResult = Apollo.MutationResult<DeletePositionMutation>;
export type DeletePositionMutationOptions = Apollo.BaseMutationOptions<DeletePositionMutation, DeletePositionMutationVariables>;
export const ListContractsDocument = gql`
    query ListContracts {
  listContracts {
    id
    title
    party
    type
    effectiveDate
    expiryDate
    status
    sentAt
    signedBy
    signedAt
  }
}
    `;

/**
 * __useListContractsQuery__
 *
 * To run a query within a React component, call `useListContractsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListContractsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListContractsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListContractsQuery(baseOptions?: Apollo.QueryHookOptions<ListContractsQuery, ListContractsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListContractsQuery, ListContractsQueryVariables>(ListContractsDocument, options);
      }
export function useListContractsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListContractsQuery, ListContractsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListContractsQuery, ListContractsQueryVariables>(ListContractsDocument, options);
        }
// @ts-ignore
export function useListContractsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListContractsQuery, ListContractsQueryVariables>): Apollo.UseSuspenseQueryResult<ListContractsQuery, ListContractsQueryVariables>;
export function useListContractsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListContractsQuery, ListContractsQueryVariables>): Apollo.UseSuspenseQueryResult<ListContractsQuery | undefined, ListContractsQueryVariables>;
export function useListContractsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListContractsQuery, ListContractsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListContractsQuery, ListContractsQueryVariables>(ListContractsDocument, options);
        }
export type ListContractsQueryHookResult = ReturnType<typeof useListContractsQuery>;
export type ListContractsLazyQueryHookResult = ReturnType<typeof useListContractsLazyQuery>;
export type ListContractsSuspenseQueryHookResult = ReturnType<typeof useListContractsSuspenseQuery>;
export type ListContractsQueryResult = Apollo.QueryResult<ListContractsQuery, ListContractsQueryVariables>;
export const ListContractsPagedDocument = gql`
    query ListContractsPaged($input: TableQueryInput!) {
  listContractsPaged(input: $input) {
    totalCount
    rows {
      id
      title
      party
      type
      effectiveDate
      expiryDate
      status
      sentAt
      signedBy
      signedAt
    }
  }
}
    `;

/**
 * __useListContractsPagedQuery__
 *
 * To run a query within a React component, call `useListContractsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListContractsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListContractsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListContractsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListContractsPagedQuery, ListContractsPagedQueryVariables> & ({ variables: ListContractsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListContractsPagedQuery, ListContractsPagedQueryVariables>(ListContractsPagedDocument, options);
      }
export function useListContractsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListContractsPagedQuery, ListContractsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListContractsPagedQuery, ListContractsPagedQueryVariables>(ListContractsPagedDocument, options);
        }
// @ts-ignore
export function useListContractsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListContractsPagedQuery, ListContractsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListContractsPagedQuery, ListContractsPagedQueryVariables>;
export function useListContractsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListContractsPagedQuery, ListContractsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListContractsPagedQuery | undefined, ListContractsPagedQueryVariables>;
export function useListContractsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListContractsPagedQuery, ListContractsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListContractsPagedQuery, ListContractsPagedQueryVariables>(ListContractsPagedDocument, options);
        }
export type ListContractsPagedQueryHookResult = ReturnType<typeof useListContractsPagedQuery>;
export type ListContractsPagedLazyQueryHookResult = ReturnType<typeof useListContractsPagedLazyQuery>;
export type ListContractsPagedSuspenseQueryHookResult = ReturnType<typeof useListContractsPagedSuspenseQuery>;
export type ListContractsPagedQueryResult = Apollo.QueryResult<ListContractsPagedQuery, ListContractsPagedQueryVariables>;
export const ListContractsStatsDocument = gql`
    query ListContractsStats {
  listContractsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListContractsStatsQuery__
 *
 * To run a query within a React component, call `useListContractsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListContractsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListContractsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListContractsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListContractsStatsQuery, ListContractsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListContractsStatsQuery, ListContractsStatsQueryVariables>(ListContractsStatsDocument, options);
      }
export function useListContractsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListContractsStatsQuery, ListContractsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListContractsStatsQuery, ListContractsStatsQueryVariables>(ListContractsStatsDocument, options);
        }
// @ts-ignore
export function useListContractsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListContractsStatsQuery, ListContractsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListContractsStatsQuery, ListContractsStatsQueryVariables>;
export function useListContractsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListContractsStatsQuery, ListContractsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListContractsStatsQuery | undefined, ListContractsStatsQueryVariables>;
export function useListContractsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListContractsStatsQuery, ListContractsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListContractsStatsQuery, ListContractsStatsQueryVariables>(ListContractsStatsDocument, options);
        }
export type ListContractsStatsQueryHookResult = ReturnType<typeof useListContractsStatsQuery>;
export type ListContractsStatsLazyQueryHookResult = ReturnType<typeof useListContractsStatsLazyQuery>;
export type ListContractsStatsSuspenseQueryHookResult = ReturnType<typeof useListContractsStatsSuspenseQuery>;
export type ListContractsStatsQueryResult = Apollo.QueryResult<ListContractsStatsQuery, ListContractsStatsQueryVariables>;
export const CreateContractDocument = gql`
    mutation CreateContract($input: ContractInput!) {
  createContract(input: $input) {
    id
  }
}
    `;
export type CreateContractMutationFn = Apollo.MutationFunction<CreateContractMutation, CreateContractMutationVariables>;

/**
 * __useCreateContractMutation__
 *
 * To run a mutation, you first call `useCreateContractMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateContractMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createContractMutation, { data, loading, error }] = useCreateContractMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateContractMutation(baseOptions?: Apollo.MutationHookOptions<CreateContractMutation, CreateContractMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateContractMutation, CreateContractMutationVariables>(CreateContractDocument, options);
      }
export type CreateContractMutationHookResult = ReturnType<typeof useCreateContractMutation>;
export type CreateContractMutationResult = Apollo.MutationResult<CreateContractMutation>;
export type CreateContractMutationOptions = Apollo.BaseMutationOptions<CreateContractMutation, CreateContractMutationVariables>;
export const UpdateContractDocument = gql`
    mutation UpdateContract($id: ID!, $input: ContractInput!) {
  updateContract(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateContractMutationFn = Apollo.MutationFunction<UpdateContractMutation, UpdateContractMutationVariables>;

/**
 * __useUpdateContractMutation__
 *
 * To run a mutation, you first call `useUpdateContractMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateContractMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateContractMutation, { data, loading, error }] = useUpdateContractMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateContractMutation(baseOptions?: Apollo.MutationHookOptions<UpdateContractMutation, UpdateContractMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateContractMutation, UpdateContractMutationVariables>(UpdateContractDocument, options);
      }
export type UpdateContractMutationHookResult = ReturnType<typeof useUpdateContractMutation>;
export type UpdateContractMutationResult = Apollo.MutationResult<UpdateContractMutation>;
export type UpdateContractMutationOptions = Apollo.BaseMutationOptions<UpdateContractMutation, UpdateContractMutationVariables>;
export const DeleteContractDocument = gql`
    mutation DeleteContract($id: ID!) {
  deleteContract(id: $id)
}
    `;
export type DeleteContractMutationFn = Apollo.MutationFunction<DeleteContractMutation, DeleteContractMutationVariables>;

/**
 * __useDeleteContractMutation__
 *
 * To run a mutation, you first call `useDeleteContractMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteContractMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteContractMutation, { data, loading, error }] = useDeleteContractMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteContractMutation(baseOptions?: Apollo.MutationHookOptions<DeleteContractMutation, DeleteContractMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteContractMutation, DeleteContractMutationVariables>(DeleteContractDocument, options);
      }
export type DeleteContractMutationHookResult = ReturnType<typeof useDeleteContractMutation>;
export type DeleteContractMutationResult = Apollo.MutationResult<DeleteContractMutation>;
export type DeleteContractMutationOptions = Apollo.BaseMutationOptions<DeleteContractMutation, DeleteContractMutationVariables>;
export const SendContractDocument = gql`
    mutation SendContract($id: ID!, $email: String!, $message: String) {
  sendContract(id: $id, email: $email, message: $message) {
    id
    sentAt
  }
}
    `;
export type SendContractMutationFn = Apollo.MutationFunction<SendContractMutation, SendContractMutationVariables>;

/**
 * __useSendContractMutation__
 *
 * To run a mutation, you first call `useSendContractMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendContractMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendContractMutation, { data, loading, error }] = useSendContractMutation({
 *   variables: {
 *      id: // value for 'id'
 *      email: // value for 'email'
 *      message: // value for 'message'
 *   },
 * });
 */
export function useSendContractMutation(baseOptions?: Apollo.MutationHookOptions<SendContractMutation, SendContractMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendContractMutation, SendContractMutationVariables>(SendContractDocument, options);
      }
export type SendContractMutationHookResult = ReturnType<typeof useSendContractMutation>;
export type SendContractMutationResult = Apollo.MutationResult<SendContractMutation>;
export type SendContractMutationOptions = Apollo.BaseMutationOptions<SendContractMutation, SendContractMutationVariables>;
export const SignContractDocument = gql`
    mutation SignContract($id: ID!, $signedBy: String!) {
  signContract(id: $id, signedBy: $signedBy) {
    id
    signedBy
    signedAt
    status
  }
}
    `;
export type SignContractMutationFn = Apollo.MutationFunction<SignContractMutation, SignContractMutationVariables>;

/**
 * __useSignContractMutation__
 *
 * To run a mutation, you first call `useSignContractMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSignContractMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [signContractMutation, { data, loading, error }] = useSignContractMutation({
 *   variables: {
 *      id: // value for 'id'
 *      signedBy: // value for 'signedBy'
 *   },
 * });
 */
export function useSignContractMutation(baseOptions?: Apollo.MutationHookOptions<SignContractMutation, SignContractMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SignContractMutation, SignContractMutationVariables>(SignContractDocument, options);
      }
export type SignContractMutationHookResult = ReturnType<typeof useSignContractMutation>;
export type SignContractMutationResult = Apollo.MutationResult<SignContractMutation>;
export type SignContractMutationOptions = Apollo.BaseMutationOptions<SignContractMutation, SignContractMutationVariables>;
export const ListLegalDocumentsDocument = gql`
    query ListLegalDocuments {
  listLegalDocuments {
    id
    title
    category
    owner
    fileUrl
    status
  }
}
    `;

/**
 * __useListLegalDocumentsQuery__
 *
 * To run a query within a React component, call `useListLegalDocumentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListLegalDocumentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListLegalDocumentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListLegalDocumentsQuery(baseOptions?: Apollo.QueryHookOptions<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>(ListLegalDocumentsDocument, options);
      }
export function useListLegalDocumentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>(ListLegalDocumentsDocument, options);
        }
// @ts-ignore
export function useListLegalDocumentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>;
export function useListLegalDocumentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLegalDocumentsQuery | undefined, ListLegalDocumentsQueryVariables>;
export function useListLegalDocumentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>(ListLegalDocumentsDocument, options);
        }
export type ListLegalDocumentsQueryHookResult = ReturnType<typeof useListLegalDocumentsQuery>;
export type ListLegalDocumentsLazyQueryHookResult = ReturnType<typeof useListLegalDocumentsLazyQuery>;
export type ListLegalDocumentsSuspenseQueryHookResult = ReturnType<typeof useListLegalDocumentsSuspenseQuery>;
export type ListLegalDocumentsQueryResult = Apollo.QueryResult<ListLegalDocumentsQuery, ListLegalDocumentsQueryVariables>;
export const ListLegalDocumentsPagedDocument = gql`
    query ListLegalDocumentsPaged($input: TableQueryInput!) {
  listLegalDocumentsPaged(input: $input) {
    totalCount
    rows {
      id
      title
      category
      owner
      fileUrl
      status
    }
  }
}
    `;

/**
 * __useListLegalDocumentsPagedQuery__
 *
 * To run a query within a React component, call `useListLegalDocumentsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListLegalDocumentsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListLegalDocumentsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListLegalDocumentsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables> & ({ variables: ListLegalDocumentsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables>(ListLegalDocumentsPagedDocument, options);
      }
export function useListLegalDocumentsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables>(ListLegalDocumentsPagedDocument, options);
        }
// @ts-ignore
export function useListLegalDocumentsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables>;
export function useListLegalDocumentsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListLegalDocumentsPagedQuery | undefined, ListLegalDocumentsPagedQueryVariables>;
export function useListLegalDocumentsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables>(ListLegalDocumentsPagedDocument, options);
        }
export type ListLegalDocumentsPagedQueryHookResult = ReturnType<typeof useListLegalDocumentsPagedQuery>;
export type ListLegalDocumentsPagedLazyQueryHookResult = ReturnType<typeof useListLegalDocumentsPagedLazyQuery>;
export type ListLegalDocumentsPagedSuspenseQueryHookResult = ReturnType<typeof useListLegalDocumentsPagedSuspenseQuery>;
export type ListLegalDocumentsPagedQueryResult = Apollo.QueryResult<ListLegalDocumentsPagedQuery, ListLegalDocumentsPagedQueryVariables>;
export const ListLegalDocumentsStatsDocument = gql`
    query ListLegalDocumentsStats {
  listLegalDocumentsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListLegalDocumentsStatsQuery__
 *
 * To run a query within a React component, call `useListLegalDocumentsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListLegalDocumentsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListLegalDocumentsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListLegalDocumentsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>(ListLegalDocumentsStatsDocument, options);
      }
export function useListLegalDocumentsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>(ListLegalDocumentsStatsDocument, options);
        }
// @ts-ignore
export function useListLegalDocumentsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>;
export function useListLegalDocumentsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListLegalDocumentsStatsQuery | undefined, ListLegalDocumentsStatsQueryVariables>;
export function useListLegalDocumentsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>(ListLegalDocumentsStatsDocument, options);
        }
export type ListLegalDocumentsStatsQueryHookResult = ReturnType<typeof useListLegalDocumentsStatsQuery>;
export type ListLegalDocumentsStatsLazyQueryHookResult = ReturnType<typeof useListLegalDocumentsStatsLazyQuery>;
export type ListLegalDocumentsStatsSuspenseQueryHookResult = ReturnType<typeof useListLegalDocumentsStatsSuspenseQuery>;
export type ListLegalDocumentsStatsQueryResult = Apollo.QueryResult<ListLegalDocumentsStatsQuery, ListLegalDocumentsStatsQueryVariables>;
export const CreateLegalDocumentDocument = gql`
    mutation CreateLegalDocument($input: LegalDocumentInput!) {
  createLegalDocument(input: $input) {
    id
  }
}
    `;
export type CreateLegalDocumentMutationFn = Apollo.MutationFunction<CreateLegalDocumentMutation, CreateLegalDocumentMutationVariables>;

/**
 * __useCreateLegalDocumentMutation__
 *
 * To run a mutation, you first call `useCreateLegalDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateLegalDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createLegalDocumentMutation, { data, loading, error }] = useCreateLegalDocumentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateLegalDocumentMutation(baseOptions?: Apollo.MutationHookOptions<CreateLegalDocumentMutation, CreateLegalDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateLegalDocumentMutation, CreateLegalDocumentMutationVariables>(CreateLegalDocumentDocument, options);
      }
export type CreateLegalDocumentMutationHookResult = ReturnType<typeof useCreateLegalDocumentMutation>;
export type CreateLegalDocumentMutationResult = Apollo.MutationResult<CreateLegalDocumentMutation>;
export type CreateLegalDocumentMutationOptions = Apollo.BaseMutationOptions<CreateLegalDocumentMutation, CreateLegalDocumentMutationVariables>;
export const UpdateLegalDocumentDocument = gql`
    mutation UpdateLegalDocument($id: ID!, $input: LegalDocumentInput!) {
  updateLegalDocument(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateLegalDocumentMutationFn = Apollo.MutationFunction<UpdateLegalDocumentMutation, UpdateLegalDocumentMutationVariables>;

/**
 * __useUpdateLegalDocumentMutation__
 *
 * To run a mutation, you first call `useUpdateLegalDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLegalDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLegalDocumentMutation, { data, loading, error }] = useUpdateLegalDocumentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateLegalDocumentMutation(baseOptions?: Apollo.MutationHookOptions<UpdateLegalDocumentMutation, UpdateLegalDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateLegalDocumentMutation, UpdateLegalDocumentMutationVariables>(UpdateLegalDocumentDocument, options);
      }
export type UpdateLegalDocumentMutationHookResult = ReturnType<typeof useUpdateLegalDocumentMutation>;
export type UpdateLegalDocumentMutationResult = Apollo.MutationResult<UpdateLegalDocumentMutation>;
export type UpdateLegalDocumentMutationOptions = Apollo.BaseMutationOptions<UpdateLegalDocumentMutation, UpdateLegalDocumentMutationVariables>;
export const DeleteLegalDocumentDocument = gql`
    mutation DeleteLegalDocument($id: ID!) {
  deleteLegalDocument(id: $id)
}
    `;
export type DeleteLegalDocumentMutationFn = Apollo.MutationFunction<DeleteLegalDocumentMutation, DeleteLegalDocumentMutationVariables>;

/**
 * __useDeleteLegalDocumentMutation__
 *
 * To run a mutation, you first call `useDeleteLegalDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteLegalDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteLegalDocumentMutation, { data, loading, error }] = useDeleteLegalDocumentMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteLegalDocumentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteLegalDocumentMutation, DeleteLegalDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteLegalDocumentMutation, DeleteLegalDocumentMutationVariables>(DeleteLegalDocumentDocument, options);
      }
export type DeleteLegalDocumentMutationHookResult = ReturnType<typeof useDeleteLegalDocumentMutation>;
export type DeleteLegalDocumentMutationResult = Apollo.MutationResult<DeleteLegalDocumentMutation>;
export type DeleteLegalDocumentMutationOptions = Apollo.BaseMutationOptions<DeleteLegalDocumentMutation, DeleteLegalDocumentMutationVariables>;
export const ListCampaignsDocument = gql`
    query ListCampaigns {
  listCampaigns {
    id
    name
    channel
    budget
    startDate
    endDate
    status
    subject
    body
    lastSentAt
    recipientsCount
  }
}
    `;

/**
 * __useListCampaignsQuery__
 *
 * To run a query within a React component, call `useListCampaignsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListCampaignsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListCampaignsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListCampaignsQuery(baseOptions?: Apollo.QueryHookOptions<ListCampaignsQuery, ListCampaignsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListCampaignsQuery, ListCampaignsQueryVariables>(ListCampaignsDocument, options);
      }
export function useListCampaignsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListCampaignsQuery, ListCampaignsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListCampaignsQuery, ListCampaignsQueryVariables>(ListCampaignsDocument, options);
        }
// @ts-ignore
export function useListCampaignsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListCampaignsQuery, ListCampaignsQueryVariables>): Apollo.UseSuspenseQueryResult<ListCampaignsQuery, ListCampaignsQueryVariables>;
export function useListCampaignsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCampaignsQuery, ListCampaignsQueryVariables>): Apollo.UseSuspenseQueryResult<ListCampaignsQuery | undefined, ListCampaignsQueryVariables>;
export function useListCampaignsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCampaignsQuery, ListCampaignsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListCampaignsQuery, ListCampaignsQueryVariables>(ListCampaignsDocument, options);
        }
export type ListCampaignsQueryHookResult = ReturnType<typeof useListCampaignsQuery>;
export type ListCampaignsLazyQueryHookResult = ReturnType<typeof useListCampaignsLazyQuery>;
export type ListCampaignsSuspenseQueryHookResult = ReturnType<typeof useListCampaignsSuspenseQuery>;
export type ListCampaignsQueryResult = Apollo.QueryResult<ListCampaignsQuery, ListCampaignsQueryVariables>;
export const ListCampaignsPagedDocument = gql`
    query ListCampaignsPaged($input: TableQueryInput!) {
  listCampaignsPaged(input: $input) {
    totalCount
    rows {
      id
      name
      channel
      budget
      startDate
      endDate
      status
      subject
      body
      lastSentAt
      recipientsCount
    }
  }
}
    `;

/**
 * __useListCampaignsPagedQuery__
 *
 * To run a query within a React component, call `useListCampaignsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListCampaignsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListCampaignsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListCampaignsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables> & ({ variables: ListCampaignsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>(ListCampaignsPagedDocument, options);
      }
export function useListCampaignsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>(ListCampaignsPagedDocument, options);
        }
// @ts-ignore
export function useListCampaignsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>;
export function useListCampaignsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListCampaignsPagedQuery | undefined, ListCampaignsPagedQueryVariables>;
export function useListCampaignsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>(ListCampaignsPagedDocument, options);
        }
export type ListCampaignsPagedQueryHookResult = ReturnType<typeof useListCampaignsPagedQuery>;
export type ListCampaignsPagedLazyQueryHookResult = ReturnType<typeof useListCampaignsPagedLazyQuery>;
export type ListCampaignsPagedSuspenseQueryHookResult = ReturnType<typeof useListCampaignsPagedSuspenseQuery>;
export type ListCampaignsPagedQueryResult = Apollo.QueryResult<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>;
export const ListCampaignsStatsDocument = gql`
    query ListCampaignsStats {
  listCampaignsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListCampaignsStatsQuery__
 *
 * To run a query within a React component, call `useListCampaignsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListCampaignsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListCampaignsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListCampaignsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>(ListCampaignsStatsDocument, options);
      }
export function useListCampaignsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>(ListCampaignsStatsDocument, options);
        }
// @ts-ignore
export function useListCampaignsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>;
export function useListCampaignsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListCampaignsStatsQuery | undefined, ListCampaignsStatsQueryVariables>;
export function useListCampaignsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>(ListCampaignsStatsDocument, options);
        }
export type ListCampaignsStatsQueryHookResult = ReturnType<typeof useListCampaignsStatsQuery>;
export type ListCampaignsStatsLazyQueryHookResult = ReturnType<typeof useListCampaignsStatsLazyQuery>;
export type ListCampaignsStatsSuspenseQueryHookResult = ReturnType<typeof useListCampaignsStatsSuspenseQuery>;
export type ListCampaignsStatsQueryResult = Apollo.QueryResult<ListCampaignsStatsQuery, ListCampaignsStatsQueryVariables>;
export const CreateCampaignDocument = gql`
    mutation CreateCampaign($input: CampaignInput!) {
  createCampaign(input: $input) {
    id
  }
}
    `;
export type CreateCampaignMutationFn = Apollo.MutationFunction<CreateCampaignMutation, CreateCampaignMutationVariables>;

/**
 * __useCreateCampaignMutation__
 *
 * To run a mutation, you first call `useCreateCampaignMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCampaignMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCampaignMutation, { data, loading, error }] = useCreateCampaignMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCampaignMutation(baseOptions?: Apollo.MutationHookOptions<CreateCampaignMutation, CreateCampaignMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCampaignMutation, CreateCampaignMutationVariables>(CreateCampaignDocument, options);
      }
export type CreateCampaignMutationHookResult = ReturnType<typeof useCreateCampaignMutation>;
export type CreateCampaignMutationResult = Apollo.MutationResult<CreateCampaignMutation>;
export type CreateCampaignMutationOptions = Apollo.BaseMutationOptions<CreateCampaignMutation, CreateCampaignMutationVariables>;
export const UpdateCampaignDocument = gql`
    mutation UpdateCampaign($id: ID!, $input: CampaignInput!) {
  updateCampaign(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateCampaignMutationFn = Apollo.MutationFunction<UpdateCampaignMutation, UpdateCampaignMutationVariables>;

/**
 * __useUpdateCampaignMutation__
 *
 * To run a mutation, you first call `useUpdateCampaignMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCampaignMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCampaignMutation, { data, loading, error }] = useUpdateCampaignMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateCampaignMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCampaignMutation, UpdateCampaignMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCampaignMutation, UpdateCampaignMutationVariables>(UpdateCampaignDocument, options);
      }
export type UpdateCampaignMutationHookResult = ReturnType<typeof useUpdateCampaignMutation>;
export type UpdateCampaignMutationResult = Apollo.MutationResult<UpdateCampaignMutation>;
export type UpdateCampaignMutationOptions = Apollo.BaseMutationOptions<UpdateCampaignMutation, UpdateCampaignMutationVariables>;
export const DeleteCampaignDocument = gql`
    mutation DeleteCampaign($id: ID!) {
  deleteCampaign(id: $id)
}
    `;
export type DeleteCampaignMutationFn = Apollo.MutationFunction<DeleteCampaignMutation, DeleteCampaignMutationVariables>;

/**
 * __useDeleteCampaignMutation__
 *
 * To run a mutation, you first call `useDeleteCampaignMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCampaignMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCampaignMutation, { data, loading, error }] = useDeleteCampaignMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteCampaignMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCampaignMutation, DeleteCampaignMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCampaignMutation, DeleteCampaignMutationVariables>(DeleteCampaignDocument, options);
      }
export type DeleteCampaignMutationHookResult = ReturnType<typeof useDeleteCampaignMutation>;
export type DeleteCampaignMutationResult = Apollo.MutationResult<DeleteCampaignMutation>;
export type DeleteCampaignMutationOptions = Apollo.BaseMutationOptions<DeleteCampaignMutation, DeleteCampaignMutationVariables>;
export const SendCampaignDocument = gql`
    mutation SendCampaign($id: ID!, $clientIds: [ID!]!) {
  sendCampaign(id: $id, clientIds: $clientIds) {
    sent
    failed
    campaign {
      id
      lastSentAt
      recipientsCount
    }
  }
}
    `;
export type SendCampaignMutationFn = Apollo.MutationFunction<SendCampaignMutation, SendCampaignMutationVariables>;

/**
 * __useSendCampaignMutation__
 *
 * To run a mutation, you first call `useSendCampaignMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendCampaignMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendCampaignMutation, { data, loading, error }] = useSendCampaignMutation({
 *   variables: {
 *      id: // value for 'id'
 *      clientIds: // value for 'clientIds'
 *   },
 * });
 */
export function useSendCampaignMutation(baseOptions?: Apollo.MutationHookOptions<SendCampaignMutation, SendCampaignMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendCampaignMutation, SendCampaignMutationVariables>(SendCampaignDocument, options);
      }
export type SendCampaignMutationHookResult = ReturnType<typeof useSendCampaignMutation>;
export type SendCampaignMutationResult = Apollo.MutationResult<SendCampaignMutation>;
export type SendCampaignMutationOptions = Apollo.BaseMutationOptions<SendCampaignMutation, SendCampaignMutationVariables>;
export const ListProductsDocument = gql`
    query ListProducts {
  listProducts {
    id
    name
    sku
    price
    category
    stock
    status
  }
}
    `;

/**
 * __useListProductsQuery__
 *
 * To run a query within a React component, call `useListProductsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListProductsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListProductsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListProductsQuery(baseOptions?: Apollo.QueryHookOptions<ListProductsQuery, ListProductsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListProductsQuery, ListProductsQueryVariables>(ListProductsDocument, options);
      }
export function useListProductsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListProductsQuery, ListProductsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListProductsQuery, ListProductsQueryVariables>(ListProductsDocument, options);
        }
// @ts-ignore
export function useListProductsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListProductsQuery, ListProductsQueryVariables>): Apollo.UseSuspenseQueryResult<ListProductsQuery, ListProductsQueryVariables>;
export function useListProductsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProductsQuery, ListProductsQueryVariables>): Apollo.UseSuspenseQueryResult<ListProductsQuery | undefined, ListProductsQueryVariables>;
export function useListProductsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProductsQuery, ListProductsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListProductsQuery, ListProductsQueryVariables>(ListProductsDocument, options);
        }
export type ListProductsQueryHookResult = ReturnType<typeof useListProductsQuery>;
export type ListProductsLazyQueryHookResult = ReturnType<typeof useListProductsLazyQuery>;
export type ListProductsSuspenseQueryHookResult = ReturnType<typeof useListProductsSuspenseQuery>;
export type ListProductsQueryResult = Apollo.QueryResult<ListProductsQuery, ListProductsQueryVariables>;
export const ListProductsPagedDocument = gql`
    query ListProductsPaged($input: TableQueryInput!) {
  listProductsPaged(input: $input) {
    totalCount
    rows {
      id
      name
      sku
      price
      category
      stock
      status
    }
  }
}
    `;

/**
 * __useListProductsPagedQuery__
 *
 * To run a query within a React component, call `useListProductsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListProductsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListProductsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListProductsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListProductsPagedQuery, ListProductsPagedQueryVariables> & ({ variables: ListProductsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListProductsPagedQuery, ListProductsPagedQueryVariables>(ListProductsPagedDocument, options);
      }
export function useListProductsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListProductsPagedQuery, ListProductsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListProductsPagedQuery, ListProductsPagedQueryVariables>(ListProductsPagedDocument, options);
        }
// @ts-ignore
export function useListProductsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListProductsPagedQuery, ListProductsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListProductsPagedQuery, ListProductsPagedQueryVariables>;
export function useListProductsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProductsPagedQuery, ListProductsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListProductsPagedQuery | undefined, ListProductsPagedQueryVariables>;
export function useListProductsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProductsPagedQuery, ListProductsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListProductsPagedQuery, ListProductsPagedQueryVariables>(ListProductsPagedDocument, options);
        }
export type ListProductsPagedQueryHookResult = ReturnType<typeof useListProductsPagedQuery>;
export type ListProductsPagedLazyQueryHookResult = ReturnType<typeof useListProductsPagedLazyQuery>;
export type ListProductsPagedSuspenseQueryHookResult = ReturnType<typeof useListProductsPagedSuspenseQuery>;
export type ListProductsPagedQueryResult = Apollo.QueryResult<ListProductsPagedQuery, ListProductsPagedQueryVariables>;
export const ListProductsStatsDocument = gql`
    query ListProductsStats {
  listProductsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListProductsStatsQuery__
 *
 * To run a query within a React component, call `useListProductsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListProductsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListProductsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListProductsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListProductsStatsQuery, ListProductsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListProductsStatsQuery, ListProductsStatsQueryVariables>(ListProductsStatsDocument, options);
      }
export function useListProductsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListProductsStatsQuery, ListProductsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListProductsStatsQuery, ListProductsStatsQueryVariables>(ListProductsStatsDocument, options);
        }
// @ts-ignore
export function useListProductsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListProductsStatsQuery, ListProductsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListProductsStatsQuery, ListProductsStatsQueryVariables>;
export function useListProductsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProductsStatsQuery, ListProductsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListProductsStatsQuery | undefined, ListProductsStatsQueryVariables>;
export function useListProductsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProductsStatsQuery, ListProductsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListProductsStatsQuery, ListProductsStatsQueryVariables>(ListProductsStatsDocument, options);
        }
export type ListProductsStatsQueryHookResult = ReturnType<typeof useListProductsStatsQuery>;
export type ListProductsStatsLazyQueryHookResult = ReturnType<typeof useListProductsStatsLazyQuery>;
export type ListProductsStatsSuspenseQueryHookResult = ReturnType<typeof useListProductsStatsSuspenseQuery>;
export type ListProductsStatsQueryResult = Apollo.QueryResult<ListProductsStatsQuery, ListProductsStatsQueryVariables>;
export const CreateProductDocument = gql`
    mutation CreateProduct($input: ProductInput!) {
  createProduct(input: $input) {
    id
  }
}
    `;
export type CreateProductMutationFn = Apollo.MutationFunction<CreateProductMutation, CreateProductMutationVariables>;

/**
 * __useCreateProductMutation__
 *
 * To run a mutation, you first call `useCreateProductMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProductMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProductMutation, { data, loading, error }] = useCreateProductMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProductMutation(baseOptions?: Apollo.MutationHookOptions<CreateProductMutation, CreateProductMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateProductMutation, CreateProductMutationVariables>(CreateProductDocument, options);
      }
export type CreateProductMutationHookResult = ReturnType<typeof useCreateProductMutation>;
export type CreateProductMutationResult = Apollo.MutationResult<CreateProductMutation>;
export type CreateProductMutationOptions = Apollo.BaseMutationOptions<CreateProductMutation, CreateProductMutationVariables>;
export const UpdateProductDocument = gql`
    mutation UpdateProduct($id: ID!, $input: ProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateProductMutationFn = Apollo.MutationFunction<UpdateProductMutation, UpdateProductMutationVariables>;

/**
 * __useUpdateProductMutation__
 *
 * To run a mutation, you first call `useUpdateProductMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProductMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProductMutation, { data, loading, error }] = useUpdateProductMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProductMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProductMutation, UpdateProductMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateProductMutation, UpdateProductMutationVariables>(UpdateProductDocument, options);
      }
export type UpdateProductMutationHookResult = ReturnType<typeof useUpdateProductMutation>;
export type UpdateProductMutationResult = Apollo.MutationResult<UpdateProductMutation>;
export type UpdateProductMutationOptions = Apollo.BaseMutationOptions<UpdateProductMutation, UpdateProductMutationVariables>;
export const DeleteProductDocument = gql`
    mutation DeleteProduct($id: ID!) {
  deleteProduct(id: $id)
}
    `;
export type DeleteProductMutationFn = Apollo.MutationFunction<DeleteProductMutation, DeleteProductMutationVariables>;

/**
 * __useDeleteProductMutation__
 *
 * To run a mutation, you first call `useDeleteProductMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProductMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProductMutation, { data, loading, error }] = useDeleteProductMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteProductMutation(baseOptions?: Apollo.MutationHookOptions<DeleteProductMutation, DeleteProductMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteProductMutation, DeleteProductMutationVariables>(DeleteProductDocument, options);
      }
export type DeleteProductMutationHookResult = ReturnType<typeof useDeleteProductMutation>;
export type DeleteProductMutationResult = Apollo.MutationResult<DeleteProductMutation>;
export type DeleteProductMutationOptions = Apollo.BaseMutationOptions<DeleteProductMutation, DeleteProductMutationVariables>;
export const UpdateProfileDocument = gql`
    mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    id
    name
    email
    roles
    avatarUrl
  }
}
    `;
export type UpdateProfileMutationFn = Apollo.MutationFunction<UpdateProfileMutation, UpdateProfileMutationVariables>;

/**
 * __useUpdateProfileMutation__
 *
 * To run a mutation, you first call `useUpdateProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfileMutation, { data, loading, error }] = useUpdateProfileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProfileMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProfileMutation, UpdateProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateProfileMutation, UpdateProfileMutationVariables>(UpdateProfileDocument, options);
      }
export type UpdateProfileMutationHookResult = ReturnType<typeof useUpdateProfileMutation>;
export type UpdateProfileMutationResult = Apollo.MutationResult<UpdateProfileMutation>;
export type UpdateProfileMutationOptions = Apollo.BaseMutationOptions<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const ChangePasswordDocument = gql`
    mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
  changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
}
    `;
export type ChangePasswordMutationFn = Apollo.MutationFunction<ChangePasswordMutation, ChangePasswordMutationVariables>;

/**
 * __useChangePasswordMutation__
 *
 * To run a mutation, you first call `useChangePasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangePasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changePasswordMutation, { data, loading, error }] = useChangePasswordMutation({
 *   variables: {
 *      currentPassword: // value for 'currentPassword'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useChangePasswordMutation(baseOptions?: Apollo.MutationHookOptions<ChangePasswordMutation, ChangePasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ChangePasswordMutation, ChangePasswordMutationVariables>(ChangePasswordDocument, options);
      }
export type ChangePasswordMutationHookResult = ReturnType<typeof useChangePasswordMutation>;
export type ChangePasswordMutationResult = Apollo.MutationResult<ChangePasswordMutation>;
export type ChangePasswordMutationOptions = Apollo.BaseMutationOptions<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const UploadAvatarDocument = gql`
    mutation UploadAvatar($file: String!) {
  uploadAvatar(file: $file)
}
    `;
export type UploadAvatarMutationFn = Apollo.MutationFunction<UploadAvatarMutation, UploadAvatarMutationVariables>;

/**
 * __useUploadAvatarMutation__
 *
 * To run a mutation, you first call `useUploadAvatarMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadAvatarMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadAvatarMutation, { data, loading, error }] = useUploadAvatarMutation({
 *   variables: {
 *      file: // value for 'file'
 *   },
 * });
 */
export function useUploadAvatarMutation(baseOptions?: Apollo.MutationHookOptions<UploadAvatarMutation, UploadAvatarMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UploadAvatarMutation, UploadAvatarMutationVariables>(UploadAvatarDocument, options);
      }
export type UploadAvatarMutationHookResult = ReturnType<typeof useUploadAvatarMutation>;
export type UploadAvatarMutationResult = Apollo.MutationResult<UploadAvatarMutation>;
export type UploadAvatarMutationOptions = Apollo.BaseMutationOptions<UploadAvatarMutation, UploadAvatarMutationVariables>;
export const ListProjectsDocument = gql`
    query ListProjects {
  listProjects {
    id
    name
    description
    status
    startDate
    endDate
  }
}
    `;

/**
 * __useListProjectsQuery__
 *
 * To run a query within a React component, call `useListProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListProjectsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListProjectsQuery(baseOptions?: Apollo.QueryHookOptions<ListProjectsQuery, ListProjectsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListProjectsQuery, ListProjectsQueryVariables>(ListProjectsDocument, options);
      }
export function useListProjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListProjectsQuery, ListProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListProjectsQuery, ListProjectsQueryVariables>(ListProjectsDocument, options);
        }
// @ts-ignore
export function useListProjectsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListProjectsQuery, ListProjectsQueryVariables>): Apollo.UseSuspenseQueryResult<ListProjectsQuery, ListProjectsQueryVariables>;
export function useListProjectsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProjectsQuery, ListProjectsQueryVariables>): Apollo.UseSuspenseQueryResult<ListProjectsQuery | undefined, ListProjectsQueryVariables>;
export function useListProjectsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProjectsQuery, ListProjectsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListProjectsQuery, ListProjectsQueryVariables>(ListProjectsDocument, options);
        }
export type ListProjectsQueryHookResult = ReturnType<typeof useListProjectsQuery>;
export type ListProjectsLazyQueryHookResult = ReturnType<typeof useListProjectsLazyQuery>;
export type ListProjectsSuspenseQueryHookResult = ReturnType<typeof useListProjectsSuspenseQuery>;
export type ListProjectsQueryResult = Apollo.QueryResult<ListProjectsQuery, ListProjectsQueryVariables>;
export const ListProjectsPagedDocument = gql`
    query ListProjectsPaged($input: TableQueryInput!) {
  listProjectsPaged(input: $input) {
    totalCount
    rows {
      id
      name
      description
      status
      startDate
      endDate
    }
  }
}
    `;

/**
 * __useListProjectsPagedQuery__
 *
 * To run a query within a React component, call `useListProjectsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListProjectsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListProjectsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListProjectsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListProjectsPagedQuery, ListProjectsPagedQueryVariables> & ({ variables: ListProjectsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>(ListProjectsPagedDocument, options);
      }
export function useListProjectsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>(ListProjectsPagedDocument, options);
        }
// @ts-ignore
export function useListProjectsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>;
export function useListProjectsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListProjectsPagedQuery | undefined, ListProjectsPagedQueryVariables>;
export function useListProjectsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>(ListProjectsPagedDocument, options);
        }
export type ListProjectsPagedQueryHookResult = ReturnType<typeof useListProjectsPagedQuery>;
export type ListProjectsPagedLazyQueryHookResult = ReturnType<typeof useListProjectsPagedLazyQuery>;
export type ListProjectsPagedSuspenseQueryHookResult = ReturnType<typeof useListProjectsPagedSuspenseQuery>;
export type ListProjectsPagedQueryResult = Apollo.QueryResult<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>;
export const ListProjectsStatsDocument = gql`
    query ListProjectsStats {
  listProjectsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListProjectsStatsQuery__
 *
 * To run a query within a React component, call `useListProjectsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListProjectsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListProjectsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListProjectsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>(ListProjectsStatsDocument, options);
      }
export function useListProjectsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>(ListProjectsStatsDocument, options);
        }
// @ts-ignore
export function useListProjectsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>;
export function useListProjectsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListProjectsStatsQuery | undefined, ListProjectsStatsQueryVariables>;
export function useListProjectsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>(ListProjectsStatsDocument, options);
        }
export type ListProjectsStatsQueryHookResult = ReturnType<typeof useListProjectsStatsQuery>;
export type ListProjectsStatsLazyQueryHookResult = ReturnType<typeof useListProjectsStatsLazyQuery>;
export type ListProjectsStatsSuspenseQueryHookResult = ReturnType<typeof useListProjectsStatsSuspenseQuery>;
export type ListProjectsStatsQueryResult = Apollo.QueryResult<ListProjectsStatsQuery, ListProjectsStatsQueryVariables>;
export const CreateProjectDocument = gql`
    mutation CreateProject($input: ProjectInput!) {
  createProject(input: $input) {
    id
  }
}
    `;
export type CreateProjectMutationFn = Apollo.MutationFunction<CreateProjectMutation, CreateProjectMutationVariables>;

/**
 * __useCreateProjectMutation__
 *
 * To run a mutation, you first call `useCreateProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProjectMutation, { data, loading, error }] = useCreateProjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProjectMutation(baseOptions?: Apollo.MutationHookOptions<CreateProjectMutation, CreateProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateProjectMutation, CreateProjectMutationVariables>(CreateProjectDocument, options);
      }
export type CreateProjectMutationHookResult = ReturnType<typeof useCreateProjectMutation>;
export type CreateProjectMutationResult = Apollo.MutationResult<CreateProjectMutation>;
export type CreateProjectMutationOptions = Apollo.BaseMutationOptions<CreateProjectMutation, CreateProjectMutationVariables>;
export const UpdateProjectDocument = gql`
    mutation UpdateProject($id: ID!, $input: ProjectInput!) {
  updateProject(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateProjectMutationFn = Apollo.MutationFunction<UpdateProjectMutation, UpdateProjectMutationVariables>;

/**
 * __useUpdateProjectMutation__
 *
 * To run a mutation, you first call `useUpdateProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProjectMutation, { data, loading, error }] = useUpdateProjectMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProjectMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProjectMutation, UpdateProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateProjectMutation, UpdateProjectMutationVariables>(UpdateProjectDocument, options);
      }
export type UpdateProjectMutationHookResult = ReturnType<typeof useUpdateProjectMutation>;
export type UpdateProjectMutationResult = Apollo.MutationResult<UpdateProjectMutation>;
export type UpdateProjectMutationOptions = Apollo.BaseMutationOptions<UpdateProjectMutation, UpdateProjectMutationVariables>;
export const DeleteProjectDocument = gql`
    mutation DeleteProject($id: ID!) {
  deleteProject(id: $id)
}
    `;
export type DeleteProjectMutationFn = Apollo.MutationFunction<DeleteProjectMutation, DeleteProjectMutationVariables>;

/**
 * __useDeleteProjectMutation__
 *
 * To run a mutation, you first call `useDeleteProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProjectMutation, { data, loading, error }] = useDeleteProjectMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteProjectMutation(baseOptions?: Apollo.MutationHookOptions<DeleteProjectMutation, DeleteProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteProjectMutation, DeleteProjectMutationVariables>(DeleteProjectDocument, options);
      }
export type DeleteProjectMutationHookResult = ReturnType<typeof useDeleteProjectMutation>;
export type DeleteProjectMutationResult = Apollo.MutationResult<DeleteProjectMutation>;
export type DeleteProjectMutationOptions = Apollo.BaseMutationOptions<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const ListSupportTicketsDocument = gql`
    query ListSupportTickets {
  listSupportTickets {
    id
    employeeName
    subject
    category
    description
    priority
    status
    createdAt
  }
}
    `;

/**
 * __useListSupportTicketsQuery__
 *
 * To run a query within a React component, call `useListSupportTicketsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListSupportTicketsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListSupportTicketsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListSupportTicketsQuery(baseOptions?: Apollo.QueryHookOptions<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>(ListSupportTicketsDocument, options);
      }
export function useListSupportTicketsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>(ListSupportTicketsDocument, options);
        }
// @ts-ignore
export function useListSupportTicketsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>): Apollo.UseSuspenseQueryResult<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>;
export function useListSupportTicketsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>): Apollo.UseSuspenseQueryResult<ListSupportTicketsQuery | undefined, ListSupportTicketsQueryVariables>;
export function useListSupportTicketsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>(ListSupportTicketsDocument, options);
        }
export type ListSupportTicketsQueryHookResult = ReturnType<typeof useListSupportTicketsQuery>;
export type ListSupportTicketsLazyQueryHookResult = ReturnType<typeof useListSupportTicketsLazyQuery>;
export type ListSupportTicketsSuspenseQueryHookResult = ReturnType<typeof useListSupportTicketsSuspenseQuery>;
export type ListSupportTicketsQueryResult = Apollo.QueryResult<ListSupportTicketsQuery, ListSupportTicketsQueryVariables>;
export const SetSupportTicketStatusDocument = gql`
    mutation SetSupportTicketStatus($id: ID!, $status: SupportStatus!) {
  setSupportTicketStatus(id: $id, status: $status) {
    id
    status
  }
}
    `;
export type SetSupportTicketStatusMutationFn = Apollo.MutationFunction<SetSupportTicketStatusMutation, SetSupportTicketStatusMutationVariables>;

/**
 * __useSetSupportTicketStatusMutation__
 *
 * To run a mutation, you first call `useSetSupportTicketStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetSupportTicketStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setSupportTicketStatusMutation, { data, loading, error }] = useSetSupportTicketStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useSetSupportTicketStatusMutation(baseOptions?: Apollo.MutationHookOptions<SetSupportTicketStatusMutation, SetSupportTicketStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetSupportTicketStatusMutation, SetSupportTicketStatusMutationVariables>(SetSupportTicketStatusDocument, options);
      }
export type SetSupportTicketStatusMutationHookResult = ReturnType<typeof useSetSupportTicketStatusMutation>;
export type SetSupportTicketStatusMutationResult = Apollo.MutationResult<SetSupportTicketStatusMutation>;
export type SetSupportTicketStatusMutationOptions = Apollo.BaseMutationOptions<SetSupportTicketStatusMutation, SetSupportTicketStatusMutationVariables>;
export const ListEmailConfigsDocument = gql`
    query ListEmailConfigs {
  listEmailConfigs {
    id
    label
    host
    port
    secure
    username
    password
    fromAddress
    isActive
  }
}
    `;

/**
 * __useListEmailConfigsQuery__
 *
 * To run a query within a React component, call `useListEmailConfigsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListEmailConfigsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListEmailConfigsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListEmailConfigsQuery(baseOptions?: Apollo.QueryHookOptions<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>(ListEmailConfigsDocument, options);
      }
export function useListEmailConfigsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>(ListEmailConfigsDocument, options);
        }
// @ts-ignore
export function useListEmailConfigsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>): Apollo.UseSuspenseQueryResult<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>;
export function useListEmailConfigsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>): Apollo.UseSuspenseQueryResult<ListEmailConfigsQuery | undefined, ListEmailConfigsQueryVariables>;
export function useListEmailConfigsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>(ListEmailConfigsDocument, options);
        }
export type ListEmailConfigsQueryHookResult = ReturnType<typeof useListEmailConfigsQuery>;
export type ListEmailConfigsLazyQueryHookResult = ReturnType<typeof useListEmailConfigsLazyQuery>;
export type ListEmailConfigsSuspenseQueryHookResult = ReturnType<typeof useListEmailConfigsSuspenseQuery>;
export type ListEmailConfigsQueryResult = Apollo.QueryResult<ListEmailConfigsQuery, ListEmailConfigsQueryVariables>;
export const CreateEmailConfigDocument = gql`
    mutation CreateEmailConfig($input: EmailConfigInput!) {
  createEmailConfig(input: $input) {
    id
  }
}
    `;
export type CreateEmailConfigMutationFn = Apollo.MutationFunction<CreateEmailConfigMutation, CreateEmailConfigMutationVariables>;

/**
 * __useCreateEmailConfigMutation__
 *
 * To run a mutation, you first call `useCreateEmailConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateEmailConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createEmailConfigMutation, { data, loading, error }] = useCreateEmailConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateEmailConfigMutation(baseOptions?: Apollo.MutationHookOptions<CreateEmailConfigMutation, CreateEmailConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateEmailConfigMutation, CreateEmailConfigMutationVariables>(CreateEmailConfigDocument, options);
      }
export type CreateEmailConfigMutationHookResult = ReturnType<typeof useCreateEmailConfigMutation>;
export type CreateEmailConfigMutationResult = Apollo.MutationResult<CreateEmailConfigMutation>;
export type CreateEmailConfigMutationOptions = Apollo.BaseMutationOptions<CreateEmailConfigMutation, CreateEmailConfigMutationVariables>;
export const UpdateEmailConfigDocument = gql`
    mutation UpdateEmailConfig($id: ID!, $input: EmailConfigInput!) {
  updateEmailConfig(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateEmailConfigMutationFn = Apollo.MutationFunction<UpdateEmailConfigMutation, UpdateEmailConfigMutationVariables>;

/**
 * __useUpdateEmailConfigMutation__
 *
 * To run a mutation, you first call `useUpdateEmailConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateEmailConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateEmailConfigMutation, { data, loading, error }] = useUpdateEmailConfigMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateEmailConfigMutation(baseOptions?: Apollo.MutationHookOptions<UpdateEmailConfigMutation, UpdateEmailConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateEmailConfigMutation, UpdateEmailConfigMutationVariables>(UpdateEmailConfigDocument, options);
      }
export type UpdateEmailConfigMutationHookResult = ReturnType<typeof useUpdateEmailConfigMutation>;
export type UpdateEmailConfigMutationResult = Apollo.MutationResult<UpdateEmailConfigMutation>;
export type UpdateEmailConfigMutationOptions = Apollo.BaseMutationOptions<UpdateEmailConfigMutation, UpdateEmailConfigMutationVariables>;
export const DeleteEmailConfigDocument = gql`
    mutation DeleteEmailConfig($id: ID!) {
  deleteEmailConfig(id: $id)
}
    `;
export type DeleteEmailConfigMutationFn = Apollo.MutationFunction<DeleteEmailConfigMutation, DeleteEmailConfigMutationVariables>;

/**
 * __useDeleteEmailConfigMutation__
 *
 * To run a mutation, you first call `useDeleteEmailConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteEmailConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteEmailConfigMutation, { data, loading, error }] = useDeleteEmailConfigMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteEmailConfigMutation(baseOptions?: Apollo.MutationHookOptions<DeleteEmailConfigMutation, DeleteEmailConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteEmailConfigMutation, DeleteEmailConfigMutationVariables>(DeleteEmailConfigDocument, options);
      }
export type DeleteEmailConfigMutationHookResult = ReturnType<typeof useDeleteEmailConfigMutation>;
export type DeleteEmailConfigMutationResult = Apollo.MutationResult<DeleteEmailConfigMutation>;
export type DeleteEmailConfigMutationOptions = Apollo.BaseMutationOptions<DeleteEmailConfigMutation, DeleteEmailConfigMutationVariables>;
export const ListImageConfigsDocument = gql`
    query ListImageConfigs {
  listImageConfigs {
    id
    label
    provider
    publicKey
    privateKey
    urlEndpoint
    isActive
  }
}
    `;

/**
 * __useListImageConfigsQuery__
 *
 * To run a query within a React component, call `useListImageConfigsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListImageConfigsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListImageConfigsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListImageConfigsQuery(baseOptions?: Apollo.QueryHookOptions<ListImageConfigsQuery, ListImageConfigsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListImageConfigsQuery, ListImageConfigsQueryVariables>(ListImageConfigsDocument, options);
      }
export function useListImageConfigsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListImageConfigsQuery, ListImageConfigsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListImageConfigsQuery, ListImageConfigsQueryVariables>(ListImageConfigsDocument, options);
        }
// @ts-ignore
export function useListImageConfigsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListImageConfigsQuery, ListImageConfigsQueryVariables>): Apollo.UseSuspenseQueryResult<ListImageConfigsQuery, ListImageConfigsQueryVariables>;
export function useListImageConfigsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListImageConfigsQuery, ListImageConfigsQueryVariables>): Apollo.UseSuspenseQueryResult<ListImageConfigsQuery | undefined, ListImageConfigsQueryVariables>;
export function useListImageConfigsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListImageConfigsQuery, ListImageConfigsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListImageConfigsQuery, ListImageConfigsQueryVariables>(ListImageConfigsDocument, options);
        }
export type ListImageConfigsQueryHookResult = ReturnType<typeof useListImageConfigsQuery>;
export type ListImageConfigsLazyQueryHookResult = ReturnType<typeof useListImageConfigsLazyQuery>;
export type ListImageConfigsSuspenseQueryHookResult = ReturnType<typeof useListImageConfigsSuspenseQuery>;
export type ListImageConfigsQueryResult = Apollo.QueryResult<ListImageConfigsQuery, ListImageConfigsQueryVariables>;
export const CreateImageConfigDocument = gql`
    mutation CreateImageConfig($input: ImageConfigInput!) {
  createImageConfig(input: $input) {
    id
  }
}
    `;
export type CreateImageConfigMutationFn = Apollo.MutationFunction<CreateImageConfigMutation, CreateImageConfigMutationVariables>;

/**
 * __useCreateImageConfigMutation__
 *
 * To run a mutation, you first call `useCreateImageConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateImageConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createImageConfigMutation, { data, loading, error }] = useCreateImageConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateImageConfigMutation(baseOptions?: Apollo.MutationHookOptions<CreateImageConfigMutation, CreateImageConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateImageConfigMutation, CreateImageConfigMutationVariables>(CreateImageConfigDocument, options);
      }
export type CreateImageConfigMutationHookResult = ReturnType<typeof useCreateImageConfigMutation>;
export type CreateImageConfigMutationResult = Apollo.MutationResult<CreateImageConfigMutation>;
export type CreateImageConfigMutationOptions = Apollo.BaseMutationOptions<CreateImageConfigMutation, CreateImageConfigMutationVariables>;
export const UpdateImageConfigDocument = gql`
    mutation UpdateImageConfig($id: ID!, $input: ImageConfigInput!) {
  updateImageConfig(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateImageConfigMutationFn = Apollo.MutationFunction<UpdateImageConfigMutation, UpdateImageConfigMutationVariables>;

/**
 * __useUpdateImageConfigMutation__
 *
 * To run a mutation, you first call `useUpdateImageConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateImageConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateImageConfigMutation, { data, loading, error }] = useUpdateImageConfigMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateImageConfigMutation(baseOptions?: Apollo.MutationHookOptions<UpdateImageConfigMutation, UpdateImageConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateImageConfigMutation, UpdateImageConfigMutationVariables>(UpdateImageConfigDocument, options);
      }
export type UpdateImageConfigMutationHookResult = ReturnType<typeof useUpdateImageConfigMutation>;
export type UpdateImageConfigMutationResult = Apollo.MutationResult<UpdateImageConfigMutation>;
export type UpdateImageConfigMutationOptions = Apollo.BaseMutationOptions<UpdateImageConfigMutation, UpdateImageConfigMutationVariables>;
export const DeleteImageConfigDocument = gql`
    mutation DeleteImageConfig($id: ID!) {
  deleteImageConfig(id: $id)
}
    `;
export type DeleteImageConfigMutationFn = Apollo.MutationFunction<DeleteImageConfigMutation, DeleteImageConfigMutationVariables>;

/**
 * __useDeleteImageConfigMutation__
 *
 * To run a mutation, you first call `useDeleteImageConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteImageConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteImageConfigMutation, { data, loading, error }] = useDeleteImageConfigMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteImageConfigMutation(baseOptions?: Apollo.MutationHookOptions<DeleteImageConfigMutation, DeleteImageConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteImageConfigMutation, DeleteImageConfigMutationVariables>(DeleteImageConfigDocument, options);
      }
export type DeleteImageConfigMutationHookResult = ReturnType<typeof useDeleteImageConfigMutation>;
export type DeleteImageConfigMutationResult = Apollo.MutationResult<DeleteImageConfigMutation>;
export type DeleteImageConfigMutationOptions = Apollo.BaseMutationOptions<DeleteImageConfigMutation, DeleteImageConfigMutationVariables>;
export const SendTestEmailDocument = gql`
    mutation SendTestEmail($id: ID!, $to: String!) {
  sendTestEmail(id: $id, to: $to)
}
    `;
export type SendTestEmailMutationFn = Apollo.MutationFunction<SendTestEmailMutation, SendTestEmailMutationVariables>;

/**
 * __useSendTestEmailMutation__
 *
 * To run a mutation, you first call `useSendTestEmailMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendTestEmailMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendTestEmailMutation, { data, loading, error }] = useSendTestEmailMutation({
 *   variables: {
 *      id: // value for 'id'
 *      to: // value for 'to'
 *   },
 * });
 */
export function useSendTestEmailMutation(baseOptions?: Apollo.MutationHookOptions<SendTestEmailMutation, SendTestEmailMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendTestEmailMutation, SendTestEmailMutationVariables>(SendTestEmailDocument, options);
      }
export type SendTestEmailMutationHookResult = ReturnType<typeof useSendTestEmailMutation>;
export type SendTestEmailMutationResult = Apollo.MutationResult<SendTestEmailMutation>;
export type SendTestEmailMutationOptions = Apollo.BaseMutationOptions<SendTestEmailMutation, SendTestEmailMutationVariables>;
export const TestImageUploadDocument = gql`
    mutation TestImageUpload($id: ID!, $file: String!, $fileName: String!) {
  testImageUpload(id: $id, file: $file, fileName: $fileName)
}
    `;
export type TestImageUploadMutationFn = Apollo.MutationFunction<TestImageUploadMutation, TestImageUploadMutationVariables>;

/**
 * __useTestImageUploadMutation__
 *
 * To run a mutation, you first call `useTestImageUploadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTestImageUploadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [testImageUploadMutation, { data, loading, error }] = useTestImageUploadMutation({
 *   variables: {
 *      id: // value for 'id'
 *      file: // value for 'file'
 *      fileName: // value for 'fileName'
 *   },
 * });
 */
export function useTestImageUploadMutation(baseOptions?: Apollo.MutationHookOptions<TestImageUploadMutation, TestImageUploadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TestImageUploadMutation, TestImageUploadMutationVariables>(TestImageUploadDocument, options);
      }
export type TestImageUploadMutationHookResult = ReturnType<typeof useTestImageUploadMutation>;
export type TestImageUploadMutationResult = Apollo.MutationResult<TestImageUploadMutation>;
export type TestImageUploadMutationOptions = Apollo.BaseMutationOptions<TestImageUploadMutation, TestImageUploadMutationVariables>;
export const TrackerAccessListDocument = gql`
    query TrackerAccessList {
  trackerAccessList {
    ...TrackerAccessFields
  }
}
    ${TrackerAccessFieldsFragmentDoc}`;

/**
 * __useTrackerAccessListQuery__
 *
 * To run a query within a React component, call `useTrackerAccessListQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrackerAccessListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrackerAccessListQuery({
 *   variables: {
 *   },
 * });
 */
export function useTrackerAccessListQuery(baseOptions?: Apollo.QueryHookOptions<TrackerAccessListQuery, TrackerAccessListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TrackerAccessListQuery, TrackerAccessListQueryVariables>(TrackerAccessListDocument, options);
      }
export function useTrackerAccessListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TrackerAccessListQuery, TrackerAccessListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TrackerAccessListQuery, TrackerAccessListQueryVariables>(TrackerAccessListDocument, options);
        }
// @ts-ignore
export function useTrackerAccessListSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TrackerAccessListQuery, TrackerAccessListQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerAccessListQuery, TrackerAccessListQueryVariables>;
export function useTrackerAccessListSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerAccessListQuery, TrackerAccessListQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerAccessListQuery | undefined, TrackerAccessListQueryVariables>;
export function useTrackerAccessListSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerAccessListQuery, TrackerAccessListQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TrackerAccessListQuery, TrackerAccessListQueryVariables>(TrackerAccessListDocument, options);
        }
export type TrackerAccessListQueryHookResult = ReturnType<typeof useTrackerAccessListQuery>;
export type TrackerAccessListLazyQueryHookResult = ReturnType<typeof useTrackerAccessListLazyQuery>;
export type TrackerAccessListSuspenseQueryHookResult = ReturnType<typeof useTrackerAccessListSuspenseQuery>;
export type TrackerAccessListQueryResult = Apollo.QueryResult<TrackerAccessListQuery, TrackerAccessListQueryVariables>;
export const TrackerDevicesDocument = gql`
    query TrackerDevices($userId: ID) {
  trackerDevices(userId: $userId) {
    ...TrackerDeviceFields
  }
}
    ${TrackerDeviceFieldsFragmentDoc}`;

/**
 * __useTrackerDevicesQuery__
 *
 * To run a query within a React component, call `useTrackerDevicesQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrackerDevicesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrackerDevicesQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useTrackerDevicesQuery(baseOptions?: Apollo.QueryHookOptions<TrackerDevicesQuery, TrackerDevicesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TrackerDevicesQuery, TrackerDevicesQueryVariables>(TrackerDevicesDocument, options);
      }
export function useTrackerDevicesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TrackerDevicesQuery, TrackerDevicesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TrackerDevicesQuery, TrackerDevicesQueryVariables>(TrackerDevicesDocument, options);
        }
// @ts-ignore
export function useTrackerDevicesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TrackerDevicesQuery, TrackerDevicesQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerDevicesQuery, TrackerDevicesQueryVariables>;
export function useTrackerDevicesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerDevicesQuery, TrackerDevicesQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerDevicesQuery | undefined, TrackerDevicesQueryVariables>;
export function useTrackerDevicesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerDevicesQuery, TrackerDevicesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TrackerDevicesQuery, TrackerDevicesQueryVariables>(TrackerDevicesDocument, options);
        }
export type TrackerDevicesQueryHookResult = ReturnType<typeof useTrackerDevicesQuery>;
export type TrackerDevicesLazyQueryHookResult = ReturnType<typeof useTrackerDevicesLazyQuery>;
export type TrackerDevicesSuspenseQueryHookResult = ReturnType<typeof useTrackerDevicesSuspenseQuery>;
export type TrackerDevicesQueryResult = Apollo.QueryResult<TrackerDevicesQuery, TrackerDevicesQueryVariables>;
export const TrackerSettingsDocument = gql`
    query TrackerSettings {
  trackerSettings {
    ...TrackerSettingsFields
  }
}
    ${TrackerSettingsFieldsFragmentDoc}`;

/**
 * __useTrackerSettingsQuery__
 *
 * To run a query within a React component, call `useTrackerSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrackerSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrackerSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useTrackerSettingsQuery(baseOptions?: Apollo.QueryHookOptions<TrackerSettingsQuery, TrackerSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TrackerSettingsQuery, TrackerSettingsQueryVariables>(TrackerSettingsDocument, options);
      }
export function useTrackerSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TrackerSettingsQuery, TrackerSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TrackerSettingsQuery, TrackerSettingsQueryVariables>(TrackerSettingsDocument, options);
        }
// @ts-ignore
export function useTrackerSettingsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TrackerSettingsQuery, TrackerSettingsQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerSettingsQuery, TrackerSettingsQueryVariables>;
export function useTrackerSettingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerSettingsQuery, TrackerSettingsQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerSettingsQuery | undefined, TrackerSettingsQueryVariables>;
export function useTrackerSettingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerSettingsQuery, TrackerSettingsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TrackerSettingsQuery, TrackerSettingsQueryVariables>(TrackerSettingsDocument, options);
        }
export type TrackerSettingsQueryHookResult = ReturnType<typeof useTrackerSettingsQuery>;
export type TrackerSettingsLazyQueryHookResult = ReturnType<typeof useTrackerSettingsLazyQuery>;
export type TrackerSettingsSuspenseQueryHookResult = ReturnType<typeof useTrackerSettingsSuspenseQuery>;
export type TrackerSettingsQueryResult = Apollo.QueryResult<TrackerSettingsQuery, TrackerSettingsQueryVariables>;
export const TrackerCalendarDocument = gql`
    query TrackerCalendar($userId: ID!, $from: DateTime!, $to: DateTime!, $timezone: String!) {
  trackerCalendar(userId: $userId, from: $from, to: $to, timezone: $timezone) {
    ...TrackerDayBucketFields
  }
}
    ${TrackerDayBucketFieldsFragmentDoc}`;

/**
 * __useTrackerCalendarQuery__
 *
 * To run a query within a React component, call `useTrackerCalendarQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrackerCalendarQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrackerCalendarQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      from: // value for 'from'
 *      to: // value for 'to'
 *      timezone: // value for 'timezone'
 *   },
 * });
 */
export function useTrackerCalendarQuery(baseOptions: Apollo.QueryHookOptions<TrackerCalendarQuery, TrackerCalendarQueryVariables> & ({ variables: TrackerCalendarQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TrackerCalendarQuery, TrackerCalendarQueryVariables>(TrackerCalendarDocument, options);
      }
export function useTrackerCalendarLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TrackerCalendarQuery, TrackerCalendarQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TrackerCalendarQuery, TrackerCalendarQueryVariables>(TrackerCalendarDocument, options);
        }
// @ts-ignore
export function useTrackerCalendarSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TrackerCalendarQuery, TrackerCalendarQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerCalendarQuery, TrackerCalendarQueryVariables>;
export function useTrackerCalendarSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerCalendarQuery, TrackerCalendarQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerCalendarQuery | undefined, TrackerCalendarQueryVariables>;
export function useTrackerCalendarSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerCalendarQuery, TrackerCalendarQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TrackerCalendarQuery, TrackerCalendarQueryVariables>(TrackerCalendarDocument, options);
        }
export type TrackerCalendarQueryHookResult = ReturnType<typeof useTrackerCalendarQuery>;
export type TrackerCalendarLazyQueryHookResult = ReturnType<typeof useTrackerCalendarLazyQuery>;
export type TrackerCalendarSuspenseQueryHookResult = ReturnType<typeof useTrackerCalendarSuspenseQuery>;
export type TrackerCalendarQueryResult = Apollo.QueryResult<TrackerCalendarQuery, TrackerCalendarQueryVariables>;
export const TrackerDayDocument = gql`
    query TrackerDay($userId: ID!, $start: DateTime!, $end: DateTime!) {
  trackerDay(userId: $userId, start: $start, end: $end) {
    ...TrackerDayFields
  }
}
    ${TrackerDayFieldsFragmentDoc}`;

/**
 * __useTrackerDayQuery__
 *
 * To run a query within a React component, call `useTrackerDayQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrackerDayQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrackerDayQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      start: // value for 'start'
 *      end: // value for 'end'
 *   },
 * });
 */
export function useTrackerDayQuery(baseOptions: Apollo.QueryHookOptions<TrackerDayQuery, TrackerDayQueryVariables> & ({ variables: TrackerDayQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TrackerDayQuery, TrackerDayQueryVariables>(TrackerDayDocument, options);
      }
export function useTrackerDayLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TrackerDayQuery, TrackerDayQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TrackerDayQuery, TrackerDayQueryVariables>(TrackerDayDocument, options);
        }
// @ts-ignore
export function useTrackerDaySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TrackerDayQuery, TrackerDayQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerDayQuery, TrackerDayQueryVariables>;
export function useTrackerDaySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerDayQuery, TrackerDayQueryVariables>): Apollo.UseSuspenseQueryResult<TrackerDayQuery | undefined, TrackerDayQueryVariables>;
export function useTrackerDaySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrackerDayQuery, TrackerDayQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TrackerDayQuery, TrackerDayQueryVariables>(TrackerDayDocument, options);
        }
export type TrackerDayQueryHookResult = ReturnType<typeof useTrackerDayQuery>;
export type TrackerDayLazyQueryHookResult = ReturnType<typeof useTrackerDayLazyQuery>;
export type TrackerDaySuspenseQueryHookResult = ReturnType<typeof useTrackerDaySuspenseQuery>;
export type TrackerDayQueryResult = Apollo.QueryResult<TrackerDayQuery, TrackerDayQueryVariables>;
export const MyTrackerAccessDocument = gql`
    query MyTrackerAccess {
  myTrackerAccess {
    ...TrackerAccessFields
  }
}
    ${TrackerAccessFieldsFragmentDoc}`;

/**
 * __useMyTrackerAccessQuery__
 *
 * To run a query within a React component, call `useMyTrackerAccessQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyTrackerAccessQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyTrackerAccessQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyTrackerAccessQuery(baseOptions?: Apollo.QueryHookOptions<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>(MyTrackerAccessDocument, options);
      }
export function useMyTrackerAccessLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>(MyTrackerAccessDocument, options);
        }
// @ts-ignore
export function useMyTrackerAccessSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>): Apollo.UseSuspenseQueryResult<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>;
export function useMyTrackerAccessSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>): Apollo.UseSuspenseQueryResult<MyTrackerAccessQuery | undefined, MyTrackerAccessQueryVariables>;
export function useMyTrackerAccessSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>(MyTrackerAccessDocument, options);
        }
export type MyTrackerAccessQueryHookResult = ReturnType<typeof useMyTrackerAccessQuery>;
export type MyTrackerAccessLazyQueryHookResult = ReturnType<typeof useMyTrackerAccessLazyQuery>;
export type MyTrackerAccessSuspenseQueryHookResult = ReturnType<typeof useMyTrackerAccessSuspenseQuery>;
export type MyTrackerAccessQueryResult = Apollo.QueryResult<MyTrackerAccessQuery, MyTrackerAccessQueryVariables>;
export const MyTrackerCalendarDocument = gql`
    query MyTrackerCalendar($from: DateTime!, $to: DateTime!, $timezone: String!) {
  myTrackerCalendar(from: $from, to: $to, timezone: $timezone) {
    ...TrackerDayBucketFields
  }
}
    ${TrackerDayBucketFieldsFragmentDoc}`;

/**
 * __useMyTrackerCalendarQuery__
 *
 * To run a query within a React component, call `useMyTrackerCalendarQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyTrackerCalendarQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyTrackerCalendarQuery({
 *   variables: {
 *      from: // value for 'from'
 *      to: // value for 'to'
 *      timezone: // value for 'timezone'
 *   },
 * });
 */
export function useMyTrackerCalendarQuery(baseOptions: Apollo.QueryHookOptions<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables> & ({ variables: MyTrackerCalendarQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>(MyTrackerCalendarDocument, options);
      }
export function useMyTrackerCalendarLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>(MyTrackerCalendarDocument, options);
        }
// @ts-ignore
export function useMyTrackerCalendarSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>): Apollo.UseSuspenseQueryResult<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>;
export function useMyTrackerCalendarSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>): Apollo.UseSuspenseQueryResult<MyTrackerCalendarQuery | undefined, MyTrackerCalendarQueryVariables>;
export function useMyTrackerCalendarSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>(MyTrackerCalendarDocument, options);
        }
export type MyTrackerCalendarQueryHookResult = ReturnType<typeof useMyTrackerCalendarQuery>;
export type MyTrackerCalendarLazyQueryHookResult = ReturnType<typeof useMyTrackerCalendarLazyQuery>;
export type MyTrackerCalendarSuspenseQueryHookResult = ReturnType<typeof useMyTrackerCalendarSuspenseQuery>;
export type MyTrackerCalendarQueryResult = Apollo.QueryResult<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>;
export const MyTrackerDayDocument = gql`
    query MyTrackerDay($start: DateTime!, $end: DateTime!) {
  myTrackerDay(start: $start, end: $end) {
    ...TrackerDayFields
  }
}
    ${TrackerDayFieldsFragmentDoc}`;

/**
 * __useMyTrackerDayQuery__
 *
 * To run a query within a React component, call `useMyTrackerDayQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyTrackerDayQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyTrackerDayQuery({
 *   variables: {
 *      start: // value for 'start'
 *      end: // value for 'end'
 *   },
 * });
 */
export function useMyTrackerDayQuery(baseOptions: Apollo.QueryHookOptions<MyTrackerDayQuery, MyTrackerDayQueryVariables> & ({ variables: MyTrackerDayQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyTrackerDayQuery, MyTrackerDayQueryVariables>(MyTrackerDayDocument, options);
      }
export function useMyTrackerDayLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyTrackerDayQuery, MyTrackerDayQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyTrackerDayQuery, MyTrackerDayQueryVariables>(MyTrackerDayDocument, options);
        }
// @ts-ignore
export function useMyTrackerDaySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyTrackerDayQuery, MyTrackerDayQueryVariables>): Apollo.UseSuspenseQueryResult<MyTrackerDayQuery, MyTrackerDayQueryVariables>;
export function useMyTrackerDaySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyTrackerDayQuery, MyTrackerDayQueryVariables>): Apollo.UseSuspenseQueryResult<MyTrackerDayQuery | undefined, MyTrackerDayQueryVariables>;
export function useMyTrackerDaySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyTrackerDayQuery, MyTrackerDayQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyTrackerDayQuery, MyTrackerDayQueryVariables>(MyTrackerDayDocument, options);
        }
export type MyTrackerDayQueryHookResult = ReturnType<typeof useMyTrackerDayQuery>;
export type MyTrackerDayLazyQueryHookResult = ReturnType<typeof useMyTrackerDayLazyQuery>;
export type MyTrackerDaySuspenseQueryHookResult = ReturnType<typeof useMyTrackerDaySuspenseQuery>;
export type MyTrackerDayQueryResult = Apollo.QueryResult<MyTrackerDayQuery, MyTrackerDayQueryVariables>;
export const GrantTrackerAccessDocument = gql`
    mutation GrantTrackerAccess($userId: ID!) {
  grantTrackerAccess(userId: $userId) {
    ...TrackerAccessFields
  }
}
    ${TrackerAccessFieldsFragmentDoc}`;
export type GrantTrackerAccessMutationFn = Apollo.MutationFunction<GrantTrackerAccessMutation, GrantTrackerAccessMutationVariables>;

/**
 * __useGrantTrackerAccessMutation__
 *
 * To run a mutation, you first call `useGrantTrackerAccessMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGrantTrackerAccessMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [grantTrackerAccessMutation, { data, loading, error }] = useGrantTrackerAccessMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGrantTrackerAccessMutation(baseOptions?: Apollo.MutationHookOptions<GrantTrackerAccessMutation, GrantTrackerAccessMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GrantTrackerAccessMutation, GrantTrackerAccessMutationVariables>(GrantTrackerAccessDocument, options);
      }
export type GrantTrackerAccessMutationHookResult = ReturnType<typeof useGrantTrackerAccessMutation>;
export type GrantTrackerAccessMutationResult = Apollo.MutationResult<GrantTrackerAccessMutation>;
export type GrantTrackerAccessMutationOptions = Apollo.BaseMutationOptions<GrantTrackerAccessMutation, GrantTrackerAccessMutationVariables>;
export const RevokeTrackerAccessDocument = gql`
    mutation RevokeTrackerAccess($userId: ID!) {
  revokeTrackerAccess(userId: $userId) {
    ...TrackerAccessFields
  }
}
    ${TrackerAccessFieldsFragmentDoc}`;
export type RevokeTrackerAccessMutationFn = Apollo.MutationFunction<RevokeTrackerAccessMutation, RevokeTrackerAccessMutationVariables>;

/**
 * __useRevokeTrackerAccessMutation__
 *
 * To run a mutation, you first call `useRevokeTrackerAccessMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRevokeTrackerAccessMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [revokeTrackerAccessMutation, { data, loading, error }] = useRevokeTrackerAccessMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useRevokeTrackerAccessMutation(baseOptions?: Apollo.MutationHookOptions<RevokeTrackerAccessMutation, RevokeTrackerAccessMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RevokeTrackerAccessMutation, RevokeTrackerAccessMutationVariables>(RevokeTrackerAccessDocument, options);
      }
export type RevokeTrackerAccessMutationHookResult = ReturnType<typeof useRevokeTrackerAccessMutation>;
export type RevokeTrackerAccessMutationResult = Apollo.MutationResult<RevokeTrackerAccessMutation>;
export type RevokeTrackerAccessMutationOptions = Apollo.BaseMutationOptions<RevokeTrackerAccessMutation, RevokeTrackerAccessMutationVariables>;
export const RevokeTrackerDeviceDocument = gql`
    mutation RevokeTrackerDevice($deviceId: String!) {
  revokeTrackerDevice(deviceId: $deviceId) {
    ...TrackerDeviceFields
  }
}
    ${TrackerDeviceFieldsFragmentDoc}`;
export type RevokeTrackerDeviceMutationFn = Apollo.MutationFunction<RevokeTrackerDeviceMutation, RevokeTrackerDeviceMutationVariables>;

/**
 * __useRevokeTrackerDeviceMutation__
 *
 * To run a mutation, you first call `useRevokeTrackerDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRevokeTrackerDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [revokeTrackerDeviceMutation, { data, loading, error }] = useRevokeTrackerDeviceMutation({
 *   variables: {
 *      deviceId: // value for 'deviceId'
 *   },
 * });
 */
export function useRevokeTrackerDeviceMutation(baseOptions?: Apollo.MutationHookOptions<RevokeTrackerDeviceMutation, RevokeTrackerDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RevokeTrackerDeviceMutation, RevokeTrackerDeviceMutationVariables>(RevokeTrackerDeviceDocument, options);
      }
export type RevokeTrackerDeviceMutationHookResult = ReturnType<typeof useRevokeTrackerDeviceMutation>;
export type RevokeTrackerDeviceMutationResult = Apollo.MutationResult<RevokeTrackerDeviceMutation>;
export type RevokeTrackerDeviceMutationOptions = Apollo.BaseMutationOptions<RevokeTrackerDeviceMutation, RevokeTrackerDeviceMutationVariables>;
export const UpdateTrackerSettingsDocument = gql`
    mutation UpdateTrackerSettings($input: TrackerSettingsInput!) {
  updateTrackerSettings(input: $input) {
    ...TrackerSettingsFields
  }
}
    ${TrackerSettingsFieldsFragmentDoc}`;
export type UpdateTrackerSettingsMutationFn = Apollo.MutationFunction<UpdateTrackerSettingsMutation, UpdateTrackerSettingsMutationVariables>;

/**
 * __useUpdateTrackerSettingsMutation__
 *
 * To run a mutation, you first call `useUpdateTrackerSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTrackerSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTrackerSettingsMutation, { data, loading, error }] = useUpdateTrackerSettingsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateTrackerSettingsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTrackerSettingsMutation, UpdateTrackerSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateTrackerSettingsMutation, UpdateTrackerSettingsMutationVariables>(UpdateTrackerSettingsDocument, options);
      }
export type UpdateTrackerSettingsMutationHookResult = ReturnType<typeof useUpdateTrackerSettingsMutation>;
export type UpdateTrackerSettingsMutationResult = Apollo.MutationResult<UpdateTrackerSettingsMutation>;
export type UpdateTrackerSettingsMutationOptions = Apollo.BaseMutationOptions<UpdateTrackerSettingsMutation, UpdateTrackerSettingsMutationVariables>;
export const ListBlogPostsDocument = gql`
    query ListBlogPosts {
  listBlogPosts {
    ...BlogPostFields
  }
}
    ${BlogPostFieldsFragmentDoc}`;

/**
 * __useListBlogPostsQuery__
 *
 * To run a query within a React component, call `useListBlogPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListBlogPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListBlogPostsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListBlogPostsQuery(baseOptions?: Apollo.QueryHookOptions<ListBlogPostsQuery, ListBlogPostsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListBlogPostsQuery, ListBlogPostsQueryVariables>(ListBlogPostsDocument, options);
      }
export function useListBlogPostsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListBlogPostsQuery, ListBlogPostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListBlogPostsQuery, ListBlogPostsQueryVariables>(ListBlogPostsDocument, options);
        }
// @ts-ignore
export function useListBlogPostsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListBlogPostsQuery, ListBlogPostsQueryVariables>): Apollo.UseSuspenseQueryResult<ListBlogPostsQuery, ListBlogPostsQueryVariables>;
export function useListBlogPostsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBlogPostsQuery, ListBlogPostsQueryVariables>): Apollo.UseSuspenseQueryResult<ListBlogPostsQuery | undefined, ListBlogPostsQueryVariables>;
export function useListBlogPostsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBlogPostsQuery, ListBlogPostsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListBlogPostsQuery, ListBlogPostsQueryVariables>(ListBlogPostsDocument, options);
        }
export type ListBlogPostsQueryHookResult = ReturnType<typeof useListBlogPostsQuery>;
export type ListBlogPostsLazyQueryHookResult = ReturnType<typeof useListBlogPostsLazyQuery>;
export type ListBlogPostsSuspenseQueryHookResult = ReturnType<typeof useListBlogPostsSuspenseQuery>;
export type ListBlogPostsQueryResult = Apollo.QueryResult<ListBlogPostsQuery, ListBlogPostsQueryVariables>;
export const ListBlogPostsPagedDocument = gql`
    query ListBlogPostsPaged($input: TableQueryInput!) {
  listBlogPostsPaged(input: $input) {
    totalCount
    rows {
      ...BlogPostFields
    }
  }
}
    ${BlogPostFieldsFragmentDoc}`;

/**
 * __useListBlogPostsPagedQuery__
 *
 * To run a query within a React component, call `useListBlogPostsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListBlogPostsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListBlogPostsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListBlogPostsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables> & ({ variables: ListBlogPostsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>(ListBlogPostsPagedDocument, options);
      }
export function useListBlogPostsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>(ListBlogPostsPagedDocument, options);
        }
// @ts-ignore
export function useListBlogPostsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>;
export function useListBlogPostsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListBlogPostsPagedQuery | undefined, ListBlogPostsPagedQueryVariables>;
export function useListBlogPostsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>(ListBlogPostsPagedDocument, options);
        }
export type ListBlogPostsPagedQueryHookResult = ReturnType<typeof useListBlogPostsPagedQuery>;
export type ListBlogPostsPagedLazyQueryHookResult = ReturnType<typeof useListBlogPostsPagedLazyQuery>;
export type ListBlogPostsPagedSuspenseQueryHookResult = ReturnType<typeof useListBlogPostsPagedSuspenseQuery>;
export type ListBlogPostsPagedQueryResult = Apollo.QueryResult<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>;
export const ListBlogPostsStatsDocument = gql`
    query ListBlogPostsStats {
  listBlogPostsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListBlogPostsStatsQuery__
 *
 * To run a query within a React component, call `useListBlogPostsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListBlogPostsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListBlogPostsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListBlogPostsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>(ListBlogPostsStatsDocument, options);
      }
export function useListBlogPostsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>(ListBlogPostsStatsDocument, options);
        }
// @ts-ignore
export function useListBlogPostsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>;
export function useListBlogPostsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListBlogPostsStatsQuery | undefined, ListBlogPostsStatsQueryVariables>;
export function useListBlogPostsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>(ListBlogPostsStatsDocument, options);
        }
export type ListBlogPostsStatsQueryHookResult = ReturnType<typeof useListBlogPostsStatsQuery>;
export type ListBlogPostsStatsLazyQueryHookResult = ReturnType<typeof useListBlogPostsStatsLazyQuery>;
export type ListBlogPostsStatsSuspenseQueryHookResult = ReturnType<typeof useListBlogPostsStatsSuspenseQuery>;
export type ListBlogPostsStatsQueryResult = Apollo.QueryResult<ListBlogPostsStatsQuery, ListBlogPostsStatsQueryVariables>;
export const CreateBlogPostDocument = gql`
    mutation CreateBlogPost($input: BlogPostInput!) {
  createBlogPost(input: $input) {
    id
  }
}
    `;
export type CreateBlogPostMutationFn = Apollo.MutationFunction<CreateBlogPostMutation, CreateBlogPostMutationVariables>;

/**
 * __useCreateBlogPostMutation__
 *
 * To run a mutation, you first call `useCreateBlogPostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateBlogPostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createBlogPostMutation, { data, loading, error }] = useCreateBlogPostMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateBlogPostMutation(baseOptions?: Apollo.MutationHookOptions<CreateBlogPostMutation, CreateBlogPostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateBlogPostMutation, CreateBlogPostMutationVariables>(CreateBlogPostDocument, options);
      }
export type CreateBlogPostMutationHookResult = ReturnType<typeof useCreateBlogPostMutation>;
export type CreateBlogPostMutationResult = Apollo.MutationResult<CreateBlogPostMutation>;
export type CreateBlogPostMutationOptions = Apollo.BaseMutationOptions<CreateBlogPostMutation, CreateBlogPostMutationVariables>;
export const UpdateBlogPostDocument = gql`
    mutation UpdateBlogPost($id: ID!, $input: BlogPostInput!) {
  updateBlogPost(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateBlogPostMutationFn = Apollo.MutationFunction<UpdateBlogPostMutation, UpdateBlogPostMutationVariables>;

/**
 * __useUpdateBlogPostMutation__
 *
 * To run a mutation, you first call `useUpdateBlogPostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBlogPostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBlogPostMutation, { data, loading, error }] = useUpdateBlogPostMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateBlogPostMutation(baseOptions?: Apollo.MutationHookOptions<UpdateBlogPostMutation, UpdateBlogPostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateBlogPostMutation, UpdateBlogPostMutationVariables>(UpdateBlogPostDocument, options);
      }
export type UpdateBlogPostMutationHookResult = ReturnType<typeof useUpdateBlogPostMutation>;
export type UpdateBlogPostMutationResult = Apollo.MutationResult<UpdateBlogPostMutation>;
export type UpdateBlogPostMutationOptions = Apollo.BaseMutationOptions<UpdateBlogPostMutation, UpdateBlogPostMutationVariables>;
export const DeleteBlogPostDocument = gql`
    mutation DeleteBlogPost($id: ID!) {
  deleteBlogPost(id: $id)
}
    `;
export type DeleteBlogPostMutationFn = Apollo.MutationFunction<DeleteBlogPostMutation, DeleteBlogPostMutationVariables>;

/**
 * __useDeleteBlogPostMutation__
 *
 * To run a mutation, you first call `useDeleteBlogPostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteBlogPostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteBlogPostMutation, { data, loading, error }] = useDeleteBlogPostMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteBlogPostMutation(baseOptions?: Apollo.MutationHookOptions<DeleteBlogPostMutation, DeleteBlogPostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteBlogPostMutation, DeleteBlogPostMutationVariables>(DeleteBlogPostDocument, options);
      }
export type DeleteBlogPostMutationHookResult = ReturnType<typeof useDeleteBlogPostMutation>;
export type DeleteBlogPostMutationResult = Apollo.MutationResult<DeleteBlogPostMutation>;
export type DeleteBlogPostMutationOptions = Apollo.BaseMutationOptions<DeleteBlogPostMutation, DeleteBlogPostMutationVariables>;
export const ListCaseStudiesDocument = gql`
    query ListCaseStudies {
  listCaseStudies {
    ...CaseStudyFields
  }
}
    ${CaseStudyFieldsFragmentDoc}`;

/**
 * __useListCaseStudiesQuery__
 *
 * To run a query within a React component, call `useListCaseStudiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListCaseStudiesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListCaseStudiesQuery({
 *   variables: {
 *   },
 * });
 */
export function useListCaseStudiesQuery(baseOptions?: Apollo.QueryHookOptions<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>(ListCaseStudiesDocument, options);
      }
export function useListCaseStudiesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>(ListCaseStudiesDocument, options);
        }
// @ts-ignore
export function useListCaseStudiesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>): Apollo.UseSuspenseQueryResult<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>;
export function useListCaseStudiesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>): Apollo.UseSuspenseQueryResult<ListCaseStudiesQuery | undefined, ListCaseStudiesQueryVariables>;
export function useListCaseStudiesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>(ListCaseStudiesDocument, options);
        }
export type ListCaseStudiesQueryHookResult = ReturnType<typeof useListCaseStudiesQuery>;
export type ListCaseStudiesLazyQueryHookResult = ReturnType<typeof useListCaseStudiesLazyQuery>;
export type ListCaseStudiesSuspenseQueryHookResult = ReturnType<typeof useListCaseStudiesSuspenseQuery>;
export type ListCaseStudiesQueryResult = Apollo.QueryResult<ListCaseStudiesQuery, ListCaseStudiesQueryVariables>;
export const ListCaseStudiesPagedDocument = gql`
    query ListCaseStudiesPaged($input: TableQueryInput!) {
  listCaseStudiesPaged(input: $input) {
    totalCount
    rows {
      ...CaseStudyFields
    }
  }
}
    ${CaseStudyFieldsFragmentDoc}`;

/**
 * __useListCaseStudiesPagedQuery__
 *
 * To run a query within a React component, call `useListCaseStudiesPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListCaseStudiesPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListCaseStudiesPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListCaseStudiesPagedQuery(baseOptions: Apollo.QueryHookOptions<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables> & ({ variables: ListCaseStudiesPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables>(ListCaseStudiesPagedDocument, options);
      }
export function useListCaseStudiesPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables>(ListCaseStudiesPagedDocument, options);
        }
// @ts-ignore
export function useListCaseStudiesPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables>;
export function useListCaseStudiesPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListCaseStudiesPagedQuery | undefined, ListCaseStudiesPagedQueryVariables>;
export function useListCaseStudiesPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables>(ListCaseStudiesPagedDocument, options);
        }
export type ListCaseStudiesPagedQueryHookResult = ReturnType<typeof useListCaseStudiesPagedQuery>;
export type ListCaseStudiesPagedLazyQueryHookResult = ReturnType<typeof useListCaseStudiesPagedLazyQuery>;
export type ListCaseStudiesPagedSuspenseQueryHookResult = ReturnType<typeof useListCaseStudiesPagedSuspenseQuery>;
export type ListCaseStudiesPagedQueryResult = Apollo.QueryResult<ListCaseStudiesPagedQuery, ListCaseStudiesPagedQueryVariables>;
export const ListCaseStudiesStatsDocument = gql`
    query ListCaseStudiesStats {
  listCaseStudiesStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListCaseStudiesStatsQuery__
 *
 * To run a query within a React component, call `useListCaseStudiesStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListCaseStudiesStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListCaseStudiesStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListCaseStudiesStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>(ListCaseStudiesStatsDocument, options);
      }
export function useListCaseStudiesStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>(ListCaseStudiesStatsDocument, options);
        }
// @ts-ignore
export function useListCaseStudiesStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>;
export function useListCaseStudiesStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListCaseStudiesStatsQuery | undefined, ListCaseStudiesStatsQueryVariables>;
export function useListCaseStudiesStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>(ListCaseStudiesStatsDocument, options);
        }
export type ListCaseStudiesStatsQueryHookResult = ReturnType<typeof useListCaseStudiesStatsQuery>;
export type ListCaseStudiesStatsLazyQueryHookResult = ReturnType<typeof useListCaseStudiesStatsLazyQuery>;
export type ListCaseStudiesStatsSuspenseQueryHookResult = ReturnType<typeof useListCaseStudiesStatsSuspenseQuery>;
export type ListCaseStudiesStatsQueryResult = Apollo.QueryResult<ListCaseStudiesStatsQuery, ListCaseStudiesStatsQueryVariables>;
export const CreateCaseStudyDocument = gql`
    mutation CreateCaseStudy($input: CaseStudyInput!) {
  createCaseStudy(input: $input) {
    id
  }
}
    `;
export type CreateCaseStudyMutationFn = Apollo.MutationFunction<CreateCaseStudyMutation, CreateCaseStudyMutationVariables>;

/**
 * __useCreateCaseStudyMutation__
 *
 * To run a mutation, you first call `useCreateCaseStudyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCaseStudyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCaseStudyMutation, { data, loading, error }] = useCreateCaseStudyMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCaseStudyMutation(baseOptions?: Apollo.MutationHookOptions<CreateCaseStudyMutation, CreateCaseStudyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCaseStudyMutation, CreateCaseStudyMutationVariables>(CreateCaseStudyDocument, options);
      }
export type CreateCaseStudyMutationHookResult = ReturnType<typeof useCreateCaseStudyMutation>;
export type CreateCaseStudyMutationResult = Apollo.MutationResult<CreateCaseStudyMutation>;
export type CreateCaseStudyMutationOptions = Apollo.BaseMutationOptions<CreateCaseStudyMutation, CreateCaseStudyMutationVariables>;
export const UpdateCaseStudyDocument = gql`
    mutation UpdateCaseStudy($id: ID!, $input: CaseStudyInput!) {
  updateCaseStudy(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateCaseStudyMutationFn = Apollo.MutationFunction<UpdateCaseStudyMutation, UpdateCaseStudyMutationVariables>;

/**
 * __useUpdateCaseStudyMutation__
 *
 * To run a mutation, you first call `useUpdateCaseStudyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCaseStudyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCaseStudyMutation, { data, loading, error }] = useUpdateCaseStudyMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateCaseStudyMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCaseStudyMutation, UpdateCaseStudyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCaseStudyMutation, UpdateCaseStudyMutationVariables>(UpdateCaseStudyDocument, options);
      }
export type UpdateCaseStudyMutationHookResult = ReturnType<typeof useUpdateCaseStudyMutation>;
export type UpdateCaseStudyMutationResult = Apollo.MutationResult<UpdateCaseStudyMutation>;
export type UpdateCaseStudyMutationOptions = Apollo.BaseMutationOptions<UpdateCaseStudyMutation, UpdateCaseStudyMutationVariables>;
export const DeleteCaseStudyDocument = gql`
    mutation DeleteCaseStudy($id: ID!) {
  deleteCaseStudy(id: $id)
}
    `;
export type DeleteCaseStudyMutationFn = Apollo.MutationFunction<DeleteCaseStudyMutation, DeleteCaseStudyMutationVariables>;

/**
 * __useDeleteCaseStudyMutation__
 *
 * To run a mutation, you first call `useDeleteCaseStudyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCaseStudyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCaseStudyMutation, { data, loading, error }] = useDeleteCaseStudyMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteCaseStudyMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCaseStudyMutation, DeleteCaseStudyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCaseStudyMutation, DeleteCaseStudyMutationVariables>(DeleteCaseStudyDocument, options);
      }
export type DeleteCaseStudyMutationHookResult = ReturnType<typeof useDeleteCaseStudyMutation>;
export type DeleteCaseStudyMutationResult = Apollo.MutationResult<DeleteCaseStudyMutation>;
export type DeleteCaseStudyMutationOptions = Apollo.BaseMutationOptions<DeleteCaseStudyMutation, DeleteCaseStudyMutationVariables>;
export const ListJobCompaniesDocument = gql`
    query ListJobCompanies {
  listJobCompanies {
    ...JobCompanyFields
  }
}
    ${JobCompanyFieldsFragmentDoc}`;

/**
 * __useListJobCompaniesQuery__
 *
 * To run a query within a React component, call `useListJobCompaniesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListJobCompaniesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListJobCompaniesQuery({
 *   variables: {
 *   },
 * });
 */
export function useListJobCompaniesQuery(baseOptions?: Apollo.QueryHookOptions<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>(ListJobCompaniesDocument, options);
      }
export function useListJobCompaniesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>(ListJobCompaniesDocument, options);
        }
// @ts-ignore
export function useListJobCompaniesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>;
export function useListJobCompaniesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobCompaniesQuery | undefined, ListJobCompaniesQueryVariables>;
export function useListJobCompaniesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>(ListJobCompaniesDocument, options);
        }
export type ListJobCompaniesQueryHookResult = ReturnType<typeof useListJobCompaniesQuery>;
export type ListJobCompaniesLazyQueryHookResult = ReturnType<typeof useListJobCompaniesLazyQuery>;
export type ListJobCompaniesSuspenseQueryHookResult = ReturnType<typeof useListJobCompaniesSuspenseQuery>;
export type ListJobCompaniesQueryResult = Apollo.QueryResult<ListJobCompaniesQuery, ListJobCompaniesQueryVariables>;
export const ListJobCompaniesPagedDocument = gql`
    query ListJobCompaniesPaged($input: TableQueryInput!) {
  listJobCompaniesPaged(input: $input) {
    totalCount
    rows {
      ...JobCompanyFields
    }
  }
}
    ${JobCompanyFieldsFragmentDoc}`;

/**
 * __useListJobCompaniesPagedQuery__
 *
 * To run a query within a React component, call `useListJobCompaniesPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListJobCompaniesPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListJobCompaniesPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListJobCompaniesPagedQuery(baseOptions: Apollo.QueryHookOptions<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables> & ({ variables: ListJobCompaniesPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables>(ListJobCompaniesPagedDocument, options);
      }
export function useListJobCompaniesPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables>(ListJobCompaniesPagedDocument, options);
        }
// @ts-ignore
export function useListJobCompaniesPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables>;
export function useListJobCompaniesPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobCompaniesPagedQuery | undefined, ListJobCompaniesPagedQueryVariables>;
export function useListJobCompaniesPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables>(ListJobCompaniesPagedDocument, options);
        }
export type ListJobCompaniesPagedQueryHookResult = ReturnType<typeof useListJobCompaniesPagedQuery>;
export type ListJobCompaniesPagedLazyQueryHookResult = ReturnType<typeof useListJobCompaniesPagedLazyQuery>;
export type ListJobCompaniesPagedSuspenseQueryHookResult = ReturnType<typeof useListJobCompaniesPagedSuspenseQuery>;
export type ListJobCompaniesPagedQueryResult = Apollo.QueryResult<ListJobCompaniesPagedQuery, ListJobCompaniesPagedQueryVariables>;
export const ListJobCompaniesStatsDocument = gql`
    query ListJobCompaniesStats {
  listJobCompaniesStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListJobCompaniesStatsQuery__
 *
 * To run a query within a React component, call `useListJobCompaniesStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListJobCompaniesStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListJobCompaniesStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListJobCompaniesStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>(ListJobCompaniesStatsDocument, options);
      }
export function useListJobCompaniesStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>(ListJobCompaniesStatsDocument, options);
        }
// @ts-ignore
export function useListJobCompaniesStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>;
export function useListJobCompaniesStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobCompaniesStatsQuery | undefined, ListJobCompaniesStatsQueryVariables>;
export function useListJobCompaniesStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>(ListJobCompaniesStatsDocument, options);
        }
export type ListJobCompaniesStatsQueryHookResult = ReturnType<typeof useListJobCompaniesStatsQuery>;
export type ListJobCompaniesStatsLazyQueryHookResult = ReturnType<typeof useListJobCompaniesStatsLazyQuery>;
export type ListJobCompaniesStatsSuspenseQueryHookResult = ReturnType<typeof useListJobCompaniesStatsSuspenseQuery>;
export type ListJobCompaniesStatsQueryResult = Apollo.QueryResult<ListJobCompaniesStatsQuery, ListJobCompaniesStatsQueryVariables>;
export const CreateJobCompanyDocument = gql`
    mutation CreateJobCompany($input: JobCompanyInput!) {
  createJobCompany(input: $input) {
    id
  }
}
    `;
export type CreateJobCompanyMutationFn = Apollo.MutationFunction<CreateJobCompanyMutation, CreateJobCompanyMutationVariables>;

/**
 * __useCreateJobCompanyMutation__
 *
 * To run a mutation, you first call `useCreateJobCompanyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateJobCompanyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createJobCompanyMutation, { data, loading, error }] = useCreateJobCompanyMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateJobCompanyMutation(baseOptions?: Apollo.MutationHookOptions<CreateJobCompanyMutation, CreateJobCompanyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateJobCompanyMutation, CreateJobCompanyMutationVariables>(CreateJobCompanyDocument, options);
      }
export type CreateJobCompanyMutationHookResult = ReturnType<typeof useCreateJobCompanyMutation>;
export type CreateJobCompanyMutationResult = Apollo.MutationResult<CreateJobCompanyMutation>;
export type CreateJobCompanyMutationOptions = Apollo.BaseMutationOptions<CreateJobCompanyMutation, CreateJobCompanyMutationVariables>;
export const UpdateJobCompanyDocument = gql`
    mutation UpdateJobCompany($id: ID!, $input: JobCompanyInput!) {
  updateJobCompany(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateJobCompanyMutationFn = Apollo.MutationFunction<UpdateJobCompanyMutation, UpdateJobCompanyMutationVariables>;

/**
 * __useUpdateJobCompanyMutation__
 *
 * To run a mutation, you first call `useUpdateJobCompanyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateJobCompanyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateJobCompanyMutation, { data, loading, error }] = useUpdateJobCompanyMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateJobCompanyMutation(baseOptions?: Apollo.MutationHookOptions<UpdateJobCompanyMutation, UpdateJobCompanyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateJobCompanyMutation, UpdateJobCompanyMutationVariables>(UpdateJobCompanyDocument, options);
      }
export type UpdateJobCompanyMutationHookResult = ReturnType<typeof useUpdateJobCompanyMutation>;
export type UpdateJobCompanyMutationResult = Apollo.MutationResult<UpdateJobCompanyMutation>;
export type UpdateJobCompanyMutationOptions = Apollo.BaseMutationOptions<UpdateJobCompanyMutation, UpdateJobCompanyMutationVariables>;
export const DeleteJobCompanyDocument = gql`
    mutation DeleteJobCompany($id: ID!) {
  deleteJobCompany(id: $id)
}
    `;
export type DeleteJobCompanyMutationFn = Apollo.MutationFunction<DeleteJobCompanyMutation, DeleteJobCompanyMutationVariables>;

/**
 * __useDeleteJobCompanyMutation__
 *
 * To run a mutation, you first call `useDeleteJobCompanyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteJobCompanyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteJobCompanyMutation, { data, loading, error }] = useDeleteJobCompanyMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteJobCompanyMutation(baseOptions?: Apollo.MutationHookOptions<DeleteJobCompanyMutation, DeleteJobCompanyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteJobCompanyMutation, DeleteJobCompanyMutationVariables>(DeleteJobCompanyDocument, options);
      }
export type DeleteJobCompanyMutationHookResult = ReturnType<typeof useDeleteJobCompanyMutation>;
export type DeleteJobCompanyMutationResult = Apollo.MutationResult<DeleteJobCompanyMutation>;
export type DeleteJobCompanyMutationOptions = Apollo.BaseMutationOptions<DeleteJobCompanyMutation, DeleteJobCompanyMutationVariables>;
export const ListJobsDocument = gql`
    query ListJobs {
  listJobs {
    ...JobFields
  }
}
    ${JobFieldsFragmentDoc}`;

/**
 * __useListJobsQuery__
 *
 * To run a query within a React component, call `useListJobsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListJobsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListJobsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListJobsQuery(baseOptions?: Apollo.QueryHookOptions<ListJobsQuery, ListJobsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListJobsQuery, ListJobsQueryVariables>(ListJobsDocument, options);
      }
export function useListJobsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListJobsQuery, ListJobsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListJobsQuery, ListJobsQueryVariables>(ListJobsDocument, options);
        }
// @ts-ignore
export function useListJobsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListJobsQuery, ListJobsQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobsQuery, ListJobsQueryVariables>;
export function useListJobsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobsQuery, ListJobsQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobsQuery | undefined, ListJobsQueryVariables>;
export function useListJobsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobsQuery, ListJobsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListJobsQuery, ListJobsQueryVariables>(ListJobsDocument, options);
        }
export type ListJobsQueryHookResult = ReturnType<typeof useListJobsQuery>;
export type ListJobsLazyQueryHookResult = ReturnType<typeof useListJobsLazyQuery>;
export type ListJobsSuspenseQueryHookResult = ReturnType<typeof useListJobsSuspenseQuery>;
export type ListJobsQueryResult = Apollo.QueryResult<ListJobsQuery, ListJobsQueryVariables>;
export const ListJobsPagedDocument = gql`
    query ListJobsPaged($input: TableQueryInput!) {
  listJobsPaged(input: $input) {
    totalCount
    rows {
      ...JobFields
    }
  }
}
    ${JobFieldsFragmentDoc}`;

/**
 * __useListJobsPagedQuery__
 *
 * To run a query within a React component, call `useListJobsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListJobsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListJobsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListJobsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListJobsPagedQuery, ListJobsPagedQueryVariables> & ({ variables: ListJobsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListJobsPagedQuery, ListJobsPagedQueryVariables>(ListJobsPagedDocument, options);
      }
export function useListJobsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListJobsPagedQuery, ListJobsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListJobsPagedQuery, ListJobsPagedQueryVariables>(ListJobsPagedDocument, options);
        }
// @ts-ignore
export function useListJobsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListJobsPagedQuery, ListJobsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobsPagedQuery, ListJobsPagedQueryVariables>;
export function useListJobsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobsPagedQuery, ListJobsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobsPagedQuery | undefined, ListJobsPagedQueryVariables>;
export function useListJobsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobsPagedQuery, ListJobsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListJobsPagedQuery, ListJobsPagedQueryVariables>(ListJobsPagedDocument, options);
        }
export type ListJobsPagedQueryHookResult = ReturnType<typeof useListJobsPagedQuery>;
export type ListJobsPagedLazyQueryHookResult = ReturnType<typeof useListJobsPagedLazyQuery>;
export type ListJobsPagedSuspenseQueryHookResult = ReturnType<typeof useListJobsPagedSuspenseQuery>;
export type ListJobsPagedQueryResult = Apollo.QueryResult<ListJobsPagedQuery, ListJobsPagedQueryVariables>;
export const ListJobsStatsDocument = gql`
    query ListJobsStats {
  listJobsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListJobsStatsQuery__
 *
 * To run a query within a React component, call `useListJobsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListJobsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListJobsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListJobsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListJobsStatsQuery, ListJobsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListJobsStatsQuery, ListJobsStatsQueryVariables>(ListJobsStatsDocument, options);
      }
export function useListJobsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListJobsStatsQuery, ListJobsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListJobsStatsQuery, ListJobsStatsQueryVariables>(ListJobsStatsDocument, options);
        }
// @ts-ignore
export function useListJobsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListJobsStatsQuery, ListJobsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobsStatsQuery, ListJobsStatsQueryVariables>;
export function useListJobsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobsStatsQuery, ListJobsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListJobsStatsQuery | undefined, ListJobsStatsQueryVariables>;
export function useListJobsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListJobsStatsQuery, ListJobsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListJobsStatsQuery, ListJobsStatsQueryVariables>(ListJobsStatsDocument, options);
        }
export type ListJobsStatsQueryHookResult = ReturnType<typeof useListJobsStatsQuery>;
export type ListJobsStatsLazyQueryHookResult = ReturnType<typeof useListJobsStatsLazyQuery>;
export type ListJobsStatsSuspenseQueryHookResult = ReturnType<typeof useListJobsStatsSuspenseQuery>;
export type ListJobsStatsQueryResult = Apollo.QueryResult<ListJobsStatsQuery, ListJobsStatsQueryVariables>;
export const CreateJobDocument = gql`
    mutation CreateJob($input: JobInput!) {
  createJob(input: $input) {
    id
  }
}
    `;
export type CreateJobMutationFn = Apollo.MutationFunction<CreateJobMutation, CreateJobMutationVariables>;

/**
 * __useCreateJobMutation__
 *
 * To run a mutation, you first call `useCreateJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createJobMutation, { data, loading, error }] = useCreateJobMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateJobMutation(baseOptions?: Apollo.MutationHookOptions<CreateJobMutation, CreateJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateJobMutation, CreateJobMutationVariables>(CreateJobDocument, options);
      }
export type CreateJobMutationHookResult = ReturnType<typeof useCreateJobMutation>;
export type CreateJobMutationResult = Apollo.MutationResult<CreateJobMutation>;
export type CreateJobMutationOptions = Apollo.BaseMutationOptions<CreateJobMutation, CreateJobMutationVariables>;
export const UpdateJobDocument = gql`
    mutation UpdateJob($id: ID!, $input: JobInput!) {
  updateJob(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateJobMutationFn = Apollo.MutationFunction<UpdateJobMutation, UpdateJobMutationVariables>;

/**
 * __useUpdateJobMutation__
 *
 * To run a mutation, you first call `useUpdateJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateJobMutation, { data, loading, error }] = useUpdateJobMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateJobMutation(baseOptions?: Apollo.MutationHookOptions<UpdateJobMutation, UpdateJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateJobMutation, UpdateJobMutationVariables>(UpdateJobDocument, options);
      }
export type UpdateJobMutationHookResult = ReturnType<typeof useUpdateJobMutation>;
export type UpdateJobMutationResult = Apollo.MutationResult<UpdateJobMutation>;
export type UpdateJobMutationOptions = Apollo.BaseMutationOptions<UpdateJobMutation, UpdateJobMutationVariables>;
export const DeleteJobDocument = gql`
    mutation DeleteJob($id: ID!) {
  deleteJob(id: $id)
}
    `;
export type DeleteJobMutationFn = Apollo.MutationFunction<DeleteJobMutation, DeleteJobMutationVariables>;

/**
 * __useDeleteJobMutation__
 *
 * To run a mutation, you first call `useDeleteJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteJobMutation, { data, loading, error }] = useDeleteJobMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteJobMutation(baseOptions?: Apollo.MutationHookOptions<DeleteJobMutation, DeleteJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteJobMutation, DeleteJobMutationVariables>(DeleteJobDocument, options);
      }
export type DeleteJobMutationHookResult = ReturnType<typeof useDeleteJobMutation>;
export type DeleteJobMutationResult = Apollo.MutationResult<DeleteJobMutation>;
export type DeleteJobMutationOptions = Apollo.BaseMutationOptions<DeleteJobMutation, DeleteJobMutationVariables>;
export const ListGigsDocument = gql`
    query ListGigs {
  listGigs {
    ...GigFields
  }
}
    ${GigFieldsFragmentDoc}`;

/**
 * __useListGigsQuery__
 *
 * To run a query within a React component, call `useListGigsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListGigsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListGigsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListGigsQuery(baseOptions?: Apollo.QueryHookOptions<ListGigsQuery, ListGigsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListGigsQuery, ListGigsQueryVariables>(ListGigsDocument, options);
      }
export function useListGigsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListGigsQuery, ListGigsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListGigsQuery, ListGigsQueryVariables>(ListGigsDocument, options);
        }
// @ts-ignore
export function useListGigsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListGigsQuery, ListGigsQueryVariables>): Apollo.UseSuspenseQueryResult<ListGigsQuery, ListGigsQueryVariables>;
export function useListGigsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListGigsQuery, ListGigsQueryVariables>): Apollo.UseSuspenseQueryResult<ListGigsQuery | undefined, ListGigsQueryVariables>;
export function useListGigsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListGigsQuery, ListGigsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListGigsQuery, ListGigsQueryVariables>(ListGigsDocument, options);
        }
export type ListGigsQueryHookResult = ReturnType<typeof useListGigsQuery>;
export type ListGigsLazyQueryHookResult = ReturnType<typeof useListGigsLazyQuery>;
export type ListGigsSuspenseQueryHookResult = ReturnType<typeof useListGigsSuspenseQuery>;
export type ListGigsQueryResult = Apollo.QueryResult<ListGigsQuery, ListGigsQueryVariables>;
export const ListGigsPagedDocument = gql`
    query ListGigsPaged($input: TableQueryInput!) {
  listGigsPaged(input: $input) {
    totalCount
    rows {
      ...GigFields
    }
  }
}
    ${GigFieldsFragmentDoc}`;

/**
 * __useListGigsPagedQuery__
 *
 * To run a query within a React component, call `useListGigsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListGigsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListGigsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListGigsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListGigsPagedQuery, ListGigsPagedQueryVariables> & ({ variables: ListGigsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListGigsPagedQuery, ListGigsPagedQueryVariables>(ListGigsPagedDocument, options);
      }
export function useListGigsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListGigsPagedQuery, ListGigsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListGigsPagedQuery, ListGigsPagedQueryVariables>(ListGigsPagedDocument, options);
        }
// @ts-ignore
export function useListGigsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListGigsPagedQuery, ListGigsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListGigsPagedQuery, ListGigsPagedQueryVariables>;
export function useListGigsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListGigsPagedQuery, ListGigsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListGigsPagedQuery | undefined, ListGigsPagedQueryVariables>;
export function useListGigsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListGigsPagedQuery, ListGigsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListGigsPagedQuery, ListGigsPagedQueryVariables>(ListGigsPagedDocument, options);
        }
export type ListGigsPagedQueryHookResult = ReturnType<typeof useListGigsPagedQuery>;
export type ListGigsPagedLazyQueryHookResult = ReturnType<typeof useListGigsPagedLazyQuery>;
export type ListGigsPagedSuspenseQueryHookResult = ReturnType<typeof useListGigsPagedSuspenseQuery>;
export type ListGigsPagedQueryResult = Apollo.QueryResult<ListGigsPagedQuery, ListGigsPagedQueryVariables>;
export const ListGigsStatsDocument = gql`
    query ListGigsStats {
  listGigsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListGigsStatsQuery__
 *
 * To run a query within a React component, call `useListGigsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListGigsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListGigsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListGigsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListGigsStatsQuery, ListGigsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListGigsStatsQuery, ListGigsStatsQueryVariables>(ListGigsStatsDocument, options);
      }
export function useListGigsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListGigsStatsQuery, ListGigsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListGigsStatsQuery, ListGigsStatsQueryVariables>(ListGigsStatsDocument, options);
        }
// @ts-ignore
export function useListGigsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListGigsStatsQuery, ListGigsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListGigsStatsQuery, ListGigsStatsQueryVariables>;
export function useListGigsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListGigsStatsQuery, ListGigsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListGigsStatsQuery | undefined, ListGigsStatsQueryVariables>;
export function useListGigsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListGigsStatsQuery, ListGigsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListGigsStatsQuery, ListGigsStatsQueryVariables>(ListGigsStatsDocument, options);
        }
export type ListGigsStatsQueryHookResult = ReturnType<typeof useListGigsStatsQuery>;
export type ListGigsStatsLazyQueryHookResult = ReturnType<typeof useListGigsStatsLazyQuery>;
export type ListGigsStatsSuspenseQueryHookResult = ReturnType<typeof useListGigsStatsSuspenseQuery>;
export type ListGigsStatsQueryResult = Apollo.QueryResult<ListGigsStatsQuery, ListGigsStatsQueryVariables>;
export const CreateGigDocument = gql`
    mutation CreateGig($input: GigInput!) {
  createGig(input: $input) {
    id
  }
}
    `;
export type CreateGigMutationFn = Apollo.MutationFunction<CreateGigMutation, CreateGigMutationVariables>;

/**
 * __useCreateGigMutation__
 *
 * To run a mutation, you first call `useCreateGigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateGigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createGigMutation, { data, loading, error }] = useCreateGigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateGigMutation(baseOptions?: Apollo.MutationHookOptions<CreateGigMutation, CreateGigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateGigMutation, CreateGigMutationVariables>(CreateGigDocument, options);
      }
export type CreateGigMutationHookResult = ReturnType<typeof useCreateGigMutation>;
export type CreateGigMutationResult = Apollo.MutationResult<CreateGigMutation>;
export type CreateGigMutationOptions = Apollo.BaseMutationOptions<CreateGigMutation, CreateGigMutationVariables>;
export const UpdateGigDocument = gql`
    mutation UpdateGig($id: ID!, $input: GigInput!) {
  updateGig(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateGigMutationFn = Apollo.MutationFunction<UpdateGigMutation, UpdateGigMutationVariables>;

/**
 * __useUpdateGigMutation__
 *
 * To run a mutation, you first call `useUpdateGigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateGigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateGigMutation, { data, loading, error }] = useUpdateGigMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateGigMutation(baseOptions?: Apollo.MutationHookOptions<UpdateGigMutation, UpdateGigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateGigMutation, UpdateGigMutationVariables>(UpdateGigDocument, options);
      }
export type UpdateGigMutationHookResult = ReturnType<typeof useUpdateGigMutation>;
export type UpdateGigMutationResult = Apollo.MutationResult<UpdateGigMutation>;
export type UpdateGigMutationOptions = Apollo.BaseMutationOptions<UpdateGigMutation, UpdateGigMutationVariables>;
export const DeleteGigDocument = gql`
    mutation DeleteGig($id: ID!) {
  deleteGig(id: $id)
}
    `;
export type DeleteGigMutationFn = Apollo.MutationFunction<DeleteGigMutation, DeleteGigMutationVariables>;

/**
 * __useDeleteGigMutation__
 *
 * To run a mutation, you first call `useDeleteGigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteGigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteGigMutation, { data, loading, error }] = useDeleteGigMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteGigMutation(baseOptions?: Apollo.MutationHookOptions<DeleteGigMutation, DeleteGigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteGigMutation, DeleteGigMutationVariables>(DeleteGigDocument, options);
      }
export type DeleteGigMutationHookResult = ReturnType<typeof useDeleteGigMutation>;
export type DeleteGigMutationResult = Apollo.MutationResult<DeleteGigMutation>;
export type DeleteGigMutationOptions = Apollo.BaseMutationOptions<DeleteGigMutation, DeleteGigMutationVariables>;
export const ListToolCategoriesDocument = gql`
    query ListToolCategories {
  listToolCategories {
    ...ToolCategoryFields
  }
}
    ${ToolCategoryFieldsFragmentDoc}`;

/**
 * __useListToolCategoriesQuery__
 *
 * To run a query within a React component, call `useListToolCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListToolCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListToolCategoriesQuery({
 *   variables: {
 *   },
 * });
 */
export function useListToolCategoriesQuery(baseOptions?: Apollo.QueryHookOptions<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>(ListToolCategoriesDocument, options);
      }
export function useListToolCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>(ListToolCategoriesDocument, options);
        }
// @ts-ignore
export function useListToolCategoriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>;
export function useListToolCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<ListToolCategoriesQuery | undefined, ListToolCategoriesQueryVariables>;
export function useListToolCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>(ListToolCategoriesDocument, options);
        }
export type ListToolCategoriesQueryHookResult = ReturnType<typeof useListToolCategoriesQuery>;
export type ListToolCategoriesLazyQueryHookResult = ReturnType<typeof useListToolCategoriesLazyQuery>;
export type ListToolCategoriesSuspenseQueryHookResult = ReturnType<typeof useListToolCategoriesSuspenseQuery>;
export type ListToolCategoriesQueryResult = Apollo.QueryResult<ListToolCategoriesQuery, ListToolCategoriesQueryVariables>;
export const CreateToolCategoryDocument = gql`
    mutation CreateToolCategory($input: ToolCategoryInput!) {
  createToolCategory(input: $input) {
    id
  }
}
    `;
export type CreateToolCategoryMutationFn = Apollo.MutationFunction<CreateToolCategoryMutation, CreateToolCategoryMutationVariables>;

/**
 * __useCreateToolCategoryMutation__
 *
 * To run a mutation, you first call `useCreateToolCategoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateToolCategoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createToolCategoryMutation, { data, loading, error }] = useCreateToolCategoryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateToolCategoryMutation(baseOptions?: Apollo.MutationHookOptions<CreateToolCategoryMutation, CreateToolCategoryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateToolCategoryMutation, CreateToolCategoryMutationVariables>(CreateToolCategoryDocument, options);
      }
export type CreateToolCategoryMutationHookResult = ReturnType<typeof useCreateToolCategoryMutation>;
export type CreateToolCategoryMutationResult = Apollo.MutationResult<CreateToolCategoryMutation>;
export type CreateToolCategoryMutationOptions = Apollo.BaseMutationOptions<CreateToolCategoryMutation, CreateToolCategoryMutationVariables>;
export const UpdateToolCategoryDocument = gql`
    mutation UpdateToolCategory($id: ID!, $input: ToolCategoryInput!) {
  updateToolCategory(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateToolCategoryMutationFn = Apollo.MutationFunction<UpdateToolCategoryMutation, UpdateToolCategoryMutationVariables>;

/**
 * __useUpdateToolCategoryMutation__
 *
 * To run a mutation, you first call `useUpdateToolCategoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateToolCategoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateToolCategoryMutation, { data, loading, error }] = useUpdateToolCategoryMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateToolCategoryMutation(baseOptions?: Apollo.MutationHookOptions<UpdateToolCategoryMutation, UpdateToolCategoryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateToolCategoryMutation, UpdateToolCategoryMutationVariables>(UpdateToolCategoryDocument, options);
      }
export type UpdateToolCategoryMutationHookResult = ReturnType<typeof useUpdateToolCategoryMutation>;
export type UpdateToolCategoryMutationResult = Apollo.MutationResult<UpdateToolCategoryMutation>;
export type UpdateToolCategoryMutationOptions = Apollo.BaseMutationOptions<UpdateToolCategoryMutation, UpdateToolCategoryMutationVariables>;
export const DeleteToolCategoryDocument = gql`
    mutation DeleteToolCategory($id: ID!) {
  deleteToolCategory(id: $id)
}
    `;
export type DeleteToolCategoryMutationFn = Apollo.MutationFunction<DeleteToolCategoryMutation, DeleteToolCategoryMutationVariables>;

/**
 * __useDeleteToolCategoryMutation__
 *
 * To run a mutation, you first call `useDeleteToolCategoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteToolCategoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteToolCategoryMutation, { data, loading, error }] = useDeleteToolCategoryMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteToolCategoryMutation(baseOptions?: Apollo.MutationHookOptions<DeleteToolCategoryMutation, DeleteToolCategoryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteToolCategoryMutation, DeleteToolCategoryMutationVariables>(DeleteToolCategoryDocument, options);
      }
export type DeleteToolCategoryMutationHookResult = ReturnType<typeof useDeleteToolCategoryMutation>;
export type DeleteToolCategoryMutationResult = Apollo.MutationResult<DeleteToolCategoryMutation>;
export type DeleteToolCategoryMutationOptions = Apollo.BaseMutationOptions<DeleteToolCategoryMutation, DeleteToolCategoryMutationVariables>;
export const ListToolsDocument = gql`
    query ListTools {
  listTools {
    ...ToolFields
  }
}
    ${ToolFieldsFragmentDoc}`;

/**
 * __useListToolsQuery__
 *
 * To run a query within a React component, call `useListToolsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListToolsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListToolsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListToolsQuery(baseOptions?: Apollo.QueryHookOptions<ListToolsQuery, ListToolsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListToolsQuery, ListToolsQueryVariables>(ListToolsDocument, options);
      }
export function useListToolsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListToolsQuery, ListToolsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListToolsQuery, ListToolsQueryVariables>(ListToolsDocument, options);
        }
// @ts-ignore
export function useListToolsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListToolsQuery, ListToolsQueryVariables>): Apollo.UseSuspenseQueryResult<ListToolsQuery, ListToolsQueryVariables>;
export function useListToolsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListToolsQuery, ListToolsQueryVariables>): Apollo.UseSuspenseQueryResult<ListToolsQuery | undefined, ListToolsQueryVariables>;
export function useListToolsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListToolsQuery, ListToolsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListToolsQuery, ListToolsQueryVariables>(ListToolsDocument, options);
        }
export type ListToolsQueryHookResult = ReturnType<typeof useListToolsQuery>;
export type ListToolsLazyQueryHookResult = ReturnType<typeof useListToolsLazyQuery>;
export type ListToolsSuspenseQueryHookResult = ReturnType<typeof useListToolsSuspenseQuery>;
export type ListToolsQueryResult = Apollo.QueryResult<ListToolsQuery, ListToolsQueryVariables>;
export const ListToolsPagedDocument = gql`
    query ListToolsPaged($input: TableQueryInput!) {
  listToolsPaged(input: $input) {
    totalCount
    rows {
      ...ToolFields
    }
  }
}
    ${ToolFieldsFragmentDoc}`;

/**
 * __useListToolsPagedQuery__
 *
 * To run a query within a React component, call `useListToolsPagedQuery` and pass it any options that fit your needs.
 * When your component renders, `useListToolsPagedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListToolsPagedQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListToolsPagedQuery(baseOptions: Apollo.QueryHookOptions<ListToolsPagedQuery, ListToolsPagedQueryVariables> & ({ variables: ListToolsPagedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListToolsPagedQuery, ListToolsPagedQueryVariables>(ListToolsPagedDocument, options);
      }
export function useListToolsPagedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListToolsPagedQuery, ListToolsPagedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListToolsPagedQuery, ListToolsPagedQueryVariables>(ListToolsPagedDocument, options);
        }
// @ts-ignore
export function useListToolsPagedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListToolsPagedQuery, ListToolsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListToolsPagedQuery, ListToolsPagedQueryVariables>;
export function useListToolsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListToolsPagedQuery, ListToolsPagedQueryVariables>): Apollo.UseSuspenseQueryResult<ListToolsPagedQuery | undefined, ListToolsPagedQueryVariables>;
export function useListToolsPagedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListToolsPagedQuery, ListToolsPagedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListToolsPagedQuery, ListToolsPagedQueryVariables>(ListToolsPagedDocument, options);
        }
export type ListToolsPagedQueryHookResult = ReturnType<typeof useListToolsPagedQuery>;
export type ListToolsPagedLazyQueryHookResult = ReturnType<typeof useListToolsPagedLazyQuery>;
export type ListToolsPagedSuspenseQueryHookResult = ReturnType<typeof useListToolsPagedSuspenseQuery>;
export type ListToolsPagedQueryResult = Apollo.QueryResult<ListToolsPagedQuery, ListToolsPagedQueryVariables>;
export const ListToolsStatsDocument = gql`
    query ListToolsStats {
  listToolsStats {
    total
    counts {
      field
      buckets {
        value
        count
      }
    }
    sums {
      field
      total
    }
  }
}
    `;

/**
 * __useListToolsStatsQuery__
 *
 * To run a query within a React component, call `useListToolsStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListToolsStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListToolsStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListToolsStatsQuery(baseOptions?: Apollo.QueryHookOptions<ListToolsStatsQuery, ListToolsStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListToolsStatsQuery, ListToolsStatsQueryVariables>(ListToolsStatsDocument, options);
      }
export function useListToolsStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListToolsStatsQuery, ListToolsStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListToolsStatsQuery, ListToolsStatsQueryVariables>(ListToolsStatsDocument, options);
        }
// @ts-ignore
export function useListToolsStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListToolsStatsQuery, ListToolsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListToolsStatsQuery, ListToolsStatsQueryVariables>;
export function useListToolsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListToolsStatsQuery, ListToolsStatsQueryVariables>): Apollo.UseSuspenseQueryResult<ListToolsStatsQuery | undefined, ListToolsStatsQueryVariables>;
export function useListToolsStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListToolsStatsQuery, ListToolsStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListToolsStatsQuery, ListToolsStatsQueryVariables>(ListToolsStatsDocument, options);
        }
export type ListToolsStatsQueryHookResult = ReturnType<typeof useListToolsStatsQuery>;
export type ListToolsStatsLazyQueryHookResult = ReturnType<typeof useListToolsStatsLazyQuery>;
export type ListToolsStatsSuspenseQueryHookResult = ReturnType<typeof useListToolsStatsSuspenseQuery>;
export type ListToolsStatsQueryResult = Apollo.QueryResult<ListToolsStatsQuery, ListToolsStatsQueryVariables>;
export const CreateToolDocument = gql`
    mutation CreateTool($input: ToolInput!) {
  createTool(input: $input) {
    id
  }
}
    `;
export type CreateToolMutationFn = Apollo.MutationFunction<CreateToolMutation, CreateToolMutationVariables>;

/**
 * __useCreateToolMutation__
 *
 * To run a mutation, you first call `useCreateToolMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateToolMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createToolMutation, { data, loading, error }] = useCreateToolMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateToolMutation(baseOptions?: Apollo.MutationHookOptions<CreateToolMutation, CreateToolMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateToolMutation, CreateToolMutationVariables>(CreateToolDocument, options);
      }
export type CreateToolMutationHookResult = ReturnType<typeof useCreateToolMutation>;
export type CreateToolMutationResult = Apollo.MutationResult<CreateToolMutation>;
export type CreateToolMutationOptions = Apollo.BaseMutationOptions<CreateToolMutation, CreateToolMutationVariables>;
export const UpdateToolDocument = gql`
    mutation UpdateTool($id: ID!, $input: ToolInput!) {
  updateTool(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateToolMutationFn = Apollo.MutationFunction<UpdateToolMutation, UpdateToolMutationVariables>;

/**
 * __useUpdateToolMutation__
 *
 * To run a mutation, you first call `useUpdateToolMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateToolMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateToolMutation, { data, loading, error }] = useUpdateToolMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateToolMutation(baseOptions?: Apollo.MutationHookOptions<UpdateToolMutation, UpdateToolMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateToolMutation, UpdateToolMutationVariables>(UpdateToolDocument, options);
      }
export type UpdateToolMutationHookResult = ReturnType<typeof useUpdateToolMutation>;
export type UpdateToolMutationResult = Apollo.MutationResult<UpdateToolMutation>;
export type UpdateToolMutationOptions = Apollo.BaseMutationOptions<UpdateToolMutation, UpdateToolMutationVariables>;
export const DeleteToolDocument = gql`
    mutation DeleteTool($id: ID!) {
  deleteTool(id: $id)
}
    `;
export type DeleteToolMutationFn = Apollo.MutationFunction<DeleteToolMutation, DeleteToolMutationVariables>;

/**
 * __useDeleteToolMutation__
 *
 * To run a mutation, you first call `useDeleteToolMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteToolMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteToolMutation, { data, loading, error }] = useDeleteToolMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteToolMutation(baseOptions?: Apollo.MutationHookOptions<DeleteToolMutation, DeleteToolMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteToolMutation, DeleteToolMutationVariables>(DeleteToolDocument, options);
      }
export type DeleteToolMutationHookResult = ReturnType<typeof useDeleteToolMutation>;
export type DeleteToolMutationResult = Apollo.MutationResult<DeleteToolMutation>;
export type DeleteToolMutationOptions = Apollo.BaseMutationOptions<DeleteToolMutation, DeleteToolMutationVariables>;
export const ListNavLinksDocument = gql`
    query ListNavLinks {
  listNavLinks {
    ...NavLinkFields
  }
}
    ${NavLinkFieldsFragmentDoc}`;

/**
 * __useListNavLinksQuery__
 *
 * To run a query within a React component, call `useListNavLinksQuery` and pass it any options that fit your needs.
 * When your component renders, `useListNavLinksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListNavLinksQuery({
 *   variables: {
 *   },
 * });
 */
export function useListNavLinksQuery(baseOptions?: Apollo.QueryHookOptions<ListNavLinksQuery, ListNavLinksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListNavLinksQuery, ListNavLinksQueryVariables>(ListNavLinksDocument, options);
      }
export function useListNavLinksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListNavLinksQuery, ListNavLinksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListNavLinksQuery, ListNavLinksQueryVariables>(ListNavLinksDocument, options);
        }
// @ts-ignore
export function useListNavLinksSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListNavLinksQuery, ListNavLinksQueryVariables>): Apollo.UseSuspenseQueryResult<ListNavLinksQuery, ListNavLinksQueryVariables>;
export function useListNavLinksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListNavLinksQuery, ListNavLinksQueryVariables>): Apollo.UseSuspenseQueryResult<ListNavLinksQuery | undefined, ListNavLinksQueryVariables>;
export function useListNavLinksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListNavLinksQuery, ListNavLinksQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListNavLinksQuery, ListNavLinksQueryVariables>(ListNavLinksDocument, options);
        }
export type ListNavLinksQueryHookResult = ReturnType<typeof useListNavLinksQuery>;
export type ListNavLinksLazyQueryHookResult = ReturnType<typeof useListNavLinksLazyQuery>;
export type ListNavLinksSuspenseQueryHookResult = ReturnType<typeof useListNavLinksSuspenseQuery>;
export type ListNavLinksQueryResult = Apollo.QueryResult<ListNavLinksQuery, ListNavLinksQueryVariables>;
export const CreateNavLinkDocument = gql`
    mutation CreateNavLink($input: NavLinkInput!) {
  createNavLink(input: $input) {
    id
  }
}
    `;
export type CreateNavLinkMutationFn = Apollo.MutationFunction<CreateNavLinkMutation, CreateNavLinkMutationVariables>;

/**
 * __useCreateNavLinkMutation__
 *
 * To run a mutation, you first call `useCreateNavLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNavLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNavLinkMutation, { data, loading, error }] = useCreateNavLinkMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateNavLinkMutation(baseOptions?: Apollo.MutationHookOptions<CreateNavLinkMutation, CreateNavLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNavLinkMutation, CreateNavLinkMutationVariables>(CreateNavLinkDocument, options);
      }
export type CreateNavLinkMutationHookResult = ReturnType<typeof useCreateNavLinkMutation>;
export type CreateNavLinkMutationResult = Apollo.MutationResult<CreateNavLinkMutation>;
export type CreateNavLinkMutationOptions = Apollo.BaseMutationOptions<CreateNavLinkMutation, CreateNavLinkMutationVariables>;
export const UpdateNavLinkDocument = gql`
    mutation UpdateNavLink($id: ID!, $input: NavLinkInput!) {
  updateNavLink(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateNavLinkMutationFn = Apollo.MutationFunction<UpdateNavLinkMutation, UpdateNavLinkMutationVariables>;

/**
 * __useUpdateNavLinkMutation__
 *
 * To run a mutation, you first call `useUpdateNavLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNavLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNavLinkMutation, { data, loading, error }] = useUpdateNavLinkMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateNavLinkMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNavLinkMutation, UpdateNavLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNavLinkMutation, UpdateNavLinkMutationVariables>(UpdateNavLinkDocument, options);
      }
export type UpdateNavLinkMutationHookResult = ReturnType<typeof useUpdateNavLinkMutation>;
export type UpdateNavLinkMutationResult = Apollo.MutationResult<UpdateNavLinkMutation>;
export type UpdateNavLinkMutationOptions = Apollo.BaseMutationOptions<UpdateNavLinkMutation, UpdateNavLinkMutationVariables>;
export const DeleteNavLinkDocument = gql`
    mutation DeleteNavLink($id: ID!) {
  deleteNavLink(id: $id)
}
    `;
export type DeleteNavLinkMutationFn = Apollo.MutationFunction<DeleteNavLinkMutation, DeleteNavLinkMutationVariables>;

/**
 * __useDeleteNavLinkMutation__
 *
 * To run a mutation, you first call `useDeleteNavLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNavLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNavLinkMutation, { data, loading, error }] = useDeleteNavLinkMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteNavLinkMutation(baseOptions?: Apollo.MutationHookOptions<DeleteNavLinkMutation, DeleteNavLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteNavLinkMutation, DeleteNavLinkMutationVariables>(DeleteNavLinkDocument, options);
      }
export type DeleteNavLinkMutationHookResult = ReturnType<typeof useDeleteNavLinkMutation>;
export type DeleteNavLinkMutationResult = Apollo.MutationResult<DeleteNavLinkMutation>;
export type DeleteNavLinkMutationOptions = Apollo.BaseMutationOptions<DeleteNavLinkMutation, DeleteNavLinkMutationVariables>;
export const ListWebsiteSubmissionsDocument = gql`
    query ListWebsiteSubmissions {
  listWebsiteSubmissions {
    ...WebsiteSubmissionFields
  }
}
    ${WebsiteSubmissionFieldsFragmentDoc}`;

/**
 * __useListWebsiteSubmissionsQuery__
 *
 * To run a query within a React component, call `useListWebsiteSubmissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListWebsiteSubmissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListWebsiteSubmissionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListWebsiteSubmissionsQuery(baseOptions?: Apollo.QueryHookOptions<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>(ListWebsiteSubmissionsDocument, options);
      }
export function useListWebsiteSubmissionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>(ListWebsiteSubmissionsDocument, options);
        }
// @ts-ignore
export function useListWebsiteSubmissionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>): Apollo.UseSuspenseQueryResult<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>;
export function useListWebsiteSubmissionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>): Apollo.UseSuspenseQueryResult<ListWebsiteSubmissionsQuery | undefined, ListWebsiteSubmissionsQueryVariables>;
export function useListWebsiteSubmissionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>(ListWebsiteSubmissionsDocument, options);
        }
export type ListWebsiteSubmissionsQueryHookResult = ReturnType<typeof useListWebsiteSubmissionsQuery>;
export type ListWebsiteSubmissionsLazyQueryHookResult = ReturnType<typeof useListWebsiteSubmissionsLazyQuery>;
export type ListWebsiteSubmissionsSuspenseQueryHookResult = ReturnType<typeof useListWebsiteSubmissionsSuspenseQuery>;
export type ListWebsiteSubmissionsQueryResult = Apollo.QueryResult<ListWebsiteSubmissionsQuery, ListWebsiteSubmissionsQueryVariables>;
export const TriageWebsiteSubmissionDocument = gql`
    mutation TriageWebsiteSubmission($id: ID!, $input: WebsiteSubmissionTriageInput!) {
  triageWebsiteSubmission(id: $id, input: $input) {
    id
    status
    notes
  }
}
    `;
export type TriageWebsiteSubmissionMutationFn = Apollo.MutationFunction<TriageWebsiteSubmissionMutation, TriageWebsiteSubmissionMutationVariables>;

/**
 * __useTriageWebsiteSubmissionMutation__
 *
 * To run a mutation, you first call `useTriageWebsiteSubmissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTriageWebsiteSubmissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [triageWebsiteSubmissionMutation, { data, loading, error }] = useTriageWebsiteSubmissionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useTriageWebsiteSubmissionMutation(baseOptions?: Apollo.MutationHookOptions<TriageWebsiteSubmissionMutation, TriageWebsiteSubmissionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TriageWebsiteSubmissionMutation, TriageWebsiteSubmissionMutationVariables>(TriageWebsiteSubmissionDocument, options);
      }
export type TriageWebsiteSubmissionMutationHookResult = ReturnType<typeof useTriageWebsiteSubmissionMutation>;
export type TriageWebsiteSubmissionMutationResult = Apollo.MutationResult<TriageWebsiteSubmissionMutation>;
export type TriageWebsiteSubmissionMutationOptions = Apollo.BaseMutationOptions<TriageWebsiteSubmissionMutation, TriageWebsiteSubmissionMutationVariables>;
export const DeleteWebsiteSubmissionDocument = gql`
    mutation DeleteWebsiteSubmission($id: ID!) {
  deleteWebsiteSubmission(id: $id)
}
    `;
export type DeleteWebsiteSubmissionMutationFn = Apollo.MutationFunction<DeleteWebsiteSubmissionMutation, DeleteWebsiteSubmissionMutationVariables>;

/**
 * __useDeleteWebsiteSubmissionMutation__
 *
 * To run a mutation, you first call `useDeleteWebsiteSubmissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteWebsiteSubmissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteWebsiteSubmissionMutation, { data, loading, error }] = useDeleteWebsiteSubmissionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteWebsiteSubmissionMutation(baseOptions?: Apollo.MutationHookOptions<DeleteWebsiteSubmissionMutation, DeleteWebsiteSubmissionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteWebsiteSubmissionMutation, DeleteWebsiteSubmissionMutationVariables>(DeleteWebsiteSubmissionDocument, options);
      }
export type DeleteWebsiteSubmissionMutationHookResult = ReturnType<typeof useDeleteWebsiteSubmissionMutation>;
export type DeleteWebsiteSubmissionMutationResult = Apollo.MutationResult<DeleteWebsiteSubmissionMutation>;
export type DeleteWebsiteSubmissionMutationOptions = Apollo.BaseMutationOptions<DeleteWebsiteSubmissionMutation, DeleteWebsiteSubmissionMutationVariables>;