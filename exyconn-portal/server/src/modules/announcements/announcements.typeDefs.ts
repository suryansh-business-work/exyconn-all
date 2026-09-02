import gql from 'graphql-tag';

export const announcementsTypeDefs = gql`
  enum AnnouncementCategory {
    NOTICE
    POLICY
    EVENT
    UPDATE
  }

  type Announcement {
    id: ID!
    title: String!
    body: String!
    category: AnnouncementCategory!
    pinned: Boolean!
    publishedAt: DateTime!
    expiresAt: DateTime
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
    The employee-facing feed: everything published and not yet expired, pinned
    first then newest. Readable by any signed-in user, unlike the HR CRUD above.
    """
    activeAnnouncements: [Announcement!]!
  }

  extend type Mutation {
    createAnnouncement(input: AnnouncementInput!): Announcement!
    updateAnnouncement(id: ID!, input: AnnouncementInput!): Announcement!
    deleteAnnouncement(id: ID!): Boolean!
  }
`;
