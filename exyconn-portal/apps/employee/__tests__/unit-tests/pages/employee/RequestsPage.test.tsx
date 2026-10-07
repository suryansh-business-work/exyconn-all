import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMyRequestsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { RequestsPage } from '../../../../src/pages/employee/RequestsPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyRequestsQuery: vi.fn(),
}));
vi.mock('../../../../src/pages/employee/forms/raise-request', async () => {
  const { FormStub } = await import('./helpers/stubs');
  return { RaiseRequestForm: FormStub };
});

const requests = [
  {
    id: 'q1',
    subject: 'Work from home Friday',
    type: 'WFH',
    details: 'Plumber visit',
    status: 'APPROVED',
    createdAt: '2026-03-01T08:00:00.000Z',
    decisionNote: 'Enjoy',
  },
  {
    id: 'q2',
    subject: 'Address proof letter',
    type: 'DOCUMENT',
    details: 'For a bank',
    status: 'PENDING',
    createdAt: '2026-03-02T08:00:00.000Z',
    decisionNote: null,
  },
];

describe('RequestsPage', () => {
  it('lists each request with its type, details, status, date and the HR note', () => {
    vi.mocked(useMyRequestsQuery).mockReturnValue(queryResult({ data: { myRequests: requests } }));
    renderWithProviders(<RequestsPage />);

    const [, wfh, letter] = screen.getAllByRole('row');
    expect(within(wfh).getByText('Work from home Friday')).toBeInTheDocument();
    expect(within(wfh).getByText('WFH')).toBeInTheDocument();
    expect(within(wfh).getByText('Plumber visit')).toBeInTheDocument();
    expect(within(wfh).getByText('APPROVED')).toBeInTheDocument();
    expect(within(wfh).getByText('on 2026-03-01T08:00:00.000Z')).toBeInTheDocument();
    expect(within(wfh).getByText('Enjoy')).toBeInTheDocument();
    expect(within(letter).getByText('—')).toBeInTheDocument();
  });

  it('says none have been raised when the list is empty', () => {
    vi.mocked(useMyRequestsQuery).mockReturnValue(queryResult({ data: { myRequests: [] } }));
    renderWithProviders(<RequestsPage />);
    expect(screen.getByText('You have not raised any requests yet.')).toBeInTheDocument();
  });

  it('opens the request form and closes it by the back link or Cancel', async () => {
    const user = userEvent.setup();
    vi.mocked(useMyRequestsQuery).mockReturnValue(queryResult({ data: { myRequests: [] } }));
    renderWithProviders(<RequestsPage />);

    await user.click(screen.getByRole('button', { name: 'Raise request' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Raise a request' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to My Requests' }));
    expect(screen.getByRole('heading', { level: 1, name: 'My Requests' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Raise request' }));
    await user.click(screen.getByRole('button', { name: 'Stub cancel' }));
    expect(screen.getByRole('heading', { level: 1, name: 'My Requests' })).toBeInTheDocument();
  });

  it('returns to the list and reloads it once a request is raised', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn(() => Promise.resolve({}));
    vi.mocked(useMyRequestsQuery).mockReturnValue(
      queryResult({ data: { myRequests: [] }, refetch }),
    );
    renderWithProviders(<RequestsPage />);

    await user.click(screen.getByRole('button', { name: 'Raise request' }));
    await user.click(screen.getByRole('button', { name: 'Stub done' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'My Requests' }),
    ).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
