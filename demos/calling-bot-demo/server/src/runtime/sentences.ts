/** Where a spoken sentence ends: . ! ? or the Devanagari danda, before a space; or a line break. */
const BOUNDARY = /[.!?।]+["')\]]?\s|\n/;

/** A clause this long is spoken without waiting for its full stop, at the last space. */
const MAX_PENDING = 140;

/**
 * Cuts a streamed reply into sentences, so the first one is spoken while the rest is still
 * being written.
 */
export class SentenceBuffer {
  private pending = '';

  /** Adds streamed text; returns every sentence it completed. */
  push(text: string): string[] {
    this.pending += text;
    const sentences: string[] = [];
    let match = BOUNDARY.exec(this.pending);
    while (match) {
      const end = match.index + match[0].length;
      sentences.push(this.pending.slice(0, end).trim());
      this.pending = this.pending.slice(end);
      match = BOUNDARY.exec(this.pending);
    }
    if (this.pending.length > MAX_PENDING) {
      const cut = this.pending.lastIndexOf(' ');
      if (cut > 0) {
        sentences.push(this.pending.slice(0, cut).trim());
        this.pending = this.pending.slice(cut + 1);
      }
    }
    return sentences.filter((sentence) => sentence !== '');
  }

  /** Whatever is left once the reply is complete. */
  rest(): string {
    const rest = this.pending.trim();
    this.pending = '';
    return rest;
  }
}
