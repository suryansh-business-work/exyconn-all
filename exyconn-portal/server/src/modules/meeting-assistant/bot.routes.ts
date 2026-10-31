import { timingSafeEqual } from 'node:crypto';
import express, { type Request, type Response, type Router } from 'express';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { claimBotDispatch, reportBotStatus } from './bot.service';

const DISPATCH_ID = /^[\da-f]{24}$/;

/** Whether the request carries the bot service's shared secret. */
function isBotService(req: Request): boolean {
  const expected = Buffer.from(`Bearer ${env.meetAssistant.botToken}`);
  const given = Buffer.from(req.headers.authorization ?? '');
  return (
    env.meetAssistant.botToken.length > 0 &&
    expected.length === given.length &&
    timingSafeEqual(expected, given)
  );
}

/** Runs a bot endpoint behind the shared secret; any failure answers 500 and is logged. */
const guarded =
  (label: string, handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => {
    if (!isBotService(req)) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }
    handler(req, res).catch((error: unknown) => {
      logger.error({ err: error }, label);
      if (!res.headersSent) {
        res.status(500).json({ error: 'server_error' });
      }
    });
  };

/** The next trip for a free bot: 200 with the assignment, or 204 when nothing is due. */
async function claim(_req: Request, res: Response): Promise<void> {
  res.set('Cache-Control', 'no-store');
  const assignment = await claimBotDispatch();
  if (assignment) {
    res.json(assignment);
  } else {
    res.status(204).end();
  }
}

/** The bot's progress on a trip; the answer tells it to leave when the trip was called off. */
async function status(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (!DISPATCH_ID.test(id) || typeof body.status !== 'string') {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }
  const meetingId = typeof body.meetingId === 'string' ? body.meetingId.slice(0, 24) : null;
  const error = typeof body.error === 'string' ? body.error : null;
  res.json(await reportBotStatus(id, { status: body.status, meetingId, error }));
}

/**
 * The meeting bot service's endpoints, under the assistant's REST path. Everything else the
 * bot does (start, consent, audio, video, heartbeat, finalize) goes through the extension's
 * own endpoints with the owner's bot session token.
 */
export function addBotRoutes(router: Router): void {
  router.post('/bot/claim', guarded('Meeting bot claim failed', claim));
  router.post(
    '/bot/:id/status',
    express.json({ limit: '4kb' }),
    guarded('Meeting bot status failed', status),
  );
}
