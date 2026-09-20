import gql from 'graphql-tag';

export const authTypeDefs = gql`
  type AuthPayload {
    "Empty when a second factor is still owed: no session exists until the code is given."
    token: String!
    "Null until the sign-in is complete, so a password alone reveals nothing about the account."
    user: User
    "True when the password was right and an authenticator code is still needed."
    mfaRequired: Boolean!
    "The five-minute token to send back with the code. Empty unless mfaRequired."
    mfaChallenge: String!
  }

  "One browser or device this account is signed in on."
  type UserSession {
    id: ID!
    "What the browser called itself — enough to recognise the device, not to fingerprint it."
    userAgent: String!
    ip: String!
    lastSeenAt: DateTime!
    createdAt: DateTime!
    "True for the session making this request, which the list must never offer to end."
    current: Boolean!
  }

  "Whether this account asks for an authenticator code, and how much recovery is left."
  type MfaStatus {
    enabled: Boolean!
    recoveryCodesLeft: Int!
    enrolledAt: DateTime
  }

  "What an authenticator app needs to start producing codes."
  type MfaEnrolment {
    "The shared secret, for somebody typing it in by hand."
    secret: String!
    "The otpauth:// URI the QR code encodes."
    uri: String!
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
    "A few lines about the person. Empty string clears it."
    brief: String
    "A number colleagues can reach the person on. Empty string clears it."
    phone: String
    "Replaces every shared profile at once; an empty address clears that one."
    socialLinks: UserSocialLinksInput
  }

  input UserSocialLinksInput {
    linkedin: String
    github: String
    twitter: String
    website: String
  }

  extend type Query {
    me: User!
    "Every browser and device this account is signed in on, newest first."
    mySessions: [UserSession!]!
    "Whether two-factor authentication is on for this account."
    myMfaStatus: MfaStatus!
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthPayload!
    "The second step of a two-factor sign-in: the challenge from login, plus the code."
    verifyMfa(challenge: String!, code: String!): AuthPayload!
    "Ends one of this account's other sessions. The current one cannot be ended this way."
    revokeSession(id: ID!): Boolean!
    "Ends every session except this one, for somebody who thinks their password has been seen."
    revokeOtherSessions: Int!
    "Mints a secret and returns what an authenticator app needs. Nothing is switched on yet."
    startMfaEnrolment: MfaEnrolment!
    """
    Switches two-factor on, once a code proves the secret reached the app. Returns the
    recovery codes, which are shown once and stored hashed.
    """
    confirmMfaEnrolment(code: String!): [String!]!
    "Switches two-factor off. Needs the password: a borrowed screen must not be enough."
    disableMfa(password: String!): Boolean!
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
