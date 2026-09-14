import gql from 'graphql-tag';

/**
 * Company policies. Authored in Legal, read by everybody, signed by staff, and — for the
 * public ones — rendered by the website, so the site and the portal cannot drift apart.
 */
export const policyTypeDefs = gql`
  enum PolicyAudience {
    ALL_STAFF
    HR_ONLY
    PUBLIC
  }

  enum PolicyStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  """
  How far a document may travel (ISO 27001 A.5.12).

  The document's own label, not a permission: who may open a policy is decided by its
  audience and the reader's role.
  """
  enum PolicyClassification {
    PUBLIC
    INTERNAL
    CONFIDENTIAL
  }

  type Policy {
    id: ID!
    title: String!
    "URL segment the website renders this at."
    slug: String!
    summary: String!
    body: String!
    audience: PolicyAudience!
    status: PolicyStatus!
    "Raised whenever published wording changes. Signatures are recorded per version."
    version: Int!
    effectiveDate: DateTime!
    requiresAcknowledgement: Boolean!
    owner: String!
    classification: PolicyClassification!
    "When this has to be read again and confirmed as still right."
    nextReviewOn: DateTime
    "Whether that date has passed. Derived, so a list can be filtered on it."
    reviewOverdue: Boolean!
    "Who approved it for use, recorded when it was published. Not its author."
    approvedByName: String!
    approvedOn: DateTime
    publishedAt: DateTime
    updatedAt: DateTime!
    "How many people have signed the CURRENT version."
    acknowledgedCount: Int!
  }

  input PolicyInput {
    title: String!
    slug: String!
    summary: String
    body: String!
    audience: PolicyAudience!
    effectiveDate: DateTime!
    requiresAcknowledgement: Boolean
    owner: String
    classification: PolicyClassification
    nextReviewOn: DateTime
  }

  type PolicyPage {
    rows: [Policy!]!
    totalCount: Int!
  }

  "One person's signature on one version of one policy."
  type PolicyAcknowledgement {
    id: ID!
    policyId: ID!
    policyTitle: String!
    version: Int!
    userId: ID!
    userName: String!
    userEmail: String!
    signedName: String!
    signedAt: DateTime!
  }

  """
  A policy as a member of staff sees it: the wording, and whether THEY have signed the
  version now in force.
  """
  type MyPolicy {
    id: ID!
    title: String!
    slug: String!
    summary: String!
    body: String!
    version: Int!
    effectiveDate: DateTime!
    requiresAcknowledgement: Boolean!
    "True only when this person has signed the version currently published."
    acknowledged: Boolean!
    acknowledgedAt: DateTime
  }

  "A published PUBLIC policy, for the website. No authentication."
  type PublicPolicy {
    title: String!
    slug: String!
    summary: String!
    body: String!
    version: Int!
    effectiveDate: DateTime!
    updatedAt: DateTime!
  }

  extend type Query {
    # Legal
    listPolicies: [Policy!]!
    listPoliciesPaged(input: TableQueryInput!): PolicyPage!
    listPoliciesStats: TableStats!
    getPolicy(id: ID!): Policy!
    "Who has signed a policy, newest first."
    policyAcknowledgements(policyId: ID!): [PolicyAcknowledgement!]!

    # Any signed-in employee, for their own reading and signing
    "Published policies this person is meant to see, with their own signature state."
    myPolicies: [MyPolicy!]!
    myPolicy(slug: String!): MyPolicy

    # The website
    publicPolicies: [PublicPolicy!]!
    publicPolicy(slug: String!): PublicPolicy
  }

  extend type Mutation {
    createPolicy(input: PolicyInput!): Policy!
    updatePolicy(id: ID!, input: PolicyInput!): Policy!
    deletePolicy(id: ID!): Boolean!
    """
    Publishes a policy. raiseVersion asks everybody who already signed to sign again,
    which is what a change in wording means — leave it off for a typo fix.
    """
    publishPolicy(id: ID!, raiseVersion: Boolean): Policy!
    archivePolicy(id: ID!): Policy!

    """
    Signs the version currently published. The signer's identity comes from their token, so
    nobody can sign on somebody else's behalf; signedName is what they typed.
    """
    acknowledgePolicy(policyId: ID!, signedName: String!): PolicyAcknowledgement!
  }
`;
