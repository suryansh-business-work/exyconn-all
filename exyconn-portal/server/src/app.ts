import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './graphql';
import { buildFormatError } from './graphql/formatError';
import { graphqlArmor } from './graphql/security/limits';
import { serverErrorLogPlugin } from './modules/logs';
import { buildContext, type GraphQLContext } from './middleware/auth';
import { tenantScope } from './middleware/tenant';
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
  const armor = graphqlArmor();
  const apollo = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    // Depth, alias, cost and token limits (see graphql/security/limits.ts). Armor also turns
    // off batched HTTP requests and stack traces in responses.
    ...armor,
    plugins: [...armor.plugins, serverErrorLogPlugin],
    // Explicit rather than Apollo's NODE_ENV default: the schema is not published in production.
    introspection: !env.isProduction,
    formatError: buildFormatError(env.isProduction),
  });
  await apollo.start();

  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      // The API answers JSON, a redirect or a 1x1 GIF — no HTML for a CSP to protect.
      contentSecurityPolicy: false,
      // Tracking pixels (/m/o/*.gif) and tracker update redirects are loaded from other
      // origins (mail clients, the desktop app), so 'same-origin' would break them.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // Every request runs inside an organization scope; the context below decides which one.
  app.use(tenantScope());
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
    // Sized to nginx's client_max_body_size (see env.graphqlBodyLimit).
    express.json({ limit: env.graphqlBodyLimit }),
    expressMiddleware(apollo, { context: async ({ req }) => buildContext({ req }) }),
  );
  return app;
}
