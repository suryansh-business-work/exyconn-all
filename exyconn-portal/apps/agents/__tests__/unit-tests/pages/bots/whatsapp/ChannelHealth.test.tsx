import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ChannelHealth } from '../../../../../src/pages/bots/whatsapp/ChannelHealth';
import { renderWithProviders } from '../../../test-utils';
import { channelRow } from './whatsapp.fixtures';

describe('ChannelHealth', () => {
  it('names the last problem the server recorded, and when', () => {
    renderWithProviders(
      <ChannelHealth
        channel={channelRow({
          lastProblem: 'Meta signature did not match the App secret',
          lastProblemAt: '2026-10-01T10:00:00.000Z',
          lastInboundAt: '2026-10-01T09:00:00.000Z',
        })}
      />,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/^Last problem, .*2026.*:/);
    expect(status).toHaveTextContent('Meta signature did not match the App secret');
  });

  it('still names a problem whose time was not recorded', () => {
    renderWithProviders(
      <ChannelHealth channel={channelRow({ lastProblem: 'Number switched off' })} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Number switched off');
    expect(screen.getByRole('status')).not.toHaveTextContent('2026');
  });

  it('says messages are arriving, with the time of the last one', () => {
    renderWithProviders(
      <ChannelHealth channel={channelRow({ lastInboundAt: '2026-10-01T09:00:00.000Z' })} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      /^Messages are arriving\. The last one came in .*2026/,
    );
  });

  it('explains what to check before the first message arrives', () => {
    renderWithProviders(<ChannelHealth channel={channelRow()} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      /^No message has reached this server yet\. Send Hi to the number/,
    );
  });
});
