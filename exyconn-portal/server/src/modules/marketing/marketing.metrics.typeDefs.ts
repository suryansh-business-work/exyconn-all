import gql from 'graphql-tag';

export const marketingMetricsTypeDefs = gql`
  """
  What a campaign did.

  Opens are a FLOOR, never a count: mail clients prefetch images, cache them, and very often
  block them outright. A campaign showing 30% opened was opened by AT LEAST 30%. Clicks carry
  no such caveat — a click is a person doing something.
  """
  type CampaignMetrics {
    campaignId: ID!
    sent: Int!
    "Distinct recipients who opened at least once."
    opened: Int!
    "Distinct recipients who clicked at least once."
    clicked: Int!
    totalOpens: Int!
    totalClicks: Int!
    "Opened ÷ sent, as a whole percentage."
    openRate: Int!
    "Clicked ÷ sent, as a whole percentage."
    clickRate: Int!
    "Clicked ÷ opened — of the people who read it, how many acted."
    clickThroughRate: Int!
  }

  "One link in a campaign, and how it did."
  type CampaignLinkStat {
    url: String!
    clicks: Int!
    "How many distinct people clicked it."
    people: Int!
  }

  extend type Query {
    campaignMetrics(campaignId: ID!): CampaignMetrics!
    campaignTopLinks(campaignId: ID!): [CampaignLinkStat!]!
  }
`;
