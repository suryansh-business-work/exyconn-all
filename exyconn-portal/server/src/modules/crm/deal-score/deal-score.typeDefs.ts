import gql from 'graphql-tag';

/** The deal score: how likely a deal is to close, computed on the server with its reasons. */
export const dealScoreTypeDefs = gql`
  "One signal behind a deal's score: what was seen and how many points it moved the score."
  type DealScoreReason {
    text: String!
    "Points added (positive) or taken away (negative). The stage line is the starting points."
    impact: Int!
  }

  extend type Deal {
    """
    How likely the deal is to close, 0 to 100, computed on the server from the activities on the
    deal, its contact and its company, how long it has been in its stage and how the contact
    answers email. Null until it is first scored. Rescored on every save and every 6 hours.
    """
    score: Int
    "Every signal behind the score, the stage first, then biggest effect first."
    scoreReasons: [DealScoreReason!]!
    scoredAt: DateTime
  }

  extend type Mutation {
    "CRM: recomputes one deal's score now and returns the deal with its new score and reasons."
    scoreDeal("The deal's id." id: ID!): Deal!
    "CRM: recomputes the score of every open deal now. Returns how many deals were scored."
    scoreOpenDeals: Int!
  }
`;
