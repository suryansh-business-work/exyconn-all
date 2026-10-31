import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaBotSource,
  MaBotStatus,
  MaScope,
  useMaBotDispatchesQuery,
  useMaCancelBotMutation,
  useMaSendBotMutation,
  type MaBotDispatchFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { BotTrips } from '../../../src/bot/BotTrips';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaBotDispatchesQuery: vi.fn(),
  useMaSendBotMutation: vi.fn(),
  useMaCancelBotMutation: vi.fn(),
}));

const run = { send: vi.fn(), cancel: vi.fn() };
const BASE = '/ai/meeting-assistant';

function trip(patch: Partial<MaBotDispatchFieldsFragment> = {}): MaBotDispatchFieldsFragment {
  return {
    id: 't1',
    ownerName: 'Asha Rao',
    meetingCode: 'abc-defg-hij',
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    title: 'Weekly sync',
    source: MaBotSource.Manual,
    status: MaBotStatus.InCall,
    meetingId: 'm1',
    error: '',
    joinAt: '2026-10-31T10:00:00.000Z',
    createdAt: '2026-10-31T09:59:00.000Z',
    finishedAt: null,
    ...patch,
  };
}

const TRIPS = [
  trip(),
  trip({
    id: 't2',
    title: '',
    meetingCode: 'xyz-wxyz-xyz',
    status: MaBotStatus.Failed,
    meetingId: null,
    error: 'The bot was not let into the call.',
    finishedAt: '2026-10-31T10:10:00.000Z',
  }),
  trip({ id: 't3', title: 'Standup', status: MaBotStatus.Queued, meetingId: null }),
];

beforeEach(() => {
  run.send.mockResolvedValue({});
  run.cancel.mockResolvedValue({});
  vi.mocked(useMaBotDispatchesQuery).mockReturnValue(
    queryResult({ maBotDispatches: TRIPS }) as never,
  );
  vi.mocked(useMaSendBotMutation).mockReturnValue(mutationTuple(run.send) as never);
  vi.mocked(useMaCancelBotMutation).mockReturnValue(mutationTuple(run.cancel) as never);
});

describe('BotTrips', () => {
  it("lists the viewer's trips with their status, the meeting they recorded or why they failed", () => {
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);

    expect(vi.mocked(useMaBotDispatchesQuery).mock.lastCall?.[0]?.variables).toEqual({
      scope: MaScope.Mine,
    });
    expect(screen.getByText('Weekly sync')).toBeInTheDocument();
    expect(screen.getByText('xyz-wxyz-xyz')).toBeInTheDocument();
    expect(screen.getByText('The bot was not let into the call.')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      `${BASE}/meetings/m1`,
    );
    expect(screen.queryByText('Owner')).not.toBeInTheDocument();
    // The failed trip is over: only the live and queued ones can be called back.
    expect(screen.getAllByRole('button', { name: 'Call the bot back' })).toHaveLength(2);
  });

  it("shows whose trip each is on the company's list", () => {
    renderWithProviders(<BotTrips scope="ALL" basePath={BASE} />);

    expect(vi.mocked(useMaBotDispatchesQuery).mock.lastCall?.[0]?.variables).toEqual({
      scope: MaScope.All,
    });
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getAllByText('Asha Rao').length).toBeGreaterThan(0);
  });

  it('sends the bot to a pasted Meet link, without a title when none is given, and clears the form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);
    const link = screen.getByRole('textbox', { name: /Google Meet link/ });

    await user.type(link, 'https://meet.google.com/abc-defg-hij');
    await user.click(screen.getByRole('button', { name: 'Send bot' }));

    expect(run.send).toHaveBeenCalledWith({
      variables: { meetUrl: 'https://meet.google.com/abc-defg-hij', title: null },
      refetchQueries: ['MaBotDispatches'],
    });
    expect(await screen.findByText('The bot is on its way to the call')).toBeInTheDocument();
    expect(link).toHaveValue('');
  });

  it('sends the title when one is given', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);

    await user.type(
      screen.getByRole('textbox', { name: /Google Meet link/ }),
      'https://meet.google.com/abc-defg-hij',
    );
    await user.type(screen.getByRole('textbox', { name: /Meeting title/ }), 'Client review');
    await user.click(screen.getByRole('button', { name: 'Send bot' }));

    expect(run.send).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { meetUrl: 'https://meet.google.com/abc-defg-hij', title: 'Client review' },
      }),
    );
  });

  it('refuses a link that is not a Google Meet call, and an empty one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);

    await user.click(screen.getByRole('button', { name: 'Send bot' }));
    expect(await screen.findByText('Paste the Google Meet link')).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: /Google Meet link/ }),
      'https://zoom.us/j/123',
    );
    await user.click(screen.getByRole('button', { name: 'Send bot' }));
    expect(
      await screen.findByText('Use a Google Meet link, like https://meet.google.com/abc-defg-hij'),
    ).toBeInTheDocument();
    expect(run.send).not.toHaveBeenCalled();
  });

  it("keeps the link when the server refuses, and shows the server's reason", async () => {
    const user = userEvent.setup();
    run.send.mockRejectedValue(new Error('The bot is already on its way to this call.'));
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);
    const link = screen.getByRole('textbox', { name: /Google Meet link/ });

    await user.type(link, 'https://meet.google.com/abc-defg-hij');
    await user.click(screen.getByRole('button', { name: 'Send bot' }));

    expect(
      await screen.findByText('The bot is already on its way to this call.'),
    ).toBeInTheDocument();
    expect(link).toHaveValue('https://meet.google.com/abc-defg-hij');
  });

  it('clears what was typed on Cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);
    const link = screen.getByRole('textbox', { name: /Google Meet link/ });

    await user.type(link, 'https://meet.google.com/abc');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(link).toHaveValue('');
  });

  it('calls a bot back after a destructive confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);

    await user.click(screen.getAllByRole('button', { name: 'Call the bot back' })[0]);
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('The bot leaves abc-defg-hij; what it recorded so far is kept.'),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Call back' }));

    expect(run.cancel).toHaveBeenCalledWith({
      variables: { id: 't1' },
      refetchQueries: ['MaBotDispatches'],
    });
    expect(await screen.findByText('The bot was called back')).toBeInTheDocument();
  });

  it('leaves the bot in the call when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);

    await user.click(screen.getAllByRole('button', { name: 'Call the bot back' })[0]);
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );

    expect(run.cancel).not.toHaveBeenCalled();
  });

  it('reloads the trips on Refresh', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaBotDispatchesQuery).mockReturnValue(
      queryResult({ maBotDispatches: TRIPS }, { refetch }) as never,
    );
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);

    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));

    expect(refetch).toHaveBeenCalled();
  });

  it('says when the bot has not been sent yet', () => {
    vi.mocked(useMaBotDispatchesQuery).mockReturnValue(
      queryResult({ maBotDispatches: [] }) as never,
    );
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);

    expect(screen.getByText('The bot has not been sent into a call yet.')).toBeInTheDocument();
  });

  it('shows why the trips could not be loaded, and retries', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaBotDispatchesQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Network down'), refetch }) as never,
    );
    renderWithProviders(<BotTrips scope="MINE" basePath={BASE} />);

    expect(screen.getByText('Network down')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });
});
