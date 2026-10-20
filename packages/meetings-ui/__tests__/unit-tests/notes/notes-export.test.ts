import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  escapeHtml,
  fileName,
  notesToHtml,
  notesToJson,
  notesToMarkdown,
  notesToText,
  saveTextFile,
} from '../../../src/notes/notes-export';
import { plainContent } from '../../../src/notes/notes-sections';
import { makeContent } from '../fixtures';

const upper = (text: string) => text.toUpperCase();
const content = makeContent({ overview: 'Fine <b>so far</b>', risks: [] });

describe('notesToMarkdown', () => {
  it('writes a heading per filled section, prose as paragraphs and lists as bullets', () => {
    expect(notesToMarkdown('Weekly sync', content, upper)).toBe(
      [
        '# Weekly sync',
        '## EXECUTIVE SUMMARY\n\nLaunch is on track.',
        '## OVERVIEW\n\nFine <b>so far</b>',
        '## AGENDA\n\n- Launch status',
        '## DISCUSSION POINTS\n\n- Pricing\n- Timeline',
        '## BLOCKERS\n\n- Legal review',
      ].join('\n\n') + '\n',
    );
  });

  it('leaves out sections with nothing in them', () => {
    const empty = makeContent({
      overview: '  ',
      executiveSummary: '',
      agenda: [],
      discussionPoints: [],
      blockers: [],
    });
    expect(notesToMarkdown('Empty', empty, upper)).toBe('# Empty\n');
  });
});

describe('notesToText', () => {
  it('underlines each heading', () => {
    const text = notesToText(
      'Weekly sync',
      makeContent({ discussionPoints: [], blockers: [], agenda: [] }),
      upper,
    );
    expect(text).toBe(
      'Weekly sync\n\nEXECUTIVE SUMMARY\n-----------------\nLaunch is on track.\n\nOVERVIEW\n--------\nWe reviewed the launch.\n',
    );
  });
});

describe('notesToJson', () => {
  it('keeps the content exactly as stored, without Apollo fields', () => {
    const json = JSON.parse(
      notesToJson('Weekly sync', { ...content, __typename: 'MaNotesContent' } as never),
    );
    expect(json).toEqual({ title: 'Weekly sync', ...plainContent(content) });
    expect(json).not.toHaveProperty('__typename');
  });
});

describe('notesToHtml', () => {
  it('escapes everything the model wrote, so none of it runs as markup', () => {
    const html = notesToHtml('A & B', content, upper);
    expect(
      html.startsWith('<h1>A &amp; B</h1><h2>EXECUTIVE SUMMARY</h2><p>Launch is on track.</p>'),
    ).toBe(true);
    expect(html).toContain('<p>Fine &lt;b&gt;so far&lt;/b&gt;</p>');
    expect(html).toContain('<h2>DISCUSSION POINTS</h2><ul><li>Pricing</li><li>Timeline</li></ul>');
  });
});

describe('escapeHtml', () => {
  it('escapes the five characters that matter in HTML', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});

describe('fileName', () => {
  it('replaces characters file systems refuse and falls back for a blank title', () => {
    expect(fileName('Q3: plan / review?', 'md')).toBe('Q3- plan - review-.md');
    expect(fileName('   ', 'txt')).toBe('meeting-notes.txt');
  });
});

describe('saveTextFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hands the browser a file with the given name and type', () => {
    const createUrl = vi.fn().mockReturnValue('blob:notes');
    const revokeUrl = vi.fn();
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    saveTextFile('notes.md', 'text/markdown', '# Notes');

    const blob = createUrl.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/markdown;charset=utf-8');
    expect(click).toHaveBeenCalledTimes(1);
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('notes.md');
    expect(revokeUrl).toHaveBeenCalledWith('blob:notes');
  });
});
