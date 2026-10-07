import {
  AVATAR_UPLOAD,
  CHAT_UPLOAD,
  FONT_UPLOAD,
  MEDIA_UPLOAD,
  RESUME_UPLOAD,
  TEST_UPLOAD,
  assertUpload,
  kindOfMime,
  screenshotUpload,
  type UploadKind,
  type UploadPolicy,
} from '../../../src/utils/uploadValidation';

const b64 = (bytes: string) => Buffer.from(bytes, 'latin1').toString('base64');
const dataUrl = (mime: string, bytes: string) => `data:${mime};base64,${b64(bytes)}`;
const EVERYTHING: UploadPolicy = {
  kinds: new Set<UploadKind>([
    'png',
    'jpeg',
    'gif',
    'webp',
    'svg',
    'pdf',
    'doc',
    'docx',
    'mp4',
    'webm',
    'ogg',
    'mp3',
    'wav',
    'woff2',
    'woff',
    'ttf',
    'otf',
  ]),
  maxBytes: 1024 * 1024,
};

/** The leading bytes of a file of each kind, as the matchers recognise it. */
const SAMPLES: ReadonlyArray<readonly [UploadKind, string, string]> = [
  ['png', 'image/png', '\x89PNG\r\n\x1A\n....'],
  ['jpeg', 'image/jpeg', '\xFF\xD8\xFF\xE0....'],
  ['gif', 'image/gif', 'GIF87a....'],
  ['gif', 'image/gif', 'GIF89a....'],
  ['webp', 'image/webp', 'RIFF\x00\x00\x00\x00WEBPVP8 '],
  ['svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg"></svg>'],
  ['pdf', 'application/pdf', '%PDF-1.7\n'],
  ['doc', 'application/msword', '\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1....'],
  [
    'docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'PK\x03\x04....',
  ],
  ['mp4', 'video/mp4', '\x00\x00\x00\x18ftypmp42'],
  ['webm', 'video/webm', '\x1A\x45\xDF\xA3....'],
  ['ogg', 'audio/ogg', 'OggS....'],
  ['mp3', 'audio/mpeg', 'ID3\x04....'],
  ['mp3', 'audio/mpeg', '\xFF\xFB\x90\x00'],
  ['wav', 'audio/wav', 'RIFF\x00\x00\x00\x00WAVEfmt '],
  ['woff2', 'font/woff2', 'wOF2....'],
  ['woff', 'font/woff', 'wOFF....'],
  ['ttf', 'font/ttf', '\x00\x01\x00\x00....'],
  ['ttf', 'font/ttf', 'true....'],
  ['otf', 'font/otf', 'OTTO....'],
];

describe('assertUpload — recognising each kind', () => {
  it.each(SAMPLES)('recognises %s from a data URL claiming %s', (kind, mime, bytes) => {
    expect(assertUpload(dataUrl(mime, bytes), EVERYTHING)).toBe(kind);
  });

  it('recognises bare base64 against the kinds the policy allows', () => {
    expect(assertUpload(b64('%PDF-1.4'), RESUME_UPLOAD)).toBe('pdf');
    expect(assertUpload(b64('\xFF\xD8\xFF\xDB'), screenshotUpload(1024))).toBe('jpeg');
  });

  it.each([
    ['an XML prolog', '<?xml version="1.0"?>\n<svg width="1"></svg>'],
    ['a leading comment', '<!-- logo --><svg></svg>'],
    ['a doctype', '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"><svg></svg>'],
    ['a byte-order mark and whitespace', '﻿  <svg></svg>'],
  ])('recognises an SVG opening with %s', (_label, text) => {
    const file = `data:image/svg+xml;base64,${Buffer.from(text, 'utf8').toString('base64')}`;
    expect(assertUpload(file, MEDIA_UPLOAD)).toBe('svg');
  });

  it.each([
    ['an XML document that is not SVG', '<?xml version="1.0"?><html></html>'],
    ['markup that does not open like SVG', '<div><svg></svg></div>'],
  ])('refuses %s claiming to be SVG', (_label, text) => {
    expect(() => assertUpload(dataUrl('image/svg+xml', text), MEDIA_UPLOAD)).toThrow(
      'This type of file cannot be uploaded here.',
    );
  });
});

describe('assertUpload — refusals', () => {
  it.each([
    ['an empty string', ''],
    ['a remote link', 'https://cdn.test/a.png'],
    ['a data URL with no payload', 'data:image/png;base64,'],
    ['text that is not base64', 'not base64!'],
  ])('refuses %s as not a file', (_label, file) => {
    expect(() => assertUpload(file, MEDIA_UPLOAD)).toThrow('Upload a file, not a link.');
  });

  it('refuses bytes that do not match the claimed type', () => {
    expect(() => assertUpload(dataUrl('image/png', '\xFF\xD8\xFF\xE0'), MEDIA_UPLOAD)).toThrow(
      'This type of file cannot be uploaded here.',
    );
  });

  it('refuses a type this module does not know', () => {
    expect(() => assertUpload(dataUrl('application/zip', 'PK\x03\x04'), EVERYTHING)).toThrow(
      'This type of file cannot be uploaded here.',
    );
  });

  it('refuses a known type the policy does not allow', () => {
    expect(() => assertUpload(dataUrl('application/pdf', '%PDF-1.7'), AVATAR_UPLOAD)).toThrow(
      'This type of file cannot be uploaded here.',
    );
    expect(() => assertUpload(dataUrl('image/svg+xml', '<svg></svg>'), AVATAR_UPLOAD)).toThrow(
      'This type of file cannot be uploaded here.',
    );
  });

  it('refuses bare bytes that match none of the allowed kinds', () => {
    expect(() => assertUpload(b64('\xFF'), CHAT_UPLOAD)).toThrow(
      'This type of file cannot be uploaded here.',
    );
    expect(() => assertUpload(b64('%PDF-1.4'), FONT_UPLOAD)).toThrow(
      'This type of file cannot be uploaded here.',
    );
  });

  it('measures the decoded size against the cap, padding included', () => {
    const policy = screenshotUpload(4);
    const jpeg = '\xFF\xD8\xFF\xE0';
    expect(b64(jpeg).endsWith('==')).toBe(true);
    expect(assertUpload(b64(jpeg), policy)).toBe('jpeg');
    expect(b64(`${jpeg}\x00`).endsWith('=')).toBe(true);
    expect(() => assertUpload(b64(`${jpeg}\x00`), policy)).toThrow(
      'The file is too large (max 0 MB).',
    );
    expect(b64(`${jpeg}\x00\x00`).endsWith('=')).toBe(false);
    expect(() => assertUpload(b64(`${jpeg}\x00\x00`), policy)).toThrow('The file is too large');
  });

  it('names the cap in megabytes', () => {
    const big = 'A'.repeat(Math.ceil((5 * 1024 * 1024 + 3) / 3) * 4);
    expect(() => assertUpload(big, RESUME_UPLOAD)).toThrow('The file is too large (max 5 MB).');
  });
});

describe('policies', () => {
  it('lets the media path take images, SVG and PDF but not documents', () => {
    expect([...MEDIA_UPLOAD.kinds].sort((a, b) => a.localeCompare(b))).toEqual([
      'gif',
      'jpeg',
      'pdf',
      'png',
      'svg',
      'webp',
    ]);
    expect(TEST_UPLOAD.kinds.has('pdf')).toBe(false);
    expect(TEST_UPLOAD.kinds.has('svg')).toBe(true);
  });

  it('builds a screenshot policy with the given cap', () => {
    expect(screenshotUpload(99)).toEqual({ kinds: new Set(['png', 'jpeg']), maxBytes: 99 });
  });
});

describe('kindOfMime', () => {
  it('maps a MIME type to its kind, ignoring case and spaces', () => {
    expect(kindOfMime(' IMAGE/PNG ')).toBe('png');
    expect(kindOfMime('image/jpg')).toBe('jpeg');
    expect(kindOfMime('video/quicktime')).toBe('mp4');
    expect(kindOfMime('application/vnd.ms-opentype')).toBe('otf');
  });

  it('answers undefined for a type it does not know', () => {
    expect(kindOfMime('application/zip')).toBeUndefined();
  });
});
