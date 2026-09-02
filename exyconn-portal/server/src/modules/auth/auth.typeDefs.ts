import gql from 'graphql-tag';

export const authTypeDefs = gql`
  type AuthPayload {
    token: String!
    user: User!
  }

  input UpdateProfileInput {
    name: String
    avatarUrl: String
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
  }
`;
