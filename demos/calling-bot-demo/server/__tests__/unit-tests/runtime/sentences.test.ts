import { describe, expect, it } from 'vitest';
import { SentenceBuffer } from '../../../src/runtime/sentences';

describe('cutting a streamed reply into sentences', () => {
  it('releases each sentence once its full stop and the next space arrive', () => {
    const buffer = new SentenceBuffer();
    expect(buffer.push('Hello there')).toEqual([]);
    expect(buffer.push('. How are')).toEqual(['Hello there.']);
    expect(buffer.push(' you? Fine! Ok')).toEqual(['How are you?', 'Fine!']);
    expect(buffer.rest()).toBe('Ok');
    expect(buffer.rest()).toBe('');
  });

  it('ends sentences on the danda, a closing quote and a line break', () => {
    const buffer = new SentenceBuffer();
    expect(buffer.push('नमस्ते। "Yes." (Sure!) line\nnext')).toEqual([
      'नमस्ते।',
      '"Yes."',
      '(Sure!)',
      'line',
    ]);
    expect(buffer.rest()).toBe('next');
  });

  it('cuts after a run of marks, and keeps a long run of marks with no space linear', () => {
    const buffer = new SentenceBuffer();
    expect(buffer.push('Wait... what?! "Really?!" Ok')).toEqual([
      'Wait...',
      'what?!',
      '"Really?!"',
    ]);
    expect(buffer.push('.'.repeat(100_000))).toEqual([]);
    expect(buffer.rest()).toBe(`Ok${'.'.repeat(100_000)}`);
  });

  it('drops empty pieces such as a blank line', () => {
    expect(new SentenceBuffer().push('\n\n')).toEqual([]);
  });

  it('speaks a long clause at its last space instead of waiting for a full stop', () => {
    const buffer = new SentenceBuffer();
    const clause = `${'word '.repeat(29)}tail`;
    expect(clause.length).toBeGreaterThan(140);
    expect(buffer.push(clause)).toEqual([`${'word '.repeat(28)}word`]);
    expect(buffer.rest()).toBe('tail');
  });

  it('keeps a long clause that has no space to cut at', () => {
    const buffer = new SentenceBuffer();
    const word = 'x'.repeat(150);
    expect(buffer.push(word)).toEqual([]);
    expect(buffer.rest()).toBe(word);
  });

  it('does not cut a long clause whose only space is its first character', () => {
    const buffer = new SentenceBuffer();
    expect(buffer.push(` ${'y'.repeat(150)}`)).toEqual([]);
  });
});
