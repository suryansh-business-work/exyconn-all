import { describe, expect, it } from 'vitest';
import { ExternalHyperlink, ShadingType, TextRun, type IContext, type XmlComponent } from 'docx';
import { fill, wordColour, wordInline } from '../../../src/export/docx-runs';
import { INK } from '../../../src/export/print';

/** The run's XML as a string, so its properties can be read back. */
const xml = (child: object) =>
  JSON.stringify((child as XmlComponent).prepForXml({ stack: [] } as unknown as IContext));

describe('wordColour and fill', () => {
  it('writes colours without the hash', () => {
    expect(wordColour('#155dfc')).toBe('155dfc');
    expect(wordColour(undefined)).toBeUndefined();
    expect(fill('#ffd166')).toEqual({ type: ShadingType.CLEAR, color: 'auto', fill: 'ffd166' });
  });
});

describe('wordInline', () => {
  it('turns a line break into a break run', () => {
    const run = wordInline({ kind: 'break' });
    expect(run).toBeInstanceOf(TextRun);
    expect(xml(run)).toContain('w:br');
  });

  it('writes a plain run with no formatting', () => {
    const out = xml(wordInline({ kind: 'text', text: 'plain' }));
    expect(out).toContain('plain');
    expect(out).not.toContain('w:b"');
    expect(out).not.toContain('w:shd');
  });

  it('writes every mark, colour, size and face onto the run', () => {
    const out = xml(
      wordInline({
        kind: 'text',
        text: 'styled',
        bold: true,
        italic: true,
        underline: true,
        strike: true,
        sub: true,
        color: '#155dfc',
        highlight: '#ffd166',
        fontSize: 16,
        fontFamily: 'Georgia',
      }),
    );
    for (const tag of [
      'w:b',
      'w:i',
      'w:u',
      'w:strike',
      'subscript',
      '155dfc',
      'ffd166',
      'Georgia',
    ]) {
      expect(out).toContain(tag);
    }
    // 16px is 12pt, which Word writes as 24 half-points.
    expect(out).toContain('"w:val":24');
  });

  it('shades and sets inline code in the monospace face, and lets a block force bold', () => {
    const out = xml(wordInline({ kind: 'text', text: 'x', code: true, sup: true }, { bold: true }));
    expect(out).toContain(INK.codeFill.slice(1));
    expect(out).toContain('Consolas');
    expect(out).toContain('superscript');
    expect(out).toContain('w:b');
  });

  it('wraps a linked run in a hyperlink with the hyperlink style', () => {
    const link = wordInline({ kind: 'text', text: 'site', link: 'https://exyconn.com' });
    expect(link).toBeInstanceOf(ExternalHyperlink);
    const { options } = link as ExternalHyperlink;
    expect(options.link).toBe('https://exyconn.com');
    expect(options.children).toHaveLength(1);
    expect(xml(options.children[0] as object)).toContain('Hyperlink');
  });
});
