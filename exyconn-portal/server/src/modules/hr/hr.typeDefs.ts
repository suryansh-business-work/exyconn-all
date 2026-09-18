import gql from 'graphql-tag';

export const hrTypeDefs = gql`
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

  "A department and, nested inside it, the positions people are hired into."
  type Department {
    id: ID!
    name: String!
    "A short reference used on reports and exports, e.g. ENG."
    code: String
    description: String
    "The employee who heads the department."
    headId: String
    "Resolved from headId for display; null when nobody is set."
    headName: String
    positions: [Position!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "A job position inside a department; its name is the designation on employee records."
  type Position {
    id: ID!
    name: String!
    "The owning department's name."
    department: String!
    code: String
    description: String
    "Monthly salary band in the company's currency."
    minSalary: Float!
    maxSalary: Float!
    "Code of the Grade the position sits in."
    grade: String
    "Code of the EmploymentType the position is hired on."
    employmentType: String
    "Approved seats."
    headcount: Int!
    "Active employees currently holding the position."
    filled: Int!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input DepartmentInput {
    name: String!
    code: String
    description: String
    headId: String
  }

  input PositionInput {
    name: String!
    department: String!
    code: String
    description: String
    minSalary: Float!
    maxSalary: Float!
    grade: String
    employmentType: String
    headcount: Int!
    active: Boolean!
  }

  type LeaveRequest {
    id: ID!
    employeeId: String!
    "The code of one of HR's leave types (LeavePolicy.code), e.g. CL."
    type: String!
    fromDate: DateTime!
    toDate: DateTime!
    reason: String!
    status: LeaveStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input LeaveRequestInput {
    employeeId: String!
    type: String!
    fromDate: DateTime!
    toDate: DateTime!
    reason: String!
    status: LeaveStatus!
  }

  "Employee-facing leave application — the server sets employeeId and PENDING status."
  input ApplyLeaveInput {
    type: String!
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
    "HR/ADMIN: active employees whose probation ends inside the next N days, soonest first."
    probationsEnding(days: Int = 30): [User!]!
    "Manager: pending and recently decided leave requests from direct reports."
    teamLeaveRequests: [LeaveRequest!]!
    "HR/ADMIN: organizational departments, each with its positions."
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
    "HR/ADMIN or the employee's manager: approve or reject a leave request."
    setLeaveStatus(id: ID!, status: LeaveStatus!): LeaveRequest!
    createDepartment(input: DepartmentInput!): Department!
    updateDepartment(id: ID!, input: DepartmentInput!): Department!
    deleteDepartment(id: ID!): Boolean!
    createPosition(input: PositionInput!): Position!
    updatePosition(id: ID!, input: PositionInput!): Position!
    deletePosition(id: ID!): Boolean!
  }
`;
