import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCrudResource, type UseCrudResourceOptions } from '../../../src/page/useCrudResource';
import { renderHookWithProviders } from '../test-utils';

interface Lead {
  id: string;
  name: string;
}

const lead: Lead = { id: 'l1', name: 'Acme' };

const options = (overrides: Partial<UseCrudResourceOptions<Lead>> = {}) => ({
  label: 'Lead',
  onDelete: vi.fn(() => Promise.resolve(true)),
  confirmMessage: () => 'Delete this lead?',
  ...overrides,
});

/** Starts a delete, answers the confirm dialog with `button`, and waits for the flow to end. */
async function removeAnswering(opts: UseCrudResourceOptions<Lead>, button: 'Delete' | 'Cancel') {
  const rendered = renderHookWithProviders(() => useCrudResource<Lead>(opts));
  let pending: Promise<void> = Promise.resolve();
  act(() => {
    pending = rendered.result.current.remove(lead);
  });
  // Read before answering: the dialog clears its copy as it closes.
  const prompt = (await screen.findByRole('dialog')).textContent;
  await userEvent.click(screen.getByRole('button', { name: button }));
  await act(async () => {
    await pending;
  });
  return { ...rendered, prompt };
}

describe('useCrudResource remove', () => {
  it('asks first, then deletes, reloads and says so', async () => {
    const opts = options({ refetch: vi.fn(() => Promise.resolve()) });
    const { result, prompt } = await removeAnswering(opts, 'Delete');
    expect(prompt).toContain('Delete this lead?');
    expect(opts.onDelete).toHaveBeenCalledWith(lead);
    expect(opts.refetch).toHaveBeenCalledTimes(1);
    expect(result.current.refreshSignal).toBe(1);
    expect(await screen.findByRole('alert')).toHaveTextContent('Lead deleted');
  });

  it('fills a templated prompt with the values for the record', async () => {
    const opts = options({
      confirmMessage: (row) => ({ message: 'Delete "{name}"?', values: { name: row.name } }),
    });
    const { prompt } = await removeAnswering(opts, 'Delete');
    expect(prompt).toContain('Delete "Acme"?');
  });

  it('does nothing when the confirm is cancelled', async () => {
    const opts = options();
    const { result } = await removeAnswering(opts, 'Cancel');
    expect(opts.onDelete).not.toHaveBeenCalled();
    expect(result.current.refreshSignal).toBe(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reports a failed delete and does not reload', async () => {
    const opts = options({ onDelete: vi.fn(() => Promise.reject(new Error('Lead is in use'))) });
    const { result } = await removeAnswering(opts, 'Delete');
    expect(await screen.findByRole('alert')).toHaveTextContent('Lead is in use');
    expect(result.current.refreshSignal).toBe(0);
  });

  it('reports a delete failure that is not an Error with a general message', async () => {
    const notAnError: unknown = 'offline';
    const opts = options({ onDelete: vi.fn(() => Promise.reject(notAnError)) });
    await removeAnswering(opts, 'Delete');
    expect(await screen.findByRole('alert')).toHaveTextContent('Delete failed');
  });
});
