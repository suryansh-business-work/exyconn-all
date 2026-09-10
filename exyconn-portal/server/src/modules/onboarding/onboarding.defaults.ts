import { OnboardingTemplateModel, type OnboardingOwner } from './onboarding.model';
import { logger } from '../../utils/logger';

interface SeedTask {
  key: string;
  label: string;
  owner: OnboardingOwner;
  dueDaysFromJoin: number;
}

/** The name the seeded template is keyed on; an edit to it is somebody's and is left alone. */
export const DEFAULT_TEMPLATE_NAME = 'Standard onboarding';

/**
 * The starting template, so a company that has just installed the portal can onboard
 * somebody on day one instead of first having to invent a checklist.
 *
 * Seeded ONLY when absent, exactly like the email defaults: an HR lead who has rewritten
 * these tasks must not find them back the way they were after a restart.
 */
const DEFAULT_TASKS: SeedTask[] = [
  { key: 'laptop', label: 'Issue laptop and peripherals', owner: 'IT', dueDaysFromJoin: 0 },
  { key: 'accounts', label: 'Create email and portal accounts', owner: 'IT', dueDaysFromJoin: 0 },
  {
    key: 'policies',
    label: 'Read and sign the company policies',
    owner: 'EMPLOYEE',
    dueDaysFromJoin: 3,
  },
  {
    key: 'payroll-details',
    label: 'Submit payroll and bank details',
    owner: 'EMPLOYEE',
    dueDaysFromJoin: 3,
  },
  { key: 'buddy', label: 'Assign an onboarding buddy', owner: 'MANAGER', dueDaysFromJoin: 1 },
  {
    key: 'first-week-1-1',
    label: 'First-week 1:1 with the manager',
    owner: 'MANAGER',
    dueDaysFromJoin: 7,
  },
];

/** Creates the default template if no template of that name exists. Never an update. */
export async function ensureOnboardingDefaults(): Promise<void> {
  const result = await OnboardingTemplateModel.updateOne(
    { name: DEFAULT_TEMPLATE_NAME },
    { $setOnInsert: { name: DEFAULT_TEMPLATE_NAME, active: true, tasks: DEFAULT_TASKS } },
    { upsert: true },
  );
  if ((result.upsertedCount ?? 0) > 0) {
    logger.info(`Seeded the "${DEFAULT_TEMPLATE_NAME}" onboarding template`);
  }
}
