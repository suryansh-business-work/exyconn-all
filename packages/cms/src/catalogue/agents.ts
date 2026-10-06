import type { CmsComponentDef } from './types';
import { AGENTS_ORDER_PROPS } from './agents.copy';

/** Ordering AI agents. */
export const AGENTS_COMPONENTS = [
  {
    key: 'agents.order',
    label: 'Agent suite builder',
    category: 'Forms',
    description:
      "The agents on offer and the suite request form. An agent's id is what a request names; every word is editable.",
    defaultProps: AGENTS_ORDER_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
