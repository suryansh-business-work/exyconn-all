import { inflateRawSync } from 'node:zlib';

const LOCAL_HEADER = 0x04034b50;
const STORED = 0;

/** Reads one part out of a .docx (a zip) written by the docx package, as text. */
export async function docxPart(blob: Blob, part = 'word/document.xml'): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  let offset = 0;
  while (view.getUint32(offset, true) === LOCAL_HEADER) {
    const method = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const start = offset + 30 + nameLength + extraLength;
    const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
    const data = bytes.subarray(start, start + size);
    if (name === part) {
      const raw = method === STORED ? data : inflateRawSync(data);
      return new TextDecoder().decode(raw);
    }
    offset = start + size;
  }
  throw new Error(`${part} is not in the file`);
}
