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
  done: Scalars['Boolean']['input'];
  dueDate: InputMaybe<Scalars['DateTime']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  relatedId: InputMaybe<Scalars['String']['input']>;
  relatedName: InputMaybe<Scalars['String']['input']>;
  relatedType: ActivitySubject;
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
  | 'NOTICE'
  | 'POLICY'
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
  type: LeaveType;
};

export type ApprovalDecision =
  | 'APPROVED'
  | 'REJECTED';

export type AssetCategory =
  | 'DESKTOP'
  | 'LAPTOP'
  | 'MONITOR'
  | 'NETWORK'
  | 'OTHER'
  | 'PERIPHERAL'
  | 'PHONE'
  | 'SOFTWARE_LICENCE'
  | 'TABLET';

export type AssetInput = {
  assetTag: Scalars['String']['input'];
  assignedToId: InputMaybe<Scalars['String']['input']>;
  assignedToName: InputMaybe<Scalars['String']['input']>;
  category: AssetCategory;
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

export type AttendanceStatus =
  | 'ABSENT'
  | 'HALF_DAY'
  | 'PRESENT'
  | 'WFH';

export type AudienceListInput = {
  clientIds: InputMaybe<Array<Scalars['String']['input']>>;
  contactIds: InputMaybe<Array<Scalars['String']['input']>>;
  description: InputMaybe<Scalars['String']['input']>;
  dynamicSegment: InputMaybe<AudienceSegment>;
  name: Scalars['String']['input'];
  segmentValue: InputMaybe<Scalars['String']['input']>;
};

/** Which register a resolved member came out of. */
export type AudienceMemberKind =
  | 'CLIENT'
  | 'CONTACT';

/** A rule that picks audience members without anybody maintaining the list. */
export type AudienceSegment =
  | 'ALL_ACTIVE_CLIENTS'
  | 'ALL_ACTIVE_CONTACTS'
  | 'CONTACTS_BY_COMPANY_STATUS'
  | 'NONE';

export type AuditAction =
  | 'ACCESS'
  | 'CREATE'
  | 'DELETE'
  | 'LOGIN'
  | 'PASSWORD_RESET'
  | 'PERMISSION'
  | 'ROLE_CHANGE'
  | 'SETTINGS'
  | 'UPDATE';

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

export type BlogAuthorInput = {
  initials: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  role: InputMaybe<Scalars['String']['input']>;
};

export type BlogPostInput = {
  author: BlogAuthorInput;
  content: InputMaybe<Scalars['String']['input']>;
  coverImage: InputMaybe<Scalars['String']['input']>;
  featured: InputMaybe<Scalars['Boolean']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  publishedAt: InputMaybe<Scalars['DateTime']['input']>;
  readTime: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  summary: InputMaybe<Scalars['String']['input']>;
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type BrandingInput = {
  accentColor: InputMaybe<Scalars['String']['input']>;
  address: InputMaybe<Scalars['String']['input']>;
  addressLine: InputMaybe<Scalars['String']['input']>;
  appIconUrl: InputMaybe<Scalars['String']['input']>;
  backgroundColor: InputMaybe<Scalars['String']['input']>;
  bankDetails: InputMaybe<Scalars['String']['input']>;
  businessName: InputMaybe<Scalars['String']['input']>;
  contactPhone: InputMaybe<Scalars['String']['input']>;
  copyrightText: InputMaybe<Scalars['String']['input']>;
  defaultTaxPercent: InputMaybe<Scalars['Float']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  emailLogoUrl: InputMaybe<Scalars['String']['input']>;
  facebookUrl: InputMaybe<Scalars['String']['input']>;
  faviconUrl: InputMaybe<Scalars['String']['input']>;
  githubUrl: InputMaybe<Scalars['String']['input']>;
  gstin: InputMaybe<Scalars['String']['input']>;
  hrEmail: InputMaybe<Scalars['String']['input']>;
  instagramUrl: InputMaybe<Scalars['String']['input']>;
  invoicePrefix: InputMaybe<Scalars['String']['input']>;
  legalName: InputMaybe<Scalars['String']['input']>;
  linkedinUrl: InputMaybe<Scalars['String']['input']>;
  loginPages: InputMaybe<Array<LoginPageInput>>;
  logoDarkUrl: InputMaybe<Scalars['String']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
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
  assigneeId: Scalars['String']['input'];
  description: Scalars['String']['input'];
  dueDate: Scalars['DateTime']['input'];
  projectId: InputMaybe<Scalars['String']['input']>;
  severity: BugSeverity;
  status: BugStatus;
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

export type CampaignChannel =
  | 'DISPLAY'
  | 'EMAIL'
  | 'SEARCH'
  | 'SOCIAL';

export type CampaignInput = {
  body: InputMaybe<Scalars['String']['input']>;
  budget: Scalars['Float']['input'];
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

export type CampaignSendStatus =
  | 'FAILED'
  | 'SENT'
  | 'SKIPPED';

export type CampaignStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'PAUSED'
  | 'PLANNED';

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
  coverImage: InputMaybe<Scalars['String']['input']>;
  excerpt: InputMaybe<Scalars['String']['input']>;
  featured: InputMaybe<Scalars['Boolean']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  pdfUrl: InputMaybe<Scalars['String']['input']>;
  publishedAt: InputMaybe<Scalars['DateTime']['input']>;
  slug: Scalars['String']['input'];
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type ClientInput = {
  billingAddress: InputMaybe<Scalars['String']['input']>;
  company: Scalars['String']['input'];
  email: Scalars['String']['input'];
  gstin: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  stateCode: InputMaybe<Scalars['String']['input']>;
  status: ClientStatus;
};

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
  domain: Scalars['String']['input'];
  industry: InputMaybe<Scalars['String']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  /** One of COMPANY_SIZES (11-50, and so on). A string, because 1-10 is not a valid enum name. */
  size: Scalars['String']['input'];
  status: CompanyStatus;
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

export type ContactInput = {
  companyId: InputMaybe<Scalars['String']['input']>;
  companyName: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  status: ContactStatus;
  title: InputMaybe<Scalars['String']['input']>;
};

export type ContactStatus =
  | 'ACTIVE'
  | 'BOUNCED'
  | 'LEFT_COMPANY'
  | 'UNSUBSCRIBED';

export type ContractInput = {
  effectiveDate: Scalars['DateTime']['input'];
  expiryDate: Scalars['DateTime']['input'];
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

export type CreateUserInput = {
  address: InputMaybe<Scalars['String']['input']>;
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  brief: InputMaybe<Scalars['String']['input']>;
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  department: InputMaybe<Scalars['String']['input']>;
  designation: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  employmentStatus: InputMaybe<EmploymentStatus>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  joinDate: InputMaybe<Scalars['DateTime']['input']>;
  /** BCP-47 tag, or null to follow the workspace default. */
  locale: InputMaybe<Scalars['String']['input']>;
  managerId: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  probationEndDate: InputMaybe<Scalars['DateTime']['input']>;
  roles: Array<Role>;
  /** IANA zone name, or null to follow the workspace default. */
  timezone: InputMaybe<Scalars['String']['input']>;
  workHoursPerDay: InputMaybe<Scalars['Int']['input']>;
  workLocation: InputMaybe<WorkLocation>;
  workLocationNote: InputMaybe<Scalars['String']['input']>;
  workingTime: InputMaybe<WorkingTime>;
  workingTimeNote: InputMaybe<Scalars['String']['input']>;
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
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

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

export type EmailConfigInput = {
  fromAddress: Scalars['String']['input'];
  host: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
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

export type EmployeeDocumentInput = {
  employeeId: Scalars['String']['input'];
  issuedOn: Scalars['DateTime']['input'];
  kind: DocumentKind;
  title: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

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

export type FilterOp =
  | 'CONTAINS'
  | 'EQUALS'
  | 'GT'
  | 'LT'
  | 'STARTS_WITH';

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
  shortDescription: InputMaybe<Scalars['String']['input']>;
  status: Scalars['String']['input'];
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type GithubConfigInput = {
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  owner: Scalars['String']['input'];
  repo: Scalars['String']['input'];
  token: Scalars['String']['input'];
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

export type GradeInput = {
  active: Scalars['Boolean']['input'];
  code: Scalars['String']['input'];
  level: Scalars['Int']['input'];
  maxSalary: Scalars['Float']['input'];
  minSalary: Scalars['Float']['input'];
  name: Scalars['String']['input'];
};

export type HolidayInput = {
  date: Scalars['DateTime']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  type: HolidayType;
};

export type HolidayType =
  | 'OPTIONAL'
  | 'PUBLIC'
  | 'RESTRICTED';

export type ImageConfigInput = {
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
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
  shortJobDescription: InputMaybe<Scalars['String']['input']>;
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

export type LeadInput = {
  /** Attribution. The campaign's name is filled in by the server from this id. */
  campaignId: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['String']['input'];
  source: LeadSource;
  stage: LeadStage;
  value: Scalars['Float']['input'];
};

export type LeadSource =
  | 'ADS'
  | 'EVENT'
  | 'REFERRAL'
  | 'WEBSITE';

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
  paid: Scalars['Boolean']['input'];
};

export type LeaveRequestInput = {
  employeeId: Scalars['String']['input'];
  fromDate: Scalars['DateTime']['input'];
  reason: Scalars['String']['input'];
  status: LeaveStatus;
  toDate: Scalars['DateTime']['input'];
  type: LeaveType;
};

export type LeaveStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

export type LeaveType =
  | 'CASUAL'
  | 'EARNED'
  | 'SICK'
  | 'UNPAID';

export type LegalDocumentInput = {
  category: DocumentCategory;
  fileUrl: InputMaybe<Scalars['String']['input']>;
  owner: InputMaybe<Scalars['String']['input']>;
  status: DocumentStatus;
  title: Scalars['String']['input'];
};

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

/** Employee-facing attendance entry — the server sets employeeId. */
export type MarkAttendanceInput = {
  date: Scalars['DateTime']['input'];
  note: InputMaybe<Scalars['String']['input']>;
  status: AttendanceStatus;
};

export type MarketingSuppressionInput = {
  email: Scalars['String']['input'];
  reason: SuppressionReason;
  source: InputMaybe<Scalars['String']['input']>;
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

export type NavLinkInput = {
  category: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  href: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  keywords: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  order: InputMaybe<Scalars['Int']['input']>;
};

export type NotificationAudience =
  | 'ALL'
  | 'DEPARTMENT'
  | 'EMPLOYEES';

export type NotificationKind =
  | 'ANNOUNCEMENT'
  | 'GENERAL'
  | 'GOAL'
  | 'LEAVE'
  | 'ONBOARDING'
  | 'PAYROLL'
  | 'PERFORMANCE'
  | 'REQUEST'
  | 'SOCIAL_COMMENT'
  | 'SOCIAL_LIKE'
  | 'SOCIAL_SHARE'
  | 'TRAINING';

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
  apiKey: Scalars['String']['input'];
  defaultModel: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

/** How an employee is paid. Decides which amounts on the salary structure mean anything. */
export type PayType =
  | 'FIXED'
  | 'HOURLY'
  | 'OTHER'
  | 'STIPEND';

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

export type PolicyInput = {
  audience: PolicyAudience;
  body: Scalars['String']['input'];
  effectiveDate: Scalars['DateTime']['input'];
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
  department: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

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

export type Role =
  | 'ADMIN'
  | 'AI'
  | 'CRM'
  | 'EMPLOYEE'
  | 'FINANCE'
  | 'HR'
  | 'IT'
  | 'LEGAL'
  | 'MARKETING'
  | 'PRODUCTS'
  | 'PROJECTS'
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
  /** Percent of taxable pay withheld for this person; 0 falls back to the company rate. */
  tdsPercent: InputMaybe<Scalars['Float']['input']>;
};

export type SendMailInput = {
  message: Scalars['String']['input'];
  subject: Scalars['String']['input'];
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
  botToken: Scalars['String']['input'];
  defaultChannel: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
};

export type SlipStatus =
  | 'GENERATED'
  | 'PAID';

export type SocialPostInput = {
  body: Scalars['String']['input'];
  imageUrl: InputMaybe<Scalars['String']['input']>;
};

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
  attachments: InputMaybe<Array<TicketAttachmentInput>>;
  category: SupportCategory;
  description: Scalars['String']['input'];
  priority: SupportPriority;
  subject: Scalars['String']['input'];
};

/** Why an address is on the marketing suppression list. */
export type SuppressionReason =
  | 'BOUNCED'
  | 'MANUAL'
  | 'UNSUBSCRIBED';

export type TableFilterInput = {
  field: Scalars['String']['input'];
  op: FilterOp;
  value: Scalars['String']['input'];
};

/** Server-side pagination/sort/filter/search request. `page` is zero-indexed. */
export type TableQueryInput = {
  filters: InputMaybe<Array<TableFilterInput>>;
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  search: InputMaybe<Scalars['String']['input']>;
  sort: InputMaybe<TableSortInput>;
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

/** What a client sends when it posts a file: the server stamps who and when. */
export type TicketAttachmentInput = {
  contentType: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

/** How a ticket reached the desk. */
export type TicketChannel =
  /** Typed into the console by an agent, usually off a call. */
  | 'AGENT'
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

export type UpdateProfileInput = {
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  /** The language the portal is shown to this person in. Empty string follows the default. */
  locale: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  /**
   * The zone every date and time is shown to this person in. Empty string clears the
   * choice and follows the workspace default again.
   */
  timezone: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSettingsInput = {
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
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  department: InputMaybe<Scalars['String']['input']>;
  designation: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  employmentStatus: InputMaybe<EmploymentStatus>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  joinDate: InputMaybe<Scalars['DateTime']['input']>;
  /** BCP-47 tag, or null to follow the workspace default. */
  locale: InputMaybe<Scalars['String']['input']>;
  managerId: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  probationEndDate: InputMaybe<Scalars['DateTime']['input']>;
  roles: InputMaybe<Array<Role>>;
  /** IANA zone name, or null to follow the workspace default. */
  timezone: InputMaybe<Scalars['String']['input']>;
  workHoursPerDay: InputMaybe<Scalars['Int']['input']>;
  workLocation: InputMaybe<WorkLocation>;
  workLocationNote: InputMaybe<Scalars['String']['input']>;
  workingTime: InputMaybe<WorkingTime>;
  workingTimeNote: InputMaybe<Scalars['String']['input']>;
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

/** Where an employee is expected to work from. OTHER is described in workLocationNote. */
export type WorkLocation =
  | 'HOME'
  | 'HYBRID'
  | 'OFFICE'
  | 'OTHER';

/** When an employee is expected to work. OTHER is described in workingTimeNote. */
export type WorkingTime =
  | 'FIXED'
  | 'FLEXIBLE'
  | 'OTHER';

export type TrackerSettingsFieldsFragment = { intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, idleAutoPauseMinutes: number, screenshotMaxWidth: number, screenshotQuality: number, captureSoundEnabled: boolean, webcamEnabled: boolean, webcamCorner: string, syncIntervalMinutes: number, consentText: string, autoStartEnabled: boolean, autoStartHour: number, autoStopHour: number };

export type BrandingFieldsFragment = { businessName: string, legalName: string, slogan: string, logoUrl: string, logoDarkUrl: string, appIconUrl: string, faviconUrl: string, primaryColor: string, secondaryColor: string, accentColor: string, backgroundColor: string, textColor: string, supportEmail: string, websiteUrl: string, copyrightText: string };

export type WorkdayFieldsFragment = { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean };

export type PresenceFieldsFragment = { status: TrackerPresence, note: string, since: string | null };

export type MessageFieldsFragment = { id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string };

export type ManualEntryFieldsFragment = { id: string, projectName: string, taskKey: string, taskTitle: string, startedAt: string, endedAt: string, durationMs: number, note: string, status: TrackerManualEntryStatus, reviewNote: string };

export type TaskFieldsFragment = { id: string, key: string, title: string, assignedToMe: boolean };

export type TrackerMeFieldsFragment = { consentRequired: boolean, timezone: string, unreadMessages: number, user: { id: string, name: string, email: string }, settings: { intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, idleAutoPauseMinutes: number, screenshotMaxWidth: number, screenshotQuality: number, captureSoundEnabled: boolean, webcamEnabled: boolean, webcamCorner: string, syncIntervalMinutes: number, consentText: string, autoStartEnabled: boolean, autoStartHour: number, autoStopHour: number }, workProfile: { workingTime: WorkingTime, workingTimeNote: string, workLocation: WorkLocation, workLocationNote: string, workHoursPerDay: number, targetMs: number }, workday: { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean }, projects: Array<{ id: string, name: string, key: string }>, consentPolicy: { id: string, title: string, slug: string, summary: string, body: string, version: number, requiresAcknowledgement: boolean, acknowledged: boolean } | null, presence: { status: TrackerPresence, note: string, since: string | null }, notices: Array<{ id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string }> };

export type MyTrackerCalendarQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  timezone: Scalars['String']['input'];
}>;


export type MyTrackerCalendarQuery = { myTrackerCalendar: Array<{ date: string, activeMs: number, idleMs: number, keyCount: number, mouseCount: number, sessions: number }> };

export type MyTrackerDayQueryVariables = Exact<{
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type MyTrackerDayQuery = { myTrackerDay: { intervals: Array<{ activeMs: number, idleMs: number, keyCount: number, mouseCount: number }>, screenshots: Array<{ id: string, capturedAt: string, imageUrl: string, blurred: boolean, activityPercent: number }>, sessions: Array<{ id: string }> } };

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


export type TrackerMeQuery = { trackerMe: { consentRequired: boolean, timezone: string, unreadMessages: number, user: { id: string, name: string, email: string }, settings: { intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, idleAutoPauseMinutes: number, screenshotMaxWidth: number, screenshotQuality: number, captureSoundEnabled: boolean, webcamEnabled: boolean, webcamCorner: string, syncIntervalMinutes: number, consentText: string, autoStartEnabled: boolean, autoStartHour: number, autoStopHour: number }, workProfile: { workingTime: WorkingTime, workingTimeNote: string, workLocation: WorkLocation, workLocationNote: string, workHoursPerDay: number, targetMs: number }, workday: { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean }, projects: Array<{ id: string, name: string, key: string }>, consentPolicy: { id: string, title: string, slug: string, summary: string, body: string, version: number, requiresAcknowledgement: boolean, acknowledged: boolean } | null, presence: { status: TrackerPresence, note: string, since: string | null }, notices: Array<{ id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string }> } };

export type TrackerHeartbeatMutationVariables = Exact<{
  device: TrackerDeviceInput;
}>;


export type TrackerHeartbeatMutation = { trackerHeartbeat: { consentRequired: boolean, timezone: string, unreadMessages: number, user: { id: string, name: string, email: string }, settings: { intervalMinutes: number, screenshotsPerInterval: number, randomizeScreenshotTiming: boolean, blurScreenshots: boolean, trackWindowTitles: boolean, idleThresholdSeconds: number, idleAutoPauseMinutes: number, screenshotMaxWidth: number, screenshotQuality: number, captureSoundEnabled: boolean, webcamEnabled: boolean, webcamCorner: string, syncIntervalMinutes: number, consentText: string, autoStartEnabled: boolean, autoStartHour: number, autoStopHour: number }, workProfile: { workingTime: WorkingTime, workingTimeNote: string, workLocation: WorkLocation, workLocationNote: string, workHoursPerDay: number, targetMs: number }, workday: { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean }, projects: Array<{ id: string, name: string, key: string }>, consentPolicy: { id: string, title: string, slug: string, summary: string, body: string, version: number, requiresAcknowledgement: boolean, acknowledged: boolean } | null, presence: { status: TrackerPresence, note: string, since: string | null }, notices: Array<{ id: string, kind: TrackerMessageKind, direction: TrackerMessageDirection, title: string, body: string, authorName: string, readAt: string | null, createdAt: string }> } };

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
}>;


export type TrackerMarkAttendanceMutation = { trackerMarkAttendance: { date: string, targetMs: number, activeMs: number, attendanceStatus: AttendanceStatus | null, attendanceNote: string | null, attendanceMarked: boolean } };

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
export const MyTrackerCalendarDocument = new TypedDocumentString(`
    query MyTrackerCalendar($from: DateTime!, $to: DateTime!, $timezone: String!) {
  myTrackerCalendar(from: $from, to: $to, timezone: $timezone) {
    date
    activeMs
    idleMs
    keyCount
    mouseCount
    sessions
  }
}
    `) as unknown as TypedDocumentString<MyTrackerCalendarQuery, MyTrackerCalendarQueryVariables>;
export const MyTrackerDayDocument = new TypedDocumentString(`
    query MyTrackerDay($start: DateTime!, $end: DateTime!) {
  myTrackerDay(start: $start, end: $end) {
    intervals {
      activeMs
      idleMs
      keyCount
      mouseCount
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
    mutation TrackerMarkAttendance($status: AttendanceStatus!, $note: String) {
  trackerMarkAttendance(status: $status, note: $note) {
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