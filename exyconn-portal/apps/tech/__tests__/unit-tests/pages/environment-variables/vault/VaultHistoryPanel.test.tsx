import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import type { ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import { VaultHistoryPanel } from '../../../../../src/pages/environment-variables/vault/VaultHistoryPanel';
import {
  VAULT_HISTORY_COLUMNS,
  locationText,
  type VaultHistoryContext,
  type VaultSessionRow,
} from '../../../../../src/pages/environment-variables/vault/vault-history-grid';
import { renderWithProviders } from '../../../test-utils';
import { propsOf } from '../panel.harness';

const gql = vi.hoisted(() => ({ activity: vi.fn() }));

vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () =>
  (await import('../panel.harness')).propsModule('ServerDataGrid'),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTechVaultSessionActivityQuery: gql.activity,
}));

const session = (patch: Partial<VaultSessionRow> = {}): VaultSessionRow =>
  ({
    id: 's1',
    userId: 'u1',
    userName: 'Asha Rao',
    email: 'asha@exyconn.com',
    reason: 'Rotating the SMTP password',
    ip: '203.0.113.7',
    userAgent: 'Mozilla/5.0',
    location: { state: 'GRANTED', latitude: 18.52043, longitude: 73.85674, accuracy: 25.4 },
    unlockedAt: '2026-10-26T10:00:00.000Z',
    expiresAt: '2026-10-26T10:30:00.000Z',
    endedAt: null,
    endReason: null,
    ...patch,
  }) as VaultSessionRow;

const column = (field: string) =>
  VAULT_HISTORY_COLUMNS.find((col) => col.field === field || col.colId === field);

beforeEach(() => {
  gql.activity.mockReturnValue({
    data: { techVaultSessionActivity: [{ id: 'a1', action: 'ACCESS', entityLabel: 'SMTP', summary: 'Revealed the saved SMTP password', createdAt: '2026-10-26T10:05:00.000Z' }] },
    loading: false,
    refetch: vi.fn(),
  }); // prettier-ignore
});

describe('access history', () => {
  it('describes where the device was, or why that is not known', () => {
    expect(locationText(session())).toBe('18.5204, 73.8567');
    expect(
      locationText(session({ location: { state: 'DENIED' } as VaultSessionRow['location'] })),
    ).toBe('Refused by the browser');
    expect(
      locationText(session({ location: { state: 'UNAVAILABLE' } as VaultSessionRow['location'] })),
    ).toBe('Not available');
  });

  it('shows the times in the viewer’s format and the session’s status', () => {
    const context = { formatDateTime: (value: string) => `at ${value}` } as VaultHistoryContext;
    const unlocked = column('unlockedAt');
    const format = unlocked?.valueFormatter as (p: ValueFormatterParams<VaultSessionRow>) => string;
    expect(format({ data: session(), context } as ValueFormatterParams<VaultSessionRow>)).toBe(
      'at 2026-10-26T10:00:00.000Z',
    );
    expect(format({ data: undefined, context } as ValueFormatterParams<VaultSessionRow>)).toBe('');

    const shared = { t: (text: string) => text };
    const status = column('endReason')?.valueGetter as (
      p: ValueGetterParams<VaultSessionRow>,
    ) => string;
    expect(status({ data: session(), context: shared } as ValueGetterParams<VaultSessionRow>)).toBe(
      'ACTIVE',
    );
    expect(
      status({
        data: session({ endReason: 'EXPIRED' as never }),
        context: shared,
      } as ValueGetterParams<VaultSessionRow>),
    ).toBe('EXPIRED');
  });

  it('opens a session’s details, with a map and what was done while it was open', async () => {
    renderWithProviders(<VaultHistoryPanel />);
    const grid = propsOf('ServerDataGrid');
    expect(grid.searchPlaceholder).toBe('Search by person, reason or IP…');

    act(() => (grid.onRowClick as (row: VaultSessionRow) => void)(session()));

    expect(await screen.findByText('Unlock session')).toBeInTheDocument();
    expect(screen.getByText('Asha Rao <asha@exyconn.com>')).toBeInTheDocument();
    expect(screen.getByText('Still open')).toBeInTheDocument();
    expect(screen.getByText('Within 25 m')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the location on a map' })).toHaveAttribute(
      'href',
      expect.stringContaining('openstreetmap.org/?mlat=18.52043&mlon=73.85674'),
    );
    expect(screen.getByText('Revealed the saved SMTP password')).toBeInTheDocument();
  });

  it('shows an ended session without a position, and the activity’s error', async () => {
    gql.activity.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Forbidden'),
      refetch: vi.fn(),
    });
    renderWithProviders(<VaultHistoryPanel />);
    const context = propsOf('ServerDataGrid').context as VaultHistoryContext;

    act(() =>
      context.actions.details(
        session({
          endedAt: '2026-10-26T10:12:00.000Z',
          location: { state: 'DENIED' } as VaultSessionRow['location'],
        }),
      ),
    );

    expect(await screen.findByText('Refused by the browser')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open the location on a map' })).toBeNull();
    expect(screen.queryByText('Still open')).toBeNull();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });
});
