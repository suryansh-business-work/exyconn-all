import gql from 'graphql-tag';

export const adminTypeDefs = gql`
  # Must stay in sync with src/constants/roles.ts — a role missing here fails enum
  # serialization on the me/login queries for anyone who holds it.
  enum Role {
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
    joinDate: DateTime
    dateOfBirth: DateTime
    employmentStatus: EmploymentStatus!
    address: String
    "A few lines about the person, shown on their profile across the portals."
    brief: String
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
    joinDate: DateTime
    dateOfBirth: DateTime
    employmentStatus: EmploymentStatus
    avatarUrl: String
    address: String
    brief: String
    workingTime: WorkingTime
    workingTimeNote: String
    workLocation: WorkLocation
    workLocationNote: String
    workHoursPerDay: Int
  }

  input UpdateUserInput {
    name: String
    email: String
    password: String
    roles: [Role!]
    isActive: Boolean
    department: String
    designation: String
    joinDate: DateTime
    dateOfBirth: DateTime
    employmentStatus: EmploymentStatus
    avatarUrl: String
    address: String
    brief: String
    workingTime: WorkingTime
    workingTimeNote: String
    workLocation: WorkLocation
    workLocationNote: String
    workHoursPerDay: Int
  }

  input UpdateSettingsInput {
    dateFormat: String
    timeFormat: String
    timezone: String
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
