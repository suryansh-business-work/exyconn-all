import type { MockLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import {
  SubmitSupportCsatDocument,
  SupportCsatSurveyDocument,
} from '@exyconn/shell/graphql/generated';

export const TOKEN = 'tok_abc123';

export const survey = (score: number | null = null) => ({
  __typename: 'SupportCsatSurvey' as const,
  reference: 'EXY-ABC234',
  subject: 'Invoice is wrong',
  score,
  ratedAt: score == null ? null : '2026-10-31T10:00:00.000Z',
});

/** The survey lookup a page load makes, answered with this survey (or none for a dead link). */
export const surveyLookup = (
  answer: ReturnType<typeof survey> | null,
): MockLink.MockedResponse => ({
  request: { query: SupportCsatSurveyDocument, variables: { token: TOKEN } },
  result: { data: { supportCsatSurvey: answer } },
});

/** The rating being sent, accepted or refused by the server. */
export const rated = (
  score: number,
  comment: string,
  refusal?: string,
): MockLink.MockedResponse => ({
  request: { query: SubmitSupportCsatDocument, variables: { token: TOKEN, score, comment } },
  result: refusal ? { errors: [new GraphQLError(refusal)] } : { data: { submitSupportCsat: true } },
});
