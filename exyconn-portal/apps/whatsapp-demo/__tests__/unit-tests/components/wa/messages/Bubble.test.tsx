import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { MessageStatus } from '@exyconn/wa-flow';
import { Bubble } from '../../../../../src/components/wa/messages/Bubble';
import { Ticks } from '../../../../../src/components/wa/messages/Ticks';
import { renderWithProviders } from '../../../test-utils';

describe('Bubble', () => {
  it("shows the message and the time, with no ticks on the bot's own bubble", () => {
    renderWithProviders(
      <Bubble mine={false} tail={false} time="9:41 AM">
        Hello
      </Bubble>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('9:41 AM')).toBeInTheDocument();
    expect(screen.queryByTitle('Sent')).not.toBeInTheDocument();
  });

  it('shows the ticks on a message with a status', () => {
    renderWithProviders(
      <Bubble mine tail={false} time="9:41 AM" status="read">
        Hi
      </Bubble>,
    );
    expect(screen.getByTitle('Read')).toBeInTheDocument();
  });

  it('draws the tail on the left for the bot and on the right for the viewer', () => {
    const bot = renderWithProviders(
      <Bubble mine={false} tail time="9:41 AM">
        Bot
      </Bubble>,
    );
    expect(bot.container.querySelector('path')?.getAttribute('d')).toMatch(/^M8 0H1\.5/);
    bot.unmount();
    const mine = renderWithProviders(
      <Bubble mine tail time="9:41 AM">
        Mine
      </Bubble>,
    );
    expect(mine.container.querySelector('path')?.getAttribute('d')).toMatch(/^M0 0h6\.5/);
  });

  it('has no tail inside a run', () => {
    const { container } = renderWithProviders(
      <Bubble mine={false} tail={false} time="9:41 AM" flush width="300px">
        Card
      </Bubble>,
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('Ticks', () => {
  it.each<[MessageStatus, string, string]>([
    ['sent', 'Sent', 'DoneIcon'],
    ['delivered', 'Delivered', 'DoneAllIcon'],
    ['read', 'Read', 'DoneAllIcon'],
  ])('shows %s as %s', (status, label, icon) => {
    renderWithProviders(<Ticks status={status} />);
    expect(screen.getByTitle(label)).toBeInTheDocument();
    expect(screen.getByTestId(icon)).toBeInTheDocument();
  });

  it("names the status in the viewer's language", () => {
    renderWithProviders(<Ticks status="read" />, { messages: { Read: 'Leído' } });
    expect(screen.getByTitle('Leído')).toBeInTheDocument();
  });
});
