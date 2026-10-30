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
    "Its own search and share meta; null on items saved before it existed."
    seo: ItemSeo
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
    seo: ItemSeoInput
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
    "Public: lists a site's active blog posts whose publish date has passed, newest first."
    publicBlogPosts("The site's key; the default site when left out." site: String): [BlogPost!]!
    "Public: reads one active, already published blog post by its address; null when there is none."
    publicBlogPost(
      "The post's URL slug."
      slug: String!
      "The site's key; the default site when left out."
      site: String
    ): BlogPost
  }

  extend type Mutation {
    createBlogPost(input: BlogPostInput!): BlogPost!
    updateBlogPost(id: ID!, input: BlogPostInput!): BlogPost!
    deleteBlogPost(id: ID!): Boolean!
  }
`;
