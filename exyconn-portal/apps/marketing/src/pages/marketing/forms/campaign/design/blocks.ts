/**
 * The visual editor's document: a few page settings and an ordered list of blocks, turned
 * into MJML by {@link designToMjml}. MJML is what is saved, compiled and sent; the design is
 * kept beside it only so the visual editor can reopen the email.
 *
 * The colours here are email content, not portal UI: mail clients need literal values, and
 * every one is editable per email.
 */

export type BlockType =
  'header' | 'text' | 'image' | 'button' | 'columns' | 'divider' | 'spacer' | 'footer';
export type Align = 'left' | 'center' | 'right';

interface BlockBase {
  id: string;
  type: BlockType;
  background: string;
  padding: number;
}

export interface HeaderBlock extends BlockBase {
  type: 'header';
  logoUrl: string;
  title: string;
  color: string;
  align: Align;
}
export interface TextBlock extends BlockBase {
  type: 'text';
  content: string;
  fontSize: number;
  color: string;
  align: Align;
}
export interface ImageBlock extends BlockBase {
  type: 'image';
  src: string;
  alt: string;
  href: string;
  width: number;
}
export interface ButtonBlock extends BlockBase {
  type: 'button';
  label: string;
  href: string;
  buttonColor: string;
  color: string;
  align: Align;
}
export interface ColumnsBlock extends BlockBase {
  type: 'columns';
  left: string;
  right: string;
  color: string;
}
export interface DividerBlock extends BlockBase {
  type: 'divider';
  color: string;
}
export interface SpacerBlock extends BlockBase {
  type: 'spacer';
  height: number;
}
export interface FooterBlock extends BlockBase {
  type: 'footer';
  text: string;
  color: string;
}

export type Block =
  | HeaderBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | ColumnsBlock
  | DividerBlock
  | SpacerBlock
  | FooterBlock;

export interface DesignSettings {
  pageBackground: string;
  contentBackground: string;
  fontFamily: string;
  width: number;
  linkColor: string;
}

export interface Design {
  settings: DesignSettings;
  blocks: Block[];
}

const newId = () => globalThis.crypto.randomUUID();

export const DEFAULT_SETTINGS: DesignSettings = {
  pageBackground: '#f4f4f5',
  contentBackground: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
  width: 600,
  linkColor: '#2563eb',
};

/** A new block of a type, with sensible content to edit. */
export function newBlock(type: BlockType): Block {
  const base = { id: newId(), background: '', padding: 16 };
  switch (type) {
    case 'header':
      return {
        ...base,
        type,
        logoUrl: '',
        title: '{{company.name|Our team}}',
        color: '#111827',
        align: 'center',
      };
    case 'text':
      return {
        ...base,
        type,
        content: 'Hello {{contact.firstName|there}},',
        fontSize: 15,
        color: '#374151',
        align: 'left',
      };
    case 'image':
      return { ...base, type, src: '', alt: '', href: '', width: 560 };
    case 'button':
      return {
        ...base,
        type,
        label: 'Learn more',
        href: 'https://',
        buttonColor: '#2563eb',
        color: '#ffffff',
        align: 'center',
      };
    case 'columns':
      return { ...base, type, left: 'Left column', right: 'Right column', color: '#374151' };
    case 'divider':
      return { ...base, type, color: '#e5e7eb' };
    case 'spacer':
      return { ...base, type, height: 24 };
    default:
      return {
        ...base,
        type: 'footer',
        text: 'You are receiving this because you are on our marketing list.',
        color: '#6b7280',
      };
  }
}

/** The starting design of a new email. */
export const starterDesign = (): Design => ({
  settings: { ...DEFAULT_SETTINGS },
  blocks: [newBlock('header'), newBlock('text'), newBlock('button'), newBlock('footer')],
});

/** Whether a stored value is a design this editor can open. */
export function asDesign(value: unknown): Design | null {
  const candidate = value as Partial<Design> | null;
  if (!candidate || typeof candidate !== 'object' || !Array.isArray(candidate.blocks)) {
    return null;
  }
  return { settings: { ...DEFAULT_SETTINGS, ...candidate.settings }, blocks: candidate.blocks };
}

const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Typed text as safe markup; variables like {{contact.firstName}} pass through untouched. */
const escape = (value: string) => value.replaceAll(/[&<>"']/g, (char) => ESCAPES[char]);
const paragraphs = (value: string) => escape(value).replaceAll('\n', '<br/>');

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\{\{)/i;
const HEX = /^#[\da-f]{3,8}$/i;

/** A link the email may carry: a web, mail or phone address, or a variable. */
const href = (value: string) => (SAFE_HREF.test(value.trim()) ? escape(value.trim()) : '');
const color = (value: string, fallback: string) => (HEX.test(value) ? value : fallback);
const bg = (block: BlockBase, settings: DesignSettings) =>
  color(block.background, settings.contentBackground);
const sectionOpen = (block: BlockBase, settings: DesignSettings) =>
  `<mj-section background-color="${bg(block, settings)}" padding="${Math.max(0, block.padding)}px 24px">`;

function blockBody(block: Block, settings: DesignSettings): string {
  switch (block.type) {
    case 'header': {
      const logo = href(block.logoUrl)
        ? `<mj-image src="${href(block.logoUrl)}" alt="${escape(block.title)}" width="140px" align="${block.align}" />`
        : '';
      return `<mj-column>${logo}<mj-text align="${block.align}" font-size="22px" font-weight="700" color="${color(block.color, '#111827')}">${paragraphs(block.title)}</mj-text></mj-column>`;
    }
    case 'text':
      return `<mj-column><mj-text font-size="${block.fontSize}px" line-height="1.6" align="${block.align}" color="${color(block.color, '#374151')}">${paragraphs(block.content)}</mj-text></mj-column>`;
    case 'image': {
      const link = href(block.href) ? ` href="${href(block.href)}"` : '';
      return `<mj-column><mj-image src="${href(block.src)}" alt="${escape(block.alt)}" width="${block.width}px"${link} /></mj-column>`;
    }
    case 'button':
      return `<mj-column><mj-button href="${href(block.href)}" background-color="${color(block.buttonColor, '#2563eb')}" color="${color(block.color, '#ffffff')}" align="${block.align}" border-radius="6px" font-size="15px">${escape(block.label)}</mj-button></mj-column>`;
    case 'columns': {
      const column = (text: string) =>
        `<mj-column><mj-text color="${color(block.color, '#374151')}" font-size="15px" line-height="1.6">${paragraphs(text)}</mj-text></mj-column>`;
      return column(block.left) + column(block.right);
    }
    case 'divider':
      return `<mj-column><mj-divider border-width="1px" border-color="${color(block.color, '#e5e7eb')}" /></mj-column>`;
    case 'spacer':
      return `<mj-column><mj-spacer height="${Math.max(0, block.height)}px" /></mj-column>`;
    default:
      return `<mj-column><mj-text align="center" font-size="12px" color="${color(block.color, '#6b7280')}">${paragraphs(block.text)}<br/><a href="{{unsubscribe_url}}" style="color:${color(settings.linkColor, '#2563eb')}">Unsubscribe</a> · <a href="{{preferences_url}}" style="color:${color(settings.linkColor, '#2563eb')}">Manage preferences</a></mj-text></mj-column>`;
  }
}

/** The design as MJML, formatted so switching to the code editor reads cleanly. */
export function designToMjml(design: Design): string {
  const { settings } = design;
  const sections = design.blocks
    .map(
      (block) =>
        `    ${sectionOpen(block, settings)}\n      ${blockBody(block, settings)}\n    </mj-section>`,
    )
    .join('\n');
  return `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="${escape(settings.fontFamily)}" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="${color(settings.pageBackground, '#f4f4f5')}" width="${settings.width}px">
${sections}
  </mj-body>
</mjml>`;
}
