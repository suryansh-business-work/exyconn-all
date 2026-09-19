import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  ClearRolePermissionDocument,
  ListPermissionModulesDocument,
  ListRolePermissionsDocument,
  PermissionAction as A,
  Role,
  SetRolePermissionDocument,
} from '@exyconn/shell/graphql/generated';
import { PermissionMatrix } from '../../src/pages/permissions/PermissionMatrix';

const row = (id: string, role: string, module: string, actions: A[]) => ({
  __typename: 'RolePermission',
  id,
  role,
  module,
  actions,
  updatedAt: '2026-09-19T00:00:00.000Z',
});

/** HR is restricted on Budget; FINANCE's own row must not leak into HR's matrix. */
const STORED = [
  row('1', 'HR', 'Budget', [A.View, A.Approve]),
  row('2', 'FINANCE', 'Activity', [A.View]),
];

const modules = (names: string[]): MockedResponse => ({
  request: { query: ListPermissionModulesDocument },
  result: { data: { listPermissionModules: names } },
  maxUsageCount: 10,
});
const stored = (rows = STORED): MockedResponse => ({
  request: { query: ListRolePermissionsDocument },
  result: { data: { listRolePermissions: rows } },
});
const failedReload: MockedResponse = {
  request: { query: ListRolePermissionsDocument },
  error: new Error('reload failed'),
};
const restrictActivity = (error?: Error): MockedResponse => ({
  request: {
    query: SetRolePermissionDocument,
    variables: {
      role: 'HR',
      module: 'Activity',
      actions: [A.Create, A.Edit, A.Delete, A.Approve, A.Export],
    },
  },
  ...(error
    ? { error }
    : { result: { data: { setRolePermission: row('3', 'HR', 'Activity', [A.Create]) } } }),
});
const clearBudget = (error?: Error): MockedResponse => ({
  request: { query: ClearRolePermissionDocument, variables: { role: 'HR', module: 'Budget' } },
  ...(error ? { error } : { result: { data: { clearRolePermission: true } } }),
});

function mount(mocks: MockedResponse[]) {
  render(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PermissionMatrix role={Role.Hr} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );
  return userEvent.setup();
}

const box = (name: string) => screen.getByRole('checkbox', { name }) as HTMLInputElement;
const rowOf = (module: string) =>
  screen.getByRole('rowheader', { name: new RegExp(module) }).closest('tr') as HTMLElement;
const saveBar = () => screen.queryByRole('button', { name: 'Save changes' });

afterEach(() => vi.restoreAllMocks());

describe('PermissionMatrix', () => {
  it('shows a loader, then says when no module is registered', async () => {
    mount([modules([]), stored()]);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(await screen.findByText('No modules registered.')).toBeInTheDocument();
  });

  it("shows HR's stored matrix: default rows fully ticked, restricted rows as stored", async () => {
    mount([modules(['Activity', 'Budget']), stored()]);
    await waitFor(() => expect(box('Approve in Budget').checked).toBe(true));
    expect(within(rowOf('Activity')).getByText('Default')).toBeInTheDocument();
    expect(within(rowOf('Budget')).getByText('Restricted')).toBeInTheDocument();
    expect(box('View in Activity').checked).toBe(true);
    expect(box('Edit in Budget').checked).toBe(false);
    expect(box('Every action in Budget').indeterminate).toBe(true);
    expect(box('Export in every module').indeterminate).toBe(true);
    expect(box('View in every module').checked).toBe(true);
    expect(within(rowOf('Activity')).queryByRole('button', { name: /Reset/ })).toBeNull();
  });

  it('counts a change, and stops counting it once undone', async () => {
    const user = mount([modules(['Activity', 'Budget']), stored()]);
    await waitFor(() => expect(box('View in Activity').checked).toBe(true));
    await user.click(box('View in Activity'));
    expect(within(rowOf('Activity')).getByText('Unsaved')).toBeInTheDocument();
    expect(screen.getAllByText('1 module(s) changed — switching role discards them.')).toHaveLength(
      2,
    );
    await user.click(box('View in Activity'));
    expect(saveBar()).toBeNull();
  });

  it('fills and empties a whole row', async () => {
    const user = mount([modules(['Activity', 'Budget']), stored()]);
    await waitFor(() => expect(box('Approve in Budget').checked).toBe(true));
    await user.click(box('Every action in Budget'));
    expect(box('Edit in Budget').checked).toBe(true);
    await user.click(box('Every action in Budget'));
    expect(box('View in Budget').checked).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(box('View in Budget').checked).toBe(true);
    expect(saveBar()).toBeNull();
  });

  it('gives or takes one action across every module from its column', async () => {
    const user = mount([modules(['Activity', 'Budget']), stored()]);
    await waitFor(() => expect(box('Export in Budget').checked).toBe(false));
    await user.click(box('Export in every module'));
    expect(box('Export in Budget').checked).toBe(true);
    expect(box('Export in Activity').checked).toBe(true);
    await user.click(box('Export in every module'));
    expect(box('Export in Activity').checked).toBe(false);
    expect(box('Export in Budget').checked).toBe(false);
  });

  it('saves every changed module in one go — full access as back-to-default', async () => {
    const user = mount([
      modules(['Activity', 'Budget']),
      stored(),
      restrictActivity(),
      clearBudget(),
      stored([row('3', 'HR', 'Activity', [A.Create, A.Edit, A.Delete, A.Approve, A.Export])]),
    ]);
    await waitFor(() => expect(box('View in Activity').checked).toBe(true));
    await user.click(box('View in Activity'));
    await user.click(box('Every action in Budget'));
    await user.click(saveBar() as HTMLElement);
    expect(await screen.findByText('Saved 2 module(s) for HR')).toBeInTheDocument();
    await waitFor(() => expect(saveBar()).toBeNull());
    expect(within(rowOf('Activity')).getByText('Restricted')).toBeInTheDocument();
    expect(within(rowOf('Budget')).getByText('Default')).toBeInTheDocument();
  });

  it('keeps unsaved rows when a save fails', async () => {
    const user = mount([
      modules(['Activity']),
      stored(),
      restrictActivity(new Error('Not allowed')),
      stored(),
    ]);
    await waitFor(() => expect(box('View in Activity').checked).toBe(true));
    await user.click(box('View in Activity'));
    await user.click(saveBar() as HTMLElement);
    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
    await waitFor(() => expect(saveBar()).not.toBeDisabled());
    expect(within(rowOf('Activity')).getByText('Unsaved')).toBeInTheDocument();
  });

  it('logs a reload that fails after saving, and unlocks the matrix', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    const user = mount([modules(['Activity']), stored(), restrictActivity(), failedReload]);
    await waitFor(() => expect(box('View in Activity').checked).toBe(true));
    await user.click(box('View in Activity'));
    await user.click(saveBar() as HTMLElement);
    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith('Saving permissions failed', expect.any(Error)),
    );
    expect(box('Edit in Activity')).not.toBeDisabled();
  });

  it('resets a restricted module to default', async () => {
    const user = mount([modules(['Budget']), stored(), clearBudget(), stored([])]);
    const reset = await screen.findByRole('button', { name: 'Reset Budget to default' });
    await user.click(reset);
    expect(await screen.findByText('HR on Budget: back to default')).toBeInTheDocument();
    await waitFor(() => expect(within(rowOf('Budget')).getByText('Default')).toBeInTheDocument());
  });

  it('says why a reset failed', async () => {
    const user = mount([modules(['Budget']), stored(), clearBudget(new Error('Server down'))]);
    await user.click(await screen.findByRole('button', { name: 'Reset Budget to default' }));
    expect(await screen.findByText('Server down')).toBeInTheDocument();
  });
});
