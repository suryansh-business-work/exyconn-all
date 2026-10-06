import gql from 'graphql-tag';

/** `public*` queries are intentionally unauthenticated — the Astro website reads them anonymously. */
export const blogTypeDefs = gql`
  type BlogAuthor {
    name: String!
    role: String!
    initials: String!
  }

  input BlogAuthorInput {
    name: String!
    role: String
    initials: String
  }

  type BlogPost {
    id: ID!
    "The website it belongs to (Website > Websites)."
    siteId: String!
    slug: String!
    title: String!
    summary: String!
    content: String!
    "CSS the live editor generated for the body; empty for a rich-text body."
    contentCss: String!
    author: BlogAuthor!
    readTime: String!
    tags: [String!]!
    coverImage: String!
    featured: Boolean!
    isActive: Boolean!
    publishedAt: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input BlogPostInput {
    siteId: String
    slug: String!
    title: String!
    summary: String
    content: String
    contentCss: String
    author: BlogAuthorInput!
    readTime: String
    tags: [String!]
    coverImage: String
    featured: Boolean
    isActive: Boolean
    publishedAt: DateTime
  }

  type BlogPostPage {
    rows: [BlogPost!]!
    totalCount: Int!
  }

  extend type Query {
    listBlogPosts: [BlogPost!]!
    listBlogPostsPaged(input: TableQueryInput!): BlogPostPage!
    listBlogPostsStats: TableStats!
    getBlogPost(id: ID!): BlogPost!
    publicBlogPosts(site: String): [BlogPost!]!
    publicBlogPost(slug: String!, site: String): BlogPost
  }

  extend type Mutation {
    createBlogPost(input: BlogPostInput!): BlogPost!
    updateBlogPost(id: ID!, input: BlogPostInput!): BlogPost!
    deleteBlogPost(id: ID!): Boolean!
  }
`;
