import gql from 'graphql-tag';

/**
 * The desk's omnichannel side: where a ticket's conversation lives when it started outside the
 * portal (a website chat, a WhatsApp chat), the AI suggested reply, and the public customer
 * satisfaction survey sent when a customer ticket is resolved.
 */
export const supportOmnichannelTypeDefs = gql`
  "The live conversation a ticket links to. Read from the channel itself, never copied onto the ticket."
  type SupportTicketSource {
    channel: TicketChannel!
    "Who is on the other end, as the channel knows them. A WhatsApp number is masked."
    contact: String!
    "Where the conversation stands, in the channel's own words (OPEN, CLOSED, ACTIVE)."
    status: String!
    "The latest message preview for a website chat; the demo being tried for WhatsApp."
    detail: String!
    "Messages in the conversation. 0 when the channel does not count them."
    messageCount: Int!
    lastActivityAt: DateTime
    "Opens the conversation in its own console. Empty when the channel has no page for it."
    url: String!
  }

  "A knowledge-base article the AI suggestion was written from."
  type SupportSuggestionArticle {
    id: ID!
    title: String!
    slug: String!
  }

  "A draft answer for a ticket. Never sent on its own: the agent edits it and sends it."
  type SupportReplySuggestion {
    body: String!
    "Published articles that matched the ticket and were given to the AI."
    articles: [SupportSuggestionArticle!]!
    "Titles of the canned replies the AI could draw on."
    cannedReplies: [String!]!
  }

  "What the public rating page shows about the ticket a survey link belongs to."
  type SupportCsatSurvey {
    reference: String!
    subject: String!
    "The rating already given, or null while the survey is unanswered."
    score: Int
    ratedAt: DateTime
  }

  extend type Query {
    """
    SUPPORT/IT: the website chat or WhatsApp chat a ticket links to, read live from that
    channel. Null for a ticket raised in the portal or by email, whose thread is on the ticket.
    """
    supportTicketSource("The support ticket's id." ticketId: ID!): SupportTicketSource
    """
    Unauthenticated: the ticket a customer satisfaction survey link belongs to, for the public
    rating page. Null for a link that is unknown.
    """
    supportCsatSurvey("The token from the survey link." token: String!): SupportCsatSurvey
  }

  extend type Mutation {
    """
    SUPPORT/IT: drafts a reply to a ticket with AI from its conversation, the matching published
    knowledge-base articles and the desk's canned replies. Counts against the AI budget and is
    recorded in AI history. Nothing is sent: the draft is returned for the agent to edit.
    """
    suggestSupportReply("The support ticket's id." ticketId: ID!): SupportReplySuggestion!
    """
    Unauthenticated: records a customer's satisfaction rating from the survey link they were
    emailed when their ticket was resolved. One answer per survey; rate-limited per address.
    """
    submitSupportCsat(
      "The token from the survey link."
      token: String!
      "1 (very unhappy) to 5 (very happy)."
      score: Int!
      "Optional words to go with the rating, up to 1000 characters."
      comment: String
    ): Boolean!
  }
`;
