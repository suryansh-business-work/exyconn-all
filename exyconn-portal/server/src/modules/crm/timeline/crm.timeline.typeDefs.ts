import gql from 'graphql-tag';

/** The contact and company timeline (see crm.timeline.ts). */
export const crmTimelineTypeDefs = gql`
  enum CrmTimelineObject {
    CONTACT
    COMPANY
  }

  enum CrmTimelineKind {
    NOTE
    CALL
    EMAIL
    MEETING
    TASK
    DEAL
    LEAD
    FORM_SUBMISSION
    WEBSITE_CHAT
    SUPPORT_TICKET
    CAMPAIGN_EMAIL
    SYSTEM_EMAIL
    WHATSAPP_LEAD
  }

  "One touchpoint with a contact or company, from whichever module recorded it."
  type CrmTimelineItem {
    id: ID!
    kind: CrmTimelineKind!
    at: DateTime!
    title: String!
    summary: String!
    "Who on our side did it or owns it; empty when nobody did."
    actor: String!
    status: String!
    "Where to open it: a path inside the portal app that owns this kind; empty when it has no page."
    url: String!
    attachments: [FileAttachment!]!
  }

  extend type Query {
    "Everything that happened with the contact or company, newest first (at most 200)."
    crmTimeline(object: CrmTimelineObject!, id: ID!, limit: Int): [CrmTimelineItem!]!
  }
`;
