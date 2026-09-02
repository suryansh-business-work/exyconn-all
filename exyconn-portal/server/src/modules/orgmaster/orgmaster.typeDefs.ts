import gql from 'graphql-tag';

/** Organisation master data: locations, teams, grades, employment types, shifts. */
export const orgMasterTypeDefs = gql`
  type Location {
    id: ID!
    name: String!
    code: String!
    city: String!
    state: String!
    country: String!
    timezone: String!
    address: String!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input LocationInput {
    name: String!
    code: String!
    city: String!
    state: String!
    country: String!
    timezone: String!
    address: String!
    active: Boolean!
  }

  type LocationPage {
    rows: [Location!]!
    totalCount: Int!
  }
  type Team {
    id: ID!
    name: String!
    department: String!
    leadEmployeeId: String
    description: String!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input TeamInput {
    name: String!
    department: String!
    leadEmployeeId: String
    description: String!
    active: Boolean!
  }

  type TeamPage {
    rows: [Team!]!
    totalCount: Int!
  }
  type Grade {
    id: ID!
    name: String!
    code: String!
    level: Int!
    minSalary: Float!
    maxSalary: Float!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input GradeInput {
    name: String!
    code: String!
    level: Int!
    minSalary: Float!
    maxSalary: Float!
    active: Boolean!
  }

  type GradePage {
    rows: [Grade!]!
    totalCount: Int!
  }
  type EmploymentType {
    id: ID!
    name: String!
    code: String!
    description: String!
    payrollEligible: Boolean!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input EmploymentTypeInput {
    name: String!
    code: String!
    description: String!
    payrollEligible: Boolean!
    active: Boolean!
  }

  type EmploymentTypePage {
    rows: [EmploymentType!]!
    totalCount: Int!
  }
  type Shift {
    id: ID!
    name: String!
    code: String!
    startTime: String!
    endTime: String!
    breakMinutes: Int!
    graceMinutes: Int!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ShiftInput {
    name: String!
    code: String!
    startTime: String!
    endTime: String!
    breakMinutes: Int!
    graceMinutes: Int!
    active: Boolean!
  }

  type ShiftPage {
    rows: [Shift!]!
    totalCount: Int!
  }

  extend type Query {
    listLocations: [Location!]!
    listLocationsPaged(input: TableQueryInput!): LocationPage!
    listLocationsStats: TableStats!
    getLocation(id: ID!): Location!
    listTeams: [Team!]!
    listTeamsPaged(input: TableQueryInput!): TeamPage!
    listTeamsStats: TableStats!
    getTeam(id: ID!): Team!
    listGrades: [Grade!]!
    listGradesPaged(input: TableQueryInput!): GradePage!
    listGradesStats: TableStats!
    getGrade(id: ID!): Grade!
    listEmploymentTypes: [EmploymentType!]!
    listEmploymentTypesPaged(input: TableQueryInput!): EmploymentTypePage!
    listEmploymentTypesStats: TableStats!
    getEmploymentType(id: ID!): EmploymentType!
    listShifts: [Shift!]!
    listShiftsPaged(input: TableQueryInput!): ShiftPage!
    listShiftsStats: TableStats!
    getShift(id: ID!): Shift!
  }

  extend type Mutation {
    createLocation(input: LocationInput!): Location!
    updateLocation(id: ID!, input: LocationInput!): Location!
    deleteLocation(id: ID!): Boolean!
    createTeam(input: TeamInput!): Team!
    updateTeam(id: ID!, input: TeamInput!): Team!
    deleteTeam(id: ID!): Boolean!
    createGrade(input: GradeInput!): Grade!
    updateGrade(id: ID!, input: GradeInput!): Grade!
    deleteGrade(id: ID!): Boolean!
    createEmploymentType(input: EmploymentTypeInput!): EmploymentType!
    updateEmploymentType(id: ID!, input: EmploymentTypeInput!): EmploymentType!
    deleteEmploymentType(id: ID!): Boolean!
    createShift(input: ShiftInput!): Shift!
    updateShift(id: ID!, input: ShiftInput!): Shift!
    deleteShift(id: ID!): Boolean!
  }
`;
