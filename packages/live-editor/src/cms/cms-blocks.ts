import type { BlockProperties } from 'grapesjs';
import WidgetsIcon from '@mui/icons-material/Widgets';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import { iconMarkup as icon } from '../icon-markup';
import type { CmsCatalogueEntry, CmsFragmentOption } from './cms.types';
import { COMPONENT_TYPE, FRAGMENT_TYPE } from './component-types';
import { PAGE_BLOCKS } from './page-blocks';

const FRAGMENTS = 'Fragments';

/** One block per catalogue entry, grouped by its category, starting from its default props. */
const componentBlocks = (components: readonly CmsCatalogueEntry[]): BlockProperties[] =>
  components.map((entry) => ({
    id: `cms-component-${entry.key}`,
    label: entry.label,
    category: entry.category,
    media: icon(WidgetsIcon),
    attributes: { title: entry.description },
    content: {
      type: COMPONENT_TYPE,
      attributes: { 'data-key': entry.key, 'data-props': JSON.stringify(entry.defaultProps) },
    },
  }));

const fragmentBlocks = (fragments: readonly CmsFragmentOption[]): BlockProperties[] =>
  fragments.map((fragment) => ({
    id: `cms-fragment-${fragment.id}`,
    label: fragment.name,
    category: FRAGMENTS,
    media: icon(ViewQuiltIcon),
    attributes: { title: `${fragment.kind.toLowerCase()} fragment` },
    content: { type: FRAGMENT_TYPE, attributes: { 'data-fragment-id': fragment.id } },
  }));

/**
 * Everything a site page is built from: free HTML blocks, every dynamic component of the
 * catalogue and every fragment of the site. A fragment being edited leaves itself out.
 */
export function cmsBlocks(
  components: readonly CmsCatalogueEntry[],
  fragments: readonly CmsFragmentOption[],
): BlockProperties[] {
  return [...PAGE_BLOCKS, ...componentBlocks(components), ...fragmentBlocks(fragments)];
}
