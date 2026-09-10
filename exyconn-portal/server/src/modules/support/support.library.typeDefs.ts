import gql from 'graphql-tag';

/**
 * The support team's reusable writing: knowledge-base articles and canned replies.
 *
 * Kept apart from support.typeDefs.ts (tickets, threads, SLA) because none of it is a
 * ticket — it is the material a ticket gets answered with.
 */
export const supportLibraryTypeDefs = gql`
  """
  An answer written once so it does not have to be typed again.

  Categorised on the same list tickets are, so the article and the queue that needs it are
  findable by the same word.
  """
  type KbArticle {
    id: ID!
    title: String!
    "Stable handle for a link that survives the title being reworded."
    slug: String!
    category: SupportCategory!
    "One line, shown in search results — what decides whether the article gets opened."
    summary: String!
    body: String!
    "Only published articles are searchable. A half-written answer is worse than none."
    isPublished: Boolean!
    updatedById: String!
    updatedByName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input KbArticleInput {
    title: String!
    slug: String!
    category: SupportCategory!
    summary: String
    body: String!
    isPublished: Boolean!
  }

  type KbArticlePage {
    rows: [KbArticle!]!
    totalCount: Int!
  }

  """
  A reply the desk sends often, kept once instead of being retyped.

  Not an article: an article explains something and is written to be read on its own. This
  is the paragraph an agent drops into a thread and then edits, which is why nothing here
  is ever sent automatically.
  """
  type CannedReply {
    id: ID!
    title: String!
    category: SupportCategory!
    body: String!
    "Retired snippets stay in the register but are not offered in the composer."
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CannedReplyInput {
    title: String!
    category: SupportCategory!
    body: String!
    isActive: Boolean!
  }

  type CannedReplyPage {
    rows: [CannedReply!]!
    totalCount: Int!
  }

  extend type Query {
    listKbArticles: [KbArticle!]!
    listKbArticlesPaged(input: TableQueryInput!): KbArticlePage!
    listKbArticlesStats: TableStats!
    getKbArticle(id: ID!): KbArticle!

    listCannedReplies: [CannedReply!]!
    listCannedRepliesPaged(input: TableQueryInput!): CannedReplyPage!
    listCannedRepliesStats: TableStats!
    getCannedReply(id: ID!): CannedReply!

    """
    Any signed-in user: published articles matching a phrase, best match first.

    Deliberately not restricted to the support team — an agent hunting for the answer to
    paste and an employee hunting for it themselves are the same search.
    """
    searchKnowledgeBase(query: String!): [KbArticle!]!

    "SUPPORT/ADMIN: the active snippets the reply composer offers."
    listActiveCannedReplies: [CannedReply!]!
  }

  extend type Mutation {
    createKbArticle(input: KbArticleInput!): KbArticle!
    updateKbArticle(id: ID!, input: KbArticleInput!): KbArticle!
    deleteKbArticle(id: ID!): Boolean!

    createCannedReply(input: CannedReplyInput!): CannedReply!
    updateCannedReply(id: ID!, input: CannedReplyInput!): CannedReply!
    deleteCannedReply(id: ID!): Boolean!
  }
`;
