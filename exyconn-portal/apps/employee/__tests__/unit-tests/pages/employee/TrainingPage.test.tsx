import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TrainingStatus,
  useMyTrainingsQuery,
  useUpdateMyTrainingStatusMutation,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { mutationResult, queryResult } from './helpers/apollo';
import { TrainingPage } from '../../../../src/pages/employee/TrainingPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyTrainingsQuery: vi.fn(),
  useUpdateMyTrainingStatusMutation: vi.fn(),
}));

const trainings = [
  {
    id: 'tr1',
    title: 'Secure coding',
    provider: 'OWASP Academy',
    category: 'Security',
    dueOn: '2026-04-30',
    completedOn: null,
    status: TrainingStatus.Assigned,
    certificateUrl: null,
  },
  {
    id: 'tr2',
    title: 'Fire safety',
    provider: '',
    category: '',
    dueOn: null,
    completedOn: '2026-02-01',
    status: TrainingStatus.Completed,
    certificateUrl: 'https://files.example.com/fire.pdf',
  },
];

function renderPage(update = vi.fn(() => Promise.resolve({}))) {
  const refetch = vi.fn(() => Promise.resolve({}));
  vi.mocked(useMyTrainingsQuery).mockReturnValue(
    queryResult({ data: { myTrainings: trainings }, refetch }),
  );
  vi.mocked(useUpdateMyTrainingStatusMutation).mockReturnValue(mutationResult(update));
  renderWithProviders(<TrainingPage />);
  return { update, refetch };
}

describe('TrainingPage', () => {
  it('lists each course with its category, provider, due date, status and certificate', () => {
    renderPage();
    const [, secure, fire] = screen.getAllByRole('row');

    expect(within(secure).getByText('Secure coding')).toBeInTheDocument();
    expect(within(secure).getByText('Security')).toBeInTheDocument();
    expect(within(secure).getByText('OWASP Academy')).toBeInTheDocument();
    expect(within(secure).getByText('on 2026-04-30')).toBeInTheDocument();
    expect(within(secure).getByText('ASSIGNED')).toBeInTheDocument();
    expect(within(secure).getByText('—')).toBeInTheDocument();

    // No category, provider or due date: three dashes; the certificate opens in a new tab.
    expect(within(fire).getAllByText('—')).toHaveLength(3);
    expect(within(fire).getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      'https://files.example.com/fire.pdf',
    );
    expect(within(fire).getByText('Done')).toBeInTheDocument();
  });

  it('moves a course to its next step, confirms it and reloads the list', async () => {
    const { update, refetch } = renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(update).toHaveBeenCalledWith({
      variables: { id: 'tr1', status: TrainingStatus.InProgress },
    });
    expect(await screen.findByText('Training updated.')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('says nothing is assigned when the list is empty', () => {
    vi.mocked(useMyTrainingsQuery).mockReturnValue(queryResult({ data: { myTrainings: [] } }));
    vi.mocked(useUpdateMyTrainingStatusMutation).mockReturnValue(mutationResult(vi.fn()));
    renderWithProviders(<TrainingPage />);
    expect(screen.getByText('No training assigned to you yet.')).toBeInTheDocument();
  });

  it('holds the table busy and does not claim the list is empty while the first response loads', () => {
    vi.mocked(useMyTrainingsQuery).mockReturnValue(queryResult({ loading: true }));
    vi.mocked(useUpdateMyTrainingStatusMutation).mockReturnValue(mutationResult(vi.fn()));
    const { container } = renderWithProviders(<TrainingPage />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('No training assigned to you yet.')).toBeNull();
  });
});
