import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useMyTrackerManualEntriesQuery,
  useWithdrawTrackerManualEntryMutation,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { mutationResult, queryResult } from './helpers/apollo';
import { entries } from './helpers/offComputer';
import { MyOffComputerTime } from '../../../../src/pages/employee/MyOffComputerTime';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyTrackerManualEntriesQuery: vi.fn(),
  useWithdrawTrackerManualEntryMutation: vi.fn(),
}));
vi.mock('../../../../src/pages/employee/forms/off-computer-time', async () => {
  const { FormStub } = await import('./helpers/stubs');
  return { OffComputerTimeForm: FormStub };
});

function renderList(withdraw: (...args: never[]) => unknown) {
  vi.mocked(useMyTrackerManualEntriesQuery).mockReturnValue(
    queryResult({ data: { myTrackerManualEntries: entries } }),
  );
  vi.mocked(useWithdrawTrackerManualEntryMutation).mockReturnValue(mutationResult(withdraw));
  renderWithProviders(
    <MyOffComputerTime
      from="2026-03-01T00:00:00.000Z"
      to="2026-04-01T00:00:00.000Z"
      projects={[]}
    />,
  );
  return userEvent.setup();
}

/** Clicks Withdraw on the pending claim and returns the confirmation dialog. */
async function askToWithdraw(user: ReturnType<typeof userEvent.setup>) {
  const [pending] = screen.getAllByRole('button', { name: 'Withdraw entry' });
  await user.click(pending);
  return screen.findByRole('dialog');
}

describe('MyOffComputerTime withdrawing a claim', () => {
  it('refuses a claim that has already been reviewed, and says why', async () => {
    const withdraw = vi.fn();
    const user = renderList(withdraw);

    const [, reviewed] = screen.getAllByRole('button', { name: 'Withdraw entry' });
    await user.click(reviewed);

    expect(
      await screen.findByText('Only an entry still awaiting review can be withdrawn.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(withdraw).not.toHaveBeenCalled();
  });

  it('asks first, naming the claim, and does nothing when the employee cancels', async () => {
    const withdraw = vi.fn();
    const user = renderList(withdraw);

    const dialog = await askToWithdraw(user);
    expect(within(dialog).getByText('Withdraw this entry?')).toBeInTheDocument();
    expect(
      within(dialog).getByText('"Client call" will be removed and never reviewed.'),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(withdraw).not.toHaveBeenCalled();
  });

  it('withdraws the pending claim once confirmed', async () => {
    const withdraw = vi.fn(() => Promise.resolve({}));
    const user = renderList(withdraw);

    const dialog = await askToWithdraw(user);
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw' }));

    expect(await screen.findByText('Entry withdrawn')).toBeInTheDocument();
    expect(withdraw).toHaveBeenCalledWith({ variables: { id: 'm1' } });
  });

  it("shows the server's reason when the withdrawal fails", async () => {
    const user = renderList(vi.fn(() => Promise.reject(new Error('Entry already reviewed'))));

    const dialog = await askToWithdraw(user);
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw' }));

    expect(await screen.findByText('Entry already reviewed')).toBeInTheDocument();
  });

  it('falls back to a plain message when the failure carries no reason', async () => {
    const user = renderList(vi.fn(() => Promise.reject(new Response(null, { status: 500 }))));

    const dialog = await askToWithdraw(user);
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw' }));

    expect(await screen.findByText('Could not withdraw the entry')).toBeInTheDocument();
  });
});
