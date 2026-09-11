import type { BlockProperties } from 'grapesjs';
import TitleIcon from '@mui/icons-material/Title';
import NotesIcon from '@mui/icons-material/Notes';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ImageIcon from '@mui/icons-material/Image';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import CampaignIcon from '@mui/icons-material/Campaign';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import { color } from '@exyconn/ui';
import { iconMarkup as icon } from './icon-markup';

const TEXT = 'Text';
const LAYOUT = 'Layout';
const MEDIA = 'Media';

const accent = color.blue[600];
const tint = color.azure[100];
const onAccent = color.white;

/**
 * The blocks an article is assembled from. Inline `style`s become id-keyed CSS rules
 * as GrapesJS parses them, so every styled block lands in the design's CSS — which the
 * website scopes to the article — and the markup stays within the site's sanitiser.
 */
export const ARTICLE_BLOCKS: BlockProperties[] = [
  {
    id: 'heading',
    label: 'Heading',
    category: TEXT,
    media: icon(TitleIcon),
    content: '<h2>Section heading</h2>',
  },
  {
    id: 'paragraph',
    label: 'Paragraph',
    category: TEXT,
    media: icon(NotesIcon),
    content: '<p>Write the paragraph here. Double-click to edit the text.</p>',
  },
  {
    id: 'quote',
    label: 'Quote',
    category: TEXT,
    media: icon(FormatQuoteIcon),
    content: '<blockquote><p>A line worth pulling out of the article.</p></blockquote>',
  },
  {
    id: 'list',
    label: 'List',
    category: TEXT,
    media: icon(FormatListBulletedIcon),
    content: '<ul><li>First point</li><li>Second point</li><li>Third point</li></ul>',
  },
  {
    id: 'callout',
    label: 'Callout',
    category: TEXT,
    media: icon(InfoOutlinedIcon),
    content: `<div style="padding:16px 20px;border-left:4px solid ${accent};background-color:${tint};border-radius:8px"><p style="margin:0">Key takeaway or note for the reader.</p></div>`,
  },
  {
    id: 'image',
    label: 'Image',
    category: MEDIA,
    media: icon(ImageIcon),
    activate: true,
    content: { type: 'image', style: { 'max-width': '100%', height: 'auto' } },
  },
  {
    id: 'image-text',
    label: 'Image + text',
    category: MEDIA,
    media: icon(VerticalSplitIcon),
    content: `<div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center"><img alt="Describe the image" style="flex:1 1 240px;max-width:100%;border-radius:12px"/><div style="flex:1 1 240px"><h3>Heading</h3><p>Explain what the image shows.</p></div></div>`,
  },
  {
    id: 'columns',
    label: 'Two columns',
    category: LAYOUT,
    media: icon(ViewColumnIcon),
    content: `<div style="display:flex;flex-wrap:wrap;gap:24px"><div style="flex:1 1 240px"><p>Left column</p></div><div style="flex:1 1 240px"><p>Right column</p></div></div>`,
  },
  {
    id: 'table',
    label: 'Table',
    category: LAYOUT,
    media: icon(TableChartIcon),
    content: `<table style="width:100%;border-collapse:collapse"><thead><tr><th>Column</th><th>Column</th></tr></thead><tbody><tr><td>Value</td><td>Value</td></tr><tr><td>Value</td><td>Value</td></tr></tbody></table>`,
  },
  {
    id: 'button',
    label: 'Button link',
    category: LAYOUT,
    media: icon(SmartButtonIcon),
    content: `<a href="/contact" style="display:inline-block;padding:12px 24px;border-radius:9999px;background-color:${accent};color:${onAccent};font-weight:600">Talk to us</a>`,
  },
  {
    id: 'banner',
    label: 'Call to action',
    category: LAYOUT,
    media: icon(CampaignIcon),
    content: `<div style="padding:32px;border-radius:16px;background-color:${accent};color:${onAccent};text-align:center"><h3 style="color:${onAccent};margin-top:0">Ready to start?</h3><p style="color:${onAccent}">One line on what happens next.</p><a href="/contact" style="display:inline-block;padding:12px 24px;border-radius:9999px;background-color:${onAccent};color:${accent};font-weight:600">Get in touch</a></div>`,
  },
  {
    id: 'divider',
    label: 'Divider',
    category: LAYOUT,
    media: icon(HorizontalRuleIcon),
    content: '<hr/>',
  },
];
