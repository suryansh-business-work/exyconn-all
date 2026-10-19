import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhoneCallPanel } from '../../../src/components/PhoneCallPanel';
import type { CallPhase } from '../../../src/call/transcript';
import { renderWithProviders } from '../test-utils';

const mocks = vi.hoisted(() => ({
  hook: vi.fn(),
  visitor: null as { phone?: string | null } | null,
  start: vi.fn(),
  reset: vi.fn(),
}));
vi.mock('../../../src/call/usePhoneCall', () => ({ usePhoneCall: mocks.hook }));
vi.mock('@exyconn/demo-visitor', () => ({ useVisitor: () => ({ visitor: mocks.visitor }) }));

function serve(phase: CallPhase, error: string | null = null) {
  mocks.hook.mockReturnValue({
    phase,
    lines: [],
    error,
    startedAt: null,
    start: mocks.start,
    reset: mocks.reset,
  });
}

describe('the phone call card', () => {
  afterEach(() => {
    vi.clearAllMocks();
    mocks.visitor = null;
  });

  it("offers the visitor's own number when it is in E.164, and rings it", async () => {
    mocks.visitor = { phone: '+919876543210' };
    serve('idle');
    renderWithProviders(<PhoneCallPanel scenarioId="s1" />);
    expect(mocks.hook).toHaveBeenCalledWith('s1');
    expect(screen.getByRole('textbox', { name: 'Your phone number' })).toHaveValue(
      '+919876543210',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Call me' }));
    expect(mocks.start).toHaveBeenCalledWith('+919876543210');
  });

  it('leaves the number empty when the visitor has none in E.164', () => {
    mocks.visitor = { phone: '98765 43210' };
    serve('idle');
    renderWithProviders(<PhoneCallPanel scenarioId={null} />);
    expect(screen.getByRole('textbox', { name: 'Your phone number' })).toHaveValue('');
  });

  it('hides the form during a call', () => {
    serve('live');
    renderWithProviders(<PhoneCallPanel scenarioId={null} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Call again' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('On the call');
  });

  it('shows why a call ended and offers to call again', async () => {
    serve('ended', 'Phone call busy');
    renderWithProviders(<PhoneCallPanel scenarioId={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Phone call busy');
    await userEvent.click(screen.getByRole('button', { name: 'Call again' }));
    expect(mocks.reset).toHaveBeenCalled();
  });
});
