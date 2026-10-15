import type { CmsComponentDef } from './types';
import { GCC_COST_FLOW_PROPS, GCC_TABLE_PROPS } from './gcc.copy';
import { GCC_CALCULATOR_PROPS } from './gcc.copy-calculator';

/** The GCC-in-India pages: the cost guide's tables and diagram, and the cost calculator. */
export const GCC_COMPONENTS = [
  {
    key: 'gcc.table',
    label: 'Comparison table',
    category: 'GCC',
    description:
      'A captioned comparison table: the first column names each row, the other columns compare. Scrolls sideways on small screens.',
    defaultProps: GCC_TABLE_PROPS,
  },
  {
    key: 'gcc.cost-flow',
    label: 'Cost types diagram',
    category: 'GCC',
    description:
      'Side-by-side lanes that sort costs into kinds (one-time, recurring, refundable), each with a title, a line and examples. A "held" lane is money held, not spent (drawn dashed).',
    defaultProps: GCC_COST_FLOW_PROPS,
  },
  {
    key: 'gcc.calculator',
    label: 'GCC cost calculator',
    category: 'GCC',
    description:
      'The interactive GCC-in-India cost calculator. "preset" is what a new estimate starts from: the scenario templates, currencies, the AI price list, cities and departments. It is checked when the page renders; an invalid preset shows the "invalid" text instead of the calculator. The other texts show while it loads or without JavaScript.',
    defaultProps: GCC_CALCULATOR_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
