import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  OnboardingOwner,
  useMyOnboardingQuery,
  useSetOnboardingItemMutation,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { mutationResult, queryResult, type QueryShape } from './helpers/apollo';
import { MyOnboardingPage } from '../../../../src/pages/employee/MyOnboardingPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyOnboardingQuery: vi.fn(),
  useSetOnboardingItemMutation: vi.fn(),
}));

const item = { dueOn: '2026-03-03', done: false, doneAt: null, doneByName: null, notes: '' };

const checklist = {
  id: 'c1',
  employeeId: 'e1',
  employeeName: 'Asha Rao',
  templateName: 'Engineering joiner',
  joinDate: '2026-03-02',
  progressPercent: 50,
  complete: false,
  items: [
    { ...item, key: 'bank', label: 'Share bank details', owner: OnboardingOwner.Employee },
    { ...item, key: 'laptop', label: 'Issue a laptop', owner: OnboardingOwner.It, done: true },
  ],
};

function renderPage(
  query: QueryShape,
  setItem: (...args: never[]) => unknown = vi.fn(() => Promise.resolve({})),
  saving = false,
) {
  const refetch = vi.fn(() => Promise.resolve({}));
  vi.mocked(useMyOnboardingQuery).mockReturnValue(queryResult({ refetch, ...query }));
  vi.mocked(useSetOnboardingItemMutation).mockReturnValue(mutationResult(setItem, saving));
  renderWithProviders(<MyOnboardingPage />);
  return { setItem, refetch };
}

describe('MyOnboardingPage', () => {
  it('shows a spinner until the first answer', () => {
    renderPage({ loading: true });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Nothing to do here yet')).toBeNull();
  });

  it('shows the error the server gave', () => {
    renderPage({ error: new Error('Not signed in') });
    expect(screen.getByRole('alert')).toHaveTextContent('Not signed in');
  });

  it('explains that HR has not started a checklist yet', () => {
    renderPage({ data: { myOnboarding: null } });
    expect(screen.getByText('Nothing to do here yet')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('shows every task, letting the joiner tick only their own', () => {
    renderPage({ data: { myOnboarding: checklist } });
    expect(screen.getByText('Engineering joiner · from on 2026-03-02')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 done')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Share bank details' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Issue a laptop' })).toBeDisabled();
  });

  it('ticks a task off and reloads the checklist', async () => {
    const { setItem, refetch } = renderPage({ data: { myOnboarding: checklist } });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Share bank details' }));

    expect(setItem).toHaveBeenCalledWith({
      variables: { checklistId: 'c1', key: 'bank', done: true },
    });
    await vi.waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
  });

  it('locks the ticks while a change is saving', () => {
    renderPage({ data: { myOnboarding: checklist } }, vi.fn(), true);
    expect(screen.getByRole('checkbox', { name: 'Share bank details' })).toBeDisabled();
  });

  it("says why a tick did not save, with the server's reason or a plain one", async () => {
    const user = userEvent.setup();
    const setItem = vi
      .fn()
      .mockRejectedValueOnce(new Error('Checklist is closed'))
      .mockRejectedValueOnce('offline');
    const { refetch } = renderPage({ data: { myOnboarding: checklist } }, setItem);

    await user.click(screen.getByRole('checkbox', { name: 'Share bank details' }));
    expect(await screen.findByText('Checklist is closed')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Share bank details' }));
    expect(await screen.findByText('Could not update the task')).toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();
  });
});
