import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { PermissionActionKey } from '@exyconn/shell/hooks/usePermissions';
import { CrudDashboard } from '../../../src/page/CrudDashboard';
import { renderWithProviders } from '../test-utils';
import {
  crudResource,
  fetchLeads,
  gridProps,
  leadColumns,
  stats,
  type Lead,
} from './dashboardFixtures';

const permissions = vi.hoisted(() => ({
  denied: new Set<string>(),
  asked: [] as string[],
}));

vi.mock('@exyconn/shell/hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: (module: string, action: PermissionActionKey) => {
      permissions.asked.push(module);
      return !permissions.denied.has(action);
    },
    loading: false,
  }),
}));
vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () => ({
  ServerDataGrid: (await import('./dashboardFixtures')).GridStub,
}));

const edit = vi.fn();
const remove = vi.fn();

const renderDashboard = (permissionModule?: string, withCrud = true) =>
  renderWithProviders(
    <CrudDashboard<Lead, Lead>
      title="Leads"
      subtitle="Every lead"
      entityLabel="lead"
      stats={stats}
      crud={withCrud ? crudResource() : undefined}
      refreshSignal={0}
      columnDefs={leadColumns}
      fetchRows={fetchLeads()}
      context={{ actions: { edit, delete: remove } }}
      searchPlaceholder="Search leads"
      exportFileName="leads"
      permissionModule={permissionModule}
    />,
  );

const setPhone = (matches: boolean) => {
  globalThis.matchMedia = vi.fn().mockImplementation((media: string) => ({
    matches,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

afterEach(() => {
  permissions.denied.clear();
  permissions.asked.length = 0;
  setPhone(false);
});

describe('CrudDashboard permissions', () => {
  it('offers every action when the role allows them all', () => {
    renderDashboard('Leads');
    expect(screen.getByRole('button', { name: 'New lead' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    const actions = (gridProps.current?.context as { actions: object }).actions;
    expect(Object.keys(actions)).toEqual(['edit', 'delete']);
    expect(permissions.asked.every((module) => module === 'Leads')).toBe(true);
  });

  it('takes away what the role has switched off', () => {
    permissions.denied = new Set(['create', 'delete', 'export']);
    renderDashboard('Leads');
    expect(screen.queryByRole('button', { name: 'New lead' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
    const actions = (gridProps.current?.context as { actions: object }).actions;
    expect(actions).toEqual({ edit });
  });

  it('asks nothing when the screen names no permission module', () => {
    permissions.denied = new Set(['create', 'delete', 'export']);
    renderDashboard();
    expect(screen.getByRole('button', { name: 'New lead' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(permissions.asked).toEqual([]);
  });
});

describe('CrudDashboard on a phone', () => {
  it('shows the records as cards, with only the actions the role allows', async () => {
    setPhone(true);
    permissions.denied = new Set(['delete']);
    gridProps.current = null;
    renderDashboard('Leads');
    expect(screen.queryByTestId('grid')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search leads' })).toBeInTheDocument();
    expect(await screen.findByText('Acme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'delete' })).not.toBeInTheDocument();
    expect(gridProps.current).toBeNull();
  });

  it('lists the cards with no New button when the page has no crud resource', async () => {
    setPhone(true);
    renderDashboard(undefined, false);
    expect(await screen.findByText('Acme')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New lead' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'delete' })).toBeInTheDocument();
  });
});
