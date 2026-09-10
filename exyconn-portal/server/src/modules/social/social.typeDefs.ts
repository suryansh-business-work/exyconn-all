import gql from 'graphql-tag';

/**
 * The internal social feed. Every field here is readable by any signed-in employee —
 * there is no audience model, because the point of the thing is that the company can
 * see what the company is doing. Writes are restricted to the author of the row.
 */
export const socialTypeDefs = gql`
  "Who wrote something, as the feed needs to show them: enough to render a byline."
  type SocialAuthor {
    id: ID!
    name: String!
    email: String!
    avatarUrl: String
    designation: String
    department: String
  }

  "A colleague's profile page: who they are, and what they have posted."
  type SocialProfile {
    user: SocialAuthor!
    brief: String
    joinDate: DateTime
    postCount: Int!
    likesReceived: Int!
  }

  type SocialComment {
    id: ID!
    postId: ID!
    author: SocialAuthor!
    body: String!
    createdAt: DateTime!
    "Whether the signed-in employee may delete this comment."
    canDelete: Boolean!
  }

  type SocialPost {
    id: ID!
    author: SocialAuthor!
    body: String!
    imageUrl: String!
    likeCount: Int!
    commentCount: Int!
    shareCount: Int!
    "Whether the signed-in employee has already liked this post."
    likedByMe: Boolean!
    "Whether the signed-in employee may delete this post."
    canDelete: Boolean!
    "The post this one shares, resolved one level deep. Null when it is an original."
    sharedFrom: SocialPost
    createdAt: DateTime!
  }

  "One page of the feed. The cursor is the id of the last post on this page."
  type SocialFeedPage {
    posts: [SocialPost!]!
    nextCursor: ID
  }

  input SocialPostInput {
    body: String!
    imageUrl: String
  }

  extend type Query {
    "Everybody's posts, newest first."
    socialFeed(limit: Int, cursor: ID): SocialFeedPage!
    "One post, for its own page."
    socialPost(id: ID!): SocialPost!
    "One colleague's posts, newest first."
    socialUserPosts(userId: ID!, limit: Int, cursor: ID): SocialFeedPage!
    "One colleague's profile."
    socialProfile(userId: ID!): SocialProfile!
    "The comments on a post, oldest first, so a conversation reads in order."
    socialComments(postId: ID!): [SocialComment!]!
  }

  extend type Mutation {
    createSocialPost(input: SocialPostInput!): SocialPost!
    deleteSocialPost(id: ID!): Boolean!
    "Likes the post, or takes the like back. Returns the post as it now stands."
    toggleSocialPostLike(id: ID!): SocialPost!
    "Shares a post onto the feed, optionally with something of your own to say."
    shareSocialPost(id: ID!, body: String): SocialPost!
    createSocialComment(postId: ID!, body: String!): SocialComment!
    deleteSocialComment(id: ID!): Boolean!
  }
`;
