import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingPage } from '../../../../src/pages/lifecycle';
import { renderWithProviders } from '../../test-utils';
import { joinerRow } from '../page-kit/people.fixtures';

const gql = vi.hoisted(() => ({
  onboarding: vi.fn(),
  refetch: vi.fn(),
  tick: vi.fn(),
  provision: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useItOnboardingQuery: (options: unknown) => gql.onboarding(options),
  useSetOnboardingItemMutation: () => [gql.tick],
  useItProvisionOnboardingMutation: () => [gql.provision],
}));

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../page-kit/settings.mock')).settingsModule,
);

function answer(itOnboarding: unknown[], extra: Record<string, unknown> = {}) {
  return {
    data: { itOnboarding },
    loading: false,
    error: undefined,
    refetch: gql.refetch,
    ...extra,
  };
}

const laptop = { name: 'Laptop · due date(2026-10-10)' };
const email = { name: 'Email account · due date(2026-10-11)' };
const provisionButton = { name: 'Request the missing applications' };

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.tick.mockResolvedValue({ data: {} });
    gql.provision.mockResolvedValue({ data: {} });
    gql.onboarding.mockReturnValue(answer([joinerRow()]));
  });

  it('reads the joiners fresh from the network every time', () => {
    renderWithProviders(<OnboardingPage />);

    expect(gql.onboarding).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'Employee Onboarding' })).toBeInTheDocument();
  });

  it('says so when nobody has IT tasks waiting', () => {
    gql.onboarding.mockReturnValue(answer([]));
    renderWithProviders(<OnboardingPage />);

    expect(screen.getByText('No joiners have IT tasks waiting.')).toBeInTheDocument();
  });

  it('shows loading only while there is nothing to show yet', () => {
    gql.onboarding.mockReturnValue({ ...answer([]), data: undefined, loading: true });
    renderWithProviders(<OnboardingPage />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('keeps showing the joiners during a background refresh', () => {
    gql.onboarding.mockReturnValue(answer([joinerRow()], { loading: true }));
    renderWithProviders(<OnboardingPage />);

    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
  });

  it('shows the error when the joiners cannot be read', () => {
    gql.onboarding.mockReturnValue(answer([], { error: new Error('Not allowed') }));
    renderWithProviders(<OnboardingPage />);

    expect(screen.getByText('Not allowed')).toBeInTheDocument();
  });

  it('shows each joiner with their checklist, access and missing applications', () => {
    renderWithProviders(<OnboardingPage />);

    expect(screen.getByText('Joins date(2026-10-12)')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', laptop)).not.toBeChecked();
    expect(screen.getByRole('checkbox', email)).toBeChecked();
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('Zoom — missing')).toBeInTheDocument();
    expect(screen.getByRole('button', provisionButton)).toBeEnabled();
  });

  it('ticks a task off and refreshes the list', async () => {
    renderWithProviders(<OnboardingPage />);

    await userEvent.click(screen.getByRole('checkbox', laptop));

    expect(gql.tick).toHaveBeenCalledWith({
      variables: { checklistId: 'checklist-1', key: 'laptop', done: true },
    });
    expect(await screen.findByText('Task ticked off')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('reopens a finished task', async () => {
    renderWithProviders(<OnboardingPage />);

    await userEvent.click(screen.getByRole('checkbox', email));

    expect(gql.tick).toHaveBeenCalledWith({
      variables: { checklistId: 'checklist-1', key: 'email', done: false },
    });
    expect(await screen.findByText('Task reopened')).toBeInTheDocument();
  });

  it('locks the card while a request is in flight', async () => {
    let finish: (value: unknown) => void = () => undefined;
    gql.provision.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderWithProviders(<OnboardingPage />);

    await userEvent.click(screen.getByRole('button', provisionButton));

    expect(gql.provision).toHaveBeenCalledWith({ variables: { employeeId: 'emp-1' } });
    expect(screen.getByRole('checkbox', laptop)).toBeDisabled();
    expect(screen.getByRole('button', provisionButton)).toBeDisabled();
    finish({ data: {} });
    expect(
      await screen.findByText('Access requested — carry it out in Access Management'),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('checkbox', laptop)).toBeEnabled());
  });

  it('shows why an action failed and does not refresh', async () => {
    gql.tick.mockRejectedValueOnce(new Error('Checklist is closed'));
    renderWithProviders(<OnboardingPage />);

    await userEvent.click(screen.getByRole('checkbox', laptop));

    expect(await screen.findByText('Checklist is closed')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('cannot request applications when none are missing', () => {
    gql.onboarding.mockReturnValue(answer([joinerRow({ missingApplications: [] })]));
    renderWithProviders(<OnboardingPage />);

    expect(screen.getByRole('button', provisionButton)).toBeDisabled();
  });
});
