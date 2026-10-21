import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { LoadError } from '../../../src/lib/LoadError';
import { PageLinks } from '../../../src/lib/PageLinks';
import { EvidenceQuotes } from '../../../src/lib/EvidenceQuotes';
import { useRunNotified } from '../../../src/lib/useRunNotified';
import { renderWithProviders } from '../test-utils';

describe('LoadError', () => {
  it("shows the server's message and asks again on Retry", async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoadError message="Not allowed" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('logs a retry that fails again rather than dropping it', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('still down');
    renderWithProviders(<LoadError message="Down" onRetry={() => Promise.reject(failure)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Meeting Assistant retry failed', failure),
    );
  });
});

describe('PageLinks', () => {
  it('links to each screen', () => {
    renderWithProviders(<PageLinks links={[{ label: 'Open meetings', to: '/m/meetings' }]} />);
    expect(screen.getByRole('link', { name: 'Open meetings' })).toHaveAttribute(
      'href',
      '/m/meetings',
    );
  });
});

describe('EvidenceQuotes', () => {
  it('quotes each supporting line with who said it and when', () => {
    renderWithProviders(
      <EvidenceQuotes
        evidence={[
          { segmentId: 's1', quote: 'Ship it Friday', startMs: 61_000, speakerLabel: 'Speaker 1' },
          { segmentId: 's2', quote: 'Agreed', startMs: 3_729_000, speakerLabel: null },
        ]}
      />,
    );
    expect(screen.getByText('Ship it Friday')).toBeInTheDocument();
    expect(screen.getByText('Speaker 1 at 1:01')).toBeInTheDocument();
    expect(screen.getByText('Unknown speaker at 1:02:09')).toBeInTheDocument();
  });

  it('says so when there is no supporting quote', () => {
    renderWithProviders(<EvidenceQuotes evidence={[]} />);
    expect(screen.getByText('No supporting quote was recorded.')).toBeInTheDocument();
  });
});

describe('useRunNotified', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it('reports success and resolves true', async () => {
    const { result } = renderHook(() => useRunNotified(), { wrapper });
    let outcome = false;
    await act(async () => {
      outcome = await result.current(() => Promise.resolve(), 'Saved {name}', { name: 'it' });
    });
    expect(outcome).toBe(true);
  });

  it("reports the server's reason and resolves false", async () => {
    const { result } = renderHook(() => useRunNotified(), { wrapper });
    let outcome = true;
    await act(async () => {
      outcome = await result.current(() => Promise.reject(new Error('Forbidden')), 'Saved');
    });
    expect(outcome).toBe(false);
  });
});
