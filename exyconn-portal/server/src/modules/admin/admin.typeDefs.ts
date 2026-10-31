import gql from 'graphql-tag';

export const adminTypeDefs = gql`
  # Must stay in sync with src/constants/roles.ts — a role missing here fails enum
  # serialization on the me/login queries for anyone who holds it.
  enum Role {
    SUPER_ADMIN
    ADMIN
    EMPLOYEE
    FINANCE
    SUPPORT
    CRM
    PRODUCTS
    LEGAL
    HR
    MARKETING
    PROJECTS
    AI
    WEBSITE
    TRACKER
    TECH
    IT
    COMPLIANCE
    AGENTS
  }

  enum EmploymentStatus {
    ACTIVE
    ON_LEAVE
    TERMINATED
  }

  "When an employee is expected to work. OTHER is described in workingTimeNote."
  enum WorkingTime {
    FLEXIBLE
    FIXED
    OTHER
  }

  "Where an employee is expected to work from. OTHER is described in workLocationNote."
  enum WorkLocation {
    OFFICE
    HOME
    HYBRID
    OTHER
  }

  "Public profiles a person shares — each an http(s) address, null when not given."
  type UserSocialLinks {
    linkedin: String
    github: String
    twitter: String
    website: String
  }

  "Which of an employee's two addresses a verification code is for."
  enum EmployeeEmailKind {
    "The work address the person signs in with (User.email)."
    OFFICIAL
    "The personal address HR keeps on file (User.personalEmail)."
    PERSONAL
  }

  "The workspace's working week."
  type WorkWeek {
    "Days of the week people work unless HR set their own: 0 is Sunday, 6 is Saturday."
    defaultWorkDays: [Int!]!
  }

  type User {
    id: ID!
    name: String!
    "The official (work) address the person signs in with."
    email: String!
    "When the official address was proven by a code sent to it. Cleared when it changes."
    emailVerifiedAt: DateTime
    "A personal address HR keeps on file. Never used to sign in."
    personalEmail: String
    "When the personal address was proven by a code sent to it. Cleared when it changes."
    personalEmailVerifiedAt: DateTime
    roles: [Role!]!
    avatarUrl: String
    isActive: Boolean!
    isBlocked: Boolean!
    blockReason: String
    department: String
    designation: String
    "Office or site this person works at, by the location's code. Empty when not set."
    locationCode: String
    "Team inside the department. Empty when not set."
    teamName: String
    "Job grade or band, by code. Empty when not set."
    gradeCode: String
    "Kind of employment, by code — permanent, contract, intern. Empty when not set."
    employmentTypeCode: String
    "Working-hours pattern, by code. Empty when not set."
    shiftCode: String
    joinDate: DateTime
    dateOfBirth: DateTime
    "The day this employee comes off probation. Null when they are not on one."
    probationEndDate: DateTime
    employmentStatus: EmploymentStatus!
    address: String
    "A few lines about the person, shown on their profile across the portals."
    brief: String
    "A number colleagues can reach the person on; set by the person in their profile."
    phone: String
    "Public profiles the person chose to share. Null when they have shared none."
    socialLinks: UserSocialLinks
    "The last time the person used any portal or app."
    lastActiveAt: DateTime
    "Whether the person used a portal or app within the last few minutes."
    isOnline: Boolean!
    "The user this person reports to; their manager may approve leave and requests."
    managerId: String
    "Resolved from managerId for display; null when nobody is set."
    managerName: String
    """
    Where this person is and what language they read. Null means "whatever the workspace
    default is", so moving the house timezone moves everybody who never expressed a
    preference. HR sets them when the account is created; the person can change their own.
    """
    timezone: String
    locale: String
    "The person's own date pattern (date-fns); null follows the workspace's."
    dateFormat: String
    "The person's own time pattern (date-fns); null follows the workspace's."
    timeFormat: String
    """
    ISO 3166-1 alpha-2 country the person is employed in, which decides their leave quotas
    and holidays. Null follows the company's country. Set by HR only.
    """
    country: String
    "The state or region the person works in, which decides regional holidays. Set by HR only."
    region: String
    "The city the person works in, which decides their city holidays. Set by HR only."
    city: String
    "Nullable because accounts created before the working arrangement existed have none."
    workingTime: WorkingTime
    workingTimeNote: String
    workLocation: WorkLocation
    workLocationNote: String
    """
    The contracted working day, in hours. Every arrangement has one — flexible moves the
    clock time, not the length of the day. Null on accounts that predate the field; readers
    fall back to the house default of 8.
    """
    workHoursPerDay: Int
    "The days this person works (0 is Sunday). Null when they follow the workspace's week."
    workDays: [Int!]
    "The days this person works: their own week, else the workspace's."
    effectiveWorkDays: [Int!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AppSettings {
    id: ID!
    dateFormat: String!
    timeFormat: String!
    timezone: String!
    "The language the portal is shown in when a person has not chosen one. BCP-47."
    defaultLocale: String!
    "The languages this workspace offers in its pickers."
    enabledLocales: [String!]!
    "Machine-translate a string the first time a screen needs one and none exists."
    autoTranslate: Boolean!
    "Days of audit history kept. Zero keeps it for ever, which is the default."
    auditRetentionDays: Int!
    "The company's own money: an ISO 4217 code. Empty for a platform administrator."
    currency: String!
    "ISO 3166-1 alpha-2 country the company operates in, or empty."
    country: String!
    "The month its financial year opens: 1 is January, 4 is April."
    fiscalYearStartMonth: Int!
    "Whose tax rules its invoices and payroll follow."
    taxSystem: TaxSystem!
  }

  "Just enough of an active employee to put them in a picker — readable by any signed-in user."
  type EmployeeOption {
    id: ID!
    name: String!
    email: String!
    designation: String
    department: String
  }

  "A person as records name them; isActive is false once the account is deactivated or deleted."
  type EmployeeName {
    id: ID!
    name: String!
    isActive: Boolean!
  }

  "One person in the org chart; the client nests them by managerId."
  type OrgNode {
    id: ID!
    name: String!
    designation: String
    department: String
    avatarUrl: String
    managerId: String
  }

  "A newly-created user together with the one-time temporary password (also emailed)."
  type UserCredentials {
    user: User!
    password: String!
  }

  "One page of users for the server-side Users grid."
  type UserPage {
    rows: [User!]!
    totalCount: Int!
  }

  input CreateUserInput {
    name: String!
    email: String!
    roles: [Role!]!
    isActive: Boolean
    department: String
    designation: String
    "Office or site this person works at, by the location's code. Empty when not set."
    locationCode: String
    "Team inside the department. Empty when not set."
    teamName: String
    "Job grade or band, by code. Empty when not set."
    gradeCode: String
    "Kind of employment, by code — permanent, contract, intern. Empty when not set."
    employmentTypeCode: String
    "Working-hours pattern, by code. Empty when not set."
    shiftCode: String
    joinDate: DateTime
    dateOfBirth: DateTime
    probationEndDate: DateTime
    employmentStatus: EmploymentStatus
    avatarUrl: String
    address: String
    brief: String
    managerId: String
    workingTime: WorkingTime
    workingTimeNote: String
    workLocation: WorkLocation
    workLocationNote: String
    workHoursPerDay: Int
    "Days of the week they work, 0 is Sunday. Null follows the workspace's week."
    workDays: [Int!]
    "A personal address to keep on file; null or empty clears it."
    personalEmail: String
    "IANA zone name, or null to follow the workspace default."
    timezone: String
    "BCP-47 tag, or null to follow the workspace default."
    locale: String
    "ISO 3166-1 alpha-2, or null to follow the company's country."
    country: String
    "The state or region they work in, for regional holidays; null when not set."
    region: String
    "The city they work in, for city holidays; null when not set."
    city: String
  }

  input UpdateUserInput {
    name: String
    email: String
    password: String
    roles: [Role!]
    isActive: Boolean
    department: String
    designation: String
    "Office or site this person works at, by the location's code. Empty when not set."
    locationCode: String
    "Team inside the department. Empty when not set."
    teamName: String
    "Job grade or band, by code. Empty when not set."
    gradeCode: String
    "Kind of employment, by code — permanent, contract, intern. Empty when not set."
    employmentTypeCode: String
    "Working-hours pattern, by code. Empty when not set."
    shiftCode: String
    joinDate: DateTime
    dateOfBirth: DateTime
    probationEndDate: DateTime
    employmentStatus: EmploymentStatus
    avatarUrl: String
    address: String
    brief: String
    managerId: String
    workingTime: WorkingTime
    workingTimeNote: String
    workLocation: WorkLocation
    workLocationNote: String
    workHoursPerDay: Int
    "Days of the week they work, 0 is Sunday. Null follows the workspace's week."
    workDays: [Int!]
    "A personal address to keep on file; null or empty clears it."
    personalEmail: String
    "IANA zone name, or null to follow the workspace default."
    timezone: String
    "BCP-47 tag, or null to follow the workspace default."
    locale: String
    "ISO 3166-1 alpha-2, or null to follow the company's country."
    country: String
    "The state or region they work in, for regional holidays; null when not set."
    region: String
    "The city they work in, for city holidays; null when not set."
    city: String
  }

  input UpdateSettingsInput {
    dateFormat: String
    timeFormat: String
    timezone: String
    defaultLocale: String
    enabledLocales: [String!]
    autoTranslate: Boolean
    "Days of audit history to keep. Zero keeps it for ever."
    auditRetentionDays: Int
  }

  input SendMailInput {
    subject: String!
    "The body as rich text (HTML). It is sanitised before it is sent."
    message: String!
    "Copied in, visibly. Up to 20 addresses."
    cc: [String!]
    "Copied in, unseen by the others. Up to 20 addresses."
    bcc: [String!]
    "Files already uploaded to the portal's CDN, attached to the email. Up to 10."
    attachments: [FileAttachmentInput!]
  }

  extend type Query {
    listUsers: [User!]!
    listUsersPaged(input: TableQueryInput!): UserPage!
    listUsersStats: TableStats!
    getUser(id: ID!): User!
    "Active employees for pickers in any portal; the full employee record stays HR's (listUsers)."
    listEmployeeOptions: [EmployeeOption!]!
    "Every person's name, deleted accounts included, to show whose a record is."
    listEmployeeNames: [EmployeeName!]!
    "The signed-in user's manager, if one is set."
    myManager: EmployeeOption
    "Everyone who reports to the signed-in user."
    myDirectReports: [EmployeeOption!]!
    "HR/ADMIN: every active user with their managerId, for the org chart."
    orgChart: [OrgNode!]!
    "Reads the workspace's date, time, timezone and language defaults. Any signed-in person."
    appSettings: AppSettings!
    "The workspace's working week. Readable by any signed-in person."
    workWeek: WorkWeek!
  }

  extend type Mutation {
    "Creates a user, emails a temporary password, and returns it once for copying."
    createUser(input: CreateUserInput!): UserCredentials!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    "ADMIN: activates or deactivates a user. A deactivated user cannot sign in. Audited."
    setUserActive(id: ID!, isActive: Boolean!): User!
    "ADMIN: blocks or unblocks a user's sign-in, keeping the reason while blocked. Audited."
    setUserBlocked(
      id: ID!
      isBlocked: Boolean!
      "Why the user is blocked. Ignored when unblocking."
      reason: String
    ): User!
    "Generates a new temporary password, emails it, and returns it once for copying."
    resetUserPassword(id: ID!): String!
    "ADMIN: emails a custom message to one user, with optional CC, BCC and portal-hosted files. Confirm the text with the person before sending."
    sendUserMail(id: ID!, input: SendMailInput!): Boolean!
    "ADMIN: changes the workspace's date, time, timezone, language and audit-retention defaults for everyone. Audited."
    updateSettings(input: UpdateSettingsInput!): AppSettings!
    "HR/ADMIN: sets the days people work unless HR gave them their own week. At least one day."
    setDefaultWorkDays(days: [Int!]!): WorkWeek!
    "HR/ADMIN: emails a six-digit code to one of an employee's addresses to prove it is theirs."
    requestEmployeeEmailCode(employeeId: ID!, kind: EmployeeEmailKind!): Boolean!
    "HR/ADMIN: checks the code the employee read out and marks that address verified."
    verifyEmployeeEmailCode(employeeId: ID!, kind: EmployeeEmailKind!, code: String!): User!
  }
`;
