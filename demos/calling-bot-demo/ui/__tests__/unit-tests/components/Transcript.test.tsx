import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CallingBotTurnRole } from '@exyconn/shell/graphql/generated';
import { Transcript } from '../../../src/components/Transcript';
import { renderWithProviders } from '../test-utils';

const LINES = [
  { key: 'l1', role: CallingBotTurnRole.Bot, text: 'Hello, how can I help?' },
  { key: 'l2', role: CallingBotTurnRole.Caller, text: 'Book a visit' },
];

describe('the transcript', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('says where the words will appear before anything is said', () => {
    renderWithProviders(<Transcript lines={[]} />);
    expect(screen.getByText('What you and the bot say appears here.')).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('lists who said what in a keyboard-scrollable live region', () => {
    renderWithProviders(<Transcript lines={LINES} />);
    const region = screen.getByRole('region', { name: 'Transcript' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(within(region).getByRole('list')).toHaveAttribute('aria-live', 'polite');
    const [bot, caller] = within(region).getAllByRole('listitem');
    expect(bot).toHaveTextContent('BotHello, how can I help?');
    expect(caller).toHaveTextContent('YouBook a visit');
  });

  it('scrolls to the newest line as lines arrive, filling the phone screen', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { rerender } = renderWithProviders(<Transcript lines={LINES.slice(0, 1)} fill />);
    rerender(<Transcript lines={LINES} fill />);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
  });
});
