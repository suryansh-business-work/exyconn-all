import { imageUploader } from '../../utils/imagekit';
import { badRequest } from '../../utils/errors';
import type { ChatAttachmentKind } from './models';

export interface ChatFileInput {
  name: string;
  /** A `data:` URL; the MIME type's top level decides picture, clip or voice note. */
  data: string;
}

export interface ChatAttachment {
  url: string;
  name: string;
  kind: ChatAttachmentKind;
  size: number;
}

const MB = 1024 * 1024;
const DATA_URL = /^data:(image|video|audio)\/[\w.+-]+;base64,(.*)$/s;
const KIND_OF: Readonly<Record<string, ChatAttachmentKind>> = {
  image: 'IMAGE',
  video: 'VIDEO',
  audio: 'AUDIO',
};

/** Decoded size of a base64 payload, without decoding it. */
const decodedSize = (base64: string): number => Math.floor((base64.length * 3) / 4);

async function uploadOne(file: ChatFileInput, maxMb: number): Promise<ChatAttachment> {
  const match = DATA_URL.exec(file.data);
  const kind = match ? KIND_OF[match[1]] : undefined;
  if (!match || !kind) {
    badRequest('Send a picture, a video or a voice note.');
  }
  const size = decodedSize(match[2]);
  if (size > maxMb * MB) {
    badRequest(`Files can be up to ${maxMb} MB.`);
  }
  // uploadChatMedia checks the bytes really are the type the data URL claims.
  const url = await imageUploader.uploadChatMedia(file.data, file.name);
  return { url, name: file.name, kind, size };
}

/** Uploads the files sent with one message, under the size the settings allow. */
export function uploadChatFiles(files: ChatFileInput[], maxMb: number): Promise<ChatAttachment[]> {
  return Promise.all(files.map((file) => uploadOne(file, maxMb)));
}
