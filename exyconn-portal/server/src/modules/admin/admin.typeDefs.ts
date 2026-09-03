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
  }

  enum EmploymentStatus {
    ACTIVE
    ON_LEAVE
    TERMINATED
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
