import type { ListOnboardingChecklistsPagedQuery } from '@exyconn/shell/graphql/generated';

/** One joiner's checklist, as the grid and the drawer read it. */
export type OnboardingChecklistRow =
  ListOnboardingChecklistsPagedQuery['listOnboardingChecklistsPaged']['rows'][number];

/** Form values for starting a joiner's onboarding. */
export interface StartOnboardingFormValues {
  employeeId: string;
  templateId: string;
}
