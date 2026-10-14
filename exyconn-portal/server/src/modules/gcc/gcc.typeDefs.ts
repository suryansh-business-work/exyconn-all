import gql from 'graphql-tag';

/**
 * The exyconn.com GCC cost calculator's server side. Every operation is public — the
 * calculator has no accounts — and is called by the website's own server, which limits each
 * visitor; emailing and creating a link also need the website captcha. Estimates travel as
 * JSON strings validated against the shared @exyconn/gcc-cost schema, and every figure is
 * recomputed from their inputs.
 */
export const gccTypeDefs = gql`
  input GccEmailInput {
    "Where to send the estimate."
    to: String!
    "The estimate (schema version 1) as JSON. Totals are never read from it."
    estimateJson: String!
    "An optional line from the sender, up to 500 characters."
    note: String
  }

  type GccEmailResult {
    "The address the estimate was sent to."
    sentTo: String!
  }

  input GccShareInput {
    estimateJson: String!
    "Between 1 and 30."
    expiresInDays: Int!
    "The visitor agreed to the estimate being stored until the link expires. Must be true."
    consent: Boolean!
  }

  "A new link. The token and revoke key are only ever returned here."
  type GccShareCreated {
    token: String!
    revokeKey: String!
    expiresAt: DateTime!
  }

  type GccSharedEstimate {
    estimateJson: String!
    expiresAt: DateTime!
  }

  extend type Query {
    "Public. Null when the token is unknown, expired or revoked."
    sharedGccEstimate(token: String!): GccSharedEstimate
  }

  extend type Mutation {
    "Public. Emails the estimate as a PDF; fails with EMAIL_UNAVAILABLE unless it was sent."
    emailGccEstimate(input: GccEmailInput!, captcha: WebsiteCaptchaAnswer!): GccEmailResult!
    "Public. Stores the estimate behind a read-only link."
    createGccShare(input: GccShareInput!, captcha: WebsiteCaptchaAnswer!): GccShareCreated!
    "Public. True when the link was live and the key matched; the stored estimate is dropped."
    revokeGccShare(token: String!, revokeKey: String!): Boolean!
  }
`;
