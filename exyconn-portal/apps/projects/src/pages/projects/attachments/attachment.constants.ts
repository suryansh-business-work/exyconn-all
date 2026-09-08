/**
 * What a ticket attachment may be.
 *
 * ImageKit — the single upload path behind `uploadImage` — stores whatever it is handed, so
 * the limit is ours rather than the provider's: images because they are what a bug report is
 * usually made of, and PDF because that is what a spec or a signed-off design arrives as.
 * Anything else would be a file store nobody asked for, on a CDN meant for media.
 */
export const ATTACHMENT_MIME_TYPES = ['image/*', 'application/pdf'] as const;

/** The `accept` attribute for the file input, from the one list above. */
export const ATTACHMENT_ACCEPT = ATTACHMENT_MIME_TYPES.join(',');

/** Upper bound per file, matching the shared image upload dialog's own limit. */
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const MAX_ATTACHMENT_MB = MAX_ATTACHMENT_BYTES / (1024 * 1024);

/** The help text under every attachment picker, so the rule is written once. */
export const ATTACHMENT_HELP = `Images or PDF · up to ${MAX_ATTACHMENT_MB} MB each`;

/** Where these land on ImageKit, alongside branding, blog and the rest. */
export const ATTACHMENT_FOLDER = 'ticket-attachments';

/** Whether a picked file is one of the kinds above. */
export function isAllowedAttachment(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}
