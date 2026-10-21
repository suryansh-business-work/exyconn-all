import { Router } from 'express';
import { env } from '../../config/env';
import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { seal } from '../../utils/secretBox';
import { readGoogleConfig } from '../auth/google/google-sign-in.config';
import {
  exchangeForTokens,
  randomToken,
  sha256,
  verifiedEmailOf,
} from '../auth/google/google-sign-in.oauth';
import { recordAudit } from '../audit';
import { withParams } from '../gmail/gmail.routes';
import { MaGoogleConnectionModel, MaGoogleStateModel } from './models';
import { MA_AUDIT_MODULE } from './ma.enums';
import type { MaActor } from './ma.access';

export const GOOGLE_MEET_CALLBACK_PATH = '/oauth/google-meet';
/** Read-only access to the person's calendar events, for the Meeting Assistant calendar. */
export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';
/**
 * Read-only access to the person's Meet conference records, transcripts and participants, and
 * to their calendar events.
 */
const SCOPES = `openid email https://www.googleapis.com/auth/meetings.space.readonly ${GOOGLE_CALENDAR_SCOPE}`;
const PORTAL_ORIGINS: ReadonlySet<string> = new Set(env.corsOrigins);

const redirectUri = () => `${env.apiPublicUrl}${GOOGLE_MEET_CALLBACK_PATH}/callback`;

/** Whether the install has the Google client it needs (Tech > Environment Variables). */
export async function googleMeetConfigured(): Promise<boolean> {
  const client = await readGoogleConfig();
  return Boolean(client.clientId && client.clientSecret);
}

/** Google's consent page for the Meet read-only scope; the callback stores the token. */
export async function startGoogleMeetConnect(
  returnTo: string,
  actor: MaActor,
  organizationId: string,
): Promise<string> {
  const client = await readGoogleConfig();
  if (!client.clientId || !client.clientSecret) {
    badRequest(
      'Google is not configured. Ask an administrator to add the Google sign-in client in Tech.',
    );
  }
  if (!URL.canParse(returnTo) || !PORTAL_ORIGINS.has(new URL(returnTo).origin)) {
    badRequest('That is not a portal address.');
  }
  const nonce = randomToken(24);
  const codeVerifier = randomToken(48);
  await runAsPlatform(() =>
    MaGoogleStateModel.create({
      nonce,
      codeVerifier,
      returnTo,
      userId: actor.id,
      userName: actor.name,
      organizationId,
    }),
  );
  const params = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPES,
    state: nonce,
    code_challenge: sha256(codeVerifier),
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface PendingConnect {
  codeVerifier: string;
  userId: string;
  userName: string;
  organizationId: string;
}

/** Trades the code and keeps the refresh token sealed on the person's connection row. */
async function finish(state: PendingConnect, code: string): Promise<string> {
  const client = await readGoogleConfig();
  const tokens = await exchangeForTokens(client, code, state.codeVerifier, redirectUri());
  if (!tokens.refresh_token || !tokens.id_token) {
    throw new Error('Google did not grant offline access. Try Connect again.');
  }
  const email = verifiedEmailOf(tokens.id_token, client.clientId);
  const scopes = (tokens.scope ?? '').split(' ').filter(Boolean);
  await runForOrganization(state.organizationId, async () => {
    await MaGoogleConnectionModel.updateOne(
      { userId: state.userId },
      { $set: { email, refreshToken: seal(tokens.refresh_token ?? ''), scopes, lastError: '' } },
      { upsert: true },
    );
    await recordAudit(
      { user: null },
      {
        action: 'CREATE',
        module: MA_AUDIT_MODULE,
        entityLabel: email,
        summary: `Connected Google Meet (${email}) for official transcripts`,
        actor: { id: state.userId, name: state.userName },
      },
    );
  });
  return email;
}

/** Google's redirect after consent. No session arrives here: the stored state says who. */
export function googleMeetConnectRouter(): Router {
  const router = Router();
  router.get('/callback', async (req, res) => {
    const nonce = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state =
      nonce === ''
        ? null
        : await runAsPlatform(() => MaGoogleStateModel.findOneAndDelete({ nonce }).lean());
    if (!state) {
      res.status(400).send('This Google Meet connection has expired. Go back and connect again.');
      return;
    }
    try {
      if (code === '') {
        throw new Error('The Google Meet connection was cancelled.');
      }
      const email = await finish(state, code);
      res.redirect(withParams(state.returnTo, { googleMeetConnected: email }));
    } catch (error) {
      logger.warn({ err: error }, 'Google Meet connection failed');
      const message = error instanceof Error ? error.message : 'The Google Meet connection failed.';
      res.redirect(withParams(state.returnTo, { googleMeetError: message }));
    }
  });
  return router;
}
