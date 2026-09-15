import { Router } from 'express';
import { CampaignSendModel } from './campaign-send.model';
import { CampaignClickModel } from './campaign-click.model';
import { CampaignModel } from './marketing.model';
import {
  PIXEL,
  TRACKING_PATH,
  extractLinks,
  hashTrackingToken,
  safeRedirectTarget,
  verifyLinkSignature,
} from './marketing.tracking';
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

  router.get('/c/:token', async (req, res) => {
    const token = String(req.params.token ?? '');
    // Express has already decoded the query string; decoding it again would let `%2525`-style
    // input turn into a different URL than the one that was signed.
    const target = safeRedirectTarget(typeof req.query.u === 'string' ? req.query.u : undefined);
    const signature = typeof req.query.s === 'string' ? req.query.s : '';

    let allowed = false;
    if (target) {
      try {
        allowed = await isTrustedLink(token, target, signature);
      } catch (error) {
        logger.error(error, 'Checking a click link failed');
      }
    }

    if (!target || !allowed) {
      // Never redirect to something this server did not put in a campaign — this route is
      // public, so without the check it is an open redirect wearing our domain.
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
 * Whether a click link was really written by a campaign send.
 *
 * Links rewritten since signing was introduced carry `s=` and are checked against it alone.
 * Links in emails sent BEFORE that have no signature; they are still followed, but only when
 * the token belongs to a real send and the target is, character for character, a link in
 * that campaign's stored body. A legacy link whose target came from a merge field (so is not
 * in the stored body verbatim), or whose campaign body has since been edited, is refused.
 */
async function isTrustedLink(token: string, url: string, signature: string): Promise<boolean> {
  if (!token) {
    return false;
  }
  if (signature) {
    return verifyLinkSignature(token, url, signature);
  }
  const send = await CampaignSendModel.findOne({ trackingTokenHash: hashTrackingToken(token) })
    .select('campaignId')
    .lean();
  if (!send) {
    return false;
  }
  const campaign = await CampaignModel.findById(send.campaignId).select('body').lean();
  return extractLinks(campaign?.body ?? '').includes(url);
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
