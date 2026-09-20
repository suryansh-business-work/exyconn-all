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

  type User {
    id: ID!
    name: String!
    email: String!
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
  }

  input SendMailInput {
    subject: String!
    message: String!
  }

  extend type Query {
    listUsers: [User!]!
    listUsersPaged(input: TableQueryInput!): UserPage!
    listUsersStats: TableStats!
    getUser(id: ID!): User!
    "Active employees for pickers in any portal; the full employee record stays HR's (listUsers)."
    listEmployeeOptions: [EmployeeOption!]!
    "The signed-in user's manager, if one is set."
    myManager: EmployeeOption
    "Everyone who reports to the signed-in user."
    myDirectReports: [EmployeeOption!]!
    "HR/ADMIN: every active user with their managerId, for the org chart."
    orgChart: [OrgNode!]!
    appSettings: AppSettings!
  }

  extend type Mutation {
    "Creates a user, emails a temporary password, and returns it once for copying."
    createUser(input: CreateUserInput!): UserCredentials!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    setUserActive(id: ID!, isActive: Boolean!): User!
    setUserBlocked(id: ID!, isBlocked: Boolean!, reason: String): User!
    "Generates a new temporary password, emails it, and returns it once for copying."
    resetUserPassword(id: ID!): String!
    sendUserMail(id: ID!, input: SendMailInput!): Boolean!
    updateSettings(input: UpdateSettingsInput!): AppSettings!
  }
`;
