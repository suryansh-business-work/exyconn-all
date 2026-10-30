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
    "Its own search and share meta; null on items saved before it existed."
    seo: ItemSeo
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
    seo: ItemSeoInput
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
    "Lists one website's newsletter issues, newest first, a page at a time."
    newsletterIssues(
      siteId: ID!
      "Zero-based page."
      page: Int!
      pageSize: Int!
      "Matches the title, address or summary."
      search: String
    ): NewsletterIssuePage!
    "Lists the people signed up to one website's newsletter, newest first, a page at a time."
    newsletterSubscribers(
      siteId: ID!
      "Zero-based page."
      page: Int!
      pageSize: Int!
      "Matches the email or name."
      search: String
    ): NewsletterSubscriberPage!
  }

  extend type Mutation {
    createNewsletterIssue(input: NewsletterIssueInput!): NewsletterIssue!
    updateNewsletterIssue(id: ID!, input: NewsletterIssueInput!): NewsletterIssue!
    deleteNewsletterIssue(id: ID!): Boolean!
    "Adds somebody by hand (they agreed elsewhere); signing up again re-subscribes."
    addNewsletterSubscriber(siteId: ID!, email: String!, name: String): Boolean!
    "Marks a newsletter subscriber as subscribed or unsubscribed; unsubscribed people get no more issues."
    setNewsletterSubscriberStatus(
      id: ID!
      status: NewsletterSubscriberStatus!
    ): NewsletterSubscriber!
    deleteNewsletterSubscriber(id: ID!): Boolean!
  }
`;
