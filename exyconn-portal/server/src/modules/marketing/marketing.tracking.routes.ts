import { Router } from 'express';
import type { Types } from 'mongoose';
import { CampaignSendModel } from './campaign-send.model';
import { CampaignClickModel } from './campaign-click.model';
import { CampaignModel } from './marketing.model';
import {
  PIXEL,
  extractLinks,
  hashTrackingToken,
  safeRedirectTarget,
  verifyLinkSignature,
} from './marketing.tracking';
import { CampaignRevisionModel } from './campaign-revision.model';
import { contextsFor } from './campaign.context';
import { messageContext } from './campaign.delivery';
import { personalize } from './campaign.render';
import { PREVIEW_TOKEN } from './campaign.preview';
import { unsubscribeByToken } from './marketing.public';
import { issueUnsubscribeTokens } from './marketing.suppression';
import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { portalOrigin } from '../../utils/portalOrigin';
import { logger } from '../../utils/logger';
import type { RecipientSourceRef } from './audience.resolve';

/**
 * Opens this soon after the copy was handed over are mail scanners and privacy proxies
 * fetching every image, not a person reading — they are not counted as opens.
 */
const PREFETCH_WINDOW_MS = 10_000;

/** The browser view is a web page of email HTML: inline styles and remote images only. */
const VIEW_CSP =
  "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:; frame-ancestors 'none'";

interface SendRow {
  _id: { toHexString(): string };
  campaignId: string;
  to: string;
  sentAt: Date;
  revisionId?: string;
  sources?: RecipientSourceRef[];
  organizationId?: Types.ObjectId;
}

/**
 * The send a tracking token belongs to, and its company. These routes arrive with no
 * company in scope; the token's hash is unique, so it is found platform-wide and everything
 * after runs inside that one company.
 */
async function withSend(token: string, work: (send: SendRow) => Promise<void>): Promise<void> {
  const send = await runAsPlatform(() =>
    CampaignSendModel.findOne({ trackingTokenHash: hashTrackingToken(token) })
      .select('campaignId to sentAt revisionId sources organizationId')
      .lean<SendRow>(),
  );
  if (send?.organizationId) {
    await runForOrganization(send.organizationId.toHexString(), () => work(send));
  }
}

export { TRACKING_PATH } from './marketing.tracking';

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
    const { token } = req.params;
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
    const { token } = req.params;
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

  // RFC 8058 one-click unsubscribe: a mail client POSTs here from its own Unsubscribe button.
  // A POST, never a GET — link scanners follow GETs, and must not unsubscribe anybody.
  router.post('/u/:token', (req, res) => {
    unsubscribeByToken(req.params.token, req.ip ?? 'unknown')
      .then(() => res.status(200).send('You have been unsubscribed.'))
      .catch(() => res.status(400).send('This unsubscribe link is not valid.'));
  });

  router.get('/v/:token', (req, res) => {
    res.set({
      'Content-Security-Policy': VIEW_CSP,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    });
    viewInBrowser(req.params.token)
      .then((html) => {
        if (html) {
          res.type('html').send(html);
        } else {
          res.status(404).send('This email is no longer available.');
        }
      })
      .catch((error: unknown) => {
        logger.error(error, 'Rendering a browser view failed');
        res.status(500).send('This email could not be shown right now.');
      });
  });

  return router;
}

/**
 * One recipient's copy as a web page: the revision they were sent, filled for them again,
 * without tracking. Its unsubscribe link is a fresh token for the same address.
 */
async function viewInBrowser(token: string): Promise<string | null> {
  if (token === PREVIEW_TOKEN) {
    return '<p style="font-family:sans-serif">This is a preview link. The real email shows here.</p>';
  }
  let html: string | null = null;
  await withSend(token, async (send) => {
    const revision = await CampaignRevisionModel.findById(send.revisionId).lean();
    if (!revision) {
      return;
    }
    const recipient = { email: send.to, sources: send.sources ?? [] };
    const [contexts, tokens] = await Promise.all([
      contextsFor([recipient]),
      issueUnsubscribeTokens([send.to], send.campaignId),
    ]);
    const context = contexts.get(send.to);
    if (!context) {
      return;
    }
    const settings = { revision, origin: portalOrigin() };
    html = personalize(
      revision,
      context,
      messageContext(settings, tokens.get(send.to) ?? '', token),
    ).html;
  });
  return html;
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
  if (signature) {
    return verifyLinkSignature(token, url, signature);
  }
  let trusted = false;
  await withSend(token, async (send) => {
    const campaign = await CampaignModel.findById(send.campaignId).select('body').lean();
    trusted = extractLinks(campaign?.body ?? '').includes(url);
  });
  return trusted;
}

/**
 * Counts an open against the recipient it belongs to.
 *
 * `openedAt` is set once and never moved: the first open is a fact about when they read it,
 * where the last one drifts every time a mail client re-renders a cached message.
 */
async function recordOpen(token: string): Promise<void> {
  await withSend(token, async (send) => {
    if (Date.now() - new Date(send.sentAt).getTime() < PREFETCH_WINDOW_MS) {
      return;
    }
    const filter = { _id: send._id };
    // Not `$min`: the row is written with `openedAt: null`, and null sorts below every date,
    // so `$min` would never replace it and no open would ever be dated.
    await CampaignSendModel.updateOne({ ...filter, openedAt: null }, { openedAt: new Date() });
    await CampaignSendModel.updateOne(filter, { $inc: { openCount: 1 } });
  });
}

/** Counts a click, and keeps the URL so "which link" is answerable. */
async function recordClick(token: string, url: string): Promise<void> {
  await withSend(token, async (send) => {
    await CampaignSendModel.updateOne(
      { _id: send._id },
      { $inc: { clickCount: 1 }, $set: { lastClickedAt: new Date() } },
    );
    await CampaignClickModel.create({
      campaignId: send.campaignId,
      sendId: send._id.toHexString(),
      to: send.to,
      url,
    });
  });
}
