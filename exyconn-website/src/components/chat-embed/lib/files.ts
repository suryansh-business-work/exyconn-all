import type { AttachmentKind, ChatAttachment, OutgoingFile } from "../types";

const MB = 1024 * 1024;
/** The server's limit (CHAT_LIMITS.files). */
export const MAX_FILES = 4;

const KIND_OF: Readonly<Record<string, AttachmentKind>> = {
  image: "IMAGE",
  video: "VIDEO",
  audio: "AUDIO",
};

/** Picture, clip or voice note, from a MIME type; null for anything the chat cannot carry. */
export function kindOf(type: string): AttachmentKind | null {
  return KIND_OF[type.split("/")[0]] ?? null;
}

export function isTooBig(size: number, maxMb: number): boolean {
  return size > maxMb * MB;
}

/**
 * The server refuses a data URL whose MIME type carries parameters, and MediaRecorder hands
 * out `audio/webm;codecs=opus`: re-wrap the bytes under the bare type.
 */
export function withoutTypeParams(blob: Blob): Blob {
  return new Blob([blob], { type: blob.type.split(";")[0] });
}

export function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("read failed")));
    reader.readAsDataURL(blob);
  });
}

/** The MIME type a data URL declares. */
function dataUrlType(data: string): string {
  return data.slice(5, data.indexOf(";"));
}

/** How a file about to be sent is shown in its optimistic bubble. */
export function previewOf(file: Readonly<OutgoingFile>): ChatAttachment {
  return {
    url: file.data,
    name: file.name,
    kind: kindOf(dataUrlType(file.data)) ?? "IMAGE",
    size: 0,
  };
}

/** Only links the chat can vouch for: the server's media and its own previews. */
export function isSafeUrl(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("http://") || url.startsWith("data:");
}
