import type { CmsComponentDef } from './types';
import { GRIEVANCE_FORM_PROPS, LEGAL_FORM_PROPS } from './forms.copy';

/** Forms on their own: every label and message is editable, the sending stays in code. */
export const FORMS_COMPONENTS = [
  {
    key: 'forms.legal',
    label: 'Legal request form',
    category: 'Forms',
    description:
      "Copyright, takedown, trademark and privacy requests. The request types' values are what the portal files requests under.",
    defaultProps: LEGAL_FORM_PROPS,
  },
  {
    key: 'forms.grievance',
    label: 'Grievance form',
    category: 'Forms',
    description: 'A confidential grievance for the compliance team.',
    defaultProps: GRIEVANCE_FORM_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
