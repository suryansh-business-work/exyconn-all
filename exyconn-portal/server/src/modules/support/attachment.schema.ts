import { Schema, type InferSchemaType } from 'mongoose';

/**
 * A file hung off a ticket or one of its replies. The bytes live on the image CDN
 * (uploaded through `uploadImage`); only the resulting URL and enough metadata to
 * render a link are stored here.
 *
 * Embedded rather than a collection of its own: an attachment has no life outside
 * the message it was posted with, and is always read with it.
 */
export const attachmentSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    contentType: { type: String, default: '', trim: true },
    /** Display name of whoever posted it, stored so the thread reads once accounts go. */
    uploadedBy: { type: String, default: '', trim: true },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

export type Attachment = InferSchemaType<typeof attachmentSchema>;

/** What a client sends when it posts a file: the server stamps who and when. */
export interface AttachmentInput {
  url: string;
  name: string;
  contentType?: string | null;
}

/** Nothing about an attachment is trusted from the client except the URL, name and type. */
export function toAttachments(
  inputs: AttachmentInput[] | null | undefined,
  uploadedBy: string,
): Attachment[] {
  return (inputs ?? []).map((input) => ({
    url: input.url.trim(),
    name: input.name.trim(),
    contentType: input.contentType?.trim() ?? '',
    uploadedBy,
    uploadedAt: new Date(),
  }));
}
