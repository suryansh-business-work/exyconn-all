import type { CmsComponentDef } from './types';
import { AI_GOVERNANCE_PROPS } from './ai.copy';

/** The AI hub's own chapters (/ai); its other sections are the detail and service ones. */
export const AI_COMPONENTS = [
  {
    key: 'ai.governance',
    label: 'Governance',
    category: 'AI',
    description:
      "The platform's promises as cards beside a panel linking the trust and security services.",
    defaultProps: AI_GOVERNANCE_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
