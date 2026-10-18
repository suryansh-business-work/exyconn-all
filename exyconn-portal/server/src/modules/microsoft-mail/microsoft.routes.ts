import { Router } from 'express';
import { runForOrganization } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { recordAudit } from '../audit';
import { withParams } from '../gmail/gmail.routes';
import { finishMicrosoftConnect, takeMicrosoftState } from './microsoft.connect';
import { MICROSOFT_AUDIT_MODULE } from './microsoft.audit';
import type { MicrosoftOAuthStateDocument } from './microsoft.models';

/** The audit line for a connected mailbox, in the company whose CRM user connected it. */
async function auditConnected(state: MicrosoftOAuthStateDocument, email: string) {
  if (!state.organizationId) {
    return;
  }
  await runForOrganization(state.organizationId, () =>
    recordAudit(
      { user: null },
      {
        action: 'CREATE',
        module: MICROSOFT_AUDIT_MODULE,
        entityLabel: email,
        summary: `Connected the Microsoft mailbox ${email}`,
        actor: { id: state.actorId ?? '', name: state.actorName ?? '' },
      },
    ),
  );
}

/** Microsoft's redirect after the mailbox owner allows access. No session arrives here. */
export function microsoftConnectRouter(): Router {
  const router = Router();
  router.get('/callback', async (req, res) => {
    const nonce = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = nonce === '' ? null : await takeMicrosoftState(nonce);
    if (!state) {
      res.status(400).send('This Microsoft connection has expired. Go back and connect again.');
      return;
    }
    try {
      if (code === '') {
        throw new Error('The Microsoft connection was cancelled.');
      }
      const email = await finishMicrosoftConnect(state, code);
      await auditConnected(state, email);
      res.redirect(withParams(state.returnTo, { microsoftConnected: email }));
    } catch (error) {
      logger.warn({ err: error }, 'Microsoft mailbox connection failed');
      const message = error instanceof Error ? error.message : 'The Microsoft connection failed.';
      res.redirect(withParams(state.returnTo, { microsoftError: message }));
    }
  });
  return router;
}
