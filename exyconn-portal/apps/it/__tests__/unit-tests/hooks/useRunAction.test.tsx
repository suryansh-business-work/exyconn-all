import { describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useRunAction } from '../../../src/hooks/useRunAction';
import { toast } from '../core/form.helpers';
import { renderHookWithProviders } from '../test-utils';

describe('useRunAction', () => {
  it('runs the action, says it worked and refreshes', async () => {
    const refresh = vi.fn();
    const action = vi.fn().mockResolvedValue({ data: {} });
    const { result } = renderHookWithProviders(() => useRunAction(refresh));

    await act(() => result.current(action, 'Marked as done'));

    expect(action).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await toast()).toHaveTextContent('Marked as done');
  });

  it('shows why a failed action failed and leaves the data alone', async () => {
    const refresh = vi.fn();
    const { result } = renderHookWithProviders(() => useRunAction(refresh));

    const action = vi.fn().mockRejectedValue(new Error('Already revoked'));

    await act(() => result.current(action, 'Access revoked'));

    expect(refresh).not.toHaveBeenCalled();
    expect(await toast()).toHaveTextContent('Already revoked');
  });

  it('falls back to a plain message when the failure carries none', async () => {
    const refresh = vi.fn();
    const { result } = renderHookWithProviders(() => useRunAction(refresh));

    const action = vi.fn().mockRejectedValue('offline');

    await act(() => result.current(action, 'Done'));

    expect(refresh).not.toHaveBeenCalled();
    expect(await toast()).toHaveTextContent('That did not work');
  });
});
