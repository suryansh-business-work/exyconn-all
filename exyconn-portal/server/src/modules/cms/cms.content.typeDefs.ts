import gql from 'graphql-tag';

/** Website › Newsletter: issues published on a site, and its subscribers. */
export const cmsContentTypeDefs = gql`
  "A newsletter issue published on a site (/newsletter/<slug>). The body is HTML, as a blog post's."
  type NewsletterIssue {
    id: ID!
    siteId: String!
    slug: String!
    title: String!
    summary: String!
    coverImage: String!
    content: String!
    contentCss: String!
    isActive: Boolean!
    publishedAt: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type NewsletterIssuePage {
    rows: [NewsletterIssue!]!
    totalCount: Int!
  }

  input NewsletterIssueInput {
    siteId: String!
    slug: String!
    title: String!
    summary: String
    coverImage: String
    content: String!
    contentCss: String
    isActive: Boolean!
    publishedAt: String
  }

  enum NewsletterSubscriberStatus {
    SUBSCRIBED
    UNSUBSCRIBED
  }

  type NewsletterSubscriber {
    id: ID!
    siteId: String!
    email: String!
    name: String!
    status: NewsletterSubscriberStatus!
    "Where they signed up: the page, or portal."
    source: String!
    consentAt: DateTime!
    createdAt: DateTime!
  }

  type NewsletterSubscriberPage {
    rows: [NewsletterSubscriber!]!
    totalCount: Int!
  }

  extend type Query {
    newsletterIssues(siteId: ID!, page: Int!, pageSize: Int!, search: String): NewsletterIssuePage!
    newsletterSubscribers(
      siteId: ID!
      page: Int!
      pageSize: Int!
      search: String
    ): NewsletterSubscriberPage!
  }

  extend type Mutation {
    createNewsletterIssue(input: NewsletterIssueInput!): NewsletterIssue!
    updateNewsletterIssue(id: ID!, input: NewsletterIssueInput!): NewsletterIssue!
    deleteNewsletterIssue(id: ID!): Boolean!
    "Adds somebody by hand (they agreed elsewhere); signing up again re-subscribes."
    addNewsletterSubscriber(siteId: ID!, email: String!, name: String): Boolean!
    setNewsletterSubscriberStatus(
      id: ID!
      status: NewsletterSubscriberStatus!
    ): NewsletterSubscriber!
    deleteNewsletterSubscriber(id: ID!): Boolean!
  }
`;
