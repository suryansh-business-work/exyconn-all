import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterOp, ItAccessKind } from '@exyconn/shell/graphql/generated';
import { PasswordResetsPage } from '../../../../src/pages/access';
import { AccessRequestForm } from '../../../../src/pages/access/forms/access-request';
import { crud, dashboardProps, fetcherCall, resetPage } from '../../core/crud-page.mocks';
import { accessRow } from '../../core/rows.fixtures';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ stats: vi.fn(), noop: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../../core/crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListItAccessRequestsStatsQuery: gql.stats,
  useDeleteItAccessRequestMutation: () => [gql.noop],
  useDecideItAccessRequestMutation: () => [gql.noop],
  useFulfilItAccessRequestMutation: () => [gql.noop],
  useCancelItAccessRequestMutation: () => [gql.noop],
}));

describe('PasswordResetsPage', () => {
  beforeEach(() => {
    resetPage();
    gql.stats.mockReturnValue({ data: undefined, loading: false, refetch: vi.fn() });
  });

  it('narrows the access register to password resets under its own export name', () => {
    renderWithProviders(<PasswordResetsPage />);
    const props = dashboardProps();
    expect(props).toMatchObject({
      title: 'Password Resets',
      subtitle: 'Reset requests, approved and carried out. Passwords are never stored here.',
      entityLabel: 'password reset',
      exportFileName: 'password-resets',
      statsLoading: false,
    });
    expect(fetcherCall().filters).toEqual([
      { field: 'kind', op: FilterOp.Equals, value: ItAccessKind.PasswordReset },
    ]);
  });

  it('locks every new request to a password reset', () => {
    renderWithProviders(<PasswordResetsPage />);
    const row = accessRow({ kind: ItAccessKind.PasswordReset });
    const form = dashboardProps().renderForm?.(row);
    expect(form?.type).toBe(AccessRequestForm);
    expect(form?.props).toEqual({
      initial: row,
      kind: ItAccessKind.PasswordReset,
      lockKind: true,
      onCancel: crud.close,
      onDone: crud.onDone,
    });
  });
});
