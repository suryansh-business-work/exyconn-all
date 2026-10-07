import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScreenErrorBoundary } from '../../../../src/components/shell/ScreenErrorBoundary';
import { logger } from '../../../../src/tracker/logger';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/tracker/logger', () => ({ logger: { capture: vi.fn() } }));

describe('ScreenErrorBoundary', () => {
  it('keeps the app open, says what happened and reports it', () => {
    const error = new Error('Chart failed');
    renderWithProviders(
      <ScreenErrorBoundary error={error} retry={vi.fn(() => Promise.resolve())} />,
    );
    expect(screen.getByText('This screen hit a problem')).toBeInTheDocument();
    expect(screen.getByText('It has been reported to the Exyconn tech team.')).toBeInTheDocument();
    expect(screen.getByText('Chart failed')).toBeInTheDocument();
    expect(logger.capture).toHaveBeenCalledWith(error, { context: { boundary: 'screen' } });
  });

  it('tries the screen again on request', () => {
    const retry = vi.fn(() => Promise.resolve());
    renderWithProviders(<ScreenErrorBoundary error={new Error('Boom')} retry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('reports a retry that fails as well', async () => {
    const cause = new Error('Still broken');
    renderWithProviders(
      <ScreenErrorBoundary error={new Error('Boom')} retry={() => Promise.reject(cause)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(logger.capture).toHaveBeenCalledWith(cause));
  });
});
