import gql from 'graphql-tag';

/** "Continue with Google" on the portal sign-in, and its client on Tech > Environment Variables. */
export const googleSignInTypeDefs = gql`
  "The install's Google OAuth client. The secret is never returned; see revealTechSecret."
  type GoogleSignInConfig {
    id: ID!
    clientId: String!
    hasClientSecret: Boolean!
    clientSecretHint: String
    enabled: Boolean!
    "Register this exact address as an authorised redirect URI on the Google client."
    redirectUri: String!
    updatedAt: DateTime
    updatedByName: String
  }

  input GoogleSignInConfigInput {
    clientId: String!
    "Blank keeps the stored secret."
    clientSecret: String!
    enabled: Boolean!
  }

  extend type Query {
    googleSignInConfig: GoogleSignInConfig!
    "Whether the sign-in page offers Continue with Google. Public."
    googleSignInEnabled: Boolean!
  }

  extend type Mutation {
    saveGoogleSignInConfig(input: GoogleSignInConfigInput!): GoogleSignInConfig!
    "Checks the client ID and secret with Google; says what worked, or why not."
    testGoogleSignInConfig: String!
    "Google's consent page for a sign-in that returns to this portal page. Public."
    startGoogleSignIn(returnTo: String!): String!
    "Redeems the one-time ticket Google's callback handed the page. Public."
    completeGoogleSignIn(ticket: String!): AuthPayload!
  }
`;
