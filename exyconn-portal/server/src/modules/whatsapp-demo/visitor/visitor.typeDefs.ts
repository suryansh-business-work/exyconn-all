import gql from 'graphql-tag';

export const whatsappDemoVisitorTypeDefs = gql`
  "Where a demo visitor first asked for a sign-in code."
  enum WhatsappDemoVisitorSource {
    "The WhatsApp chatbot page on the website."
    WEBSITE
    "The demo's own sign-in screen."
    DEMO_LOGIN
  }

  "A prospect who signs in to the WhatsApp demo with an emailed code: a website lead."
  type WhatsappDemoVisitor {
    id: ID!
    name: String!
    email: String!
    company: String!
    phone: String!
    source: WhatsappDemoVisitorSource!
    "When they first entered a correct code; null until then."
    verifiedAt: DateTime
    lastSignInAt: DateTime
    signInCount: Int!
    blocked: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WhatsappDemoVisitorPage {
    rows: [WhatsappDemoVisitor!]!
    totalCount: Int!
  }

  "A signed-in visitor: the demo-only pass (send it as x-demo-visitor), who they are, and where the demo is."
  type WhatsappDemoSignIn {
    token: String!
    visitor: WhatsappDemoVisitor!
    demoUrl: String!
  }

  input WhatsappDemoCodeInput {
    name: String!
    email: String!
    company: String
    phone: String
    source: WhatsappDemoVisitorSource!
  }

  extend type Query {
    "The signed-in demo visitor (pass in x-demo-visitor), or null."
    whatsappDemoVisitorMe: WhatsappDemoVisitor
    "Website > WhatsApp Leads: every demo visitor (website staff)."
    whatsappDemoVisitorsPaged(input: TableQueryInput!): WhatsappDemoVisitorPage!
    "Website > WhatsApp Leads: totals by source and by blocked (website staff)."
    whatsappDemoVisitorStats: TableStats!
  }

  extend type Mutation {
    "Public: files the visitor as a lead and emails a sign-in code. The website sends its security question's answer; the demo's own sign-in sends none and is limited per network."
    requestWhatsappDemoCode(input: WhatsappDemoCodeInput!, captcha: WebsiteCaptchaAnswer): Boolean!
    "Public: exchanges the emailed code for a demo-only pass."
    verifyWhatsappDemoCode(email: String!, code: String!): WhatsappDemoSignIn!
    "Blocking retires the visitor's pass at once (website staff)."
    setWhatsappDemoVisitorBlocked(id: ID!, blocked: Boolean!): WhatsappDemoVisitor!
    deleteWhatsappDemoVisitor(id: ID!): Boolean!
  }
`;
