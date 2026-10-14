import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { QueryErrorState } from '../../../../src/admin/shared/QueryErrorState';
import { renderWithProviders } from '../../test-utils';

const logger = vi.hoisted(() => ({
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: logger }));

afterEach(() => {
  vi.clearAllMocks();
});

describe('QueryErrorState', () => {
  it('shows the refusal screen when the server answered FORBIDDEN', () => {
    const forbidden = new CombinedGraphQLErrors({
      errors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }],
    });
    renderWithProviders(
      <QueryErrorState error={forbidden} title="Could not load the analytics." onRetry={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: 'Admins only' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('says what failed and why, translated', () => {
    renderWithProviders(
      <QueryErrorState
        error={new Error('Network down')}
        title="Could not load the analytics."
        onRetry={vi.fn()}
      />,
      { messages: { 'Could not load the analytics.': 'Analytics unavailable.' } },
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Analytics unavailable. Network down');
  });

  it('falls back to a generic reason for an error without a message', () => {
    renderWithProviders(
      <QueryErrorState error="boom" title="Could not load the session." onRetry={vi.fn()} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the session. The server did not answer.',
    );
  });

  it('re-runs the query on Retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn().mockResolvedValue({});
    renderWithProviders(
      <QueryErrorState error={new Error('x')} title="Could not load." onRetry={onRetry} />,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a retry that fails again', async () => {
    const user = userEvent.setup();
    const failure = new Error('still down');
    const onRetry = vi.fn().mockRejectedValue(failure);
    renderWithProviders(
      <QueryErrorState error={new Error('x')} title="Could not load." onRetry={onRetry} />,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('WhatsApp demo admin: retry failed', failure, {
        title: 'Could not load.',
      }),
    );
  });
});
