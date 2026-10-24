import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { inSequence } from '@exyconn/shell/utils/inSequence';
import { TrackerPlatform, TrackerVersionBump } from '@exyconn/shell/graphql/generated';
import { StartBuildForm } from '../../../../../../src/pages/builds/forms/start-build';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ start: vi.fn(), notify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useStartTrackerBuildMutation: () => [gql.start],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => gql.notify,
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (channelCount = 2) =>
  renderWithProviders(
    <StartBuildForm channelCount={channelCount} onDone={onDone} onCancel={onCancel} />,
  );

async function pick(...labels: string[]) {
  await userEvent.click(screen.getByRole('combobox', { name: /Installers to build/ }));
  const listbox = screen.getByRole('listbox');
  // One option after another, as a person ticks them.
  await inSequence(labels, (label) =>
    userEvent.click(within(listbox).getByRole('option', { name: label })),
  );
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

const clickStart = () => userEvent.click(screen.getByRole('button', { name: 'Start build' }));

describe('StartBuildForm', () => {
  beforeEach(() => {
    gql.start.mockReset().mockResolvedValue({ data: {} });
    gql.notify.mockReset();
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('names how many Slack channels will hear about the build', () => {
    const { unmount } = renderForm(2);
    expect(
      screen.getByText(/posted to the 2 Slack channels chosen in Settings/),
    ).toBeInTheDocument();
    unmount();
    renderForm(1);
    expect(
      screen.getByText(/posted to the 1 Slack channel chosen in Settings/),
    ).toBeInTheDocument();
  });

  it('starts from the default branch and explains the phone builds', () => {
    renderForm();
    expect(screen.getByLabelText(/^Branch\s*\*?$/)).toHaveValue('main');
    expect(screen.getByText(/Android produces an APK/)).toBeInTheDocument();
  });

  it('refuses a build that would produce no installer', async () => {
    renderForm();
    await clickStart();
    expect(await screen.findByText('Choose at least one installer to build')).toBeInTheDocument();
    expect(gql.start).not.toHaveBeenCalled();
  });

  it('requires a branch to build from', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/^Branch\s*\*?$/), { target: { value: '   ' } });
    await clickStart();
    expect(await screen.findByText('Branch is required')).toBeInTheDocument();
  });

  it('starts one installer and says so', async () => {
    renderForm();
    await pick('iOS — Unsigned app (.ipa)');
    await clickStart();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.start).toHaveBeenCalledWith({
      variables: { platforms: [TrackerPlatform.Ios], bump: TrackerVersionBump.Patch, ref: 'main' },
    });
    expect(gql.notify).toHaveBeenCalledWith(
      'Build started for {count} installer on {ref}',
      'success',
      {
        count: 1,
        ref: 'main',
      },
    );
  });

  it('starts several installers off a chosen branch', async () => {
    renderForm();
    await pick('Windows — Installer (.exe)', 'Android — App package (.apk) + Play bundle (.aab)');
    fireEvent.change(screen.getByLabelText(/^Branch\s*\*?$/), { target: { value: ' staging ' } });
    await clickStart();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.start).toHaveBeenCalledWith({
      variables: {
        platforms: [TrackerPlatform.Windows, TrackerPlatform.Android],
        bump: TrackerVersionBump.Patch,
        ref: 'staging',
      },
    });
    expect(gql.notify).toHaveBeenCalledWith(
      'Build started for {count} installers on {ref}',
      'success',
      {
        count: 2,
        ref: 'staging',
      },
    );
  });

  it('raises the chosen part of the version', async () => {
    renderForm();
    await pick('Windows — Installer (.exe)');
    await userEvent.click(screen.getByRole('combobox', { name: /Version/ }));
    await userEvent.click(screen.getByRole('option', { name: /Major/ }));
    await clickStart();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.start).toHaveBeenCalledWith({
      variables: { platforms: [TrackerPlatform.Windows], bump: TrackerVersionBump.Major, ref: 'main' },
    });
  });

  it('reports a build GitHub refuses and stays open', async () => {
    gql.start.mockRejectedValueOnce(new Error('Workflow not found')).mockRejectedValueOnce({});
    renderForm();
    await pick('Linux — Portable app (.AppImage)');
    await clickStart();
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Workflow not found', 'error'));
    await clickStart();
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith('Could not start the build', 'error'),
    );
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
