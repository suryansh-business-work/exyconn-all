import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { TrackerMessagesPage } from '../../../../src/pages/tracker/TrackerMessagesPage';
import { renderWithProviders } from '../../test-utils';
import { employeeOption, queryResult } from './tracker.fixtures';
import { resetRecorded, tabberProps } from './tracker.mocks';

const state = vi.hoisted(() => ({ users: vi.fn(), employees: null as unknown }));

vi.mock('@exyconn/tabber', async () => (await import('./tracker.mocks')).tabberModuleMock());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListEmployeeOptionsQuery: state.users,
}));
vi.mock('../../../../src/pages/tracker/TrackerMessageInbox', () => ({
  TrackerMessageInbox: () => <p>Inbox here</p>,
}));
vi.mock('../../../../src/pages/tracker/forms/tracker-notice', () => ({
  TrackerNoticeForm: ({ employees }: Readonly<{ employees: unknown }>) => {
    state.employees = employees;
    return <p>Notice form here</p>;
  },
}));

describe('TrackerMessagesPage', () => {
  beforeEach(() => {
    resetRecorded();
    state.employees = null;
    state.users.mockReturnValue(
      queryResult({
        listEmployeeOptions: [employeeOption('u1', 'Asha Rao'), employeeOption('u2', 'Dev Mehta')],
      }),
    );
  });

  it('keeps the inbox and the notice apart, under the messages path', () => {
    renderWithProviders(<TrackerMessagesPage />);
    expect(screen.getByRole('heading', { name: 'Messages' })).toBeInTheDocument();
    expect(tabberProps().basePath).toBe('/tracker/messages');
    expect(tabberProps().ariaLabel).toBe('Message views');
    expect(tabberProps().items.map((item) => [item.slug, item.label])).toEqual([
      ['inbox', 'Inbox'],
      ['notice', 'Send a notice'],
    ]);
    expect(
      within(screen.getByRole('region', { name: 'Inbox' })).getByText('Inbox here'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Send a notice' })).getByText('Notice form here'),
    ).toBeInTheDocument();
  });

  it('offers every employee, by name and email, as a notice recipient', () => {
    renderWithProviders(<TrackerMessagesPage />);
    expect(state.employees).toEqual([
      { value: 'u1', label: 'Asha Rao (u1@example.test)' },
      { value: 'u2', label: 'Dev Mehta (u2@example.test)' },
    ]);
  });

  it('offers nobody while the employee list is loading', () => {
    state.users.mockReturnValue(queryResult(undefined, true));
    renderWithProviders(<TrackerMessagesPage />);
    expect(state.employees).toEqual([]);
  });
});
