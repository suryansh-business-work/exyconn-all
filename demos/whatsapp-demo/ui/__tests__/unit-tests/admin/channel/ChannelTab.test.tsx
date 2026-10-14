import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhatsappChannelDocument } from '@exyconn/shell/graphql/generated';
import { ChannelTab } from '../../../../src/admin/channel';
import type { WhatsappChannelRow } from '../../../../src/admin/channel/forms/whatsapp-number';
import { renderWithProviders } from '../../test-utils';
import { channelRow } from '../admin.fixtures';

const api = vi.hoisted(() => ({
  query: { data: undefined as unknown, error: undefined as unknown },
  queryOptions: null as unknown,
  removeOptions: null as unknown,
  refetch: vi.fn(),
  remove: vi.fn(),
  removing: false,
  warn: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWhatsappChannelQuery: (options: unknown) => {
    api.queryOptions = options;
    return { ...api.query, refetch: api.refetch };
  },
  useDeleteWhatsappChannelMutation: (options: unknown) => {
    api.removeOptions = options;
    return [api.remove, { loading: api.removing }];
  },
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { warn: api.warn, error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../../../src/admin/channel/forms/whatsapp-number', () => ({
  WhatsappNumberForm: ({ initial }: Readonly<{ initial: WhatsappChannelRow | null }>) => (
    <p>{`Number form for ${initial?.id ?? 'a new number'}`}</p>
  ),
}));

const WEBHOOK = 'https://api.example.com/whatsapp/webhook';
const withChannel = (channel: WhatsappChannelRow | null) => {
  api.query = { data: { whatsappChannel: { webhookUrl: WEBHOOK, channel } }, error: undefined };
};

beforeEach(() => {
  api.query = { data: undefined, error: undefined };
  api.removing = false;
  api.refetch.mockReset().mockResolvedValue({});
  api.remove.mockReset().mockResolvedValue({});
  api.warn.mockReset();
});

async function disconnect(confirmWith: 'Disconnect' | 'Cancel') {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Disconnect' }));
  const dialog = await screen.findByRole('dialog');
  const question = dialog.textContent;
  await user.click(within(dialog).getByRole('button', { name: confirmWith }));
  return question;
}

describe('ChannelTab', () => {
  it('holds placeholders while the settings load, always asking the network', () => {
    const { container } = renderWithProviders(<ChannelTab />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(api.queryOptions).toEqual({ fetchPolicy: 'cache-and-network' });
    expect(document.title).toContain('WhatsApp number');
  });

  it('reports a failed load', () => {
    api.query = { data: undefined, error: new Error('Offline') };
    renderWithProviders(<ChannelTab />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the WhatsApp number. Offline',
    );
  });

  it('offers to connect a first number', () => {
    withChannel(null);
    renderWithProviders(<ChannelTab />);
    expect(screen.getByRole('textbox', { name: 'Callback URL' })).toHaveValue(WEBHOOK);
    expect(screen.queryByRole('textbox', { name: 'Verify token' })).not.toBeInTheDocument();
    expect(screen.getByText('Number form for a new number')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument();
  });

  it('shows a connected number with its verify token and a way to disconnect it', () => {
    withChannel(channelRow());
    renderWithProviders(<ChannelTab />);
    expect(screen.getByRole('heading', { name: 'Number settings' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Verify token' })).toHaveValue('verify-token-123');
    expect(screen.getByText('Number form for ch-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeEnabled();
    expect(api.removeOptions).toEqual({ refetchQueries: [WhatsappChannelDocument] });
  });

  it('keeps the number when the disconnect is cancelled', async () => {
    withChannel(channelRow());
    renderWithProviders(<ChannelTab />);
    const question = await disconnect('Cancel');
    expect(question).toContain('Disconnect +1 555 010 0000?');
    expect(api.remove).not.toHaveBeenCalled();
  });

  it('disconnects the number after asking, naming it by its ID when it has no display number', async () => {
    withChannel(channelRow({ displayPhone: '' }));
    renderWithProviders(<ChannelTab />);
    const question = await disconnect('Disconnect');
    expect(question).toContain('Disconnect 1234567890?');
    expect(api.remove).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('WhatsApp number disconnected')).toBeInTheDocument();
  });

  it('logs and reports a failed disconnect', async () => {
    const failure = new Error('Token store unavailable');
    api.remove.mockRejectedValue(failure);
    withChannel(channelRow());
    renderWithProviders(<ChannelTab />);
    await disconnect('Disconnect');
    expect(await screen.findByText('Token store unavailable')).toBeInTheDocument();
    expect(api.warn).toHaveBeenCalledWith(
      'wa-demo: disconnecting the WhatsApp number failed',
      failure,
    );
  });

  it('falls back to a plain reason for a failure without a message', async () => {
    api.remove.mockRejectedValue('nope');
    withChannel(channelRow());
    renderWithProviders(<ChannelTab />);
    await disconnect('Disconnect');
    expect(await screen.findByText('Could not disconnect the WhatsApp number')).toBeInTheDocument();
  });

  it('disables Disconnect while it runs', () => {
    api.removing = true;
    withChannel(channelRow());
    renderWithProviders(<ChannelTab />);
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeDisabled();
  });
});
