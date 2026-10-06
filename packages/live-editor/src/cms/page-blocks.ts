import type { BlockProperties } from 'grapesjs';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import TitleIcon from '@mui/icons-material/Title';
import NotesIcon from '@mui/icons-material/Notes';
import ImageIcon from '@mui/icons-material/Image';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import HeightIcon from '@mui/icons-material/Height';
import CodeIcon from '@mui/icons-material/Code';
import { iconMarkup as icon } from '../icon-markup';
import { EMBED_TYPE } from './embed-type';

const LAYOUT = 'Layout';
const BASIC = 'Basic';
const MEDIA = 'Media';

/**
 * Free HTML blocks for a site page. Colours, radii and spacing are the site's own design
 * tokens (CSS custom properties the canvas and the website both define), so a block dropped
 * onto any site wears that site's look.
 */
export const PAGE_BLOCKS: BlockProperties[] = [
  {
    id: 'page-section',
    label: 'Section',
    category: LAYOUT,
    media: icon(ViewAgendaIcon),
    content:
      '<section style="padding:64px 24px"><div style="max-width:72rem;margin:0 auto"><h2>Section title</h2><p>Section text.</p></div></section>',
  },
  {
    id: 'page-columns',
    label: 'Columns',
    category: LAYOUT,
    media: icon(ViewColumnIcon),
    content:
      '<div style="display:flex;flex-wrap:wrap;gap:24px"><div style="flex:1 1 240px"><p>First column</p></div><div style="flex:1 1 240px"><p>Second column</p></div><div style="flex:1 1 240px"><p>Third column</p></div></div>',
  },
  {
    id: 'page-spacer',
    label: 'Spacer',
    category: LAYOUT,
    media: icon(HeightIcon),
    content: '<div style="height:48px"></div>',
  },
  {
    id: 'page-divider',
    label: 'Divider',
    category: LAYOUT,
    media: icon(HorizontalRuleIcon),
    content: '<hr style="border:0;border-top:1px solid var(--color-line);margin:32px 0"/>',
  },
  {
    id: 'page-heading',
    label: 'Heading',
    category: BASIC,
    media: icon(TitleIcon),
    content: '<h2>Heading</h2>',
  },
  {
    id: 'page-text',
    label: 'Text',
    category: BASIC,
    media: icon(NotesIcon),
    content: '<p>Write the text here. Double-click to edit it.</p>',
  },
  {
    id: 'page-list',
    label: 'List',
    category: BASIC,
    media: icon(FormatListBulletedIcon),
    content: '<ul><li>First point</li><li>Second point</li><li>Third point</li></ul>',
  },
  {
    id: 'page-quote',
    label: 'Quote',
    category: BASIC,
    media: icon(FormatQuoteIcon),
    content:
      '<blockquote style="margin:0;padding-left:20px;border-left:4px solid var(--color-primary)"><p>A line worth pulling out.</p></blockquote>',
  },
  {
    id: 'page-button',
    label: 'Button',
    category: BASIC,
    media: icon(SmartButtonIcon),
    content:
      '<a href="/contact" style="display:inline-block;padding:12px 24px;border-radius:var(--radius-full, 9999px);background-color:var(--color-button-bg, var(--color-primary));color:var(--color-button-fg, var(--color-on-primary));font-weight:600;text-decoration:none">Talk to us</a>',
  },
  {
    id: 'page-image',
    label: 'Image',
    category: MEDIA,
    media: icon(ImageIcon),
    activate: true,
    content: { type: 'image', style: { 'max-width': '100%', height: 'auto' } },
  },
  {
    id: 'page-video',
    label: 'Video embed',
    category: MEDIA,
    media: icon(SmartDisplayIcon),
    content: { type: 'video', provider: 'yt', style: { width: '100%', height: '360px' } },
  },
  {
    id: 'page-embed',
    label: 'HTML embed',
    category: MEDIA,
    media: icon(CodeIcon),
    content: { type: EMBED_TYPE, components: '<p>Paste HTML in the settings panel.</p>' },
  },
];
