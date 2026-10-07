import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemHealthDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { SystemHealthPage } from '../../../../src/pages/health';
import { health } from './health.fixtures';

const answer = (systemHealth = health()) => ({
  request: { query: SystemHealthDocument },
  result: { data: { systemHealth } },
});

const failure = (message: string) => ({
  request: { query: SystemHealthDocument },
  error: new Error(message),
});

describe('SystemHealthPage', () => {
  it('shows the runtime, jobs, workload and backup once the query answers', async () => {
    renderWithProviders(<SystemHealthPage />, { mocks: [answer()] });
    expect(screen.getByRole('heading', { name: 'System Health' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    expect(await screen.findByText('Runtime')).toBeInTheDocument();
    expect(screen.getByText('1.9.0')).toBeInTheDocument();
    expect(screen.getByText('12m 30s')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('exyconn')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('81.2 MB')).toBeInTheDocument();
    expect(screen.getByText('Payslip schedule')).toBeInTheDocument();
    expect(screen.getByText('Workload')).toBeInTheDocument();
    expect(screen.getByText('Open tickets')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Database backup')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('says when the database is unreachable and has no name', async () => {
    const down = health({
      mongo: { __typename: 'HealthMongo', ok: false, dbName: '', collections: 0, dataSizeMb: 0 },
    });
    renderWithProviders(<SystemHealthPage />, { mocks: [answer(down)] });
    expect(await screen.findByText('Not connected')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows an error when health cannot be read', async () => {
    renderWithProviders(<SystemHealthPage />, { mocks: [failure('Server down')] });
    expect(await screen.findByText('Server down')).toBeInTheDocument();
    expect(screen.queryByText('Runtime')).toBeNull();
  });

  it('re-reads everything on Refresh', async () => {
    const user = userEvent.setup();
    const later = health({ serverVersion: '2.0.0' });
    renderWithProviders(<SystemHealthPage />, { mocks: [answer(), answer(later)] });
    await screen.findByText('1.9.0');
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('2.0.0')).toBeInTheDocument();
  });

  it('tells the admin when a refresh fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SystemHealthPage />, { mocks: [answer(), failure('Timed out')] });
    await screen.findByText('1.9.0');
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    // The page's own banner shows the query error; the snackbar reports the failed refresh.
    await waitFor(() =>
      expect(document.querySelector('.MuiSnackbar-root')).toHaveTextContent('Timed out'),
    );
  });
});
