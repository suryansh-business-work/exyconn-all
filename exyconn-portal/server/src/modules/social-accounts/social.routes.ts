import { Router } from 'express';
import { SOCIAL_APPS, type SocialApp } from './social.constants';
import { completeConnect } from './social.service';
import { logger } from '../../utils/logger';
import { runAsPlatform } from '../../lib/tenant';
import { SocialOAuthStateModel } from './social.models';

const APPS = new Set<string>(SOCIAL_APPS);

/** Adds `?key=value` to the Marketing page the browser goes back to. */
const withParams = (returnTo: string, params: Record<string, string>) =>
  `${returnTo}${returnTo.includes('?') ? '&' : '?'}${new URLSearchParams(params).toString()}`;

/** Where to go when even the state is unknown: its own return address, if it has one. */
async function returnAddressOf(nonce: string): Promise<string | null> {
  const state = await runAsPlatform(() =>
    SocialOAuthStateModel.findOne({ nonce }).select('returnTo').lean(),
  );
  return state?.returnTo ?? null;
}

/**
 * The provider's redirect after consent. No session arrives here — the browser is coming back
 * from LinkedIn, Meta, X or Google — so the stored state is what ties it to a company. The
 * outcome goes back to Marketing as a query parameter, which the page reads and announces.
 */
export function socialCallbackRouter(): Router {
  const router = Router();
  router.get('/:app/callback', async (req, res) => {
    const app = req.params.app.toUpperCase();
    const nonce = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const denied = typeof req.query.error === 'string' ? req.query.error : '';
    if (!APPS.has(app) || nonce === '') {
      res.status(400).send('This is not a valid social sign-in callback.');
      return;
    }
    const fallback = await returnAddressOf(nonce);
    try {
      if (denied !== '' || code === '') {
        throw new Error('The connection was cancelled on the provider’s page.');
      }
      const result = await completeConnect(app as SocialApp, nonce, code);
      res.redirect(
        withParams(result.returnTo, { connected: app, count: String(result.connected) }),
      );
    } catch (error) {
      logger.warn({ err: error, app }, 'Social account connection failed');
      const message = error instanceof Error ? error.message : 'The connection failed.';
      if (fallback === null) {
        res.status(400).send(message);
        return;
      }
      res.redirect(withParams(fallback, { error: message }));
    }
  });
  return router;
}
