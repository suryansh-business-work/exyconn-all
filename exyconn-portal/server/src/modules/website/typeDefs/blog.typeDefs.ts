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
    slug: String!
    title: String!
    summary: String!
    content: String!
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
    slug: String!
    title: String!
    summary: String
    content: String
    author: BlogAuthorInput!
    readTime: String
    tags: [String!]
    coverImage: String
    featured: Boolean
    isActive: Boolean
    publishedAt: DateTime
  }

  extend type Query {
    listBlogPosts: [BlogPost!]!
    getBlogPost(id: ID!): BlogPost!
    publicBlogPosts: [BlogPost!]!
    publicBlogPost(slug: String!): BlogPost
  }

  extend type Mutation {
    createBlogPost(input: BlogPostInput!): BlogPost!
    updateBlogPost(id: ID!, input: BlogPostInput!): BlogPost!
    deleteBlogPost(id: ID!): Boolean!
  }
`;
