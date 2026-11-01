import gql from 'graphql-tag';

export const agentsTypeDefs = gql`
  "What the AI agents did over the last days: the Agents console's overview."
  type AgentsOverview {
    "How many days the numbers cover, ending today."
    days: Int!
    "Start of the range, ISO date."
    from: String!
    "End of the range, ISO date."
    to: String!
    "Conversations across every agent: WhatsApp and website agent sessions, live website chats and calls."
    conversations: Int!
    "Sessions with the WhatsApp agent."
    whatsappSessions: Int!
    "Share of WhatsApp workflows started that were finished, 0 to 1."
    whatsappCompletionRate: Float!
    "Sessions with the website chat agent's demo."
    websiteAgentSessions: Int!
    "Live chats opened on the website."
    websiteChats: Int!
    "Live chats in which someone on the team replied."
    websiteChatsAnsweredByPeople: Int!
    "Share of live chats that never needed a person, 0 to 1."
    deflectionRate: Float!
    "Calls placed with the calling bot."
    calls: Int!
    "Calls that ended normally."
    callsCompleted: Int!
    "Calls that failed to connect or broke off."
    callsFailed: Int!
    "People who left their details to try an agent (WhatsApp demo leads)."
    leadsCaptured: Int!
  }

  extend type Query {
    "Reads the Agents console's overview: conversations, calls, leads captured and how many website chats the bots handled alone, over the last days."
    agentsOverview(
      "How many days back to count, ending today (1 to 365; 30 when left out)."
      days: Int
    ): AgentsOverview!
  }
`;
