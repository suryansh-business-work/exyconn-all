import { Router } from 'express';
import { logger } from '../../../utils/logger';
import { finishGoogleSignIn, takeGoogleState } from './google-sign-in.flow';

/** Adds `?key=value` to the portal page the browser goes back to. */
const withParams = (returnTo: string, params: Record<string, string>) =>
  `${returnTo}${returnTo.includes('?') ? '&' : '?'}${new URLSearchParams(params).toString()}`;

/**
 * Google's redirect after the person picks an account. No session arrives here, so the stored
 * state is what ties it to the page that started; the outcome goes back as a query parameter
 * the sign-in page reads (a ticket to redeem, or a reason it did not work).
 */
export function googleSignInRouter(): Router {
  const router = Router();
  router.get('/callback', async (req, res) => {
    const nonce = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = nonce === '' ? null : await takeGoogleState(nonce);
    if (!state) {
      res.status(400).send('This Google sign-in has expired. Go back to the portal and try again.');
      return;
    }
    try {
      if (code === '') {
        throw new Error('Google sign-in was cancelled.');
      }
      const ticket = await finishGoogleSignIn(state, code);
      res.redirect(withParams(state.returnTo, { googleTicket: ticket }));
    } catch (error) {
      logger.warn({ err: error }, 'Google sign-in failed');
      const message = error instanceof Error ? error.message : 'Google sign-in failed.';
      res.redirect(withParams(state.returnTo, { googleError: message }));
    }
  });
  return router;
}
