import { MarketingFooterModel } from './marketing-footer.model';
import {
  compileMjml,
  htmlToText,
  prepareMjml,
  type FooterContent,
  type MjmlIssue,
} from './campaign.mjml';
import { renderVariables, type MessageContext, type RecipientContext } from './campaign.variables';
import { appendPixel, rewriteLinks } from './marketing.tracking';

/** The authored parts of an email, from a draft or a frozen revision. */
export interface EmailContent {
  subject: string;
  preheader: string;
  mjml: string;
}

/** The email compiled once, with every variable still in place. */
export interface CompiledEmail {
  subject: string;
  html: string;
  /** The MJML actually compiled — footer and preheader included. */
  mjml: string;
  issues: MjmlIssue[];
}

/** One recipient's finished copy. */
export interface PersonalizedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Per-copy tracking: where the tracker lives, the copy's token, and what may be counted. */
export interface CopyTracking {
  origin: string;
  token: string;
  opens: boolean;
  clicks: boolean;
}

const DEFAULT_FOOTER: FooterContent = {
  companyName: '',
  contactLine: '',
  postalAddress: '',
  privacyUrl: '',
  websiteUrl: '',
  textColor: '#6b7280',
  linkColor: '#2563eb',
};

/** The organization's footer settings, or an empty footer that still carries both links. */
export async function loadFooter(): Promise<FooterContent> {
  const row = await MarketingFooterModel.findOne().lean();
  return row ? { ...DEFAULT_FOOTER, ...row } : DEFAULT_FOOTER;
}

/**
 * Compiles an email once. Variables survive compilation untouched and are filled per copy,
 * so a ten-thousand-recipient send compiles MJML one time, not ten thousand.
 */
export async function compileEmail(
  content: EmailContent,
  footer: FooterContent,
): Promise<CompiledEmail> {
  const mjml = prepareMjml(content.mjml, content.preheader, footer);
  const { html, issues } = await compileMjml(mjml);
  return { subject: content.subject, html, mjml, issues };
}

/**
 * One recipient's copy: variables filled and escaped, then — for a real send only — links and
 * the open pixel added. The recipient's own unsubscribe, preference and browser links are
 * never rewritten through the tracker: a legal obligation must not depend on it.
 */
export function personalize(
  compiled: Pick<CompiledEmail, 'subject' | 'html'>,
  recipient: RecipientContext,
  message: MessageContext,
  tracking?: CopyTracking,
): PersonalizedEmail {
  let html = renderVariables(compiled.html, recipient, message, 'html');
  const text = htmlToText(html);
  if (tracking?.clicks) {
    const exempt = [message.unsubscribeUrl, message.preferencesUrl, message.viewInBrowserUrl];
    html = rewriteLinks(html, tracking.origin, tracking.token, exempt);
  }
  if (tracking?.opens) {
    html = appendPixel(html, tracking.origin, tracking.token);
  }
  return { subject: renderVariables(compiled.subject, recipient, message, 'text'), html, text };
}
