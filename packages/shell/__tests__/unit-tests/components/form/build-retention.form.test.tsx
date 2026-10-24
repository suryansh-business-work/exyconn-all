import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildRetentionForm, MAX_KEEP_LATEST_BUILDS } from '@/components/form/build-retention';
import { renderWithProviders } from '../../test-utils';

const state = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock('@/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => state.notify,
}));

const save = vi.fn();
const field = () => screen.getByLabelText(/^Builds to keep\s*\*?$/);
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));
const type = (value: string) => fireEvent.change(field(), { target: { value } });

describe('BuildRetentionForm', () => {
  beforeEach(() => {
    save.mockReset().mockResolvedValue(undefined);
    state.notify.mockReset();
  });

  it('starts from the stored count and saves a new one', async () => {
    renderWithProviders(<BuildRetentionForm keepLatestBuilds={6} save={save} />);
    expect(field()).toHaveValue(6);
    type('10');
    await submit();
    await waitFor(() => expect(save).toHaveBeenCalledWith(10));
    expect(state.notify).toHaveBeenCalledWith('Build retention saved', 'success');
  });

  it('allows as many builds as the server does', () => {
    expect(MAX_KEEP_LATEST_BUILDS).toBe(500);
  });

  it.each([
    ['-1', 'Enter 0 or more'],
    ['501', 'Keep at most 500 builds'],
    ['2.5', 'Enter a whole number'],
  ])('refuses %s', async (value, message) => {
    renderWithProviders(<BuildRetentionForm keepLatestBuilds={0} save={save} />);
    type(value);
    await submit();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it('reports a refused save', async () => {
    save.mockRejectedValueOnce(new Error('Forbidden')).mockRejectedValueOnce({});
    renderWithProviders(<BuildRetentionForm keepLatestBuilds={3} save={save} />);
    await submit();
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith('Forbidden', 'error'));
    await submit();
    await waitFor(() =>
      expect(state.notify).toHaveBeenCalledWith('Could not save the build retention', 'error'),
    );
  });

  it('puts the stored count back on Cancel', async () => {
    renderWithProviders(<BuildRetentionForm keepLatestBuilds={3} save={save} />);
    type('9');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(field()).toHaveValue(3);
  });
});
