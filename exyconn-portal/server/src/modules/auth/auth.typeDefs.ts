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
  }
`;
