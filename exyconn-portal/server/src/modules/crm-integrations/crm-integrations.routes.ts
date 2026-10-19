import { Router } from 'express';
import { runAsPlatform } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { dialXml } from './crm-integrations.call';
import { CrmCallSessionModel } from './crm-integrations.models';

const HANG_UP = '<Response><Hangup/></Response>';

/** The waiting session the token names, deleted as it is read so it bridges one call only. */
const takeSession = (token: string) =>
  runAsPlatform(() => CrmCallSessionModel.findOneAndDelete({ token }).lean());

/**
 * Vobiz's answer callback for a CRM click-to-call (no session arrives here). The token is the
 * only input trusted: it names a call session made moments earlier and expiring in minutes,
 * so a replayed or guessed URL dials nobody.
 */
export function crmIntegrationsVobizRouter(): Router {
  const router = Router();
  router.post('/:token', async (req, res) => {
    res.type('application/xml');
    try {
      const session = await takeSession(String(req.params.token));
      res.send(session ? dialXml(session.callerId, session.dial) : HANG_UP);
    } catch (error) {
      logger.warn({ err: error }, 'CRM call bridge answer failed');
      res.send(HANG_UP);
    }
  });
  return router;
}
