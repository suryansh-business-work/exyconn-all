import { Router } from 'express';
import { CampaignSendModel } from './campaign-send.model';
import { CampaignClickModel } from './campaign-click.model';
import { PIXEL, TRACKING_PATH, hashTrackingToken, safeRedirectTarget } from './marketing.tracking';
import { logger } from '../../utils/logger';

export { TRACKING_PATH };

/**
 * The two public endpoints a sent campaign points at.
 *
 * Anybody on the internet can call these — that is what makes them work from a mail client —
 * so neither can do anything but record. There is no authentication to check and nothing to
 * authorise: an unknown token records nothing and still answers normally, because a tracker
 * that behaves differently for a valid token is a tracker that confirms an address exists.
 *
 * Nothing here is allowed to fail visibly either. A recording that throws must still return
 * the pixel, or a database blip turns into a broken image in somebody's inbox.
 */
export function marketingTrackingRouter(): Router {
  const router = Router();

  router.get('/o/:token.gif', (req, res) => {
    const token = String(req.params.token ?? '');
    // Answer FIRST, record after. The pixel's job is to load; the counting is our problem.
    res.set({
      'Content-Type': 'image/gif',
      // Or the client caches the pixel and the second open is never seen.
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
    });
    res.send(PIXEL);

    recordOpen(token).catch((error: unknown) => logger.error(error, 'Recording an open failed'));
  });

  router.get('/c/:token', (req, res) => {
    const token = String(req.params.token ?? '');
    const target = safeRedirectTarget(
      typeof req.query.u === 'string' ? decodeURIComponent(req.query.u) : undefined,
    );

    if (!target) {
      // Never redirect to something we would not follow — this route is public, so without
      // the check it is an open redirect wearing our domain.
      res.status(400).send('This link is not valid.');
      return;
    }

    res.redirect(302, target);
    recordClick(token, target).catch((error: unknown) =>
      logger.error(error, 'Recording a click failed'),
    );
  });

  return router;
}

/**
 * Counts an open against the recipient it belongs to.
 *
 * `openedAt` is set once and never moved: the first open is a fact about when they read it,
 * where the last one drifts every time a mail client re-renders a cached message.
 */
async function recordOpen(token: string): Promise<void> {
  if (!token) {
    return;
  }
  await CampaignSendModel.updateOne(
    { trackingTokenHash: hashTrackingToken(token) },
    { $inc: { openCount: 1 }, $min: { openedAt: new Date() } },
  );
}

/** Counts a click, and keeps the URL so "which link" is answerable. */
async function recordClick(token: string, url: string): Promise<void> {
  if (!token) {
    return;
  }
  const send = await CampaignSendModel.findOneAndUpdate(
    { trackingTokenHash: hashTrackingToken(token) },
    { $inc: { clickCount: 1 }, $set: { lastClickedAt: new Date() } },
  );
  if (!send) {
    return;
  }
  await CampaignClickModel.create({
    campaignId: send.campaignId,
    sendId: String(send._id),
    to: send.to,
    url,
  });
}
