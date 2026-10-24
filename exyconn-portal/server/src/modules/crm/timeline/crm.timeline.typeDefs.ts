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
    "Whether url is this entry's own page (View details goes there); otherwise View details opens crmTimelineDetail."
    opensPage: Boolean!
    attachments: [FileAttachment!]!
    "When a task's reminder is emailed; null for everything that is not a reminder."
    remindAt: DateTime
  }

  enum CrmTimelineFieldType {
    TEXT
    "An ISO date-time, shown in the viewer's date and time settings."
    DATE
    "An amount in the company's currency."
    MONEY
  }

  "One labelled value of a timeline entry's record."
  type CrmTimelineField {
    "English label; the client translates it."
    label: String!
    value: String!
    type: CrmTimelineFieldType!
  }

  "Everything one timeline entry's record holds, for its View details dialog."
  type CrmTimelineDetail {
    fields: [CrmTimelineField!]!
    "The full text: an email's body, an activity's or deal's notes, a form's message."
    body: String!
  }

  extend type Query {
    "Everything that happened with the contact or company, newest first (at most 200)."
    crmTimeline(object: CrmTimelineObject!, id: ID!, limit: Int): [CrmTimelineItem!]!
    "The full record behind one entry of that contact's or company's timeline (itemId is CrmTimelineItem.id)."
    crmTimelineDetail(object: CrmTimelineObject!, id: ID!, itemId: ID!): CrmTimelineDetail!
  }
`;
