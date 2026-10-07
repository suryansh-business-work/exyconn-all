import type { ComponentProps, ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { UserForm } from '@exyconn/shell/pages/user-forms/user';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { dashboardProps, statValues, TABLE_INPUT } from '../../crud-dashboard.stub';
import { AdminPage } from '../../../../src/pages/admin';
import { USER_COLUMNS } from '../../../../src/pages/admin/users-grid';
import { user, usersPage, usersStats } from './admin.fixtures';

vi.mock('@exyconn/crud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/crud')>();
  const { CrudDashboardStub } = await import('../../crud-dashboard.stub');
  return { ...actual, CrudDashboard: CrudDashboardStub };
});

/** Prints where the router is, so a test can see a row click navigate. */
function Url() {
  return <output data-testid="url">{useCurrentUrl()}</output>;
}

const renderPage = (mocks = [usersStats()]) =>
  renderWithProviders(
    <>
      <AdminPage />
      <Url />
    </>,
    { mocks, route: '/admin/users' },
  );

type UserFormElement = ReactElement<ComponentProps<typeof UserForm>>;

describe('AdminPage', () => {
  it('hands the dashboard the users grid, restricted under the User module', () => {
    renderPage();
    const props = dashboardProps();
    expect(props.title).toBe('Admin');
    expect(props.entityLabel).toBe('user');
    expect(props.exportFileName).toBe('users');
    expect(props.permissionModule).toBe('User');
    expect(props.columnDefs).toBe(USER_COLUMNS);
  });

  it('holds placeholder tiles until the stats answer, then counts users, actives and admins', async () => {
    renderPage();
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({ Users: '0', Active: '0', Admins: '0', 'Roles in use': '0' });

    await waitFor(() =>
      expect(statValues()).toEqual({ Users: '5', Active: '3', Admins: '2', 'Roles in use': '2' }),
    );
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('reads a page of users from the server for the grid', async () => {
    const rows = [user(), user({ id: 'user-2', name: 'Ben Ito', email: 'ben@example.com' })];
    renderPage([usersStats(), usersPage(rows)]);

    const page = await dashboardProps().fetchRows(TABLE_INPUT);
    expect(page.totalCount).toBe(2);
    expect(page.rows).toEqual(rows);
  });

  it("opens the user's details page when a row is clicked", () => {
    renderPage();
    expect(screen.getByTestId('url')).toHaveTextContent('/admin/users');
    act(() => dashboardProps().onRowClick?.(user({ id: 'user-9' })));
    expect(screen.getByTestId('url')).toHaveTextContent('/admin/users/user-9');
  });

  it('opens the edit form for the row the edit action was pressed on', () => {
    renderPage();
    const row = user();
    act(() => {
      dashboardProps().context.actions.edit(row);
    });
    expect(dashboardProps().crud?.open).toBe(true);
    expect(dashboardProps().crud?.editing).toBe(row);
    expect(screen.getByTestId('url')).toHaveTextContent('?form=edit');
  });

  it('renders the shared user form wired to the dashboard, and reveals new credentials', async () => {
    renderPage();
    const form = dashboardProps().renderForm?.(null) as UserFormElement;
    expect(form.type).toBe(UserForm);
    expect(form.props.initial).toBeNull();
    expect(form.props.onCancel).toBe(dashboardProps().crud?.close);
    expect(form.props.onDone).toBe(dashboardProps().crud?.onDone);

    const password = ['new', 'user', 'pw'].join('-');
    act(() => form.props.onCreated?.({ name: 'Ben Ito', email: 'ben@example.com', password }));
    expect(await screen.findByText('Credentials for Ben Ito')).toBeInTheDocument();
    expect(screen.getByText(password)).toBeInTheDocument();
  });
});
