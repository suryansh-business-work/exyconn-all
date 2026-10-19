/**
 * Reading back what a tool sent: the JSON body of a stubbed fetch call, the text of the Blob
 * parts it downloaded, and the bytes of a Blob. Both fail loudly when the value is not text, rather than
 * comparing against "[object Object]".
 */

/** The JSON object a stubbed fetch call was sent with. */
export function sentJson(init: RequestInit | undefined): Record<string, unknown> {
  if (typeof init?.body !== 'string') {
    throw new TypeError('The request was not sent with a JSON string body.');
  }
  return JSON.parse(init.body);
}

/** The JSON body of the nth call to a stubbed fetch. */
export function sentJsonOf(fetchMock: { mock: { calls: unknown[][] } }, call = 0): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls[call] as [string, RequestInit | undefined];
  return sentJson(init);
}

/** The text of a Blob part the tool built a download from; empty when there is none. */
export function partText(part: BlobPart | undefined): string {
  if (part === undefined) return '';
  if (typeof part !== 'string') {
    throw new TypeError('The download was not built from text.');
  }
  return part;
}

/**
 * Reads a Blob or File into bytes. jsdom's Blob has neither `arrayBuffer()` nor `text()`, so the
 * bytes come back through a data URL.
 */
export function readBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64 = dataUrl.split(',')[1] ?? '';
      resolve(Uint8Array.from(atob(base64), (ch) => ch.codePointAt(0) ?? 0));
    };
    reader.onerror = () => reject(new Error('Could not read the blob.', { cause: reader.error }));
    reader.readAsDataURL(blob);
  });
}

/** Reads a Blob or File as UTF-8 text. */
export async function readText(blob: Blob): Promise<string> {
  return new TextDecoder().decode(await readBytes(blob));
}
