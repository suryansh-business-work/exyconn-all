import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useColorScheme } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { RootErrorBoundary } from '../../../../src/components/shell/RootErrorBoundary';
import { logger } from '../../../../src/tracker/logger';

vi.mock('../../../../src/tracker/logger', () => ({ logger: { capture: vi.fn() } }));

describe('RootErrorBoundary', () => {
  it('says what happened and reports it to Tech > Logs', () => {
    const error = new Error('Provider exploded');
    render(<RootErrorBoundary error={error} retry={vi.fn(() => Promise.resolve())} />);
    expect(screen.getByText('The app hit a problem')).toBeInTheDocument();
    expect(screen.getByText('It has been reported to the Exyconn tech team.')).toBeInTheDocument();
    expect(screen.getByText('Provider exploded')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The app hit a problem' })).toBeInTheDocument();
    expect(logger.capture).toHaveBeenCalledWith(error, { context: { boundary: 'root' } });
  });

  it('tries the app again on request', () => {
    const retry = vi.fn(() => Promise.resolve());
    render(<RootErrorBoundary error={new Error('Boom')} retry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('reports a retry that fails as well', async () => {
    const cause = new Error('Still broken');
    render(<RootErrorBoundary error={new Error('Boom')} retry={() => Promise.reject(cause)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(logger.capture).toHaveBeenCalledWith(cause));
  });

  it('renders on the dark chrome too, outside every provider', () => {
    vi.mocked(useColorScheme).mockReturnValue('dark');
    render(<RootErrorBoundary error={new Error('Dark')} retry={vi.fn(() => Promise.resolve())} />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });
});
