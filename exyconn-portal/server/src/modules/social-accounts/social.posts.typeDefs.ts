import gql from 'graphql-tag';

/** Posts on the connected accounts: read, written, scheduled, measured and analysed. */
export const socialPostsTypeDefs = gql`
  enum SocialMediaPostOrigin {
    SYNCED
    COMPOSED
  }

  enum SocialMediaPostStatus {
    DRAFT
    SCHEDULED
    PUBLISHING
    PUBLISHED
    FAILED
  }

  "What the network counts for a post; zero where it shares no number."
  type SocialMediaPostMetrics {
    likes: Int!
    comments: Int!
    shares: Int!
    views: Int!
  }

  type SocialMediaPost {
    id: ID!
    accountId: ID!
    network: SocialNetwork!
    origin: SocialMediaPostOrigin!
    status: SocialMediaPostStatus!
    text: String!
    mediaUrl: String!
    link: String!
    permalink: String!
    scheduledAt: DateTime
    publishedAt: DateTime
    "The network's reason when publishing failed."
    error: String!
    metrics: SocialMediaPostMetrics!
    "Likes, comments and shares together."
    engagement: Int!
    "Posts written together for several accounts share it."
    batchId: String!
    createdAt: DateTime!
  }

  "What a network accepts from the composer."
  type SocialNetworkRule {
    network: SocialNetwork!
    canPublish: Boolean!
    maxChars: Int!
    requiresImage: Boolean!
    allowsImage: Boolean!
    "Whether a published post can be deleted on the network from here (not on Instagram)."
    canDelete: Boolean!
    note: String!
  }

  "What deleting a published post did on one account."
  enum SocialPostDeletionOutcome {
    "Deleted on the network and in Exyconn."
    DELETED
    "Removed from Exyconn; the network does not let apps delete posts, so it stays there."
    KEPT_ON_NETWORK
    "The network refused; nothing was deleted."
    FAILED
  }

  type SocialPostDeletion {
    postId: ID!
    accountId: ID!
    network: SocialNetwork!
    outcome: SocialPostDeletionOutcome!
    "What happened, or the network's reason it did not."
    message: String!
  }

  type SocialSyncResult {
    accountId: ID!
    synced: Int!
    error: String!
  }

  type SocialNetworkStat {
    network: SocialNetwork!
    posts: Int!
    engagement: Int!
    views: Int!
  }

  type SocialAnalytics {
    days: Int!
    posts: Int!
    likes: Int!
    comments: Int!
    shares: Int!
    views: Int!
    engagement: Int!
    "Posts waiting for their time, and posts that failed to go out."
    scheduled: Int!
    failed: Int!
    byNetwork: [SocialNetworkStat!]!
    engagementPerDay: [AnalyticsPoint!]!
    topPosts: [SocialMediaPost!]!
  }

  input SocialMediaPostInput {
    accountIds: [ID!]!
    text: String!
    mediaUrl: String!
    link: String!
    "When to publish; null publishes now."
    scheduledAt: DateTime
    "Keep it as a draft."
    draft: Boolean
  }

  input SocialMediaPostUpdateInput {
    text: String!
    mediaUrl: String!
    link: String!
    "A time moves it onto the schedule; null keeps it a draft."
    scheduledAt: DateTime
  }

  extend type Query {
    "Posts, newest first, optionally for one account or in one state. MARKETING."
    socialMediaPosts(
      accountId: ID
      status: SocialMediaPostStatus
      limit: Int = 100
    ): [SocialMediaPost!]!
    "Posts scheduled or published between two instants, optionally for some accounts only — the calendar. MARKETING."
    socialCalendar(from: DateTime!, to: DateTime!, accountIds: [ID!]): [SocialMediaPost!]!
    "What the posts did over the last days (1-365). MARKETING."
    socialAnalytics(days: Int = 30): SocialAnalytics!
    "Lists each social network's posting rules: whether it can publish, its character limit, image needs and whether posts can be deleted."
    socialNetworkRules: [SocialNetworkRule!]!
  }

  extend type Mutation {
    "Reads one account's posts and numbers from the network now. MARKETING."
    syncSocialAccount(id: ID!): SocialSyncResult!
    "Reads the latest posts and numbers from every connected social account, one at a time, and returns each account's result."
    syncAllSocialAccounts: [SocialSyncResult!]!
    "One post per account: published now, scheduled, or kept as a draft. MARKETING."
    composeSocialMediaPost(input: SocialMediaPostInput!): [SocialMediaPost!]!
    updateSocialMediaPost(id: ID!, input: SocialMediaPostUpdateInput!): SocialMediaPost!
    "Publishes a draft, a scheduled post ahead of time, or retries a failed one."
    publishSocialMediaPostNow(id: ID!): SocialMediaPost!
    "Deletes a draft, scheduled or failed post — one that has not gone out. MARKETING."
    deleteSocialMediaPost(id: ID!): Boolean!
    "Deletes a published post on its network and in Exyconn, for every account it went to together. MARKETING."
    deletePublishedSocialPost(id: ID!): [SocialPostDeletion!]!
    "AI: what worked, what did not, and what to try, from the last days' posts."
    socialMediaInsights(days: Int = 30): String!
    "AI: post ideas on a topic, in the voice of the best posts."
    socialMediaIdeas(topic: String!, count: Int = 5): String!
  }
`;
