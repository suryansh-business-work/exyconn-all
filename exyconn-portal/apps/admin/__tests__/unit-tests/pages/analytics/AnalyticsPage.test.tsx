import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ROLES } from '@exyconn/shell/auth/roles';
import {
  PlatformAnalyticsDocument,
  WorkspaceAnalyticsDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { AnalyticsPage } from '../../../../src/pages/analytics';
import { platform, workspace } from './analytics.fixtures';

vi.mock('react-chartjs-2', async () => {
  const { DrawnChart } = await import('./analytics.fixtures');
  return { Bar: DrawnChart, Line: DrawnChart };
});

const auth = vi.hoisted(() => ({ user: null as null | { roles: string[] } }));
vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => auth }));

/** The users total tells two periods' reports apart on screen. */
const workspaceAnswer = (days: number, total: number, delay = 0) => ({
  request: { query: WorkspaceAnalyticsDocument, variables: { days } },
  result: {
    data: { workspaceAnalytics: workspace({ days, users: { ...workspace().users, total } }) },
  },
  delay,
});

const platformAnswer = {
  request: { query: PlatformAnalyticsDocument },
  result: { data: { platformAnalytics: platform() } },
};

beforeEach(() => {
  auth.user = { roles: [ROLES.ADMIN] };
});

describe('AnalyticsPage', () => {
  it('loads the last 30 days of users, employees and the tracker', async () => {
    renderWithProviders(<AnalyticsPage />, { mocks: [workspaceAnswer(30, 12, 20)] });
    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByText('Loading analytics…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true');

    expect(await screen.findByRole('region', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Employee tracker' })).toBeInTheDocument();
    expect(screen.queryByText('Loading analytics…')).toBeNull();
    // A company ADMIN never sees the platform-wide section.
    expect(screen.queryByRole('region', { name: 'Platform' })).toBeNull();
  });

  it('re-reads the report for another period, and ignores a click on the current one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnalyticsPage />, {
      mocks: [workspaceAnswer(30, 12), workspaceAnswer(7, 99)],
    });
    expect(await screen.findByText('12')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '7 days' }));
    expect(await screen.findByText('99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'true');

    // Deselecting the pressed period would leave no period at all, so it stays pressed.
    await user.click(screen.getByRole('button', { name: '7 days' }));
    expect(screen.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the error when the report cannot be read', async () => {
    renderWithProviders(<AnalyticsPage />, {
      mocks: [
        {
          request: { query: WorkspaceAnalyticsDocument, variables: { days: 30 } },
          error: new Error('Analytics offline'),
        },
      ],
    });
    expect(await screen.findByText('Analytics offline')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Users' })).toBeNull();
  });

  it('adds the platform section for a SUPER_ADMIN', async () => {
    auth.user = { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] };
    renderWithProviders(<AnalyticsPage />, { mocks: [workspaceAnswer(30, 12), platformAnswer] });
    expect(await screen.findByRole('region', { name: 'Platform' })).toBeInTheDocument();
    expect(await screen.findByText('Organizations created per month')).toBeInTheDocument();
  });

  it('treats nobody signed in as no platform access', async () => {
    auth.user = null;
    renderWithProviders(<AnalyticsPage />, { mocks: [workspaceAnswer(30, 12)] });
    expect(await screen.findByRole('region', { name: 'Users' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Platform' })).toBeNull();
  });
});
