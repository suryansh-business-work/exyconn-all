import gql from 'graphql-tag';

export const announcementsTypeDefs = gql`
  enum AnnouncementCategory {
    NOTICE
    POLICY
    EVENT
    UPDATE
  }

  enum AnnouncementAudience {
    ALL
    DEPARTMENT
    EMPLOYEES
  }

  type Announcement {
    id: ID!
    title: String!
    body: String!
    category: AnnouncementCategory!
    pinned: Boolean!
    publishedAt: DateTime!
    expiresAt: DateTime
    audience: AnnouncementAudience!
    department: String
    employeeIds: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input AnnouncementInput {
    title: String!
    body: String!
    category: AnnouncementCategory!
    pinned: Boolean!
    publishedAt: DateTime!
    expiresAt: DateTime
    audience: AnnouncementAudience!
    "Required when audience is DEPARTMENT."
    department: String
    "Required when audience is EMPLOYEES."
    employeeIds: [String!]
  }

  type AnnouncementPage {
    rows: [Announcement!]!
    totalCount: Int!
  }

  extend type Query {
    listAnnouncements: [Announcement!]!
    listAnnouncementsPaged(input: TableQueryInput!): AnnouncementPage!
    listAnnouncementsStats: TableStats!
    getAnnouncement(id: ID!): Announcement!
    """
    The employee-facing feed: everything published, not yet expired and aimed at
    the caller (company-wide, their department, or them by name), pinned first
    then newest. Readable by any signed-in user, unlike the HR CRUD above.
    """
    activeAnnouncements: [Announcement!]!
  }

  extend type Mutation {
    createAnnouncement(input: AnnouncementInput!): Announcement!
    updateAnnouncement(id: ID!, input: AnnouncementInput!): Announcement!
    deleteAnnouncement(id: ID!): Boolean!
  }
`;
