import { Router } from 'express';
import { runForOrganization } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { recordAudit } from '../audit';
import { finishGmailConnect, takeGmailState } from './gmail.connect';
import { GMAIL_AUDIT_MODULE } from './gmail.audit';

/** The portal page a callback returns to, with what happened added to its query. */
export const withParams = (returnTo: string, params: Record<string, string>) =>
  `${returnTo}${returnTo.includes('?') ? '&' : '?'}${new URLSearchParams(params).toString()}`;

interface ConnectState {
  actorId?: string | null;
  updatedByName?: string | null;
  organizationId?: string | null;
}

/** The audit line for a connected mailbox, in the company whose CRM user connected it. */
async function auditConnected(state: ConnectState, email: string): Promise<void> {
  if (!state.organizationId) {
    return;
  }
  await runForOrganization(state.organizationId, () =>
    recordAudit(
      { user: null },
      {
        action: 'CREATE',
        module: GMAIL_AUDIT_MODULE,
        entityLabel: email,
        summary: `Connected the Gmail account ${email}`,
        actor: { id: state.actorId ?? '', name: state.updatedByName ?? '' },
      },
    ),
  );
}

/** Google's redirect after the mailbox owner allows access. No session arrives here. */
export function gmailConnectRouter(): Router {
  const router = Router();
  router.get('/callback', async (req, res) => {
    const nonce = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = nonce === '' ? null : await takeGmailState(nonce);
    if (!state) {
      res.status(400).send('This Gmail connection has expired. Go back and connect again.');
      return;
    }
    try {
      if (code === '') {
        throw new Error('The Gmail connection was cancelled.');
      }
      const email = await finishGmailConnect(state, code);
      await auditConnected(state, email);
      res.redirect(withParams(state.returnTo, { gmailConnected: email }));
    } catch (error) {
      logger.warn({ err: error }, 'Gmail connection failed');
      const message = error instanceof Error ? error.message : 'The Gmail connection failed.';
      res.redirect(withParams(state.returnTo, { gmailError: message }));
    }
  });
  return router;
}
