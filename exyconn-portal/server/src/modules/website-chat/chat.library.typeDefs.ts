import gql from 'graphql-tag';

/** The generated CRUD for the chat's FAQs and knowledge (see chat.library.ts). */
export const websiteChatLibraryTypeDefs = gql`
  extend type Query {
    listWebsiteChatFaqs: [WebsiteChatFaq!]!
    getWebsiteChatFaq(id: ID!): WebsiteChatFaq!
    listWebsiteChatFaqsPaged(input: TableQueryInput!): WebsiteChatFaqPage!
    listWebsiteChatKnowledgeEntries: [WebsiteChatKnowledge!]!
    getWebsiteChatKnowledge(id: ID!): WebsiteChatKnowledge!
    listWebsiteChatKnowledgeEntriesPaged(input: TableQueryInput!): WebsiteChatKnowledgePage!
    listWebsiteChatKnowledgeEntriesStats: TableStats!
  }

  extend type Mutation {
    createWebsiteChatFaq(input: WebsiteChatFaqInput!): WebsiteChatFaq!
    updateWebsiteChatFaq(id: ID!, input: WebsiteChatFaqInput!): WebsiteChatFaq!
    deleteWebsiteChatFaq(id: ID!): Boolean!
    "Knowledge written here is always CUSTOM; a sync never touches it."
    createWebsiteChatKnowledge(input: WebsiteChatKnowledgeInput!): WebsiteChatKnowledge!
    updateWebsiteChatKnowledge(id: ID!, input: WebsiteChatKnowledgeInput!): WebsiteChatKnowledge!
    deleteWebsiteChatKnowledge(id: ID!): Boolean!
  }
`;
