import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  asDesign,
  designToMjml,
  newBlock,
  starterDesign,
  type Block,
  type BlockType,
  type Design,
} from '../../../../../../../src/pages/marketing/forms/campaign/design/blocks';

const TYPES: readonly BlockType[] = [
  'header',
  'text',
  'image',
  'button',
  'columns',
  'divider',
  'spacer',
  'footer',
];

/** A one-block design with page settings, so the MJML of that block can be read alone. */
const designOf = (block: Block, settings: Partial<Design['settings']> = {}): Design => ({
  settings: { ...DEFAULT_SETTINGS, ...settings },
  blocks: [block],
});

const mjmlOf = (block: Block, settings: Partial<Design['settings']> = {}) =>
  designToMjml(designOf(block, settings));

describe('newBlock', () => {
  it.each(TYPES)('makes a %s block with a fresh id and the shared spacing', (type) => {
    const block = newBlock(type);
    expect(block.type).toBe(type);
    expect(block.id).toMatch(/^[\da-f-]{36}$/);
    expect(block.background).toBe('');
    expect(block.padding).toBe(16);
  });

  it('gives every block its own id', () => {
    expect(newBlock('text').id).not.toBe(newBlock('text').id);
  });

  it('starts text and headers with a variable that has a fallback', () => {
    expect(newBlock('header')).toMatchObject({ title: '{{company.name|Our team}}' });
    expect(newBlock('text')).toMatchObject({ content: 'Hello {{contact.firstName|there}},' });
  });

  it('starts a button with an address to finish and a spacer with a height', () => {
    expect(newBlock('button')).toMatchObject({ label: 'Learn more', href: 'https://' });
    expect(newBlock('spacer')).toMatchObject({ height: 24 });
    expect(newBlock('image')).toMatchObject({ src: '', alt: '', href: '', width: 560 });
  });
});

describe('starterDesign', () => {
  it('opens a new email with header, text, button and footer on the default settings', () => {
    const design = starterDesign();
    expect(design.blocks.map((block) => block.type)).toEqual([
      'header',
      'text',
      'button',
      'footer',
    ]);
    expect(design.settings).toEqual(DEFAULT_SETTINGS);
    expect(design.settings).not.toBe(DEFAULT_SETTINGS);
  });
});

describe('asDesign', () => {
  it.each([null, undefined, 'mjml', 42, {}, { blocks: 'nope' }])(
    'refuses %j, which the editor cannot open',
    (value) => {
      expect(asDesign(value)).toBeNull();
    },
  );

  it('fills settings the stored design lacks from the defaults', () => {
    const blocks = [newBlock('text')];
    expect(asDesign({ blocks, settings: { width: 480 } })).toEqual({
      blocks,
      settings: { ...DEFAULT_SETTINGS, width: 480 },
    });
  });

  it('opens a design stored without settings', () => {
    expect(asDesign({ blocks: [] })).toEqual({ blocks: [], settings: DEFAULT_SETTINGS });
  });
});

describe('designToMjml', () => {
  it('wraps the blocks in a body with the page settings', () => {
    const mjml = designToMjml({ settings: DEFAULT_SETTINGS, blocks: [] });
    expect(mjml.startsWith('<mjml>')).toBe(true);
    expect(mjml).toContain('<mj-all font-family="Arial, Helvetica, sans-serif" />');
    expect(mjml).toContain('<mj-body background-color="#f4f4f5" width="600px">');
    expect(mjml).not.toContain('<mj-section');
  });

  it('escapes the font family and replaces a page colour that is not a hex value', () => {
    const mjml = designToMjml({
      settings: { ...DEFAULT_SETTINGS, fontFamily: '"Inter"<x>', pageBackground: 'red' },
      blocks: [],
    });
    expect(mjml).toContain('font-family="&quot;Inter&quot;&lt;x&gt;"');
    expect(mjml).toContain('background-color="#f4f4f5"');
  });

  it('gives each block a section in order, with its own background or the content one', () => {
    const first = { ...newBlock('divider'), background: '#abcdef' };
    const second = newBlock('spacer');
    const mjml = designToMjml({ settings: DEFAULT_SETTINGS, blocks: [first, second] });
    const sections = mjml.match(/<mj-section [^>]+>/g);
    expect(sections).toEqual([
      '<mj-section background-color="#abcdef" padding="16px 24px">',
      '<mj-section background-color="#ffffff" padding="16px 24px">',
    ]);
  });

  it('never writes a negative padding or spacer height', () => {
    const mjml = mjmlOf({ ...newBlock('spacer'), padding: -5, height: -10 } as Block);
    expect(mjml).toContain('padding="0px 24px"');
    expect(mjml).toContain('<mj-spacer height="0px" />');
  });

  it('escapes typed text but keeps variables and turns line breaks into <br/>', () => {
    const block = {
      ...newBlock('text'),
      content: 'Hi {{contact.firstName|there}} & <b>"friends"</b>\n\'bye\'',
    } as Block;
    expect(mjmlOf(block)).toContain(
      'Hi {{contact.firstName|there}} &amp; &lt;b&gt;&quot;friends&quot;&lt;/b&gt;<br/>&#39;bye&#39;',
    );
  });

  it('writes a text block with its size, alignment and colour', () => {
    const block = { ...newBlock('text'), fontSize: 18, align: 'right', color: '#123' } as Block;
    expect(mjmlOf(block)).toContain(
      '<mj-text font-size="18px" line-height="1.6" align="right" color="#123">',
    );
  });

  it('falls back to the default text colour when the colour is not hex', () => {
    const block = { ...newBlock('text'), color: 'javascript:alert(1)' } as Block;
    expect(mjmlOf(block)).toContain('color="#374151"');
  });

  it('shows a header logo only for a safe address', () => {
    const withLogo = { ...newBlock('header'), logoUrl: ' https://cdn.x/logo.png ' } as Block;
    expect(mjmlOf(withLogo)).toContain(
      '<mj-image src="https://cdn.x/logo.png" alt="{{company.name|Our team}}" width="140px" align="center" />',
    );
    const unsafe = { ...newBlock('header'), logoUrl: 'javascript:alert(1)' } as Block;
    expect(mjmlOf(unsafe)).not.toContain('<mj-image');
    const noLogo = newBlock('header');
    expect(mjmlOf(noLogo)).toContain('font-weight="700" color="#111827"');
  });

  it('drops an unsafe image source and adds a link only when it is safe', () => {
    const image = {
      ...newBlock('image'),
      src: 'data:image/png;base64,AAA',
      alt: 'A "cup"',
      href: 'mailto:sales@x.com',
      width: 300,
    } as Block;
    expect(mjmlOf(image)).toContain(
      '<mj-image src="" alt="A &quot;cup&quot;" width="300px" href="mailto:sales@x.com" />',
    );
    const unlinked = { ...newBlock('image'), src: 'https://x/a.png', href: 'ftp://x' } as Block;
    expect(mjmlOf(unlinked)).toContain('<mj-image src="https://x/a.png" alt="" width="560px" />');
  });

  it('writes a button with its link, colours and alignment', () => {
    const button = {
      ...newBlock('button'),
      href: '{{links.book}}',
      buttonColor: 'blue',
      color: '#000',
      align: 'left',
      label: 'Book <now>',
    } as Block;
    expect(mjmlOf(button)).toContain(
      '<mj-button href="{{links.book}}" background-color="#2563eb" color="#000" align="left" border-radius="6px" font-size="15px">Book &lt;now&gt;</mj-button>',
    );
  });

  it('accepts tel: links and blanks any other scheme on a button', () => {
    const tel = { ...newBlock('button'), href: 'TEL:+911234' } as Block;
    expect(mjmlOf(tel)).toContain('href="TEL:+911234"');
    const bad = { ...newBlock('button'), href: 'javascript:void(0)' } as Block;
    expect(mjmlOf(bad)).toContain('<mj-button href=""');
  });

  it('writes two columns side by side with the same colour', () => {
    const columns = { ...newBlock('columns'), left: 'One', right: 'Two\nlines' } as Block;
    const mjml = mjmlOf(columns);
    expect(mjml).toContain(
      '<mj-column><mj-text color="#374151" font-size="15px" line-height="1.6">One</mj-text></mj-column><mj-column><mj-text color="#374151" font-size="15px" line-height="1.6">Two<br/>lines</mj-text></mj-column>',
    );
  });

  it('writes a divider in its colour, or the default one', () => {
    expect(mjmlOf({ ...newBlock('divider'), color: '#ff0000' } as Block)).toContain(
      'border-color="#ff0000"',
    );
    expect(mjmlOf({ ...newBlock('divider'), color: '' } as Block)).toContain(
      'border-color="#e5e7eb"',
    );
  });

  it('always ends a footer with unsubscribe and preference links in the link colour', () => {
    const footer = { ...newBlock('footer'), text: 'Bye', color: 'nope' } as Block;
    const mjml = mjmlOf(footer, { linkColor: '#00ff00' });
    expect(mjml).toContain('color="#6b7280">Bye<br/>');
    expect(mjml).toContain('<a href="{{unsubscribe_url}}" style="color:#00ff00">Unsubscribe</a>');
    expect(mjml).toContain(
      '<a href="{{preferences_url}}" style="color:#00ff00">Manage preferences</a>',
    );
    expect(mjmlOf(footer, { linkColor: 'green' })).toContain('style="color:#2563eb"');
  });

  it('renders the starter design end to end', () => {
    const mjml = designToMjml(starterDesign());
    expect(mjml.match(/<mj-section /g)).toHaveLength(4);
    expect(mjml.trimEnd().endsWith('</mjml>')).toBe(true);
  });
});
