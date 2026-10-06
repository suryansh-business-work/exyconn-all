import type { TabberItem } from '@exyconn/tabber';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { TokenListFields } from './TokenListFields';
import { FontsTab } from './FontsTab';

const CODE = { fontFamily: 'monospace', fontSize: 13 } as const;

/** The editor's tabs, one per token group; the fonts tab uploads into the site's media. */
export const designTabs = (siteId: string): TabberItem[] => [
  {
    slug: 'palette',
    label: 'Palette',
    content: (
      <TokenListFields
        name="palette"
        prefix="--palette-"
        colors
        hint="The raw colour ramps, e.g. gray-900 or brand-500. Colour roles point at them with var(--palette-gray-900)."
      />
    ),
  },
  {
    slug: 'light',
    label: 'Colours (light)',
    content: (
      <TokenListFields
        name="colorsLight"
        prefix="--color-"
        colors
        hint="Colour roles in daylight, e.g. page, fg, primary. Any CSS colour: #155dfc, oklch(…), color-mix(…)."
      />
    ),
  },
  {
    slug: 'dark',
    label: 'Colours (dark)',
    content: (
      <TokenListFields
        name="colorsDark"
        prefix="--color-"
        colors
        hint="Only the roles that differ at night; the rest keep their daylight value."
      />
    ),
  },
  { slug: 'fonts', label: 'Fonts', content: <FontsTab siteId={siteId} /> },
  {
    slug: 'radii',
    label: 'Radii',
    content: (
      <TokenListFields name="radii" prefix="--radius-" hint="Corner radii, e.g. md: 0.5rem." />
    ),
  },
  {
    slug: 'shadows',
    label: 'Shadows',
    content: (
      <TokenListFields
        name="shadows"
        prefix="--shadow-"
        hint="Box shadows, e.g. sm: 0 1px 2px rgb(0 0 0 / 5%)."
      />
    ),
  },
  {
    slug: 'spacing',
    label: 'Spacing',
    content: (
      <TokenListFields name="spacing" prefix="--space-" hint="Spacing steps, e.g. 4: 1rem." />
    ),
  },
  {
    slug: 'css',
    label: 'Extra CSS',
    content: (
      <RhfTextField
        name="extraCss"
        label="Extra CSS"
        multiline
        minRows={12}
        slotProps={{ htmlInput: { style: CODE, spellCheck: false } }}
        helperText="Written after the tokens on every page: utility classes, font-face rules."
      />
    ),
  },
];
