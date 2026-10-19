import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CallingBotTurnRole } from '@exyconn/shell/graphql/generated';
import { BrowserCallPanel } from '../../../src/components/BrowserCallPanel';
import type { CallPhase, TranscriptLine } from '../../../src/call/transcript';
import { renderWithProviders } from '../test-utils';

const call = vi.hoisted(() => ({
  hook: vi.fn(),
  start: vi.fn(),
  hangUp: vi.fn(),
}));
vi.mock('../../../src/call/useBrowserCall', () => ({ useBrowserCall: call.hook }));

function serve(phase: CallPhase, extra: { error?: string | null; lines?: TranscriptLine[] } = {}) {
  call.hook.mockReturnValue({
    phase,
    lines: extra.lines ?? [],
    error: extra.error ?? null,
    startedAt: null,
    start: call.start,
    hangUp: call.hangUp,
  });
}

describe('the browser call on a drawn phone', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('dials the picked example from an idle phone', async () => {
    serve('idle');
    renderWithProviders(<BrowserCallPanel scenarioId="s1" />);
    expect(call.hook).toHaveBeenCalledWith('s1');
    expect(
      screen.getByRole('group', { name: 'Phone call with the AI calling bot' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Exyconn AI assistant' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Ready to call');
    await userEvent.click(screen.getByRole('button', { name: 'Start the call' }));
    expect(call.start).toHaveBeenCalled();
  });

  it.each(['connecting', 'live'] as const)('hangs up while %s', async (phase) => {
    serve(phase, {
      lines: [{ key: 'l1', role: CallingBotTurnRole.Bot, text: 'Hello' }],
    });
    renderWithProviders(<BrowserCallPanel scenarioId={null} />);
    expect(screen.getByRole('region', { name: 'Transcript' })).toHaveTextContent('Hello');
    await userEvent.click(screen.getByRole('button', { name: 'Hang up' }));
    expect(call.hangUp).toHaveBeenCalled();
  });

  it('shows why the call ended', () => {
    serve('ended', { error: 'The call dropped. Try again.' });
    renderWithProviders(<BrowserCallPanel scenarioId={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('The call dropped. Try again.');
    expect(screen.getByRole('button', { name: 'Start the call' })).toBeInTheDocument();
  });
});
