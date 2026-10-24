import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerBuildSettingsDocument } from '@exyconn/shell/graphql/generated';
import { BuildRetentionForm } from '../../../../../../src/pages/builds/forms/build-retention';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ save: vi.fn(), options: vi.fn(), notify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveTrackerBuildRetentionMutation: (options: unknown) => {
    gql.options(options);
    return [gql.save];
  },
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => gql.notify,
}));

const field = () => screen.getByLabelText(/^Builds to keep\s*\*?$/);
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));
const type = (value: string) => fireEvent.change(field(), { target: { value } });

describe('BuildRetentionForm', () => {
  beforeEach(() => {
    gql.save.mockReset().mockResolvedValue({ data: {} });
    gql.options.mockReset();
    gql.notify.mockReset();
  });

  it('starts from the stored count and re-reads the settings after a save', async () => {
    renderWithProviders(<BuildRetentionForm keepLatestBuilds={6} />);
    expect(field()).toHaveValue(6);
    expect(gql.options).toHaveBeenCalledWith({ refetchQueries: [TrackerBuildSettingsDocument] });
    type('10');
    await save();
    await waitFor(() =>
      expect(gql.save).toHaveBeenCalledWith({ variables: { keepLatestBuilds: 10 } }),
    );
    expect(gql.notify).toHaveBeenCalledWith('Build retention saved', 'success');
  });

  it.each([
    ['-1', 'Enter 0 or more'],
    ['501', 'Keep at most 500 builds'],
    ['2.5', 'Enter a whole number'],
  ])('refuses %s', async (value, message) => {
    renderWithProviders(<BuildRetentionForm keepLatestBuilds={0} />);
    type(value);
    await save();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('reports a refused save', async () => {
    gql.save.mockRejectedValueOnce(new Error('Forbidden')).mockRejectedValueOnce({});
    renderWithProviders(<BuildRetentionForm keepLatestBuilds={3} />);
    await save();
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Forbidden', 'error'));
    await save();
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith('Could not save the build retention', 'error'),
    );
  });

  it('puts the stored count back on Cancel', async () => {
    renderWithProviders(<BuildRetentionForm keepLatestBuilds={3} />);
    type('9');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(field()).toHaveValue(3);
  });
});
