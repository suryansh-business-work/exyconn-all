import gql from 'graphql-tag';

/**
 * Public self sign-up. Kept apart from billingTypeDefs so it is not offered as a tool on the
 * Admin MCP server: a signed-in person has no use for signing a company up.
 */
export const signupTypeDefs = gql`
  input SignupInput {
    "The address the code was sent to; becomes the administrator's sign-in."
    email: String!
    "The six-digit code from the email."
    code: String!
    "The administrator's full name."
    name: String!
    companyName: String!
    "ISO 4217 currency the company keeps its books in."
    currency: String!
    "ISO 3166-1 alpha-2 country code."
    country: String
    "IANA timezone."
    timezone: String
    "The public plan to start a trial of."
    planId: ID!
  }

  extend type Query {
    "The plans offered on the public sign-up page. No sign-in needed."
    signupPlans: [BillingPlan!]!
  }

  extend type Mutation {
    "Emails a sign-up code to the person creating a company. No sign-in needed."
    requestSignupCode(email: String!): Boolean!
    "Creates the company and its administrator with the emailed code, starts the plan's trial and signs the administrator in."
    completeSignup(input: SignupInput!): AuthPayload!
  }
`;
