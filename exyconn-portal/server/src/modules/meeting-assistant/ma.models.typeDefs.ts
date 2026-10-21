import gql from 'graphql-tag';

/** The OpenAI models the Meeting Assistant settings offer. */
export const maModelsTypeDefs = gql`
  "What a model is picked for: writing the notes (ANALYSIS) or speech to text (TRANSCRIPTION)."
  enum MaModelPurpose {
    ANALYSIS
    TRANSCRIPTION
  }

  extend type Query {
    "The models the platform's OpenAI key can use for a purpose, sorted (cached for 10 minutes)."
    maAvailableModels(purpose: MaModelPurpose!): [String!]!
  }
`;
