import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhatsappChannelDocument } from '@exyconn/shell/graphql/generated';
import { WhatsappNumberForm } from '../../../../../../src/admin/channel/forms/whatsapp-number';
import { renderWithProviders } from '../../../../test-utils';
import { channelRow } from '../../../admin.fixtures';

const api = vi.hoisted(() => ({ save: vi.fn(), options: null as unknown, warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSaveWhatsappChannelMutation: (options: unknown) => {
    api.options = options;
    return [api.save];
  },
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { warn: api.warn, error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const credential = (length: number) => 'k'.repeat(length);
const KEEP = 'Leave blank to keep the current value';

beforeEach(() => {
  api.save.mockReset().mockResolvedValue({});
  api.warn.mockReset();
});

describe('WhatsappNumberForm — first connection', () => {
  it('explains each credential and starts with a fresh verify token, switched on', () => {
    renderWithProviders(<WhatsappNumberForm initial={null} />);
    expect(screen.getByText(/A permanent System User token/)).toBeInTheDocument();
    expect(screen.getByText(/Checks every delivery came from Meta/)).toBeInTheDocument();
    expect(screen.queryByText(KEEP)).not.toBeInTheDocument();
    const verify = screen.getByRole<HTMLInputElement>('textbox', { name: 'Verify token' });
    expect(verify.value).toMatch(/^[\da-f]{32}$/);
    expect(screen.getByRole('switch', { name: 'Answer messages on this number' })).toBeChecked();
    expect(api.options).toEqual({ refetchQueries: [WhatsappChannelDocument] });
  });

  it('says what is missing instead of saving', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WhatsappNumberForm initial={null} />);
    await user.click(screen.getByRole('button', { name: 'Connect number' }));
    expect(await screen.findByText('Phone number ID is required')).toBeInTheDocument();
    expect(screen.getByText('Access token is required')).toBeInTheDocument();
    expect(screen.getByText('App secret is required')).toBeInTheDocument();
    expect(api.save).not.toHaveBeenCalled();
  });

  it('connects the number, then clears the credentials it sent', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WhatsappNumberForm initial={null} />);
    await user.type(screen.getByRole('textbox', { name: 'Phone number ID' }), '1234567890');
    await user.type(screen.getByLabelText('Access token'), credential(24));
    await user.type(screen.getByLabelText('App secret'), credential(16));
    const verify = screen.getByRole('textbox', { name: 'Verify token' });
    await user.clear(verify);
    await user.type(verify, 'my-verify-token');
    await user.click(screen.getByRole('button', { name: 'Connect number' }));

    await waitFor(() => expect(api.save).toHaveBeenCalledTimes(1));
    expect(api.save).toHaveBeenCalledWith({
      variables: {
        input: {
          phoneNumberId: '1234567890',
          displayPhone: '',
          accessToken: credential(24),
          appSecret: credential(16),
          verifyToken: 'my-verify-token',
          enabled: true,
        },
      },
    });
    expect(await screen.findByText('WhatsApp number connected')).toBeInTheDocument();
    expect(screen.getByLabelText('Access token')).toHaveValue('');
    expect(screen.getByLabelText('App secret')).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Phone number ID' })).toHaveValue('1234567890');
  });
});

describe('WhatsappNumberForm — connected number', () => {
  it('saves changes while keeping the stored credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    expect(screen.getAllByText(KEEP)).toHaveLength(2);
    await user.click(screen.getByRole('switch', { name: 'Answer messages on this number' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(api.save).toHaveBeenCalledTimes(1));
    expect(api.save).toHaveBeenCalledWith({
      variables: {
        input: {
          phoneNumberId: '1234567890',
          displayPhone: '+1 555 010 0000',
          accessToken: '',
          appSecret: '',
          verifyToken: 'verify-token-123',
          enabled: false,
        },
      },
    });
    expect(await screen.findByText('WhatsApp number updated')).toBeInTheDocument();
  });

  it('logs and reports a failed save', async () => {
    const user = userEvent.setup();
    const failure = new Error('Meta rejected the token');
    api.save.mockRejectedValue(failure);
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Meta rejected the token')).toBeInTheDocument();
    expect(api.warn).toHaveBeenCalledWith('wa-demo: saving the WhatsApp number failed', failure);
  });

  it('falls back to a plain reason for a failure without a message', async () => {
    const user = userEvent.setup();
    api.save.mockRejectedValue({ code: 500 });
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Could not save the WhatsApp number')).toBeInTheDocument();
  });

  it('puts the stored values back on Cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    const display = screen.getByRole('textbox', { name: 'Phone number' });
    await user.clear(display);
    await user.type(display, '+44 20 7946 0000');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(display).toHaveValue('+1 555 010 0000');
  });
});
