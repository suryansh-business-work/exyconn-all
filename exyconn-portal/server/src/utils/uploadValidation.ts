import { badRequest } from './errors';

/**
 * What an upload may be, checked before anything is handed to ImageKit.
 *
 * ImageKit stores whatever it is given — and given a URL it goes and fetches it — so the
 * portal decides. An upload is accepted only as base64 (a `data:` URL, or bare base64 from the
 * desktop tracker and the mail importer); its bytes must BEGIN like the type it claims (or,
 * bare, like one of the allowed types), and its decoded size must fit the caller's cap. A
 * remote `http(s)://` string is never an upload: importing by URL is its own, host-checked path.
 */

/** A kind of file, identified by its leading bytes. */
export type UploadKind =
  | 'png'
  | 'jpeg'
  | 'gif'
  | 'webp'
  | 'svg'
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'mp4'
  | 'webm'
  | 'ogg'
  | 'mp3'
  | 'wav';

export interface UploadPolicy {
  readonly kinds: ReadonlySet<UploadKind>;
  /** Largest decoded size, in bytes. */
  readonly maxBytes: number;
}

const MB = 1024 * 1024;

const RASTER_KINDS: readonly UploadKind[] = ['png', 'jpeg', 'gif', 'webp'];

/**
 * The shared `uploadImage` path: images from the upload dialog, the rich-text and live
 * editors (SVG is allowed — a logo is often a vector), and the image-or-PDF attachments on
 * tickets and projects. 12 MB matches the /graphql body limit.
 */
export const MEDIA_UPLOAD: UploadPolicy = {
  kinds: new Set<UploadKind>([...RASTER_KINDS, 'svg', 'pdf']),
  maxBytes: 12 * MB,
};

/** A profile picture: a raster image, never a vector or a document. */
export const AVATAR_UPLOAD: UploadPolicy = { kinds: new Set(RASTER_KINDS), maxBytes: 5 * MB };

/** The Tech module's credential test: any image the dialog would upload. */
export const TEST_UPLOAD: UploadPolicy = {
  kinds: new Set<UploadKind>([...RASTER_KINDS, 'svg']),
  maxBytes: 12 * MB,
};

/** A résumé sent with a website job application: PDF or Word, as the form says (max 5 MB). */
export const RESUME_UPLOAD: UploadPolicy = {
  kinds: new Set<UploadKind>(['pdf', 'doc', 'docx']),
  maxBytes: 5 * MB,
};

/**
 * A picture, video clip or voice note sent in a website chat (Website > Chatbot). 10 MB keeps
 * the base64 frame inside the chat socket's payload cap.
 */
export const CHAT_UPLOAD: UploadPolicy = {
  kinds: new Set<UploadKind>([...RASTER_KINDS, 'mp4', 'webm', 'ogg', 'mp3', 'wav']),
  maxBytes: 10 * MB,
};

/** A desktop-tracker capture: PNG at quality 100, JPEG below it. */
export function screenshotUpload(maxBytes: number): UploadPolicy {
  return { kinds: new Set<UploadKind>(['png', 'jpeg']), maxBytes };
}

const MIME_KINDS: Readonly<Record<string, UploadKind>> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'video/mp4': 'mp4',
  'video/quicktime': 'mp4',
  'audio/mp4': 'mp4',
  'audio/m4a': 'mp4',
  'audio/x-m4a': 'mp4',
  'video/webm': 'webm',
  'audio/webm': 'webm',
  'video/ogg': 'ogg',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
};

/** The kind a MIME type names, or undefined when it is not one this module knows. */
export function kindOfMime(mime: string): UploadKind | undefined {
  return MIME_KINDS[mime.trim().toLowerCase()];
}

const DATA_URL = /^data:([\w.+-]+\/[\w.+-]+);base64,(.*)$/s;
const BASE64 = /^[A-Za-z\d+/]*={0,2}$/;

/** Enough of the file to recognise any kind above, SVG's optional XML prolog included. */
const SNIFF_BYTES = 1024;

function startsWith(head: Buffer, signature: string, offset = 0): boolean {
  return head.subarray(offset, offset + signature.length).toString('latin1') === signature;
}

/** An SVG document opens with an XML prolog, a comment, a doctype or the root itself... */
const SVG_OPENING = /^<(\?xml|!--|!doctype svg|svg[\s>])/i;
/** ...and somewhere in its first kilobyte there is the `<svg` root. */
const SVG_ROOT = /<svg[\s>]/i;

function looksLikeSvg(head: Buffer): boolean {
  const text = head
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trimStart();
  return SVG_OPENING.test(text) && SVG_ROOT.test(text);
}

const MATCHERS: Readonly<Record<UploadKind, (head: Buffer) => boolean>> = {
  png: (head) => startsWith(head, '\x89PNG\r\n\x1A\n'),
  jpeg: (head) => startsWith(head, '\xFF\xD8\xFF'),
  gif: (head) => startsWith(head, 'GIF87a') || startsWith(head, 'GIF89a'),
  webp: (head) => startsWith(head, 'RIFF') && startsWith(head, 'WEBP', 8),
  svg: looksLikeSvg,
  pdf: (head) => startsWith(head, '%PDF-'),
  // Word 97–2003 is an OLE compound file; a .docx is a ZIP package.
  doc: (head) => startsWith(head, '\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1'),
  docx: (head) => startsWith(head, 'PK\x03\x04'),
  // ISO base media (MP4, MOV, M4A) carries its `ftyp` box right after the box size.
  mp4: (head) => startsWith(head, 'ftyp', 4),
  // WebM is Matroska: the EBML magic number.
  webm: (head) => startsWith(head, '\x1A\x45\xDF\xA3'),
  ogg: (head) => startsWith(head, 'OggS'),
  // An ID3 tag, or straight into an MPEG audio frame (11 sync bits set).
  mp3: (head) => startsWith(head, 'ID3') || (head[0] === 0xff && ((head[1] ?? 0) & 0xe0) === 0xe0),
  wav: (head) => startsWith(head, 'RIFF') && startsWith(head, 'WAVE', 8),
};

/** Decoded size of a base64 payload, without decoding it. */
function decodedSize(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : Number(base64.endsWith('='));
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * Throws BAD_USER_INPUT unless `file` is base64 (a data URL or bare) of an allowed kind whose
 * bytes match, within the size cap. Returns the kind, for callers that record it.
 */
export function assertUpload(file: string, policy: UploadPolicy): UploadKind {
  const dataUrl = DATA_URL.exec(file);
  const payload = dataUrl ? dataUrl[2] : file;
  if (!payload || !BASE64.test(payload)) {
    badRequest('Upload a file, not a link.');
  }
  if (decodedSize(payload) > policy.maxBytes) {
    badRequest(`The file is too large (max ${Math.round(policy.maxBytes / MB)} MB).`);
  }

  const head = Buffer.from(payload.slice(0, Math.ceil(SNIFF_BYTES / 3) * 4), 'base64');
  const claimed = dataUrl ? kindOfMime(dataUrl[1]) : undefined;
  const candidates = dataUrl ? [claimed] : [...policy.kinds];
  const kind = candidates.find(
    (candidate): candidate is UploadKind =>
      candidate !== undefined && policy.kinds.has(candidate) && MATCHERS[candidate](head),
  );
  if (!kind) {
    badRequest('This type of file cannot be uploaded here.');
  }
  return kind;
}
