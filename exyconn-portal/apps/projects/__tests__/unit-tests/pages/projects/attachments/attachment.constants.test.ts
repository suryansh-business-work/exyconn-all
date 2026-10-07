import { describe, expect, it } from 'vitest';
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_HELP,
  ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
  isAllowedAttachment,
} from '../../../../../src/pages/projects/attachments';

describe('attachment rules', () => {
  it('accepts images and PDFs, written once for the file input', () => {
    expect(ATTACHMENT_MIME_TYPES).toEqual(['image/*', 'application/pdf']);
    expect(ATTACHMENT_ACCEPT).toBe('image/*,application/pdf');
  });

  it('caps a file at 5 MB and says so in the help text', () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(5 * 1024 * 1024);
    expect(ATTACHMENT_HELP).toBe('Images or PDF · up to 5 MB each');
  });

  it('allows any image and a PDF, and nothing else', () => {
    expect(isAllowedAttachment('image/png')).toBe(true);
    expect(isAllowedAttachment('image/svg+xml')).toBe(true);
    expect(isAllowedAttachment('application/pdf')).toBe(true);
    expect(isAllowedAttachment('application/zip')).toBe(false);
    expect(isAllowedAttachment('')).toBe(false);
  });
});
