import { describe, expect, it } from 'vitest';
import { OnboardingOwner } from '@exyconn/shell/graphql/generated';
import {
  ONBOARDING_TEMPLATE_COLUMNS,
  type PagedOnboardingTemplateRow,
} from '../../../../src/pages/onboarding-templates/onboarding-template-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

const task = (key: string, owner: OnboardingOwner) => ({
  key,
  label: key,
  owner,
  dueDaysFromJoin: 1,
});

const template: PagedOnboardingTemplateRow = {
  id: 'tpl-1',
  name: 'Engineering joiner',
  active: true,
  taskCount: 3,
  createdAt: '2026-03-04T12:00:00.000Z',
  tasks: [
    task('laptop', OnboardingOwner.It),
    task('contract', OnboardingOwner.Hr),
    task('accounts', OnboardingOwner.It),
  ],
};

describe('ONBOARDING_TEMPLATE_COLUMNS', () => {
  it('lays out the templates with edit and delete at the end', () => {
    expect(columnIds(ONBOARDING_TEMPLATE_COLUMNS)).toEqual([
      'name',
      'active',
      'taskCount',
      'owners',
      'createdAt',
      'actions',
    ]);
    expect(actionKeys(ONBOARDING_TEMPLATE_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('counts the tasks and names each owner once, in order of first appearance', () => {
    expect(formatCell(ONBOARDING_TEMPLATE_COLUMNS, 'taskCount', template)).toBe('3');
    expect(formatCell(ONBOARDING_TEMPLATE_COLUMNS, 'owners', template)).toBe('IT, HR');
  });

  it('writes a dash for a template with no tasks', () => {
    const empty = { ...template, taskCount: 0, tasks: [] };
    expect(formatCell(ONBOARDING_TEMPLATE_COLUMNS, 'owners', empty)).toBe('—');
  });
});
