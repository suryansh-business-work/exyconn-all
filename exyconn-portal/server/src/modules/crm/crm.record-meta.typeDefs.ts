import gql from 'graphql-tag';

/** Where a company or contact came from (crm.origin.ts) and its own tags (crm.tags.ts). */
export const crmRecordMetaTypeDefs = gql`
  enum CrmOriginSource {
    USER
    WEBSITE
    GOOGLE_PLACES
    MEETING_BOOKING
    LEAD_CONVERSION
  }

  enum CrmTagObject {
    COMPANY
    CONTACT
  }

  "Who or what brought a record into the CRM."
  type CrmRecordOrigin {
    source: CrmOriginSource!
    "The signed-in person who created it or ran the import; empty for the website or a booking."
    userId: String!
    userName: String!
    userEmail: String!
  }

  extend type Company {
    "Null on rows filed before origins were kept."
    origin: CrmRecordOrigin
    "The creator's name, or what brought it in (Website, Google Places)."
    leadOwner: String!
    tags: [String!]!
  }

  extend type Contact {
    origin: CrmRecordOrigin
    leadOwner: String!
    tags: [String!]!
  }

  extend type Query {
    "Every tag in use on companies or on contacts, sorted."
    crmTags(object: CrmTagObject!): [String!]!
  }

  extend type Mutation {
    "Replaces a company's or contact's tags (at most 20, 40 characters each)."
    setCrmTags(object: CrmTagObject!, id: ID!, tags: [String!]!): [String!]!
  }
`;
