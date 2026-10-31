import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MeetingBotPage } from '../../../src/pages/meeting-bot';
import { INFO, renderWithProviders, tripOf } from '../test-utils';

vi.mock('../../../src/pages/meeting-bot/useMeetingBotDemo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/pages/meeting-bot/useMeetingBotDemo')>()),
  useMeetingBotDemo: () => ({
    info: INFO,
    infoError: null,
    retryInfo: vi.fn(),
    trips: [tripOf()],
    tripsLoading: false,
    tripsError: null,
    retryTrips: vi.fn(),
    sending: false,
    send: vi.fn(),
    callBack: vi.fn(),
  }),
}));
vi.mock('@exyconn/demo-visitor/page', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/demo-visitor/page')>()),
  DemoHeader: ({ current }: Readonly<{ current: string }>) => <header>{current}</header>,
  DemoFooter: () => <footer>Footer</footer>,
  DemoCtaBand: ({ title }: Readonly<{ title: string }>) => <aside>{title}</aside>,
}));

describe('the meeting bot demo page', () => {
  it('lays out the send panel, the visitor’s calls, the steps and the questions', () => {
    renderWithProviders(<MeetingBotPage />);
    expect(screen.getByRole('banner')).toHaveTextContent('meeting-bot-demo');
    expect(
      screen.getByRole('heading', { level: 1, name: /Notes, decisions and action items/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Send the notetaker to your call' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your calls' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'abc-defg-hij' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How to try it' })).toBeInTheDocument();
    expect(screen.getByText('Does it work with Zoom or Teams?')).toBeInTheDocument();
    expect(screen.getByText('Want a notetaker for your team?')).toBeInTheDocument();
  });
});
