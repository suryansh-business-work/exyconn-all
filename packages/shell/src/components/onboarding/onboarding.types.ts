import { OnboardingOwner, type MyOnboardingQuery } from '@/graphql/generated';

/** One task of a checklist, exactly as the server returns it. */
export type OnboardingItem = NonNullable<MyOnboardingQuery['myOnboarding']>['items'][number];

/** Whether a viewer may tick a task off. */
export type CanTick = (item: OnboardingItem) => boolean;

/**
 * HR and IT own the running of an onboarding, so they may tick anything on it. The joiner
 * may tick only the tasks their own onboarding asks THEM to do — the server enforces the
 * same rule, this just stops the checkbox offering what would be refused.
 */
export const canTickAny: CanTick = () => true;

/** The tasks a joiner may tick on their own checklist. */
export const canTickOwn: CanTick = (item) => item.owner === OnboardingOwner.Employee;
