import gql from 'graphql-tag';

export const hrTypeDefs = gql`
  enum LeaveType {
    CASUAL
    SICK
    EARNED
    UNPAID
  }
  enum LeaveStatus {
    PENDING
    APPROVED
    REJECTED
  }

  enum AttendanceStatus {
    PRESENT
    ABSENT
    WFH
    HALF_DAY
  }

  type Attendance {
    id: ID!
    employeeId: String!
    date: DateTime!
    status: AttendanceStatus!
    note: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type HeadcountPoint {
    label: String!
    count: Int!
  }

  type HrDashboard {
    totalEmployees: Int!
    activeEmployees: Int!
    onLeave: Int!
    headcount: [HeadcountPoint!]!
  }

  type Department {
    id: ID!
    name: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Position {
    id: ID!
    name: String!
    department: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input DepartmentInput {
    name: String!
    description: String
  }

  input PositionInput {
    name: String!
    department: String!
    description: String
  }

  type LeaveRequest {
    id: ID!
    employeeId: String!
    type: LeaveType!
    fromDate: DateTime!
    toDate: DateTime!
    reason: String!
    status: LeaveStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input LeaveRequestInput {
    employeeId: String!
    type: LeaveType!
    fromDate: DateTime!
    toDate: DateTime!
    reason: String!
    status: LeaveStatus!
  }

  "Employee-facing leave application — the server sets employeeId and PENDING status."
  input ApplyLeaveInput {
    type: LeaveType!
    fromDate: DateTime!
    toDate: DateTime!
    reason: String!
  }

  "Employee-facing attendance entry — the server sets employeeId."
  input MarkAttendanceInput {
    date: DateTime!
    status: AttendanceStatus!
    note: String
  }

  extend type Query {
    listLeaveRequests: [LeaveRequest!]!
    getLeaveRequest(id: ID!): LeaveRequest!
    "Self-service: the signed-in user's own leave requests."
    myLeaveRequests: [LeaveRequest!]!
    "Self-service: the signed-in user's own attendance records."
    myAttendance: [Attendance!]!
    "HR/ADMIN: all attendance records."
    listAttendance: [Attendance!]!
    "HR/ADMIN: a specific employee's leave requests."
    leaveRequestsByEmployee(employeeId: ID!): [LeaveRequest!]!
    "HR/ADMIN: a specific employee's attendance records."
    attendanceByEmployee(employeeId: ID!): [Attendance!]!
    "HR/ADMIN: workforce counts + headcount-over-time series."
    hrDashboard: HrDashboard!
    "HR/ADMIN: organizational departments."
    listDepartments: [Department!]!
    getDepartment(id: ID!): Department!
    "HR/ADMIN: job positions / designations."
    listPositions: [Position!]!
    getPosition(id: ID!): Position!
  }

  extend type Mutation {
    createLeaveRequest(input: LeaveRequestInput!): LeaveRequest!
    updateLeaveRequest(id: ID!, input: LeaveRequestInput!): LeaveRequest!
    deleteLeaveRequest(id: ID!): Boolean!
    "Self-service: apply for leave (status forced to PENDING)."
    applyLeave(input: ApplyLeaveInput!): LeaveRequest!
    "Self-service: mark today's (or a given day's) attendance — upserts per day."
    markAttendance(input: MarkAttendanceInput!): Attendance!
    "HR/ADMIN: approve or reject a leave request."
    setLeaveStatus(id: ID!, status: LeaveStatus!): LeaveRequest!
    createDepartment(input: DepartmentInput!): Department!
    updateDepartment(id: ID!, input: DepartmentInput!): Department!
    deleteDepartment(id: ID!): Boolean!
    createPosition(input: PositionInput!): Position!
    updatePosition(id: ID!, input: PositionInput!): Position!
    deletePosition(id: ID!): Boolean!
  }
`;
