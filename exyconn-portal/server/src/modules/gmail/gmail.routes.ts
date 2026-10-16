import { Router } from 'express';
import { logger } from '../../utils/logger';
import { finishGmailConnect, takeGmailState } from './gmail.connect';

const withParams = (returnTo: string, params: Record<string, string>) =>
  `${returnTo}${returnTo.includes('?') ? '&' : '?'}${new URLSearchParams(params).toString()}`;

/** Google's redirect after the mailbox owner allows access. No session arrives here. */
export function gmailConnectRouter(): Router {
  const router = Router();
  router.get('/callback', async (req, res) => {
    const nonce = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = nonce === '' ? null : await takeGmailState(nonce);
    if (!state) {
      res.status(400).send('This Gmail connection has expired. Go back to Tech and connect again.');
      return;
    }
    try {
      if (code === '') {
        throw new Error('The Gmail connection was cancelled.');
      }
      const email = await finishGmailConnect(state, code);
      res.redirect(withParams(state.returnTo, { gmailConnected: email }));
    } catch (error) {
      logger.warn({ err: error }, 'Gmail connection failed');
      const message = error instanceof Error ? error.message : 'The Gmail connection failed.';
      res.redirect(withParams(state.returnTo, { gmailError: message }));
    }
  });
  return router;
}
