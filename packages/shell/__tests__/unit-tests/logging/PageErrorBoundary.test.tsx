import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageErrorBoundary } from '@/logging/PageErrorBoundary';
import { portalLogger } from '@/logging/portalLogger';

/** A page that crashes while `crash.on` is set, and renders normally once it is cleared. */
const crash = { on: true };

function FlakyPage() {
  if (crash.on) {
    throw new Error('Cannot read the payslip');
  }
  return <p>Payslips</p>;
}

beforeEach(() => {
  crash.on = true;
  // React reports a caught render error on the console; the boundary is what is under test.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the page error boundary', () => {
  it('shows the page when nothing goes wrong', () => {
    crash.on = false;
    render(
      <PageErrorBoundary>
        <FlakyPage />
      </PageErrorBoundary>,
    );

    expect(screen.getByText('Payslips')).toBeInTheDocument();
  });

  it('replaces a crashed page with the reason and reports it with its component stack', () => {
    const capture = vi.spyOn(portalLogger, 'capture').mockImplementation(() => undefined);
    render(
      <PageErrorBoundary>
        <FlakyPage />
      </PageErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'This page hit a problem' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot read the payslip');
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cannot read the payslip' }),
      expect.objectContaining({ componentStack: expect.stringContaining('FlakyPage') }),
    );
  });

  it('renders the page again on retry', async () => {
    vi.spyOn(portalLogger, 'capture').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(
      <PageErrorBoundary>
        <FlakyPage />
      </PageErrorBoundary>,
    );

    crash.on = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Payslips')).toBeInTheDocument();
    expect(screen.queryByText('This page hit a problem')).not.toBeInTheDocument();
  });
});
