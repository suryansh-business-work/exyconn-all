import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerSettingsForm } from '../../../../../../src/pages/tracker/forms/tracker-settings';
import { renderWithProviders } from '../../../../test-utils';
import { settingsRow } from '../../tracker.fixtures';
import { POLICIES, field } from './settings.harness';

const gql = vi.hoisted(() => ({ policies: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateTrackerSettingsMutation: () => [vi.fn()],
  useMyPoliciesQuery: gql.policies,
}));
vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) =>
  (await import('./settings.harness')).rhfModuleMock(importOriginal),
);

const NIGHT_SHIFT = 'This window runs past midnight — a night shift.';
const OWN_CLOCK = "Read on each employee's own clock.";
const CONSENT = 'Consent disclosure (shown in the desktop app)';
const policySelect = () => screen.getByRole('combobox', { name: /Tracking disclosure policy/ });

describe('Tracker settings sections', () => {
  beforeEach(() => {
    gql.policies.mockReset().mockReturnValue({ data: { myPolicies: POLICIES } });
  });

  it('says captures stay announced when the shutter sound is switched off', async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    expect(screen.getByText(/plays a camera shutter/)).toBeInTheDocument();
    await userEvent.click(field('Play a sound with each screenshot'));
    expect(screen.getByText(/Captures are silent on every device\./)).toBeInTheDocument();
    expect(screen.queryByText(/plays a camera shutter/)).not.toBeInTheDocument();
  });

  it('hides the tracking window until the schedule is switched on', async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    expect(screen.queryByLabelText('Start at')).not.toBeInTheDocument();
    await userEvent.click(field('Start tracking automatically'));
    expect(field('Start at')).toHaveValue('9');
    expect(field('Stop at')).toHaveValue('18');
    expect(screen.getByText(OWN_CLOCK)).toBeInTheDocument();
  });

  it('calls out a window that runs past midnight, including an empty one', () => {
    renderWithProviders(
      <TrackerSettingsForm initial={settingsRow({ autoStartEnabled: true, autoStartHour: 22 })} />,
    );
    expect(screen.getByText(NIGHT_SHIFT)).toBeInTheDocument();
    fireEvent.change(field('Start at'), { target: { value: '8' } });
    expect(screen.getByText(OWN_CLOCK)).toBeInTheDocument();
    fireEvent.change(field('Stop at'), { target: { value: '8' } });
    expect(screen.getByText(NIGHT_SHIFT)).toBeInTheDocument();
  });

  it('hides the send hour until a daily or weekly digest is on', async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    expect(screen.queryByLabelText('Send at')).not.toBeInTheDocument();
    await userEvent.click(field('Email a weekly summary (Mondays)'));
    expect(field('Send at')).toHaveValue('9');
    expect(screen.getByText('Read in the workspace timezone, not UTC.')).toBeInTheDocument();
    await userEvent.click(field('Email a weekly summary (Mondays)'));
    expect(screen.queryByLabelText('Send at')).not.toBeInTheDocument();
    await userEvent.click(field('Email a daily summary'));
    expect(field('Send at')).toBeInTheDocument();
  });

  it("offers Legal's policies, marking the ones that are signed, and the text fallback", async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    expect(field(CONSENT)).toHaveValue('<p>We track activity during work hours.</p>');
    await userEvent.click(policySelect());
    const options = within(screen.getByRole('listbox'))
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(options).toEqual([
      'No policy — use the text below',
      'Code of conduct (signed)',
      'Privacy notice',
    ]);
  });

  it('drops the free-text disclosure once a Legal policy is chosen', async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    await userEvent.click(policySelect());
    await userEvent.click(screen.getByRole('option', { name: 'Privacy notice' }));
    await waitFor(() => expect(screen.queryByLabelText(CONSENT)).not.toBeInTheDocument());
  });

  it('opens on the saved policy without the free-text box', () => {
    renderWithProviders(
      <TrackerSettingsForm initial={settingsRow({ consentPolicySlug: 'code-of-conduct' })} />,
    );
    expect(policySelect()).toHaveTextContent('Code of conduct (signed)');
    expect(screen.queryByLabelText(CONSENT)).not.toBeInTheDocument();
  });

  it('still offers the text fallback while the policies load', async () => {
    gql.policies.mockReturnValue({ data: undefined });
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    expect(field(CONSENT)).toBeInTheDocument();
    await userEvent.click(policySelect());
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['No policy — use the text below']);
  });
});
