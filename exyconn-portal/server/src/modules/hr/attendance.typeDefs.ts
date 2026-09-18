import gql from 'graphql-tag';

/** The HR attendance register: paged records joined to the employee and their tracked day. */
export const attendanceTypeDefs = gql`
  "Time one employee booked against one project on an attendance day."
  type AttendanceProjectTime {
    "Empty for time booked without a project."
    projectId: String!
    "The project's name as it was when the time was booked."
    projectName: String!
    "Measured active milliseconds."
    activeMs: Float!
    "Approved off-computer milliseconds, kept apart from measured time."
    manualMs: Float!
    sessions: Int!
  }

  "What the desktop tracker recorded on an attendance day, read in the employee's own zone."
  type AttendanceTrackerBrief {
    activeMs: Float!
    idleMs: Float!
    manualMs: Float!
    sessions: Int!
    "When the first session or off-computer entry of the day started; null if none."
    firstStartedAt: DateTime
    "When the last finished one ended; null if none has finished."
    lastEndedAt: DateTime
    "Per-project totals, the busiest project first."
    projects: [AttendanceProjectTime!]!
  }

  "One attendance record with the employee's details and the day's tracker brief."
  type AttendanceEntry {
    id: ID!
    employeeId: String!
    employeeName: String!
    employeeEmail: String!
    designation: String
    department: String
    date: DateTime!
    status: AttendanceStatus!
    note: String
    tracker: AttendanceTrackerBrief!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AttendancePage {
    rows: [AttendanceEntry!]!
    totalCount: Int!
  }

  extend type Query {
    """
    HR/ADMIN: the attendance register, one page at a time. Search matches the employee's
    name or email and the note. Filters: status and employeeId (EQUALS), dateFrom and dateTo
    (YYYY-MM-DD, inclusive) and projectId (days the employee tracked time on that project).
    """
    listAttendancePaged(input: TableQueryInput!): AttendancePage!
  }
`;
