import { z } from 'zod';
import { hasCompliantFooter, hrefsIn, imagesIn } from './campaign.mjml';
import { unknownVariables } from './campaign.variables';
import { verifiedSenders } from './campaign.sender';
import { PreferenceCategoryModel } from './preference.model';
import type { CompiledEmail } from './campaign.render';

export type CheckSeverity = 'ERROR' | 'WARNING' | 'INFO';

/** One finding. ERRORs block a real send; WARNINGs are shown and may be accepted. */
export interface QualityCheck {
  code: string;
  severity: CheckSeverity;
  message: string;
  /** The MJML line, for problems the editor can point at. */
  line: number | null;
}

/** The draft fields the checks read. */
export interface CheckedDraft {
  subject: string;
  preheader: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
  mjml: string;
  preferenceCategoryId: string;
}

const SUBJECT_SOFT_LIMIT = 90;
const SUBJECT_HARD_LIMIT = 255;
const PREHEADER_LIMIT = 150;
const TOKEN_LINK = /^\{\{[^{}]+\}\}$/;
const ALLOWED_SCHEMES = /^(https?:\/\/|mailto:|tel:)/i;

const check = (
  code: string,
  severity: CheckSeverity,
  message: string,
  line: number | null = null,
): QualityCheck => ({
  code,
  severity,
  message,
  line,
});

const isEmail = (value: string) => z.email().safeParse(value).success;

function subjectChecks(draft: CheckedDraft): QualityCheck[] {
  const found: QualityCheck[] = [];
  const subject = draft.subject.trim();
  if (!subject) {
    found.push(check('SUBJECT_MISSING', 'ERROR', 'Add a subject line.'));
  } else if (subject.length > SUBJECT_HARD_LIMIT) {
    found.push(
      check(
        'SUBJECT_TOO_LONG',
        'ERROR',
        `Keep the subject under ${SUBJECT_HARD_LIMIT} characters.`,
      ),
    );
  } else if (subject.length > SUBJECT_SOFT_LIMIT) {
    found.push(
      check(
        'SUBJECT_LONG',
        'WARNING',
        `Subjects over ${SUBJECT_SOFT_LIMIT} characters are cut off in most inboxes.`,
      ),
    );
  }
  if (!draft.preheader.trim()) {
    found.push(
      check(
        'PREHEADER_MISSING',
        'WARNING',
        'Add preview text; otherwise inboxes show the first words of the email.',
      ),
    );
  } else if (draft.preheader.length > PREHEADER_LIMIT) {
    found.push(
      check('PREHEADER_LONG', 'WARNING', `Keep preview text under ${PREHEADER_LIMIT} characters.`),
    );
  }
  return found;
}

async function senderChecks(draft: CheckedDraft): Promise<QualityCheck[]> {
  const found: QualityCheck[] = [];
  const verified = await verifiedSenders();
  if (verified.length === 0) {
    found.push(
      check('NO_SENDER', 'ERROR', 'No email configuration is active. Add one in Tech > Email.'),
    );
  } else if (!verified.includes(draft.senderEmail.trim().toLowerCase())) {
    found.push(
      check('SENDER_UNVERIFIED', 'ERROR', `Send from a verified address: ${verified.join(', ')}.`),
    );
  }
  if (!draft.senderName.trim()) {
    found.push(
      check(
        'SENDER_NAME_MISSING',
        'WARNING',
        'Add a sender name so recipients recognise the email.',
      ),
    );
  }
  if (draft.replyTo && !isEmail(draft.replyTo)) {
    found.push(check('REPLY_TO_INVALID', 'ERROR', 'The reply-to address is not a valid email.'));
  }
  return found;
}

function linkChecks(html: string): QualityCheck[] {
  const found: QualityCheck[] = [];
  for (const href of new Set(hrefsIn(html))) {
    if (href === '' || href === '#') {
      found.push(check('LINK_EMPTY', 'WARNING', 'A link or button has no destination.'));
    } else if (TOKEN_LINK.test(href)) {
      continue;
    } else if (
      !ALLOWED_SCHEMES.test(href) ||
      !URL.canParse(href.replaceAll(/\{\{[^{}]+\}\}/g, 'x'))
    ) {
      found.push(check('LINK_MALFORMED', 'ERROR', `This link is not a valid web address: ${href}`));
    } else if (href.toLowerCase().startsWith('http://')) {
      found.push(check('LINK_INSECURE', 'WARNING', `Use https for ${href}.`));
    }
  }
  return found;
}

function imageChecks(mjml: string): QualityCheck[] {
  return imagesIn(mjml).flatMap((image) => {
    if (!image.src) {
      return [check('IMAGE_NO_SOURCE', 'ERROR', 'An image has no address.')];
    }
    const found: QualityCheck[] = [];
    if (!image.alt.trim()) {
      found.push(
        check(
          'IMAGE_NO_ALT',
          'WARNING',
          `Add alternative text to ${image.src} for screen readers and blocked images.`,
        ),
      );
    }
    if (!image.src.toLowerCase().startsWith('https://')) {
      found.push(
        check(
          'IMAGE_INSECURE',
          'WARNING',
          `Load ${image.src} over https, or mail clients may block it.`,
        ),
      );
    }
    return found;
  });
}

async function categoryChecks(draft: CheckedDraft): Promise<QualityCheck[]> {
  if (!draft.preferenceCategoryId) {
    return [
      check('CATEGORY_NONE', 'INFO', 'No preference category: only unsubscribe-from-all applies.'),
    ];
  }
  const category = await PreferenceCategoryModel.findById(draft.preferenceCategoryId)
    .select('isActive')
    .lean();
  return category?.isActive
    ? []
    : [
        check(
          'CATEGORY_INVALID',
          'ERROR',
          'The preference category no longer exists or is switched off.',
        ),
      ];
}

/**
 * Everything that has to be right before the email may go to real people. The same function
 * runs in the Test & Preview step and again when a send is queued.
 */
export async function contentChecks(
  draft: CheckedDraft,
  compiled: CompiledEmail,
): Promise<QualityCheck[]> {
  const mjmlProblems = compiled.issues.map((issue) =>
    check('MJML', 'ERROR', issue.message, issue.line),
  );
  if (!compiled.html && mjmlProblems.length === 0) {
    mjmlProblems.push(check('MJML_EMPTY', 'ERROR', 'The email has no content.'));
  }
  const unknown = unknownVariables(`${draft.subject} ${draft.preheader} ${draft.mjml}`).map((key) =>
    check('VARIABLE_UNKNOWN', 'ERROR', `{{${key}}} is not a known variable.`),
  );
  const footer = hasCompliantFooter(draft.mjml)
    ? check('FOOTER_OWN', 'INFO', 'Your design includes unsubscribe and preference links.')
    : check(
        'FOOTER_ADDED',
        'INFO',
        'The standard footer with unsubscribe and preference links is added automatically.',
      );
  return [
    ...subjectChecks(draft),
    ...(await senderChecks(draft)),
    ...mjmlProblems,
    ...unknown,
    ...linkChecks(compiled.html),
    ...imageChecks(draft.mjml),
    ...(await categoryChecks(draft)),
    footer,
  ];
}

export const blocking = (checks: readonly QualityCheck[]): QualityCheck[] =>
  checks.filter((found) => found.severity === 'ERROR');
