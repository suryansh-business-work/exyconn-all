import { OnboardingOwner } from '@exyconn/shell/graphql/generated';
import type { PagedOnboardingChecklistRow } from '../../../../src/pages/onboarding/onboarding-grid';

type Item = PagedOnboardingChecklistRow['items'][number];

/** One onboarding task; midday UTC so a date reads the same day in every zone. */
export function onboardingItem(over: Partial<Item> = {}): Item {
  return {
    key: 'laptop',
    label: 'Issue laptop',
    owner: OnboardingOwner.It,
    dueOn: '2026-03-02T12:00:00.000Z',
    done: false,
    doneAt: null,
    doneByName: null,
    notes: '',
    ...over,
  };
}

/** A joiner halfway through a two-task checklist. */
export function checklist(
  over: Partial<PagedOnboardingChecklistRow> = {},
): PagedOnboardingChecklistRow {
  return {
    id: 'checklist-1',
    employeeId: 'emp-1',
    employeeName: 'Asha Rao',
    templateName: 'Engineering joiner',
    joinDate: '2026-03-02T12:00:00.000Z',
    progressPercent: 50,
    complete: false,
    items: [
      onboardingItem({ done: true, doneByName: 'Ravi' }),
      onboardingItem({ key: 'policy', label: 'Sign the policy', owner: OnboardingOwner.Employee }),
    ],
    ...over,
  };
}
