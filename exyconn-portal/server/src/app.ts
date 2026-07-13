import express, { type Express } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './graphql';
import { buildContext, type GraphQLContext } from './middleware/auth';
import { env } from './config/env';

/**
 * Builds the Express app with the Apollo GraphQL middleware mounted at /graphql.
 * Returned (not started) so tests can drive it via supertest.
 */
export async function createApp(): Promise<Express> {
  const apollo = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });
  await apollo.start();

  const app = express();
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(
    '/graphql',
    // The default 100kb body limit is far too small for the tracker: a compressed
    // screenshot arrives as a base64 data-URL (~33% larger than the JPEG) and would 413.
    express.json({ limit: env.graphqlBodyLimit }),
    expressMiddleware(apollo, { context: async ({ req }) => buildContext({ req }) }),
  );
  return app;
}
