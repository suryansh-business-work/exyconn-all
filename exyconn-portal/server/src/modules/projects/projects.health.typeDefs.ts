import gql from 'graphql-tag';

/**
 * Project health: a project measured against what it said it would do.
 *
 * Every figure is read from a record somebody already keeps — tickets, bugs, tracked hours,
 * the dates and budget on the project itself. Nothing here is entered twice, which is the
 * only reason a health page is still true a month after it is built.
 */
export const projectHealthTypeDefs = gql`
  "Where a project stands against its own dates."
  enum ProjectTimeline {
    "No end date was set, so there is nothing to be late for."
    NO_DATES
    ON_TRACK
    DUE_SOON
    OVERDUE
    COMPLETED
  }

  """
  How worrying a project is.

  UNKNOWN is not LOW: it means nothing measurable was set up — no done column, no end date,
  no hours budget — and silence is not good news.
  """
  enum ProjectRisk {
    UNKNOWN
    LOW
    MEDIUM
    HIGH
  }

  type ProjectHealth {
    projectId: ID!
    name: String!
    key: String!
    status: ProjectStatus!
    clientName: String!

    taskCount: Int!
    doneTaskCount: Int!
    """
    Share of tickets finished. **Null** when no board column is marked done — a board that
    has never said what finished means cannot report progress, and 0% would read as
    "nothing done" rather than "nobody told us".
    """
    progressPercent: Float

    "Bugs still open or in progress. Resolved and closed ones cost nobody anything."
    openBugCount: Int!

    budgetHours: Float
    "Hours actually logged, from the same source the project's time log shows."
    loggedHours: Float!
    "Null when no hours budget was agreed."
    budgetUsedPercent: Float

    startDate: DateTime
    endDate: DateTime
    timeline: ProjectTimeline!
    "How many people have a ticket on this project."
    teamSize: Int!

    risk: ProjectRisk!
    "Why the risk is what it is. A rating nobody can question is a rating nobody trusts."
    riskReasons: [String!]!
  }

  extend type Query {
    "One project measured against what it said it would do."
    projectHealth(id: ID!): ProjectHealth!
    "Every project's health, worst first — a portfolio is read to find the one in trouble."
    projectHealthOverview: [ProjectHealth!]!
  }
`;
