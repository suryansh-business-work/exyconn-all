import gql from 'graphql-tag';

/** The fuller profile of a contact and a company (see crm.profile.ts). */
export const crmProfileTypeDefs = gql`
  enum LifecycleStage {
    SUBSCRIBER
    LEAD
    MARKETING_QUALIFIED
    SALES_QUALIFIED
    OPPORTUNITY
    CUSTOMER
    EVANGELIST
    OTHER
  }

  "One email address of a contact or company; exactly one is primary."
  type CrmEmailAddress {
    address: String!
    label: String!
    primary: Boolean!
  }

  "One phone number of a contact or company; exactly one is primary."
  type CrmPhoneNumber {
    number: String!
    label: String!
    primary: Boolean!
  }

  input CrmEmailAddressInput {
    address: String!
    label: String
    primary: Boolean
  }

  input CrmPhoneNumberInput {
    number: String!
    label: String
    primary: Boolean
  }

  extend type Contact {
    "Every address; email is the primary one."
    emails: [CrmEmailAddress!]!
    "Every number; phone is the primary one."
    phones: [CrmPhoneNumber!]!
    department: String!
    lifecycleStage: LifecycleStage!
    leadSource: String!
    languages: [String!]!
    "The profile picture's web address; empty when there is none."
    avatarUrl: String!
    website: String!
    linkedinUrl: String!
    twitterUrl: String!
    address: String!
    city: String!
    country: String!
    "IANA time zone, for the contact's local time."
    timezone: String!
    "About the person, in a sentence or two."
    description: String!
  }

  extend type Company {
    "The primary email address, empty when there is none."
    email: String!
    "The logo's web address; empty when there is none."
    logoUrl: String!
    emails: [CrmEmailAddress!]!
    phones: [CrmPhoneNumber!]!
    website: String!
    linkedinUrl: String!
    twitterUrl: String!
    address: String!
    city: String!
    country: String!
    timezone: String!
    description: String!
    annualRevenue: Float
    employeeCount: Int
    foundedYear: Int
  }

  extend input ContactInput {
    emails: [CrmEmailAddressInput!]
    phones: [CrmPhoneNumberInput!]
    department: String
    lifecycleStage: LifecycleStage
    leadSource: String
    languages: [String!]
    avatarUrl: String
    website: String
    linkedinUrl: String
    twitterUrl: String
    address: String
    city: String
    country: String
    timezone: String
    description: String
  }

  extend input CompanyInput {
    logoUrl: String
    emails: [CrmEmailAddressInput!]
    phones: [CrmPhoneNumberInput!]
    website: String
    linkedinUrl: String
    twitterUrl: String
    address: String
    city: String
    country: String
    timezone: String
    description: String
    annualRevenue: Float
    employeeCount: Int
    foundedYear: Int
  }
`;
