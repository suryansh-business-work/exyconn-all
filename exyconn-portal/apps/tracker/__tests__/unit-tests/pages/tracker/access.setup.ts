import { screen } from '@testing-library/react';
import type { Mock } from 'vitest';
import { accessRow, employeeOption, queryResult, settingsRow } from './tracker.fixtures';

/** The generated hooks the access console and its timezone lookup read, plus what they hand back. */
export type AccessState = Record<
  | 'users'
  | 'access'
  | 'grant'
  | 'revoke'
  | 'settings'
  | 'devices'
  | 'refetchUsers'
  | 'refetchAccess'
  | 'grantAccess'
  | 'revokeAccess',
  Mock
>;

/** Four employees: active + consented, active + pending, never granted, and revoked. */
export const EMPLOYEES = [
  employeeOption('u1', 'Asha Rao'),
  employeeOption('u2', 'Dev Mehta'),
  employeeOption('u3', 'Ravi Kumar'),
  employeeOption('u4', 'Mira Shah'),
];

export const ACCESS = [
  accessRow({
    id: 'a1',
    userId: 'u1',
    consentedAt: '2026-01-11T00:00:00Z',
    timezone: 'Europe/London',
  }),
  accessRow({ id: 'a2', userId: 'u2' }),
  accessRow({ id: 'a4', userId: 'u4', isActive: false, consentedAt: '2026-01-02T00:00:00Z' }),
];

/** Resets every mock and answers with the four employees, fully loaded. */
export function answerAccess(state: AccessState) {
  Object.values(state).forEach((fn) => fn.mockReset());
  state.refetchUsers.mockResolvedValue({});
  state.refetchAccess.mockResolvedValue({});
  state.grantAccess.mockResolvedValue({ data: {} });
  state.revokeAccess.mockResolvedValue({ data: {} });
  state.users.mockReturnValue(
    queryResult({ listEmployeeOptions: EMPLOYEES }, false, { refetch: state.refetchUsers }),
  );
  state.access.mockReturnValue(
    queryResult({ trackerAccessList: ACCESS }, false, { refetch: state.refetchAccess }),
  );
  state.grant.mockReturnValue([state.grantAccess]);
  state.revoke.mockReturnValue([state.revokeAccess]);
  state.settings.mockReturnValue(
    queryResult({ trackerSettings: settingsRow({ defaultTimezone: 'Asia/Kolkata' }) }),
  );
  state.devices.mockReturnValue(queryResult({ trackerDevices: [] }));
}

/** The table row that names this employee. */
export function rowOf(name: string): HTMLElement {
  const row = screen.getByText(name).closest('tr');
  if (!row) {
    throw new Error(`No row for ${name}`);
  }
  return row;
}
