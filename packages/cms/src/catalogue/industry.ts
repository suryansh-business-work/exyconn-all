import type { CmsComponentDef } from './types';
import { INDUSTRY_STORY_PROPS } from './industry.copy';

/** The sections only the industry pages (/industries/*) use; the rest are detail sections. */
export const INDUSTRY_COMPONENTS = [
  {
    key: 'industry.story',
    label: 'Scroll story',
    category: 'Industry pages',
    description:
      'A day in the business as moments beside a night window. The page scene moves into the window and turns as the visitor scrolls; each moment lights its use case ("useCase", the number of its card in the use cases section).',
    defaultProps: INDUSTRY_STORY_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
