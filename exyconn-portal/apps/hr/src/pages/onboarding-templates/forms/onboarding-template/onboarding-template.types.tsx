import type {
  ListOnboardingTemplatesPagedQuery,
  OnboardingOwner,
} from '@exyconn/shell/graphql/generated';

/** One template as the grid and the form read it. */
export type OnboardingTemplateRow =
  ListOnboardingTemplatesPagedQuery['listOnboardingTemplatesPaged']['rows'][number];

/** Form values for an onboarding template and the tasks it holds. */
export interface OnboardingTemplateFormValues {
  name: string;
  active: boolean;
  tasks: Array<{
    key: string;
    label: string;
    owner: OnboardingOwner;
    dueDaysFromJoin: number;
  }>;
}
