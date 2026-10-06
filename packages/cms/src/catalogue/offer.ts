import type { CmsComponentDef } from './types';
import { OFFER_PAGE_PROPS } from './offer.copy';

/** The Hindi India offer. */
export const OFFER_COMPONENTS = [
  {
    key: 'offer.page',
    label: 'India offer',
    category: 'Offers',
    description:
      'The India offer page: problems, the packages, how it works, the comparison, services, the enquiry form and the closing call. The plans and features are one list read by the cards, the table and the form; the phone line comes from Admin › Branding.',
    defaultProps: OFFER_PAGE_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
