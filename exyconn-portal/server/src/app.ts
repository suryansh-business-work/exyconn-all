import express, { type Express } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './graphql';
import { serverErrorLogPlugin } from './modules/logs';
import { buildContext, type GraphQLContext } from './middleware/auth';
import { env } from './config/env';
import { TRACKER_UPDATES_PATH, trackerUpdatesRouter } from './modules/tracker/tracker.updates';
import {
  TRACKING_PATH,
  marketingTrackingRouter,
} from './modules/marketing/marketing.tracking.routes';

/**
 * Builds the Express app with the Apollo GraphQL middleware mounted at /graphql.
 * Returned (not started) so tests can drive it via supertest.
 */
export async function createApp(): Promise<Express> {
  const apollo = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [serverErrorLogPlugin],
  });
  await apollo.start();

  const app = express();
  // One proxy hop (the host nginx), so `req.ip` is the real caller rather than 127.0.0.1 —
  // the public status-page mutation rate-limits on it.
  app.set('trust proxy', 1);
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  // The desktop tracker's updater, which runs before anyone signs in and speaks plain
  // HTTP rather than GraphQL.
  app.use(TRACKER_UPDATES_PATH, trackerUpdatesRouter());
  // Public and unauthenticated by necessity: these are loaded by a mail client, not a session.
  app.use(TRACKING_PATH, marketingTrackingRouter());
  app.use(
    '/graphql',
    // The default 100kb body limit is far too small for the tracker: a compressed
    // screenshot arrives as a base64 data-URL (~33% larger than the JPEG) and would 413.
    express.json({ limit: env.graphqlBodyLimit }),
    expressMiddleware(apollo, { context: async ({ req }) => buildContext({ req }) }),
  );
  return app;
}
