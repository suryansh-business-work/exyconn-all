import { vi } from 'vitest';
import { ListOnboardingTemplatesPagedDocument } from '@exyconn/shell/graphql/generated';
import { OnboardingTemplatesPage } from '../../../../src/pages/onboarding-templates';
import { ONBOARDING_TEMPLATE_COLUMNS } from '../../../../src/pages/onboarding-templates/onboarding-template-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListOnboardingTemplatesStatsQuery: () => gql.stats(),
  useDeleteOnboardingTemplateMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/onboarding-templates/forms/onboarding-template', async () => ({
  OnboardingTemplateForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('OnboardingTemplatesPage', {
  page: <OnboardingTemplatesPage />,
  mocks: gql,
  statsKey: 'listOnboardingTemplatesStats',
  stats: tableStats(4, { active: { true: 3, false: 1 } }),
  lines: ['Templates: 4', 'Offered: 3', 'Retired: 1'],
  emptyLines: ['Templates: 0', 'Offered: 0', 'Retired: 0'],
  document: ListOnboardingTemplatesPagedDocument,
  pageKey: 'listOnboardingTemplatesPaged',
  columns: ONBOARDING_TEMPLATE_COLUMNS,
  meta: {
    title: 'Onboarding Templates',
    exportFileName: 'onboarding-templates',
    entityLabel: 'template',
    searchPlaceholder: 'Search templates…',
  },
  row: { id: 'tpl-2', name: 'Engineering joiner' },
  confirm: 'Delete the "Engineering joiner" template?',
  entity: 'Onboarding template',
});
