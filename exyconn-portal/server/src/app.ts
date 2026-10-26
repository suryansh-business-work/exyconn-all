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
import { requestInfo } from './middleware/requestInfo';
import { env } from './config/env';
import { TRACKER_UPDATES_PATH, trackerUpdatesRouter } from './modules/tracker/tracker.updates';
import { SOCIAL_CALLBACK_PATH, socialCallbackRouter } from './modules/social-accounts';
import { GOOGLE_CALLBACK_PATH, googleSignInRouter } from './modules/auth/google';
import { GMAIL_CALLBACK_PATH, gmailConnectRouter } from './modules/gmail';
import { MICROSOFT_CALLBACK_PATH, microsoftConnectRouter } from './modules/microsoft-mail';
import { VOBIZ_ANSWER_PATH, crmIntegrationsVobizRouter } from './modules/crm-integrations';
import {
  TRACKING_PATH,
  marketingTrackingRouter,
} from './modules/marketing/marketing.tracking.routes';
import {
  WEBHOOK_PATH,
  whatsappWebhookRouter,
} from '../../../demos/whatsapp-demo/server/src/channel';
import {
  RAZORPAY_WEBHOOK_PATH,
  STRIPE_WEBHOOK_PATH,
  razorpayWebhookRouter,
  stripeWebhookRouter,
} from './modules/clienthub/payments/webhook';
import {
  PAYONEER_NOTIFY_PATH,
  PAYPAL_WEBHOOK_PATH,
} from './modules/clienthub/payments/webhook.paths';
import {
  payoneerNotifyRouter,
  paypalWebhookRouter,
} from './modules/clienthub/payments/webhook.wallets';
import { SLACK_EVENTS_PATH, slackEventsRouter } from './modules/website-chat';
import { tableBulkJobSchemaPlugin } from './modules/table-transfer';
import { mcpRouter, mcpSchemaPlugin } from './modules/mcp';
import {
  GOOGLE_MEET_CALLBACK_PATH,
  MA_REST_PATH,
  googleMeetConnectRouter,
  meetAssistantRouter,
} from './modules/meeting-assistant';

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
    // The table bulk worker runs the modules' own operations through the schema Apollo builds.
    plugins: [...armor.plugins, serverErrorLogPlugin, tableBulkJobSchemaPlugin, mcpSchemaPlugin],
    // Explicit rather than Apollo's NODE_ENV default: the schema is not published in production.
    introspection: !env.isProduction,
    formatError: buildFormatError(env.isProduction),
  });
  await apollo.start();

  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      // The API answers JSON, a redirect or a 1x1 GIF, so no document may load anything from
      // it and none may frame it.
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      // Tracking pixels (/m/o/*.gif) and tracker update redirects are loaded from other
      // origins (mail clients, the desktop app), so 'same-origin' would break them.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // Every request runs inside an organization scope; the context below decides which one.
  app.use(tenantScope());
  app.use(requestInfo());
  // One proxy hop (the host nginx), so `req.ip` is the real caller rather than 127.0.0.1 —
  // the public status-page mutation rate-limits on it.
  app.set('trust proxy', 1);
  // Claude's custom connectors: every module's MCP server, the global one, and their OAuth
  // sign-in. Before the portals' CORS, which would answer a connector's preflight without
  // letting it through.
  app.use(mcpRouter());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  // The desktop tracker's updater, which runs before anyone signs in and speaks plain
  // HTTP rather than GraphQL.
  app.use(TRACKER_UPDATES_PATH, trackerUpdatesRouter());
  // Public and unauthenticated by necessity: these are loaded by a mail client, not a session.
  app.use(TRACKING_PATH, marketingTrackingRouter());
  // Where LinkedIn, Meta, X and Google send the browser back after consent (no session).
  app.use(SOCIAL_CALLBACK_PATH, socialCallbackRouter());
  // Where Google sends the browser back during "Continue with Google" (no session).
  app.use(GOOGLE_CALLBACK_PATH, googleSignInRouter());
  // Where Google sends the browser back when Tech connects the CRM's Gmail (no session).
  app.use(GMAIL_CALLBACK_PATH, gmailConnectRouter());
  // Where Microsoft sends the browser back when the CRM connects an Outlook mailbox (no session).
  app.use(MICROSOFT_CALLBACK_PATH, microsoftConnectRouter());
  // Vobiz fetches a CRM click-to-call's answer XML here; a single-use token names the call.
  app.use(VOBIZ_ANSWER_PATH, crmIntegrationsVobizRouter());
  // Meta's WhatsApp Cloud API delivers messages here; each delivery is signed (no session).
  app.use(WEBHOOK_PATH, whatsappWebhookRouter());
  // Stripe and Razorpay confirm client hub payments here; each delivery is signed (no session).
  app.use(STRIPE_WEBHOOK_PATH, stripeWebhookRouter());
  app.use(RAZORPAY_WEBHOOK_PATH, razorpayWebhookRouter());
  // PayPal (verified with PayPal) and Payoneer (re-read from Payoneer) confirm payments here.
  app.use(PAYPAL_WEBHOOK_PATH, paypalWebhookRouter());
  app.use(PAYONEER_NOTIFY_PATH, payoneerNotifyRouter());
  // Agents' replies in website chat Slack threads; each delivery is signed (no session).
  app.use(SLACK_EVENTS_PATH, slackEventsRouter());
  // The Meeting Assistant Chrome extension: its OAuth token endpoint, audio uploads (an
  // extension Bearer token, checked per request) and signed, expiring downloads.
  app.use(MA_REST_PATH, meetAssistantRouter());
  // Where Google sends the browser back when someone connects Google Meet (no session).
  app.use(GOOGLE_MEET_CALLBACK_PATH, googleMeetConnectRouter());
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
