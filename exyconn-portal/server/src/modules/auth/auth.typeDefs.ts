import gql from 'graphql-tag';

export const authTypeDefs = gql`
  type AuthPayload {
    token: String!
    user: User!
  }

  input UpdateProfileInput {
    name: String
    avatarUrl: String
    """
    The zone every date and time is shown to this person in. Empty string clears the
    choice and follows the workspace default again.
    """
    timezone: String
    "The language the portal is shown to this person in. Empty string follows the default."
    locale: String
  }

  extend type Query {
    me: User!
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthPayload!
    updateProfile(input: UpdateProfileInput!): User!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    uploadAvatar(file: String!): String!
    """
    Recovery for a portal with no administrator: mails a fresh password for the
    configured admin account to that configured address. A no-op once any ADMIN
    exists. Returns a message safe to show the caller.
    """
    sendAdminCredentials: String!
    """
    Self-service reset: emails a one-hour link to the address if an account has it.
    Always true, so the answer does not reveal which addresses have accounts.
    """
    requestPasswordReset(email: String!): Boolean!
    "Sets a new password from an emailed link. The link works once."
    resetPassword(token: String!, newPassword: String!): Boolean!
  }
`;
